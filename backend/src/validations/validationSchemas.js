const Joi = require("joi");

// Regex cơ bản cho SĐT Việt Nam (có thể cần chỉnh sửa cho chính xác hơn)
const phoneVNRegex =
  /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/;

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
  password: Joi.string().min(6).required().messages({
    "string.base": `"Mật khẩu" phải là chuỗi`,
    "string.empty": `"Mật khẩu" không được để trống`,
    "string.min": `"Mật khẩu" phải có ít nhất {#limit} ký tự`,
    "any.required": `"Mật khẩu" là trường bắt buộc`,
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
  // Thêm các trường khác cho phép cập nhật nếu cần
}).min(1); // Yêu cầu ít nhất một trường được cung cấp để cập nhật

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
});

const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.base": `"Tên danh mục" phải là chuỗi`,
    "string.empty": `"Tên danh mục" không được để trống`,
    "string.min": `"Tên danh mục" phải có ít nhất {#limit} ký tự`,
    "string.max": `"Tên danh mục" không được vượt quá {#limit} ký tự`,
    "any.required": `"Tên danh mục" là trường bắt buộc`,
  }),
  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow(null, "")
    .messages({
      "string.base": `"Mô tả" phải là chuỗi`,
      "string.max": `"Mô tả" không được vượt quá {#limit} ký tự`,
    }),
  parent: Joi.string().optional().allow(null, "").messages({
    "string.base": `"Danh mục cha" phải là ID hợp lệ`,
  }),
  image: Joi.string().optional().allow(null, "").messages({
    "string.base": `"Ảnh" phải là một URL hợp lệ`,
  }),
  isActive: Joi.boolean().optional(),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.base": `"Tên danh mục" phải là chuỗi`,
    "string.empty": `"Tên danh mục" không được để trống`,
    "string.min": `"Tên danh mục" phải có ít nhất {#limit} ký tự`,
    "string.max": `"Tên danh mục" không được vượt quá {#limit} ký tự`,
    "any.required": `"Tên danh mục" là trường bắt buộc`,
  }),
  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow(null, "")
    .messages({
      "string.base": `"Mô tả" phải là chuỗi`,
      "string.max": `"Mô tả" không được vượt quá {#limit} ký tự`,
    }),
  parent: Joi.string().optional().allow(null, "").messages({
    "string.base": `"Danh mục cha" phải là ID hợp lệ`,
  }),
  image: Joi.string().optional().allow(null, "").messages({
    "string.base": `"Ảnh" phải là một URL hợp lệ`,
  }),
  isActive: Joi.boolean().optional(),
}).min(1); // Yêu cầu ít nhất một trường được cung cấp để cập nhật

// Schema cho một giá trị thuộc tính của biến thể
const variantOptionValueSchema = Joi.object({
  attributeName: Joi.string()
    .required()
    .messages({ "any.required": "Tên thuộc tính của biến thể là bắt buộc" }),
  value: Joi.string().required().messages({
    "any.required": "Giá trị thuộc tính của biến thể là bắt buộc",
  }),
});

// Schema cho một biến thể
const variantSchemaValidation = Joi.object({
  sku: Joi.string()
    .trim()
    .required()
    .messages({ "any.required": "SKU của biến thể là bắt buộc" }),
  price: Joi.number().min(0).required().messages({
    "any.required": "Giá của biến thể là bắt buộc",
    "number.min": "Giá biến thể không được âm",
  }),
  stockQuantity: Joi.number().integer().min(0).required().messages({
    "any.required": "Số lượng tồn kho của biến thể là bắt buộc",
    "number.min": "Số lượng tồn kho không được âm",
  }),
  image: Joi.string()
    .uri()
    .optional()
    .allow(null, "")
    .messages({ "string.uri": "Ảnh biến thể phải là URL hợp lệ" }),
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
  name: Joi.string()
    .required()
    .messages({ "any.required": "Tên thuộc tính là bắt buộc" }),
  values: Joi.array().items(Joi.string()).min(1).required().messages({
    "any.required": "Thuộc tính phải có ít nhất một giá trị",
    "array.min": "Thuộc tính phải có ít nhất một giá trị",
  }),
});

// Schema cho tạo sản phẩm mới
const createProductSchema = Joi.object({
  name: Joi.string().trim().min(3).max(200).required().messages({
    "any.required": "Tên sản phẩm là bắt buộc",
    "string.min": "Tên sản phẩm phải có ít nhất {#limit} ký tự",
    "string.max": "Tên sản phẩm không được vượt quá {#limit} ký tự",
    "string.base": "Tên sản phẩm phải là chuỗi",
    "string.empty": "Tên sản phẩm không được để trống",
  }),
  description: Joi.string().trim().optional().allow(""),
  price: Joi.number().min(0).required().messages({
    "any.required": "Giá sản phẩm là bắt buộc",
    "number.min": "Giá không được âm",
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
  name: Joi.string().trim().min(3).max(200).required().messages({
    "any.required": "Tên sản phẩm là bắt buộc",
    "string.min": "Tên sản phẩm phải có ít nhất {#limit} ký tự",
    "string.max": "Tên sản phẩm không được vượt quá {#limit} ký tự",
    "string.base": "Tên sản phẩm phải là chuỗi",
    "string.empty": "Tên sản phẩm không được để trống",
  }),
  description: Joi.string().trim().optional().allow(""),
  price: Joi.number()
    .min(0)
    .optional()
    .messages({ "number.min": "Giá không được âm" }),
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

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  addressSchemaValidation,
  createCategorySchema,
  updateCategorySchema,
  createProductSchema,
  updateProductSchema,
};
