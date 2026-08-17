const { getNearbyServices } = require("../services/nearbyPlacesService");

// @desc    Get nearby services (accommodation, restaurants, hospitals, etc.) by coordinates and category
// @route   GET /api/nearby-services
// @access  Public / Authenticated
const getNearbyPlaces = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 5, category = "accommodation", dietaryPreference } = req.query;

    if (!latitude || !longitude) {
      res.status(400);
      throw new Error("Latitude and longitude query parameters are required");
    }

    const places = await getNearbyServices(latitude, longitude, radius, category, dietaryPreference);

    res.status(200).json({
      success: true,
      category,
      radiusKm: parseFloat(radius),
      dietaryPreference: dietaryPreference || "No preference",
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
    const { url, name, city, state, country } = req.query;
    if (!url) {
      res.status(400);
      throw new Error("URL query parameter is required");
    }

    let finalUrl = url;
    let htmlText = "";

    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      if (response) {
        if (response.url) finalUrl = response.url;
        htmlText = await response.text();

        // Check for meta refresh or canonical/og:url in HTML text
        const metaRefreshMatch = htmlText.match(/content=["']\d+;\s*url=['"]?([^"'>\s]+)/i);
        if (metaRefreshMatch && metaRefreshMatch[1]) {
          finalUrl = metaRefreshMatch[1];
        } else {
          const ogUrlMatch = htmlText.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i) ||
                             htmlText.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:url["']/i);
          if (ogUrlMatch && ogUrlMatch[1]) {
            finalUrl = ogUrlMatch[1];
          }
        }
      }
    } catch (e) {
      console.warn("Failed to expand URL via fetch:", e.message);
    }

    let latitude = null;
    let longitude = null;

    // Helper regex coordinate search in any text string
    const findCoordsInText = (str) => {
      if (!str) return null;
      const dMatch = str.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      if (dMatch && dMatch[1] && dMatch[2]) return { lat: dMatch[1], lng: dMatch[2] };

      const atMatch = str.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atMatch && atMatch[1] && atMatch[2]) return { lat: atMatch[1], lng: atMatch[2] };

      const qMatch = str.match(/[?&](?:q|ll|query|center)=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (qMatch && qMatch[1] && qMatch[2]) return { lat: qMatch[1], lng: qMatch[2] };

      const initStateMatch = str.match(/\[null,null,(-?\d{1,2}\.\d{4,}),(-?\d{1,3}\.\d{4,})\]/) ||
                             str.match(/\[\[\[(-?\d{1,2}\.\d{4,}),(-?\d{1,3}\.\d{4,})\]/);
      if (initStateMatch && initStateMatch[1] && initStateMatch[2]) return { lat: initStateMatch[1], lng: initStateMatch[2] };

      const rawMatch = str.match(/(-?\d{1,2}\.\d{4,})[,\s]+(-?\d{1,3}\.\d{4,})/);
      if (rawMatch && rawMatch[1] && rawMatch[2]) return { lat: rawMatch[1], lng: rawMatch[2] };

      return null;
    };

    // 1. Search in finalUrl
    let found = findCoordsInText(finalUrl);
    // 2. Search in htmlText
    if (!found) found = findCoordsInText(htmlText);

    if (found) {
      latitude = found.lat;
      longitude = found.lng;
    }

    // 3. Fallback: OpenStreetMap Geocoding from place text in URL or form metadata (name, city, state, country)
    if (!latitude || !longitude) {
      try {
        let searchQuery = "";
        const placeMatch = finalUrl.match(/\/place\/([^/@?]+)/) || htmlText.match(/\/place\/([^/@?]+)/);
        if (placeMatch && placeMatch[1]) {
          searchQuery = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
        } else {
          searchQuery = [name, city, state, country].filter(s => s && String(s).trim().length > 0).join(", ");
        }

        if (searchQuery) {
          const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`;
          const geoRes = await fetch(geoUrl, {
            headers: { "User-Agent": "PilgrimIQ/1.0 (https://pilgrimlq.com)" },
          });
          const geoData = await geoRes.json();
          if (geoData && geoData[0] && geoData[0].lat && geoData[0].lon) {
            latitude = geoData[0].lat;
            longitude = geoData[0].lon;
          }
        }
      } catch (geoErr) {
        console.warn("Geocoding fallback failed:", geoErr.message);
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
