const express = require("express");
const {
  createCoupon,
  getCoupons,
  getCouponByCodeOrId,
  updateCoupon,
  deleteCoupon,
} = require("../controllers/couponController");
const { protect, isAdmin } = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");
const {
  createCouponSchema,
  updateCouponSchema,
} = require("../validations/validationSchemas");

const router = express.Router();

// POST /api/v1/coupons : Tạo coupon mới
router.post(
  "/",
  protect,
  isAdmin,
  validateRequest(createCouponSchema),
  createCoupon
);

// GET /api/v1/coupons : Lấy danh sách coupons
router.get("/", getCoupons);

// GET /api/v1/coupons/:idOrCode : Lấy chi tiết coupon
router.get("/:idOrCode", getCouponByCodeOrId);

// PUT /api/v1/coupons/:id : Cập nhật coupon
router.put(
  "/:id",
  protect,
  isAdmin,
  validateRequest(updateCouponSchema),
  updateCoupon
);

// DELETE /api/v1/coupons/:id : Vô hiệu hóa coupon (Soft Delete)
router.delete("/:id", protect, isAdmin, deleteCoupon);

module.exports = router;
