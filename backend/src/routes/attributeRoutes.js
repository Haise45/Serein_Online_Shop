const express = require("express");
const {
  protect,
  isAdmin,
  protectOptional,
} = require("../middlewares/authMiddleware");

const {
  createAttribute,
  getAttributes,
  getAdminAttributes,
  addAttributeValue,
  updateAttributeValue,
  deleteAttributeValue,
} = require("../controllers/attributeController");

const router = express.Router();

// GET /api/attributes => optional protect (cho phép public nhưng vẫn check nếu có token)
router.get("/", protectOptional, getAttributes);

// GET /api/attributes/admin => cần đăng nhập & là admin
router.get("/admin", protect, isAdmin, getAdminAttributes);

// POST /api/attributes => cần đăng nhập & là admin
router.post("/", protect, isAdmin, createAttribute);

// POST /api/attributes/:id/values => cần đăng nhập & là admin
router.post("/:id/values", protect, isAdmin, addAttributeValue);

// PUT & DELETE /api/attributes/:attributeId/values/:valueId => cần đăng nhập & là admin
router
  .route("/:attributeId/values/:valueId")
  .put(protect, isAdmin, updateAttributeValue)
  .delete(protect, isAdmin, deleteAttributeValue);

module.exports = router;
