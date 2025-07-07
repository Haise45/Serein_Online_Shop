const mongoose = require("mongoose");
const slugify = require("slugify");
const i18nStringSchema = require("./schemas/i18nStringSchema");

// === SUB-SCHEMA MỚI CHO THUỘC TÍNH CỦA SẢN PHẨM ===
// Lưu trữ tham chiếu đến thuộc tính và các giá trị đã chọn
const productAttributeSchema = new mongoose.Schema(
  {
    attribute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attribute", // Tham chiếu đến model Attribute
      required: true,
    },
    values: [
      {
        // Đây là _id của subdocument trong mảng `values` của model Attribute
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
  },
  { _id: false }
);

// === SUB-SCHEMA MỚI CHO CÁC LỰA CHỌN CỦA MỘT BIẾN THỂ ===
const variantOptionValueSchema = new mongoose.Schema(
  {
    attribute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attribute",
      required: true,
    },
    value: {
      // Đây là _id của subdocument giá trị trong model Attribute
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  { _id: false }
);

// === SUB-SCHEMA CHO BIẾN THỂ (VARIANT) ===
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
    images: { type: [String], default: [] },
    optionValues: [variantOptionValueSchema],
  },
  { _id: true }
);

// === SCHEMA CHÍNH CHO SẢN PHẨM (PRODUCT) ===
const productSchema = new mongoose.Schema(
  {
    name: {
      type: i18nStringSchema,
      required: [true, "Vui lòng nhập tên sản phẩm"],
      trim: true,
      maxlenght: [200, "Tên sản phẩm không được quá 200 ký tự"],
    },
    slug: { type: String, unique: true, index: true },
    description: { type: i18nStringSchema, trim: true },
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
    sku: { type: String, sparse: true, trim: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Vui lòng chọn danh mục cho sản phẩm"],
      index: true,
    },
    images: { type: [String], default: [] },
    stockQuantity: {
      type: Number,
      required: function () {
        return !this.variants || this.variants.length === 0;
      },
      min: [0, "Số lượng tồn kho không được âm"],
      default: 0,
    },
    isPublished: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, "Điểm đánh giá trung bình không thể âm"],
      max: [5, "Điểm đánh giá trung bình không thể lớn hơn 5"],
    },
    numReviews: {
      type: Number,
      default: 0,
      min: [0, "Số lượt đánh giá không thể âm"],
    },

    attributes: [productAttributeSchema],

    totalSold: { type: Number, default: 0, min: 0, index: true },
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
productSchema.virtual("isConsideredNew").get(function () {
  if (!this.createdAt) return false;
  const twentyDaysAgo = new Date();
  twentyDaysAgo.setDate(twentyDaysAgo.getDate() - IS_NEW_PRODUCT_DAYS_LIMIT);
  return this.createdAt >= twentyDaysAgo;
});

// Middleware tạo slug tự động
productSchema.pre("save", function (next) {
  // Chỉ tạo slug nếu tên Tiếng Việt được thay đổi
  if (this.isModified("name.vi")) {
    this.slug = slugify(this.name.vi, {
      lower: true,
      strict: true,
      locale: "vi",
    });
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
productSchema.index(
  {
    "name.vi": "text",
    "name.en": "text",
    "description.vi": "text",
    "description.en": "text",
    sku: "text",
    "variants.sku": "text",
  },
  {
    weights: {
      "name.vi": 10, // Tên sản phẩm có trọng số cao nhất
      "name.en": 10,
      sku: 8,
      "variants.sku": 8,
      "description.vi": 2,
      "description.en": 2,
    },
    name: "ProductSearchIndex", // Đặt tên cụ thể cho index
  }
);

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
