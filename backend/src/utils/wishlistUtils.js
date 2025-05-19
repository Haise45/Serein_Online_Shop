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

    let itemsActuallyAddedCount = 0;

    // Lặp qua từng item trong guestWishlist
    guestWishlist.items.forEach((guestItem) => {
      // Bỏ qua nếu guestItem hoặc guestItem.product không hợp lệ
      if (!guestItem || !guestItem.product) {
        console.warn(
          "[Wishlist Merge] Bỏ qua guest item không hợp lệ:",
          guestItem
        );
        return;
      }

      // guestItem.product và guestItem.variant (nếu có) đã là ObjectId do .lean()
      const guestProductIdString = guestItem.product.toString();
      const guestVariantIdString = guestItem.variant
        ? guestItem.variant.toString()
        : null;

      // Kiểm tra xem item này (product + variant) đã tồn tại trong userWishlist chưa
      const itemAlreadyExists = userWishlist.items.some((userItem) => {
        if (!userItem || !userItem.product) return false;

        const userProductIdString = userItem.product.toString();
        const userVariantIdString = userItem.variant
          ? userItem.variant.toString()
          : null;

        // So sánh product ID
        if (userProductIdString !== guestProductIdString) {
          return false;
        }

        // So sánh variant ID (cả hai phải cùng null hoặc cùng giá trị)
        return userVariantIdString === guestVariantIdString;
      });

      if (!itemAlreadyExists) {
        // Thêm item từ guestWishlist vào userWishlist.
        userWishlist.items.push({
          product: guestItem.product, // Đây là ObjectId
          variant: guestItem.variant, // Đây là ObjectId hoặc null
        });
        itemsActuallyAddedCount++;
        console.log(
          `[Wishlist Merge] Đang thêm item: ProductID=${guestProductIdString}, VariantID=${guestVariantIdString} vào wishlist của user.`
        );
      } else {
        console.log(
          `[Wishlist Merge] Item đã tồn tại: ProductID=${guestProductIdString}, VariantID=${guestVariantIdString}. Bỏ qua.`
        );
      }
    });

    // Chỉ lưu nếu có sự thay đổi thực sự
    if (itemsActuallyAddedCount > 0) {
      await userWishlist.save();
      console.log(
        `[Wishlist Merge] Đã gộp ${itemsActuallyAddedCount} item(s) và lưu wishlist cho User.`
      );
    } else {
      console.log(
        "[Wishlist Merge] Không có item mới nào được thêm vào user wishlist."
      );
    }

    // Xóa wishlist của guest sau khi đã gộp thành công
    await Wishlist.deleteOne({ guestId: guestId });
    console.log("[Wishlist Merge] Đã xóa wishlist của Guest.");

    clearGuestWishlistCookie(res);
  } catch (error) {
    console.error("[Wishlist Merge] Lỗi trong quá trình gộp wishlist:", error);
    // Cân nhắc việc không xóa cookie nếu có lỗi nghiêm trọng để có thể thử lại hoặc debug.
    // clearGuestWishlistCookie(res); // Tạm thời không xóa cookie nếu lỗi
  }
};

const clearGuestWishlistCookie = (res) => {
  console.log("[Wishlist Merge] Đang xóa cookie wishlistGuestId.");
  res.cookie("wishlistGuestId", "", {
    httpOnly: process.env.NODE_ENV === "production", // Nên là true cho production nếu cookie chỉ dùng server-side
    expires: new Date(0),
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax", // Hoặc "Strict" nếu phù hợp
    path: "/",
  });
};

module.exports = { mergeGuestWishlistToUser, clearGuestWishlistCookie };
