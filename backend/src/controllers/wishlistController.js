const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const asyncHandler = require("../middlewares/asyncHandler");
const mongoose = require("mongoose");

// --- Hàm helper tìm hoặc tạo Wishlist ---
const findOrCreateWishlist = async (identifier) => {
  let wishlist = await Wishlist.findOne(identifier);
  if (!wishlist) {
    console.log("[Wishlist] Creating new wishlist for:", identifier);
    wishlist = await Wishlist.create(identifier);
  }
  return wishlist;
};

// @desc    Lấy danh sách yêu thích của người dùng/guest
// @route   GET /api/v1/wishlist
// @access  Public (xác định user/guest qua middleware)
const getWishlist = asyncHandler(async (req, res) => {
  const identifier = req.wishlistIdentifier;

  const wishlist = await Wishlist.findOne(identifier)
    .populate({
      path: "items", // Populate các product ID trong mảng items
      match: { isActive: true, isPublished: true },
      select: "name slug price images category averageRating numReviews",
      populate: { path: "category", select: "name slug" },
    })
    .lean();

  if (!wishlist || !wishlist.items) {
    return res.json([]); // Trả về mảng rỗng nếu không có wishlist hoặc không có item
  }

  // Lọc bỏ các items là null (do sản phẩm không còn active/published sau populate)
  const validWishlistItems = wishlist.items.filter((item) => item !== null);

  res.json(validWishlistItems);
});

// @desc    Thêm sản phẩm vào danh sách yêu thích
// @route   POST /api/v1/wishlist/:productId
// @access  Private
const addToWishlist = asyncHandler(async (req, res) => {
  const identifier = req.wishlistIdentifier;
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("ID sản phẩm không hợp lệ.");
  }

  // 1. Kiểm tra sản phẩm có tồn tại và đang hoạt động không
  const product = await Product.findOne({
    _id: productId,
    isActive: true,
    isPublished: true,
  }).lean();
  if (!product) {
    res.status(404);
    throw new Error("Không tìm thấy sản phẩm.");
  }

  // 2. Tìm hoặc tạo wishlist
  const wishlist = await findOrCreateWishlist(identifier);

  // Thêm productId vào mảng items (dùng $addToSet để không trùng)
  await Wishlist.updateOne(
    { _id: wishlist._id },
    { $addToSet: { items: new mongoose.Types.ObjectId(productId) } }
  );

  res
    .status(200)
    .json({ message: "Sản phẩm đã được thêm vào danh sách yêu thích." });
});

// @desc    Xóa sản phẩm khỏi danh sách yêu thích
// @route   DELETE /api/v1/wishlist/:productId
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res) => {
  const identifier = req.wishlistIdentifier;
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("ID sản phẩm không hợp lệ.");
  }

  // Tìm wishlist
  const wishlist = await Wishlist.findOne(identifier);
  if (!wishlist) {
    // Nếu không có wishlist, coi như đã xóa thành công
    return res
      .status(200)
      .json({ message: "Sản phẩm không có trong danh sách yêu thích." });
  }
  // Xóa productId khỏi mảng items
  await Wishlist.updateOne(
    { _id: wishlist._id },
    { $pull: { items: new mongoose.Types.ObjectId(productId) } }
  );

  res
    .status(200)
    .json({ message: "Sản phẩm đã được xóa khỏi danh sách yêu thích." });
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
