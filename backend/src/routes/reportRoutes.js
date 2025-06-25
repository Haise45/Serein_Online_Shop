const express = require("express");
const {
  getSalesReport,
  getProductReport,
  getCustomerReport,
  getInventoryReport,
} = require("../controllers/reportController");
const { protect, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

// Tất cả các route trong đây đều yêu cầu quyền admin
router.use(protect, isAdmin);

router.get("/sales", getSalesReport);
router.get("/products", getProductReport);
router.get("/customers", getCustomerReport);
router.get("/inventory", getInventoryReport);

module.exports = router;
