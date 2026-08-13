const express = require("express");
const router = express.Router();
const {
  getCenters,
  getCenterById,
  createCenter,
  updateCenter,
  deleteCenter,
  updateCenterStatus,
} = require("../controllers/pilgrimageCenterController");
const { protect, admin } = require("../middleware/authMiddleware");

// Optional protect middleware for GET requests so admins sending Bearer token can view inactive items
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    return protect(req, res, next);
  }
  next();
};

router.route("/")
  .get(optionalAuth, getCenters)
  .post(protect, admin, createCenter);

router.route("/:id")
  .get(getCenterById)
  .put(protect, admin, updateCenter)
  .delete(protect, admin, deleteCenter);

router.patch("/:id/status", protect, admin, updateCenterStatus);

module.exports = router;
