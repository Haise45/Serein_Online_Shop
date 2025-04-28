const mongoose = require("mongoose");

const provinceSchema = new mongoose.Schema(
  {
    code: {
      // Sẽ dùng idProvince từ json
      type: String,
      required: true,
      unique: true, // Đảm bảo mã tỉnh là duy nhất
      index: true, // Đánh index để query nhanh hơn
    },
    name: {
      type: String,
      required: true,
    },
    countryCode: {
      // Thêm trường này để sau có thể mở rộng
      type: String,
      required: true,
      default: "VN",
    },
  },
  { timestamps: false }
);

const Province = mongoose.model("Province", provinceSchema);
module.exports = Province;
