const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const User = require("../models/User");
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

// --- Hàm Helper: Cập nhật tồn kho và coupon usage ---
const updateStockAndCouponUsage = async (
  orderItems,
  appliedCouponCode,
  session
) => {
  console.log(
    "[Stock Update Debug] Dữ liệu orderItems nhận được để cập nhật stock:",
    JSON.stringify(orderItems, null, 2)
  );
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    console.error(
      "[Stock Update Error] Dữ liệu orderItems không hợp lệ hoặc rỗng."
    );
    // Không nên tiếp tục nếu dữ liệu sai
    return; // Hoặc throw new Error('Dữ liệu items không hợp lệ để cập nhật stock.');
  }
  console.log(
    "[Stock & Sold Update] Bắt đầu cập nhật tồn kho, totalSold và coupon."
  );
  const stockBulkOps = []; // Cho tồn kho
  const soldBulkOps = []; // Cho totalSold

  // 1. Chuẩn bị cập nhật tồn kho
  for (const item of orderItems) {
    const changeAmount = item.quantity;

    // 1. Chuẩn bị giảm tồn kho
    if (item.variant?.variantId) {
      stockBulkOps.push({
        updateOne: {
          filter: { _id: item.product, "variants._id": item.variant.variantId },
          update: { $inc: { "variants.$.stockQuantity": -changeAmount } },
        },
      });
    } else {
      stockBulkOps.push({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { stockQuantity: -changeAmount } },
        },
      });
    }

    // 2. Chuẩn bị tăng totalSold cho sản phẩm gốc
    soldBulkOps.push({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { totalSold: +changeAmount } }, // Tăng totalSold
      },
    });
  }

  // 3. Chuẩn bị cập nhật coupon usage (nếu có)
  let couponUpdatePromise = Promise.resolve();
  if (appliedCouponCode) {
    couponUpdatePromise = Coupon.updateOne(
      { code: appliedCouponCode },
      { $inc: { usageCount: 1 } }
    ).session(session);
  }

  // 4. Thực thi cập nhật với session
  if (stockBulkOps.length > 0) {
    await Product.bulkWrite(stockBulkOps, { session });
    console.log("[Stock & Sold Update] Đã cập nhật tồn kho.");
  }
  if (soldBulkOps.length > 0) {
    await Product.bulkWrite(soldBulkOps, { session });
    console.log("[Stock & Sold Update] Đã cập nhật totalSold.");
  }
  await couponUpdatePromise;
  console.log(
    "[Stock & Sold Update] Cập nhật coupon usage thành công (nếu có)."
  );
};

// @desc    Tạo đơn hàng mới từ giỏ hàng (cho User hoặc Guest)
// @route   POST /api/v1/orders
// @access  Public
const createOrder = asyncHandler(async (req, res) => {
  // --- Xác định User hoặc Guest ---
  const loggedInUser = req.user; // Sẽ là object User nếu đăng nhập, hoặc null nếu là guest
  let userIdForOrder = loggedInUser ? loggedInUser._id : null;
  let userEmailForOrder = loggedInUser ? loggedInUser.email : null;
  let userNameForOrder = loggedInUser ? loggedInUser.name : null;

  const {
    shippingAddressId,
    shippingAddress: newShippingAddressData,
    paymentMethod,
    shippingMethod,
    notes,
    // Các trường CHỈ DÀNH CHO GUEST (nếu không có loggedInUser)
    email: guestEmailFromBody,
    selectedCartItemIds,
  } = req.body;

  // --- Validate selectedCartItemIds ---
  if (
    !selectedCartItemIds ||
    !Array.isArray(selectedCartItemIds) ||
    selectedCartItemIds.length === 0
  ) {
    res.status(400);
    throw new Error("Vui lòng chọn ít nhất một sản phẩm để đặt hàng.");
  }
  for (const itemId of selectedCartItemIds) {
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      res.status(400);
      throw new Error(`ID sản phẩm trong giỏ hàng không hợp lệ: ${itemId}`);
    }
  }
  const objectIdSelectedCartItemIds = selectedCartItemIds.map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  // --- Lấy Guest Identifier (từ cart cookie) ---
  const cartGuestId = req.cookies.cartGuestId;

  // --- Xác định các phương thức thanh toán trả trước ---
  const prepaidPaymentMethods = ["BANK_TRANSFER", "PAYPAL"];

  // --- Bắt đầu Transaction ---
  const session = await mongoose.startSession();
  session.startTransaction();
  console.log("[Transaction] Bắt đầu Transaction tạo đơn hàng.");

  let createdOrder;
  let customerEmailForNotification = null; // Email để gửi xác nhận
  let customerNameForNotification = null; // Tên để cá nhân hóa email

  try {
    // --- 1. Xử lý thông tin người đặt hàng (User vs Guest) ---
    let finalShippingAddress = null;

    if (loggedInUser) {
      // --- 1.1. XỬ LÝ CHO USER ĐÃ ĐĂNG NHẬP ---
      console.log(`[Order Create] Người dùng đăng nhập: ${loggedInUser.email}`);
      customerEmailForNotification = loggedInUser.email;
      customerNameForNotification = loggedInUser.name;

      if (shippingAddressId) {
        if (!mongoose.Types.ObjectId.isValid(shippingAddressId)) {
          res.status(400);
          throw new Error("ID địa chỉ giao hàng không hợp lệ.");
        }
        const userWithAddresses = await User.findById(userIdForOrder)
          .select("addresses")
          .session(session);
        const address = userWithAddresses?.addresses?.id(shippingAddressId);
        if (!address) {
          res.status(404);
          throw new Error(
            "Không tìm thấy địa chỉ giao hàng này trong tài khoản của bạn."
          );
        }
        // Tạo snapshot từ địa chỉ tìm được
        finalShippingAddress = {
          fullName: address.fullName,
          phone: address.phone,
          street: address.street,
          communeCode: address.communeCode,
          communeName: address.communeName,
          districtCode: address.districtCode,
          districtName: address.districtName,
          provinceCode: address.provinceCode,
          provinceName: address.provinceName,
          countryCode: address.countryCode,
        };
      } else if (newShippingAddressData) {
        // User đăng nhập nhưng nhập địa chỉ mới
        const userToUpdateAddress = await User.findById(userIdForOrder).session(
          session
        );
        if (!userToUpdateAddress) {
          res.status(404);
          throw new Error("Không tìm thấy thông tin người dùng.");
        }
        // Kiểm tra xem có nên đặt làm mặc định không
        const isDefaultAddress =
          !userToUpdateAddress.addresses ||
          userToUpdateAddress.addresses.length === 0;

        // Thêm địa chỉ mới vào danh sách của user
        userToUpdateAddress.addresses.push({
          ...newShippingAddressData,
          isDefault: isDefaultAddress,
        });
        await userToUpdateAddress.save({ session }); // <<< Lưu user trong transaction >>>
        console.log("[Address] Đã lưu địa chỉ mới vào user.");

        // Sử dụng địa chỉ mới này cho đơn hàng
        finalShippingAddress = { ...newShippingAddressData };
      } else {
        res.status(400);
        throw new Error("Vui lòng cung cấp địa chỉ giao hàng.");
      }
    } else {
      // --- 1.2. XỬ LÝ CHO GUEST ---
      console.log("[Order Create] Khách đặt hàng.");

      userIdForOrder = null; // Không có user ID cho guest
      userEmailForOrder = guestEmailFromBody.toLowerCase().trim(); // Email của guest
      userNameForOrder = newShippingAddressData.fullName; // Tên của guest

      customerEmailForNotification = userEmailForOrder;
      customerNameForNotification = userNameForOrder;
      finalShippingAddress = { ...newShippingAddressData }; // Địa chỉ của guest
    }

    if (!finalShippingAddress) {
      res.status(400);
      throw new Error("Vui lòng cung cấp địa chỉ giao hàng.");
    }

    // --- 2. Tìm giỏ hàng gốc của user/guest ---
    let cartIdentifier;
    if (loggedInUser) cartIdentifier = { userId: loggedInUser._id };
    else if (cartGuestId) cartIdentifier = { guestId: cartGuestId };
    else {
      res.status(400);
      throw new Error("Không tìm thấy thông tin giỏ hàng (thiếu identifier).");
    }

    const originalCart = await Cart.findOne(cartIdentifier).session(session);
    if (!originalCart || originalCart.items.length === 0) {
      res.status(404);
      throw new Error("Giỏ hàng của bạn đang trống hoặc không tồn tại.");
    }

    // --- 3. Lọc ra các items được chọn từ giỏ hàng gốc ---
    const itemsToProcessInOrder = originalCart.items.filter((item) =>
      objectIdSelectedCartItemIds.some((selectedId) =>
        selectedId.equals(item._id)
      )
    );

    if (itemsToProcessInOrder.length !== objectIdSelectedCartItemIds.length) {
      res.status(400);
      throw new Error(
        "Một số sản phẩm bạn chọn không còn tồn tại trong giỏ hàng. Vui lòng làm mới trang."
      );
    }
    if (itemsToProcessInOrder.length === 0) {
      // Double check
      res.status(400);
      throw new Error("Không có sản phẩm nào được chọn hợp lệ để đặt hàng.");
    }

    // --- 4. Tạo một "cart object tạm thời" chỉ chứa các items được chọn để tính toán ---
    // Điều này quan trọng để populateAndCalculateCart chỉ làm việc trên các item được chọn
    const cartForCalculation = {
      _id: originalCart._id, // Vẫn là ID của cart gốc
      items: itemsToProcessInOrder,
      appliedCoupon: originalCart.appliedCoupon, // Coupon sẽ được re-validate với items đã chọn
      userId: originalCart.userId,
      guestId: originalCart.guestId,
    };

    // --- 5. Populate và Tính toán cho các items đã chọn ---
    const cartInstanceForCalculation = await Cart.findById(
      originalCart._id
    ).session(session); // Lấy lại instance
    if (!cartInstanceForCalculation) {
      throw new Error("Không thể tải lại giỏ hàng để tính toán.");
    }
    cartInstanceForCalculation.items = itemsToProcessInOrder; // Gán các item đã chọn
    cartInstanceForCalculation.appliedCoupon = originalCart.appliedCoupon; // Giữ lại coupon nếu có

    // Bây giờ populateAndCalculateCart sẽ nhận một Mongoose Document đã được sửa đổi items
    const calculatedDataForOrder = await populateAndCalculateCart(
      cartInstanceForCalculation
    );

    if (
      !calculatedDataForOrder ||
      !calculatedDataForOrder.items ||
      calculatedDataForOrder.items.length === 0
    ) {
      res.status(400);
      throw new Error("Không thể xử lý các sản phẩm đã chọn trong giỏ hàng.");
    }

    // --- 6. Re-validate Tồn kho lần cuối ---
    const productIdsForStockCheck = calculatedDataForOrder.items.map(
      (item) => item.productId
    );
    const productsDataForStock = await Product.find({
      _id: { $in: productIdsForStockCheck },
    })
      .select("name sku variants stockQuantity")
      .session(session);
    const productMapStock = new Map(
      productsDataForStock.map((p) => [p._id.toString(), p])
    );

    for (const item of calculatedDataForOrder.items) {
      const productStockInfo = productMapStock.get(item.productId.toString());
      let availableStock = 0;
      if (productStockInfo) {
        if (item.variantId) {
          const variant = productStockInfo.variants.id(item.variantId);
          availableStock = variant ? variant.stockQuantity : 0;
        } else {
          availableStock = productStockInfo.stockQuantity;
        }
      }
      if (item.quantity > availableStock) {
        throw new Error(
          `Sản phẩm "${item.name}" (SKU: ${
            item.sku || "N/A"
          }) không đủ tồn kho (Còn ${availableStock}, cần ${item.quantity}).`
        );
      }
    }
    console.log(
      "[Transaction] Kiểm tra tồn kho cho các sản phẩm đã chọn thành công."
    );

    // --- 4. Tạo mảng orderItems (snapshot) ---
    const orderItemsData = calculatedDataForOrder.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
      product: item.productId,
      variant: item.variantId
        ? {
            variantId: item.variantId,
            sku: item.sku,
            options: item.variantInfo?.options || [],
          }
        : null,
    }));

    // --- 5. Tạo đối tượng Order ---
    let initialStatus = "Pending";
    let initialIsPaid = false;
    let initialPaidAt = null;

    // <<< KIỂM TRA THANH TOÁN TRẢ TRƯỚC >>>
    if (prepaidPaymentMethods.includes(paymentMethod)) {
      initialStatus = "Processing"; // Chuyển thẳng sang Processing
      initialIsPaid = true; // Đánh dấu đã thanh toán
      initialPaidAt = new Date(); // Ghi nhận thời điểm thanh toán
      console.log(
        `[Order Create] Thanh toán trả trước (${paymentMethod}). Đặt trạng thái Processing, isPaid=true.`
      );
    }
    const orderDataToCreate = {
      user: userIdForOrder, // Sẽ là null nếu là guest
      guestOrderEmail: loggedInUser ? null : userEmailForOrder, // Chỉ set cho guest
      guestSessionId: loggedInUser ? null : cartGuestId, // Chỉ set cho guest (lưu lại cartGuestId)
      orderItems: orderItemsData,
      shippingAddress: finalShippingAddress,
      paymentMethod: paymentMethod || "COD",
      shippingMethod: shippingMethod || "Standard",
      itemsPrice: calculatedDataForOrder.subtotal,
      shippingPrice: 0,
      taxPrice: 0, // Tạm thời
      discountAmount: calculatedDataForOrder.discountAmount || 0,
      totalPrice:
        calculatedDataForOrder.finalTotal || calculatedDataForOrder.subtotal,
      appliedCouponCode: calculatedDataForOrder.appliedCoupon?.code || null,
      status: initialStatus,
      notes: notes || "",
      isPaid: initialIsPaid,
      paidAt: initialPaidAt,
      isDelivered: false,
    };

    const order = new Order(orderDataToCreate);

    // --- TẠO VÀ GÁN TRACKING TOKEN NẾU LÀ GUEST ---
    let guestTrackingTokenValue = null;
    if (!loggedInUser) {
      // Chỉ tạo token cho guest
      guestTrackingTokenValue = order.createGuestOrderTrackingToken(); // Gọi method từ model
      console.log(`[Guest Order] Created tracking token for guest order.`);
    }

    // --- 6. Lưu Order ---
    createdOrder = await order.save({ session });
    console.log(
      `[Transaction] Đã lưu Order: ${createdOrder._id} cho ${
        loggedInUser
          ? "User: " + loggedInUser.email
          : "Guest: " + userEmailForOrder
      }`
    );
    console.log(
      "[Debug] Dữ liệu createdOrder.orderItems SAU KHI lưu:",
      JSON.stringify(createdOrder.orderItems, null, 2)
    );

    // --- 7. Cập nhật tồn kho và coupon usage ---
    console.log("[Debug] createdOrder type:", typeof createdOrder);
    console.log(
      "[Debug] createdOrder.orderItems type:",
      typeof createdOrder.orderItems
    );
    console.log(
      "[Debug] Is createdOrder.orderItems an array?",
      Array.isArray(createdOrder.orderItems)
    );
    if (!Array.isArray(createdOrder.orderItems)) {
      console.error(
        "[Debug] LỖI: createdOrder.orderItems không phải là mảng!",
        createdOrder.orderItems
      );
    }
    await updateStockAndCouponUsage(
      createdOrder.orderItems,
      createdOrder.appliedCouponCode,
      session
    );
    console.log("[Transaction] Đã cập nhật stock và coupon.");

    // --- 8. Xóa giỏ hàng ---
    await Cart.updateOne(
      { _id: originalCart._id },
      { $pull: { items: { _id: { $in: objectIdSelectedCartItemIds } } } }, // Sử dụng ID của các cart item đã chọn
      { session }
    );
    console.log(
      `[Cart] Đã xóa ${objectIdSelectedCartItemIds.length} items đã đặt khỏi giỏ hàng ${originalCart._id}.`
    );

    // Kiểm tra lại giỏ hàng sau khi xóa items
    const cartAfterUpdate = await Cart.findById(originalCart._id)
      .session(session)
      .lean(); // Dùng lean để đọc
    if (
      cartAfterUpdate &&
      cartAfterUpdate.items.length === 0 &&
      cartAfterUpdate.appliedCoupon
    ) {
      // Nếu giỏ hàng rỗng và vẫn còn coupon, xóa coupon
      await Cart.updateOne(
        { _id: originalCart._id },
        { $set: { appliedCoupon: null } },
        { session }
      );
      console.log(`[Cart] Giỏ hàng rỗng sau khi đặt hàng, đã xóa coupon.`);
    }

    // --- 9. Commit Transaction ---
    await session.commitTransaction();
    console.log("[Transaction] Commit Transaction thành công.");
  } catch (error) {
    // --- Nếu có lỗi ở bất kỳ bước nào, Abort Transaction ---
    console.error(
      "[Transaction] Gặp lỗi, đang abort transaction:",
      error.message
    );
    await session.abortTransaction(); // Hủy bỏ mọi thay đổi trong transaction
    console.log("[Transaction] Đã abort transaction.");
    // Ném lỗi ra ngoài để global error handler xử lý
    throw new Error(error.message || "Tạo đơn hàng thất bại.");
  } finally {
    // --- Kết thúc Session ---
    await session.endSession();
    console.log("[Transaction] Đã kết thúc session.");
  }

  // --- Bước 10: Gửi Email Xác nhận ---
  if (createdOrder) {
    try {
      const orderForEmail = await Order.findById(createdOrder._id)
        .populate("user", "name email phone")
        .lean();
      if (orderForEmail) {
        const nameForEmail = orderForEmail.user
          ? orderForEmail.user.name
          : customerNameForNotification;
        const emailForNotification = orderForEmail.user
          ? orderForEmail.user.email
          : customerEmailForNotification;

        // Tạo tracking URL nếu là guest và có token
        let guestTrackingUrl = null;
        if (!orderForEmail.user && orderForEmail.guestOrderTrackingToken) {
          guestTrackingUrl = `${process.env.FRONTEND_URL}/track-order/${orderForEmail._id}/${orderForEmail.guestOrderTrackingToken}`;
        }

        const emailHtml = orderConfirmationTemplate(
          nameForEmail,
          orderForEmail,
          guestTrackingUrl
        );
        await sendEmail({
          email: emailForNotification,
          subject: `Xác nhận đơn hàng #${orderForEmail._id
            .toString()
            .slice(-6)} tại ${process.env.SHOP_NAME || "Shop"}`,
          message: `Cảm ơn bạn đã đặt hàng! Mã đơn hàng của bạn là ${
            orderForEmail._id
          }. ${
            guestTrackingUrl
              ? "Bạn có thể theo dõi đơn hàng tại: " + guestTrackingUrl
              : ""
          }`,
          html: emailHtml,
        });
      }
    } catch (emailError) {
      console.error(
        `Lỗi gửi email xác nhận cho đơn hàng ${createdOrder._id}:`,
        emailError
      );
    }

    // --- Gửi thông báo cho Admin ---
    const adminNotifierName = loggedInUser
      ? loggedInUser.name
      : `Khách (Email: ${userEmailForOrder})`;
    await createAdminNotification(
      "Đơn hàng mới được đặt",
      `Đơn hàng #${createdOrder._id
        .toString()
        .slice(
          -6
        )} bởi "${adminNotifierName}" vừa được đặt. Tổng tiền: ${createdOrder.totalPrice.toLocaleString(
        "vi-VN"
      )}đ.`,
      "NEW_ORDER_PLACED",
      `/admin/orders/${createdOrder._id}`,
      { orderId: createdOrder._id, userId: userIdForOrder } // userIdForOrder sẽ là null cho guest
    );

    // --- Trả về đơn hàng đã tạo ---
    // Populate lại user lần nữa cho response cuối cùng nếu cần
    const finalResponseOrder = await Order.findById(createdOrder._id)
      .populate("user", "name email phone")
      .lean();
    res.status(201).json(finalResponseOrder || createdOrder.toObject());
  } else {
    // Trường hợp hiếm hoi transaction thành công nhưng createdOrder không có giá trị
    res.status(500).json({
      message:
        "Tạo đơn hàng thành công nhưng có lỗi khi lấy lại thông tin đơn hàng.",
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
  const skip = (page - 1) * limit;

  const filter = { user: userId };

  const sort = { createAt: -1 };

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
  const order = await Order.findById(orderId).populate("user", "name email phone ");

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
      filter.createAt = { ...filter.createAt, $gte: startDate };
  }
  if (req.query.endDate) {
    const endDate = new Date(req.query.endDate);
    endDate.setHours(23, 59, 59, 999); // Kết thúc ngày
    if (!isNaN(endDate))
      filter.createAt = { ...filter.createAt, $lte: endDate };
  }

  // Sắp xếp
  const sort = buildOrderSort(req.query);

  const ordersQuery = Order.find(filter)
    .populate("user", "name email phone")
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select("-orderItems.variant")
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

  const order = await Order.findById(orderId).lean();
  if (!order) {
    res.status(404);
    throw new Error("Không tìm thấy đơn hàng.");
  }

  // Chỉ nên cho phép restock nếu đơn hàng thực sự đã bị hủy hoặc hoàn tiền
  if (!["Cancelled", "Refunded"].includes(order.status)) {
    res.status(400);
    throw new Error(
      `Chỉ có thể khôi phục tồn kho cho đơn hàng đã Hủy hoặc Hoàn tiền (Trạng thái hiện tại: ${order.status}).`
    );
  }

  // --- Logic khôi phục tồn kho ---
  console.log(`[Restock] Bắt đầu khôi phục tồn kho cho Order ${orderId}`);
  const bulkOps = [];
  for (const item of order.orderItems) {
    const incrementAmount = item.quantity;
    if (item.variant?.variantId) {
      // Tăng tồn kho biến thể
      bulkOps.push({
        updateOne: {
          filter: { _id: item.product, "variants._id": item.variant.variantId },
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

  // Thực thi cập nhật
  if (bulkOps.length > 0) {
    try {
      const result = await Product.bulkWrite(bulkOps);
      console.log(
        "[Restock] Kết quả khôi phục tồn kho:",
        JSON.stringify(result)
      );
      // Kiểm tra kết quả nếu cần
      if (result.modifiedCount === 0 && result.matchedCount > 0) {
        console.warn(
          "[Restock] Có thể một số sản phẩm/variant không tìm thấy để khôi phục stock."
        );
      }
      res.status(200).json({
        message: `Đã khôi phục tồn kho cho ${result.modifiedCount} mục sản phẩm.`,
      });
    } catch (error) {
      console.error("[Restock] Lỗi khi khôi phục tồn kho:", error);
      res.status(500);
      throw new Error("Có lỗi xảy ra khi khôi phục tồn kho.");
    }
  } else {
    res.status(400).json({
      message: "Không có mục nào trong đơn hàng để khôi phục tồn kho.",
    });
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
