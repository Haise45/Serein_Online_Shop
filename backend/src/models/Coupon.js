const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      // Mã giảm giá mà người dùng nhập
      type: String,
      required: [true, "Vui lòng nhập mã giảm giá"],
      unique: true, // Mã phải là duy nhất
      trim: true,
      uppercase: true,
      index: true,
    },
    description: {
      // Mô tả nội bộ cho admin
      type: String,
      trim: true,
    },
    discountType: {
      // Loại giảm giá
      type: String,
      required: true,
      enum: {
        // Chỉ cho phép các giá trị này
        values: ["percentage", "fixed_amount"],
        message: 'Loại giảm giá phải là "percentage" hoặc "fixed_amount"',
      },
    },
    discountValue: {
      // Giá trị giảm
      type: Number,
      required: [true, "Vui lòng nhập giá trị giảm giá"],
      min: [0, "Giá trị giảm giá không được âm"],
    },
    minOrderValue: {
      // Giá trị đơn hàng tối thiểu để áp dụng
      type: Number,
      default: 0,
      min: [0, "Giá trị đơn hàng tối thiểu không được âm"],
    },
    maxUsage: {
      // Tổng số lần sử dụng tối đa (null = không giới hạn)
      type: Number,
      default: null,
      min: [1, "Số lần sử dụng tối đa phải ít nhất là 1 (nếu có giới hạn)"],
    },
    usageCount: {
      // Số lần đã sử dụng (chỉ tăng khi đơn hàng hoàn tất)
      type: Number,
      default: 0,
      min: 0,
    },
    maxUsagePerUser: {
      // Số lần sử dụng tối đa cho mỗi người dùng (1 = chỉ dùng 1 lần)
      type: Number,
      default: 1,
      min: [1, "Số lần sử dụng tối đa cho mỗi người dùng phải ít nhất là 1"],
    },
    startDate: {
      // Ngày bắt đầu hiệu lực
      type: Date,
    },
    expiryDate: {
      // Ngày hết hạn
      type: Date,
      required: [true, "Vui lòng nhập ngày hết hạn"],
      index: true,
    },
    isActive: {
      // Trạng thái coupon
      type: Boolean,
      default: true,
      index: true,
    },
    applicableTo: {
      // Áp dụng cho đối tượng nào
      type: String,
      enum: ["all", "categories", "products"],
      default: "all",
    },
    applicableIds: {
      // Mảng các ID của Category hoặc Product (nếu applicableTo không phải 'all')
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Middleware kiểm tra ngày hết hạn phải sau ngày bắt đầu
couponSchema.pre("save", function (next) {
  if (this.startDate && this.expiryDate && this.startDate >= this.expiryDate) {
    next(new Error("Ngày hết hạn phải sau ngày bắt đầu hiệu lực."));
  } else {
    next();
  }
});

// Middleware kiểm tra giá trị giảm giá phù hợp với loại giảm giá
couponSchema.pre("save", function (next) {
  if (
    this.discountType === "percentage" &&
    (this.discountValue <= 0 || this.discountValue > 100)
  ) {
    next(
      new Error(
        "Giá trị giảm giá dạng phần trăm phải lớn hơn 0 và nhỏ hơn hoặc bằng 100."
      )
    );
  } else if (this.discountType === "fixed_amount" && this.discountValue <= 0) {
    next(new Error("Giá trị giảm giá dạng số tiền cố định phải lớn hơn 0."));
  } else {
    next();
  }
});

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;
