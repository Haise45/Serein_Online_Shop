// tests/cart.test.js
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/models/User");
const Product = require("../src/models/Product");
const Category = require("../src/models/Category");
const Cart = require("../src/models/Cart");
const { generateAccessToken } = require("../src/utils/generateToken");

let mongoServer;
let userToken, userId;
let productSimple, productWithVariants, variant1, variant2, outOfStockProduct;
let testCategory;
let agent; // Cho Guest

const userData = {
  name: "Cart User",
  email: "cart@example.com",
  password: "password123",
  phone: "0922222222",
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
    name: "Test Cart Category",
    slug: "test-cart-cat",
  });

  productSimple = await Product.create({
    name: "Simple Product for Cart",
    price: 150,
    category: testCategory._id,
    sku: "CART_SIMPLE",
    stockQuantity: 20,
    isPublished: true,
    isActive: true,
  });

  productWithVariants = await Product.create({
    name: "Variant Product for Cart",
    price: 200, // Giá gốc
    category: testCategory._id,
    isPublished: true,
    isActive: true,
    attributes: [
      { name: "Màu sắc", values: ["Đỏ", "Xanh"] },
      { name: "Size", values: ["M", "L"] },
    ],
    variants: [
      {
        sku: "CART_VAR_RED_M",
        price: 210,
        stockQuantity: 10,
        optionValues: [
          { attributeName: "Màu sắc", value: "Đỏ" },
          { attributeName: "Size", value: "M" },
        ],
      },
      {
        sku: "CART_VAR_BLUE_L",
        price: 220,
        stockQuantity: 5,
        optionValues: [
          { attributeName: "Màu sắc", value: "Xanh" },
          { attributeName: "Size", value: "L" },
        ],
      },
    ],
  });
  variant1 = productWithVariants.variants[0];
  variant2 = productWithVariants.variants[1];

  outOfStockProduct = await Product.create({
    name: "Out of Stock Product",
    price: 50,
    category: testCategory._id,
    sku: "CART_OOS",
    stockQuantity: 0,
    isPublished: true,
    isActive: true,
  });

  agent = request.agent(app); // Agent cho guest
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Cart.deleteMany({});
  // Agent cần được reset cookie giữa các describe block của guest nếu không nó sẽ giữ lại cartGuestId
  // Hoặc tạo agent mới cho mỗi describe guest
});

// Helper để lấy cartId từ cookie (nếu cần cho debug DB)
const getGuestCartIdFromAgent = (currentAgent) => {
  if (currentAgent && currentAgent.jar) {
    const cookie = currentAgent.jar.getCookie("cartGuestId", {
      path: "/",
      domain: "127.0.0.1",
    }); // Domain có thể cần điều chỉnh
    return cookie ? cookie.value : null;
  }
  return null;
};

// =====================================
// === THÊM ITEM VÀO GIỎ (POST /items) ===
// =====================================
describe("POST /api/v1/cart/items", () => {
  describe("Guest Cart", () => {
    let guestAgent;
    beforeEach(() => {
      guestAgent = request.agent(app);
    }); // Agent mới cho mỗi test guest

    it("Nên thêm sản phẩm đơn giản vào giỏ của guest và tạo cookie", async () => {
      const res = await guestAgent
        .post("/api/v1/cart/items")
        .send({ productId: productSimple._id, quantity: 1 });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("_id"); // Cart ID
      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].productId.toString()).toBe(
        productSimple._id.toString()
      );
      expect(res.body.items[0].quantity).toBe(1);

      const cookies = res.headers["set-cookie"];
      expect(cookies.some((cookie) => cookie.startsWith("cartGuestId="))).toBe(
        true
      );
      const guestId = getGuestCartIdFromAgent(guestAgent);
      expect(guestId).toBeDefined();

      const dbCart = await Cart.findOne({ guestId: guestId });
      expect(dbCart).not.toBeNull();
    });

    it("Nên thêm biến thể sản phẩm vào giỏ của guest", async () => {
      const res = await guestAgent.post("/api/v1/cart/items").send({
        productId: productWithVariants._id,
        variantId: variant1._id,
        quantity: 2,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.items[0].variantId.toString()).toBe(
        variant1._id.toString()
      );
      expect(res.body.items[0].quantity).toBe(2);
    });

    it("Nên tăng số lượng nếu thêm lại cùng sản phẩm/biến thể", async () => {
      await guestAgent
        .post("/api/v1/cart/items")
        .send({ productId: productSimple._id, quantity: 1 });
      const res = await guestAgent
        .post("/api/v1/cart/items")
        .send({ productId: productSimple._id, quantity: 2 }); // Thêm 2 nữa

      expect(res.statusCode).toBe(200);
      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].quantity).toBe(3); // 1 + 2 = 3
    });

    it("Nên trả về 400 nếu số lượng vượt tồn kho", async () => {
      const res = await guestAgent.post("/api/v1/cart/items").send({
        productId: productSimple._id,
        quantity: productSimple.stockQuantity + 1,
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Số lượng tồn kho không đủ");
    });

    it("Nên trả về 400 nếu sản phẩm có biến thể mà không gửi variantId", async () => {
      const res = await guestAgent
        .post("/api/v1/cart/items")
        .send({ productId: productWithVariants._id, quantity: 1 }); // Thiếu variantId
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Vui lòng chọn một phiên bản");
    });
  });

  describe("User Cart", () => {
    it("Nên thêm sản phẩm vào giỏ của user đã đăng nhập", async () => {
      const res = await request(app)
        .post("/api/v1/cart/items")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ productId: productSimple._id, quantity: 1 });

      expect(res.statusCode).toBe(200);
      expect(res.body.items[0].productId.toString()).toBe(
        productSimple._id.toString()
      );
      expect(res.body.userId.toString()).toBe(userId.toString());

      const dbCart = await Cart.findOne({ user: userId });
      expect(dbCart).not.toBeNull();
    });
    // Các test case lỗi (tồn kho, ...) tương tự guest
  });
});

// ==================================
// === LẤY GIỎ HÀNG (GET /cart) ===
// ==================================
describe("GET /api/v1/cart", () => {
  let guestAgentWithItem;
  let guestCartId;

  beforeEach(async () => {
    guestAgentWithItem = request.agent(app);
    const addRes = await guestAgentWithItem.post("/api/v1/cart/items").send({
      productId: productWithVariants._id,
      variantId: variant2._id,
      quantity: 1,
    });
    guestCartId = getGuestCartIdFromAgent(guestAgentWithItem);
  });

  it("Guest: Nên lấy được giỏ hàng với thông tin sản phẩm đã populate", async () => {
    const res = await guestAgentWithItem.get("/api/v1/cart");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("items");
    expect(res.body.items.length).toBe(1);
    const item = res.body.items[0];
    expect(item.productId._id.toString()).toBe(
      productWithVariants._id.toString()
    );
    expect(item.name).toBe(productWithVariants.name);
    expect(item.variantId.toString()).toBe(variant2._id.toString());
    expect(item.price).toBe(variant2.price); // Giá của variant
    expect(item.sku).toBe(variant2.sku);
    expect(item).toHaveProperty("lineTotal", variant2.price * 1);
    expect(res.body).toHaveProperty("subtotal", variant2.price * 1);
    expect(res.body).toHaveProperty("totalQuantity", 1);
    expect(res.body.guestId).toBe(guestCartId);
  });

  it("User: Nên lấy được giỏ hàng của mình", async () => {
    // Tạo cart cho user
    await Cart.create({
      user: userId,
      items: [{ productId: productSimple._id, quantity: 2 }],
    });

    const res = await request(app)
      .get("/api/v1/cart")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].productId._id.toString()).toBe(
      productSimple._id.toString()
    );
    expect(res.body.userId.toString()).toBe(userId.toString());
  });

  it("Nên trả về giỏ rỗng (cấu trúc chuẩn) nếu không có cart", async () => {
    const newGuestAgent = request.agent(app); // Agent mới, chưa có cart
    const res = await newGuestAgent.get("/api/v1/cart");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        items: [],
        subtotal: 0,
        totalQuantity: 0,
        appliedCoupon: null,
        finalTotal: 0,
      })
    );
  });
});

// ===================================================
// === CẬP NHẬT ITEM TRONG GIỎ (PUT /items/:itemId) ===
// ===================================================
describe("PUT /api/v1/cart/items/:itemId", () => {
  let guestAgentWithCart;
  let cartItemId;

  beforeEach(async () => {
    guestAgentWithCart = request.agent(app);
    const addRes = await guestAgentWithCart
      .post("/api/v1/cart/items")
      .send({ productId: productSimple._id, quantity: 1 });
    cartItemId = addRes.body.items[0]._id; // Lấy ID của cart item
  });

  it("Guest: Nên cập nhật số lượng item thành công", async () => {
    const res = await guestAgentWithCart
      .put(`/api/v1/cart/items/${cartItemId}`)
      .send({ quantity: 5 });

    expect(res.statusCode).toBe(200);
    expect(res.body.items[0].quantity).toBe(5);
    expect(res.body.items[0]._id.toString()).toBe(cartItemId.toString());
  });

  it("Guest: Nên trả về 400 nếu cập nhật số lượng vượt tồn kho", async () => {
    const res = await guestAgentWithCart
      .put(`/api/v1/cart/items/${cartItemId}`)
      .send({ quantity: productSimple.stockQuantity + 5 });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("Số lượng tồn kho không đủ");
  });

  it("Guest: Nên trả về 404 nếu itemId không tồn tại trong giỏ", async () => {
    const fakeItemId = new mongoose.Types.ObjectId();
    const res = await guestAgentWithCart
      .put(`/api/v1/cart/items/${fakeItemId}`)
      .send({ quantity: 1 });
    expect(res.statusCode).toBe(404);
  });
  // Các test case cho User tương tự, chỉ thêm token
});

// ===================================================
// === XÓA ITEM KHỎI GIỎ (DELETE /items/:itemId) ===
// ===================================================
describe("DELETE /api/v1/cart/items/:itemId", () => {
  // ... (Tương tự PUT, test cho guest và user) ...
  it("Guest: Nên xóa item thành công", async () => {
    const guestAgent = request.agent(app);
    await guestAgent
      .post("/api/v1/cart/items")
      .send({ productId: productSimple._id, quantity: 1 });
    const cartRes = await guestAgent.post("/api/v1/cart/items").send({
      productId: productWithVariants._id,
      variantId: variant1._id,
      quantity: 1,
    });
    const itemToRemoveId = cartRes.body.items.find(
      (i) => i.productId._id.toString() === productSimple._id.toString()
    )._id;

    const deleteRes = await guestAgent.delete(
      `/api/v1/cart/items/${itemToRemoveId}`
    );
    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.items.length).toBe(1); // Còn lại 1 item
    expect(
      deleteRes.body.items.find((i) => i._id.toString() === itemToRemoveId)
    ).toBeUndefined();
  });
});

// =========================================
// === XÓA TOÀN BỘ GIỎ HÀNG (DELETE /) ===
// =========================================
describe("DELETE /api/v1/cart", () => {
  // ... (Test cho guest và user) ...
  it("Guest: Nên xóa toàn bộ giỏ hàng thành công", async () => {
    const guestAgent = request.agent(app);
    await guestAgent
      .post("/api/v1/cart/items")
      .send({ productId: productSimple._id, quantity: 1 });

    const deleteRes = await guestAgent.delete("/api/v1/cart");
    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.items).toEqual([]);
    expect(deleteRes.body.totalQuantity).toBe(0);

    const dbCart = await Cart.findOne({
      guestId: getGuestCartIdFromAgent(guestAgent),
    });
    expect(dbCart.items.length).toBe(0);
  });
});
