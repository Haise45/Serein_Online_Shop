const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// Sub-schema cho địa chỉ
const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true }, // Tên người nhận tại địa chỉ này
    phone: { type: String, required: true }, // SĐT người nhận tại địa chỉ này
    street: { type: String, required: true, trim: true }, // Số nhà, tên đường
    communeCode: { type: String, required: true },
    communeName: { type: String, required: true }, // Lưu tên để hiển thị dễ dàng
    districtCode: { type: String, required: true },
    districtName: { type: String, required: true },
    provinceCode: { type: String, required: true },
    provinceName: { type: String, required: true },
    countryCode: { type: String, default: "VN" },
    isDefault: { type: Boolean, default: false }, // Đánh dấu địa chỉ mặc định
  },
  { _id: true }
); // Cho phép mỗi address có _id riêng

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Vui lòng nhập tên"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Vui lòng nhập email"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        // Basic email format validation
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Vui lòng nhập địa chỉ email hợp lệ",
      ],
    },
    password: {
      type: String,
      required: [true, "Vui lòng nhập mật khẩu"],
      minlength: [6, "Mật khẩu phải có ít nhất 6 ký tự"],
      select: false, // Không tự động trả về password khi query user
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    phone: {
      type: String,
      required: [true, "Vui lòng nhập số điện thoại"],
      unique: true,
      trim: true,
    },
    addresses: [addressSchema],
    wishlistItems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String, // Lưu OTP (đã hash) để xác thực email
    emailVerificationExpires: Date, // Thời gian hết hạn của OTP
    passwordResetToken: String, // Lưu token (đã hash) để reset mật khẩu
    passwordResetExpires: Date, // Thời gian hết hạn của token
  },
  {
    timestamps: true,
  }
);

// Middleware: Hash password trước khi lưu user mới hoặc khi password được cập nhật
userSchema.pre("save", async function (next) {
  // Chỉ hash password nếu nó được thay đổi (hoặc là user mới)
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10); // Generate salt
    this.password = await bcrypt.hash(this.password, salt); // Hash password
    next();
  } catch (error) {
    next(error); // Pass error to error handler
  }
});

// Method: So sánh mật khẩu nhập vào với mật khẩu đã hash trong DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  // Cần lấy lại field password vì nó bị `select: false`
  const userWithPassword = await mongoose
    .model("User")
    .findById(this._id)
    .select("+password");
  if (!userWithPassword) return false; // Trường hợp hiếm gặp
  return await bcrypt.compare(enteredPassword, userWithPassword.password);
};

// Method: Tạo và hash token reset mật khẩu
userSchema.methods.createPasswordResetToken = function () {
  // 1. Tạo token gốc (gửi cho user)
  const resetToken = crypto.randomBytes(32).toString("hex");

  // 2. Hash token này để lưu vào DB
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // 3. Đặt thời gian hết hạn (ví dụ: 10 phút)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  console.log({
    resetTokenPlain: resetToken,
    resetTokenHashed: this.passwordResetToken,
  }); // Debug

  // Trả về token gốc (chưa hash) để gửi qua email
  return resetToken;
};

// Method: Tạo và hash OTP Email
userSchema.methods.createEmailVerificationOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // Hash OTP
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

  this.emailVerificationToken = hashedOTP;

  // Thời gian hết hạn OTP
  this.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 phút\

  console.log(
    `[OTP Gen] User: ${this.email}, OTP: ${otp}, Expires: ${this.emailVerificationExpires}`
  );
  return otp; // Trả về OTP gốc để gửi email
};

const User = mongoose.model("User", userSchema);

module.exports = User;
