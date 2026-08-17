const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  uploadAndAnalyzeReport,
  getMyReports,
  getReportById,
  getFamilyMemberReports,
  analyzeReport,
  sendReportForReview,
  deleteMedicalReport,
  updateMedicalReport,
  getAllReports,
} = require("../controllers/medicalReportController");

router.post("/upload", protect, uploadAndAnalyzeReport);
router.get("/all", protect, getAllReports);
router.get("/my-reports", protect, getMyReports);
router.get("/family/:familyMemberId", protect, getFamilyMemberReports);
router.get("/:id", protect, getReportById);
router.put("/:id", protect, updateMedicalReport);
router.delete("/:id", protect, deleteMedicalReport);
router.post("/:id/analyze", protect, analyzeReport);
router.post("/:id/send-for-review", protect, sendReportForReview);

module.exports = router;
