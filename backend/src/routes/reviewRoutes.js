const express = require("express");
const {
  // User actions
  createReview,
  updateUserReview,
  deleteMyReview,
  getMyReviewForProduct,
  getProductReviews,
  // Admin actions
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
  updateReviewSchemaValidation,
  adminReplySchemaValidation,
} = require("../validations/validationSchemas");

const router = express.Router({ mergeParams: true });

// --- Router cho các actions liên quan đến review của một sản phẩm cụ thể ---
// Thường được mount với /api/v1/products/:productId/reviews
const productReviewRouter = express.Router({ mergeParams: true });

// GET /api/v1/products/:productId/reviews - Lấy review của sản phẩm
productReviewRouter.get("/", getProductReviews);

// POST /api/v1/products/:productId/reviews - User tạo review mới
productReviewRouter.post(
  "/",
  protect,
  validateRequest(reviewSchemaValidation),
  createReview
);

// --- Router cho các actions chung về review (cần ID review hoặc query params) ---
// Thường được mount với /api/v1/reviews
const generalReviewRouter = express.Router();

// GET /api/v1/reviews/my-review?productId=<productId> - User lấy review của mình cho sản phẩm
generalReviewRouter.get("/my-review", protect, getMyReviewForProduct);

// PUT /api/v1/reviews/:reviewId - User sửa review của mình
generalReviewRouter.put(
  "/:reviewId",
  protect,
  validateRequest(updateReviewSchemaValidation),
  updateUserReview
);

// DELETE /api/v1/reviews/:reviewId/my - User xóa review của mình
generalReviewRouter.delete("/:reviewId/my", protect, deleteMyReview);

// --- Admin Routes (Cần quyền Admin) ---
// GET /api/v1/reviews - Admin lấy tất cả reviews
generalReviewRouter.get("/", protect, isAdmin, getAllReviews);

// PUT /api/v1/reviews/:reviewId/approve - Admin duyệt review
generalReviewRouter.put("/:reviewId/approve", protect, isAdmin, approveReview);

// PUT /api/v1/reviews/:reviewId/reject - Admin từ chối/ẩn review
generalReviewRouter.put("/:reviewId/reject", protect, isAdmin, rejectReview);

// DELETE /api/v1/reviews/:reviewId - Admin xóa hẳn review
generalReviewRouter.delete("/:reviewId", protect, isAdmin, deleteReview);

// POST /api/v1/reviews/:reviewId/reply - Admin phản hồi review
generalReviewRouter.post(
  "/:reviewId/reply",
  protect,
  isAdmin,
  validateRequest(adminReplySchemaValidation),
  addAdminReply
);

module.exports = {
  productReviewRouter: productReviewRouter,
  reviewRouter: generalReviewRouter,
};
