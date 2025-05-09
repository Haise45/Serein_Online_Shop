const mongoose = require("mongoose");
const Product = require("./Product");

const adminReplySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      required: true,
      maxlength: [500, "Phản hồi không được vượt quá 500 ký tự."],
    },
    createAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    user: {
      // Người viết review
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      // Sản phẩm được review
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    order: {
      // Đơn hàng chứa sản phẩm này (dùng để xác thực người mua)
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: {
      // Điểm đánh giá
      type: Number,
      required: [true, "Vui lòng cung cấp điểm đánh giá."],
      min: 1,
      max: 5,
      validate: {
        // Đảm bảo là số nguyên
        validator: Number.isInteger,
        message: "{VALUE} không phải là số nguyên cho điểm đánh giá",
      },
    },
    comment: {
      // Bình luận
      type: String,
      trim: true,
      maxlength: [1000, "Bình luận không được vượt quá 1000 ký tự."],
    },
    userImages: {
      // Mảng URL ảnh do người dùng upload kèm review
      type: [String],
      default: [],
    },
    isApproved: {
      // Trạng thái duyệt bởi Admin
      type: Boolean,
      default: false,
      index: true,
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      // Admin nào đã duyệt
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    adminReply: {
      // Phản hồi của Admin cho review này
      type: adminReplySchema,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Đảm bảo mỗi user chỉ review một sản phẩm MỘT LẦN
// (Không giới hạn user mua nhiều lần, nhưng chỉ review được 1 lần cho sản phẩm đó)
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// --- Static method để tính toán và cập nhật rating trung bình của Product ---
reviewSchema.statics.calculateAverageRating = async function (productId) {
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    console.error(
      `[Rating Calc] ID sản phẩm không hợp lệ: ${productId}. Bỏ qua tính toán.`
    );
    return; // Không thực hiện nếu ID không hợp lệ
  }
  // Chuyển đổi thành ObjectId để đảm bảo đúng kiểu dữ liệu cho aggregation
  const productObjectId = new mongoose.Types.ObjectId(productId);
  // --------------------------------------
  console.log(`[Review Model] Tính toán rating cho Product ID: ${productId}`);
  try {
    // Sử dụng aggregation pipeline để tính toán
    const stats = await this.aggregate([
      {
        $match: { product: productObjectId, isApproved: true }, // Chỉ tính các review đã duyệt
      },
      {
        $group: {
          _id: "$product", // Nhóm theo productId
          numReviews: { $sum: 1 }, // Đếm số lượng review
          averageRating: { $avg: "$rating" }, // Tính trung bình rating
        },
      },
    ]);

    // console.log('[Review Model] Kết quả stats:', stats);

    if (stats.length > 0) {
      // Nếu có review, cập nhật Product
      const { numReviews, averageRating } = stats[0];
      const roundedRating = Math.round(averageRating * 10) / 10; // Làm tròn đến 1 chữ số thập phân
      await Product.findByIdAndUpdate(productObjectId, {
        numReviews: numReviews,
        averageRating: roundedRating,
      });
      console.log(
        `[Review Model] Đã cập nhật Product ${productObjectId}: numReviews=${numReviews}, averageRating=${roundedRating}`
      );
    } else {
      // Nếu không có review nào (hoặc không có review nào được duyệt)
      await Product.findByIdAndUpdate(productObjectId, {
        numReviews: 0,
        averageRating: 0,
      });
      console.log(
        `[Review Model] Đã cập nhật Product ${productObjectId}: numReviews=0, averageRating=0 (không có review approved)`
      );
    }
  } catch (error) {
    console.error(
      `[Review Model] Lỗi khi tính toán average rating cho Product ${productObjectId}:`,
      error
    );
  }
};

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
