const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const {
  getBaseCamps,
  getBaseCampById,
  createBaseCamp,
  updateBaseCamp,
  updateBaseCampStatus,
  deleteBaseCamp,
} = require("../controllers/baseCampController");

router.get("/", getBaseCamps);
router.get("/:id", getBaseCampById);

// Admin-only protected routes
router.post("/", protect, admin, createBaseCamp);
router.put("/:id", protect, admin, updateBaseCamp);
router.patch("/:id/status", protect, admin, updateBaseCampStatus);
router.delete("/:id", protect, admin, deleteBaseCamp);

module.exports = router;
