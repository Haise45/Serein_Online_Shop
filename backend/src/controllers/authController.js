const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken");
const asyncHandler = require("../middlewares/asyncHandler");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const passwordResetTemplate = require("../utils/emailTemplates/passwordResetTemplate");

// --- Tiện ích thiết lập Cookie ---
const setRefreshTokenCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true, // Ngăn JavaScript phía client truy cập cookie
    secure: process.env.NODE_ENV === "production", // Chỉ gửi qua HTTPS ở môi trường production
    sameSite: "strict",
    maxAge:
      parseInt(process.env.JWT_REFRESH_EXPIRES_IN_SECONDS || "604800", 10) *
      1000, // 7 days * 24 * 60 * 60 * 1000
  };
  res.cookie("refreshToken", token, cookieOptions);
};

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  // 1. Check if user already exists
  const emailExists = await User.findOne({ email });
  if (emailExists) {
    res.status(400); // Bad Request
    throw new Error("Email đã được sử dụng.");
  }

  // 2. Check if phone already exists
  const phoneExists = await User.findOne({ phone });
  if (phoneExists) {
    res.status(400);
    throw new Error("Số điện thoại đã được sử dụng.");
  }

  // 3. Create new user (password hashing is handled by pre-save hook in model)
  const user = await User.create({
    name,
    email,
    password,
    phone,
  });

  // 3. Respond with user info and token
  if (user) {
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Gửi refresh token qua httpOnly cookie
    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      // 201 Created
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      addresses: user.addresses,
      accessToken: accessToken,
    });
  } else {
    res.status(400);
    throw new Error("Dữ liệu người dùng không hợp lệ.");
  }
});

// @desc    Authenticate user & get access token (Login)
// @route   POST /api/v1/auth/login
// @access  Public
const loginUserAccessTokenOnly = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Find user by email
  const user = await User.findOne({ email }); //.select('+password'); // select password here if needed or use matchPassword method which does it

  // 2. Check if user exists and password matches
  if (user && (await user.matchPassword(password))) {
    const accessToken = generateAccessToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken: accessToken,
    });
  } else {
    res.status(401); // Unauthorized
    throw new Error("Email hoặc mật khẩu không đúng.");
  }
});

// @desc    Authenticate user & get access token and refresh token (Login)
// @route   POST /api/v1/auth/login-refresh
// @access  Public
const loginUserWithRefreshToken = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Find user by email
  const user = await User.findOne({ email }); //.select('+password'); // select password here if needed or use matchPassword method which does it

  // 2. Check if user exists and password matches
  if (user && (await user.matchPassword(password))) {
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Gửi refresh token qua httpOnly cookie
    setRefreshTokenCookie(res, refreshToken);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken: accessToken,
    });
  } else {
    res.status(401); // Unauthorized
    throw new Error("Email hoặc mật khẩu không đúng.");
  }
});

// @desc    Refresh access token using refresh token from cookie
// @route   POST /api/v1/auth/refresh
// @access  Public (vì access token có thể đã hết hạn, nhưng cần có refresh token hợp lệ)
const refreshToken = asyncHandler(async (req, res) => {
  // Lấy refresh token từ cookie đã được parse bởi cookie-parser
  const token = req.cookies.refreshToken;

  if (!token) {
    res.status(401);
    throw new Error("Không tìm thấy refresh token.");
  }

  try {
    // Xác thực refresh token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // Tìm user dựa trên id trong token đã giải mã
    const user = await User.findById(decoded.id).select("-password"); // Không cần trả password

    if (!user) {
      // Nếu user không tồn tại (có thể đã bị xóa)
      res.status(401);
      throw new Error("Người dùng không hợp lệ.");
    }

    // Tạo Access Token MỚI
    const newAccessToken = generateAccessToken(user._id);

    // (Tùy chọn - Token Rotation: Tạo cả Refresh Token mới và gửi lại cookie)
    // const newRefreshToken = generateRefreshToken(user._id);
    // setRefreshTokenCookie(res, newRefreshToken);

    // Trả về Access Token mới
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      accessToken: newAccessToken,
    });
  } catch (error) {
    // Xử lý lỗi xác thực token (hết hạn, không hợp lệ)
    console.error("Refresh Token Error:", error.message);
    res.status(403); // Forbidden - Token không hợp lệ hoặc hết hạn
    throw new Error("Refresh token không hợp lệ hoặc đã hết hạn.");
  }
});

// @desc    Logout user and clear refresh token cookie
// @route   POST /api/v1/auth/logout
// @access  Public (nhưng thường gọi khi đã đăng nhập)
const logoutUser = asyncHandler(async (req, res) => {
  // Xóa cookie bằng cách gửi lại cookie với tên giống hệt,
  // giá trị rỗng và ngày hết hạn trong quá khứ.
  res.cookie("refreshToken", "", {
    httpOnly: true,
    expires: new Date(0), // Đặt thời gian hết hạn về quá khứ
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.status(200).json({ message: "Đăng xuất thành công." });
});

// @desc    Forgot password - Request password reset link
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  // 1. Lấy email từ body
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error("Vui lòng cung cấp địa chỉ email.");
  }

  // 2. Tìm user bằng email
  const user = await User.findOne({ email });

  // **Quan trọng:** Kể cả khi không tìm thấy user, vẫn trả về thông báo thành công
  // để tránh tiết lộ email nào đã đăng ký.
  if (!user) {
    console.log(`Password reset requested for non-existent email: ${email}`);
    return res.status(200).json({
      message:
        "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.",
    });
  }

  // 3. Tạo token reset (lấy token gốc để gửi email)
  const resetToken = user.createPasswordResetToken();

  // 4. Lưu user với token và thời gian hết hạn vào DB
  try {
    await user.save({ validateBeforeSave: false }); // Tắt validate vì có thể thiếu password nếu user mới tạo chưa set
  } catch (err) {
    // Nếu có lỗi khi lưu (ví dụ DB), xóa token và báo lỗi nội bộ
    console.error("Error saving user with reset token:", err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // Không cần save lại ở đây, chỉ cần báo lỗi
    res.status(500);
    throw new Error("Có lỗi xảy ra, vui lòng thử lại.");
  }

  // 5. Tạo URL reset (trỏ đến trang reset password trên frontend)
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  // 6. Tạo nội dung email
  const textMessage = `
        Xin chào ${user.name || "bạn"},

        Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
        Vui lòng nhấp vào liên kết sau hoặc sao chép và dán vào trình duyệt để hoàn tất quá trình:
        ${resetUrl}

        Liên kết này sẽ hết hạn sau 10 phút.

        Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

        Trân trọng,
        ${process.env.SHOP_NAME || "Cửa Hàng Của Bạn"}
    `;

  // Nội dung HTML (sử dụng template)
  const htmlMessage = passwordResetTemplate(user.name, resetUrl);

  // 7. Gửi email
  try {
    await sendEmail({
      email: user.email,
      subject: "Đặt lại mật khẩu Serein Online Store",
      message: textMessage,
      html: htmlMessage,
    });

    res.status(200).json({
      message: "Hướng dẫn đặt lại mật khẩu đã được gửi tới email của bạn.",
    });
  } catch (err) {
    // Nếu gửi mail lỗi, xóa token đã lưu và báo lỗi
    console.error("Error sending password reset email:", err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false }); // Cố gắng lưu lại trạng thái không có token

    res.status(500);
    throw new Error(
      "Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau."
    );
  }
});

// @desc    Reset password using token
// @route   PUT /api/v1/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  // 1. Lấy token gốc từ URL params
  const plainToken = req.params.token;
  const { password } = req.body; // Lấy mật khẩu mới

  if (!password || password.length < 6) {
    res.status(400);
    throw new Error("Mật khẩu phải có ít nhất 6 ký tự.");
  }

  // 2. Hash token gốc nhận được để tìm trong DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(plainToken)
    .digest("hex");

  // 3. Tìm user bằng token đã hash VÀ kiểm tra thời gian hết hạn
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }, // Chỉ tìm token chưa hết hạn
  });

  // 4. Nếu không tìm thấy user (token sai hoặc hết hạn)
  if (!user) {
    res.status(400);
    throw new Error("Token không hợp lệ hoặc đã hết hạn.");
  }

  // 5. Đặt lại mật khẩu mới (middleware pre-save sẽ hash)
  user.password = password;
  // 6. Xóa thông tin token reset
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // 7. Lưu lại user
  await user.save(); // Validate sẽ được chạy (bao gồm cả việc hash password)

  res.status(200).json({ message: "Mật khẩu đã được cập nhật thành công." });
});

module.exports = {
  registerUser,
  loginUserAccessTokenOnly,
  loginUserWithRefreshToken,
  refreshToken,
  logoutUser,
  forgotPassword,
  resetPassword,
};
