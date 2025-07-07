const Setting = require("../models/Setting");
const asyncHandler = require("../middlewares/asyncHandler");
const { getVndToUsdRate } = require("../utils/paypalClient");

// @desc    Lấy cấu hình trang web (cho cả client và admin)
// @route   GET /api/v1/settings
// @access  Public
const getSettings = asyncHandler(async (req, res) => {
  const settings = await Setting.getSettings();
  res.status(200).json(settings);
});

// @desc    Cập nhật cấu hình trang web (chỉ Admin)
// @route   PUT /api/v1/settings
// @access  Private/Admin
const updateSettings = asyncHandler(async (req, res) => {
  // Không cho phép thay đổi `key`
  delete req.body.key;

  const settings = await Setting.findOneAndUpdate(
    { key: "main_settings" },
    { $set: req.body },
    { new: true, upsert: true, runValidators: true }
  );
  res.status(200).json(settings);
});

// @desc    Lấy tỷ giá hối đoái
// @route   GET /api/v1/currency/rates
// @access  Public
const getExchangeRates = asyncHandler(async (req, res) => {
  const vndToUsd = await getVndToUsdRate();
  // API trả về tỷ giá chuyển đổi TỪ base currency
  // Ví dụ: 1 VND = 0.00004 USD
  // Người dùng thường muốn biết 1 USD = ? VND
  const usdToVnd = 1 / vndToUsd;

  res.json({
    base: "VND",
    rates: {
      USD: vndToUsd,
    },
    // Thêm tỷ giá ngược lại cho tiện
    inverseRates: {
      USD: usdToVnd,
    },
  });
});

module.exports = {
  getSettings,
  updateSettings,
  getExchangeRates,
};
