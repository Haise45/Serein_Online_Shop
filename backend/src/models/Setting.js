const mongoose = require("mongoose");
const i18nStringSchema = require("./schemas/i18nStringSchema");

const bannerSlideSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  title: { type: i18nStringSchema, required: true },
  subtitle: { type: i18nStringSchema, required: true },
  buttonText: { type: i18nStringSchema, required: true },
  buttonLink: { type: String, required: true },
  isActive: { type: Boolean, default: true },
});

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
    clientSettings: {
      defaultLanguage: { type: String, enum: ["vi", "en"], default: "vi" },
      defaultCurrency: { type: String, enum: ["VND", "USD"], default: "VND" },
    },

    adminSettings: {
      defaultLanguage: { type: String, enum: ["vi", "en"], default: "vi" },
      defaultCurrency: { type: String, enum: ["VND", "USD"], default: "VND" },
    },

    // -- Cài đặt giao diện Client --
    landingPage: {
      maxFeaturedProducts: { type: Number, default: 8 },
      maxNewestProducts: { type: Number, default: 8 },
      banners: [bannerSlideSchema],
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
