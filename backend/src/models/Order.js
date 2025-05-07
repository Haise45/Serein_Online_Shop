const mongoose = require("mongoose");

// Sub-schema cho địa chỉ giao hàng (snapshot)
const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true }, // Tên người nhận tại địa chỉ này
    phone: { type: String, required: true }, // SĐT người nhận tại địa chỉ này
    street: { type: String, required: true, trim: true }, // Số nhà, tên đường
    communeCode: { type: String, required: true },
    communeName: { type: String, required: true }, // Lưu tên để hiển thị dễ dàng
    districtCode: { type: String, required: true },
    districtName: { type: String, required: true },
    provinceCode: { type: String, required: true },
    provinceName: { type: String, required: true },
    countryCode: { type: String, default: "VN" },
  },
  { _id: false }
);

// Sub-schema cho thông tin biến thể (snapshot)
const orderItemVariantSchema = new mongoose.Schema(
  {
    variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
    sku: { type: String },
    options: [
      {
        _id: false,
        attributeName: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
  },
  { _id: false }
);

// Sub-schema cho một item trong đơn hàng (snapshot)
const orderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Tên sản phẩm lúc đặt
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }, // Giá MỘT sản phẩm lúc đặt
    image: { type: String }, // URL ảnh chính hoặc ảnh variant lúc đặt
    product: {
      // Tham chiếu đến sản phẩm gốc
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    variant: {
      // Thông tin biến thể nếu có
      type: orderItemVariantSchema,
      default: null,
    },
  },
  { _id: true }
); // Cho phép mỗi item có _id riêng

// Sub-schema cho thông tin yêu cầu hủy/hoàn tiền
const requestSchema = new mongoose.Schema(
  {
    reason: { type: String, required: true }, // Lý do yêu cầu
    imageUrls: { type: [String], default: [] }, // URL ảnh đính kèm (nếu có)
    requestedAt: { type: Date, default: Date.now }, // Thời điểm yêu cầu
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: [true, "Vui lòng chọn phương thức thanh toán"],
      enum: ["COD", "BANK_TRANSFER", "PAYPAL"],
    },
    shippingMethod: {
      type: String,
      default: "Standard",
      // enum: ['Standard', 'Express']
    },
    itemsPrice: {
      // Tổng tiền hàng (trước thuế, ship, giảm giá)
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      // Phí vận chuyển
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      // Tiền thuế (nếu có)
      type: Number,
      required: true,
      default: 0.0,
    },
    discountAmount: {
      // Số tiền được giảm giá
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      // Tổng tiền cuối cùng khách phải trả
      type: Number,
      required: true,
      default: 0.0,
    },
    appliedCouponCode: {
      // Mã coupon đã áp dụng (nếu có)
      type: String,
      default: null,
      uppercase: true,
      trim: true,
    },
    status: {
      // Trạng thái đơn hàng
      type: String,
      required: true,
      enum: [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Refunded",
        "CancellationRequested",
        "RefundRequested",
      ],
      default: "Pending",
      index: true,
    },
    previousStatus: {
      // Lưu trạng thái trước khi user request cancel/refund
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", null],
      default: null,
    },
    cancellationRequest: {
      // Lưu thông tin khi user yêu cầu hủy
      type: requestSchema,
      default: null,
    },
    refundRequest: {
      // Lưu thông tin khi user yêu cầu hoàn tiền
      type: requestSchema,
      default: null,
    },
    adminNotes: {
      // Ghi chú của Admin (ví dụ: lý do từ chối)
      type: String,
    },
    notes: {
      // Ghi chú của khách hàng
      type: String,
    },
    isPaid: {
      // Trạng thái thanh toán (sẽ cập nhật khi có tích hợp payment)
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      // Thời điểm thanh toán thành công
      type: Date,
    },
    isDelivered: {
      // Trạng thái giao hàng
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      // Thời điểm giao hàng thành công
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
