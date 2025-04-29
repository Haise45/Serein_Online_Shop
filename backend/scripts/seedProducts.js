// seed.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load biến môi trường
dotenv.config({ path: path.resolve(__dirname, "../.env") }); // Đảm bảo đường dẫn đúng

// Import Models
const Product = require("../src/models/Product");
const Category = require("../src/models/Category");
const User = require("../src/models/User"); // Có thể cần nếu bạn muốn seed cả user admin

// Import hàm kết nối DB
const connectDB = require("../src/config/db");

// Kết nối DB
connectDB();

// Đọc dữ liệu từ file JSON
let seedData;
try {
  const dataPath = path.join(__dirname, "../data/seedData.json"); // Đường dẫn tới file seed
  const jsonData = fs.readFileSync(dataPath, "utf-8");
  seedData = JSON.parse(jsonData);
  // Chuyển đổi các chuỗi ObjectId trong seedData thành ObjectId thực sự
  seedData.categories = seedData.categories.map((cat) => ({
    ...cat,
    _id: new mongoose.Types.ObjectId(cat._id),
    parent: cat.parent ? new mongoose.Types.ObjectId(cat.parent) : null,
  }));
  seedData.products = seedData.products.map((prod) => ({
    ...prod,
    category: new mongoose.Types.ObjectId(prod.category),
    // Không cần chuyển đổi _id của product vì insertMany sẽ tự tạo
  }));
} catch (err) {
  console.error("Lỗi đọc hoặc parse file seedData.json:", err);
  process.exit(1);
}

// Hàm nhập dữ liệu
const importData = async () => {
  try {
    // Xóa dữ liệu cũ (CẨN THẬN KHI CHẠY TRÊN PRODUCTION)
    console.log("Đang xóa dữ liệu cũ...");
    await Product.deleteMany();
    await Category.deleteMany();
    console.log("Đã xóa dữ liệu cũ.");

    // Chèn dữ liệu mới
    console.log("Đang chèn Categories...");
    await Category.insertMany(seedData.categories);
    console.log("Đã chèn Categories.");

    console.log("Đang chèn Products...");
    await Product.insertMany(seedData.products);
    console.log("Đã chèn Products.");

    console.log("Seed dữ liệu thành công!");
    process.exit(); // Thoát tiến trình thành công
  } catch (error) {
    console.error("Lỗi khi seed dữ liệu:", error);
    process.exit(1); // Thoát tiến trình với lỗi
  }
};

// Hàm xóa dữ liệu
const destroyData = async () => {
  try {
    console.log("Đang xóa toàn bộ Products và Categories...");
    await Product.deleteMany();
    await Category.deleteMany();
    console.log("Đã xóa dữ liệu.");
    process.exit();
  } catch (error) {
    console.error("Lỗi khi xóa dữ liệu:", error);
    process.exit(1);
  }
};

// Xử lý tham số dòng lệnh
// node seed.js -> chạy importData
// node seed.js -d -> chạy destroyData
if (process.argv[2] === "-d") {
  destroyData();
} else {
  importData();
}
