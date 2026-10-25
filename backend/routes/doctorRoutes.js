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
  updateDoctorAvailability,
  getAvailableDoctors,
} = require("../controllers/physicianReviewController");

// Doctor availability endpoints
router.get("/available", getAvailableDoctors);
router.patch("/availability", protect, updateDoctorAvailability);
router.put("/availability", protect, updateDoctorAvailability);

// /api/doctor endpoints mapping to requirement #20
router.get("/my-consultations", protect, getMyConsultationRecords);
router.get("/pilgrims", protect, getPhysicianReviews);
router.get("/pilgrims/:id", protect, getPhysicianReviewById);
router.get("/pilgrims/:id/consultations", protect, getPilgrimConsultations);
router.post("/consultations", protect, submitPhysicianDecision);
router.get("/alerts", protect, getPhysicianReviews);
router.post("/alerts/:id/acknowledge", protect, acknowledgeEmergencyAlert);

module.exports = router;

