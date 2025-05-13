const Wishlist = require("../models/Wishlist");
const mongoose = require("mongoose");

const mergeGuestWishlistToUser = async (guestId, userId, res) => {
  console.log(
    `[Wishlist Merge] Bắt đầu gộp wishlist: GuestID=${guestId}, UserID=${userId}`
  );
  try {
    const guestWishlist = await Wishlist.findOne({ guestId: guestId }).lean();

    if (
      !guestWishlist ||
      !guestWishlist.items ||
      guestWishlist.items.length === 0
    ) {
      console.log(
        "[Wishlist Merge] Không tìm thấy wishlist của Guest hoặc rỗng. Không cần gộp."
      );
      clearGuestWishlistCookie(res);
      return;
    }

    // Tìm hoặc tạo wishlist cho user
    let userWishlist = await Wishlist.findOne({ user: userId });
    if (!userWishlist) {
      console.log("[Wishlist Merge] User chưa có wishlist, tạo mới.");
      userWishlist = new Wishlist({ user: userId, items: [] });
    }

    // Gộp items từ guest vào user wishlist
    const userItemIds = new Set(userWishlist.items.map((id) => id.toString()));
    guestWishlist.items.forEach((guestItemId) => {
      if (guestItemId) {
        // Đảm bảo guestItemId không null/undefined
        userItemIds.add(guestItemId.toString());
      }
    });

    userWishlist.items = Array.from(userItemIds).map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    await userWishlist.save();
    console.log("[Wishlist Merge] Đã gộp và lưu wishlist cho User.");

    // Xóa wishlist của guest
    await Wishlist.deleteOne({ guestId: guestId });
    console.log("[Wishlist Merge] Đã xóa wishlist của Guest.");

    clearGuestWishlistCookie(res);
  } catch (error) {
    console.error("[Wishlist Merge] Lỗi trong quá trình gộp wishlist:", error);
    clearGuestWishlistCookie(res); // Cố gắng xóa cookie dù lỗi
  }
};

const clearGuestWishlistCookie = (res) => {
  console.log("[Wishlist Merge] Đang xóa cookie wishlistGuestId.");
  res.cookie("wishlistGuestId", "", {
    httpOnly: false,
    expires: new Date(0),
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
  });
};

module.exports = { mergeGuestWishlistToUser, clearGuestWishlistCookie };
