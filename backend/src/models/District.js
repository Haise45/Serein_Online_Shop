const mongoose = require("mongoose");

const districtSchema = new mongoose.Schema(
  {
    code: {
      // Sẽ dùng idDistrict từ json
      type: String,
      required: true,
      unique: true, // Mã quận/huyện nên là duy nhất trong cả nước
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    provinceCode: {
      // Liên kết với Province qua code (idProvince)
      type: String,
      required: true,
      index: true, // Index để tìm quận/huyện theo tỉnh nhanh
    },
  },
  { timestamps: false }
);

const District = mongoose.model("District", districtSchema);
module.exports = District;
