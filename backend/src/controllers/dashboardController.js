const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const asyncHandler = require("../middlewares/asyncHandler");
const mongoose = require("mongoose");

// Helper: Tạo điều kiện lọc theo ngày
const getDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate) filter.$gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Bao gồm cả ngày kết thúc
    filter.$lte = end;
  }
  return Object.keys(filter).length ? filter : null;
};

// @desc    Lấy các số liệu thống kê tổng quan
// @route   GET /api/v1/dashboard/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const dateFilter = getDateFilter(startDate, endDate);

  const orderMatch = {
    status: { $in: ["Processing", "Shipped", "Delivered"] },
  };
  if (dateFilter) orderMatch.createdAt = dateFilter;

  // --- Chạy các query song song ---
  const [revenueData, orderCount, newUserCount, totalProducts] =
    await Promise.all([
      // 1. Tổng doanh thu và số đơn hàng thành công
      Order.aggregate([
        { $match: orderMatch },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalPrice" },
          },
        },
      ]),
      // 2. Tổng số đơn hàng (mọi trạng thái, trừ Cancelled/Refunded)
      Order.countDocuments({
        status: { $nin: ["Cancelled", "Refunded"] },
        ...(dateFilter && { createdAt: dateFilter }),
      }),
      // 3. Số người dùng mới đăng ký
      User.countDocuments({
        role: "customer",
        ...(dateFilter && { createdAt: dateFilter }),
      }),
      // 4. Tổng số sản phẩm đang có
      Product.countDocuments({ isActive: true }),
    ]);

  res.json({
    totalRevenue: revenueData[0]?.totalRevenue || 0,
    totalOrders: orderCount,
    newUsers: newUserCount,
    totalProducts,
  });
});

// @desc    Lấy dữ liệu cho biểu đồ doanh thu
// @route   GET /api/v1/dashboard/revenue-chart
// @access  Private/Admin
const getRevenueChartData = asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy = "day" } = req.query;
  const dateFilter = getDateFilter(startDate, endDate);

  if (!dateFilter) {
    res.status(400);
    throw new Error("Vui lòng cung cấp khoảng thời gian (startDate, endDate).");
  }

  const groupFormats = {
    day: {
      $dateToString: {
        format: "%Y-%m-%d",
        date: "$createdAt",
        timezone: "Asia/Ho_Chi_Minh",
      },
    },
    month: {
      $dateToString: {
        format: "%Y-%m",
        date: "$createdAt",
        timezone: "Asia/Ho_Chi_Minh",
      },
    },
    year: {
      $dateToString: {
        format: "%Y",
        date: "$createdAt",
        timezone: "Asia/Ho_Chi_Minh",
      },
    },
    // Logic cho quý: Ghép năm và quý lại
    quarter: {
      $concat: [
        {
          $toString: {
            $year: { date: "$createdAt", timezone: "Asia/Ho_Chi_Minh" },
          },
        },
        "-Q",
        {
          $toString: {
            $ceil: {
              $divide: [
                {
                  $month: { date: "$createdAt", timezone: "Asia/Ho_Chi_Minh" },
                },
                3,
              ],
            },
          },
        },
      ],
    },
  };

  const matchStage = {
    createdAt: { $exists: true, $ne: null, ...dateFilter }, // Đảm bảo createdAt tồn tại, không null và nằm trong khoảng lọc
    status: { $in: ["Processing", "Shipped", "Delivered"] },
  };

  const data = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: groupFormats[groupBy],
        totalRevenue: { $sum: "$totalPrice" },
        orderCount: { $sum: 1 },
        productSoldCount: { $sum: { $sum: "$orderItems.quantity" } },
      },
    },
    { $sort: { _id: 1 } }, // Sắp xếp theo ngày/tháng/năm
  ]);

  // Trả về labels và datasets cho Chart.js
  const labels = data.map((d) => d._id);
  const revenueDataset = data.map((d) => d.totalRevenue);
  const orderCountDataset = data.map((d) => d.orderCount);
  const productSoldCountDataset = data.map((d) => d.productSoldCount);

  res.json({
    labels,
    datasets: [
      { label: "Doanh thu", data: revenueDataset },
      { label: "Số đơn hàng", data: orderCountDataset },
      { label: "Số sản phẩm đã bán", data: productSoldCountDataset },
    ],
  });
});

// @desc    Lấy dữ liệu cho biểu đồ tròn (trạng thái đơn hàng)
// @route   GET /api/v1/dashboard/order-status-distribution
// @access  Private/Admin
const getOrderStatusDistribution = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const dateFilter = getDateFilter(startDate, endDate);

  const matchStage = {};
  if (dateFilter) matchStage.createdAt = dateFilter;

  const data = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json(data); // Trả về dạng [{ _id: 'Delivered', count: 10 }, ...]
});

// @desc    Lấy top sản phẩm bán chạy
// @route   GET /api/v1/dashboard/top-products
// @access  Private/Admin
const getTopProducts = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 10 } = req.query;
  const dateFilter = getDateFilter(startDate, endDate);

  const matchStage = {
    status: { $in: ["Processing", "Shipped", "Delivered"] },
  };
  if (dateFilter) matchStage.createdAt = dateFilter;

  const topProducts = await Order.aggregate([
    { $match: matchStage },
    { $unwind: "$orderItems" },
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
        _id: 0,
        productId: "$_id",
        name: "$productInfo.name",
        image: { $arrayElemAt: ["$productInfo.images", 0] },
        averageRating: "$productInfo.averageRating",
        totalSold: "$totalSold",
      },
    },
  ]);

  res.json(topProducts);
});

module.exports = {
  getDashboardStats,
  getRevenueChartData,
  getOrderStatusDistribution,
  getTopProducts,
};
