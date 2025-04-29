const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { protect, isAdmin } = require("../middlewares/authMiddleware");
const { uploadImages } = require("../controllers/uploadController");

const router = express.Router();

// --- Cấu hình Multer động ---
const UPLOAD_BASE_DIR = path.join(
  __dirname,
  "..",
  "..",
  "public",
  "uploads",
  "images"
);

// Danh sách các khu vực được phép upload (quan trọng để bảo mật)
const allowedAreas = ["products", "categories", "users", "general"]; // Thêm các khu vực khác nếu cần

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const area = req.params.area; // Lấy khu vực từ URL

    // Kiểm tra xem khu vực có hợp lệ không
    if (!allowedAreas.includes(area)) {
      return cb(new Error(`Khu vực upload không hợp lệ: ${area}`), null);
    }

    const destinationPath = path.join(UPLOAD_BASE_DIR, area);

    // Tạo thư mục nếu chưa tồn tại
    // Dùng fs.promises để tạo thư mục bất đồng bộ (tốt hơn cho hiệu năng)
    fs.promises
      .mkdir(destinationPath, { recursive: true })
      .then(() => cb(null, destinationPath)) // Gọi callback khi tạo xong
      .catch((err) => cb(err, null)); // Gọi callback với lỗi nếu tạo thất bại
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension); // Tên file duy nhất
  },
});

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
  "/images/:area",
  protect, // Yêu cầu đăng nhập
  isAdmin, // Yêu cầu quyền Admin
  upload.array("images", 10), // Middleware xử lý upload nhiều file (tối đa 10), field name là 'images'
  (req, res, next) => {
    // Middleware xử lý lỗi cụ thể từ multer trước khi vào controller
    if (req.multerError) {
      return res
        .status(400)
        .json({ message: `Lỗi upload: ${req.multerError.message}` });
    }
    next();
  },
  uploadImages // Controller xử lý logic sau khi upload thành công
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
