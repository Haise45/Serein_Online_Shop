const express = require("express");
const {
  createReview,
  getProductReviews,
  getAllReviews,
  approveReview,
  rejectReview,
  deleteReview,
  addAdminReply,
} = require("../controllers/reviewController");
const { protect, isAdmin } = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");
const {
  reviewSchemaValidation,
  adminReplySchemaValidation,
} = require("../validations/validationSchemas");

const router = express.Router({ mergeParams: true });

// --- Public Route ---
// GET /api/v1/products/:productId/reviews - Lấy review của sản phẩm
router.get("/", getProductReviews);

// --- User Routes (Cần đăng nhập) ---
// POST /api/v1/products/:productId/reviews - User tạo review mới
router.post(
  "/",
  protect, // Yêu cầu đăng nhập
  validateRequest(reviewSchemaValidation),
  createReview
);
// (Tùy chọn thêm PUT/DELETE cho user sửa/xóa review CỦA HỌ)
// router.put('/:reviewId', protect, ...)
// router.delete('/:reviewId', protect, ...)

// --- Admin Routes (Cần quyền Admin) ---

const adminRouter = express.Router(); // Tạo router riêng cho admin actions

// GET /api/v1/reviews - Admin lấy tất cả reviews (có filter, sort, pagination)
adminRouter.get("/", protect, isAdmin, getAllReviews);

// PUT /api/v1/reviews/:reviewId/approve - Admin duyệt review
adminRouter.put("/:reviewId/approve", protect, isAdmin, approveReview);

// PUT /api/v1/reviews/:reviewId/reject - Admin từ chối/ẩn review
adminRouter.put("/:reviewId/reject", protect, isAdmin, rejectReview);

// DELETE /api/v1/reviews/:reviewId - Admin xóa hẳn review
adminRouter.delete("/:reviewId", protect, isAdmin, deleteReview);

// POST /api/v1/reviews/:reviewId/reply - Admin phản hồi review
adminRouter.post(
  "/:reviewId/reply",
  protect,
  isAdmin,
  validateRequest(adminReplySchemaValidation),
  addAdminReply
);

// Xuất cả hai router
module.exports = {
  productReviewRouter: router,
  adminReviewRouter: adminRouter,
};
