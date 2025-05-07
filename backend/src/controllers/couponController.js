const Coupon = require("../models/Coupon");
const asyncHandler = require("../middlewares/asyncHandler");
const mongoose = require("mongoose");

// --- Hàm Helper: Xây dựng bộ lọc Coupon ---
const buildCouponFilter = (query) => {
  const filter = {}; // Khởi tạo đối tượng filter

  // Lọc theo trạng thái Active
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === "true"; // Chuyển string sang boolean
  }

  // Lọc theo loại giảm giá
  if (
    query.discountType &&
    ["percentage", "fixed_amount"].includes(query.discountType)
  ) {
    filter.discountType = query.discountType;
  }

  // Lọc (tìm kiếm gần đúng) theo Mã Code
  if (query.code) {
    // $regex để tìm kiếm không phân biệt hoa thường (i)
    filter.code = { $regex: query.code.trim(), $options: "i" };
  }

  // Lọc tiện ích theo trạng thái hết hạn
  const now = new Date();
  if (query.expired !== undefined) {
    if (query.expired === "true") {
      filter.expiryDate = { $lt: now }; // Ngày hết hạn < ngày hiện tại
    } else {
      // expired = 'false'
      filter.expiryDate = { $gte: now }; // Ngày hết hạn >= ngày hiện tại
    }
  }

  // Lọc tiện ích theo trạng thái đang hiệu lực (phức tạp hơn)
  if (query.validNow === "true") {
    filter.isActive = true; // Phải đang active
    filter.expiryDate = { $gte: now }; // Chưa hết hạn
    // Đồng thời, ngày bắt đầu (nếu có) phải <= ngày hiện tại
    filter.$or = [
      { startDate: { $exists: false } }, // Hoặc không có ngày bắt đầu
      { startDate: { $lte: now } }, // Hoặc ngày bắt đầu đã qua
    ];
  }

  // Lọc theo minOrderValue (lấy các coupon yêu cầu minOrderValue nhỏ hơn hoặc bằng giá trị nào đó)
  if (query.maxMinOrderValue) {
    const value = parseFloat(query.maxMinOrderValue);
    if (!isNaN(value)) {
      filter.minOrderValue = { $lte: value };
    }
  }

  // Lọc theo maxUsage (các coupon có giới hạn số lần dùng nhỏ hơn hoặc bằng X)
  if (query.maxUsage) {
    const value = parseInt(query.maxUsage);
    if (!isNaN(value)) {
      filter.maxUsage = { $lte: value };
    }
  }

  // Lọc theo maxUsagePerUser (dưới hoặc bằng số lần tối đa mỗi user được dùng)
  if (query.maxUsagePerUser) {
    const value = parseInt(query.maxUsagePerUser);
    if (!isNaN(value)) {
      filter.maxUsagePerUser = { $lte: value };
    }
  }

  // Lọc theo ngày hết hạn nằm trong khoảng
  if (query.expiryFrom || query.expiryTo) {
    filter.expiryDate = filter.expiryDate || {};
    if (query.expiryFrom) {
      const date = new Date(query.expiryFrom);
      if (!isNaN(date)) {
        filter.expiryDate.$gte = date;
      }
    }
    if (query.expiryTo) {
      const date = new Date(query.expiryTo);
      if (!isNaN(date)) {
        filter.expiryDate.$lte = date;
      }
    }
  }

  // Lọc theo đối tượng áp dụng (all, products, categories)
  if (query.applicableTo) {
    const validTargets = ["all", "products", "categories"];
    if (validTargets.includes(query.applicableTo)) {
      filter.applicableTo = query.applicableTo;
    }
  }

  // Lọc theo ID sản phẩm hoặc danh mục được áp dụng
  if (query.applicableId) {
    try {
      filter.applicableIds = mongoose.Types.ObjectId(query.applicableId);
    } catch (e) {
      console.warn("applicableId không hợp lệ");
    }
  }

  console.log("--- [Coupon Filter] Đối tượng Filter cuối cùng ---");
  console.log(JSON.stringify(filter, null, 2));
  console.log("----------------------------------------------");
  return filter;
};

// --- Hàm Helper: Xây dựng đối tượng sắp xếp Coupon ---
const buildCouponSort = (query) => {
  const sort = {};
  if (query.sortBy) {
    const allowedSortFields = [
      "code",
      "discountValue",
      "expiryDate",
      "createdAt",
      "usageCount",
      "isActive",
    ];
    if (allowedSortFields.includes(query.sortBy)) {
      const sortOrder = query.sortOrder === "desc" ? -1 : 1;
      sort[query.sortBy] = sortOrder;
    } else {
      console.warn(
        `[Sort] Sắp xếp Coupon theo trường "${query.sortBy}" không được phép. Bỏ qua.`
      );
    }
  }
  // Sắp xếp mặc định nếu không có yêu cầu
  if (Object.keys(sort).length === 0) {
    sort.createdAt = -1; // Mới nhất trước
  }
  console.log("--- [Coupon Sort] Đối tượng Sort cuối cùng ---");
  console.log(JSON.stringify(sort, null, 2));
  console.log("------------------------------------------");
  return sort;
};

// @desc    Tạo mã giảm giá mới
// @route   POST /api/v1/coupons
// @access  Private/Admin
const createCoupon = asyncHandler(async (req, res, next) => {
  const { code, ...couponData } = req.body; // Lấy code riêng để kiểm tra

  // Kiểm tra trùng lặp code (đã uppercase)
  const codeExists = await Coupon.findOne({ code: code.toUpperCase() }).lean();
  if (codeExists) {
    res.status(400);
    throw new Error(`Mã giảm giá "${code.toUpperCase()}" đã tồn tại.`);
  }

  // Tạo coupon mới
  const coupon = new Coupon({
    code: code,
    ...couponData,
  });
  // Validation ngày và giá trị sẽ chạy trong pre-save hook

  const createdCoupon = await coupon.save();
  res.status(201).json(createdCoupon);
});

// @desc    Lấy danh sách mã giảm giá (có filter, sort, pagination)
// @route   GET /api/v1/coupons
// @access  Private/Admin
const getCoupons = asyncHandler(async (req, res) => {
  // 1. Lấy tham số phân trang
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10; // Số lượng coupon mỗi trang
  const skip = (page - 1) * limit;

  // 2. Xây dựng bộ lọc và sắp xếp
  const filter = buildCouponFilter(req.query);
  const sort = buildCouponSort(req.query);

  // 3. Thực hiện query lấy danh sách coupons và tổng số lượng song song
  const couponsQuery = Coupon.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const totalCouponsQuery = Coupon.countDocuments(filter); // Đếm tổng số khớp filter

  // Chạy đồng thời 2 query
  const [coupons, totalCoupons] = await Promise.all([
    couponsQuery.exec(),
    totalCouponsQuery.exec(),
  ]);

  // 4. Tính toán thông tin phân trang
  const totalPages = Math.ceil(totalCoupons / limit);

  // 5. Trả về kết quả
  res.json({
    currentPage: page,
    totalPages: totalPages,
    totalCoupons: totalCoupons,
    limit: limit,
    coupons: coupons, // Danh sách coupon của trang hiện tại
  });
});

// @desc    Lấy chi tiết mã giảm giá bằng ID hoặc Code
// @route   GET /api/v1/coupons/:idOrCode
// @access  Private/Admin
const getCouponByCodeOrId = asyncHandler(async (req, res) => {
  const idOrCode = req.params.idOrCode;
  let coupon = null;

  // Ưu tiên tìm bằng ID nếu hợp lệ
  if (mongoose.Types.ObjectId.isValid(idOrCode)) {
    coupon = await Coupon.findById(idOrCode);
  }

  // Nếu không phải ID hoặc không tìm thấy bằng ID, thử tìm bằng Code (đã uppercase)
  if (!coupon) {
    coupon = await Coupon.findOne({ code: idOrCode.toUpperCase() });
  }

  if (!coupon) {
    res.status(404);
    throw new Error("Không tìm thấy mã giảm giá.");
  }

  res.json(coupon);
});

// @desc    Cập nhật mã giảm giá
// @route   PUT /api/v1/coupons/:id
// @access  Private/Admin
const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Validate
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("ID mã giảm giá không hợp lệ.");
  }

  const coupon = await Coupon.findById(id);
  if (!coupon) {
    res.status(404);
    throw new Error("Không tìm thấy mã giảm giá.");
  }

  // --- Cập nhật các trường cho phép ---
  Object.assign(coupon, updateData);
  // Validation ngày và giá trị sẽ chạy trong pre-save hook

  const updatedCoupon = await coupon.save();
  res.json(updatedCoupon);
});

// @desc    Xóa (Vô hiệu hóa) mã giảm giá - Soft Delete
// @route   DELETE /api/v1/coupons/:id
// @access  Private/Admin
const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  //Validate
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("ID mã giảm giá không hợp lệ.");
  }

  // Tìm và cập nhật trạng thái isActive = false
  const coupon = await Coupon.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: false }
  );

  if (!coupon) {
    res.status(404);
    throw new Error("Không tìm thấy mã giảm giá.");
  }

  res.status(200).json({ message: "Mã giảm giá đã được vô hiệu hóa." });
});

module.exports = {
  createCoupon,
  getCoupons,
  getCouponByCodeOrId,
  updateCoupon,
  deleteCoupon,
};
