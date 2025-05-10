const express = require("express");
const {
  registerUser,
  verifyEmailOTP,
  resendVerificationEmail,
  loginUserAccessTokenOnly,
  loginUserWithRefreshToken,
  refreshToken,
  logoutUser,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const validateRequest = require("../middlewares/validationMiddleware");
const {
  registerSchema,
  verifyOtpSchema,
  emailSchema,
  loginSchema,
} = require("../validations/validationSchemas");

const router = express.Router();

router.post("/register", validateRequest(registerSchema), registerUser);
// POST /api/v1/auth/verify-email - Body: { email, otp }
router.post("/verify-email", validateRequest(verifyOtpSchema), verifyEmailOTP);
// POST /api/v1/auth/resend-verification-email - Body: { email }
router.post(
  "/resend-verification-email",
  validateRequest(emailSchema),
  resendVerificationEmail
);
router.post("/login", validateRequest(loginSchema), loginUserAccessTokenOnly);
router.post(
  "/login-refresh",
  validateRequest(loginSchema),
  loginUserWithRefreshToken
);
router.post("/refresh", refreshToken);
router.post("/logout", logoutUser);
// Yêu cầu body: { "email": "user@example.com" }
router.post("/forgot-password", forgotPassword);
// Yêu cầu params: token trong URL
// Yêu cầu body: { "password": "newSecurePassword" }
router.put("/reset-password/:token", resetPassword);

module.exports = router;
