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

router.get("/my-consultations", protect, getMyConsultationRecords);
router.get("/", protect, getPhysicianReviews);
router.get("/:id", protect, getPhysicianReviewById);
router.get("/:id/consultations", protect, getPilgrimConsultations);
router.put("/:id", protect, submitPhysicianDecision);
router.post("/consultations", protect, submitPhysicianDecision);
router.post("/alerts/:id/acknowledge", protect, acknowledgeEmergencyAlert);

module.exports = router;


