const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/User");
const Product = require("../src/models/Product");
const Category = require("../src/models/Category");
const Order = require("../src/models/Order");
const Review = require("../src/models/Review");
const { generateAccessToken } = require("../src/utils/generateToken");

// --- Mock sendEmail và notificationUtils nếu Review controller có gọi ---
// (Hiện tại createReview của user chưa gửi noti, chỉ khi admin duyệt)
jest.mock("../src/utils/sendEmail", () => jest.fn().mockResolvedValue(true));
jest.mock("../src/utils/notificationUtils", () => ({
  createAdminNotification: jest.fn().mockResolvedValue(true),
}));

let mongoServer;
let userToken;
let userId;
let product1, product2;
let deliveredOrderForProduct1; // Đơn hàng đã giao chứa product1
let testCategory;
let approvedReviewForP1; // Đổi tên biến cho rõ ràng
let approvedReviewForP2;

const userData = {
  name: "Review User",
  email: "reviewuser@example.com",
  password: "password123",
  phone: "0933333333",
  isEmailVerified: true,
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  const user = await User.create(userData);
  userId = user._id;
  userToken = generateAccessToken(userId);

  testCategory = await Category.create({
    name: "Review Test Cat",
    slug: "review-test-cat",
  });
  product1 = await Product.create({
    name: "Product 1 to Review",
    price: 150,
    category: testCategory._id,
    sku: "REVPROD001",
    stockQuantity: 20,
    isPublished: true,
    isActive: true,
  });
  product2 = await Product.create({
    name: "Product 2 (no review yet)",
    price: 250,
    category: testCategory._id,
    sku: "REVPROD002",
    stockQuantity: 15,
    isPublished: true,
    isActive: true,
  });

  // Tạo một đơn hàng đã giao cho user với product1
  const orderItems = [
    {
      name: product1.name,
      quantity: 1,
      price: product1.price,
      image: product1.images[0] || null,
      product: product1._id,
    },
  ];
  deliveredOrderForProduct1 = await Order.create({
    user: userId,
    orderItems: orderItems,
    shippingAddress: {
      fullName: "Test User",
      phone: "123",
      street: "123 St",
      communeCode: "27283", // Lấy từ API communes
      communeName: "Phường 4", // Lấy từ API communes
      districtCode: "773", // Lấy từ API districts
      districtName: "Quận 4", // Lấy từ API districts
      provinceCode: "79", // Lấy từ API provinces
      provinceName: "Thành phố Hồ Chí Minh", // Lấy từ API provinces
    },
    paymentMethod: "COD",
    itemsPrice: product1.price,
    totalPrice: product1.price,
    status: "Delivered", // <<< QUAN TRỌNG
    isPaid: true,
    paidAt: new Date(),
    isDelivered: true,
    deliveredAt: new Date(),
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Review.deleteMany({}); // Xóa tất cả reviews trước mỗi test
});

// ==========================================================
// === USER TẠO REVIEW (POST /products/:productId/reviews) ===
// ==========================================================
describe("POST /api/v1/products/:productId/reviews", () => {
  const reviewData = {
    rating: 5,
    comment: "Sản phẩm này rất tốt, tôi rất hài lòng!",
    userImages: ["https://res.cloudinary.com/demo/image/upload/sample.jpg"],
  };

  it("Nên tạo review thành công cho sản phẩm đã mua và nhận hàng", async () => {
    const res = await request(app)
      .post(`/api/v1/products/${product1._id}/reviews`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ ...reviewData, orderId: deliveredOrderForProduct1._id });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe(
      "Đánh giá của bạn đã được gửi và đang chờ duyệt."
    );
    expect(res.body.review).toHaveProperty("_id");
    expect(res.body.review.rating).toBe(reviewData.rating);
    expect(res.body.review.comment).toBe(reviewData.comment);
    expect(res.body.review.user.toString()).toBe(userId.toString());
    expect(res.body.review.product.toString()).toBe(product1._id.toString());
    expect(res.body.review.order.toString()).toBe(
      deliveredOrderForProduct1._id.toString()
    );
    expect(res.body.review.isApproved).toBe(false);
    expect(res.body.review.userImages).toEqual(reviewData.userImages);

    const dbReview = await Review.findById(res.body.review._id);
    expect(dbReview).not.toBeNull();
  });

  it("Nên trả về 400 nếu user đã review sản phẩm này", async () => {
    // Tạo review lần 1
    await Review.create({
      ...reviewData,
      user: userId,
      product: product1._id,
      order: deliveredOrderForProduct1._id,
    });

    // Thử review lần 2
    const res = await request(app)
      .post(`/api/v1/products/${product1._id}/reviews`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        ...reviewData,
        rating: 4,
        orderId: deliveredOrderForProduct1._id,
      }); // Có thể khác rating/comment

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Bạn đã đánh giá sản phẩm này trước đó.");
  });

  it("Nên trả về 403 nếu user chưa mua/nhận sản phẩm từ đơn hàng đó", async () => {
    // Tạo một đơn hàng khác không chứa product1 hoặc chưa delivered
    const otherOrder = await Order.create({
      user: userId,
      orderItems: [
        { product: product2._id, name: "P2", quantity: 1, price: 10 },
      ],
      shippingAddress: {
        fullName: "Test User",
        phone: "123",
        street: "123 St",
        communeCode: "27283", // Lấy từ API communes
        communeName: "Phường 4", // Lấy từ API communes
        districtCode: "773", // Lấy từ API districts
        districtName: "Quận 4", // Lấy từ API districts
        provinceCode: "79", // Lấy từ API provinces
        provinceName: "Thành phố Hồ Chí Minh", // Lấy từ API provinces
      },
      paymentMethod: "COD",
      itemsPrice: 10,
      totalPrice: 10,
      status: "Pending",
    });

    const res = await request(app)
      .post(`/api/v1/products/${product1._id}/reviews`) // Review product1
      .set("Authorization", `Bearer ${userToken}`)
      .send({ ...reviewData, orderId: otherOrder._id }); // Nhưng dùng orderId của đơn khác

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain(
      "Bạn chỉ có thể đánh giá sản phẩm sau khi đã nhận hàng"
    );
  });

  it("Nên trả về 400 nếu thiếu orderId", async () => {
    const res = await request(app)
      .post(`/api/v1/products/${product1._id}/reviews`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ rating: 5, comment: "Thiếu order ID" }); // Không có orderId
    expect(res.statusCode).toBe(400);
    // Joi validation sẽ báo lỗi này
    expect(res.body.message).toContain(
      "Dữ liệu không hợp lệ: ID đơn hàng là bắt buộc để đánh giá."
    );
  });

  it("Nên trả về 401 nếu không có token", async () => {
    const res = await request(app)
      .post(`/api/v1/products/${product1._id}/reviews`)
      .send({ ...reviewData, orderId: deliveredOrderForProduct1._id });
    expect(res.statusCode).toBe(401);
  });

  // Thêm các test cho validation lỗi của rating, comment nếu cần
});

// =============================================================
// === LẤY REVIEW CỦA SẢN PHẨM (GET /products/:productId/reviews) ===
// =============================================================
describe("GET /api/v1/products/:productId/reviews", () => {
  let approvedReview, unapprovedReview;

  beforeEach(async () => {
    // Tạo review mẫu
    approvedReview = await Review.create({
      user: userId,
      product: product1._id,
      order: deliveredOrderForProduct1._id,
      rating: 5,
      comment: "Rất tốt!",
      isApproved: true,
      userImages: ["https://example.com/image.jpg"],
    });
    unapprovedReview = await Review.create({
      user: userId,
      product: product1._id,
      order: deliveredOrderForProduct1._id,
      rating: 4,
      comment: "Tạm được",
      isApproved: false,
    });
    await Review.create({
      user: userId,
      product: product2._id,
      order: new mongoose.Types.ObjectId(),
      rating: 3,
      comment: "Cho sản phẩm khác",
      isApproved: true,
    }); // Review cho sản phẩm khác
  });

  it("Nên trả về danh sách review đã duyệt của sản phẩm", async () => {
    const res = await request(app).get(
      `/api/v1/products/${product1._id}/reviews`
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.reviews).toHaveLength(1); // Chỉ có approvedReview
    expect(res.body.reviews[0]._id.toString()).toBe(
      approvedReview._id.toString()
    );
    expect(res.body.reviews[0]).toHaveProperty("user");
    expect(res.body.reviews[0].user).toHaveProperty("name");
    expect(res.body.reviews[0]).not.toHaveProperty("isApproved"); // Không cần trả isApproved cho public
  });

  it("Nên trả về mảng rỗng nếu sản phẩm không có review nào được duyệt", async () => {
    const res = await request(app).get(
      `/api/v1/products/${product2._id}/reviews`
    ); // Product2 có 1 review approved
    await Review.deleteMany({ product: product2._id }); // Xóa review của P2 đi

    const res2 = await request(app).get(
      `/api/v1/products/${product2._id}/reviews`
    );

    expect(res2.statusCode).toBe(200);
    expect(res2.body.reviews).toEqual([]);
    expect(res2.body.totalReviews).toBe(0);
  });

  it("Nên hỗ trợ phân trang cho review", async () => {
    // Tạo thêm 5 review đã duyệt cho product1
    for (let i = 0; i < 5; i++) {
      await Review.create({
        user: userId,
        product: product1._id,
        order: deliveredOrderForProduct1._id,
        rating: 4,
        comment: `Review thêm ${i}`,
        isApproved: true,
      });
    }
    // Tổng cộng product1 có 1 (approvedReview) + 5 = 6 review đã duyệt

    const res = await request(app).get(
      `/api/v1/products/${product1._id}/reviews?page=1&limit=4`
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.reviews).toHaveLength(4);
    expect(res.body.totalReviews).toBe(6);
    expect(res.body.totalPages).toBe(2);
  });

  it("Nên lọc review theo rating (chỉ review đã duyệt)", async () => {
    await Review.create({
      user: userId,
      product: product1._id,
      order: deliveredOrderForProduct1._id,
      rating: 3,
      comment: "Review 3 sao",
      isApproved: true,
    });
    const res = await request(app).get(
      `/api/v1/products/${product1._id}/reviews?rating=5`
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.reviews.every((r) => r.rating === 5)).toBe(true);
    expect(
      res.body.reviews.find(
        (r) => r._id.toString() === approvedReview._id.toString()
      )
    ).toBeDefined();
  });

  it("Nên lọc review có ảnh người dùng (chỉ review đã duyệt)", async () => {
    await Review.create({
      user: userId,
      product: product1._id,
      order: deliveredOrderForProduct1._id,
      rating: 4,
      comment: "Không có ảnh",
      isApproved: true,
      userImages: [],
    });
    const res = await request(app).get(
      `/api/v1/products/${product1._id}/reviews?hasUserImages=true`
    );
    expect(res.statusCode).toBe(200);
    expect(
      res.body.reviews.every((r) => r.userImages && r.userImages.length > 0)
    ).toBe(true);
    expect(
      res.body.reviews.find(
        (r) => r._id.toString() === approvedReview._id.toString()
      )
    ).toBeDefined();
  });

  it("Nên trả về 404 nếu sản phẩm không tồn tại", async () => {
    const fakeProductId = new mongoose.Types.ObjectId();
    const res = await request(app).get(
      `/api/v1/products/${fakeProductId}/reviews`
    );
    expect(res.statusCode).toBe(404);
    expect(res.body.reviews).toEqual([]);
  });
});
