const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/User");
const Product = require("../src/models/Product");
const Wishlist = require("../src/models/Wishlist");
const Category = require("../src/models/Category");
const { generateAccessToken } = require("../src/utils/generateToken");
const crypto = require("crypto");

// --- Mock sendEmail (đảm bảo nó được mock để không gửi mail thật) ---
const sendEmailMock = require("../src/utils/sendEmail");
jest.mock("../src/utils/sendEmail", () => jest.fn().mockResolvedValue(true));
// --- Mock createAdminNotification (nếu register có gọi) ---
jest.mock("../src/utils/notificationUtils", () => ({
  createAdminNotification: jest.fn().mockResolvedValue(true),
}));

let mongoServer;
let userToken; // Token của user đã đăng nhập và verify
let userId;
let product1, product2, inactiveProduct, guestProduct;
let testCategory;
let agent; // Agent cho guest requests
let userAgent; // Agent cho user đã đăng nhập (để giữ token và cookie nếu cần)

const loggedInUserData = {
  name: "Wishlist LoggedIn User",
  email: "wishlistloggedin@example.com",
  password: "password123",
  phone: "0977777777",
  isEmailVerified: true,
};
const guestUserRegisterData = {
  name: "New Reg User",
  email: "newregister@example.com",
  password: "password123",
  phone: "0966666666",
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Tạo user đã đăng nhập và verify sẵn để test các chức năng của user
  const loggedInUser = await User.create(loggedInUserData);
  userId = loggedInUser._id;
  userToken = generateAccessToken(userId);

  testCategory = await Category.create({
    name: "Test Cat WL",
    slug: "test-cat-wl",
  });
  product1 = await Product.create({
    name: "Wish Product 1",
    price: 100,
    category: testCategory._id,
    sku: "WP001",
    stockQuantity: 10,
    isPublished: true,
    isActive: true,
  });
  product2 = await Product.create({
    name: "Wish Product 2",
    price: 200,
    category: testCategory._id,
    sku: "WP002",
    stockQuantity: 5,
    isPublished: true,
    isActive: true,
  });
  inactiveProduct = await Product.create({
    name: "Wish Inactive Prod",
    price: 50,
    category: testCategory._id,
    sku: "WIP003",
    stockQuantity: 5,
    isPublished: false,
    isActive: true,
  });
  guestProduct = await Product.create({
    name: "Guest Fav Product",
    price: 500,
    category: testCategory._id,
    sku: "GUESTFAV001",
    stockQuantity: 10,
    isPublished: true,
    isActive: true,
  });

  agent = request.agent(app); // Agent cho guest (sẽ tự quản lý cookie)
  userAgent = request.agent(app); // Agent cho user đã login
  // Login userAgent để nó có token và cookie (nếu API login-refresh được dùng và set cookie)
  // Tuy nhiên, chúng ta sẽ set Authorization header thủ công cho userAgent với userToken
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Wishlist.deleteMany({});
  // Xóa user đăng ký mới để tránh lỗi trùng email/phone trong các test merge
  await User.deleteMany({ email: guestUserRegisterData.email });
  await User.deleteMany({ phone: guestUserRegisterData.phone });
});

// ============================================
// === WISHLIST - GUEST (KHÁCH VÃNG LAI) ===
// ============================================
describe("Wishlist API for Guests", () => {
  it("Guest: Nên thêm sản phẩm vào wishlist và nhận cookie wishlistGuestId", async () => {
    const res = await agent // Dùng agent của guest
      .post(`/api/v1/wishlist/${product1._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe(
      "Sản phẩm đã được thêm vào danh sách yêu thích."
    );

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const wishlistGuestCookie = cookies.find((cookie) =>
      cookie.startsWith("wishlistGuestId=")
    );
    expect(wishlistGuestCookie).toBeDefined();
    const guestIdValue = wishlistGuestCookie.split(";")[0].split("=")[1];

    const dbWishlist = await Wishlist.findOne({ guestId: guestIdValue });
    expect(dbWishlist).not.toBeNull();
    expect(dbWishlist.items).toHaveLength(1);
    expect(dbWishlist.items[0].toString()).toBe(product1._id.toString());
  });

  it("Guest: Nên lấy được wishlist của mình (dựa vào cookie)", async () => {
    const guestAgentInstance = request.agent(app); // Tạo agent mới cho test này
    await guestAgentInstance.post(`/api/v1/wishlist/${product1._id}`);
    await guestAgentInstance.post(`/api/v1/wishlist/${product2._id}`);

    const res = await guestAgentInstance.get("/api/v1/wishlist");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(
      res.body.find((p) => p._id.toString() === product1._id.toString())
    ).toBeDefined();
  });

  it("Guest: Nên xóa sản phẩm khỏi wishlist của mình", async () => {
    const guestAgentInstance = request.agent(app);
    await guestAgentInstance.post(`/api/v1/wishlist/${product1._id}`);
    await guestAgentInstance.post(`/api/v1/wishlist/${product2._id}`);

    const resDelete = await guestAgentInstance.delete(
      `/api/v1/wishlist/${product1._id}`
    );
    expect(resDelete.statusCode).toBe(200);

    const resGet = await guestAgentInstance.get("/api/v1/wishlist");
    expect(resGet.body.length).toBe(1);
    expect(
      resGet.body.find((p) => p._id.toString() === product2._id.toString())
    ).toBeDefined();
  });
});

// =========================================
// === WISHLIST - USER (ĐÃ ĐĂNG NHẬP) ===
// =========================================
describe("Wishlist API for Logged-in Users", () => {
  it("User: Nên thêm sản phẩm vào wishlist thành công", async () => {
    const res = await request(app)
      .post(`/api/v1/wishlist/${product1._id}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    const dbWishlist = await Wishlist.findOne({ user: userId });
    expect(dbWishlist).not.toBeNull();
    expect(dbWishlist.items).toContainEqual(product1._id);
  });

  it("User: Nên không thêm trùng lặp nếu sản phẩm đã có trong wishlist", async () => {
    await request(app)
      .post(`/api/v1/wishlist/${product1._id}`)
      .set("Authorization", `Bearer ${userToken}`);
    const res = await request(app)
      .post(`/api/v1/wishlist/${product1._id}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    const dbWishlist = await Wishlist.findOne({ user: userId });
    expect(
      dbWishlist.items.filter((id) => id.equals(product1._id)).length
    ).toBe(1);
  });

  it("User: Nên lấy được danh sách sản phẩm trong wishlist đã được populate", async () => {
    await Wishlist.findOneAndUpdate(
      { user: userId },
      { $addToSet: { items: [product1._id, product2._id] } },
      { new: true, upsert: true }
    );
    const res = await request(app)
      .get("/api/v1/wishlist")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).toHaveProperty("name");
    expect(res.body[0]).toHaveProperty("category");
  });

  it("User: Nên xóa sản phẩm khỏi wishlist thành công", async () => {
    await Wishlist.findOneAndUpdate(
      { user: userId },
      { items: [product1._id, product2._id] },
      { upsert: true }
    );
    const res = await request(app)
      .delete(`/api/v1/wishlist/${product1._id}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    const dbWishlist = await Wishlist.findOne({ user: userId });
    expect(dbWishlist.items).not.toContainEqual(product1._id);
    expect(dbWishlist.items).toContainEqual(product2._id);
  });
});

// ===============================================
// === GỘP WISHLIST KHI GUEST ĐĂNG NHẬP/ĐĂNG KÝ ===
// ===============================================
describe("Wishlist Merging on User Authentication", () => {
  it("Nên gộp wishlist của guest vào user khi GUEST ĐĂNG KÝ và VERIFY EMAIL", async () => {
    const guestSpecificAgent = request.agent(app); // Agent riêng cho luồng guest này
    // 1. Guest thêm sản phẩm vào wishlist
    await guestSpecificAgent.post(`/api/v1/wishlist/${guestProduct._id}`);
    let guestWishlistRes = await guestSpecificAgent.get("/api/v1/wishlist");
    expect(guestWishlistRes.body.length).toBe(1);
    expect(guestWishlistRes.body[0]._id.toString()).toBe(
      guestProduct._id.toString()
    );

    // 2. Guest đăng ký
    const guestUserRegisterData = {
      name: "New Reg User Test",
      email: "newregistertest@example.com",
      password: "password123",
      phone: "0912345678",
    };
    const registerRes = await guestSpecificAgent
      .post("/api/v1/auth/register")
      .send(guestUserRegisterData);
    expect(registerRes.statusCode).toBe(201);
    const registeredUserId = registerRes.body.userId;

    // 3. Guest verify email
    const dbUserForOtp = await User.findById(registeredUserId);
    expect(dbUserForOtp).not.toBeNull();
    const plainOtpToSend = "123456";
    const hashedOtpForDB = crypto
      .createHash("sha256")
      .update(plainOtpToSend)
      .digest("hex");
    await User.findByIdAndUpdate(registeredUserId, {
      emailVerificationToken: hashedOtpForDB,
      emailVerificationExpires: Date.now() + 10 * 60 * 1000, // Đảm bảo còn hạn
    });
    // Kiểm tra lại dbUserForOtp sau khi cập nhật
    const updatedDbUserForOtp = await User.findById(registeredUserId);
    console.log("--- User trong DB sau khi cập nhật OTP hash cho test ---");
    console.log(JSON.stringify(updatedDbUserForOtp, null, 2));
    console.log("-------------------------------------------------------");

    // Dữ liệu để gửi đi
    const verificationData = {
      email: guestUserRegisterData.email,
      otp: plainOtpToSend,
    }; // <<< Gửi OTP GỐC
    console.log("--- Dữ liệu gửi đi để Verify Email ---");
    console.log(JSON.stringify(verificationData, null, 2));
    console.log("------------------------------------------");

    const verifyRes = await guestSpecificAgent
      .post("/api/v1/auth/verify-email")
      .send(verificationData); // Gửi email và OTP GỐC

    // Log response nếu lỗi để debug
    if (verifyRes.statusCode !== 200) {
      console.error("Lỗi khi Verify Email:", verifyRes.body);
    }
    expect(verifyRes.statusCode).toBe(200); // Mong đợi 200 OK

    const userLoginToken = verifyRes.body.accessToken;

    // 4. Kiểm tra wishlist của user sau khi verify (đã merge)
    const userWishlistAfterMerge = await request(app)
      .get("/api/v1/wishlist")
      .set("Authorization", `Bearer ${userLoginToken}`);

    expect(userWishlistAfterMerge.statusCode).toBe(200);
    expect(userWishlistAfterMerge.body.length).toBe(1);
    expect(
      userWishlistAfterMerge.body.some(
        (item) => item._id.toString() === guestProduct._id.toString()
      )
    ).toBe(true);

    // 5. Kiểm tra cookie wishlistGuestId đã bị xóa khỏi response của verify
    const cookiesAfterVerify = verifyRes.headers["set-cookie"];
    const finalGuestWishlistCookie = guestSpecificAgent.jar.getCookie(
      "wishlistGuestId",
      { path: "/" }
    );
    expect(finalGuestWishlistCookie).toBeUndefined();

    // 6. Kiểm tra DB: Wishlist của guest đã bị xóa
    // Lấy guestId từ cookie của agent TRƯỚC khi nó bị xóa
    const guestIdBeforeLogin = guestSpecificAgent.jar
      .getCookies({ path: "/" })
      .find((c) => c.key === "wishlistGuestId")?.value;
    if (guestIdBeforeLogin) {
      const guestWishlistDb = await Wishlist.findOne({
        guestId: guestIdBeforeLogin,
      });
      expect(guestWishlistDb).toBeNull();
    }
  });

  it("Nên gộp wishlist của guest vào user khi GUEST ĐĂNG NHẬP vào tài khoản hiện có", async () => {
    // User hiện có (userId, userToken) đã có product1 trong wishlist
    await Wishlist.findOneAndUpdate(
      { user: userId },
      { items: [product1._id] },
      { upsert: true, new: true }
    );

    const guestSpecificAgent = request.agent(app);
    // 1. Guest thêm sản phẩm (khác với sản phẩm user đã có) vào wishlist
    await guestSpecificAgent.post(`/api/v1/wishlist/${guestProduct._id}`); // Guest product
    await guestSpecificAgent.post(`/api/v1/wishlist/${product2._id}`); // Product 2

    // 2. Guest đăng nhập bằng tài khoản `loggedInUserData` (đã có product1)
    const loginRes = await guestSpecificAgent // Dùng guestAgent
      .post("/api/v1/auth/login-refresh") // Dùng login-refresh để set cả cookie
      .send({
        email: loggedInUserData.email,
        password: loggedInUserData.password,
      });
    expect(loginRes.statusCode).toBe(200);
    const loggedInUserToken = loginRes.body.accessToken;

    // 3. Kiểm tra wishlist của user sau khi đăng nhập
    const userWishlistAfterLogin = await request(app)
      .get("/api/v1/wishlist")
      .set("Authorization", `Bearer ${loggedInUserToken}`);

    expect(userWishlistAfterLogin.statusCode).toBe(200);
    const finalItems = userWishlistAfterLogin.body.map((item) =>
      item._id.toString()
    );
    expect(finalItems.length).toBe(3); // product1 (user) + guestProduct (guest) + product2 (guest)
    expect(finalItems).toContain(product1._id.toString());
    expect(finalItems).toContain(product2._id.toString());
    expect(finalItems).toContain(guestProduct._id.toString());

    // 4. Kiểm tra cookie wishlistGuestId đã bị xóa
    const cookiesAfterLogin = loginRes.headers["set-cookie"];
    const wishlistGuestCookieCleared = cookiesAfterLogin.find((cookie) =>
      cookie.startsWith("wishlistGuestId=;")
    );
    expect(wishlistGuestCookieCleared).toBeDefined();

    // 5. Kiểm tra DB: Wishlist của guest đã bị xóa
    const guestIdBeforeLogin = guestSpecificAgent.jar
      .getCookies({ path: "/" })
      .find((c) => c.key === "wishlistGuestId")?.value;
    if (guestIdBeforeLogin) {
      const guestWishlistDb = await Wishlist.findOne({
        guestId: guestIdBeforeLogin,
      });
      expect(guestWishlistDb).toBeNull();
    }
  });
});
