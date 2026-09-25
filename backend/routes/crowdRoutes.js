const express = require("express");
const router = express.Router();
const { getCrowdPrediction, getCrowdPredictionInfo } = require("../controllers/crowdController");

/**
 * @route   POST /api/crowd/predict
 * @desc    Predict crowd count and risk level for a pilgrimage center on a given date
 * @access  Public
 */
router.post("/predict", getCrowdPrediction);

/**
 * @route   GET /api/crowd/predict & GET /api/crowd
 * @desc    API instructions when accessed via GET in browser
 * @access  Public
 */
router.get("/predict", getCrowdPredictionInfo);
router.get("/", getCrowdPredictionInfo);

module.exports = router;
