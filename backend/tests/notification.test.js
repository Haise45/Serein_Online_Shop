const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/User");
const Notification = require("../src/models/Notification");
const { generateAccessToken } = require("../src/utils/generateToken");

let mongoServer;
let adminToken;
let adminUser;
let regularUserToken;
let regularUser;

// Dữ liệu mẫu
const userData = {
  name: "Regular User",
  email: "user@example.com",
  password: "password123",
  phone: "0912345678",
  isEmailVerified: true,
};
const adminData = {
  name: "Admin User",
  email: "admin@example.com",
  password: "adminPassword123",
  phone: "0987654321",
  role: "admin",
  isEmailVerified: true,
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Tạo admin user và lấy token
  adminUser = await User.create(adminData);
  adminToken = generateAccessToken(adminUser._id);

  // Tạo regular user và lấy token
  regularUser = await User.create(userData);
  regularUserToken = generateAccessToken(regularUser._id);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Xóa tất cả notifications trước mỗi test
  await Notification.deleteMany({});
});

// =========================================
// === LẤY THÔNG BÁO ADMIN (GET /admin) ===
// =========================================
describe("GET /api/v1/notifications/admin", () => {
  let notif1, notif2, notif3, notifForOther;

  beforeEach(async () => {
    // Tạo một số thông báo mẫu
    notif1 = await Notification.create({
      title: "Đơn hàng mới",
      message: "Đơn hàng #123 vừa được đặt.",
      type: "NEW_ORDER_PLACED",
      recipientType: "ADMIN",
      metadata: { orderId: new mongoose.Types.ObjectId() },
    });
    notif2 = await Notification.create({
      title: "User đăng ký",
      message: "User Test mới đăng ký.",
      type: "NEW_USER_REGISTERED",
      recipientType: "ADMIN",
      isRead: true,
      metadata: { userId: regularUser._id },
    });
    notif3 = await Notification.create({
      title: "Sản phẩm sắp hết",
      message: "Sản phẩm ABC sắp hết hàng.",
      type: "PRODUCT_LOW_STOCK",
      recipientType: "ADMIN",
      metadata: { productId: new mongoose.Types.ObjectId() },
    });
    notifForOther = await Notification.create({
      // Thông báo cho user (ví dụ)
      title: "Đơn hàng đã giao",
      message: "Đơn hàng của bạn đã giao",
      type: "ORDER_STATUS_DELIVERED",
      recipientType: "CUSTOMER",
      metadata: {
        orderId: new mongoose.Types.ObjectId(),
        userId: regularUser._id,
      },
    });
  });

  it("Nên trả về danh sách thông báo cho Admin", async () => {
    const res = await request(app)
      .get("/api/v1/notifications/admin")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("notifications");
    expect(res.body.notifications.length).toBe(3); // Chỉ lấy thông báo của ADMIN
    expect(
      res.body.notifications.every((n) => n.recipientType === "ADMIN")
    ).toBe(true);
    expect(res.body.totalNotifications).toBe(3);
  });

  it("Nên phân trang danh sách thông báo", async () => {
    const res = await request(app)
      .get("/api/v1/notifications/admin?page=1&limit=2")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.notifications.length).toBe(2);
    expect(res.body.currentPage).toBe(1);
    expect(res.body.totalPages).toBe(2); // 3 notif / 2 per page
  });

  it("Nên lọc thông báo theo isRead=false", async () => {
    const res = await request(app)
      .get("/api/v1/notifications/admin?isRead=false")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.notifications.length).toBe(2); // notif1 và notif3 chưa đọc
    expect(res.body.notifications.every((n) => n.isRead === false)).toBe(true);
  });

  it("Nên lọc thông báo theo isRead=true", async () => {
    const res = await request(app)
      .get("/api/v1/notifications/admin?isRead=true")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.notifications.length).toBe(1); // notif2 đã đọc
    expect(res.body.notifications[0].isRead).toBe(true);
    expect(res.body.notifications[0]._id.toString()).toBe(
      notif2._id.toString()
    );
  });

  it("Nên sắp xếp thông báo theo createdAt giảm dần (mặc định)", async () => {
    const res = await request(app)
      .get("/api/v1/notifications/admin")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    const notifs = res.body.notifications;
    // Kiểm tra cái mới nhất (notif3) ở đầu
    expect(notifs[0]._id.toString()).toBe(notif3._id.toString());
  });

  it("Nên trả về 403 nếu user thường cố gắng truy cập", async () => {
    const res = await request(app)
      .get("/api/v1/notifications/admin")
      .set("Authorization", `Bearer ${regularUserToken}`);
    expect(res.statusCode).toBe(403);
  });
});

// ======================================================
// === ĐÁNH DẤU ĐÃ ĐỌC (PUT /admin/:id/mark-as-read) ===
// ======================================================
describe("PUT /api/v1/notifications/admin/:id/mark-as-read", () => {
  let unreadNotif;

  beforeEach(async () => {
    unreadNotif = await Notification.create({
      title: "Chưa đọc",
      message: "Test",
      type: "NEW_ORDER_PLACED",
      recipientType: "ADMIN",
    });
  });

  it("Nên đánh dấu một thông báo chưa đọc thành đã đọc", async () => {
    const res = await request(app)
      .put(`/api/v1/notifications/admin/${unreadNotif._id}/mark-as-read`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.isRead).toBe(true);
    expect(res.body._id.toString()).toBe(unreadNotif._id.toString());

    const dbNotif = await Notification.findById(unreadNotif._id);
    expect(dbNotif.isRead).toBe(true);
  });

  it("Nên trả về 404 nếu thông báo không tồn tại", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/v1/notifications/admin/${fakeId}/mark-as-read`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
  });

  it("Nên trả về 400 nếu ID không hợp lệ", async () => {
    const res = await request(app)
      .put("/api/v1/notifications/admin/invalidid/mark-as-read")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(400);
  });
});

// =========================================================
// === ĐÁNH DẤU TẤT CẢ ĐÃ ĐỌC (PUT /admin/mark-all-as-read) ===
// =========================================================
describe("PUT /api/v1/notifications/admin/mark-all-as-read", () => {
  beforeEach(async () => {
    await Notification.create({
      title: "N1",
      message: "M1",
      type: "NEW_ORDER_PLACED",
      recipientType: "ADMIN",
      isRead: false,
    });
    await Notification.create({
      title: "N2",
      message: "M2",
      type: "NEW_USER_REGISTERED",
      recipientType: "ADMIN",
      isRead: false,
    });
    await Notification.create({
      title: "N3",
      message: "M3",
      type: "PRODUCT_LOW_STOCK",
      recipientType: "ADMIN",
      isRead: true,
    }); // 1 cái đã đọc
  });

  it("Nên đánh dấu tất cả thông báo chưa đọc của Admin thành đã đọc", async () => {
    const res = await request(app)
      .put("/api/v1/notifications/admin/mark-all-as-read")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("Đã đánh dấu 2 thông báo là đã đọc."); // Chỉ 2 cái chưa đọc

    const unreadNotifications = await Notification.find({
      recipientType: "ADMIN",
      isRead: false,
    });
    expect(unreadNotifications.length).toBe(0);

    const readNotifications = await Notification.find({
      recipientType: "ADMIN",
      isRead: true,
    });
    expect(readNotifications.length).toBe(3); // Tổng cộng 3 cái của admin
  });

  it("Nên trả về 0 modifiedCount nếu không có thông báo nào chưa đọc", async () => {
    // Đánh dấu tất cả đã đọc trước
    await Notification.updateMany({ recipientType: "ADMIN" }, { isRead: true });

    const res = await request(app)
      .put("/api/v1/notifications/admin/mark-all-as-read")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("Đã đánh dấu 0 thông báo là đã đọc.");
  });
});
