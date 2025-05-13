const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const Province = require("../src/models/Province");
const District = require("../src/models/District");
const Commune = require("../src/models/Commune");

let mongoServer;

// ID mẫu từ seedData.json
const HANOI_PROVINCE_CODE = "01"; // Giả sử đây là code của Hà Nội
const BADINH_DISTRICT_CODE = "001"; // Giả sử đây là code của Ba Đình, thuộc Hà Nội

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Seed một vài dữ liệu location mẫu nếu cần thiết cho test độc lập
  // Hoặc dựa vào dữ liệu đã được seed bởi script chung
  await Province.insertMany([
    { code: HANOI_PROVINCE_CODE, name: "Thành phố Hà Nội", countryCode: "VN" },
    { code: "02", name: "Tỉnh Hà Giang", countryCode: "VN" },
  ]);
  await District.insertMany([
    {
      code: BADINH_DISTRICT_CODE,
      name: "Quận Ba Đình",
      provinceCode: HANOI_PROVINCE_CODE,
    },
    { code: "002", name: "Quận Hoàn Kiếm", provinceCode: HANOI_PROVINCE_CODE },
  ]);
  await Commune.insertMany([
    {
      code: "00001",
      name: "Phường Phúc Xá",
      districtCode: BADINH_DISTRICT_CODE,
    },
    {
      code: "00004",
      name: "Phường Điện Biên",
      districtCode: BADINH_DISTRICT_CODE,
    },
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Không cần xóa location data vì nó là dữ liệu tĩnh
});

// ======================================
// === LẤY TỈNH/THÀNH (GET /provinces) ===
// ======================================
describe("GET /api/v1/locations/provinces", () => {
  it("Nên trả về danh sách các tỉnh/thành phố", async () => {
    const res = await request(app).get("/api/v1/locations/provinces");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2); // Dựa trên dữ liệu seed ở trên
    expect(res.body[0]).toHaveProperty("code");
    expect(res.body[0]).toHaveProperty("name");
    expect(
      res.body.some(
        (p) => p.code === HANOI_PROVINCE_CODE && p.name === "Thành phố Hà Nội"
      )
    ).toBe(true);
  });
});

// =================================================
// === LẤY QUẬN/HUYỆN (GET /districts?provinceCode=...) ===
// =================================================
describe("GET /api/v1/locations/districts", () => {
  it("Nên trả về danh sách quận/huyện của một tỉnh cụ thể", async () => {
    const res = await request(app).get(
      `/api/v1/locations/districts?provinceCode=${HANOI_PROVINCE_CODE}`
    );
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body.every((d) => d.provinceCode === HANOI_PROVINCE_CODE)).toBe(
      true
    );
    expect(
      res.body.some(
        (d) => d.code === BADINH_DISTRICT_CODE && d.name === "Quận Ba Đình"
      )
    ).toBe(true);
  });

  it("Nên trả về mảng rỗng nếu provinceCode không có quận/huyện nào", async () => {
    const res = await request(app).get(
      "/api/v1/locations/districts?provinceCode=99"
    ); // Giả sử code 99 không có
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("Nên trả về 400 nếu thiếu provinceCode", async () => {
    const res = await request(app).get("/api/v1/locations/districts");
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Vui lòng cung cấp mã tỉnh (provinceCode).");
  });
});

// ===================================================
// === LẤY PHƯỜNG/XÃ (GET /communes?districtCode=...) ===
// ===================================================
describe("GET /api/v1/locations/communes", () => {
  it("Nên trả về danh sách phường/xã của một quận/huyện cụ thể", async () => {
    const res = await request(app).get(
      `/api/v1/locations/communes?districtCode=${BADINH_DISTRICT_CODE}`
    );
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body.every((c) => c.districtCode === BADINH_DISTRICT_CODE)).toBe(
      true
    );
    expect(
      res.body.some((c) => c.code === "00001" && c.name === "Phường Phúc Xá")
    ).toBe(true);
  });

  it("Nên trả về mảng rỗng nếu districtCode không có phường/xã nào", async () => {
    const res = await request(app).get(
      "/api/v1/locations/communes?districtCode=999"
    ); // Giả sử code 999 không có
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("Nên trả về 400 nếu thiếu districtCode", async () => {
    const res = await request(app).get("/api/v1/locations/communes");
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(
      "Vui lòng cung cấp mã quận/huyện (districtCode)."
    );
  });
});
