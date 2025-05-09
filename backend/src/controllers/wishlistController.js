const User = require("../models/User");
const Product = require("../models/Product");
const asyncHandler = require("../middlewares/asyncHandler");
const mongoose = require("mongoose");

// @desc    Lấy danh sách yêu thích của người dùng
// @route   GET /api/v1/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Tìm user và populate các sản phẩm trong wishlist
  // Populate để lấy các thông tin cần thiết của sản phẩm hiển thị trong wishlist
  const user = await User.findById(userId)
    .populate({
      path: "wishlistItems",
      match: { isActive: true, isPublished: true },
      select: "name slug price images category averageRating numReviews",
      populate: { path: "category", select: "name slug" },
    })
    .select("wishlistItems")
    .lean();

  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy người dùng." });
  }

  const validWishlistItems = user.wishlistItems
    ? user.wishlistItems.filter((item) => item !== null)
    : [];

  res.status(200).json({ wishlistItems: validWishlistItems });
});

// @desc    Thêm sản phẩm vào danh sách yêu thích
// @route   POST /api/v1/wishlist/:productId
// @access  Private
const addToWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
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

  // 2. Thêm productId vào mảng wishlistItems của user
  // Sử dụng $addToSet để đảm bảo không thêm trùng lặp
  const updateUser = await User.findOneAndUpdate(
    { _id: userId },
    { $addToSet: { wishlistItems: productId } },
    { new: true, runValidators: true }
  ).select("wishlistItems");

  if (!updateUser) {
    res.status(404);
    throw new Error("Không tìm thấy người dùng.");
  }

  res.status(200).json({
    message: "Sản phẩm đã được thêm vào danh sách yêu thích.",
    wishlistItems: updateUser.wishlistItems,
  });
});

// @desc    Xóa sản phẩm khỏi danh sách yêu thích
// @route   DELETE /api/v1/wishlist/:productId
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("ID sản phẩm không hợp lệ.");
  }

  // Sử dụng $pull để xóa productId khỏi mảng wishlistItems
  const updateUser = await User.findOneAndUpdate(
    userId,
    { $pull: { wishlistItems: productId } },
    { new: true, runValidators: true  }
  ).select("wishlistItems");

  if (!updateUser) {
    res.status(404);
    throw new Error("Không tìm thấy người dùng.");
  }

  res.status(200).json({
    message: "Sản phẩm đã được xóa khỏi danh sách yêu thích.",
    wishlistItems: updateUser.wishlistItems,
  });
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
