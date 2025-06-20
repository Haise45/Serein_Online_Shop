const express = require("express");
const {
  getUserProfile,
  updateUserProfile,
  getUsers, // Admin
  getUserDetailsById, // Admin
  updateUserStatus, // Admin
  getUserAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/userController");
const { protect, isAdmin } = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validationMiddleware");
const {
  updateProfileSchema,
  addressSchemaValidation,
  updateUserStatusSchema,
} = require("../validations/validationSchemas");

const router = express.Router();

// User specific routes (require login)
router
  .route("/profile")
  .get(protect, getUserProfile) // Phải đăng nhập
  .put(protect, validateRequest(updateProfileSchema), updateUserProfile); // Phải đăng nhập + validate

// --- Routes quản lý địa chỉ ---
router
  .route("/addresses")
  .get(protect, getUserAddresses) // Lấy danh sách địa chỉ
  // Validate dữ liệu gửi lên khi thêm địa chỉ mới
  .post(protect, validateRequest(addressSchemaValidation), addAddress);

router
  .route("/addresses/:addressId")
  // Validate dữ liệu gửi lên khi cập nhật địa chỉ
  .put(protect, validateRequest(addressSchemaValidation), updateAddress)
  .delete(protect, deleteAddress); // Xóa địa chỉ

router.route("/addresses/:addressId/default").put(protect, setDefaultAddress); // Đặt làm mặc định

// Admin specific routes (require login + admin role)
router.route("/").get(protect, isAdmin, getUsers); // Phải là admin

router.route("/:id").get(protect, isAdmin, getUserDetailsById);

router
  .route("/:id/status")
  .put(
    protect,
    isAdmin,
    validateRequest(updateUserStatusSchema),
    updateUserStatus
  );

module.exports = router;
