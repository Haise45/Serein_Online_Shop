const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const asyncHandler = require("../middlewares/asyncHandler");
const mongoose = require("mongoose");

// --- Helper: "Làm phẳng" i18n ---
const flattenI18nObject = (obj, locale, fields) => {
  if (!obj) return obj;
  const newObj = { ...obj }; // Tạo bản sao để không thay đổi object gốc
  for (const field of fields) {
    if (
      newObj[field] &&
      typeof newObj[field] === "object" &&
      newObj[field][locale] !== undefined
    ) {
      newObj[field] = newObj[field][locale] || newObj[field].vi;
    }
  }
  return newObj;
};

// --- Hàm helper tìm hoặc tạo Wishlist ---
const findOrCreateWishlist = async (identifier) => {
  let wishlist;
  // Chỉ tìm/tạo nếu identifier có user hoặc guestId
  if ((identifier && identifier.user) || (identifier && identifier.guestId)) {
    wishlist = await Wishlist.findOne(identifier);
    if (!wishlist) {
      console.log(
        `[Wishlist] Creating new wishlist for: ${
          identifier.user
            ? `user ${identifier.user}`
            : `guest ${identifier.guestId}`
        }`
      );
      wishlist = await Wishlist.create(identifier);
    }
  } else {
    console.warn(
      "[Wishlist] findOrCreateWishlist called without valid user or guestId in identifier."
    );
    return null;
  }
  return wishlist;
};

// --- Hàm helper để clean up wishlist items không hợp lệ ---
const cleanupInvalidWishlistItems = async (wishlistId, invalidItemIds) => {
  if (!invalidItemIds || invalidItemIds.length === 0) return;

  try {
    const result = await Wishlist.updateOne(
      { _id: wishlistId },
      { $pull: { items: { product: { $in: invalidItemIds } } } }
    );
    console.log(
      `[Wishlist] Cleaned up ${invalidItemIds.length} invalid items from wishlist ${wishlistId}`,
      result
    );
  } catch (error) {
    console.error(`[Wishlist] Error cleaning up invalid items:`, error);
  }
};

// @desc    Lấy danh sách yêu thích của người dùng/guest
// @route   GET /api/v1/wishlist
// @access  Public
const getWishlist = asyncHandler(async (req, res) => {
  const locale = req.locale || "vi"; // Lấy locale từ middleware
  const identifier = req.wishlistIdentifier;

  if (!identifier || (!identifier.user && !identifier.guestId)) {
    return res.json([]);
  }

  // Lấy document đầy đủ, không dùng lean() để có thể tính virtuals
  const wishlist = await Wishlist.findOne(identifier).populate({
    path: "items.product",
    match: { isActive: true, isPublished: true },
    // Không cần select nữa, lấy cả object để xử lý
    populate: { path: "category", select: "name slug" }, // Vẫn populate category
  });

  if (!wishlist || !wishlist.items || wishlist.items.length === 0) {
    return res.json([]);
  }

  const invalidItemIds = [];
  const processedWishlistItems = [];

  for (const item of wishlist.items) {
    if (!item?.product) {
      if (item.product) invalidItemIds.push(item.product);
      continue;
    }

    // 1. Chuyển Mongoose doc thành object thuần túy VÀ lấy trường ảo
    const productData = item.product.toObject({ virtuals: true });

    // 2. "Làm phẳng" dữ liệu đa ngôn ngữ
    const flatProduct = flattenI18nObject(productData, locale, [
      "name",
      "description",
    ]);
    if (flatProduct.category) {
      flatProduct.category = flattenI18nObject(flatProduct.category, locale, [
        "name",
      ]);
    }

    let displayInfo = {
      _id: flatProduct._id,
      name: flatProduct.name, // Tên đã được dịch
      slug: flatProduct.slug,
      images: flatProduct.images,
      price: flatProduct.price,
      displayPrice: flatProduct.displayPrice, // Virtual field
      isOnSale: flatProduct.isOnSale, // Virtual field
      stockQuantity: flatProduct.stockQuantity,
      averageRating: flatProduct.averageRating,
      numReviews: flatProduct.numReviews,
      category: flatProduct.category,
      totalSold: flatProduct.totalSold,
      isNew: flatProduct.isConsideredNew, // Sửa tên virtual field
      wishlistedVariantId: item.variant,
      variantDetails: null,
    };

    // 3. Xử lý thông tin biến thể nếu có
    if (
      item.variant &&
      flatProduct.variants &&
      flatProduct.variants.length > 0
    ) {
      const specificVariant = flatProduct.variants.find(
        (v) => v?._id && v._id.toString() === item.variant.toString()
      );

      if (specificVariant) {
        // Ghi đè thông tin sản phẩm chính bằng thông tin của biến thể
        displayInfo.images =
          specificVariant.images && specificVariant.images.length > 0
            ? specificVariant.images
            : flatProduct.images;
        displayInfo.price = specificVariant.price;
        displayInfo.displayPrice = specificVariant.displayPrice;
        displayInfo.isOnSale = specificVariant.isOnSale;
        displayInfo.stockQuantity = specificVariant.stockQuantity;
        // Không cần làm phẳng optionValues ở đây vì getProductByIdOrSlug đã làm
        // Nếu muốn an toàn, cần populate và làm phẳng cả attributes
        displayInfo.variantDetails = {
          _id: specificVariant._id,
          sku: specificVariant.sku,
          optionValues: specificVariant.optionValues,
          // ... các trường khác của variant đã được ghi đè ở trên
        };
      }
    }

    processedWishlistItems.push(displayInfo);
  }

  if (invalidItemIds.length > 0) {
    cleanupInvalidWishlistItems(wishlist._id, invalidItemIds).catch(
      console.error
    );
  }

  res.json(processedWishlistItems);
});

// @desc    Thêm sản phẩm (và có thể cả variant) vào danh sách yêu thích
// @route   POST /api/v1/wishlist
// @access  Private (hoặc public nếu cho phép guest thêm)
const addToWishlist = asyncHandler(async (req, res) => {
  console.log(
    `[Wishlist Controller - addToWishlist] Method: ${req.method}, URL: ${req.originalUrl}`
  );
  const identifier = req.wishlistIdentifier;
  const { productId, variantId } = req.body;

  if (!identifier || (!identifier.user && !identifier.guestId)) {
    res.status(400);
    throw new Error(
      "Không thể xác định người dùng hoặc khách để thêm vào wishlist."
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
        (v) => v && v._id && v._id.toString() === variantId
      );
    if (!variantExists) {
      res.status(404);
      throw new Error("Biến thể không thuộc sản phẩm này hoặc không tồn tại.");
    }
    variantObjectId = new mongoose.Types.ObjectId(variantId);
  }

  const wishlist = await findOrCreateWishlist(identifier);
  if (!wishlist) {
    res.status(500);
    throw new Error("Không thể truy cập hoặc tạo danh sách yêu thích.");
  }

  const itemAlreadyExists = wishlist.items.some((item) => {
    if (!item || !item.product) return false;
    const productMatch = item.product.toString() === productId;
    if (!productMatch) return false;

    const currentItemHasVariant =
      item.variant !== null && item.variant !== undefined;
    const newItemHasVariant =
      variantObjectId !== null && variantObjectId !== undefined;

    if (currentItemHasVariant && newItemHasVariant) {
      return (
        item.variant &&
        variantObjectId &&
        item.variant.toString() === variantObjectId.toString()
      );
    } else if (!currentItemHasVariant && !newItemHasVariant) {
      return true;
    }
    return false;
  });

  if (itemAlreadyExists) {
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
    { $push: { items: newWishlistItem } }
  );

  res
    .status(200)
    .json({ message: "Sản phẩm đã được thêm vào danh sách yêu thích." });
});

// @desc    Xóa sản phẩm (và có thể cả variant) khỏi danh sách yêu thích
// @route   DELETE /api/v1/wishlist/remove
// @access  Private (hoặc public nếu cho phép guest xóa)
const removeFromWishlist = asyncHandler(async (req, res) => {
  const identifier = req.wishlistIdentifier;
  const { productId, variantId } = req.query;

  if (!identifier || (!identifier.user && !identifier.guestId)) {
    res.status(400);
    throw new Error(
      "Không thể xác định người dùng hoặc khách để xóa khỏi wishlist."
    );
  }

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("ID sản phẩm không hợp lệ hoặc bị thiếu.");
  }

  let variantObjectId = null;
  if (variantId) {
    if (!mongoose.Types.ObjectId.isValid(variantId)) {
      res.status(400);
      throw new Error("ID biến thể không hợp lệ.");
    }
    variantObjectId = new mongoose.Types.ObjectId(variantId);
  }

  const wishlist = await Wishlist.findOne(identifier);
  if (!wishlist) {
    return res
      .status(200)
      .json({ message: "Sản phẩm không có trong danh sách yêu thích." });
  }

  const pullCondition = { product: new mongoose.Types.ObjectId(productId) };
  pullCondition.variant = variantObjectId;

  const updateResult = await Wishlist.updateOne(
    { _id: wishlist._id },
    { $pull: { items: pullCondition } }
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
