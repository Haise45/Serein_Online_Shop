const Notification = require("../models/Notification");
const asyncHandler = require("../middlewares/asyncHandler");
const mongoose = require("mongoose");

// @desc    Lấy danh sách thông báo cho Admin (phân trang, lọc)
// @route   GET /api/v1/notifications/admin
// @access  Private/Admin
const getAdminNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 15;
  const skip = (page - 1) * limit;

  const filter = { recipientType: "ADMIN" }; // Chỉ lấy thông báo cho admin
  if (req.query.isRead !== undefined) {
    filter.isRead = req.query.isRead === "true";
  }
  // Thêm filter theo type nếu cần: ?type=NEW_ORDER_PLACED

  const sort = { createdAt: -1 }; // Mới nhất trước

  const notificationsQuery = Notification.find(filter)
    // Populate metadata nếu cần để hiển thị thêm thông tin
    .populate("metadata.userId", "name email")
    .populate("metadata.orderId", "_id status totalPrice")
    .populate("metadata.productId", "name slug")
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const totalNotificationsQuery = Notification.countDocuments(filter);

  const [notifications, totalNotifications] = await Promise.all([
    notificationsQuery.exec(),
    totalNotificationsQuery.exec(),
  ]);

  const totalPages = Math.ceil(totalNotifications / limit);

  res.json({
    currentPage: page,
    totalPages: totalPages,
    totalNotifications: totalNotifications,
    limit: limit,
    notifications: notifications,
  });
});

// @desc    Admin đánh dấu một thông báo đã đọc
// @route   PUT /api/v1/notifications/admin/:id/mark-as-read
// @access  Private/Admin
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notificationId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    res.status(400);
    throw new Error("ID thông báo không hợp lệ.");
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipientType: "ADMIN" }, // Đảm bảo đúng của admin
    { isRead: true },
    { new: true } // Trả về document đã cập nhật
  ).lean();

  if (!notification) {
    res.status(404);
    throw new Error("Không tìm thấy thông báo.");
  }
  res.json(notification);
});

// @desc    Admin đánh dấu tất cả thông báo đã đọc
// @route   PUT /api/v1/notifications/admin/mark-all-as-read
// @access  Private/Admin
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipientType: "ADMIN", isRead: false }, // Chỉ cập nhật những cái chưa đọc
    { $set: { isRead: true } }
  );

  res.json({
    message: `Đã đánh dấu ${result.modifiedCount} thông báo là đã đọc.`,
  });
});

module.exports = {
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
