const express = require("express");
const router = express.Router();
const {
  createJourney,
  getJourneys,
  getMyJourneys,
  getJourneyById,
  updateJourney,
  deleteJourney,
  acceptResponsibility,
  startJourney,
  getActiveJourney,
  updateJourneyLocation,
  updateJourneyStatus,
  getJourneyProgress,
  completeJourney,
} = require("../controllers/journeyController");
const { protect } = require("../middleware/authMiddleware");

// All journey endpoints require JWT authentication
router.use(protect);

router.post("/accept-responsibility", acceptResponsibility);
router.post("/start", startJourney);
router.get("/active", getActiveJourney);
router.route("/user/my-journeys").get(getMyJourneys);

router.patch("/:id/location", updateJourneyLocation);
router.patch("/:id/status", updateJourneyStatus);
router.get("/:id/progress", getJourneyProgress);
router.post("/:id/complete", completeJourney);

router.route("/")
  .post(createJourney)
  .get(getJourneys);

router.route("/:id")
  .get(getJourneyById)
  .put(updateJourney)
  .delete(deleteJourney);

module.exports = router;
