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

// Tất cả các route này đều yêu cầu đăng nhập và quyền Admin
router.use(protect, isAdmin);

// POST /api/v1/coupons : Tạo coupon mới
router.post("/", validateRequest(createCouponSchema), createCoupon);

// GET /api/v1/coupons : Lấy danh sách coupons
router.get("/", getCoupons);

// GET /api/v1/coupons/:idOrCode : Lấy chi tiết coupon
router.get("/:idOrCode", getCouponByCodeOrId);

// PUT /api/v1/coupons/:id : Cập nhật coupon
router.put("/:id", validateRequest(updateCouponSchema), updateCoupon);

// DELETE /api/v1/coupons/:id : Vô hiệu hóa coupon (Soft Delete)
router.delete("/:id", deleteCoupon);

module.exports = router;
