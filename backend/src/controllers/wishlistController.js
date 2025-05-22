const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const asyncHandler = require("../middlewares/asyncHandler");
const mongoose = require("mongoose");

// --- Hàm helper tìm hoặc tạo Wishlist ---
const findOrCreateWishlist = async (identifier) => {
  let wishlist;
  // Chỉ tìm/tạo nếu identifier có user hoặc guestId
  if ((identifier && identifier.user) || (identifier && identifier.guestId)) {
    wishlist = await Wishlist.findOne(identifier);
    if (!wishlist) {
      console.log(
        `[Wishlist] Creating new wishlist for: ${identifier.user ? `user ${identifier.user}` : `guest ${identifier.guestId}`}`,
      );
      wishlist = await Wishlist.create(identifier);
    }
  } else {
    // Nếu không có identifier hợp lệ, không thể tìm hoặc tạo wishlist cụ thể
    // Cần quyết định hành vi ở đây: trả lỗi, hay không làm gì.
    // Hiện tại, nếu không có identifier, các hàm sau sẽ không tìm thấy wishlist.
    console.warn(
      "[Wishlist] findOrCreateWishlist called without valid user or guestId in identifier.",
    );
    return null; // Hoặc throw new Error("Không thể xác định wishlist.");
  }
  return wishlist;
};

// @desc    Lấy danh sách yêu thích của người dùng/guest
// @route   GET /api/v1/wishlist
// @access  Public
const getWishlist = asyncHandler(async (req, res) => {
  const identifier = req.wishlistIdentifier;

  if (!identifier || (!identifier.user && !identifier.guestId)) {
    // Nếu không xác định được người dùng hoặc khách, trả về mảng rỗng
    // vì không có wishlist nào để lấy.
    console.log(
      "[Wishlist] getWishlist: No valid identifier (user/guest). Returning empty list.",
    );
    return res.json([]);
  }

  const wishlist = await Wishlist.findOne(identifier)
    .populate({
      path: "items.product",
      match: { isActive: true, isPublished: true },
      select:
      "name slug price salePrice salePriceEffectiveDate salePriceExpiryDate images category averageRating numReviews variants stockQuantity totalSold createdAt attributes",
      populate: { path: "category", select: "name slug" },
    })

  if (!wishlist || !wishlist.items || wishlist.items.length === 0) {
    return res.json([]);
  }

  const processedWishlistItems = wishlist.items
    .filter((item) => {
      // Lọc bỏ những item mà product không còn tồn tại hoặc không được populate
      if (!item || !item.product) {
        console.warn(
          `[Wishlist] getWishlist: Filtering out item due to missing product. Item:`,
          item,
        );
        return false;
      }
      return true;
    })
    .map((item) => {
      const productData = item.product; // productData giờ chắc chắn tồn tại
      let displayInfo = {
        _id: productData._id,
        name: productData.name,
        slug: productData.slug,
        images: productData.images,
        price: productData.price,
        salePrice: productData.salePrice,
        salePriceEffectiveDate: productData.salePriceEffectiveDate,
        salePriceExpiryDate: productData.salePriceExpiryDate,
        displayPrice: productData.displayPrice,
        isOnSale: productData.isOnSale,
        stockQuantity: productData.stockQuantity,
        averageRating: productData.averageRating,
        numReviews: productData.numReviews,
        category: productData.category,
        totalSold: productData.totalSold,
        isNew: productData.isNew,
        wishlistedVariantId: item.variant, // Có thể là null
        variantDetails: null,
      };

      if (
        item.variant && // Kiểm tra item.variant tồn tại trước khi dùng
        productData.variants &&
        productData.variants.length > 0
      ) {
        const specificVariant = productData.variants.find(
          (v) => v && v._id && item.variant && v._id.toString() === item.variant.toString(),
        );

        if (specificVariant) {
          displayInfo.images =
            specificVariant.images && specificVariant.images.length > 0
              ? specificVariant.images
              : productData.images;
          displayInfo.price = specificVariant.price;
          displayInfo.salePrice = specificVariant.salePrice;
          displayInfo.salePriceEffectiveDate =
            specificVariant.salePriceEffectiveDate;
          displayInfo.salePriceExpiryDate = specificVariant.salePriceExpiryDate;
          displayInfo.displayPrice = specificVariant.displayPrice;
          displayInfo.isOnSale = specificVariant.isOnSale;
          displayInfo.stockQuantity = specificVariant.stockQuantity;
          displayInfo.variantDetails = {
            _id: specificVariant._id,
            sku: specificVariant.sku,
            optionValues: specificVariant.optionValues,
            images: specificVariant.images,
            price: specificVariant.price,
            salePrice: specificVariant.salePrice,
            displayPrice: specificVariant.displayPrice,
            isOnSale: specificVariant.isOnSale,
            stockQuantity: specificVariant.stockQuantity,
          };
        }
      }
      return displayInfo;
    });

  res.json(processedWishlistItems);
});

// @desc    Thêm sản phẩm (và có thể cả variant) vào danh sách yêu thích
// @route   POST /api/v1/wishlist
// @access  Private (hoặc public nếu cho phép guest thêm)
const addToWishlist = asyncHandler(async (req, res) => {
  console.log(`[Wishlist Controller - addToWishlist] Method: ${req.method}, URL: ${req.originalUrl}`);
  const identifier = req.wishlistIdentifier;
  const { productId, variantId } = req.body;

  if (!identifier || (!identifier.user && !identifier.guestId)) {
    res.status(400);
    throw new Error(
      "Không thể xác định người dùng hoặc khách để thêm vào wishlist.",
    );
  }

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("ID sản phẩm không hợp lệ hoặc bị thiếu.");
  }

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
    isPublished: true,
  }).lean();

  if (!product) {
    res.status(404);
    throw new Error("Không tìm thấy sản phẩm hoặc sản phẩm không hoạt động.");
  }

  let variantObjectId = null;
  if (variantId) {
    if (!mongoose.Types.ObjectId.isValid(variantId)) {
      res.status(400);
      throw new Error("ID biến thể không hợp lệ.");
    }
    const variantExists =
      product.variants &&
      product.variants.some(
        (v) => v && v._id && v._id.toString() === variantId,
      );
    if (!variantExists) {
      res
        .status(404)
        .throw(new Error("Biến thể không thuộc sản phẩm này hoặc không tồn tại."));
    }
    variantObjectId = new mongoose.Types.ObjectId(variantId);
  }

  const wishlist = await findOrCreateWishlist(identifier);
  if (!wishlist) {
    // Trường hợp findOrCreateWishlist trả về null do identifier không hợp lệ
    res.status(500);
    throw new Error("Không thể truy cập hoặc tạo danh sách yêu thích.");
  }


  const itemAlreadyExists = wishlist.items.some((item) => {
    if (!item || !item.product) return false;
    const productMatch = item.product.toString() === productId;
    if (!productMatch) return false;

    const currentItemHasVariant = item.variant !== null && item.variant !== undefined;
    const newItemHasVariant = variantObjectId !== null && variantObjectId !== undefined;

    if (currentItemHasVariant && newItemHasVariant) {
      // Cả hai đều có variant, so sánh ID variant
      return item.variant && variantObjectId && item.variant.toString() === variantObjectId.toString();
    } else if (!currentItemHasVariant && !newItemHasVariant) {
      // Cả hai đều không có variant (thích sản phẩm chung)
      return true;
    }
    // Một có variant, một không -> không được coi là cùng một item
    return false;
  });

  if (itemAlreadyExists) {
    // Thay vì lỗi, trả về 200 và thông báo
    return res
      .status(200)
      .json({ message: "Sản phẩm đã có trong danh sách yêu thích." });
  }

  const newWishlistItem = {
    product: new mongoose.Types.ObjectId(productId),
    variant: variantObjectId,
    addedAt: new Date(),
  };

  await Wishlist.updateOne(
    { _id: wishlist._id },
    { $push: { items: newWishlistItem } },
  );

  res
    .status(200)
    .json({ message: "Sản phẩm đã được thêm vào danh sách yêu thích." });
});

// @desc    Xóa sản phẩm (và có thể cả variant) khỏi danh sách yêu thích
// @route   DELETE /api/v1/wishlist/remove (hoặc theo cách bạn định nghĩa route)
// @access  Private (hoặc public nếu cho phép guest xóa)
const removeFromWishlist = asyncHandler(async (req, res) => {
  const identifier = req.wishlistIdentifier;
  const { productId, variantId } = req.query; // Giả sử dùng query params

  if (!identifier || (!identifier.user && !identifier.guestId)) {
    res.status(400);
    throw new Error(
      "Không thể xác định người dùng hoặc khách để xóa khỏi wishlist.",
    );
  }

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("ID sản phẩm không hợp lệ hoặc bị thiếu.");
  }

  let variantObjectId = null; // Để là null nếu không có variantId
  if (variantId) {
    if (!mongoose.Types.ObjectId.isValid(variantId)) {
      res.status(400);
      throw new Error("ID biến thể không hợp lệ.");
    }
    variantObjectId = new mongoose.Types.ObjectId(variantId);
  }

  const wishlist = await Wishlist.findOne(identifier);
  if (!wishlist) {
    // Nếu không có wishlist, coi như sản phẩm không có để xóa
    return res
      .status(200)
      .json({ message: "Sản phẩm không có trong danh sách yêu thích." });
  }

  const pullCondition = { product: new mongoose.Types.ObjectId(productId) };
  // Nếu có variantId, thêm điều kiện variant vào pullCondition
  // Nếu không có variantId (variantObjectId là null), thì điều kiện pull sẽ chỉ dựa trên productId
  // và chỉ xóa những item có variant là null (tức là sản phẩm chung được thích)
  pullCondition.variant = variantObjectId; // variantObjectId sẽ là null nếu variantId không được cung cấp

  const updateResult = await Wishlist.updateOne(
    { _id: wishlist._id },
    { $pull: { items: pullCondition } },
  );

  if (updateResult.modifiedCount > 0) {
    res
      .status(200)
      .json({ message: "Sản phẩm đã được xóa khỏi danh sách yêu thích." });
  } else {
    res.status(200).json({
      message:
        "Không tìm thấy sản phẩm trong danh sách yêu thích với các tiêu chí đã cho.",
    });
  }
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};