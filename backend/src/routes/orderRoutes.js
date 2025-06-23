const express = require("express");
const {
  createPayPalOrderController,
  capturePayPalOrderController,
  createOrder,
  getMyOrders,
  getGuestOrderByTrackingToken,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  markOrderAsDelivered,
  requestCancellation,
  requestRefund,
  restockOrderItems,
  approveCancellation,
  rejectCancellation,
  approveRefund,
  rejectRefund,
} = require("../controllers/orderController");
const {
  protect,
  isAdmin,
  protectOptional,
} = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");
const { createOrderSchema } = require("../validations/validationSchemas");

const router = express.Router();

// --- User Routes ---
// Đặt hàng mới
router.post(
  "/",
  protectOptional,
  validateRequest(createOrderSchema),
  createOrder
);

// Thanh toán Paypal
router.post(
  "/create-paypal-order",
  protectOptional,
  createPayPalOrderController
);
router.post(
  "/:id/capture-paypal",
  protectOptional,
  capturePayPalOrderController
);

// Lấy danh sách đơn hàng của tôi (yêu cầu đăng nhập)
router.get("/my", protect, getMyOrders); // Hỗ trợ query params: page, limit

// User xác nhận đã nhận hàng (yêu cầu đăng nhập)
router.put("/:id/deliver", protect, markOrderAsDelivered);

// Guest Order Tracking
router.get("/guest-track/:orderId/:token", getGuestOrderByTrackingToken);

// Lấy chi tiết đơn hàng (controller sẽ kiểm tra ownership hoặc admin)
router.get("/:id", protect, getOrderById);

// Yêu cầu hủy đơn hàng (yêu cầu đăng nhập)
router.put("/:id/request-cancellation", protect, requestCancellation);

// Yêu cầu hoàn tiền (yêu cầu đăng nhập)
router.put("/:id/request-refund", protect, requestRefund);

// --- Admin Routes ---
// Lấy tất cả đơn hàng (yêu cầu admin)
router.get("/", protect, isAdmin, getAllOrders); // Hỗ trợ query params: page, limit, status, userId, startDate, endDate, sortBy, sortOrder

// Cập nhật trạng thái đơn hàng (yêu cầu admin)
router.put("/:id/status", protect, isAdmin, updateOrderStatus);

// Tự kiểm soát số lượng tồn kho khi hàng bị hủy hoặc hoàn trả
router.post("/:id/restock", protect, isAdmin, restockOrderItems);

router.put("/:id/approve-cancellation", protect, isAdmin, approveCancellation);
router.put("/:id/reject-cancellation", protect, isAdmin, rejectCancellation);
router.put("/:id/approve-refund", protect, isAdmin, approveRefund);
router.put("/:id/reject-refund", protect, isAdmin, rejectRefund);

module.exports = router;
