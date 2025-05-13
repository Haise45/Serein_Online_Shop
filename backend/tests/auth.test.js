const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/User");
const Cart = require("../src/models/Cart");
const Wishlist = require("../src/models/Wishlist");
const Notification = require("../src/models/Notification");

let mongoServer;
let agent; // Để giữ cookie giữa các request

// --- Mock sendEmail ---
jest.mock("../src/utils/sendEmail", () => jest.fn().mockResolvedValue(true));
// --- Mock createAdminNotification ---
jest.mock("../src/utils/notificationUtils", () => ({
  createAdminNotification: jest.fn().mockResolvedValue(true),
}));

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  // Ghi đè MONGODB_URI nếu cần, hoặc đảm bảo Mongoose dùng URI này
  process.env.MONGODB_URI_TEST = mongoUri; // Dùng một biến riêng nếu Mongoose config của bạn phức tạp
  await mongoose.connect(mongoUri);
  agent = request.agent(app); // Tạo agent để giữ cookie
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Dọn dẹp DB trước mỗi test
beforeEach(async () => {
  await User.deleteMany({});
  await Cart.deleteMany({});
  await Wishlist.deleteMany({});
  await Notification.deleteMany({});
  // Xóa các collection khác nếu cần
});

// --- Dữ liệu mẫu cho User ---
const userData = {
  name: "Test User",
  email: "test@example.com",
  password: "password123",
  phone: "0987654321",
};
const adminData = {
  name: "Admin User",
  email: "admin@example.com",
  password: "adminPassword123",
  phone: "0123456789",
  role: "admin",
  isEmailVerified: true, // Admin thường đã verify
};

// ========================
// === ĐĂNG KÝ (REGISTER) ===
// ========================
describe("POST /api/v1/auth/register", () => {
  it("Nên đăng ký user mới thành công và gửi OTP", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(userData);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty(
      "message",
      "Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP xác thực tài khoản."
    );
    expect(res.body).toHaveProperty("userId");

    // Kiểm tra DB
    const user = await User.findById(res.body.userId);
    expect(user).not.toBeNull();
    expect(user.email).toBe(userData.email.toLowerCase());
    expect(user.isEmailVerified).toBe(false);
    expect(user.emailVerificationToken).toBeDefined();
    expect(user.emailVerificationExpires).toBeDefined();

    // Kiểm tra sendEmail đã được gọi
    const sendEmailMock = require("../src/utils/sendEmail");
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
  });

  it("Nên trả về 400 nếu thiếu trường bắt buộc", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "test@example.com", password: "password123" }); // Thiếu name, phone
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Tên" là trường bắt buộc'); // Kiểm tra message lỗi từ Joi
    expect(res.body.message).toContain('Số điện thoại" là trường bắt buộc');
  });

  it("Nên trả về 400 nếu email đã tồn tại", async () => {
    await User.create(userData); // Tạo user trước
    const res = await request(app).post("/api/v1/auth/register").send(userData);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Email đã được sử dụng.");
  });

  it("Nên trả về 400 nếu số điện thoại đã tồn tại", async () => {
    await User.create({ ...userData, email: "another@example.com" }); // Tạo user với email khác nhưng cùng SĐT
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...userData, email: "newemail@example.com" }); // SĐT trùng, email mới
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Số điện thoại đã được sử dụng.");
  });
});

// ==================================
// === XÁC THỰC OTP (VERIFY EMAIL) ===
// ==================================
describe("POST /api/v1/auth/verify-email", () => {
  let userToVerify;
  let otp;

  beforeEach(async () => {
    // Tạo user chưa verify để test
    const newUser = new User({ ...userData, isEmailVerified: false });
    otp = newUser.createEmailVerificationOTP(); // Lấy OTP
    await newUser.save();
    userToVerify = newUser;
  });

  it("Nên xác thực email thành công với OTP hợp lệ", async () => {
    const res = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({ email: userToVerify.email, otp: otp });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe(
      "Xác thực email thành công! Tài khoản của bạn đã được kích hoạt."
    );
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body.isEmailVerified).toBe(true);

    // Kiểm tra cookie refreshToken (nếu agent được dùng đúng)
    // Hoặc kiểm tra header 'set-cookie'
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies.some((cookie) => cookie.startsWith("refreshToken="))).toBe(
      true
    );

    const dbUser = await User.findById(userToVerify._id);
    expect(dbUser.isEmailVerified).toBe(true);
    expect(dbUser.emailVerificationToken).toBeUndefined();
    expect(dbUser.emailVerificationExpires).toBeUndefined();
  });

  it("Nên trả về 400 nếu OTP sai", async () => {
    const res = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({ email: userToVerify.email, otp: "000000" });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Mã OTP không chính xác.");
  });

  it("Nên trả về 400 nếu OTP hết hạn", async () => {
    // Đặt thời gian hết hạn về quá khứ
    userToVerify.emailVerificationExpires = new Date(
      Date.now() - 1000 * 60 * 15
    ); // 15 phút trước
    await userToVerify.save();

    const res = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({ email: userToVerify.email, otp: otp });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(
      "Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại."
    );
  });

  it("Nên trả về 400 nếu email đã được xác thực", async () => {
    userToVerify.isEmailVerified = true;
    userToVerify.emailVerificationToken = undefined;
    userToVerify.emailVerificationExpires = undefined;
    await userToVerify.save();

    const res = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({ email: userToVerify.email, otp: "123456" }); // OTP không quan trọng
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Email này đã được xác thực trước đó.");
  });
});

// ======================================
// === GỬI LẠI OTP (RESEND VERIFY EMAIL) ===
// ======================================
describe("POST /api/v1/auth/resend-verification-email", () => {
  let userToResend;

  beforeEach(async () => {
    const newUser = new User({ ...userData, isEmailVerified: false });
    newUser.createEmailVerificationOTP(); // Tạo OTP ban đầu
    await newUser.save();
    userToResend = newUser;
  });

  it("Nên gửi lại OTP thành công cho email chưa xác thực", async () => {
    const sendEmailMock = require("../src/utils/sendEmail");
    sendEmailMock.mockClear(); // Xóa mock cũ

    const res = await request(app)
      .post("/api/v1/auth/resend-verification-email")
      .send({ email: userToResend.email });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe(
      "Mã OTP xác thực mới đã được gửi đến email của bạn."
    );
    expect(sendEmailMock).toHaveBeenCalledTimes(1);

    const dbUser = await User.findById(userToResend._id);
    expect(dbUser.emailVerificationToken).toBeDefined();
    expect(dbUser.emailVerificationToken).not.toBe(
      userToResend.emailVerificationToken
    ); // OTP phải mới
  });

  it("Nên trả về 400 nếu email đã được xác thực", async () => {
    userToResend.isEmailVerified = true;
    await userToResend.save();
    const res = await request(app)
      .post("/api/v1/auth/resend-verification-email")
      .send({ email: userToResend.email });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Email này đã được xác thực.");
  });

  it("Nên trả về 200 (thông báo chung) nếu email không tồn tại", async () => {
    const res = await request(app)
      .post("/api/v1/auth/resend-verification-email")
      .send({ email: "nonexistent@example.com" });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe(
      "Nếu email tồn tại và chưa xác thực, mã OTP mới sẽ được gửi."
    );
  });
});

// =======================================
// === ĐĂNG NHẬP (LOGIN - ACCESS TOKEN ONLY) ===
// =======================================
describe("POST /api/v1/auth/login", () => {
  let verifiedUser;

  beforeEach(async () => {
    // Tạo user đã verify để test login
    const user = new User({ ...userData, isEmailVerified: true });
    await user.save(); // Password sẽ được hash bởi pre-save hook
    verifiedUser = user;
  });

  it("Nên đăng nhập thành công và chỉ trả về accessToken", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: verifiedUser.email, password: userData.password });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body.email).toBe(verifiedUser.email);
    expect(res.body.isEmailVerified).toBe(true);
  });

  it("Nên trả về 401 nếu sai mật khẩu", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: verifiedUser.email, password: "wrongpassword" });
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Email hoặc mật khẩu không đúng.");
  });

  it("Nên trả về 401 nếu email không tồn tại", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "nonexistent@example.com", password: "password123" });
    expect(res.statusCode).toBe(401);
  });

  it("Nên trả về 400 nếu thiếu email hoặc password", async () => {
    const res1 = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: verifiedUser.email });
    expect(res1.statusCode).toBe(400);
    expect(res1.body.message).toContain(
      'Dữ liệu không hợp lệ: "Mật khẩu" là trường bắt buộc'
    );

    const res2 = await request(app)
      .post("/api/v1/auth/login")
      .send({ password: userData.password });
    expect(res2.statusCode).toBe(400);
    expect(res2.body.message).toContain(
      'Dữ liệu không hợp lệ: "Email" là trường bắt buộc'
    );
  });
});

// =======================================================
// === ĐĂNG NHẬP (LOGIN-REFRESH - ACCESS & REFRESH TOKEN) ===
// =======================================================
describe("POST /api/v1/auth/login-refresh", () => {
  let verifiedUser;

  beforeEach(async () => {
    const user = new User({ ...userData, isEmailVerified: true });
    await user.save();
    verifiedUser = user;
  });

  it("Nên đăng nhập thành công và trả về accessToken, set refreshToken cookie", async () => {
    const res = await request(app) // Hoặc dùng agent nếu muốn test cookie xuyên suốt
      .post("/api/v1/auth/login-refresh")
      .send({ email: verifiedUser.email, password: userData.password });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body.email).toBe(verifiedUser.email);

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies.some((cookie) => cookie.startsWith("refreshToken="))).toBe(
      true
    );
    expect(cookies.some((cookie) => cookie.includes("HttpOnly"))).toBe(true); // Kiểm tra cờ HttpOnly
  });
  // Các test case lỗi tương tự như /login
});

// =============================
// === REFRESH TOKEN ===
// =============================
describe("POST /api/v1/auth/refresh", () => {
  let refreshTokenCookie;
  let userId;

  beforeEach(async () => {
    const user = new User({ ...userData, isEmailVerified: true });
    await user.save();
    userId = user._id;

    // Đăng nhập để lấy refreshToken cookie
    const loginRes = await request(app)
      .post("/api/v1/auth/login-refresh")
      .send({ email: userData.email, password: userData.password });
    refreshTokenCookie = loginRes.headers["set-cookie"].find((cookie) =>
      cookie.startsWith("refreshToken=")
    );
  });

  it("Nên làm mới accessToken thành công với refreshToken hợp lệ", async () => {
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", refreshTokenCookie); // Gửi cookie refreshToken đã lấy

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body._id.toString()).toBe(userId.toString());
  });

  it("Nên trả về 401 nếu không có refreshToken cookie", async () => {
    const res = await request(app).post("/api/v1/auth/refresh");
    // Không set cookie
    expect(res.statusCode).toBe(401); // Controller trả 401 nếu không có token
    expect(res.body.message).toBe("Không tìm thấy refresh token.");
  });

  it("Nên trả về 403 nếu refreshToken không hợp lệ hoặc hết hạn", async () => {
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .set(
        "Cookie",
        "refreshToken=invalidOrExpiredToken; Path=/; HttpOnly; SameSite=Lax"
      ); // Gửi token sai
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe(
      "Refresh token không hợp lệ hoặc đã hết hạn."
    );
  });
});

// =============================
// === LOGOUT ===
// =============================
describe("POST /api/v1/auth/logout", () => {
  it("Nên đăng xuất thành công và xóa refreshToken cookie", async () => {
    // Đăng nhập trước để có cookie
    await request(app)
      .post("/api/v1/auth/login-refresh")
      .send({ email: userData.email, password: userData.password }); // Đăng ký user trước nếu cần

    const res = await request(app).post("/api/v1/auth/logout");
    // Agent sẽ tự gửi cookie (nếu dùng agent)
    // Nếu không dùng agent, cần lấy cookie từ login-refresh rồi set cho request logout

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Đăng xuất thành công.");

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const clearedRefreshTokenCookie = cookies.find((cookie) =>
      cookie.startsWith("refreshToken=")
    );
    expect(clearedRefreshTokenCookie).toContain("refreshToken=;"); // Giá trị rỗng
    expect(clearedRefreshTokenCookie).toContain(
      "Expires=Thu, 01 Jan 1970 00:00:00 GMT"
    ); // Hết hạn trong quá khứ
  });
});

// =============================
// === FORGOT PASSWORD ===
// =============================
describe("POST /api/v1/auth/forgot-password", () => {
  beforeEach(async () => {
    await User.create({ ...userData, isEmailVerified: true });
  });

  it("Nên gửi email reset mật khẩu thành công", async () => {
    const sendEmailMock = require("../src/utils/sendEmail");
    sendEmailMock.mockClear();

    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: userData.email });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe(
      "Hướng dẫn đặt lại mật khẩu đã được gửi tới email của bạn."
    );
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMock.mock.calls[0][0].email).toBe(userData.email);
    expect(sendEmailMock.mock.calls[0][0].subject).toContain(
      "Yêu cầu đặt lại mật khẩu"
    );

    const user = await User.findOne({ email: userData.email });
    expect(user.passwordResetToken).toBeDefined();
    expect(user.passwordResetExpires).toBeDefined();
  });

  it("Nên trả về 200 (thông báo chung) nếu email không tồn tại", async () => {
    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "nonexistent@example.com" });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe(
      "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu."
    );
  });
});

// =============================
// === RESET PASSWORD ===
// =============================
describe("PUT /api/v1/auth/reset-password/:token", () => {
  let userToReset;
  let resetTokenPlain;

  beforeEach(async () => {
    const user = new User({ ...userData, isEmailVerified: true });
    resetTokenPlain = user.createPasswordResetToken(); // Lấy token thô
    await user.save();
    userToReset = user;
  });

  it("Nên reset mật khẩu thành công với token hợp lệ", async () => {
    const newPassword = "newPassword456";
    const res = await request(app)
      .put(`/api/v1/auth/reset-password/${resetTokenPlain}`)
      .send({ password: newPassword });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Mật khẩu đã được cập nhật thành công.");

    const updatedUser = await User.findById(userToReset._id);
    expect(updatedUser.passwordResetToken).toBeUndefined();
    expect(updatedUser.passwordResetExpires).toBeUndefined();
    // Kiểm tra mật khẩu mới đã được hash và lưu
    const isMatch = await updatedUser.matchPassword(newPassword);
    expect(isMatch).toBe(true);
  });

  it("Nên trả về 400 nếu token không hợp lệ", async () => {
    const res = await request(app)
      .put("/api/v1/auth/reset-password/invalidtoken")
      .send({ password: "newPassword456" });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Token không hợp lệ hoặc đã hết hạn.");
  });

  it("Nên trả về 400 nếu token đã hết hạn", async () => {
    userToReset.passwordResetExpires = new Date(Date.now() - 1000 * 60 * 15); // Hết hạn 15 phút trước
    await userToReset.save();

    const res = await request(app)
      .put(`/api/v1/auth/reset-password/${resetTokenPlain}`)
      .send({ password: "newPassword456" });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Token không hợp lệ hoặc đã hết hạn.");
  });

  it("Nên trả về 400 nếu mật khẩu mới quá ngắn", async () => {
    const res = await request(app)
      .put(`/api/v1/auth/reset-password/${resetTokenPlain}`)
      .send({ password: "123" }); // Mật khẩu < 6 ký tự
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Mật khẩu phải có ít nhất 6 ký tự.");
  });
});
