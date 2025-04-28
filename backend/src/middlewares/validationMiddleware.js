const validateRequest = (schema, property = "body") => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], {
      abortEarly: false, // Trả về tất cả lỗi validation một lúc
      allowUnknown: true, // Bỏ qua các field không định nghĩa trong schema
      stripUnknown: true, // Loại bỏ các field không định nghĩa trong schema khỏi output
    });
    const valid = error == null;

    if (valid) {
      next(); // Validation thành công, tiếp tục
    } else {
      const { details } = error;
      // Format lỗi cho dễ đọc hơn ở client
      const message = details.map((i) => i.message).join(", ");
      console.log("Validation Error:", message);
      res.status(400).json({ message: "Dữ liệu không hợp lệ: " + message }); // Bad Request
    }
  };
};

module.exports = validateRequest;
