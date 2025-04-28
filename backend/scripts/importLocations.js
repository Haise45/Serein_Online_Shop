const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// Import models
const Province = require("../src/models/Province");
const District = require("../src/models/District");
const Commune = require("../src/models/Commune");
const connectDB = require("../src/config/db");

const importData = async () => {
  try {
    await connectDB(); // Kết nối tới DB

    // Đường dẫn tới file db.json
    const dataPath = path.join(__dirname, "../data/db.json");
    const locationData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

    // --- Xóa dữ liệu cũ (cẩn thận khi chạy trên production) ---
    console.log("Xóa dữ liệu địa lý cũ...");
    await Province.deleteMany({});
    await District.deleteMany({});
    await Commune.deleteMany({});
    console.log("Đã xóa dữ liệu cũ.");

    // --- Import Provinces ---
    console.log("Bắt đầu import Provinces...");
    const provincesToInsert = locationData.province.map((p) => ({
      code: p.idProvince,
      name: p.name,
      countryCode: "VN", // Mặc định là Việt Nam
    }));
    if (provincesToInsert.length > 0) {
      await Province.insertMany(provincesToInsert);
      console.log(`Đã import ${provincesToInsert.length} Provinces.`);
    } else {
      console.log("Không có Province nào để import.");
    }

    // --- Import Districts ---
    console.log("Bắt đầu import Districts...");
    const districtsToInsert = locationData.district.map((d) => ({
      code: d.idDistrict,
      name: d.name,
      provinceCode: d.idProvince, // Liên kết tới province code
    }));
    if (districtsToInsert.length > 0) {
      await District.insertMany(districtsToInsert);
      console.log(`Đã import ${districtsToInsert.length} Districts.`);
    } else {
      console.log("Không có District nào để import.");
    }

    // --- Import Communes ---
    console.log("Bắt đầu import Communes...");
    const communesToInsert = locationData.commune.map((c) => ({
      code: c.idCommune,
      name: c.name,
      districtCode: c.idDistrict, // Liên kết tới district code
    }));
    if (communesToInsert.length > 0) {
      await Commune.insertMany(communesToInsert);
      console.log(`Đã import ${communesToInsert.length} Communes.`);
    } else {
      console.log("Không có Commune nào để import.");
    }

    console.log("Import dữ liệu địa lý hoàn tất!");
    process.exit(); // Thoát script thành công
  } catch (error) {
    console.error("Lỗi trong quá trình import:", error);
    process.exit(1); // Thoát script với lỗi
  }
};

importData();
