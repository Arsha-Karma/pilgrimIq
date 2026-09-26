const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getTravelAssessmentPsi } = require("../controllers/travelAssessmentController");

// All travel assessment endpoints require authentication
router.use(protect);

// POST /api/travel-assessment/psi
router.post("/psi", getTravelAssessmentPsi);

// GET /api/travel-assessment/psi/:journeyId
router.get("/psi/:journeyId", getTravelAssessmentPsi);

module.exports = router;
