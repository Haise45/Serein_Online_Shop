const express = require("express");
const {
  createCategory,
  getCategories,
  getAdminCategories,
  getCategoryByIdOrSlug,
  getAdminCategoryDetails,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const {
  protect,
  isAdmin,
  protectOptional,
} = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");
const {
  createCategorySchema,
  updateCategorySchema,
} = require("../validations/validationSchemas");

const router = express.Router();

// Public routes (ai cũng xem được)
router.get("/", protectOptional, getCategories);
router.get("/admin", protect, isAdmin, getAdminCategories); // Lấy danh sách tất cả categories dành cho admin
router.get("/:idOrSlug", protectOptional, getCategoryByIdOrSlug); // Dùng chung param cho ID hoặc Slug

// Admin only routes
router.get("/admin/:id", protect, isAdmin, getAdminCategoryDetails);
router.post(
  "/",
  protect, // Phải đăng nhập
  isAdmin, // Phải là admin
  validateRequest(createCategorySchema), // Validate dữ liệu
  createCategory
);
router.put(
  "/:id",
  protect,
  isAdmin,
  validateRequest(updateCategorySchema), // Validate dữ liệu cập nhật
  updateCategory
);
router.delete("/:id", protect, isAdmin, deleteCategory);

module.exports = router;
