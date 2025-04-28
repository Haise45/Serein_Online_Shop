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

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  addressSchemaValidation,
};
