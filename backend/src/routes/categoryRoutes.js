const express = require("express");
const {
  createCategory,
  getCategories,
  getCategoryByIdOrSlug,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { protect, isAdmin } = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");
const {
  createCategorySchema,
  updateCategorySchema,
} = require("../validations/validationSchemas");

const router = express.Router();

// Public routes (ai cũng xem được)
router.get("/", getCategories);
router.get("/:idOrSlug", getCategoryByIdOrSlug); // Dùng chung param cho ID hoặc Slug

// Admin only routes
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
