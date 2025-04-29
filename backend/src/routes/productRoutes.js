const express = require("express");
const {
  createProduct,
  getProducts,
  getProductByIdOrSlug,
  updateProduct,
  deleteProduct,
  updateProductStock,
  updateVariantStock,
} = require("../controllers/productController");
const { protect, isAdmin } = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");
const {
  createProductSchema,
  updateProductSchema,
} = require("../validations/validationSchemas");

const router = express.Router();

// === Public Routes ===

// GET /api/v1/products : Lấy danh sách sản phẩm
// Hỗ trợ các query params: page, limit, sortBy, sortOrder, category (slug), categoryId, minPrice, maxPrice, search, attributes[...]
router.get("/", getProducts);

// GET /api/v1/products/:idOrSlug : Lấy chi tiết một sản phẩm
// :idOrSlug có thể là ID của sản phẩm hoặc slug của sản phẩm
router.get("/:idOrSlug", getProductByIdOrSlug);

// === Admin Routes ===

// --- CRUD Sản phẩm ---

// POST /api/v1/products : Tạo sản phẩm mới
router.post(
  "/", // Đường dẫn gốc cho products
  protect, // Middleware: Yêu cầu đăng nhập (có token hợp lệ)
  isAdmin, // Middleware: Yêu cầu vai trò 'admin'
  validateRequest(createProductSchema), // Middleware: Xác thực body request với schema Joi
  createProduct // Controller: Hàm xử lý tạo sản phẩm
);

// PUT /api/v1/products/:id : Cập nhật thông tin sản phẩm
router.put(
  "/:id", // Đường dẫn chứa ID sản phẩm cần cập nhật
  protect, // Yêu cầu đăng nhập
  isAdmin, // Yêu cầu quyền Admin
  validateRequest(updateProductSchema), // Xác thực body request với schema Joi (có thể khác create)
  updateProduct // Controller: Hàm xử lý cập nhật sản phẩm
);

// DELETE /api/v1/products/:id : Xóa (ẩn) sản phẩm - Soft Delete
router.delete(
  "/:id", // Đường dẫn chứa ID sản phẩm cần xóa
  protect, // Yêu cầu đăng nhập
  isAdmin, // Yêu cầu quyền Admin
  deleteProduct // Controller: Hàm xử lý xóa sản phẩm
);

// --- Quản lý Tồn kho Thủ công (Admin điều chỉnh) ---

// PUT /api/v1/products/:id/stock : Cập nhật tồn kho cho sản phẩm chính (khi không có biến thể)
// Yêu cầu body: { "change": number } hoặc { "set": number }
router.put(
  "/:id/stock", // Đường dẫn chứa ID sản phẩm
  protect, // Yêu cầu đăng nhập
  isAdmin, // Yêu cầu quyền Admin
  updateProductStock // Controller: Hàm xử lý cập nhật tồn kho chính
);

// PUT /api/v1/products/:productId/variants/:variantId/stock : Cập nhật tồn kho cho một biến thể cụ thể
// Yêu cầu body: { "change": number } hoặc { "set": number }
router.put(
  "/:productId/variants/:variantId/stock", // Đường dẫn chứa ID sản phẩm và ID biến thể
  protect, // Yêu cầu đăng nhập
  isAdmin, // Yêu cầu quyền Admin
  updateVariantStock // Controller: Hàm xử lý cập nhật tồn kho biến thể
);

module.exports = router;
