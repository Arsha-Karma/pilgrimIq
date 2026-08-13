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
} = require("../controllers/medicalReportController");

router.post("/upload", protect, uploadAndAnalyzeReport);
router.get("/my-reports", protect, getMyReports);
router.get("/family/:familyMemberId", protect, getFamilyMemberReports);
router.get("/:id", protect, getReportById);
router.post("/:id/analyze", protect, analyzeReport);
router.post("/:id/send-for-review", protect, sendReportForReview);

module.exports = router;
