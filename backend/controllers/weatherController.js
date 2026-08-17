const mongoose = require("mongoose");
const PilgrimageCenter = require("../models/PilgrimageCenter");
const { fetchWeatherData } = require("../services/weatherService");

// Helper to check DB connection state
const isDbConnected = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      message: "Database connection is currently reconnecting. Please try again shortly.",
    });
    return false;
  }
  return true;
};

/**
 * @desc    Get weather information and risk level for a pilgrimage center by ID
 * @route   GET /api/weather/:centerId
 * @access  Public
 */
const getWeatherByCenterId = async (req, res) => {
  try {
    if (!isDbConnected(res)) return;

    const { centerId } = req.params;

    if (!centerId || !mongoose.Types.ObjectId.isValid(centerId)) {
      return res.status(400).json({
        message: "Weather information is unavailable for this pilgrimage center.",
        errorType: "INVALID_CENTER_ID",
      });
    }

    const center = await PilgrimageCenter.findById(centerId);

    if (!center) {
      return res.status(404).json({
        message: "Pilgrimage center not found.",
        errorType: "CENTER_NOT_FOUND",
      });
    }

    // Validate coordinates
    const lat = center.location?.latitude;
    const lon = center.location?.longitude;

    if (
      lat === undefined ||
      lat === null ||
      lon === undefined ||
      lon === null ||
      isNaN(Number(lat)) ||
      isNaN(Number(lon))
    ) {
      return res.status(400).json({
        message: "Weather information is unavailable for this pilgrimage center.",
        errorType: "MISSING_COORDINATES",
        details: "Selected pilgrimage center does not have valid latitude and longitude coordinates.",
      });
    }

    // Fetch weather data
    const weatherData = await fetchWeatherData(center._id.toString(), Number(lat), Number(lon), center.name);

    return res.status(200).json({
      centerId: center._id,
      ...weatherData,
    });
  } catch (error) {
    console.error("Error in getWeatherByCenterId:", error.message || error);
    return res.status(500).json({
      message: error.message || "Weather information is temporarily unavailable.",
      errorType: "WEATHER_API_FAILURE",
    });
  }
};

module.exports = {
  getWeatherByCenterId,
};
