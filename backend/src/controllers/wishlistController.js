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
  const identifier = req.wishlistIdentifier;

  if (!identifier || (!identifier.user && !identifier.guestId)) {
    console.log(
      "[Wishlist] getWishlist: No valid identifier (user/guest). Returning empty list."
    );
    return res.json([]);
  }

  const wishlist = await Wishlist.findOne(identifier).populate({
    path: "items.product",
    match: { isActive: true, isPublished: true },
    select:
      "name slug price salePrice salePriceEffectiveDate salePriceExpiryDate images category averageRating numReviews variants stockQuantity totalSold createdAt attributes",
    populate: { path: "category", select: "name slug" },
  });

  if (!wishlist || !wishlist.items || wishlist.items.length === 0) {
    return res.json([]);
  }

  const invalidItemIds = [];
  const processedWishlistItems = [];

  for (const item of wishlist.items) {
    // Kiểm tra xem item có hợp lệ không
    if (!item) {
      console.warn(`[Wishlist] getWishlist: Found null/undefined item`);
      continue;
    }

    // Kiểm tra xem product có được populate thành công không
    if (
      !item.product ||
      typeof item.product !== "object" ||
      Buffer.isBuffer(item.product)
    ) {
      console.warn(
        `[Wishlist] getWishlist: Item has invalid product reference. Item:`,
        {
          productId: item.product,
          variant: item.variant,
          hasBuffer: Buffer.isBuffer(item.product),
        }
      );

      // Thêm vào danh sách để clean up sau
      if (item.product) {
        invalidItemIds.push(item.product);
      }
      continue;
    }

    // Kiểm tra xem product có _id không (đảm bảo đây là object được populate)
    if (!item.product._id) {
      console.warn(
        `[Wishlist] getWishlist: Product object missing _id:`,
        item.product
      );
      continue;
    }

    const productData = item.product;
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
      wishlistedVariantId: item.variant,
      variantDetails: null,
    };

    // Xử lý variant nếu có
    if (
      item.variant &&
      productData.variants &&
      productData.variants.length > 0
    ) {
      const specificVariant = productData.variants.find(
        (v) =>
          v &&
          v._id &&
          item.variant &&
          v._id.toString() === item.variant.toString()
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

    processedWishlistItems.push(displayInfo);
  }

  // Clean up invalid items in background (không chờ kết quả)
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
