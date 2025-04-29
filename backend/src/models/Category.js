const mongoose = require("mongoose");
const slugify = require("slugify");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Vui lòng nhập tên danh mục"],
      unique: true,
      trim: true,
      maxlenght: [100, "Tên danh mục không được quá 100 ký tự"],
    },
    slug: {
      // Sẽ được tạo từ name
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      maxlenght: [500, "Mô tả không được quá 500 ký tự"],
      trim: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    image: {
      type: String,
    },
    isActive: {
      // Dùng cho soft delete hoặc ẩn/hiện danh mục
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware: Tự động tạo slug trước khi lưu (create hoặc update)
categorySchema.pre("save", function (next) {
  // Chỉ tạo slug nếu name được thay đổi hoặc là document mới
  if (!this.isModified("name")) {
    return next();
  }
  this.slug = slugify(this.name, {
    lower: true,
    strict: true,
    locale: "vi",
  });
  next();
});

// Middleware: Đảm bảo không tự đặt mình làm cha
categorySchema.pre("save", function (next) {
  if (this.parent && this.parent.toString() === this._id.toString()) {
    const err = new Error(
      "Danh mục không thể tự làm danh mục cha của chính nó."
    );
    err.statusCode = 400;
    return next(err);
  } else {
    next();
  }
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
