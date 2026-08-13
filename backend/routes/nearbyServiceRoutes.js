const express = require("express");
const router = express.Router();
const { getNearbyPlaces, expandGoogleMapsUrl } = require("../controllers/nearbyServiceController");

router.get("/", getNearbyPlaces);
router.get("/expand-url", expandGoogleMapsUrl);

module.exports = router;
