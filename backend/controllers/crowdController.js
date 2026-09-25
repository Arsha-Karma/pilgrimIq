const { predictCrowd } = require("../services/mlService");

/**
 * Validates whether a date string is in YYYY-MM-DD format and is a valid calendar date.
 * @param {string} dateString
 * @returns {boolean}
 */
const isValidDateString = (dateString) => {
  if (typeof dateString !== "string") return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

/**
 * Dynamic fallback prediction when ML API is unavailable, timing out, or missing data for a specific center.
 */
const calculateFallbackCrowd = (centerName, dateStr, isFestival = 0, festivalName = "") => {
  const d = new Date(dateStr);
  const dayOfWeek = d.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  let hash = 0;
  for (let i = 0; i < centerName.length; i++) {
    hash = (hash << 5) - hash + centerName.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash) % 25000;
  let baseVisitors = 28000 + seed;

  if (isWeekend) {
    baseVisitors = Math.round(baseVisitors * 1.35);
  }

  if (isFestival === 1) {
    baseVisitors = Math.round(baseVisitors * 1.75);
  }

  let crowdLevel = "Moderate";
  let capacityPct = 55;
  let waitTime = "30 - 45 mins";

  if (baseVisitors > 65000) {
    crowdLevel = "Very High";
    capacityPct = 92;
    waitTime = "90 - 120 mins";
  } else if (baseVisitors > 40000) {
    crowdLevel = "High";
    capacityPct = 78;
    waitTime = "60 - 90 mins";
  } else if (baseVisitors > 22000) {
    crowdLevel = "Moderate";
    capacityPct = 55;
    waitTime = "30 - 45 mins";
  } else {
    crowdLevel = "Low";
    capacityPct = 32;
    waitTime = "15 - 20 mins";
  }

  return {
    pilgrimage_center: centerName,
    prediction_date: dateStr,
    predicted_visitors: baseVisitors,
    predicted_crowd: baseVisitors,
    crowd_level: crowdLevel,
    crowd_category: crowdLevel,
    capacity_utilization_percent: capacityPct,
    estimated_wait_time: waitTime,
    is_festival: isFestival === 1,
    festival_name: festivalName,
    is_fallback: true
  };
};

/**
 * @desc    Predict crowd for a pilgrimage center on a specific date
 * @route   POST /api/crowd/predict
 * @access  Public
 */
const getCrowdPrediction = async (req, res) => {
  try {
    const { pilgrimage_center, prediction_date, festival_name, is_festival } = req.body || {};

    // Validate pilgrimage_center
    if (!pilgrimage_center || typeof pilgrimage_center !== "string" || !pilgrimage_center.trim()) {
      return res.status(400).json({
        success: false,
        message: "Failed to predict crowd",
        error: "pilgrimage_center is required and must be a non-empty string.",
      });
    }

    // Validate prediction_date
    if (!prediction_date || !isValidDateString(prediction_date)) {
      return res.status(400).json({
        success: false,
        message: "Failed to predict crowd",
        error: "prediction_date is required and must be a valid date in YYYY-MM-DD format.",
      });
    }

    // Validate and format optional parameters
    const formattedFestivalName = festival_name && typeof festival_name === "string" ? festival_name.trim() : "";
    let formattedIsFestival = 0;
    if (is_festival === 1 || is_festival === "1" || is_festival === true) {
      formattedIsFestival = 1;
    } else if (is_festival !== undefined && is_festival !== 0 && is_festival !== "0" && is_festival !== false) {
      return res.status(400).json({
        success: false,
        message: "Failed to predict crowd",
        error: "is_festival must be 0 or 1 (or boolean true/false).",
      });
    }

    const cleanCenterName = pilgrimage_center.trim();
    const cleanDateStr = prediction_date.trim();

    let predictionResult;
    try {
      predictionResult = await predictCrowd({
        pilgrimage_center: cleanCenterName,
        prediction_date: cleanDateStr,
        festival_name: formattedFestivalName,
        is_festival: formattedIsFestival,
      });
    } catch (mlErr) {
      console.warn("ML API call failed or timed out. Falling back to dynamic estimation:", mlErr.message);
      predictionResult = calculateFallbackCrowd(
        cleanCenterName,
        cleanDateStr,
        formattedIsFestival,
        formattedFestivalName
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        pilgrimage_center: predictionResult.pilgrimage_center || cleanCenterName,
        prediction_date: predictionResult.prediction_date || cleanDateStr,
        predicted_visitors: predictionResult.predicted_visitors || predictionResult.predicted_crowd || 25000,
        predicted_crowd: predictionResult.predicted_visitors || predictionResult.predicted_crowd || 25000,
        crowd_level: predictionResult.crowd_level || predictionResult.crowd_category || "Moderate",
        crowd_category: predictionResult.crowd_category || predictionResult.crowd_level || "Moderate",
        capacity_utilization_percent: predictionResult.capacity_utilization_percent,
        estimated_wait_time: predictionResult.estimated_wait_time,
        is_festival: predictionResult.is_festival || formattedIsFestival === 1,
        festival_name: predictionResult.festival_name || formattedFestivalName,
        is_fallback: predictionResult.is_fallback || false,
      },
    });
  } catch (error) {
    console.error("Error in getCrowdPrediction controller:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to predict crowd",
      error: error.message || "An unexpected error occurred while predicting crowd level.",
    });
  }
};

/**
 * @desc    Info handler for GET /api/crowd/predict in browser
 * @route   GET /api/crowd/predict
 * @access  Public
 */
const getCrowdPredictionInfo = (req, res) => {
  res.status(200).json({
    success: true,
    message: "PilgrimIQ Crowd Prediction API is active.",
    instruction: "Please send a POST request to this endpoint with a JSON body.",
    example_request: {
      method: "POST",
      url: "/api/crowd/predict",
      headers: {
        "Content-Type": "application/json"
      },
      body: {
        pilgrimage_center: "TTD, Tirupati",
        prediction_date: "2026-09-20",
        festival_name: "",
        is_festival: 0
      }
    }
  });
};

module.exports = {
  getCrowdPrediction,
  getCrowdPredictionInfo,
};
