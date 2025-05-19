const express = require("express");
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");
const { protectOptional } = require("../middlewares/authMiddleware");
const identifyWishlistUser = require("../middlewares/identifyWishlistUser");

const router = express.Router();

// Áp dụng middleware protect cho tất cả các route trong file này
router.use(protectOptional, identifyWishlistUser);

// GET /api/v1/wishlist : Lấy danh sách yêu thích
router.get("/", getWishlist);

// POST /api/v1/wishlist/:productId : Thêm sản phẩm vào wishlist
router.post("/", addToWishlist);

// DELETE /api/v1/wishlist/:productId : Xóa sản phẩm khỏi wishlist
router.delete("/remove", removeFromWishlist);

module.exports = router;
