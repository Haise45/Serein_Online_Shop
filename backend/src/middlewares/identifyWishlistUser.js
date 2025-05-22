const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("./asyncHandler");

const identifyWishlistUser = asyncHandler(async (req, res, next) => {
  console.log(`[Identify Wishlist User] Method: ${req.method}, URL: ${req.originalUrl}`);
  // Ưu tiên user đã đăng nhập (middleware protectOptional đã chạy trước)
  if (req.user) {
    console.log("[Wishlist Identifier] User identified:", req.user._id);
    req.wishlistIdentifier = { user: req.user._id };
    return next();
  }

  // Nếu không đăng nhập, kiểm tra cookie wishlistGuestId
  let guestId = req.cookies.wishlistGuestId;

  if (guestId) {
    console.log("[Wishlist Identifier] Guest identified by cookie:", guestId);
    req.wishlistIdentifier = { guestId: guestId };
  } else {
    guestId = uuidv4();
    console.log(
      "[Wishlist Identifier] New guest for wishlist, generating ID:",
      guestId
    );

    const cookieOptions = {
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Lưu 1 năm
      httpOnly: false, // Để JS client có thể đọc nếu cần (thường không cần)
      // secure: req.secure || process.env.NODE_ENV === "production",
      secure: true,
      sameSite: 'None',
      path: "/",
    };
    res.cookie("wishlistGuestId", guestId, cookieOptions);
    console.log("[Wishlist Identifier] Set new wishlistGuestId cookie.");

    req.wishlistIdentifier = { guestId: guestId };
  }
  next();
});

module.exports = identifyWishlistUser;
