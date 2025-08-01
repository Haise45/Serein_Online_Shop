const Joi = require("joi");

// Regex cơ bản cho SĐT Việt Nam (có thể cần chỉnh sửa cho chính xác hơn)
const phoneVNRegex =
  /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/;

// --- Schema con cho các trường đa ngôn ngữ ---
const i18nStringSchema = Joi.object({
  vi: Joi.string().trim().allow("").optional(),
  en: Joi.string().trim().allow("").optional(),
})
  .or("vi", "en")
  .messages({
    "object.missing": "Ít nhất phải có một trong hai ngôn ngữ.",
  });

const registerSchema = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "string.base": `"Tên" phải là chuỗi`,
    "string.empty": `"Tên" không được để trống`,
    "string.min": `"Tên" phải có ít nhất {#limit} ký tự`,
    "string.max": `"Tên" không được vượt quá {#limit} ký tự`,
    "any.required": `"Tên" là trường bắt buộc`,
  }),
  email: Joi.string().email().required().messages({
    "string.base": `"Email" phải là chuỗi`,
    "string.empty": `"Email" không được để trống`,
    "string.email": `"Email" không đúng định dạng`,
    "any.required": `"Email" là trường bắt buộc`,
  }),
  password: Joi.string()
    .min(6)
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])"))
    .messages({
      "string.base": `"Mật khẩu" phải là chuỗi`,
      "string.empty": `"Mật khẩu" không được để trống`,
      "string.min": `"Mật khẩu" phải có ít nhất {#limit} ký tự`,
      "any.required": `"Mật khẩu" là trường bắt buộc`,
      "string.pattern.base":
        "Mật khẩu mới phải chứa ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt.",
    }),
  // confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
  //    'any.only': '"Xác nhận mật khẩu" không khớp',
  //    'any.required': '"Xác nhận mật khẩu" là trường bắt buộc',
  // }) // Bỏ comment nếu cần xác nhận mật khẩu
  phone: Joi.string().pattern(phoneVNRegex).required().messages({
    "string.empty": `"Số điện thoại" không được để trống`,
    "any.required": `"Số điện thoại" là trường bắt buộc`,
    "string.pattern.base": `"Số điện thoại" không đúng định dạng Việt Nam.`,
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": `"Email" không được để trống`,
    "string.email": `"Email" không đúng định dạng`,
    "any.required": `"Email" là trường bắt buộc`,
  }),
  password: Joi.string().required().messages({
    "string.empty": `"Mật khẩu" không được để trống`,
    "any.required": `"Mật khẩu" là trường bắt buộc`,
  }),
});

const emailSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": `"Email" không được để trống`,
    "string.email": `"Email" không đúng định dạng`,
    "any.required": `"Email" là trường bắt buộc`,
  }),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": `"Email" không được để trống`,
    "string.email": `"Email" không đúng định dạng`,
    "any.required": `"Email" là trường bắt buộc`,
  }),
  otp: Joi.string().length(6).required().messages({
    "string.empty": `"Mã OTP" không được để trống`,
    "string.length": `"Mã OTP" phải có 6 ký tự`,
    "any.required": `"Mã OTP" là trường bắt buộc`,
  }),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(3).max(50).optional().messages({
    "string.min": `"Tên" phải có ít nhất {#limit} ký tự`,
    "string.max": `"Tên" không được vượt quá {#limit} ký tự`,
  }),
  email: Joi.string().email().optional().messages({
    "string.email": `"Email" không đúng định dạng`,
  }),
  phone: Joi.string().pattern(phoneVNRegex).optional().messages({
    // Cho phép cập nhật SĐT
    "string.pattern.base": `"Số điện thoại" không đúng định dạng Việt Nam.`,
  }),
  // Cho phép password và currentPassword, nhưng chỉ yêu cầu currentPassword nếu password có mặt
  currentPassword: Joi.string().when("password", {
    // Chỉ yêu cầu/validate currentPassword KHI password (mới) tồn tại
    is: Joi.exist(),
    then: Joi.string().required().messages({
      "any.required": "Mật khẩu hiện tại là bắt buộc khi đổi mật khẩu mới.",
    }),
    otherwise: Joi.string().optional().allow("", null), // Nếu không đổi mk thì không cần
  }),
  password: Joi.string()
    .min(6)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])"))
    .messages({
      "string.min": "Mật khẩu mới phải có ít nhất 6 ký tự.",
      "string.pattern.base":
        "Mật khẩu mới phải chứa ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt.",
    }),
})
  .min(1) // Yêu cầu ít nhất một trường được cung cấp để cập nhật
  .or("name", "email", "phone", "password");

const addressSchemaValidation = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required().messages({
    "string.base": `"Họ và tên" phải là chuỗi`,
    "string.empty": `"Họ và tên" không được để trống`,
    "string.min": `"Họ và tên" phải có ít nhất {#limit} ký tự`,
    "string.max": `"Họ và tên" không được vượt quá {#limit} ký tự`,
    "any.required": `"Họ và tên" là trường bắt buộc`,
  }),
  phone: Joi.string().trim().pattern(phoneVNRegex).required().messages({
    "string.empty": `"Số điện thoại" không được để trống`,
    "any.required": `"Số điện thoại" là trường bắt buộc`,
    "string.pattern.base": `"Số điện thoại" không đúng định dạng Việt Nam.`,
  }),
  street: Joi.string().trim().min(5).max(200).required().messages({
    // Địa chỉ chi tiết (số nhà, đường)
    "string.base": `"Địa chỉ chi tiết" phải là chuỗi`,
    "string.empty": `"Địa chỉ chi tiết" không được để trống`,
    "string.min": `"Địa chỉ chi tiết" phải có ít nhất {#limit} ký tự`,
    "string.max": `"Địa chỉ chi tiết" không được vượt quá {#limit} ký tự`,
    "any.required": `"Địa chỉ chi tiết" là trường bắt buộc`,
  }),
  provinceCode: Joi.string().trim().required().messages({
    // Mã Tỉnh/Thành
    "string.empty": `Vui lòng chọn "Tỉnh/Thành phố"`,
    "any.required": `Vui lòng chọn "Tỉnh/Thành phố"`,
  }),
  provinceName: Joi.string().trim().required().messages({
    // Tên Tỉnh/Thành
    "string.empty": `"Tên Tỉnh/Thành phố" không được để trống`,
    "any.required": `"Tên Tỉnh/Thành phố" là trường bắt buộc`,
  }),
  districtCode: Joi.string().trim().required().messages({
    // Mã Quận/Huyện
    "string.empty": `Vui lòng chọn "Quận/Huyện"`,
    "any.required": `Vui lòng chọn "Quận/Huyện"`,
  }),
  districtName: Joi.string().trim().required().messages({
    // Tên Quận/Huyện
    "string.empty": `"Tên Quận/Huyện" không được để trống`,
    "any.required": `"Tên Quận/Huyện" là trường bắt buộc`,
  }),
  communeCode: Joi.string().trim().required().messages({
    // Mã Phường/Xã
    "string.empty": `Vui lòng chọn "Phường/Xã"`,
    "any.required": `Vui lòng chọn "Phường/Xã"`,
  }),
  communeName: Joi.string().trim().required().messages({
    // Tên Phường/Xã
    "string.empty": `"Tên Phường/Xã" không được để trống`,
    "any.required": `"Tên Phường/Xã" là trường bắt buộc`,
  }),
  isDefault: Joi.boolean().optional(),
  _id: Joi.string().hex().length(24).optional(),
});

const createCategorySchema = Joi.object({
  name: i18nStringSchema.required().max(100), // Sử dụng schema con
  description: i18nStringSchema.optional().max(500).allow(null),
  parent: Joi.string().optional().allow(null, "").messages({
    "string.base": `"Danh mục cha" phải là ID hợp lệ`,
  }),
  image: Joi.string().optional().allow(null, "").messages({
    "string.base": `"Ảnh" phải là một URL hợp lệ`,
  }),
  isActive: Joi.boolean().optional(),
});

const updateCategorySchema = Joi.object({
  name: i18nStringSchema.max(100).optional(),
  description: i18nStringSchema.max(500).optional().allow(null),
  parent: Joi.string().optional().allow(null, "").messages({
    "string.base": `"Danh mục cha" phải là ID hợp lệ`,
  }),
  image: Joi.string().optional().allow(null, "").messages({
    "string.base": `"Ảnh" phải là một URL hợp lệ`,
  }),
  isActive: Joi.boolean().optional(),
}).min(1); // Yêu cầu ít nhất một trường được cung cấp để cập nhật

const objectIdSchema = Joi.string().hex().length(24).messages({
  "string.length": "ID không hợp lệ",
  "string.hex": "ID không hợp lệ",
});

// Schema cho một giá trị thuộc tính của biến thể
const variantOptionValueSchema = Joi.object({
  attribute: objectIdSchema.required().messages({
    "any.required": "ID thuộc tính của biến thể là bắt buộc",
  }),
  value: objectIdSchema.required().messages({
    "any.required": "ID giá trị thuộc tính của biến thể là bắt buộc",
  }),
});

// Schema cho một biến thể
const variantSchemaValidation = Joi.object({
  sku: Joi.string().trim().optional().allow(null, ""),
  price: Joi.number().min(0).required().messages({
    "any.required": "Giá của biến thể là bắt buộc",
    "number.min": "Giá biến thể không được âm",
  }),
  salePrice: Joi.number().min(0).optional().allow(null),
  salePriceEffectiveDate: Joi.date().optional().allow(null),
  salePriceExpiryDate: Joi.date()
    .greater(Joi.ref("salePriceEffectiveDate"))
    .optional()
    .allow(null),
  stockQuantity: Joi.number().integer().min(0).required().messages({
    "any.required": "Số lượng tồn kho của biến thể là bắt buộc",
    "number.min": "Số lượng tồn kho không được âm",
  }),
  images: Joi.array().items(Joi.string().uri()).optional().default([]),
  optionValues: Joi.array()
    .items(variantOptionValueSchema)
    .min(1)
    .required()
    .messages({
      "any.required": "Biến thể phải có ít nhất một cặp thuộc tính-giá trị",
      "array.min": "Biến thể phải có ít nhất một cặp thuộc tính-giá trị",
    }),
});

// Schema cho một thuộc tính định nghĩa trên sản phẩm
const productAttributeSchema = Joi.object({
  attribute: objectIdSchema.required().messages({
    "any.required": "ID thuộc tính là bắt buộc",
  }),
  values: Joi.array().items(objectIdSchema).min(1).required().messages({
    "any.required": "Thuộc tính phải có ít nhất một giá trị",
    "array.min": "Thuộc tính phải có ít nhất một giá trị",
  }),
});

// Schema cho tạo sản phẩm mới
const createProductSchema = Joi.object({
  name: i18nStringSchema.required(), // Sử dụng schema con
  description: i18nStringSchema.optional().allow(null),
  price: Joi.number().min(0).required().messages({
    "any.required": "Giá sản phẩm là bắt buộc",
    "number.min": "Giá không được âm",
  }),
  salePrice: Joi.number()
    .min(0)
    .optional()
    .allow(null)
    .messages({ "number.min": "Giá sale biến thể không được âm" }),
  salePriceEffectiveDate: Joi.date()
    .optional()
    .allow(null)
    .messages({ "date.base": "Ngày bắt đầu sale biến thể không hợp lệ" }),
  salePriceExpiryDate: Joi.date()
    .greater(Joi.ref("salePriceEffectiveDate"))
    .optional()
    .allow(null)
    .messages({
      "date.base": "Ngày kết thúc sale biến thể không hợp lệ",
      "date.greater": "Ngày kết thúc sale biến thể phải sau ngày bắt đầu",
    }),
  sku: Joi.string().trim().optional().allow(null, ""), // SKU chính là tùy chọn
  category: Joi.string().hex().length(24).required().messages({
    "any.required": "Danh mục là bắt buộc",
    "string.length": "ID Danh mục không hợp lệ",
    "string.hex": "ID Danh mục không hợp lệ",
  }),
  images: Joi.array()
    .items(Joi.string().uri())
    .optional()
    .default([])
    .messages({ "string.uri": "Mỗi ảnh phải là một URL hợp lệ" }),
  stockQuantity: Joi.number()
    .integer()
    .min(0)
    .optional()
    .default(0)
    .messages({ "number.min": "Số lượng tồn kho không được âm" }),
  isPublished: Joi.boolean().optional().default(false),
  attributes: Joi.array().items(productAttributeSchema).optional().default([]),
  variants: Joi.array().items(variantSchemaValidation).optional().default([]),
});

// Schema cho cập nhật sản phẩm
const updateProductSchema = Joi.object({
  name: i18nStringSchema.optional(),
  description: i18nStringSchema.optional().allow(null),
  price: Joi.number()
    .min(0)
    .optional()
    .messages({ "number.min": "Giá không được âm" }),
  salePrice: Joi.number().min(0).optional().allow(null),
  salePriceEffectiveDate: Joi.date().optional().allow(null),
  salePriceExpiryDate: Joi.date()
    .greater(Joi.ref("salePriceEffectiveDate"))
    .optional()
    .allow(null),
  sku: Joi.string().trim().optional().allow(null, ""),
  category: Joi.string().hex().length(24).optional().messages({
    "string.length": "ID Danh mục không hợp lệ",
    "string.hex": "ID Danh mục không hợp lệ",
  }),
  images: Joi.array()
    .items(Joi.string().uri())
    .optional()
    .messages({ "string.uri": "Mỗi ảnh phải là một URL hợp lệ" }),
  stockQuantity: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({ "number.min": "Số lượng tồn kho không được âm" }),
  isPublished: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(), // Cho phép cập nhật trạng thái active (soft delete)
  attributes: Joi.array().items(productAttributeSchema).optional(),
  variants: Joi.array().items(variantSchemaValidation).optional(),
}).min(1); // Phải có ít nhất một trường để cập nhật

// Schema cho việc thêm item vào giỏ hàng
const addToCartSchema = Joi.object({
  productId: Joi.string().hex().length(24).required().messages({
    "any.required": "ID sản phẩm là bắt buộc",
    "string.length": "ID sản phẩm không hợp lệ",
    "string.hex": "ID sản phẩm không hợp lệ",
  }),
  variantId: Joi.string().hex().length(24).optional().allow(null, "").messages({
    "string.length": "ID biến thể không hợp lệ",
    "string.hex": "ID biến thể không hợp lệ",
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    "any.required": "Số lượng là bắt buộc",
    "number.base": "Số lượng phải là một số",
    "number.integer": "Số lượng phải là số nguyên",
    "number.min": "Số lượng phải lớn hơn 0",
  }),
});

// Schema cho việc cập nhật số lượng item trong giỏ hàng
const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).optional().messages({
    "number.base": "Số lượng phải là một số",
    "number.integer": "Số lượng phải là số nguyên",
    "number.min": "Số lượng phải lớn hơn 0",
  }),
});

// Schema cho việc tạo mã giảm giá
const createCouponSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(3).max(50).required().messages({
    "any.required": "Mã giảm giá là bắt buộc.",
    "string.empty": "Mã giảm giá không được để trống.",
    "string.min": "Mã giảm giá phải có ít nhất {#limit} ký tự.",
    "string.max": "Mã giảm giá không được vượt quá {#limit} ký tự.",
    "string.uppercase": "Mã giảm giá phải là chữ hoa.",
  }),
  description: i18nStringSchema.optional().allow(null),
  discountType: Joi.string()
    .valid("percentage", "fixed_amount")
    .required()
    .messages({
      "any.required": "Loại giảm giá là bắt buộc.",
      "any.only": 'Loại giảm giá phải là "percentage" hoặc "fixed_amount".',
    }),
  discountValue: Joi.number().positive().required().messages({
    "any.required": "Giá trị giảm giá là bắt buộc.",
    "number.base": "Giá trị giảm giá phải là số.",
    "number.positive": "Giá trị giảm giá phải lớn hơn 0.",
  }),
  minOrderValue: Joi.number().min(0).optional().default(0).messages({
    "number.min": "Giá trị đơn hàng tối thiểu không được âm.",
  }),
  maxUsage: Joi.number().integer().min(1).optional().allow(null).messages({
    "number.min": "Số lần sử dụng tối đa phải ít nhất là 1.",
    "number.integer": "Số lần sử dụng tối đa phải là số nguyên.",
  }),
  // usageCount không cần validate khi tạo
  maxUsagePerUser: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      "number.min":
        "Số lần sử dụng tối đa cho mỗi người dùng phải ít nhất là 1.",
      "number.integer":
        "Số lần sử dụng tối đa cho mỗi người dùng phải là số nguyên.",
    }),
  startDate: Joi.date().optional().allow(null).messages({
    "date.base": "Ngày bắt đầu không hợp lệ.",
  }),
  expiryDate: Joi.date().required().messages({
    // Ngày hết hạn là bắt buộc
    "any.required": "Ngày hết hạn là bắt buộc.",
    "date.base": "Ngày hết hạn không hợp lệ.",
  }),
  isActive: Joi.boolean().optional().default(true),
  applicableTo: Joi.string()
    .valid("all", "categories", "products")
    .optional()
    .default("all"),
  applicableIds: Joi.array()
    .items(Joi.string().hex().length(24))
    .optional()
    .default([])
    .messages({
      "string.length": "ID áp dụng không hợp lệ.",
      "string.hex": "ID áp dụng không hợp lệ.",
    }),
});

// Schema cho việc cập nhật mã giảm giá
const updateCouponSchema = Joi.object({
  description: i18nStringSchema.optional().allow(null),
  // Không cho phép sửa code, discountType, discountValue
  minOrderValue: Joi.number().min(0).optional(),
  maxUsage: Joi.number().integer().min(1).optional().allow(null),
  maxUsagePerUser: Joi.number().integer().min(1).optional(),
  startDate: Joi.date().optional().allow(null),
  expiryDate: Joi.date().optional(),
  isActive: Joi.boolean().optional(),
  applicableTo: Joi.string().valid("all", "categories", "products").optional(),
  applicableIds: Joi.array().items(Joi.string().hex().length(24)).optional(),
}).min(1); // Yêu cầu ít nhất một trường để cập nhật

// Schema cho Tạo Đơn Hàng Mới
const createOrderSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().optional().messages({
    "string.email": "Email không hợp lệ.",
  }),
  // Chỉ được phép chọn MỘT trong hai: địa chỉ đã lưu hoặc địa chỉ mới
  shippingAddressId: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null, "")
    .messages({
      "string.length": "ID Địa chỉ đã lưu không hợp lệ.",
      "string.hex": "ID Địa chỉ đã lưu không hợp lệ.",
    }),
  shippingAddress: addressSchemaValidation.optional().allow(null),
  paymentMethod: Joi.string()
    .valid("COD", "BANK_TRANSFER", "PAYPAL")
    .required()
    .messages({
      "any.only": "Phương thức thanh toán không hợp lệ.",
      "any.required": "Vui lòng chọn phương thức thanh toán.",
    }),
  shippingMethod: Joi.string().optional().allow("").default("Standard"),
  notes: Joi.string().trim().optional().allow(""),
})
  .xor("shippingAddressId", "shippingAddress")
  .messages({
    "object.xor":
      "Vui lòng chọn địa chỉ đã lưu HOẶC nhập địa chỉ mới, không chọn cả hai hoặc bỏ trống.",
  });

// Schema cho Admin nhập lý do và thời hạn đình chỉ
const updateUserStatusSchema = Joi.object({
  isActive: Joi.boolean().required(),
  reason: Joi.string().when("isActive", {
    is: false,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  suspensionEndDate: Joi.date().allow(null).optional(),
});

// Schema cho User tạo/sửa review
const reviewSchemaValidation = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    "any.required": "Vui lòng chọn điểm đánh giá.",
    "number.base": "Điểm đánh giá phải là số.",
    "number.integer": "Điểm đánh giá phải là số nguyên.",
    "number.min": "Điểm đánh giá phải từ 1 đến 5.",
    "number.max": "Điểm đánh giá phải từ 1 đến 5.",
  }),
  comment: Joi.string().trim().max(1000).optional().allow("").messages({
    "string.max": "Bình luận không được vượt quá {#limit} ký tự.",
  }),
  orderId: Joi.string().hex().length(24).required().messages({
    // <<< Cần orderId để xác thực người mua khi tạo
    "any.required": "ID đơn hàng là bắt buộc để đánh giá.",
    "string.length": "ID đơn hàng không hợp lệ.",
    "string.hex": "ID đơn hàng không hợp lệ.",
  }),
  userImages: Joi.array()
    .items(Joi.string().uri())
    .optional()
    .default([])
    .messages({
      // <<< Validate ảnh user gửi
      "string.uri": "Mỗi ảnh phải là một URL hợp lệ.",
    }),
});

// Schema cho update review
const updateReviewSchemaValidation = Joi.object({
  rating: Joi.number().min(1).max(5).optional().messages({
    "number.base": "Đánh giá phải là một số.",
    "number.min": "Đánh giá phải từ 1 đến 5 sao.",
    "number.max": "Đánh giá phải từ 1 đến 5 sao.",
  }),
  comment: Joi.string().trim().max(1000).allow("").optional().messages({
    "string.max": "Bình luận không được vượt quá 1000 ký tự.",
  }),
  userImages: Joi.array().items(Joi.string().uri()).max(5).optional().messages({
    "array.max": "Bạn chỉ có thể tải lên tối đa 5 hình ảnh.",
    "string.uri": "URL hình ảnh không hợp lệ.",
  }),
});

// Schema cho Admin phản hồi review
const adminReplySchemaValidation = Joi.object({
  comment: Joi.string().trim().min(1).max(500).required().messages({
    "any.required": "Nội dung phản hồi là bắt buộc.",
    "string.empty": "Nội dung phản hồi không được để trống.",
    "string.min": "Nội dung phản hồi phải có ít nhất {#limit} ký tự.",
    "string.max": "Nội dung phản hồi không được vượt quá {#limit} ký tự.",
  }),
});

module.exports = {
  registerSchema,
  emailSchema,
  verifyOtpSchema,
  loginSchema,
  updateProfileSchema,
  addressSchemaValidation,
  variantSchemaValidation,
  createCategorySchema,
  updateCategorySchema,
  createProductSchema,
  updateProductSchema,
  addToCartSchema,
  updateCartItemSchema,
  createCouponSchema,
  updateCouponSchema,
  createOrderSchema,
  updateUserStatusSchema,
  reviewSchemaValidation,
  updateReviewSchemaValidation,
  adminReplySchemaValidation,
};
