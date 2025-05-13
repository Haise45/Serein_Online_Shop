const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("./src/app"); // Import Express app của bạn
const User = require("./src/models/User");
const Cart = require("./src/models/Cart");
const Wishlist = require("./src/models/Wishlist");
const Product = require("./src/models/Product");
const Category = require("./src/models/Category");
const Coupon = require("./src/models/Coupon");
const Order = require("./src/models/Order");
const Notification = require("./src/models/Notification");
const Review = require("./src/models/Review");

let mongoServer;
let server; // Biến lưu trữ HTTP server

// --- Mock hàm gửi email ---
// Tạo một mock cho sendEmail để không thực sự gửi email khi test
// File này thường nằm trong thư mục __mocks__ cùng cấp với thư mục utils
// Hoặc bạn có thể mock trực tiếp như dưới đây nếu không tạo file __mocks__
// jest.mock('../src/utils/sendEmail', () => jest.fn().mockResolvedValue(true));

const setupTestEnvironment = () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Khởi động server trên một port ngẫu nhiên cho test
    // Hoặc bạn có thể dùng một port cố định cho test
    // server = app.listen(0); // 0 sẽ chọn port ngẫu nhiên
    // console.log(`Test server listening on port ${server.address().port}`);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    // if (server) {
    //     await new Promise(resolve => server.close(resolve)); // Đóng server
    // }
  });

  // Dọn dẹp dữ liệu trước mỗi test case (hoặc sau mỗi test case)
  // Dùng beforeEach nếu bạn muốn mỗi test case bắt đầu với DB sạch
  // Dùng afterEach nếu bạn muốn dọn dẹp sau khi test case chạy
  beforeEach(async () => {
    // Hoặc await User.deleteMany({}); await Product.deleteMany({}); ...
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });
};

module.exports = setupTestEnvironment;
