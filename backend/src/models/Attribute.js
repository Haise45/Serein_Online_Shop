const mongoose = require("mongoose");
const slugify = require("slugify");

// Schema value
const valueSchema = new mongoose.Schema({
  value: {
    type: String,
    required: [true, "Vui lòng nhập giá trị"],
    trim: true,
  },
  // Trường meta để lưu dữ liệu bổ sung, ví dụ mã màu hex
  meta: {
    type: Object,
    default: {},
  },
});

const attributeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Vui lòng nhập tên thuộc tính"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    // Label là tên hiển thị (VD: "Màu sắc")
    label: {
      type: String,
      required: true,
    },
    // Mảng các giá trị được nhúng
    values: [valueSchema],
  },
  {
    timestamps: true,
  }
);

// Middleware tạo slug
attributeSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model("Attribute", attributeSchema);
