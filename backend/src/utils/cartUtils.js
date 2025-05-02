const Cart = require("../models/Cart");
const Product = require("../models/Product");

const mergeGuestCartToUserCart = async (guestId, userId, res) => {
  console.log(
    `[Cart Merge] Bắt đầu gộp giỏ hàng: GuestID=${guestId}, UserID=${userId}`
  );
  try {
    // Tìm cả hai giỏ hàng song song
    const [guestCart, userCart] = await Promise.all([
      Cart.findOne({ guestId: guestId }),
      Cart.findOne({ userId: userId }),
    ]);

    // --- Xử lý các trường hợp ---

    // 1. Không có giỏ Guest -> Không cần làm gì
    if (!guestCart) {
      console.log("[Cart Merge] Không tìm thấy giỏ hàng Guest. Không cần gộp.");
      clearGuestCartCookie(res);
      return;
    }

    // 2. Chỉ có giỏ Guest, không có giỏ User -> Đổi chủ sở hữu giỏ Guest
    if (!userCart) {
      console.log(
        "[Cart Merge] Chỉ có giỏ Guest. Đang đổi chủ sở hữu sang User."
      );
      guestCart.userId = userId;
      guestCart.guestId = null; // Xóa guestId
      await guestCart.save();
      console.log("[Cart Merge] Đã đổi chủ sở hữu giỏ hàng thành công.");
      clearGuestCartCookie(res); // Xóa cookie guest
      return;
    }

    // 3. Cả hai giỏ đều tồn tại -> Gộp items và xóa giỏ Guest
    console.log(
      "[Cart Merge] Tìm thấy cả giỏ Guest và User. Đang gộp items..."
    );
    for (const guestItem of guestCart.items) {
      const existingUserItemIndex = userCart.items.findIndex(
        (userItem) =>
          userItem.productId.equals(guestItem.productId) &&
          (userItem.variantId
            ? userItem.variantId.equals(guestItem.variantId)
            : guestItem.variantId === null)
      );

      let availableStock = Infinity; // Mặc định không giới hạn, sẽ kiểm tra sau

      // Tìm thông tin sản phẩm/biến thể để kiểm tra tồn kho
      try {
        const product = await Product.findById(guestItem.productId)
          .select("stockQuantity variants")
          .lean();
        if (product) {
          if (guestItem.variantId) {
            const variant = product.variants.find((v) =>
              v._id.equals(guestItem.variantId)
            );
            if (variant) availableStock = variant.stockQuantity;
            else availableStock = 0; // Variant không tồn tại -> stock = 0
          } else {
            availableStock = product.stockQuantity;
          }
        } else {
          availableStock = 0; // Sản phẩm không tồn tại -> stock = 0
        }
      } catch (stockError) {
        console.error(
          `[Cart Merge] Lỗi khi kiểm tra tồn kho cho Product ${guestItem.productId}:`,
          stockError
        );
        availableStock = 0; // Coi như hết hàng nếu lỗi
      }

      if (existingUserItemIndex > -1) {
        // Item đã có trong giỏ User -> Cộng dồn số lượng, kiểm tra tồn kho
        const userItem = userCart.items[existingUserItemIndex];
        const combinedQuantity = userItem.quantity + guestItem.quantity;

        if (combinedQuantity <= availableStock) {
          userItem.quantity = combinedQuantity;
          console.log(
            `[Cart Merge] Cộng dồn số lượng cho item ${userItem._id} thành ${combinedQuantity}`
          );
        } else {
          // Nếu vượt quá tồn kho, đặt bằng tồn kho tối đa
          userItem.quantity = availableStock;
          console.warn(
            `[Cart Merge] Số lượng gộp (${combinedQuantity}) vượt tồn kho (${availableStock}) cho item ${userItem._id}. Đặt số lượng thành ${availableStock}.`
          );
        }
      } else {
        // Item chưa có trong giỏ User -> Thêm mới, kiểm tra tồn kho
        if (guestItem.quantity <= availableStock) {
          // Thêm item từ giỏ guest vào giỏ user
          userCart.items.push({
            productId: guestItem.productId,
            variantId: guestItem.variantId,
            quantity: guestItem.quantity,
            createdAt: guestItem.createdAt,
          });
          console.log(
            `[Cart Merge] Thêm mới item từ Guest vào User: Product ${guestItem.productId} Qty ${guestItem.quantity}`
          );
        } else {
          console.warn(
            `[Cart Merge] Không đủ tồn kho (${availableStock}) để thêm item mới từ Guest: Product ${guestItem.productId} Qty ${guestItem.quantity}. Bỏ qua item này.`
          );
        }
      }
    }

    // Lưu lại giỏ hàng User đã được gộp
    await userCart.save();
    console.log("[Cart Merge] Đã lưu giỏ hàng User sau khi gộp.");

    // Xóa giỏ hàng Guest sau khi đã gộp thành công
    await Cart.deleteOne({ _id: guestCart._id });
    console.log("[Cart Merge] Đã xóa giỏ hàng Guest.");

    // Xóa cookie guest
    clearGuestCartCookie(res);
  } catch (error) {
    console.error("[Cart Merge] Lỗi trong quá trình gộp giỏ hàng:", error);
    clearGuestCartCookie(res);
  }
};

// Hàm helper xóa cookie guest
const clearGuestCartCookie = (res) => {
  // Gửi lại cookie với tên giống hệt, giá trị rỗng và ngày hết hạn trong quá khứ.
  console.log("[Cart Merge] Đang xóa cookie cartGuestId.");
  res.cookie("cartGuestId", "", {
    httpOnly: false,
    expires: new Date(0), // Đặt thời gian hết hạn về quá khứ
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
  });
};

module.exports = { mergeGuestCartToUserCart, clearGuestCartCookie  };
