const Cart = require("../models/Cart");
const Coupon = require("../models/Coupon");
const Product = require("../models/Product");
const asyncHandler = require("../middlewares/asyncHandler");
const mongoose = require("mongoose");
const {
  getCategoryAncestors,
  fetchAndMapCategories,
} = require("../utils/categoryUtils");

// Hàm helper tìm hoặc tạo giỏ hàng
const findOrCreateCart = async (identifier) => {
  let cart = await Cart.findOne(identifier);
  if (!cart) {
    console.log("[Cart] Creating new cart for:", identifier);
    cart = await Cart.create(identifier); // Tạo cart mới với userId hoặc guestId
  }
  return cart;
};

// Hàm helper populate và tính toán giỏ hàng
const populateAndCalculateCart = async (cart) => {
  if (!cart || !cart.items || cart.items.length === 0) {
    // Nếu không có cart hoặc cart rỗng, kiểm tra xem có coupon nào được áp dụng không (trường hợp cart bị xóa item cuối)
    const appliedCouponInfo = cart?.appliedCoupon
      ? {
          code: cart.appliedCoupon.code,
          discountAmount: 0, // Giảm giá là 0 nếu cart rỗng
        }
      : null;
    return {
      _id: cart?._id,
      items: [],
      subtotal: 0,
      totalQuantity: 0,
      appliedCoupon: appliedCouponInfo,
      finalTotal: 0,
      userId: cart?.userId,
      guestId: cart?.guestId,
    }; // Trả về cấu trúc giỏ hàng rỗng
  }

  // Populate thông tin sản phẩm cha cho tất cả các item
  await cart.populate({
    path: "items.productId",
    select:
      "name slug price images variants sku stockQuantity isActive isPublished category", // Chọn các trường cần thiết
    match: { isActive: true, isPublished: true }, // Chỉ populate sản phẩm active/published?
    populate: { path: "category", select: "name slug _id isActive" }, // Populate thêm category
  });

  // --- Fetch tất cả category active một lần để tra cứu ---
  const activeCategoryMap = await fetchAndMapCategories({ isActive: true });

  let subtotal = 0;
  let totalQuantity = 0;
  const populatedItems = [];
  const productIdsInCart = new Set();
  const categoryIdsInCart = new Set();

  // --- Lọc bỏ item có sản phẩm không populate được (do bị inactive/unpublished) ---
  const validCartItems = cart.items.filter((item) => item.productId);

  for (const item of validCartItems) {
    const product = item.productId;

    // Nếu sản phẩm/danh mục không tồn tại hoặc không active/publish thì bỏ qua item này
    if (!product || !product.isActive || !product.isPublished) {
      console.warn(
        `[Cart] Bỏ qua item với sản phẩm không hợp lệ hoặc không hoạt động: ${item.productId?._id}`
      );
      continue;
    }

    if (!product.category || !product.category.isActive) {
      console.warn(
        `[Cart Populate] Bỏ qua item vì category không hợp lệ hoặc không active: Product ${product._id}, Category ${product.category?._id}`
      );
      continue;
    }

    let itemPrice = product.price; // Giá mặc định là giá sản phẩm gốc
    let itemSku = product.sku;
    let itemImage = product.images?.length > 0 ? product.images[0] : null;
    let availableStock = product.stockQuantity;
    let variantInfo = null; // Thông tin biến thể cụ thể

    // Nếu item này là một biến thể
    if (item.variantId) {
      const variant = product.variants.id(item.variantId); // Tìm subdocument variant bằng ID
      if (variant) {
        itemPrice = variant.price;
        itemSku = variant.sku;
        itemImage = variant.image || itemImage; // Ưu tiên ảnh variant, nếu không có dùng ảnh chính
        availableStock = variant.stockQuantity;
        variantInfo = {
          // Lấy thông tin các option của variant này
          _id: variant._id,
          options: variant.optionValues.map((opt) => ({
            attributeName: opt.attributeName,
            value: opt.value,
          })),
        };
      } else {
        // Nếu không tìm thấy variant ID trong sản phẩm -> dữ liệu cart bị lỗi thời?
        console.warn(
          `[Cart] Không tìm thấy Variant ID ${item.variantId} trong Product ${product._id}. Bỏ qua item.`
        );
        continue; // Bỏ qua item này
      }
    } else {
      // Nếu là sản phẩm đơn giản, kiểm tra stock của sản phẩm gốc
      if (product.variants && product.variants.length > 0) {
        console.warn(
          `[Cart] Sản phẩm ${product._id} có biến thể nhưng item trong giỏ hàng không có variantId. Bỏ qua item.`
        );
        continue;
      }
      availableStock = product.stockQuantity;
    }

    // Thêm ID category vào Set sau khi đã kiểm tra hợp lệ
    categoryIdsInCart.add(product.category._id.toString());

    // Tạo đối tượng item trả về cho frontend
    populatedItems.push({
      _id: item._id, // ID của cart item
      productId: product._id,
      variantId: item.variantId,
      name: product.name,
      slug: product.slug,
      sku: itemSku,
      price: itemPrice,
      quantity: item.quantity,
      lineTotal: itemPrice * item.quantity,
      image: itemImage,
      availableStock: availableStock, // Số lượng tồn kho hiện tại
      category: product.category
        ? {
            _id: product.category._id,
            name: product.category.name,
            slug: product.category.slug,
          }
        : null,
      variantInfo: variantInfo, // Thông tin các lựa chọn của biến thể
    });

    subtotal += itemPrice * item.quantity;
    totalQuantity += item.quantity;
    productIdsInCart.add(product._id.toString()); // Thêm ID sản phẩm vào Set
    if (product.category._id) {
      categoryIdsInCart.add(product.category._id.toString()); // Thêm ID category vào Set
    }
  }

  // Cập nhật lại items trong cart nếu có item bị loại bỏ (do sản phẩm/variant không hợp lệ)
  if (populatedItems.length !== cart.items.length) {
    console.log(
      "[Cart] Có sự thay đổi item sau khi populate, cập nhật lại cart..."
    );
    cart.items = cart.items.filter((originalItem) =>
      populatedItems.some((popItem) => popItem._id.equals(originalItem._id))
    );
  }

  // --- Tính toán giảm giá nếu có coupon ---
  let discountAmount = 0;
  let appliedCouponInfo = null;
  let finalTotal = subtotal;

  if (cart.appliedCoupon && cart.appliedCoupon.code) {
    const coupon = await Coupon.findOne({
      code: cart.appliedCoupon.code,
    }).lean(); // Tìm lại coupon để re-validate nhẹ
    let isValid = true; // Kiểm tra coupon còn hợp lệ không
    let validationError = null;

    // Re-validate các điều kiện cơ bản (active, expiry, minOrder)
    if (!coupon) {
      isValid = false;
      validationError = "Mã giảm giá không tồn tại.";
    } else if (!coupon.isActive) {
      isActive = false;
      validationError = "Mã giảm giá đã bị vô hiệu hóa.";
    } else if (coupon.expiryDate && coupon.expiryDate < new Date()) {
      isValid = false;
      validationError = "Mã giảm giá đã hết hạn.";
    } else if (coupon.startDate && coupon.startDate > new Date()) {
      isValid = false;
      validationError = "Mã giảm giá chưa đến ngày được áp dụng.";
    } else if (subtotal < coupon.minOrderValue) {
      isValid = false;
      validationError = `Đơn hàng tối thiểu ${coupon.minOrderValue.toLocaleString(
        "vi-VN"
      )}đ để áp dụng mã này.`;
    }

    // Re-validate điều kiện áp dụng (applicableTo)
    if (isValid && coupon.applicableTo !== "all") {
      const applicableIdsStr = coupon.applicableIds.map((id) => id.toString());
      let applicableSubtotal = 0;
      let foundApplicableItem = false;

      for (const item of populatedItems) {
        let isItemApplicable = false;
        const itemProductIdStr = item.productId.toString();
        const itemCategoryIdStr = item.category?._id?.toString(); // Lấy ID category của item

        if (
          coupon.applicableTo === "products" &&
          applicableIdsStr.includes(itemProductIdStr)
        ) {
          isItemApplicable = true;
        } else if (coupon.applicableTo === "categories" && itemCategoryIdStr) {
          // 1. Kiểm tra khớp trực tiếp
          if (applicableIdsStr.includes(itemCategoryIdStr)) {
            isItemApplicable = true;
          } else {
            // 2. Kiểm tra tổ tiên
            const ancestorIds = await getCategoryAncestors(
              itemCategoryIdStr,
              activeCategoryMap
            );
            if (
              ancestorIds.some((ancestorId) =>
                applicableIdsStr.includes(ancestorId)
              )
            ) {
              isItemApplicable = true;
            }
          }
        }

        if (isItemApplicable) {
          foundApplicableItem = true;
          applicableSubtotal += item.lineTotal; // Cộng dồn giá trị item hợp lệ
        }
      }

      if (!foundApplicableItem) {
        isValid = false;
        validationError =
          "Không có sản phẩm nào trong giỏ hàng phù hợp với mã giảm giá này.";
      } else {
        // Nếu hợp lệ, tính giảm giá trên applicableSubtotal thay vì subtotal
        if (coupon.discountType === "percentage") {
          discountAmount = Math.round(
            (applicableSubtotal * coupon.discountValue) / 100
          );
        } else {
          // fixed_amount
          discountAmount = coupon.discountValue;
        }
        // Đảm bảo giảm giá không vượt quá tổng tiền sản phẩm hợp lệ
        discountAmount = Math.min(discountAmount, applicableSubtotal);
      }
    } else if (isValid) {
      // Áp dụng cho tất cả ('all')
      // Tính giảm giá trên subtotal
      if (coupon.discountType === "percentage") {
        discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
      } else {
        // fixed_amount
        discountAmount = coupon.discountValue;
      }
      // Đảm bảo giảm giá không vượt quá tổng tiền
      discountAmount = Math.min(discountAmount, subtotal);
    }
    // Nếu coupon không còn hợp lệ sau khi re-validate -> Xóa khỏi giỏ hàng
    if (!isValid) {
      console.warn(
        `[Cart] Mã giảm giá "${cart.appliedCoupon.code}" không còn hợp lệ: ${validationError}. Đang xóa khỏi giỏ hàng ${cart._id}`
      );
      cart.appliedCoupon = null;
      await cart.save(); // Lưu lại việc xóa coupon
      discountAmount = 0; // Reset giảm giá
      appliedCouponInfo = { error: validationError }; // Trả về lỗi cho frontend biết
    } else {
      // Nếu vẫn hợp lệ, cập nhật lại discountAmount trong cart (phòng trường hợp giỏ hàng thay đổi)
      if (cart.appliedCoupon.discountAmount !== discountAmount) {
        cart.appliedCoupon.discountAmount = discountAmount;
        // Chỉ lưu lại nếu discountAmount thay đổi
        await cart.save();
      }
      appliedCouponInfo = {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discountAmount, // Số tiền giảm giá thực tế
      };
      finalTotal = subtotal - discountAmount; // Tính lại tổng cuối
    }
  }

  // Cập nhật lại items trong cart nếu có item bị loại bỏ (do sản phẩm/variant không hợp lệ)
  if (populatedItems.length !== validCartItems.length) {
    console.log(
      "[Cart] Có sự thay đổi item sau khi populate, cập nhật lại cart..."
    );
    // Lấy danh sách _id của các item hợp lệ
    const validItemIds = populatedItems.map((pItem) => pItem._id);
    await Cart.findByIdAndUpdate(cart._id, {
      $pull: { items: { _id: { $nin: validItemIds } } }, // Xóa các item không có trong validItemIds
    });
  }

  return {
    _id: cart._id,
    items: populatedItems,
    subtotal: subtotal,
    totalQuantity: totalQuantity,
    appliedCoupon: appliedCouponInfo,
    discountAmount: discountAmount,
    finalTotal: finalTotal,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
    userId: cart.userId,
    guestId: cart.guestId,
  };
};

// @desc    Áp dụng mã giảm giá vào giỏ hàng
// @route   POST /api/v1/cart/apply-coupon
// @access  Public
const applyCoupon = asyncHandler(async (req, res) => {
  const { couponCode } = req.body;
  const identifier = req.cartIdentifier;

  if (!couponCode) {
    res.status(400);
    throw new Error("Vui lòng nhập mã giảm giá.");
  }
  const code = couponCode.toUpperCase().trim();

  // --- 1. Tìm giỏ hàng và tính subtotal ---
  let cart = await Cart.findOne(identifier);
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error("Giỏ hàng của bạn đang trống.");
  }

  // --- Fetch category map ---
  const activeCategoryMap = await fetchAndMapCategories({ isActive: true });

  // Populate items để kiểm tra
  await cart.populate({
    path: "items.productId",
    select: "price variants category stockQuantity isActive isPublished", // Lấy category ID
    match: { isActive: true, isPublished: true },
    populate: { path: "category", select: "_id parent" }, // Populate category của sản phẩm
  });

  const validCartItems = cart.items.filter((item) => item.productId); // Lọc item hợp lệ
  if (validCartItems.length === 0) {
    res.status(400);
    throw new Error("Giỏ hàng không có sản phẩm hợp lệ nào.");
  }

  let subtotal = 0; // Tính subtotal nhanh
  for (const item of validCartItems) {
    let itemPrice = item.productId.price;
    if (item.variantId) {
      const variant = item.productId.variants.id(item.variantId);
      if (variant) itemPrice = variant.price;
      else continue; // Bỏ qua nếu variant ko tìm thấy
    } else if (item.productId.variants?.length > 0) continue; // Bỏ qua nếu item ko có variantId mà sp lại có
    subtotal += itemPrice * item.quantity;
  }

  // --- 2. Tìm và Validate Coupon ---
  const coupon = await Coupon.findOne({ code: code }).lean();

  // Các bước Validate:
  if (!coupon) {
    res.status(400);
    throw new Error(`Mã giảm giá "${code}" không tồn tại.`);
  }
  if (!coupon.isActive) {
    res.status(400);
    throw new Error("Mã giảm giá này đã bị vô hiệu hóa.");
  }
  if (coupon.expiryDate && coupon.expiryDate < new Date()) {
    res.status(400);
    throw new Error("Mã giảm giá đã hết hạn.");
  }
  if (coupon.startDate && coupon.startDate > new Date()) {
    res.status(400);
    throw new Error("Mã giảm giá chưa đến ngày áp dụng.");
  }
  if (coupon.usageCount >= coupon.maxUsage && coupon.maxUsage !== null) {
    res.status(400);
    throw new Error("Mã giảm giá đã hết lượt sử dụng.");
  }
  if (subtotal < coupon.minOrderValue) {
    res.status(400);
    throw new Error(
      `Đơn hàng tối thiểu ${coupon.minOrderValue.toLocaleString(
        "vi-VN"
      )}đ để áp dụng mã này.`
    );
  }

  // --- 3. Tính toán Discount Amount dựa trên điều kiện áp dụng ---
  let discountAmount = 0;
  let isValidForItems = true; // Kiểm tra điều kiện áp dụng item
  let applicableSubtotal = subtotal; // Mặc định tính trên tổng

  if (coupon.applicableTo !== "all") {
    const applicableIdsStr = coupon.applicableIds.map((id) => id.toString());
    applicableSubtotal = 0; // Reset để tính lại
    let foundApplicableItem = false;

    for (const item of validCartItems) {
      let isItemApplicable = false;
      const itemProductIdStr = item.productId._id.toString();
      const itemCategoryIdStr = item.productId.category?._id?.toString();

      if (
        coupon.applicableTo === "products" &&
        applicableIdsStr.includes(itemProductIdStr)
      ) {
        isItemApplicable = true;
      } else if (coupon.applicableTo === "categories" && itemCategoryIdStr) {
        if (applicableIdsStr.includes(itemCategoryIdStr)) {
          isItemApplicable = true;
        } else {
          const ancestorIds = await getCategoryAncestors(
            itemCategoryIdStr,
            activeCategoryMap
          );
          if (
            ancestorIds.some((ancestorId) =>
              applicableIdsStr.includes(ancestorId)
            )
          ) {
            isItemApplicable = true;
          }
        }
      }

      if (isItemApplicable) {
        foundApplicableItem = true;
        // Tính giá trị của item này để cộng vào applicableSubtotal
        let itemPrice = item.productId.price;
        if (item.variantId) {
          const variant = item.productId.variants.id(item.variantId);
          if (variant) itemPrice = variant.price;
          else itemPrice = 0; // Lấy giá variant
        }
        applicableSubtotal += itemPrice * item.quantity;
      }
    }
    if (!foundApplicableItem) isValidForItems = false;
  }

  if (!isValidForItems) {
    res.status(400);
    throw new Error(
      "Không có sản phẩm nào trong giỏ hàng phù hợp với mã giảm giá này."
    );
  }

  // Tính số tiền giảm cuối cùng
  if (coupon.discountType === "percentage") {
    discountAmount = Math.round(
      (applicableSubtotal * coupon.discountValue) / 100
    );
  } else {
    // fixed_amount
    discountAmount = coupon.discountValue;
  }
  discountAmount = Math.min(discountAmount, applicableSubtotal); // Không giảm quá tổng tiền sp hợp lệ

  // --- 4. Lưu thông tin Coupon vào Cart ---
  // Phải tìm lại cart không dùng lean để save
  cart = await Cart.findOne(identifier);
  if (!cart) {
    res.status(404);
    throw new Error("Lỗi tìm lại giỏ hàng.");
  }

  cart.appliedCoupon = {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount: discountAmount,
  };
  await cart.save();

  // --- 5. Trả về giỏ hàng đã cập nhật ---
  const updatedPopulatedCart = await populateAndCalculateCart(cart);
  res.status(200).json(updatedPopulatedCart);
});

// @desc    Xóa mã giảm giá khỏi giỏ hàng
// @route   DELETE /api/v1/cart/remove-coupon
// @access  Public
const removeCoupon = asyncHandler(async (req, res) => {
  const identifier = req.cartIdentifier;

  const cart = await Cart.findOne(identifier);
  if (cart && cart.appliedCoupon) {
    cart.appliedCoupon = null; // Xóa thông tin coupon
    await cart.save();
    console.log(`[Cart] Removed coupon for:`, identifier);
  }

  // Trả về giỏ hàng mới nhất (dù có thay đổi hay không)
  const populatedCart = await populateAndCalculateCart(cart);
  res.status(200).json(populatedCart);
});

// @desc    Thêm sản phẩm vào giỏ hàng
// @route   POST /api/v1/cart/items
// @access  Public (User hoặc Guest)
const addItemToCart = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity } = req.body; // Dữ liệu đã validate
  const identifier = req.cartIdentifier; // Lấy từ middleware { userId: ... } hoặc { guestId: ... }

  // --- 1. Tìm hoặc tạo giỏ hàng ---
  const cart = await findOrCreateCart(identifier);

  // --- 2. Kiểm tra sản phẩm và tồn kho ---
  const product = await Product.findById(productId).select(
    "variants stockQuantity isActive isPublished name"
  );
  if (!product || !product.isActive || !product.isPublished) {
    res.status(404);
    throw new Error("Sản phẩm không tồn tại hoặc không có sẵn.");
  }

  let variant = null;
  let availableStock = product.stockQuantity;
  let productHasVariants = product.variants && product.variants.length > 0;

  if (variantId) {
    // Nếu thêm một biến thể cụ thể
    if (!productHasVariants) {
      res.status(400);
      throw new Error("Sản phẩm này không có biến thể.");
    }
    variant = product.variants.id(variantId);
    if (!variant) {
      res.status(404);
      throw new Error("Biến thể sản phẩm không tồn tại.");
    }
    availableStock = variant.stockQuantity; // Lấy tồn kho của biến thể
  } else if (productHasVariants) {
    // Nếu sản phẩm có biến thể nhưng client không gửi variantId
    res.status(400);
    throw new Error("Vui lòng chọn một phiên bản (biến thể) của sản phẩm.");
  }
  // Nếu không có variantId và sản phẩm không có biến thể -> dùng stockQuantity của sản phẩm

  // --- 3. Tìm item hiện có trong giỏ hàng ---
  const existingItemIndex = cart.items.findIndex(
    (item) =>
      item.productId.equals(productId) && // So sánh ObjectId
      // So sánh variantId (phải cùng là null hoặc cùng bằng giá trị)
      (item.variantId ? item.variantId.equals(variantId) : variantId === null)
  );

  let newQuantity = Number(quantity);
  if (existingItemIndex > -1) {
    const existingQty = Number(cart.items[existingItemIndex].quantity);
    newQuantity = existingQty + Number(quantity);
  }

  // --- 4. Kiểm tra tồn kho trước khi thêm/cập nhật ---
  if (availableStock < newQuantity) {
    res.status(400);
    throw new Error(
      `Số lượng tồn kho không đủ (Chỉ còn ${availableStock} sản phẩm).`
    );
  }

  // --- 5. Cập nhật hoặc thêm mới item ---
  if (existingItemIndex > -1) {
    // Cập nhật số lượng item đã có
    cart.items[existingItemIndex].quantity = Number(newQuantity);
    console.log(
      `[Cart] Updated quantity for item ${cart.items[existingItemIndex]._id} to ${newQuantity}`
    );
  } else {
    // Thêm item mới vào giỏ hàng
    cart.items.push({
      productId,
      variantId: variant ? variant._id : null,
      quantity: Number(quantity),
    });
    console.log(
      `[Cart] Added new item: Product ${productId}, Variant ${
        variant ? variant._id : "N/A"
      }, Qty ${quantity}`
    );
  }

  // --- 6. Lưu giỏ hàng và trả về ---
  await cart.save();
  const populatedCart = await populateAndCalculateCart(cart);
  res.status(200).json(populatedCart); // Trả về giỏ hàng đã cập nhật và populate
});

// @desc    Lấy giỏ hàng hiện tại
// @route   GET /api/v1/cart
// @access  Public (User hoặc Guest)
const getCart = asyncHandler(async (req, res) => {
  const identifier = req.cartIdentifier;
  const cart = await Cart.findOne(identifier);

  const populatedCart = await populateAndCalculateCart(cart); // Luôn gọi để trả về cấu trúc chuẩn
  res.status(200).json(populatedCart);
});

// @desc    Cập nhật số lượng của một item trong giỏ
// @route   PUT /api/v1/cart/items/:itemId
// @access  Public (User hoặc Guest)
const updateCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params; // ID của cart item (subdocument)
  const { quantity } = req.body; // Số lượng mới (đã validate)
  const identifier = req.cartIdentifier;

  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    res.status(400);
    throw new Error("ID item trong giỏ hàng không hợp lệ.");
  }

  // --- 1. Tìm giỏ hàng ---
  const cart = await Cart.findOne(identifier);
  if (!cart) {
    res.status(404);
    throw new Error("Không tìm thấy giỏ hàng.");
  }

  // --- 2. Tìm item con cần cập nhật ---
  const itemToUpdate = cart.items.id(itemId);
  if (!itemToUpdate) {
    res.status(404);
    throw new Error("Không tìm thấy sản phẩm này trong giỏ hàng.");
  }

  // --- 3. Kiểm tra tồn kho với số lượng MỚI ---
  const product = await Product.findById(itemToUpdate.productId).select(
    "variants stockQuantity isActive isPublished"
  );
  if (!product || !product.isActive || !product.isPublished) {
    // Nếu sản phẩm gốc không hợp lệ, xóa item khỏi giỏ
    cart.items.pull({ _id: itemId });
    await cart.save();
    const populatedCart = await populateAndCalculateCart(cart);
    res
      .status(404)
      .json({ message: "Sản phẩm không còn tồn tại.", cart: populatedCart });
    return;
  }

  let availableStock = product.stockQuantity;
  if (itemToUpdate.variantId) {
    const variant = product.variants.id(itemToUpdate.variantId);
    if (!variant) {
      cart.items.pull({ _id: itemId });
      await cart.save();
      const populatedCart = await populateAndCalculateCart(cart);
      res.status(404).json({
        message: "Biến thể sản phẩm không còn tồn tại.",
        cart: populatedCart,
      });
      return;
    }
    availableStock = variant.stockQuantity;
  } else if (product.variants && product.variants.length > 0) {
    // Lỗi dữ liệu: sản phẩm có variant nhưng item lại không có variantId
    cart.items.pull({ _id: itemId });
    await cart.save();
    const populatedCart = await populateAndCalculateCart(cart);
    res.status(400).json({
      message: "Lỗi dữ liệu giỏ hàng, vui lòng thêm lại sản phẩm.",
      cart: populatedCart,
    });
    return;
  }

  if (availableStock < quantity) {
    res.status(400);
    throw new Error(
      `Số lượng tồn kho không đủ (Chỉ còn ${availableStock} sản phẩm). Không thể cập nhật thành ${quantity}.`
    );
  }

  // --- 4. Cập nhật số lượng và lưu ---
  itemToUpdate.quantity = quantity;
  await cart.save();
  const populatedCart = await populateAndCalculateCart(cart);
  res.status(200).json(populatedCart); // Trả về giỏ hàng đã cập nhật
});

// @desc    Xóa một item khỏi giỏ hàng
// @route   DELETE /api/v1/cart/items/:itemId
// @access  Public (User hoặc Guest)
const removeCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const identifier = req.cartIdentifier;

  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    res.status(400);
    throw new Error("ID item trong giỏ hàng không hợp lệ.");
  }

  // --- 1. Tìm giỏ hàng ---
  const cart = await Cart.findOne(identifier);
  if (!cart) {
    // Nếu không có giỏ hàng thì cũng coi như thành công (item không tồn tại)
    return res.status(200).json(await populateAndCalculateCart(null));
  }

  // --- 2. Xóa item con bằng hàm pull ---
  // pull sẽ tìm và xóa phần tử khớp điều kiện trong mảng items
  cart.items.pull({ _id: itemId });
  console.log(`[Cart] Removed item ${itemId}`);

  // --- 3. Lưu giỏ hàng và trả về ---
  await cart.save();
  const populatedCart = await populateAndCalculateCart(cart);
  res.status(200).json(populatedCart);
});

// @desc    Xóa toàn bộ giỏ hàng (Clear Cart)
// @route   DELETE /api/v1/cart
// @access  Public (User hoặc Guest)
const clearCart = asyncHandler(async (req, res) => {
  const identifier = req.cartIdentifier;

  const cart = await Cart.findOne(identifier);
  if (cart) {
    cart.items = []; // Xóa sạch mảng items
    await cart.save();
    console.log(`[Cart] Cleared cart for:`, identifier);
  }

  // Luôn trả về giỏ hàng rỗng
  res.status(200).json(await populateAndCalculateCart(null));
});

module.exports = {
  applyCoupon,
  removeCoupon,
  addItemToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  populateAndCalculateCart,
};
