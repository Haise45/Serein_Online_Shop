const mongoose = require("mongoose");

// Schema này sẽ được nhúng vào các model khác
const i18nStringSchema = new mongoose.Schema(
  {
    vi: {
      type: String,
      required: [true, "Giá trị Tiếng Việt là bắt buộc."],
      trim: true,
    },
    en: {
      type: String,
      required: [true, "Giá trị Tiếng Anh là bắt buộc."],
      trim: true,
    },
  },
  { _id: false }
); // _id: false để không tự tạo _id cho object này

module.exports = i18nStringSchema;
