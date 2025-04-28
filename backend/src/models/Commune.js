const mongoose = require("mongoose");

const communeSchema = new mongoose.Schema(
  {
    code: {
      // Sẽ dùng idCommune từ json
      type: String,
      required: true,
      unique: true, // Mã xã/phường nên là duy nhất
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    districtCode: {
      // Liên kết với District qua code (idDistrict)
      type: String,
      required: true,
      index: true, // Index để tìm xã/phường theo quận/huyện nhanh
    },
  },
  { timestamps: false }
);

const Commune = mongoose.model("Commune", communeSchema);
module.exports = Commune;
