const express = require("express");
const {
  getProvinces,
  getDistrictsByProvince,
  getCommunesByDistrict,
} = require("../controllers/locationController");

const router = express.Router();

router.get("/provinces", getProvinces);
router.get("/districts", getDistrictsByProvince); // Query param: ?provinceCode=...
router.get("/communes", getCommunesByDistrict); // Query param: ?districtCode=...

module.exports = router;
