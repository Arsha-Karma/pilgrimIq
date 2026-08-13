const { getNearbyServices } = require("../services/nearbyPlacesService");

// @desc    Get nearby services (accommodation, restaurants, hospitals, etc.) by coordinates and category
// @route   GET /api/nearby-services
// @access  Public / Authenticated
const getNearbyPlaces = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 5, category = "accommodation" } = req.query;

    if (!latitude || !longitude) {
      res.status(400);
      throw new Error("Latitude and longitude query parameters are required");
    }

    const places = await getNearbyServices(latitude, longitude, radius, category);

    res.status(200).json({
      success: true,
      category,
      radiusKm: parseFloat(radius),
      centerCoordinates: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
      count: places.length,
      places,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Expand shortened Google Maps URL and extract coordinates (Latitude & Longitude)
// @route   GET /api/nearby-services/expand-url
// @access  Public / Authenticated
const expandGoogleMapsUrl = async (req, res, next) => {
  try {
    const { url } = req.query;
    if (!url) {
      res.status(400);
      throw new Error("URL query parameter is required");
    }

    let finalUrl = url;
    try {
      const response = await fetch(url, { method: "GET", redirect: "follow" });
      if (response && response.url) {
        finalUrl = response.url;
      }
    } catch (e) {
      console.warn("Failed to expand URL via fetch:", e.message);
    }

    let latitude = null;
    let longitude = null;

    const dMatch = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (dMatch && dMatch[1] && dMatch[2]) {
      latitude = dMatch[1];
      longitude = dMatch[2];
    } else {
      const atMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atMatch && atMatch[1] && atMatch[2]) {
        latitude = atMatch[1];
        longitude = atMatch[2];
      } else {
        const qMatch = finalUrl.match(/[?&](?:q|ll|query)=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (qMatch && qMatch[1] && qMatch[2]) {
          latitude = qMatch[1];
          longitude = qMatch[2];
        }
      }
    }

    res.status(200).json({
      success: true,
      originalUrl: url,
      finalUrl,
      latitude,
      longitude,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNearbyPlaces,
  expandGoogleMapsUrl,
};
