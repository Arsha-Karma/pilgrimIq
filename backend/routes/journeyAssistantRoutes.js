const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  sendMessage,
  getJourneyContext,
  getConversationHistory,
  clearConversationHistory,
} = require("../controllers/journeyAssistantController");

router.post("/chat", protect, sendMessage);
router.get("/context", protect, getJourneyContext);
router.get("/history", protect, getConversationHistory);
router.delete("/history", protect, clearConversationHistory);

module.exports = router;
