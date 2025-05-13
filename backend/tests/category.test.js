const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const Category = require("../src/models/Category");
const User = require("../src/models/User");
const Product = require("../src/models/Product");
const { generateAccessToken } = require("../src/utils/generateToken");

let mongoServer;
let adminToken;
let adminUser;
let regularUserToken;
let regularUser;

// Dữ liệu mẫu
const adminData = {
  name: "Category Admin",
  email: "catadmin@example.com",
  password: "password123",
  phone: "0987654111",
  role: "admin",
  isEmailVerified: true,
};
const regularUserData = {
  name: "Regular Test User",
  email: "regular@example.com",
  password: "password123",
  phone: "0911111111",
  isEmailVerified: true,
};

let cat1Data, cat2Data, childCatData;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  adminUser = await User.create(adminData);
  adminToken = generateAccessToken(adminUser._id);
  regularUser = await User.create(regularUserData);
  regularUserToken = generateAccessToken(regularUser._id);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Category.deleteMany({});
  await Product.deleteMany({}); // Xóa product để test xóa category

  cat1Data = {
    name: "Thời Trang Nam",
    description: "Quần áo nam",
    image: "http://example.com/nam.jpg",
    isActive: true,
  };
  cat2Data = {
    name: "Thời Trang Nữ",
    description: "Quần áo nữ",
    isActive: true,
  };
});

// =================================
// === TẠO CATEGORY (POST /) ===
// =================================
describe("POST /api/v1/categories", () => {
  it("Nên tạo category mới thành công bởi Admin", async () => {
    const res = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(cat1Data);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.name).toBe(cat1Data.name);
    expect(res.body.slug).toBe("thoi-trang-nam"); // Slugify
    expect(res.body.description).toBe(cat1Data.description);
    expect(res.body.image).toBe(cat1Data.image);
    expect(res.body.isActive).toBe(true);

    const dbCategory = await Category.findById(res.body._id);
    expect(dbCategory).not.toBeNull();
  });

  it("Nên tạo category con thành công", async () => {
    const parentCatRes = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(cat1Data);
    const parentId = parentCatRes.body._id;

    childCatData = { name: "Áo Nam", parent: parentId };
    const res = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(childCatData);

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe("Áo Nam");
    expect(res.body.parent.toString()).toBe(parentId.toString());
  });

  it("Nên trả về 400 nếu tên category đã tồn tại", async () => {
    await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(cat1Data);
    const res = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(cat1Data); // Gửi lại cùng tên
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("đã tồn tại");
  });

  it("Nên trả về 400 nếu thiếu tên category (validation)", async () => {
    const res = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ description: "Thiếu tên" });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('"Tên danh mục" là trường bắt buộc');
  });

  it("Nên trả về 404 nếu parent ID không tồn tại", async () => {
    const fakeParentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Category Lỗi Parent", parent: fakeParentId });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Không tìm thấy danh mục cha.");
  });

  it("Nên trả về 403 nếu user thường cố gắng tạo", async () => {
    const regularToken = generateAccessToken(new mongoose.Types.ObjectId()); // Token user giả
    const res = await request(app)
      .post("/api/v1/categories")
      .set("Authorization", `Bearer ${regularUserToken}`)
      .send(cat1Data);
    expect(res.statusCode).toBe(403); // Do isAdmin middleware
  });
});

// ===========================================
// === LẤY DANH SÁCH CATEGORIES (GET /) ===
// ===========================================
describe("GET /api/v1/categories", () => {
  it("Nên trả về danh sách tất cả categories (public)", async () => {
    await Category.create(cat1Data);
    await Category.create(cat2Data);

    const res = await request(app).get("/api/v1/categories");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    // Controller hiện tại lấy cả active và inactive cho admin nếu không có filter
    // Nếu là public route và controller có filter isActive:true thì cần điều chỉnh test
  });

  // Thêm test cho filter (nếu có trong getCategories controller, ví dụ isActive)
});

// ==================================================
// === LẤY CHI TIẾT CATEGORY (GET /:idOrSlug) ===
// ==================================================
describe("GET /api/v1/categories/:idOrSlug", () => {
  let createdCat;
  beforeEach(async () => {
    createdCat = await Category.create(cat1Data);
  });

  it("Nên trả về chi tiết category bằng ID (public)", async () => {
    const res = await request(app).get(`/api/v1/categories/${createdCat._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe(cat1Data.name);
    expect(res.body.slug).toBe("thoi-trang-nam");
  });

  it("Nên trả về chi tiết category bằng Slug (public)", async () => {
    const res = await request(app).get(`/api/v1/categories/${createdCat.slug}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe(cat1Data.name);
  });

  it("Nên trả về 404 nếu ID/Slug không tồn tại", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const resId = await request(app).get(`/api/v1/categories/${fakeId}`);
    expect(resId.statusCode).toBe(404);

    const resSlug = await request(app).get(
      "/api/v1/categories/slug-khong-ton-tai"
    );
    expect(resSlug.statusCode).toBe(404);
  });
});

// =====================================
// === CẬP NHẬT CATEGORY (PUT /:id) ===
// =====================================
describe("PUT /api/v1/categories/:id", () => {
  let categoryToUpdate;
  beforeEach(async () => {
    categoryToUpdate = await Category.create(cat1Data);
  });

  it("Nên cập nhật category thành công bởi Admin", async () => {
    const updates = { name: "Thời Trang Nam Mới", description: "Mô tả mới" };
    const res = await request(app)
      .put(`/api/v1/categories/${categoryToUpdate._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updates);

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe(updates.name);
    expect(res.body.slug).toBe("thoi-trang-nam-moi");
    expect(res.body.description).toBe(updates.description);
  });

  it("Nên trả về 400 nếu cố gắng đặt parent là chính nó", async () => {
    const res = await request(app)
      .put(`/api/v1/categories/${categoryToUpdate._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ parent: categoryToUpdate._id });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain(
      "Danh mục không thể tự làm danh mục cha của chính nó."
    );
  });

  it("Nên trả về 404 nếu cập nhật category không tồn tại", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/v1/categories/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Tên Gì Đó" });
    expect(res.statusCode).toBe(404);
  });

  // Thêm test cho việc cập nhật với tên đã tồn tại (nếu có logic check)
});

// ===================================
// === XÓA CATEGORY (DELETE /:id) ===
// ===================================
describe("DELETE /api/v1/categories/:id", () => {
  let categoryToDelete;
  beforeEach(async () => {
    categoryToDelete = await Category.create(cat1Data);
  });

  it("Nên xóa (soft delete) category thành công bởi Admin", async () => {
    const res = await request(app)
      .delete(`/api/v1/categories/${categoryToDelete._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Danh mục đã được xóa (ẩn) thành công.");

    const dbCategory = await Category.findById(categoryToDelete._id);
    expect(dbCategory.isActive).toBe(false);
  });

  it("Nên trả về 400 nếu xóa category có sản phẩm active", async () => {
    // Tạo sản phẩm thuộc category này
    await Product.create({
      name: "Sản phẩm Test",
      price: 100,
      category: categoryToDelete._id,
      description: "Test",
      sku: "TESTPROD001",
      stockQuantity: 10,
      isPublished: true,
    });

    const res = await request(app)
      .delete(`/api/v1/categories/${categoryToDelete._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("còn sản phẩm đang hoạt động");
  });

  it("Nên trả về 400 nếu xóa category có danh mục con active", async () => {
    await Category.create({
      name: "Áo Nam Con",
      parent: categoryToDelete._id,
      isActive: true,
    });

    const res = await request(app)
      .delete(`/api/v1/categories/${categoryToDelete._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("còn danh mục con đang hoạt động");
  });

  it("Nên trả về 404 nếu xóa category không tồn tại", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/v1/categories/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
  });
});
