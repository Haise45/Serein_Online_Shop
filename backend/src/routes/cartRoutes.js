const express = require("express");
const {
  applyCoupon,
  removeCoupon,
  addItemToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cartController");
const validateRequest = require("../middlewares/validationMiddleware");
const {
  addToCartSchema,
  updateCartItemSchema,
} = require("../validations/validationSchemas");

const router = express.Router();

// --- Định nghĩa các routes ---

// GET /api/v1/cart : Lấy giỏ hàng hiện tại
router.get("/", getCart);

// POST /api/v1/cart/items : Thêm item vào giỏ
router.post("/items", validateRequest(addToCartSchema), addItemToCart);

// PUT /api/v1/cart/items/:itemId : Cập nhật số lượng item
router.put(
  "/items/:itemId",
  validateRequest(updateCartItemSchema),
  updateCartItem
);

// DELETE /api/v1/cart/items/:itemId : Xóa item khỏi giỏ
router.delete("/items/:itemId", removeCartItem);

// DELETE /api/v1/cart : Xóa toàn bộ giỏ hàng
router.delete("/", clearCart);

// --- Routes cho Coupon ---
// POST /api/v1/cart/apply-coupon
// Body: { "couponCode": "YOUR_CODE" }
router.post("/apply-coupon", applyCoupon);

// DELETE /api/v1/cart/remove-coupon
router.delete("/remove-coupon", removeCoupon);

module.exports = router;
