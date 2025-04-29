const asyncHandler = require("../middlewares/asyncHandler");

// @desc    Upload multiple images for a specific area (products, categories, etc.)
// @route   POST /api/v1/upload/images/:area
// @access  Private/Admin
const uploadImages = asyncHandler(async (req, res) => {
  const area = req.params.area; // Lấy khu vực từ URL (vd: 'products')

  // req.files được tạo bởi middleware multer upload.array()
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error("Vui lòng chọn ít nhất một file để upload.");
  }

  // Tạo mảng các URL công khai tương đối cho các ảnh đã upload
  const imageUrls = req.files.map((file) => {
    // Đường dẫn phụ thuộc vào cấu hình destination của multer và express.static
    // Ví dụ: /uploads/images/products/ten-file-duy-nhat.jpg
    return `/uploads/images/${area}/${file.filename}`;
  });

  res.status(201).json({
    message: `Upload ${req.files.length} ảnh thành công vào khu vực '${area}'!`,
    imageUrls: imageUrls, // Trả về mảng các URL
  });
});

module.exports = {
  uploadImages,
};
