const mongoose = require("mongoose");
const slugify = require("slugify");

// Định nghĩa Sub-schema cho Biến thể (Variant)
const variantSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, "Biến thể phải có SKU"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Biến thể phải có giá"],
      min: [0, "Giá không được âm"],
    },
    salePrice: {
      type: Number,
      min: [0, "Giá khuyến mãi không được âm"],
      default: null,
    },
    salePriceEffectiveDate: { type: Date, default: null },
    salePriceExpiryDate: { type: Date, default: null },
    stockQuantity: {
      type: Number,
      required: [true, "Biến thể phải có số lượng tồn kho"],
      min: [0, "Số lượng tồn kho không được âm"],
      default: 0,
    },
    images: {
      // Mảng các URL ảnh biến thể của sản phẩm
      type: [String],
      default: [],
    },
    optionValues: [
      // Mảng các cặp thuộc tính-giá trị xác định biến thể này
      {
        _id: false,
        attributeName: {
          type: String,
          required: [true, "Biến thể phải có tên thuộc tính"],
        },
        value: {
          type: String,
          required: [true, "Biến thể phải có giá trị thuộc tính"],
        },
      },
    ],
  },
  {
    _id: true,
  }
); // Cho phép mỗi variant có _id riêng để dễ quản lý/cập nhật

// Định nghĩa Schema chính cho Sản phẩm (Product)
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Vui lòng nhập tên sản phẩm"],
      trim: true,
      maxlenght: [200, "Tên sản phẩm không được quá 200 ký tự"],
      text: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Vui lòng nhập giá sản phẩm"],
      min: [0, "Giá không được âm"],
    },
    salePrice: {
      type: Number,
      min: [0, "Giá khuyến mãi không được âm"],
      default: null,
    },
    salePriceEffectiveDate: { type: Date, default: null },
    salePriceExpiryDate: { type: Date, default: null },
    sku: {
      type: String,
      sparse: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Vui lòng chọn danh mục cho sản phẩm"],
      index: true,
    },
    images: {
      // Mảng các URL ảnh chính của sản phẩm
      type: [String],
      default: [],
    },
    stockQuantity: {
      type: Number,
      required: function () {
        return !this.variants || this.variants.length === 0;
      }, // Bắt buộc nếu không có variant
      min: [0, "Số lượng tồn kho không được âm"],
      default: 0,
    },
    isPublished: {
      // Trạng thái: true = công khai, false = nháp
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Thêm các trường Rating/Review
    averageRating: {
      type: Number,
      default: 0,
      min: [0, "Điểm đánh giá trung bình không thể âm"],
      max: [5, "Điểm đánh giá trung bình không thể lớn hơn 5"],
    },
    numReviews: {
      // Tổng số lượt đánh giá đã được duyệt
      type: Number,
      default: 0,
      min: [0, "Số lượt đánh giá không thể âm"],
    },
    // Lưu định nghĩa các thuộc tính và giá trị áp dụng cho sản phẩm này
    // Ví dụ: [{ name: 'Màu sắc', values: ['Đỏ', 'Xanh'] }, { name: 'Kích thước', values: ['S', 'M'] }]
    attributes: [
      {
        _id: false,
        name: { type: String, required: true },
        values: { type: [String], required: true, default: [] },
      },
    ],
    totalSold: {
      // Tổng số lượng đã bán (cho sản phẩm này và các biến thể của nó)
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    // Mảng các biến thể sản phẩm (nếu có)
    variants: [variantSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- VIRTUAL FIELD: Tính toán giá hiển thị (displayPrice) ---
// Virtual này sẽ tính giá cuối cùng dựa trên việc có salePrice hợp lệ không
// Áp dụng cho cả Product chính và mỗi Variant
const displayPriceVirtual = function () {
  const now = new Date();
  let effectivePrice = this.price; // Mặc định là giá gốc

  if (this.salePrice !== null && this.salePrice < this.price) {
    const isSaleActive =
      (!this.salePriceEffectiveDate || this.salePriceEffectiveDate <= now) &&
      (!this.salePriceExpiryDate || this.salePriceExpiryDate >= now);

    if (isSaleActive) {
      effectivePrice = this.salePrice;
    }
  }
  return effectivePrice;
};

productSchema.virtual("displayPrice").get(displayPriceVirtual);
variantSchema.virtual("displayPrice").get(displayPriceVirtual); // Áp dụng cả cho variant

// --- VIRTUAL FIELD: Kiểm tra sản phẩm có đang sale không ---
const onSaleVirtual = function () {
  const now = new Date();
  return (
    this.salePrice !== null &&
    this.salePrice < this.price &&
    (!this.salePriceEffectiveDate || this.salePriceEffectiveDate <= now) &&
    (!this.salePriceExpiryDate || this.salePriceExpiryDate >= now)
  );
};
productSchema.virtual("isOnSale").get(onSaleVirtual);
variantSchema.virtual("isOnSale").get(onSaleVirtual);

// --- VIRTUAL FIELD: Kiểm tra sản phẩm có phải MỚI không ---
const IS_NEW_PRODUCT_DAYS_LIMIT = 20; // Số ngày coi là sản phẩm mới
productSchema.virtual("isNew").get(function () {
  if (!this.createdAt) return false;
  const twentyDaysAgo = new Date();
  twentyDaysAgo.setDate(twentyDaysAgo.getDate() - IS_NEW_PRODUCT_DAYS_LIMIT);
  return this.createdAt >= twentyDaysAgo;
});

// Middleware tạo slug tự động
productSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true, locale: "vi" });
  }
  next();
});

// Middleware kiểm tra tính hợp lệ của tồn kho dựa trên biến thể
productSchema.pre("save", function (next) {
  if (this.variants && this.variants.length > 0) {
    // Nếu có biến thể, tồn kho chính không còn ý nghĩa
    // Ở đây ta đặt nó về 0 hoặc null để tránh nhầm lẫn
    this.stockQuantity = 0;
  } else {
    // Nếu không có biến thể, cần có tồn kho chính
    if (this.stockQuantity === undefined || this.stockQuantity === null) {
      // return next(new Error('Sản phẩm không có biến thể phải có số lượng tồn kho chính.'));
      this.stockQuantity = 0; // Hoặc đặt giá trị mặc định
    }
  }
  next();
});

// ---- Indexes ----
// Index cho tìm kiếm text
productSchema.index({ name: "text", description: "text", sku: "text" });

// Index cho lọc và sắp xếp phổ biến
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ category: 1, isPublished: 1, isActive: 1 }); // Index kết hợp

// Đảm bảo SKU biến thể là duy nhất trong toàn bộ collection
productSchema.index(
  { "variants.sku": 1 },
  {
    unique: true,
    partialFilterExpression: {
      "variants.sku": { $exists: true, $ne: null, $ne: "" },
    },
  }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
