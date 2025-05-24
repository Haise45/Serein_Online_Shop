const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("./asyncHandler");

const identifyCartUser = asyncHandler(async (req, res, next) => {
  // Ưu tiên user đã đăng nhập
  if (req.user) {
    console.log("[Cart Identifier] User identified:", req.user._id);
    req.cartIdentifier = { userId: req.user._id };
    return next();
  }

  // Nếu không đăng nhập, kiểm tra cookie guestId
  let guestId = req.cookies.cartGuestId;

  if (guestId) {
    console.log("[Cart Identifier] Guest identified by cookie:", guestId);
    req.cartIdentifier = { guestId: guestId };
  } else {
    // Nếu không có cookie, tạo guestId mới
    guestId = uuidv4();
    console.log("[Cart Identifier] New guest, generating ID:", guestId);

    // Thiết lập cookie cho client
    const isProduction = process.env.NODE_ENV === "production";
    const isSecure = req.secure || isProduction;

    const cookieOptions = {
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày
      httpOnly: false, // Cho phép JS đọc, nhưng đảm bảo không chứa thông tin nhạy cảm
      secure: isSecure, // Chỉ gửi qua HTTPS ở production
      sameSite: isSecure ? "None" : "Lax", // "None" yêu cầu Secure (hợp lệ cho cross-site)
      path: "/", // Có hiệu lực toàn site
    };
    
    res.cookie("cartGuestId", guestId, cookieOptions);
    console.log("[Cart Identifier] Set new guest cookie.");

    // Gắn guestId mới vào request
    req.cartIdentifier = { guestId: guestId };
  }

  next();
});

module.exports = identifyCartUser;
