const express = require("express");
const router = express.Router();
const {
  createEnquiry,
  getEnquiries,
  updateEnquiryStatus,
  replyToEnquiry,
} = require("../controllers/enquiryController");

router.post("/", createEnquiry);
router.get("/", getEnquiries);
router.put("/:id/status", updateEnquiryStatus);
router.post("/:id/reply", replyToEnquiry);

module.exports = router;
