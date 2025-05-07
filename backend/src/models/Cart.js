const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product", // Tham chiếu đến model Product
      required: true,
    },
    variantId: {
      // _id của subdocument variant trong Product (nếu là biến thể)
      type: mongoose.Schema.Types.ObjectId,
      default: null, // null nếu là sản phẩm không có biến thể
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Số lượng phải ít nhất là 1"],
      default: 1,
    },
  },
  {
    _id: true, // Mỗi cart item có _id riêng để dễ cập nhật/xóa
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const cartSchema = new mongoose.Schema(
  {
    // Chỉ một trong hai trường này có giá trị
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    guestId: {
      // Dùng cho khách chưa đăng nhập
      type: String,
      default: null,
    },
    items: [cartItemSchema], // Mảng các sản phẩm trong giỏ
    appliedCoupon: { // Lưu thông tin coupon đã áp dụng
      code: { type: String, uppercase: true, trim: true },
      discountType: {
        type: String,
        enum: ["percentage", "fixed_amount"],
      },
      discountValue: { type: Number },
      discountAmount: { type: Number }, // Số tiền giảm giá thực tế đã tính cho giỏ hàng này
    },
  },
  {
    timestamps: true,
  }
);

// Đảm bảo chỉ có userId hoặc guestId tồn tại
cartSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { userId: { $exists: true } } }
);
cartSchema.index(
  { guestId: 1 },
  { unique: true, partialFilterExpression: { guestId: { $exists: true } } }
);

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
