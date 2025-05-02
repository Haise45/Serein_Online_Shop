const Cart = require("../models/Cart");
const Product = require("../models/Product");
const asyncHandler = require("../middlewares/asyncHandler");
const mongoose = require("mongoose");

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
    return { items: [], subtotal: 0, totalQuantity: 0 }; // Trả về cấu trúc giỏ hàng rỗng
  }

  // Populate thông tin sản phẩm cha cho tất cả các item
  await cart.populate({
    path: "items.productId",
    select:
      "name slug price images variants sku stockQuantity isActive isPublished", // Chọn các trường cần thiết
    match: { isActive: true, isPublished: true }, // Chỉ populate sản phẩm active/published?
    populate: { path: "category", select: "name slug" }, // Populate thêm category
  });

  let subtotal = 0;
  let totalQuantity = 0;
  const populatedItems = [];

  for (const item of cart.items) {
    const product = item.productId;

    // Nếu sản phẩm không tồn tại hoặc không active/publish thì bỏ qua item này
    if (!product || !product.isActive || !product.isPublished) {
      console.warn(
        `[Cart] Bỏ qua item với sản phẩm không hợp lệ hoặc không hoạt động: ${item.productId?._id}`
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
            name: opt.attributeName,
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
        ? { name: product.category.name, slug: product.category.slug }
        : null,
      variantInfo: variantInfo, // Thông tin các lựa chọn của biến thể
    });

    subtotal += itemPrice * item.quantity;
    totalQuantity += item.quantity;
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

  return {
    _id: cart._id,
    items: populatedItems,
    subtotal: subtotal,
    totalQuantity: totalQuantity,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
    userId: cart.userId,
    guestId: cart.guestId,
  };
};

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

  let newQuantity = quantity; // Số lượng mới sẽ được set/thêm vào
  if (existingItemIndex > -1) {
    // Nếu item đã tồn tại, cộng dồn số lượng
    newQuantity = cart.items[existingItemIndex].quantity + quantity;
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
    cart.items[existingItemIndex].quantity = newQuantity;
    console.log(
      `[Cart] Updated quantity for item ${cart.items[existingItemIndex]._id} to ${newQuantity}`
    );
  } else {
    // Thêm item mới vào giỏ hàng
    cart.items.push({
      productId,
      variantId: variant ? variant._id : null,
      quantity,
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
  addItemToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
