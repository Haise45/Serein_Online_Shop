const Cart = require("../models/Cart");
const Coupon = require("../models/Coupon");
const Product = require("../models/Product");
const asyncHandler = require("../middlewares/asyncHandler");
const mongoose = require("mongoose");
const {
  getCategoryAncestors,
  fetchAndMapCategories,
} = require("../utils/categoryUtils");

// --- Helper: "Làm phẳng" i18n ---
const flattenI18nObject = (obj, locale, fields) => {
  if (!obj) return obj;
  const newObj = { ...obj };
  for (const field of fields) {
    if (newObj[field] && typeof newObj[field] === "object") {
      newObj[field] = newObj[field][locale] || newObj[field].vi;
    }
  }
  return newObj;
};

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
const populateAndCalculateCart = async (cartObject, locale) => {
  // --- Bước 0: Xử lý trường hợp giỏ hàng rỗng hoặc không tồn tại ---
  if (!cartObject || !cartObject.items || cartObject.items.length === 0) {
    const appliedCouponInfo = cartObject?.appliedCoupon
      ? {
          code: cartObject.appliedCoupon.code,
          discountAmount: 0,
          error: "Giỏ hàng trống.",
        }
      : null;
    return {
      _id: cartObject?._id,
      items: [],
      subtotal: 0,
      totalQuantity: 0, // Số lượng sản phẩm
      totalDistinctItems: 0, // Số dòng sản phẩm
      appliedCoupon: appliedCouponInfo,
      discountAmount: 0,
      finalTotal: 0,
      createdAt: cartObject?.createdAt,
      updatedAt: cartObject?.updatedAt,
      userId: cartObject?.userId,
      guestId: cartObject?.guestId,
    };
  }

  // --- Bước 1: Lấy ID sản phẩm từ giỏ hàng để bắt đầu pipeline ---
  const productIds = cartObject.items.map(
    (item) => new mongoose.Types.ObjectId(item.productId)
  );

  // --- Bước 2: Sử dụng Aggregation Pipeline để lấy và "làm giàu" dữ liệu ---
  // Pipeline này hiệu quả hơn nhiều so với nhiều lệnh .populate() lồng nhau.
  const populatedProductsInfo = await Product.aggregate([
    // Giai đoạn 1: Lọc ra các sản phẩm có trong giỏ hàng và đang được bán
    { $match: { _id: { $in: productIds }, isActive: true, isPublished: true } },

    // Giai đoạn 2: "Tháo" mảng variants ra để xử lý từng biến thể
    { $unwind: { path: "$variants", preserveNullAndEmptyArrays: true } },

    // Giai đoạn 3: Join với collection 'categories' để lấy thông tin danh mục
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "categoryInfo",
      },
    },

    // Giai đoạn 4: Join với collection 'attributes' để lấy thông tin thuộc tính (tên, nhãn)
    // Dựa trên ID thuộc tính trong optionValues của mỗi biến thể
    {
      $lookup: {
        from: "attributes",
        localField: "variants.optionValues.attribute",
        foreignField: "_id",
        as: "attributeDetails",
      },
    },

    // Giai đoạn 5: Định dạng lại dữ liệu trả về cho dễ sử dụng
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        slug: 1,
        price: 1,
        salePrice: 1,
        salePriceEffectiveDate: 1,
        salePriceExpiryDate: 1,
        images: 1,
        sku: 1,
        stockQuantity: 1,
        category: {
          $let: {
            vars: { cat: { $arrayElemAt: ["$categoryInfo", 0] } },
            in: {
              _id: "$$cat._id",
              name: "$$cat.name",
              slug: "$$cat.slug",
              parent: "$$cat.parent",
            },
          },
        },
        // Tạo một object variant đã được "làm giàu" thông tin
        variant: {
          _id: "$variants._id",
          sku: "$variants.sku",
          price: "$variants.price",
          salePrice: "$variants.salePrice",
          salePriceEffectiveDate: "$variants.salePriceEffectiveDate",
          salePriceExpiryDate: "$variants.salePriceExpiryDate",
          stockQuantity: "$variants.stockQuantity",
          images: "$variants.images",
          // Map qua optionValues để thêm tên thuộc tính và tên giá trị
          optionValues: {
            $map: {
              input: "$variants.optionValues",
              as: "option", // Biến đại diện cho mỗi phần tử { attribute: ID, value: ID }
              in: {
                attributeId: "$$option.attribute",
                valueId: "$$option.value",
                // Tìm tên thuộc tính từ mảng `attributeDetails` đã join
                attributeLabel: {
                  $let: {
                    vars: {
                      attrDoc: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$attributeDetails",
                              cond: {
                                $eq: ["$$this._id", "$$option.attribute"],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: "$$attrDoc.label",
                  },
                },
                // Tìm tên giá trị từ mảng con `values` của thuộc tính tương ứng
                valueName: {
                  $let: {
                    vars: {
                      attrDoc: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$attributeDetails",
                              cond: {
                                $eq: ["$$this._id", "$$option.attribute"],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: {
                      $let: {
                        vars: {
                          valDoc: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: "$$attrDoc.values",
                                  cond: {
                                    $eq: ["$$this._id", "$$option.value"],
                                  },
                                },
                              },
                              0,
                            ],
                          },
                        },
                        in: "$$valDoc.value",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  ]);

  // --- Bước 3: Tạo Map để tra cứu nhanh ---
  // Map này sẽ chứa dữ liệu gốc, chưa làm phẳng
  const rawProductInfoMap = new Map();
  populatedProductsInfo.forEach((p) => {
    const key = p.variant
      ? `${p._id.toString()}-${p.variant._id.toString()}`
      : p._id.toString();
    rawProductInfoMap.set(key, p);
  });
  // --- Bước 4: Lặp qua các item trong giỏ hàng để tính toán và xây dựng kết quả cuối cùng ---
  let subtotal = 0;
  const finalCartItems = [];
  const itemsToRemove = [];

  for (const item of cartObject.items) {
    // Tạo key để tra cứu trong Map
    const key = item.variantId
      ? `${item.productId.toString()}-${item.variantId.toString()}`
      : item.productId.toString();
    const rawProductInfo = rawProductInfoMap.get(key);

    // Nếu không tìm thấy thông tin (sản phẩm đã bị xóa/ẩn), bỏ qua item này
    if (!rawProductInfo) {
      itemsToRemove.push(item._id); // Ghi nhận item cần xóa
      continue;
    }

    const isVariant = !!item.variantId;
    // `source` là sản phẩm gốc hoặc biến thể cụ thể
    const source = isVariant ? rawProductInfo.variant : rawProductInfo;

    // Tính toán giá hiển thị (displayPrice)
    const now = new Date();
    let displayPrice = source.price;
    const isOnSale =
      source.salePrice &&
      source.salePrice < source.price &&
      (!source.salePriceEffectiveDate ||
        source.salePriceEffectiveDate <= now) &&
      (!source.salePriceExpiryDate || source.salePriceExpiryDate >= now);

    if (isOnSale) {
      displayPrice = source.salePrice;
    }

    subtotal += displayPrice * item.quantity;

    // *** LOGIC LÀM PHẲNG CÓ ĐIỀU KIỆN ***
    let finalItem;
    if (locale) {
      // Nếu có locale, làm phẳng dữ liệu để gửi cho client
      const flatProduct = flattenI18nObject(rawProductInfo, locale, [
        "name",
        "description",
      ]);
      if (flatProduct.category) {
        flatProduct.category = flattenI18nObject(flatProduct.category, locale, [
          "name",
        ]);
      }
      if (flatProduct.variant?.optionValues) {
        flatProduct.variant.optionValues.forEach((opt) => {
          opt.attributeLabel =
            opt.attributeLabel?.[locale] || opt.attributeLabel?.vi;
          opt.valueName = opt.valueName?.[locale] || opt.valueName?.vi;
        });
      }
      finalItem = {
        _id: item._id,
        productId: flatProduct._id,
        variantId: item.variantId,
        name: flatProduct.name,
        slug: flatProduct.slug,
        sku: source.sku,
        price: displayPrice,
        originalPrice: source.price,
        isOnSale,
        quantity: item.quantity,
        lineTotal: displayPrice * item.quantity,
        image:
          source.images && source.images.length > 0
            ? source.images[0]
            : flatProduct.images[0] || null,
        availableStock: source.stockQuantity,
        category: flatProduct.category, // Category đã được populate sẵn
        variantInfo: isVariant
          ? {
              _id: source._id,
              options: source.optionValues.map((opt) => {
                const flatOpt = flattenI18nObject(opt, locale, [
                  "attributeLabel",
                  "valueName",
                ]);
                return {
                  attribute: opt.attributeId,
                  value: opt.valueId,
                  attributeName: flatOpt.attributeLabel,
                  valueName: flatOpt.valueName,
                };
              }),
            }
          : undefined,
      };
    } else {
      // Nếu KHÔNG có locale (trường hợp của createOrder), giữ nguyên dữ liệu gốc
      finalItem = {
        _id: item._id,
        productId: rawProductInfo._id,
        variantId: item.variantId,
        name: rawProductInfo.name,
        slug: rawProductInfo.slug,
        sku: source.sku,
        price: displayPrice,
        originalPrice: source.price,
        isOnSale,
        quantity: item.quantity,
        lineTotal: displayPrice * item.quantity,
        image:
          source.images && source.images.length > 0
            ? source.images[0]
            : rawProductInfo.images[0] || null,
        availableStock: source.stockQuantity,
        category: rawProductInfo.category, // Category đã được populate sẵn
        variantInfo: isVariant
          ? {
              _id: source._id,
              options: source.optionValues.map((opt) => ({
                attribute: opt.attributeId,
                value: opt.valueId,
                attributeName: opt.attributeLabel, // Đã là string
                valueName: opt.valueName, // Đã là string
              })),
            }
          : undefined,
        rawProductInfo: rawProductInfo,
      };
    }
    // Gộp các thuộc tính chung vào finalItem
    Object.assign(finalItem, {
      variantId: item.variantId,
      slug: rawProductInfo.slug,
      sku: source.sku,
      price: displayPrice,
      originalPrice: source.price,
      isOnSale,
      quantity: item.quantity,
      lineTotal: displayPrice * item.quantity,
      image: source.images?.[0] || rawProductInfo.images?.[0] || null,
      availableStock: source.stockQuantity,
      category: rawProductInfo.category, // Category gốc, sẽ được làm phẳng sau nếu cần
    });

    finalCartItems.push(finalItem);
  }

  // === Bước 5 & 6: Gọi hàm Helper và xử lý kết quả ===
  const { discountAmount, finalTotal, appliedCouponInfo } =
    await calculateDiscount(cartObject.appliedCoupon, finalCartItems, subtotal);

  // Nếu coupon không còn hợp lệ, `appliedCouponInfo` sẽ chứa lỗi. Chúng ta cần xóa nó khỏi DB.
  if (appliedCouponInfo?.error) {
    const cartToUpdate = await Cart.findById(cartObject._id);
    if (cartToUpdate) {
      cartToUpdate.appliedCoupon = null;
      await cartToUpdate.save();
    }
  } else if (
    cartObject.appliedCoupon &&
    cartObject.appliedCoupon.discountAmount !== discountAmount
  ) {
    // Cập nhật lại discountAmount trong DB nếu nó thay đổi (ví dụ: người dùng xóa bớt sản phẩm)
    const cartToUpdate = await Cart.findById(cartObject._id);
    if (cartToUpdate) {
      cartToUpdate.appliedCoupon.discountAmount = discountAmount;
      await cartToUpdate.save();
    }
  }

  // --- Bước 7: Xử lý các item không hợp lệ bị loại bỏ (nếu có) ---
  if (itemsToRemove.length > 0) {
    const cartToUpdate = await Cart.findById(cartObject._id);
    if (cartToUpdate) {
      cartToUpdate.items.pull({ _id: { $in: itemsToRemove } });
      await cartToUpdate.save();
    }
  }

  // --- Bước 8: Trả về object giỏ hàng hoàn chỉnh ---
  return {
    _id: cartObject._id,
    items: finalCartItems,
    subtotal,
    totalQuantity: finalCartItems.reduce((sum, item) => sum + item.quantity, 0),
    totalDistinctItems: finalCartItems.length,
    appliedCoupon: appliedCouponInfo,
    discountAmount,
    finalTotal,
    createdAt: cartObject.createdAt,
    updatedAt: cartObject.updatedAt,
    userId: cartObject.userId,
    guestId: cartObject.guestId,
  };
};

/**
 * Hàm Helper: Tính toán giảm giá dựa trên coupon và các item trong giỏ hàng.
 * Re-validate lại coupon để đảm bảo tính hợp lệ.
 * @param {object} appliedCoupon - Thông tin coupon đang được áp dụng trong giỏ hàng.
 * @param {Array} cartItems - Mảng các item đã được populate thông tin.
 * @param {number} subtotal - Tổng tiền của các item trong cartItems.
 * @returns {Promise<object>} - Object chứa { discountAmount, finalTotal, appliedCouponInfo }
 */
const calculateDiscount = async (appliedCoupon, cartItems, subtotal) => {
  if (!appliedCoupon || !appliedCoupon.code) {
    return { discountAmount: 0, finalTotal: subtotal, appliedCouponInfo: null };
  }

  const coupon = await Coupon.findOne({ code: appliedCoupon.code }).lean();
  let validationError = null;

  // --- Re-validate Coupon ---
  if (!coupon) {
    validationError = "Mã giảm giá không tồn tại.";
  } else if (!coupon.isActive) {
    validationError = "Mã giảm giá đã bị vô hiệu hóa.";
  } else if (coupon.expiryDate && coupon.expiryDate < new Date()) {
    validationError = "Mã giảm giá đã hết hạn.";
  } else if (coupon.startDate && coupon.startDate > new Date()) {
    validationError = "Mã giảm giá chưa đến ngày áp dụng.";
  } else if (subtotal < coupon.minOrderValue) {
    validationError = `Đơn hàng tối thiểu ${coupon.minOrderValue.toLocaleString(
      "vi-VN"
    )}đ để áp dụng mã này.`;
  }

  if (validationError) {
    console.warn(
      `[Cart] Mã giảm giá "${appliedCoupon.code}" không còn hợp lệ: ${validationError}`
    );
    return {
      discountAmount: 0,
      finalTotal: subtotal,
      appliedCouponInfo: { error: validationError },
    };
  }

  // --- Tính toán số tiền giảm giá ---
  let discountAmount = 0;
  let applicableSubtotal = subtotal; // Mặc định áp dụng cho toàn bộ giỏ hàng

  // Nếu coupon chỉ áp dụng cho một số sản phẩm/danh mục nhất định
  if (coupon.applicableTo !== "all") {
    const applicableIdsStr = coupon.applicableIds.map((id) => id.toString());
    const activeCategoryMap = await fetchAndMapCategories({ isActive: true });

    const applicableItems = await Promise.all(
      cartItems.map(async (item) => {
        const itemProductIdStr = item.productId.toString();
        const itemCategoryIdStr = item.category?._id?.toString();

        if (
          coupon.applicableTo === "products" &&
          applicableIdsStr.includes(itemProductIdStr)
        ) {
          return item;
        }

        if (coupon.applicableTo === "categories" && itemCategoryIdStr) {
          if (applicableIdsStr.includes(itemCategoryIdStr)) return item;
          const ancestorIds = await getCategoryAncestors(
            itemCategoryIdStr,
            activeCategoryMap
          );
          if (ancestorIds.some((ancId) => applicableIdsStr.includes(ancId)))
            return item;
        }

        return null;
      })
    );

    const filteredApplicableItems = applicableItems.filter(Boolean);

    if (filteredApplicableItems.length === 0) {
      validationError =
        "Không có sản phẩm nào trong giỏ hàng phù hợp với mã giảm giá này.";
      return {
        discountAmount: 0,
        finalTotal: subtotal,
        appliedCouponInfo: { error: validationError },
      };
    }

    // Tính lại subtotal chỉ trên các sản phẩm được áp dụng
    applicableSubtotal = filteredApplicableItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0
    );
  }

  // Áp dụng công thức giảm giá
  if (coupon.discountType === "percentage") {
    discountAmount = Math.round(
      (applicableSubtotal * coupon.discountValue) / 100
    );
  } else {
    discountAmount = coupon.discountValue;
  }

  // Đảm bảo không giảm giá nhiều hơn giá trị của các sản phẩm được áp dụng
  discountAmount = Math.min(discountAmount, applicableSubtotal);

  const finalTotal = subtotal - discountAmount;
  const appliedCouponInfo = {
    _id: coupon._id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    minOrderValue: coupon.minOrderValue,
    applicableTo: coupon.applicableTo,
    applicableIds: coupon.applicableIds,
  };

  return { discountAmount, finalTotal, appliedCouponInfo };
};

// @desc    Áp dụng mã giảm giá vào giỏ hàng
// @route   POST /api/v1/cart/apply-coupon
// @access  Public
const applyCoupon = asyncHandler(async (req, res) => {
  const { couponCode } = req.body;
  const identifier = req.cartIdentifier;
  const locale = req.locale || "vi";

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
    select:
      "price salePrice salePriceEffectiveDate salePriceExpiryDate variants category stockQuantity isActive isPublished", // Lấy category ID
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
    let itemPrice = item.productId.displayPrice;
    if (item.variantId) {
      const variant = item.productId.variants.id(item.variantId);
      if (variant) itemPrice = variant.displayPrice;
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
        let itemPrice = item.productId.displayPrice;
        if (item.variantId) {
          const variant = item.productId.variants.id(item.variantId);
          if (variant) itemPrice = variant.displayPrice;
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
  const updatedPopulatedCart = await populateAndCalculateCart(cart, locale);
  res.status(200).json(updatedPopulatedCart);
});

// @desc    Xóa mã giảm giá khỏi giỏ hàng
// @route   DELETE /api/v1/cart/remove-coupon
// @access  Public
const removeCoupon = asyncHandler(async (req, res) => {
  const identifier = req.cartIdentifier;
  const locale = req.locale || "vi";

  const cart = await Cart.findOne(identifier);
  if (cart && cart.appliedCoupon) {
    cart.appliedCoupon = null; // Xóa thông tin coupon
    await cart.save();
    console.log(`[Cart] Removed coupon for:`, identifier);
  }

  // Trả về giỏ hàng mới nhất (dù có thay đổi hay không)
  const populatedCart = await populateAndCalculateCart(cart, locale);
  res.status(200).json(populatedCart);
});

// @desc    Thêm sản phẩm vào giỏ hàng
// @route   POST /api/v1/cart/items
// @access  Public (User hoặc Guest)
const addItemToCart = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity } = req.body; // Dữ liệu đã validate
  const identifier = req.cartIdentifier; // Lấy từ middleware { userId: ... } hoặc { guestId: ... }
  const locale = req.locale || "vi";

  // --- 1. Tìm hoặc tạo giỏ hàng ---
  const cart = await findOrCreateCart(identifier);

  // --- 2. Kiểm tra sản phẩm và tồn kho ---
  const product = await Product.findById(productId).select(
    "variants stockQuantity isActive isPublished name price salePrice salePriceEffectiveDate salePriceExpiryDate"
  );
  if (!product || !product.isActive || !product.isPublished) {
    res.status(404);
    throw new Error("Sản phẩm không tồn tại hoặc không có sẵn.");
  }

  let variant = null;
  let availableStock = product.stockQuantity;
  let productHasVariants = product.variants && product.variants.length > 0;
  const finalVariantId = variantId
    ? new mongoose.Types.ObjectId(variantId)
    : null;

  if (finalVariantId) {
    if (!productHasVariants) {
      res.status(400);
      throw new Error("Sản phẩm này không có biến thể.");
    }
    variant = product.variants.id(finalVariantId);
    if (!variant) {
      res.status(404);
      throw new Error("Biến thể sản phẩm không tồn tại.");
    }
    availableStock = variant.stockQuantity;
  } else if (productHasVariants) {
    res.status(400);
    throw new Error("Vui lòng chọn một phiên bản (biến thể) của sản phẩm.");
  }

  // --- 3. Tìm item hiện có trong giỏ hàng ---
  const existingItemIndex = cart.items.findIndex((item) => {
    const productMatch = item.productId.equals(productId);

    // So sánh variantId một cách an toàn (cả hai đều là ObjectId hoặc cả hai đều là null)
    const variantMatch =
      (item.variantId &&
        finalVariantId &&
        item.variantId.equals(finalVariantId)) ||
      (!item.variantId && !finalVariantId);

    return productMatch && variantMatch;
  });

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
  const populatedCart = await populateAndCalculateCart(cart.toObject(), locale);
  res.status(200).json(populatedCart); // Trả về giỏ hàng đã cập nhật và populate
});

// @desc    Lấy giỏ hàng hiện tại
// @route   GET /api/v1/cart
// @access  Public (User hoặc Guest)
const getCart = asyncHandler(async (req, res) => {
  const locale = req.locale || "vi";
  const identifier = req.cartIdentifier;
  const cart = await Cart.findOne(identifier);

  const populatedCart = await populateAndCalculateCart(cart, locale); // Luôn gọi để trả về cấu trúc chuẩn
  res.status(200).json(populatedCart);
});

// @desc    Cập nhật số lượng của một item trong giỏ
// @route   PUT /api/v1/cart/items/:itemId
// @access  Public (User hoặc Guest)
const updateCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params; // ID của cart item (subdocument)
  const { quantity, newVariantId } = req.body; // Số lượng, Variant mới (đã validate)
  const identifier = req.cartIdentifier;
  const locale = req.locale || "vi";

  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    res.status(400);
    throw new Error("ID item trong giỏ hàng không hợp lệ.");
  }

  const newQuantity = quantity !== undefined ? parseInt(quantity) : undefined;
  const finalNewVariantId = newVariantId
    ? new mongoose.Types.ObjectId(newVariantId)
    : newVariantId === null
    ? null
    : undefined;

  if (
    newVariantId !== undefined &&
    newVariantId !== null &&
    !mongoose.Types.ObjectId.isValid(newVariantId)
  ) {
    res.status(400);
    throw new Error("ID biến thể mới không hợp lệ.");
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

  // --- 3. Lấy thông tin sản phẩm gốc ---
  // Nếu có yêu cầu đổi sang variant mới
  if (finalNewVariantId !== undefined) {
    // Tìm xem có item nào khác trong giỏ đã có variant mới này chưa
    const mergeTargetItem = cart.items.find(
      (item) =>
        item.productId.equals(itemToUpdate.productId) &&
        (finalNewVariantId
          ? item.variantId?.equals(finalNewVariantId)
          : !item.variantId) &&
        !item._id.equals(itemToUpdate._id) // Phải là một item khác
    );

    if (mergeTargetItem) {
      // Nếu tìm thấy item để gộp vào...
      console.log(
        `[Cart Update] Gộp item ${itemToUpdate._id} vào ${mergeTargetItem._id}`
      );

      const product = await Product.findById(itemToUpdate.productId).select(
        "variants stockQuantity"
      );
      const newVariant = finalNewVariantId
        ? product.variants.id(finalNewVariantId)
        : null;
      const availableStock = newVariant
        ? newVariant.stockQuantity
        : product.stockQuantity;
      const totalQuantity = mergeTargetItem.quantity + itemToUpdate.quantity;

      if (availableStock < totalQuantity) {
        res.status(400);
        throw new Error(
          `Không thể gộp sản phẩm. Tổng số lượng (${totalQuantity}) vượt quá tồn kho (${availableStock}).`
        );
      }

      // Gộp số lượng và xóa item cũ
      mergeTargetItem.quantity = totalQuantity;
      cart.items.pull({ _id: itemToUpdate._id });

      await cart.save();
      const populatedCart = await populateAndCalculateCart(
        cart.toObject(),
        locale
      );
      return res.status(200).json(populatedCart);
    }
    // Nếu không tìm thấy item để gộp, tiếp tục logic cập nhật bình thường ở dưới
  }

  // --- Logic cập nhật item như cũ (khi chỉ đổi số lượng hoặc đổi sang variant chưa có trong giỏ) ---
  const product = await Product.findById(itemToUpdate.productId).select(
    "name variants stockQuantity isActive isPublished"
  );
  if (!product || !product.isActive || !product.isPublished) {
    cart.items.pull({ _id: itemId });
    await cart.save();
    const populatedCart = await populateAndCalculateCart(cart, locale);
    return res.status(404).json({
      message: "Sản phẩm không còn tồn tại hoặc không hoạt động.",
      cart: populatedCart,
    });
  }

  let finalQuantity =
    newQuantity !== undefined ? newQuantity : itemToUpdate.quantity;
  let availableStock = 0;

  // Nếu có yêu cầu đổi sang newVariantId (nhưng không có item để gộp)
  if (finalNewVariantId !== undefined) {
    if (
      finalNewVariantId === null &&
      product.variants &&
      product.variants.length > 0
    ) {
      res.status(400);
      throw new Error("Sản phẩm này yêu cầu chọn biến thể.");
    }

    if (finalNewVariantId !== null) {
      const targetVariant = product.variants.id(finalNewVariantId);
      if (!targetVariant) {
        res.status(404);
        throw new Error("Biến thể mới không tồn tại cho sản phẩm này.");
      }
      availableStock = targetVariant.stockQuantity;
    } else {
      availableStock = product.stockQuantity;
    }

    if (availableStock < finalQuantity) {
      res.status(400);
      throw new Error(
        `Biến thể mới chỉ còn ${availableStock} sản phẩm. Không đủ số lượng ${finalQuantity}.`
      );
    }
    itemToUpdate.variantId = finalNewVariantId;
  } else {
    // Nếu không đổi variant, chỉ cập nhật số lượng
    if (itemToUpdate.variantId) {
      const currentVariant = product.variants.id(itemToUpdate.variantId);
      if (!currentVariant) {
        cart.items.pull({ _id: itemId });
        await cart.save();
        const populatedCart = await populateAndCalculateCart(cart, locale);
        return res.status(404).json({
          message: "Biến thể sản phẩm hiện tại không còn tồn tại.",
          cart: populatedCart,
        });
      }
      availableStock = currentVariant.stockQuantity;
    } else {
      availableStock = product.stockQuantity;
    }
  }

  // Cập nhật số lượng và kiểm tra tồn kho
  if (newQuantity !== undefined) {
    if (availableStock < newQuantity) {
      res.status(400);
      throw new Error(
        `Số lượng tồn kho không đủ (Chỉ còn ${availableStock}). Không thể cập nhật thành ${newQuantity}.`
      );
    }
    itemToUpdate.quantity = newQuantity;
  } else if (
    finalNewVariantId !== undefined &&
    availableStock < itemToUpdate.quantity
  ) {
    res.status(400);
    throw new Error(
      `Biến thể mới chỉ còn ${availableStock} sản phẩm, không đủ cho số lượng hiện tại (${itemToUpdate.quantity}).`
    );
  }

  // Lưu giỏ hàng
  await cart.save();
  const populatedCart = await populateAndCalculateCart(cart.toObject(), locale);
  res.status(200).json(populatedCart);
});

// @desc    Xóa một item khỏi giỏ hàng
// @route   DELETE /api/v1/cart/items/:itemId
// @access  Public (User hoặc Guest)
const removeCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const identifier = req.cartIdentifier;
  const locale = req.locale || "vi";

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
  const populatedCart = await populateAndCalculateCart(cart, locale);
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
  flattenI18nObject,
  applyCoupon,
  removeCoupon,
  addItemToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  populateAndCalculateCart,
};
