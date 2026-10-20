const mongoose = require("mongoose");
const PilgrimageCenter = require("../models/PilgrimageCenter");
const { fetchWeatherData, resolveCoordinates } = require("../services/weatherService");

// Helper to check DB connection state
const isDbConnected = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      message: "Database connection is currently reconnecting. Please try again shortly.",
      errorType: "DB_RECONNECTING",
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
    const { date, refresh } = req.query;
    const forceRefresh = refresh === "true" || refresh === "1";

    if (!centerId || !mongoose.Types.ObjectId.isValid(centerId)) {
      return res.status(400).json({
        message: "Invalid pilgrimage center ID format.",
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

    // Validate and resolve coordinates
    const coordCheck = resolveCoordinates(
      center.location?.latitude,
      center.location?.longitude,
      center.name
    );

    if (!coordCheck.valid) {
      return res.status(400).json({
        message: `Weather information is unavailable for ${center.name}. Valid geographic coordinates are missing.`,
        errorType: "MISSING_COORDINATES",
        details: coordCheck.error,
      });
    }

    const { latitude, longitude, resolvedFromKnown } = coordCheck;

    // Persist resolved coordinates back to center if previously missing
    if (resolvedFromKnown && (!center.location?.latitude || !center.location?.longitude)) {
      PilgrimageCenter.updateOne(
        { _id: center._id },
        {
          $set: {
            "location.latitude": latitude,
            "location.longitude": longitude,
          },
        }
      ).catch(() => {});
    }

    // Fetch weather data through multi-provider architecture
    const weatherData = await fetchWeatherData(
      center._id.toString(),
      latitude,
      longitude,
      center.name,
      forceRefresh
    );

    let isForecastAvailable = true;
    let forecastNotice = "";
    let selectedDateWeather = null;
    let parsedTargetDateStr = null;

    if (date) {
      const parseValidDate = (dVal) => {
        if (!dVal || dVal === "undefined" || dVal === "null") return null;
        const parsed = new Date(dVal);
        return isNaN(parsed.getTime()) ? null : parsed;
      };

      const targetDate = parseValidDate(date);

      if (targetDate) {
        parsedTargetDateStr = targetDate.toISOString().split("T")[0];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);

        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          isForecastAvailable = false;
          forecastNotice = "Selected journey date is in the past. Current live meteorological data is displayed for reference.";
        } else if (diffDays > 16) {
          isForecastAvailable = false;
          forecastNotice = `Weather forecast for this journey date is not yet available. Accurate forecasts are supported up to 16 days in advance (${diffDays} days away). Current live meteorological data is displayed for reference.`;
        } else {
          const match = weatherData.forecast
            ? weatherData.forecast.find((f) => f.date === parsedTargetDateStr)
            : null;

          if (match) {
            selectedDateWeather = match;
            isForecastAvailable = true;
          } else {
            isForecastAvailable = false;
            forecastNotice = "Weather forecast for this specific date is currently unavailable. Current live meteorological data is displayed for reference.";
          }
        }
      }
    }

    return res.status(200).json({
      centerId: center._id,
      centerName: center.name,
      targetDate: parsedTargetDateStr,
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
