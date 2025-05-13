const asyncHandler = require("../middlewares/asyncHandler");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// @desc    Upload multiple images to Cloudinary
// @route   POST /api/v1/upload/images/:area
// @access  Private/Admin (or Private)
const uploadImages = asyncHandler(async (req, res) => {
  const area = req.params.area || "general"; // Lấy khu vực, mặc định là 'general'

  // req.files được tạo bởi multer với memoryStorage (chứa buffer)
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error("Vui lòng chọn ít nhất một file để upload.");
  }

  const uploadPromises = []; // Mảng chứa các promise upload lên Cloudinary

  console.log(
    `[Cloudinary Upload] Bắt đầu upload ${req.files.length} file(s) vào folder: shop/${area}`
  );

  for (const file of req.files) {
    uploadPromises.push(
      new Promise((resolve, reject) => {
        // Tạo stream từ buffer của file
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `shop/${area}`, // Tạo thư mục con trên Cloudinary
            // public_id: `custom_name_${Date.now()}`, // Tùy chọn đặt tên file
            resource_type: "auto", // Tự động nhận diện loại file
            // Thêm transformation nếu muốn tối ưu ảnh ngay khi upload
            transformation: [
              { width: 1000, height: 1000, crop: "limit" }, // Giới hạn kích thước
              { quality: "auto:good" }, // Chất lượng tự động tốt
            ],
          },
          (error, result) => {
            if (error) {
              console.error("[Cloudinary Upload] Lỗi upload file:", error);
              return reject(new Error("Upload file lên Cloudinary thất bại."));
            }
            if (result) {
              console.log(
                `[Cloudinary Upload] Thành công: ${result.secure_url}`
              );
              resolve(result.secure_url); // Trả về URL an toàn (HTTPS)
            } else {
              reject(new Error("Kết quả upload Cloudinary không hợp lệ."));
            }
          }
        );
        // Đưa buffer vào stream để upload
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      })
    );
  }

  try {
    // Chờ tất cả các promise upload hoàn thành
    const uploadedUrls = await Promise.all(uploadPromises);

    res.status(201).json({
      message: `Upload ${uploadedUrls.length} ảnh lên Cloudinary thành công!`,
      imageUrls: uploadedUrls, // Trả về mảng các Cloudinary URL
    });
  } catch (error) {
    console.error("[Cloudinary Upload] Lỗi khi chờ các promise upload:", error);
    res.status(500); // Lỗi server nếu một trong các uploads thất bại
    throw new Error(error.message || "Upload ảnh thất bại.");
  }
});

// @desc    Upload single image from CKEditor
// @route   POST /api/v1/upload/editor
// @access  Private/Admin
const uploadEditorImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    // CKEditor mong đợi lỗi có cấu trúc cụ thể
    return res.status(400).json({
      uploaded: 0,
      error: { message: "Không có file nào được tải lên." },
    });
  }

  // Upload lên Cloudinary (hoặc lưu vào thư mục public/uploads/images/editor)
  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "shop/editor", resource_type: "auto" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    if (!result || !result.secure_url) {
      throw new Error("Upload lên Cloudinary không trả về URL.");
    }

    // CKEditor mong đợi response dạng này khi thành công
    res.status(200).json({
      uploaded: 1,
      fileName: req.file.originalname, // Hoặc result.public_id
      url: result.secure_url, // URL từ Cloudinary
    });
  } catch (error) {
    console.error("[CKEditor Upload] Lỗi:", error);
    res.status(500).json({
      uploaded: 0,
      error: { message: error.message || "Upload ảnh cho editor thất bại." },
    });
  }
});

module.exports = {
  uploadImages,
  uploadEditorImage,
};
