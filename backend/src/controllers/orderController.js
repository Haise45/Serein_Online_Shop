const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const asyncHandler = require("../middlewares/asyncHandler");
const mongoose = require("mongoose");
const sendEmail = require("../utils/sendEmail");
const { populateAndCalculateCart } = require("../controllers/cartController");
const orderConfirmationTemplate = require("../utils/emailTemplates/orderConfirmationTemplate");
const orderShippedTemplate = require("../utils/emailTemplates/orderShippedTemplate");
const orderDeliveredTemplate = require("../utils/emailTemplates/orderDeliveredTemplate");
const requestAdminNotificationTemplate = require("../utils/emailTemplates/requestAdminNotificationTemplate");
const requestStatusUpdateTemplate = require("../utils/emailTemplates/requestStatusUpdateTemplate");
const { createAdminNotification } = require("../utils/notificationUtils");

require("dotenv").config();

// --- HELPER FUNCTIONS FOR ORDER CREATION ---

/**
 * Lấy và xác thực thông tin giỏ hàng dựa trên các item được chọn.
 * Tái sử dụng logic từ cartController.
 * @param {object} cartIdentifier - { userId } hoặc { guestId }
 * @param {Array<ObjectId>} selectedCartItemIds - Mảng ID của các item được chọn trong giỏ hàng.
 * @param {mongoose.Session} session - Transaction session.
 * @returns {Promise<object>} - Dữ liệu giỏ hàng đã được populate và tính toán.
 */
const getAndValidateCartForOrder = async (
  cartIdentifier,
  selectedCartItemIds,
  session
) => {
  const originalCart = await Cart.findOne(cartIdentifier).session(session);
  if (!originalCart || originalCart.items.length === 0) {
    throw new Error("Giỏ hàng của bạn đang trống hoặc không tồn tại.");
  }

  // Lọc ra các items được chọn từ giỏ hàng gốc
  const itemsToProcess = originalCart.items.filter((item) =>
    selectedCartItemIds.some((selectedId) => selectedId.equals(item._id))
  );

  if (itemsToProcess.length !== selectedCartItemIds.length) {
    throw new Error(
      "Một số sản phẩm bạn chọn không còn tồn tại trong giỏ hàng. Vui lòng làm mới trang."
    );
  }

  // Tạo một instance Cart tạm thời để tính toán, KHÔNG LƯU vào DB
  const cartForCalculation = new Cart({
    items: itemsToProcess,
    appliedCoupon: originalCart.appliedCoupon,
  });

  // Sử dụng hàm từ cartController để tính toán lại giá, coupon...
  const calculatedData = await populateAndCalculateCart(cartForCalculation);

  if (
    !calculatedData ||
    !calculatedData.items ||
    calculatedData.items.length === 0
  ) {
    throw new Error("Không thể xử lý các sản phẩm đã chọn trong giỏ hàng.");
  }
  return { calculatedData, originalCartId: originalCart._id };
};

/**
 * Kiểm tra lại tồn kho lần cuối trước khi tạo đơn hàng.
 * @param {Array} orderItems - Mảng các item đã được tính toán.
 * @param {mongoose.Session} session - Transaction session.
 */
const revalidateStock = async (orderItems, session) => {
  const productIds = orderItems.map((item) => item.productId);
  const productsInDB = await Product.find({ _id: { $in: productIds } })
    .select("name sku variants stockQuantity")
    .session(session);

  const productMap = new Map(productsInDB.map((p) => [p._id.toString(), p]));

  for (const item of orderItems) {
    const product = productMap.get(item.productId.toString());
    if (!product) {
      throw new Error(`Sản phẩm "${item.name}" không còn tồn tại.`);
    }

    let availableStock = 0;
    if (item.variantId) {
      const variant = product.variants.id(item.variantId);
      availableStock = variant ? variant.stockQuantity : 0;
    } else {
      availableStock = product.stockQuantity;
    }

    if (item.quantity > availableStock) {
      throw new Error(
        `Sản phẩm "${item.name}" (SKU: ${
          item.sku || "N/A"
        }) không đủ tồn kho (Còn ${availableStock}, cần ${item.quantity}).`
      );
    }
  }
};

/**
 * Cập nhật tồn kho, totalSold và lượt sử dụng coupon.
 * @param {Array} orderItems - Mảng các item trong đơn hàng đã tạo.
 * @param {string} appliedCouponCode - Mã coupon đã áp dụng.
 * @param {mongoose.Session} session - Transaction session.
 */
const updateStockAndCoupon = async (orderItems, appliedCouponCode, session) => {
  const bulkOps = [];

  for (const item of orderItems) {
    const changeAmount = item.quantity;
    const filter = item.variant?.variantId
      ? { _id: item.product, "variants._id": item.variant.variantId }
      : { _id: item.product };

    const update = item.variant?.variantId
      ? {
          $inc: {
            "variants.$.stockQuantity": -changeAmount,
            totalSold: +changeAmount,
          },
        }
      : { $inc: { stockQuantity: -changeAmount, totalSold: +changeAmount } };

    bulkOps.push({ updateOne: { filter, update } });
  }

  // Thực thi cập nhật sản phẩm (stock & totalSold)
  if (bulkOps.length > 0) {
    await Product.bulkWrite(bulkOps, { session });
  }

  // Cập nhật coupon usage
  if (appliedCouponCode) {
    await Coupon.updateOne(
      { code: appliedCouponCode },
      { $inc: { usageCount: 1 } }
    ).session(session);
  }
};

/**
 * Dọn dẹp giỏ hàng sau khi đặt hàng thành công.
 * @param {ObjectId} cartId - ID của giỏ hàng gốc.
 * @param {Array<ObjectId>} processedItemIds - Mảng ID của các item đã được xử lý.
 * @param {mongoose.Session} session - Transaction session.
 */
const cleanupCart = async (cartId, processedItemIds, session) => {
  await Cart.updateOne(
    { _id: cartId },
    { $pull: { items: { _id: { $in: processedItemIds } } } },
    { session }
  );

  // Kiểm tra nếu giỏ hàng rỗng, xóa coupon
  const cartAfterUpdate = await Cart.findById(cartId).session(session).lean();
  if (
    cartAfterUpdate &&
    cartAfterUpdate.items.length === 0 &&
    cartAfterUpdate.appliedCoupon
  ) {
    await Cart.updateOne(
      { _id: cartId },
      { $set: { appliedCoupon: null } },
      { session }
    );
  }
};

// @desc    Tạo đơn hàng mới
// @route   POST /api/v1/orders
// @access  Public (User or Guest)
const createOrder = asyncHandler(async (req, res) => {
  const {
    shippingAddress,
    paymentMethod,
    shippingMethod,
    notes,
    email: guestEmailFromBody,
    selectedCartItemIds: selectedIds,
  } = req.body;

  // --- 1. Validate Input ---
  if (!selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0) {
    res.status(400);
    throw new Error("Vui lòng chọn ít nhất một sản phẩm để đặt hàng.");
  }
  const selectedCartItemIds = selectedIds.map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  // --- 2. Xác định Identifier ---
  const loggedInUser = req.user;
  const cartGuestId = req.cookies.cartGuestId;
  let cartIdentifier;
  if (loggedInUser) cartIdentifier = { userId: loggedInUser._id };
  else if (cartGuestId) cartIdentifier = { guestId: cartGuestId };
  else throw new Error("Không tìm thấy thông tin giỏ hàng.");

  // --- 3. Bắt đầu Transaction ---
  const session = await mongoose.startSession();
  session.startTransaction();

  let createdOrder;
  try {
    // --- 4. Lấy và xác thực giỏ hàng ---
    const { calculatedData, originalCartId } = await getAndValidateCartForOrder(
      cartIdentifier,
      selectedCartItemIds,
      session
    );

    // --- 5. Kiểm tra lại tồn kho lần cuối ---
    await revalidateStock(calculatedData.items, session);

    // --- 6. Chuẩn bị dữ liệu cho đơn hàng (Snapshot) ---
    const orderItems = calculatedData.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
      product: item.productId,
      variant: item.variantId
        ? {
            variantId: item.variantId,
            sku: item.sku,
            options: item.variantInfo.options.map((opt) => ({
              attributeName: opt.attributeName,
              value: opt.valueName,
            })),
          }
        : null,
    }));

    // --- 7. Tạo đối tượng Order ---
    const initialStatus = ["BANK_TRANSFER", "PAYPAL"].includes(paymentMethod)
      ? "Processing"
      : "Pending";
    const isPaid = initialStatus === "Processing";

    const orderData = {
      user: loggedInUser?._id || null,
      guestOrderEmail: !loggedInUser
        ? guestEmailFromBody.toLowerCase().trim()
        : null,
      guestSessionId: !loggedInUser ? cartGuestId : null,
      orderItems,
      shippingAddress,
      paymentMethod,
      shippingMethod,
      notes,
      itemsPrice: calculatedData.subtotal,
      shippingPrice: 0, // Tính toán sau nếu cần
      taxPrice: 0,
      discountAmount: calculatedData.discountAmount,
      totalPrice: calculatedData.finalTotal,
      appliedCouponCode: calculatedData.appliedCoupon?.code || null,
      status: initialStatus,
      isPaid,
      paidAt: isPaid ? new Date() : null,
    };

    const order = new Order(orderData);

    // Tạo tracking token nếu là guest
    if (!loggedInUser) {
      order.createGuestOrderTrackingToken();
    }

    // --- 8. Lưu đơn hàng ---
    createdOrder = await order.save({ session });

    // --- 9. Cập nhật Stock và Coupon ---
    await updateStockAndCoupon(
      createdOrder.orderItems,
      createdOrder.appliedCouponCode,
      session
    );

    // --- 10. Dọn dẹp giỏ hàng ---
    await cleanupCart(originalCartId, selectedCartItemIds, session);

    // --- 11. Commit Transaction ---
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    console.error("[Order Creation Error]", error.message);
    throw new Error(error.message || "Tạo đơn hàng thất bại.");
  } finally {
    await session.endSession();
  }

  // --- 12. Gửi thông báo (Email, Admin Notification) ---
  if (createdOrder) {
    try {
      const orderForEmail = await Order.findById(createdOrder._id)
        .populate("user", "name email") // Lấy cả name và email
        .lean();
      if (orderForEmail) {
        let customerEmail;
        let customerName;

        if (orderForEmail.user) {
          // Nếu là đơn hàng của user đã đăng nhập
          customerEmail = orderForEmail.user.email;
          customerName = orderForEmail.user.name;
        } else {
          // Nếu là đơn hàng của guest
          customerEmail = orderForEmail.guestOrderEmail;
          customerName = orderForEmail.shippingAddress.fullName;
        }

        // Kiểm tra lần cuối trước khi gửi để đảm bảo có người nhận
        if (customerEmail) {
          let guestTrackingUrl = null;
          if (!orderForEmail.user && orderForEmail.guestOrderTrackingToken) {
            guestTrackingUrl = `${process.env.FRONTEND_URL}/track-order/${orderForEmail._id}/${orderForEmail.guestOrderTrackingToken}`;
          }

          const emailHtml = orderConfirmationTemplate(
            customerName,
            orderForEmail,
            guestTrackingUrl
          );

          await sendEmail({
            email: customerEmail,
            subject: `Xác nhận đơn hàng #${orderForEmail._id
              .toString()
              .slice(-6)} tại ${process.env.SHOP_NAME || "Shop"}`,
            html: emailHtml,
          });

          // Gửi thông báo cho Admin (logic này có vẻ đã đúng)
          await createAdminNotification(
            `Đơn hàng mới #${createdOrder._id.toString().slice(-6)}`,
            `Đơn hàng bởi "${customerName}" vừa được đặt với tổng tiền ${createdOrder.totalPrice.toLocaleString(
              "vi-VN"
            )}đ.`,
            "NEW_ORDER_PLACED",
            `/admin/orders/${createdOrder._id}`,
            { orderId: createdOrder._id, userId: createdOrder.user }
          );
        } else {
          console.error(
            `[Email Send Error] Không thể xác định email người nhận cho đơn hàng ${createdOrder._id}.`
          );
        }
      }
    } catch (notificationError) {
      console.error(
        `Lỗi gửi thông báo cho đơn hàng ${createdOrder._id}:`,
        notificationError
      );
    }

    res.status(201).json(createdOrder.toObject());
  } else {
    // Trường hợp hiếm gặp
    res.status(500).json({
      message: "Tạo đơn hàng thành công nhưng có lỗi khi lấy lại thông tin.",
    });
  }
});

// @desc    Lấy danh sách đơn hàng của người dùng hiện tại (Phân trang)
// @route   GET /api/v1/orders/my
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const status = req.query.status;
  const skip = (page - 1) * limit;

  const filter = { user: userId };

  // Thêm điều kiện lọc theo status nếu được cung cấp
  if (status) {
    const validOrderStatuses = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
      "Refunded",
      "CancellationRequested",
      "RefundRequested",
    ];
    if (validOrderStatuses.includes(status)) {
      filter.status = status;
    } else {
      // Nếu status không hợp lệ, có thể bỏ qua hoặc trả lỗi
      console.warn(`[getMyOrders] Trạng thái lọc không hợp lệ: ${status}`);
    }
  }

  const sort = { createdAt: -1 };

  const ordersQuery = Order.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select("_id status totalPrice createdAt orderItems.name orderItems.image")
    .lean();

  const totalOrdersQuery = Order.countDocuments(filter);

  const [orders, totalOrders] = await Promise.all([
    ordersQuery.exec(),
    totalOrdersQuery.exec(),
  ]);

  const totalPages = Math.ceil(totalOrders / limit);

  res.status(200).json({
    currentPage: page,
    totalPages: totalPages,
    totalOrders: totalOrders,
    limit: limit,
    orders: orders,
  });
});

// @desc    Guest lấy chi tiết đơn hàng bằng tracking token
// @route   GET /api/v1/orders/guest-track/:orderId/:token
// @access  Public
const getGuestOrderByTrackingToken = asyncHandler(async (req, res) => {
  const { orderId, token } = req.params;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400);
    throw new Error("Mã đơn hàng không hợp lệ.");
  }
  if (!token || token.length < 30) {
    // Kiểm tra token có vẻ hợp lệ
    res.status(400);
    throw new Error("Token theo dõi không hợp lệ.");
  }

  const order = await Order.findOne({
    _id: orderId,
    guestOrderTrackingToken: token,
    guestOrderTrackingTokenExpires: { $gt: Date.now() }, // Token còn hạn
    user: null, // Đảm bảo đây là đơn hàng guest chưa được liên kết
  }).populate("user", "name email phone"); // Populate vẫn có thể dùng, user sẽ là null

  if (!order) {
    res.status(404);
    throw new Error(
      "Không tìm thấy đơn hàng hoặc link theo dõi đã hết hạn/không hợp lệ."
    );
  }

  res.status(200).json(order);
});

// @desc    Lấy chi tiết đơn hàng (cho User hoặc Admin)
// @route   GET /api/v1/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400);
    throw new Error("ID đơn hàng không hợp lệ.");
  }

  // Populate thêm thông tin user (tên, email)
  const order = await Order.findById(orderId)
    .populate("user", "name email phone") // Populate thông tin người dùng
    .populate({
      path: "orderItems.product",
      select: "name slug",
    })
    .lean();

  if (!order) {
    res.status(404);
    throw new Error("Không tìm thấy đơn hàng này.");
  }

  // Kiểm tra quyền truy cập: Hoặc là Admin, hoặc là chủ đơn hàng
  if (
    req.user.role !== "admin" &&
    order.user._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Bạn không có quyền truy cập vào đơn hàng này.");
  }
  res.status(200).json(order);
});

// @desc    User yêu cầu hủy đơn hàng
// @route   PUT /api/v1/orders/:id/request-cancellation
// @access  Private (Chủ đơn hàng)
const requestCancellation = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user._id;
  const { reason, imageUrls } = req.body;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400);
    throw new Error("ID đơn hàng không hợp lệ.");
  }

  if (!reason) {
    res.status(400);
    throw new Error("Vui lòng cung cấp lý do yêu cầu hủy.");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error("Không tìm thấy đơn hàng.");
  }

  // Kiểm tra xem đúng là chủ đơn hàng không
  if (order.user.toString() !== userId.toString()) {
    res.status(403);
    throw new Error("Bạn không có quyền cập nhật đơn hàng này.");
  }

  // Chỉ cho phép yêu cầu hủy khi đang 'Pending' hoặc 'Processing'
  if (!["Pending", "Processing"].includes(order.status)) {
    res.status(400);
    throw new Error(
      `Không thể yêu cầu hủy đơn hàng đang ở trạng thái "${order.status}".`
    );
  }

  // Kiểm tra xem đã yêu cầu trước đó chưa
  if (order.status === "CancellationRequested") {
    return res
      .status(400)
      .json({ message: "Bạn đã gửi yêu cầu hủy cho đơn hàng này rồi." });
  }

  order.previousStatus = order.status;
  order.status = "CancellationRequested";
  order.cancellationRequest = {
    reason,
    imageUrls: imageUrls || [],
    requestedAt: new Date(),
  };
  const updatedOrder = await order.save();
  await updatedOrder.populate("user", "name email phone");

  if (process.env.ADMIN_EMAIL_NOTIFICATIONS && updatedOrder.user) {
    // Kiểm tra có user không
    try {
      const adminHtml = requestAdminNotificationTemplate(
        "cancellation",
        updatedOrder,
        updatedOrder.cancellationRequest
      );
      await sendEmail({
        email: process.env.ADMIN_EMAIL_NOTIFICATIONS,
        subject: `[Yêu Cầu Hủy] Đơn #${orderId.slice(-6)} từ KH: ${
          updatedOrder.user.name
        } (${updatedOrder.user.email})`,
        message: `Khách hàng ${updatedOrder.user.name} (Email: ${updatedOrder.user.email}) yêu cầu hủy đơn hàng ${orderId}. Lý do: ${reason}`,
        html: adminHtml,
        replyTo: updatedOrder.user.email,
      });
    } catch (emailError) {
      console.error("Lỗi gửi mail thông báo hủy cho admin:", emailError);
    }
  }

  // --- Gửi thông báo cho Admin ---
  await createAdminNotification(
    `Yêu cầu hủy đơn hàng #${updatedOrder._id.toString().slice(-6)}`,
    `Khách hàng "${updatedOrder.user.name}" yêu cầu hủy đơn. Lý do: ${updatedOrder.cancellationRequest.reason}`,
    "ORDER_CANCELLATION_REQUESTED",
    `/admin/orders/${updatedOrder._id}`,
    { orderId: updatedOrder._id, userId: updatedOrder.user._id }
  );

  res.json({
    message: "Yêu cầu hủy đơn hàng của bạn đã được gửi.",
    order: updatedOrder,
  });
});

// @desc    User yêu cầu trả hàng/hoàn tiền
// @route   PUT /api/v1/orders/:id/request-refund
// @access  Private (Chủ đơn hàng)
const requestRefund = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user._id;
  const { reason, imageUrls } = req.body;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400);
    throw new Error("ID đơn hàng không hợp lệ.");
  }

  if (!reason) {
    res.status(400);
    throw new Error("Vui lòng cung cấp lý do yêu cầu hoàn tiền.");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error("Không tìm thấy đơn hàng.");
  }

  // Kiểm tra xem đúng là chủ đơn hàng không
  if (order.user.toString() !== userId.toString()) {
    res.status(403);
    throw new Error("Bạn không có quyền cập nhật đơn hàng này.");
  }

  // Chỉ cho phép yêu cầu hoàn tiền khi đã 'Delivered'
  if (order.status !== "Delivered") {
    res.status(400);
    throw new Error(
      `Chỉ có thể yêu cầu hoàn tiền cho đơn hàng đã được giao thành công.`
    );
  }

  // Kiểm tra xem đã yêu cầu trước đó chưa
  if (order.status === "RefundRequested") {
    return res
      .status(400)
      .json({ message: "Bạn đã gửi yêu cầu hoàn tiền cho đơn hàng này rồi." });
  }

  order.previousStatus = order.status;
  order.status = "RefundRequested";
  order.refundRequest = {
    reason,
    imageUrls: imageUrls || [],
    requestedAt: new Date(),
  };

  const updatedOrder = await order.save();
  await updatedOrder.populate("user", "name email phone");

  // --- Gửi email cho Admin ---
  if (process.env.ADMIN_EMAIL_NOTIFICATIONS && updatedOrder.user) {
    try {
      const adminHtml = requestAdminNotificationTemplate(
        "refund",
        updatedOrder,
        updatedOrder.refundRequest
      );
      await sendEmail({
        email: process.env.ADMIN_EMAIL_NOTIFICATIONS,
        subject: `[Yêu Cầu Hoàn Tiền] Đơn #${orderId.slice(-6)} từ KH: ${
          updatedOrder.user.name
        } (${updatedOrder.user.email})`,
        message: `Khách hàng ${updatedOrder.user.name} (Email: ${updatedOrder.user.email}) yêu cầu hoàn tiền đơn hàng ${orderId}. Lý do: ${reason}`,
        html: adminHtml,
        replyTo: updatedOrder.user.email,
      });
    } catch (emailError) {
      console.error("Lỗi gửi mail thông báo hoàn tiền cho admin:", emailError);
    }
  }

  // --- Gửi thông báo cho Admin ---
  await createAdminNotification(
    `Yêu cầu hoàn tiền đơn #${updatedOrder._id.toString().slice(-6)}`,
    `Khách hàng "${updatedOrder.user.name}" yêu cầu hoàn tiền. Lý do: ${updatedOrder.refundRequest.reason}`,
    "ORDER_REFUND_REQUESTED",
    `/admin/orders/${updatedOrder._id}`,
    { orderId: updatedOrder._id, userId: updatedOrder.user._id }
  );

  res.json({
    message: "Yêu cầu trả hàng/hoàn tiền của bạn đã được gửi.",
    order: updatedOrder,
  });
});

// @desc    Người dùng xác nhận đã nhận hàng
// @route   PUT /api/v1/orders/:id/deliver
// @access  Private (Chủ đơn hàng)
const markOrderAsDelivered = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400);
    throw new Error("ID đơn hàng không hợp lệ.");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error("Không tìm thấy đơn hàng.");
  }

  // Kiểm tra xem đúng là chủ đơn hàng không
  if (order.user.toString() !== userId.toString()) {
    res.status(403);
    throw new Error("Bạn không có quyền cập nhật đơn hàng này.");
  }

  // Chỉ cho phép cập nhật từ trạng thái 'Shipped'
  if (order.status !== "Shipped") {
    res.status(400);
    throw new Error(
      `Không thể xác nhận đã nhận hàng cho đơn hàng ở trạng thái "${order.status}".`
    );
  }

  // Cập nhật trạng thái và thời gian
  order.status = "Delivered";
  order.isDelivered = true;
  order.deliveredAt = Date.now();

  if (order.paymentMethod === "COD" && !order.isPaid) {
    order.isPaid = true;
    order.paidAt = Date.now();
    console.log(
      `[Order Delivered] Đơn hàng COD ${order._id} được đánh dấu đã thanh toán.`
    );
  }

  const updatedOrder = await order.save();
  await updatedOrder.populate("user", "name email phone");

  // --- Gửi Email xác nhận đã giao ---
  if (updatedOrder && updatedOrder.user) {
    // Đảm bảo có user để lấy email và tên
    try {
      // --- LOGIC XÁC ĐỊNH guestTrackingUrl (SẼ LUÔN LÀ NULL VÌ ROUTE NÀY YÊU CẦU LOGIN) ---
      const guestTrackingUrl = null; // Vì route này yêu cầu user đã đăng nhập

      console.log(
        `[Email Send][Delivered] Name: ${updatedOrder.user.name}, Email: ${updatedOrder.user.email}, GuestURL: ${guestTrackingUrl}`
      );
      const userEmailHtml = orderDeliveredTemplate(
        updatedOrder.user.name,
        updatedOrder,
        guestTrackingUrl
      );
      await sendEmail({
        email: updatedOrder.user.email,
        subject: `Đơn hàng #${updatedOrder._id
          .toString()
          .slice(-6)} đã giao thành công!`,
        html: userEmailHtml,
      });
      console.log(
        `[Email Send][Delivered] Successfully sent to ${updatedOrder.user.email}`
      );
    } catch (emailError) {
      console.error(
        `Lỗi gửi mail delivered cho order ${updatedOrder._id}:`,
        emailError
      );
    }
  }

  // --- Gửi thông báo cho Admin ---
  await createAdminNotification(
    `Đơn hàng #${updatedOrder._id.toString().slice(-6)} đã giao thành công`,
    `Khách hàng "${updatedOrder.user.name}" đã xác nhận nhận hàng.`,
    "ORDER_STATUS_DELIVERED",
    `/admin/orders/${updatedOrder._id}`,
    { orderId: updatedOrder._id, userId: updatedOrder.user._id }
  );

  res.json(updatedOrder);
});

// --- Các hàm cho Admin ---

// Helper sort cho admin order
const buildOrderSort = (query) => {
  const sort = {};
  if (query.sortBy) {
    const allowed = ["createdAt", "totalPrice", "status"];
    if (allowed.includes(query.sortBy)) {
      sort[query.sortBy] = query.sortOrder === "desc" ? -1 : 1;
    }
  }
  if (Object.keys(sort).length === 0) sort.createdAt = -1;
  return sort;
};

// @desc    Lấy tất cả đơn hàng (Admin, có filter, sort, pagination)
// @route   GET /api/v1/orders
// @access  Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Xây dựng Filter cho Admin
  const filter = {};
  if (
    req.query.status &&
    [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
      "Refunded",
      "CancellationRequested",
      "RefundRequested",
    ].includes(req.query.status)
  ) {
    filter.status = req.query.status;
  }
  if (req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId)) {
    filter.user = req.query.userId;
  }
  // Lọc theo ngày (ví dụ: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD)
  if (req.query.startDate) {
    const startDate = new Date(req.query.startDate);
    startDate.setHours(0, 0, 0, 0); // Bắt đầu ngày
    if (!isNaN(startDate))
      filter.createdAt = { ...filter.createdAt, $gte: startDate };
  }
  if (req.query.endDate) {
    const endDate = new Date(req.query.endDate);
    endDate.setHours(23, 59, 59, 999); // Kết thúc ngày
    if (!isNaN(endDate))
      filter.createdAt = { ...filter.createdAt, $lte: endDate };
  }

  // Sắp xếp
  const sort = buildOrderSort(req.query);

  const ordersQuery = Order.find(filter)
    .populate("user", "name email phone")
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select(
      "_id user guestOrderEmail shippingAddress status totalPrice createdAt isPaid paidAt orderItems isStockRestored"
    )
    .lean();

  const totalOrdersQuery = Order.countDocuments(filter);

  const [orders, totalOrders] = await Promise.all([
    ordersQuery.exec(),
    totalOrdersQuery.exec(),
  ]);

  const totalPages = Math.ceil(totalOrders / limit);

  res.status(200).json({
    currentPage: page,
    totalPages: totalPages,
    totalOrders: totalOrders,
    limit: limit,
    orders: orders,
  });
});

// @desc    Cập nhật trạng thái đơn hàng (Admin)
// @route   PUT /api/v1/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400);
    throw new Error("ID đơn hàng không hợp lệ.");
  }

  // Validate status mới
  const allowedStatusByAdmin = [
    "Processing",
    "Shipped",
    "Cancelled",
    "Refunded",
  ];
  if (!status || !allowedStatusByAdmin.includes(status)) {
    res.status(400);
    throw new Error(
      `Admin chỉ có thể cập nhật trạng thái thành: ${allowedStatusByAdmin.join(
        ", "
      )}.`
    );
  }

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error("Không tìm thấy đơn hàng.");
  }

  // --- Kiểm tra logic chuyển trạng thái ---
  const currentStatus = order.status;
  // Admin chỉ có thể hủy đơn khi đang Pending hoặc Processing (hoặc user request)
  if (
    status === "Cancelled" &&
    !["Pending", "Processing", "CancellationRequested"].includes(currentStatus)
  ) {
    res.status(400);
    throw new Error(
      `Không thể hủy đơn hàng đang ở trạng thái "${currentStatus}".`
    );
  }
  // Admin chỉ hoàn tiền khi user đã request hoặc đơn đã bị hủy trước đó
  if (
    status === "Refunded" &&
    !["Delivered", "RefundRequested", "Cancelled"].includes(currentStatus)
  ) {
    res.status(400);
    throw new Error(
      `Không thể hoàn tiền cho đơn hàng đang ở trạng thái "${currentStatus}".`
    );
  }
  // Admin chuyển trạng thái Shipped từ Processing
  if (status === "Shipped" && !["Processing"].includes(currentStatus)) {
    res.status(400);
    throw new Error(
      `Chỉ có thể chuyển sang 'Shipped' từ trạng thái 'Processing'.`
    );
  }
  // Admin chuyển trạng thái Processing từ Pending
  if (
    status === "Processing" &&
    !["Pending", "CancellationRequested", "RefundRequested"].includes(
      currentStatus
    )
  ) {
    res.status(400);
    throw new Error(
      `Không thể chuyển sang 'Processing' từ trạng thái "${currentStatus}".`
    );
  }

  // Cập nhật trạng thái
  order.status = status;

  const updatedOrder = await order.save();
  await updatedOrder.populate("user", "name email phone");

  // --- Gửi Email khi chuyển sang 'Shipped' ---
  if (updatedOrder.status === "Shipped" && currentStatus !== "Shipped") {
    // Chỉ gửi nếu status thực sự thay đổi thành Shipped
    if (updatedOrder.user || updatedOrder.guestOrderEmail) {
      // Phải có thông tin người nhận email
      try {
        const nameForEmail = updatedOrder.user
          ? updatedOrder.user.name
          : updatedOrder.shippingAddress.fullName || "Quý khách";
        const emailForNotification = updatedOrder.user
          ? updatedOrder.user.email
          : updatedOrder.guestOrderEmail;

        // --- LOGIC XÁC ĐỊNH guestTrackingUrl ---
        let guestTrackingUrl = null;
        if (!updatedOrder.user && updatedOrder.guestOrderTrackingToken) {
          guestTrackingUrl = `${process.env.FRONTEND_URL}/track-order/${updatedOrder._id}/${updatedOrder.guestOrderTrackingToken}`;
        }
        // -------------------------------------

        console.log(
          `[Email Send][Shipped] Name: ${nameForEmail}, Email: ${emailForNotification}, GuestURL: ${guestTrackingUrl}`
        );
        const userEmailHtml = orderShippedTemplate(
          nameForEmail,
          updatedOrder,
          guestTrackingUrl
        );
        await sendEmail({
          email: emailForNotification,
          subject: `Đơn hàng #${updatedOrder._id
            .toString()
            .slice(-6)} của bạn đã được giao đi!`,
          html: userEmailHtml,
        });
        console.log(
          `[Email Send][Shipped] Successfully sent to ${emailForNotification}`
        );
      } catch (emailError) {
        console.error(
          `Lỗi gửi mail shipped cho order ${updatedOrder._id}:`,
          emailError
        );
      }
    }
  }
  res.json(updatedOrder);
});

// @desc    Admin chấp nhận yêu cầu hủy đơn hàng
// @route   PUT /api/v1/orders/:id/approve-cancellation
// @access  Private/Admin
const approveCancellation = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400);
    throw new Error("ID đơn hàng không hợp lệ.");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error("Không tìm thấy đơn hàng.");
  }

  // Chỉ chấp nhận khi đang ở trạng thái yêu cầu hủy
  if (order.status !== "CancellationRequested") {
    res.status(400);
    throw new Error("Đơn hàng này không có yêu cầu hủy đang chờ xử lý.");
  }

  // Chuyển trạng thái sang Cancelled
  order.status = "Cancelled";
  order.adminNotes = "Yêu cầu hủy được chấp nhận.";

  const updatedOrder = await order.save();
  await updatedOrder.populate("user", "name email phone");

  // --- Gửi email thông báo cho User ---
  try {
    const userEmailHtml = requestStatusUpdateTemplate(
      updatedOrder.user.name,
      updatedOrder,
      "cancellation",
      true
    );
    await sendEmail({
      email: updatedOrder.user.email,
      subject: `Yêu cầu hủy đơn hàng #${updatedOrder._id
        .toString()
        .slice(-6)} đã được chấp nhận`,
      message: `Yêu cầu hủy đơn hàng ${updatedOrder._id} được chấp nhận.`,
      html: userEmailHtml,
    });
  } catch (emailError) {
    console.error(
      `Lỗi gửi mail thông báo cho order ${updatedOrder._id}:`,
      emailError
    );
  }

  res.json({
    message: "Đã chấp nhận yêu cầu hủy đơn hàng.",
    order: updatedOrder,
  });
});

// @desc    Admin từ chối yêu cầu hủy đơn hàng
// @route   PUT /api/v1/orders/:id/reject-cancellation
// @access  Private/Admin
const rejectCancellation = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const { reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400);
    throw new Error("ID đơn hàng không hợp lệ.");
  }

  if (!reason) {
    res.status(400);
    throw new Error("Vui lòng cung cấp lý do từ chối yêu cầu hủy đơn.");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error("Không tìm thấy đơn hàng.");
  }

  if (order.status !== "CancellationRequested") {
    res.status(400);
    throw new Error("Đơn hàng này không có yêu cầu hủy đang chờ xử lý.");
  }

  const statusToRevert = order.previousStatus || "Processing";
  order.status = statusToRevert;
  order.previousStatus = null;
  order.adminNotes = `Yêu cầu hủy bị từ chối: ${
    reason || "Không có lý do cụ thể"
  }`;

  const updatedOrder = await order.save();
  await updatedOrder.populate("user", "name email phone");

  // --- Gửi email thông báo cho User ---
  try {
    const userEmailHtml = requestStatusUpdateTemplate(
      updatedOrder.user.name,
      updatedOrder,
      "cancellation",
      false,
      reason
    );
    await sendEmail({
      email: updatedOrder.user.email,
      subject: `Yêu cầu hủy đơn hàng #${updatedOrder._id
        .toString()
        .slice(-6)} bị từ chối`,
      message: `Yêu cầu hủy đơn hàng ${updatedOrder._id} bị từ chối. Lý do: ${reason}`,
      html: userEmailHtml,
    });
  } catch (emailError) {
    console.error(
      `Lỗi gửi mail thông báo cho order ${updatedOrder._id}:`,
      emailError
    );
  }

  res.json({
    message: "Đã từ chối yêu cầu hủy đơn hàng.",
    order: updatedOrder,
  });
});

// @desc    Admin chấp nhận yêu cầu trả hàng/hoàn tiền
// @route   PUT /api/v1/orders/:id/approve-refund
// @access  Private/Admin
const approveRefund = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400);
    throw new Error("ID đơn hàng không hợp lệ.");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error("Không tìm thấy đơn hàng.");
  }

  if (order.status !== "RefundRequested") {
    res.status(400);
    throw new Error("Đơn hàng này không có yêu cầu hoàn tiền đang chờ xử lý.");
  }

  // Chuyển trạng thái sang Refunded
  order.status = "Refunded";
  // (Tùy chọn) Cập nhật isPaid = false, paidAt = null ? Tùy quy trình kế toán
  order.isPaid = false;
  order.paidAt = null;
  order.adminNotes = "Yêu cầu hoàn tiền được chấp nhận.";

  const updatedOrder = await order.save();
  await updatedOrder.populate("user", "name email phone");

  // --- Gửi email thông báo cho User ---
  try {
    const userEmailHtml = requestStatusUpdateTemplate(
      updatedOrder.user.name,
      updatedOrder,
      "refund",
      true
    );
    await sendEmail({
      email: updatedOrder.user.email,
      subject: `Yêu cầu hoàn tiền đơn hàng #${updatedOrder._id
        .toString()
        .slice(-6)} đã được chấp nhận`,
      message: `Yêu cầu hoàn tiền đơn hàng ${updatedOrder._id} được chấp nhận.`,
      html: userEmailHtml,
    });
  } catch (emailError) {
    console.error(
      `Lỗi gửi mail thông báo cho order ${updatedOrder._id}:`,
      emailError
    );
  }

  // Thay thế phương thức refund thực tế
  console.log(`[Action Required] Kích hoạt hoàn tiền cho Order ID: ${orderId}`);

  res.json({
    message:
      "Đã chấp nhận yêu cầu hoàn tiền. Quy trình hoàn tiền sẽ được xử lý.",
    order: updatedOrder,
  });
});

// @desc    Admin từ chối yêu cầu trả hàng/hoàn tiền
// @route   PUT /api/v1/orders/:id/reject-refund
// @access  Private/Admin
const rejectRefund = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const { reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400);
    throw new Error("ID đơn hàng không hợp lệ.");
  }

  if (!reason) {
    res.status(400);
    throw new Error("Vui lòng cung cấp lý do từ chối yêu cầu hoàn tiền.");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error("Không tìm thấy đơn hàng.");
  }

  if (order.status !== "RefundRequested") {
    res.status(400);
    throw new Error("Đơn hàng này không có yêu cầu hoàn tiền đang chờ xử lý.");
  }

  // Trạng thái trước đó khi yêu cầu refund luôn là 'Delivered'
  const statusToRevert = order.previousStatus || "Processing";
  order.status = statusToRevert;
  order.previousStatus = null;
  order.adminNotes = `Yêu cầu hoàn tiền bị từ chối: ${
    reason || "Không có lý do cụ thể"
  }`;

  const updatedOrder = await order.save();
  await updatedOrder.populate("user", "name email phone");

  // --- Gửi email thông báo cho User ---
  try {
    const userEmailHtml = requestStatusUpdateTemplate(
      updatedOrder.user.name,
      updatedOrder,
      "refund",
      false,
      reason
    );
    await sendEmail({
      email: updatedOrder.user.email,
      subject: `Yêu cầu hoàn tiền đơn hàng #${updatedOrder._id
        .toString()
        .slice(-6)} bị từ chối`,
      message: `Yêu cầu hoàn tiền đơn hàng ${updatedOrder._id} bị từ chối. Lý do: ${reason}`,
      html: userEmailHtml,
    });
  } catch (emailError) {
    console.error(
      `Lỗi gửi mail thông báo cho order ${updatedOrder._id}:`,
      emailError
    );
  }

  res.json({ message: "Đã từ chối yêu cầu hoàn tiền.", order: updatedOrder });
});

// @desc    Admin khôi phục tồn kho cho đơn hàng
// @route   POST /api/v1/orders/:id/restock
// @access  Private/Admin
const restockOrderItems = asyncHandler(async (req, res) => {
  const orderId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400);
    throw new Error("ID đơn hàng không hợp lệ.");
  }

  const order = await Order.findById(orderId)
  if (!order) {
    res.status(404);
    throw new Error("Không tìm thấy đơn hàng.");
  }

  if (order.isStockRestored) {
    res.status(400);
    throw new Error("Đơn hàng này đã được khôi phục tồn kho trước đó.");
  }

  // Chỉ nên cho phép restock nếu đơn hàng thực sự đã bị hủy hoặc hoàn tiền
  if (!["Cancelled", "Refunded"].includes(order.status)) {
    res.status(400);
    throw new Error(
      `Chỉ có thể khôi phục tồn kho cho đơn hàng đã Hủy hoặc Hoàn tiền (Trạng thái hiện tại: ${order.status}).`
    );
  }

  // --- Logic khôi phục tồn kho ---
  // --- Bắt đầu Transaction để đảm bảo tính toàn vẹn ---
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const bulkOps = [];
    for (const item of order.orderItems) {
      const incrementAmount = item.quantity;
      if (item.variant?.variantId) {
        // Tăng tồn kho biến thể
        bulkOps.push({
          updateOne: {
            filter: {
              _id: item.product,
              "variants._id": item.variant.variantId,
            },
            update: { $inc: { "variants.$.stockQuantity": +incrementAmount } },
          },
        });
      } else {
        // Tăng tồn kho sản phẩm chính
        bulkOps.push({
          updateOne: {
            filter: { _id: item.product },
            update: { $inc: { stockQuantity: +incrementAmount } },
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps, { session });
    }

    order.isStockRestored = true;
    order.adminNotes =
      (order.adminNotes || "") +
      `\n[System] Tồn kho đã được khôi phục lúc ${new Date().toLocaleString(
        "vi-VN"
      )}.`;
    await order.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      message: `Đã khôi phục tồn kho thành công cho đơn hàng.`,
      order: order.toObject(), // Trả về đơn hàng đã cập nhật
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("[Restock] Lỗi khi khôi phục tồn kho:", error);
    throw new Error("Có lỗi xảy ra khi khôi phục tồn kho.");
  } finally {
    session.endSession();
  }
});

module.exports = {
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
};
