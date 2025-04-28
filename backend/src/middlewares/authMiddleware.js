const jwt = require("jsonwebtoken");
const User = require("../models/User");
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
        return res
          .status(401)
          .json({
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

module.exports = { protect, isAdmin };
