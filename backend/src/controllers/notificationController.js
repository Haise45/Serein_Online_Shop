const Notification = require("../models/Notification");
const Product = require("../models/Product");
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
    .populate("metadata.productId", "name slug attributes.attribute")
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const totalNotificationsQuery = Notification.countDocuments(filter);

  const [notifications, totalNotifications] = await Promise.all([
    notificationsQuery.exec(),
    totalNotificationsQuery.exec(),
  ]);

  // 1. Thu thập các ID sản phẩm có thông báo về biến thể
  const productIdsForVariantLookup = notifications
    .filter((n) => n.metadata?.variantId)
    .map((n) => n.metadata.productId._id);

  if (productIdsForVariantLookup.length > 0) {
    // 2. Lấy thông tin chi tiết của các sản phẩm và thuộc tính liên quan
    const productsWithVariants = await Product.find({
      _id: { $in: productIdsForVariantLookup },
    })
      .select("name variants attributes")
      .populate("attributes.attribute", "label values")
      .lean();

    // 3. Tạo một Map để tra cứu nhanh: "productId-variantId" -> "Tên biến thể"
    const variantDisplayNameMap = new Map();
    for (const product of productsWithVariants) {
      // Tạo map tra cứu thuộc tính cho sản phẩm này
      const attributeMap = new Map();
      product.attributes.forEach((attrWrapper) => {
        if (attrWrapper.attribute) {
          const valueMap = new Map(
            attrWrapper.attribute.values.map((val) => [
              val._id.toString(),
              val.value,
            ])
          );
          attributeMap.set(attrWrapper.attribute._id.toString(), {
            label: attrWrapper.attribute.label,
            values: valueMap,
          });
        }
      });

      // Tạo tên hiển thị cho từng biến thể của sản phẩm
      for (const variant of product.variants) {
        const variantDisplayName = variant.optionValues
          .map((opt) => {
            const attrInfo = attributeMap.get(opt.attribute.toString());
            const valueName = attrInfo?.values.get(opt.value.toString());
            return valueName || "?";
          })
          .join(" / ");

        const key = `${product._id.toString()}-${variant._id.toString()}`;
        variantDisplayNameMap.set(
          key,
          `${product.name} (${variantDisplayName})`
        );
      }
    }

    // 4. Lặp qua danh sách thông báo và cập nhật message
    notifications = notifications.map((notification) => {
      const { productId, variantId } = notification.metadata;
      if (productId && variantId) {
        const key = `${productId._id.toString()}-${variantId.toString()}`;
        const fullVariantName = variantDisplayNameMap.get(key);

        if (fullVariantName) {
          // Thay thế chuỗi ID khó hiểu bằng tên đã được dịch
          // Ví dụ, thay thế chuỗi "Tên sản phẩm (id1/id2)" bằng "Tên sản phẩm (Xanh / M)"
          // Regex này tìm chuỗi có dạng `(tên sản phẩm) (...)` và thay thế phần trong ngoặc
          const originalPattern = new RegExp(`${productId.name} \\(.*\\)`);
          notification.message = notification.message.replace(
            originalPattern,
            `"${fullVariantName}"`
          );
        }
      }
      return notification;
    });
  }

  const totalPages = Math.ceil(totalNotifications / limit);

  res.json({
    currentPage: page,
    totalPages,
    totalNotifications,
    limit,
    notifications,
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
