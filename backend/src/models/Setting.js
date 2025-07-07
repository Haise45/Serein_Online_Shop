const mongoose = require("mongoose");

// Dùng một schema duy nhất để lưu tất cả cài đặt
const settingSchema = new mongoose.Schema(
  {
    // Chỉ có một document duy nhất, dùng một trường cố định để tìm kiếm
    key: {
      type: String,
      default: "main_settings",
      unique: true,
      required: true,
    },

    // -- Cài đặt chung --
    defaultLanguage: {
      type: String,
      enum: ["vi", "en"],
      default: "vi",
    },
    defaultCurrency: {
      type: String,
      enum: ["VND", "USD"],
      default: "VND",
    },

    // -- Cài đặt giao diện Client --
    landingPage: {
      maxFeaturedProducts: { type: Number, default: 8 },
      maxNewestProducts: { type: Number, default: 8 },
    },
    productListPage: {
      defaultProductsPerPage: { type: Number, default: 12 },
    },

    // -- Cài đặt giao diện Admin --
    adminTable: {
      defaultItemsPerPage: { type: Number, default: 10 },
    },

    // Thêm các cài đặt khác ở đây trong tương lai
    // ví dụ: socialLinks: { facebook: String, instagram: String }
  },
  { timestamps: true }
);

// Hàm tĩnh để lấy hoặc tạo cài đặt
settingSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ key: "main_settings" });
  if (!settings) {
    console.log("No settings found, creating default settings...");
    settings = await this.create({ key: "main_settings" });
  }
  return settings;
};

const Setting = mongoose.model("Setting", settingSchema);

module.exports = Setting;
