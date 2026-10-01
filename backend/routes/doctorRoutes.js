const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getPhysicianReviews,
  getPhysicianReviewById,
  getPilgrimConsultations,
  submitPhysicianDecision,
  acknowledgeEmergencyAlert,
  getMyConsultationRecords,
} = require("../controllers/physicianReviewController");

// /api/doctor endpoints mapping to requirement #20
router.get("/my-consultations", protect, getMyConsultationRecords);
router.get("/pilgrims", protect, getPhysicianReviews);
router.get("/pilgrims/:id", protect, getPhysicianReviewById);
router.get("/pilgrims/:id/consultations", protect, getPilgrimConsultations);
router.post("/consultations", protect, submitPhysicianDecision);
router.get("/alerts", protect, getPhysicianReviews);
router.post("/alerts/:id/acknowledge", protect, acknowledgeEmergencyAlert);

module.exports = router;

