const express = require("express");
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");

const router = express.Router();

// GET /api/v1/wishlist : Lấy danh sách yêu thích
router.get("/", getWishlist);

// POST /api/v1/wishlist/:productId : Thêm sản phẩm vào wishlist
router.post("/", addToWishlist);

// DELETE /api/v1/wishlist/:productId : Xóa sản phẩm khỏi wishlist
router.delete("/remove", removeFromWishlist);

module.exports = router;
