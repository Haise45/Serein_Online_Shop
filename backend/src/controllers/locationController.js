const Province = require("../models/Province");
const District = require("../models/District");
const Commune = require("../models/Commune");
const asyncHandler = require("../middlewares/asyncHandler");

// @desc    Get all provinces (for Vietnam)
// @route   GET /api/v1/locations/provinces
// @access  Public
const getProvinces = asyncHandler(async (req, res) => {
  // Hiện tại chỉ lấy VN, sau này có thể thêm filter ?countryCode=VN
  const provinces = await Province.find({ countryCode: "VN" }).sort({
    name: 1,
  });
  res.json(provinces);
});

// @desc    Get districts by province code
// @route   GET /api/v1/locations/districts?provinceCode=<province_code>
// @access  Public
const getDistrictsByProvince = asyncHandler(async (req, res) => {
  const { provinceCode } = req.query;
  if (!provinceCode) {
    res.status(400);
    throw new Error("Vui lòng cung cấp mã tỉnh (provinceCode).");
  }
  const districts = await District.find({ provinceCode }).sort({ name: 1 });
  res.json(districts);
});

// @desc    Get communes by district code
// @route   GET /api/v1/locations/communes?districtCode=<district_code>
// @access  Public
const getCommunesByDistrict = asyncHandler(async (req, res) => {
  const { districtCode } = req.query;
  if (!districtCode) {
    res.status(400);
    throw new Error("Vui lòng cung cấp mã quận/huyện (districtCode).");
  }
  const communes = await Commune.find({ districtCode }).sort({ name: 1 });
  res.json(communes);
});

module.exports = {
  getProvinces,
  getDistrictsByProvince,
  getCommunesByDistrict,
};
