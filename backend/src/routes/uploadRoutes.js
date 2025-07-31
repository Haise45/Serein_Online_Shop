const express = require("express");
const multer = require("multer");
const { protect, isAdmin } = require("../middlewares/authMiddleware");
const {
  uploadImages,
  uploadEditorImage,
} = require("../controllers/uploadController");

const router = express.Router();

// --- Cấu hình Multer với MemoryStorage ---
const storage = multer.memoryStorage();

// Filter chỉ cho phép upload ảnh
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ được phép upload file hình ảnh!"), false);
  }
};

// Khởi tạo middleware multer
const upload = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Giới hạn kích thước file 10MB
    // files: 10 // Có thể giới hạn số lượng file mỗi lần upload ở đây
  },
});

// --- Định nghĩa Route Upload ---
// POST /api/v1/upload/images/:area
// Ví dụ: POST /api/v1/upload/images/products
// Body sẽ là form-data với field tên là "images" chứa các file ảnh (tối đa 10 file)
router.post(
  /^\/images\/(.*)/,
  protect, // Yêu cầu đăng nhập
  upload.array("images", 20), // Middleware xử lý upload nhiều file (tối đa 20), field name là 'images'
  (req, res, next) => {
    // Middleware xử lý lỗi cụ thể từ multer trước khi vào controller
    req.params.area = req.params[0];
    next();
  },
  uploadImages // Controller xử lý logic sau khi upload thành công
);

// Route cho CKEditor Upload Adapter
// Thường CKEditor adapter sẽ POST lên đây
router.post(
  "/editor", // Ví dụ: /api/v1/upload/editor
  protect,
  isAdmin,
  upload.single("upload"), // CKEditor thường gửi file với field name là 'upload'
  uploadEditorImage
);

// Middleware bắt lỗi Multer tổng quát (ví dụ file quá lớn)
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = `Lỗi Multer: ${error.message}`;
    if (error.code === "LIMIT_FILE_SIZE") {
      message = "File upload quá lớn. Giới hạn là 10MB.";
    } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Số lượng file hoặc tên field không đúng.";
    }
    console.error("Multer Error Caught:", error);
    return res.status(400).json({ message: message });
  } else if (error) {
    // Lỗi khác từ destination hoặc fileFilter
    console.error("Upload Route Error:", error);
    return res
      .status(400)
      .json({ message: error.message || "Lỗi không xác định khi upload." });
  }
  next(error); // Chuyển lỗi khác cho global error handler
});

module.exports = router;
