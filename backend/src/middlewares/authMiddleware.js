const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("./asyncHandler");
require("dotenv").config();

// Middleware to protect routes requiring authentication
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header (Bearer token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header (remove 'Bearer ')
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token payload (id) and attach to request
      // Exclude password field from the user object attached to req
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          message: "Không tìm thấy người dùng liên kết với token này.",
        });
      }

      next(); // Proceed to the next middleware/route handler
    } catch (error) {
      console.error("Token verification failed:", error.message);
      // Handle specific JWT errors
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Token không hợp lệ." });
      }
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token đã hết hạn." });
      }
      // Generic error for other issues
      return res
        .status(401)
        .json({ message: "Không được phép truy cập, token thất bại." });
    }
  }

  if (!token) {
    res
      .status(401)
      .json({ message: "Không được phép truy cập, không tìm thấy token." });
  }
};

// Middleware to check for admin role
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next(); // User is admin, proceed
  } else {
    res.status(403); // Forbidden
    throw new Error(
      "Không có quyền truy cập tài nguyên này (yêu cầu quyền Admin)."
    );
  }
};

// --- Hàm protectOptional ---
// Mục đích: Cố gắng xác thực token nếu có, nhưng không báo lỗi nếu thiếu/sai. Luôn gọi next().
const protectOptional = asyncHandler(async (req, res, next) => {
  console.log(`[Protect Optional] Method: ${req.method}, URL: ${req.originalUrl}`);
  let token;
  req.user = null;

  // Kiểm tra xem header Authorization có tồn tại và bắt đầu bằng 'Bearer' không
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Lấy token từ header
      token = req.headers.authorization.split(" ")[1];
      // Xác thực token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Tìm user trong DB dựa trên ID từ token
      const userFound = await User.findById(decoded.id).select("-password");
      // Nếu tìm thấy user, gắn vào request
      if (userFound) {
        req.user = userFound;
        console.log("[Protect Optional] Người dùng đã xác thực:", req.user._id);
      } else {
        // Token hợp lệ nhưng user không còn trong DB
        console.log(
          "[Protect Optional] Token hợp lệ nhưng không tìm thấy user trong DB."
        );
      }
    } catch (error) {
      // Nếu token không hợp lệ (sai, hết hạn), bỏ qua lỗi và chỉ log ra
      console.log(
        "[Protect Optional] Xác thực token thất bại hoặc token hết hạn (bỏ qua lỗi):",
        error.message
      );
    }
  } else {
    // Không tìm thấy token trong header
    console.log(
      "[Protect Optional] Không tìm thấy token trong header Authorization."
    );
  }

  next();
});

// --- Hàm kiểm tra User đã xác thực Email chưa ---
// Middleware này phải chạy SAU 'protect' (hoặc 'protectOptional' nếu áp dụng cho route đó)
const isVerifiedUser = (req, res, next) => {
  // Giả định req.user đã được gắn bởi middleware protect/protectOptional
  if (req.user && req.user.isEmailVerified) {
    // Nếu user tồn tại và đã xác thực email, cho phép tiếp tục
    next();
  } else if (req.user && !req.user.isEmailVerified) {
    // Nếu user tồn tại nhưng chưa xác thực email
    res.status(403); // Forbidden
    throw new Error(
      "Tài khoản của bạn chưa được xác thực email. Vui lòng kiểm tra email và nhập mã OTP."
    );
  } else {
    res.status(401); // Unauthorized
    throw new Error(
      "Yêu cầu đăng nhập và xác thực email để thực hiện hành động này."
    );
  }
};

module.exports = { protect, isAdmin, protectOptional, isVerifiedUser };
