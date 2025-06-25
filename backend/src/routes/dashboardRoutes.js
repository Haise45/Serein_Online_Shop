const express = require("express");
const {
  getDashboardStats,
  getRevenueChartData,
  getOrderStatusDistribution,
  getTopProducts,
} = require("../controllers/dashboardController");
const { protect, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

// Tất cả các route trong đây đều yêu cầu quyền admin
router.use(protect, isAdmin);

router.get("/stats", getDashboardStats);
router.get("/revenue-chart", getRevenueChartData);
router.get("/order-status-distribution", getOrderStatusDistribution);
router.get("/top-products", getTopProducts);

module.exports = router;
