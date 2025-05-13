const Notification = require("../models/Notification");
const { emitToAdmins } = require("../socket");

/**
 * Tạo và phát thông báo cho Admin.
 * @param {string} title - Tiêu đề thông báo.
 * @param {string} message - Nội dung thông báo.
 * @param {string} type - Loại thông báo (từ enum trong Notification model).
 * @param {string} [link] - URL tương đối trên trang admin.
 * @param {object} [metadata] - Các ID liên quan (userId, orderId, productId, reviewId).
 */
const createAdminNotification = async (
  title,
  message,
  type,
  link = null,
  metadata = {}
) => {
  try {
    console.log(
      `[Notification Util] Creating notification: ${type} - ${title}`
    );
    const notification = await Notification.create({
      title,
      message,
      type,
      link,
      metadata,
      recipientType: "ADMIN", // Mặc định cho Admin
    });

    // Phát sự kiện đến các admin đang kết nối
    emitToAdmins(
      "new_admin_notification",
      notification.toObject({ virtuals: true })
    ); // Gửi object đã xử lý virtuals

    console.log(
      `[Notification Util] Notification created and emitted: ${notification._id}`
    );
    return notification;
  } catch (error) {
    console.error(
      "[Notification Util] Lỗi khi tạo thông báo cho Admin:",
      error
    );
  }
};

module.exports = { createAdminNotification };
