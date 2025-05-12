const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Tiêu đề thông báo là bắt buộc."],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Nội dung thông báo là bắt buộc."],
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "NEW_USER_REGISTERED",
        "NEW_ORDER_PLACED",
        "ORDER_STATUS_SHIPPED", // Admin giao hàng
        "ORDER_STATUS_DELIVERED", // User xác nhận (hoặc Admin cập nhật)
        "ORDER_CANCELLATION_REQUESTED",
        "ORDER_REFUND_REQUESTED",
        "ORDER_CANCELLATION_APPROVED", // Admin duyệt
        "ORDER_CANCELLATION_REJECTED", // Admin từ chối
        "ORDER_REFUND_APPROVED", // Admin duyệt
        "ORDER_REFUND_REJECTED", // Admin từ chối
        "PRODUCT_LOW_STOCK",
        "PRODUCT_OUT_OF_STOCK",
        "NEW_REVIEW_SUBMITTED",
        "REVIEW_APPROVED",
      ],
    },
    link: {
      type: String,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    recipientType: {
      // Loại người nhận
      type: String,
      enum: ["ADMIN", "CUSTOMER"], // Mở rộng cho user sau
      default: "ADMIN",
    },
    metadata: {
      // Lưu các ID liên quan để tạo link hoặc query
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Review" },
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientType: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
