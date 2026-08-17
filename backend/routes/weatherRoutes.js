const express = require("express");
const router = express.Router();
const { getWeatherByCenterId } = require("../controllers/weatherController");

// Public route to fetch weather information for a pilgrimage center
router.get("/:centerId", getWeatherByCenterId);

module.exports = router;
