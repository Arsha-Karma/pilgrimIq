const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getPhysicianReviews,
  getPhysicianReviewById,
  submitPhysicianDecision,
} = require("../controllers/physicianReviewController");

router.get("/", protect, getPhysicianReviews);
router.get("/:id", protect, getPhysicianReviewById);
router.put("/:id", protect, submitPhysicianDecision);

module.exports = router;
