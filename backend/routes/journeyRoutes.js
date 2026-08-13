const express = require("express");
const router = express.Router();
const {
  createJourney,
  getJourneys,
  getMyJourneys,
  getJourneyById,
  updateJourney,
  deleteJourney,
} = require("../controllers/journeyController");
const { protect } = require("../middleware/authMiddleware");

// All journey endpoints require JWT authentication
router.use(protect);

router.route("/user/my-journeys").get(getMyJourneys);

router.route("/")
  .post(createJourney)
  .get(getJourneys);

router.route("/:id")
  .get(getJourneyById)
  .put(updateJourney)
  .delete(deleteJourney);

module.exports = router;
