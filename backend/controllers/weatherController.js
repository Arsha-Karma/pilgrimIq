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
    const { date } = req.query;

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

    let isForecastAvailable = true;
    let forecastNotice = "";
    let selectedDateWeather = null;

    if (date) {
      const parseValidDate = (dVal) => {
        if (!dVal || dVal === "undefined" || dVal === "null") return null;
        const parsed = new Date(dVal);
        return isNaN(parsed.getTime()) ? null : parsed;
      };

      const targetDate = parseValidDate(date);

      if (targetDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);

        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 14) {
          isForecastAvailable = false;
          forecastNotice = "Weather forecast for this journey date is not yet available. Weather will be updated when the forecast becomes available.";
        } else {
          const dateStr = targetDate.toISOString().split("T")[0];
          const match = weatherData.forecast ? weatherData.forecast.find((f) => f.date === dateStr) : null;
          if (match) {
            selectedDateWeather = match;
          } else if (diffDays > 7) {
            isForecastAvailable = false;
            forecastNotice = "Weather forecast for this journey date is not yet available. Weather will be updated when the forecast becomes available.";
          }
        }
      }
    }

    return res.status(200).json({
      centerId: center._id,
      isForecastAvailable,
      forecastNotice,
      selectedDateWeather,
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
