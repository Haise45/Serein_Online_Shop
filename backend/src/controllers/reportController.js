const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const asyncHandler = require("../middlewares/asyncHandler");
const mongoose = require("mongoose");

// --- Helper Functions ---
const getDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    filter.$gte = start;
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.$lte = end;
  }
  return Object.keys(filter).length ? filter : null;
};

const getValidOrderMatch = (dateFilter) => {
  const match = { status: { $in: ["Processing", "Shipped", "Delivered"] } };
  if (dateFilter) match.createdAt = dateFilter;
  return match;
};

// --- BÁO CÁO BÁN HÀNG ---
// @desc    Lấy báo cáo bán hàng tổng quan
// @route   GET /api/v1/reports/sales
// @access  Private/Admin
const getSalesReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const dateFilter = getDateFilter(startDate, endDate);
  const match = getValidOrderMatch(dateFilter);

  const salesPipeline = [
    { $match: match },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalPrice" },
        totalOrders: { $sum: 1 },
        totalItemsSold: { $sum: { $sum: "$orderItems.quantity" } },
        totalDiscount: { $sum: "$discountAmount" },
      },
    },
    {
      $project: {
        _id: 0,
        totalRevenue: 1,
        totalOrders: 1,
        totalItemsSold: 1,
        totalDiscount: 1,
        averageOrderValue: {
          $cond: [
            { $eq: ["$totalOrders", 0] },
            0,
            { $divide: ["$totalRevenue", "$totalOrders"] },
          ],
        },
      },
    },
  ];

  const paymentMethodPipeline = [
    { $match: match },
    {
      $group: {
        _id: "$paymentMethod",
        count: { $sum: 1 },
        totalValue: { $sum: "$totalPrice" },
      },
    },
    { $sort: { count: -1 } },
  ];

  const [salesData, paymentMethods] = await Promise.all([
    Order.aggregate(salesPipeline),
    Order.aggregate(paymentMethodPipeline),
  ]);

  res.json({
    summary: salesData[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      totalItemsSold: 0,
      totalDiscount: 0,
      averageOrderValue: 0,
    },
    byPaymentMethod: paymentMethods,
  });
});

// --- BÁO CÁO SẢN PHẨM ---
// @desc    Lấy báo cáo về sản phẩm
// @route   GET /api/v1/reports/products
// @access  Private/Admin
const getProductReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 10 } = req.query;
  const dateFilter = getDateFilter(startDate, endDate);
  const match = getValidOrderMatch(dateFilter);

  const basePipeline = [{ $match: match }, { $unwind: "$orderItems" }];

  // 1. Sản phẩm bán chạy nhất (theo số lượng)
  const topByQuantityPromise = Order.aggregate([
    ...basePipeline,
    {
      $group: {
        _id: "$orderItems.product",
        totalSold: { $sum: "$orderItems.quantity" },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: parseInt(limit, 10) },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    { $unwind: "$productInfo" },
    {
      $project: {
        _id: 1,
        name: "$productInfo.name",
        image: { $arrayElemAt: ["$productInfo.images", 0] },
        totalSold: 1,
      },
    },
  ]);

  // 2. Sản phẩm doanh thu cao nhất
  const topByRevenuePromise = Order.aggregate([
    ...basePipeline,
    {
      $group: {
        _id: "$orderItems.product",
        revenue: {
          $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] },
        },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: parseInt(limit, 10) },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    { $unwind: "$productInfo" },
    {
      $project: {
        _id: 1,
        name: "$productInfo.name",
        image: { $arrayElemAt: ["$productInfo.images", 0] },
        revenue: 1,
      },
    },
  ]);

  const [topByQuantity, topByRevenue] = await Promise.all([
    topByQuantityPromise,
    topByRevenuePromise,
  ]);

  res.json({ topByQuantity, topByRevenue });
});

// --- BÁO CÁO KHÁCH HÀNG ---
// @desc    Lấy báo cáo về khách hàng
// @route   GET /api/v1/reports/customers
// @access  Private/Admin
const getCustomerReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 10 } = req.query;
  const dateFilter = getDateFilter(startDate, endDate);
  const match = getValidOrderMatch(dateFilter);

  // 1. Khách hàng mới
  const newCustomersPromise = User.countDocuments({
    role: "customer",
    ...(dateFilter && { createdAt: dateFilter }),
  });

  // 2. Khách hàng chi tiêu nhiều nhất
  const topSpendersPromise = Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$user",
        totalSpent: { $sum: "$totalPrice" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: parseInt(limit, 10) },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userInfo",
      },
    },
    { $unwind: "$userInfo" },
    {
      $project: {
        _id: 1,
        name: "$userInfo.name",
        email: "$userInfo.email",
        totalSpent: 1,
        orderCount: 1,
      },
    },
  ]);

  const [newCustomersCount, topSpenders] = await Promise.all([
    newCustomersPromise,
    topSpendersPromise,
  ]);

  res.json({ newCustomersCount, topSpenders });
});

// --- BÁO CÁO TỒN KHO ---
// @desc    Lấy báo cáo tồn kho
// @route   GET /api/v1/reports/inventory
// @access  Private/Admin
const getInventoryReport = asyncHandler(async (req, res) => {
  const lowStockThreshold = parseInt(req.query.lowStockThreshold, 10) || 10;

  // --- Sử dụng Aggregation để xử lý cả sản phẩm đơn giản và có biến thể ---
  const inventoryPipeline = [
    // Bước 1: "Trải phẳng" mảng variants, giữ lại cả các sản phẩm không có variant
    {
      $unwind: {
        path: "$variants",
        preserveNullAndEmptyArrays: true, // Rất quan trọng!
      },
    },
    // Bước 2: Tạo các trường tính toán
    {
      $project: {
        _id: {
          $ifNull: ["$variants._id", "$_id"],
        },
        productId: "$_id",
        name: {
          $cond: {
            if: { $ifNull: ["$variants", false] },
            // Tạo tên hiển thị cho variant
            then: "$name", // Chỉ lấy tên sản phẩm gốc
            else: "$name",
          },
        },
        variantOptions: "$variants.optionValues",
        sku: { $ifNull: ["$variants.sku", "$sku"] }, // Ưu tiên SKU của variant
        images: { $ifNull: ["$variants.images", "$images"] },
        // Tính toán tồn kho và giá của từng dòng (có thể là sp gốc hoặc variant)
        currentStock: {
          $cond: {
            if: { $ifNull: ["$variants", false] }, // Nếu có variant
            then: "$variants.stockQuantity",
            else: "$stockQuantity",
          },
        },
        currentPrice: {
          $cond: {
            if: { $ifNull: ["$variants", false] },
            then: "$variants.price",
            else: "$price",
          },
        },
      },
    },
    // Bước 3: Nhóm lại và tính toán các chỉ số
    {
      $group: {
        _id: null, // Nhóm tất cả lại thành 1
        totalInventoryValue: {
          $sum: { $multiply: ["$currentPrice", "$currentStock"] },
        },
        lowStockProducts: {
          $push: {
            $cond: {
              if: {
                $and: [
                  { $gt: ["$currentStock", 0] },
                  { $lte: ["$currentStock", lowStockThreshold] },
                ],
              },
              then: {
                _id: "$_id", // _id này đã duy nhất
                productId: "$productId",
                name: "$name",
                sku: "$sku",
                stockQuantity: "$currentStock",
                images: "$images",
                variantOptions: "$variantOptions",
              },
              else: "$$REMOVE", // Loại bỏ khỏi mảng nếu không thỏa mãn
            },
          },
        },
        outOfStockProducts: {
          $push: {
            $cond: {
              if: { $lte: ["$currentStock", 0] },
              then: {
                _id: "$_id",
                productId: "$productId",
                name: "$name",
                sku: "$sku",
                stockQuantity: "$currentStock",
                images: "$images",
                variantOptions: "$variantOptions",
              },
              else: "$$REMOVE",
            },
          },
        },

        outOfStockCount: {
          $sum: { $cond: [{ $lte: ["$currentStock", 0] }, 1, 0] },
        },
      },
    },
  ];

  const result = await Product.aggregate(inventoryPipeline);
  const reportData = result[0] || {}; // Lấy kết quả đầu tiên hoặc object rỗng

  res.json({
    totalInventoryValue: reportData.totalInventoryValue || 0,
    lowStockProducts: reportData.lowStockProducts || [],
    outOfStockProducts: reportData.outOfStockProducts || [],
    outOfStockCount: reportData.outOfStockCount || 0,
  });
});

module.exports = {
  getSalesReport,
  getProductReport,
  getCustomerReport,
  getInventoryReport,
};
