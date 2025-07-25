const express = require("express");
const {
  getSettings,
  updateSettings,
  getExchangeRates,
} = require("../controllers/settingController");
const { protect, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.route("/").get(getSettings).put(protect, isAdmin, updateSettings);

router.get("/rates", getExchangeRates);

module.exports = router;
