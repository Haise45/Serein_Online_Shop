const asyncHandler = require("./asyncHandler");

const setLocale = asyncHandler(async (req, res, next) => {
  // next-intl sẽ gửi header 'accept-language'
  const langHeader = req.headers["accept-language"];
  let locale = "vi"; // Mặc định là 'vi'

  if (langHeader) {
    // Lấy ngôn ngữ đầu tiên (ví dụ: 'en-US,en;q=0.9,vi;q=0.8' -> 'en')
    const preferredLocale = langHeader.split(",")[0].split("-")[0];
    if (["vi", "en"].includes(preferredLocale)) {
      locale = preferredLocale;
    }
  }

  // Gắn locale vào request để các controller sau có thể sử dụng
  req.locale = locale;
  next();
});

module.exports = setLocale;
