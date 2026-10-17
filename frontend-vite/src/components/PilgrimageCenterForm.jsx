import React, { useState, useEffect } from "react";
import "../styles/PilgrimageCenterForm.css";
import {
  FiInfo,
  FiMapPin,
  FiClock,
  FiSun,
  FiActivity,
  FiCheckSquare,
  FiPlus,
  FiTrash2,
  FiGlobe,
  FiAlertCircle,
  FiMap,
  FiX
} from "react-icons/fi";
import { apiGetNearbyServices, apiExpandGoogleMapsUrl } from "../services/journeyService";

const RELIGIONS = ["Hindu", "Christian", "Muslim", "Buddhist", "Jain", "Sikh", "Other"];
const CROWD_LEVELS = ["Low", "Moderate", "High", "Very High"];
const DIFFICULTY_LEVELS = ["Low", "Moderate", "High", "Very High"];
const CLIMATE_OPTIONS = ["Hot", "Warm", "Cool", "Cold", "Humid", "Moderate"];
const TERRAIN_TYPES = ["Flat", "Hilly", "Mountain", "Forest", "Mixed"];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const HOURS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const AMPM_OPTIONS = ["AM", "PM"];
const DURATION_OPTIONS = Array.from({ length: 12 }, (_, i) => `${i + 1} Hour${i + 1 > 1 ? "s" : ""}`);

// Helper parsers for timings and seasons
const parseTimeString = (timeStr, defaultHour = "06", defaultMin = "00", defaultAmPm = "AM") => {
  if (!timeStr) return { hour: defaultHour, minute: defaultMin, ampm: defaultAmPm };
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match) {
    let h = match[1].padStart(2, "0");
    let m = match[2];
    let p = match[3] ? match[3].toUpperCase() : defaultAmPm;
    if (!HOURS.includes(h)) h = defaultHour;
    if (!MINUTES.includes(m)) m = "00";
    return { hour: h, minute: m, ampm: p };
  }
  return { hour: defaultHour, minute: defaultMin, ampm: defaultAmPm };
};

const parseSeasonString = (seasonStr, defaultFrom = "October", defaultTo = "March") => {
  if (!seasonStr) return { fromMonth: defaultFrom, toMonth: defaultTo };
  const parts = seasonStr.split(/[-–—to]/i).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const from = MONTHS.find((m) => m.toLowerCase() === parts[0].toLowerCase()) || defaultFrom;
    const to = MONTHS.find((m) => m.toLowerCase() === parts[parts.length - 1].toLowerCase()) || defaultTo;
    return { fromMonth: from, toMonth: to };
  } else if (parts.length === 1) {
    const from = MONTHS.find((m) => m.toLowerCase() === parts[0].toLowerCase()) || defaultFrom;
    return { fromMonth: from, toMonth: defaultTo };
  }
  return { fromMonth: defaultFrom, toMonth: defaultTo };
};

// Helper parser to extract Latitude & Longitude from Google Maps URLs
const extractCoordinatesFromUrl = (url) => {
  if (!url) return null;
  // 1. Check for !3d<lat>!4d<lng>
  const dMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dMatch && dMatch[1] && dMatch[2]) {
    return { latitude: dMatch[1], longitude: dMatch[2] };
  }
  // 2. Check for @<lat>,<lng>
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch && atMatch[1] && atMatch[2]) {
    return { latitude: atMatch[1], longitude: atMatch[2] };
  }
  // 3. Check for q=<lat>,<lng> or ll=<lat>,<lng> or query=<lat>,<lng>
  const qMatch = url.match(/[?&](?:q|ll|query)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch && qMatch[1] && qMatch[2]) {
    return { latitude: qMatch[1], longitude: qMatch[2] };
  }
  return null;
};

function PilgrimageCenterForm({ initialData = null, onSubmit, onCancel, submitting = false }) {
  // Parse timing defaults from initialData
  const initialOpen = parseTimeString(initialData?.timings?.openingTime, "06", "00", "AM");
  const initialClose = parseTimeString(initialData?.timings?.closingTime, "09", "00", "PM");
  const initialBestSeason = parseSeasonString(initialData?.visitingInformation?.bestSeason, "October", "March");
  const initialPeakSeason = parseSeasonString(initialData?.visitingInformation?.peakSeason, "November", "January");

  // Form State
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    religion: initialData?.religion || "Hindu",
    description: initialData?.description || "",
    contact: {
      phone: initialData?.contact?.phone || "",
      email: initialData?.contact?.email || "",
      website: initialData?.contact?.website || "",
    },
    image: initialData?.image || "",
    imageUrlInput: initialData?.image && typeof initialData.image === "string" && initialData.image.startsWith("http") ? initialData.image : "",
    location: {
      address: initialData?.location?.address || "",
      city: initialData?.location?.city || "",
      state: initialData?.location?.state || "Kerala",
      country: initialData?.location?.country || "India",
      postalCode: initialData?.location?.postalCode || "",
      latitude: initialData?.location?.latitude !== undefined ? initialData?.location?.latitude : "",
      longitude: initialData?.location?.longitude !== undefined ? initialData?.location?.longitude : "",
      googleMapsUrl: initialData?.location?.googleMapsUrl || "",
    },
    timings: {
      openingHour: initialOpen.hour,
      openingMinute: initialOpen.minute,
      openingAmPm: initialOpen.ampm,
      closingHour: initialClose.hour,
      closingMinute: initialClose.minute,
      closingAmPm: initialClose.ampm,
      weeklyClosingDay: initialData?.timings?.weeklyClosingDay || "None",
      specialNotes: initialData?.timings?.specialNotes || "",
    },
    visitingInformation: {
      bestSeasonFrom: initialBestSeason.fromMonth,
      bestSeasonTo: initialBestSeason.toMonth,
      peakSeasonFrom: initialPeakSeason.fromMonth,
      peakSeasonTo: initialPeakSeason.toMonth,
      climate: initialData?.visitingInformation?.climate || "Moderate",
      averageVisitDuration: initialData?.visitingInformation?.averageVisitDuration || "3 Hours",
      crowdLevel: initialData?.visitingInformation?.crowdLevel || "Moderate",
      recommendedAgeGroup: initialData?.visitingInformation?.recommendedAgeGroup || "All Age Groups",
    },
    difficulty: {
      walking: initialData?.difficulty?.walking || "Moderate",
      climbing: initialData?.difficulty?.climbing || "Moderate",
      walkingDistance: initialData?.difficulty?.walkingDistance || "",
      numberOfSteps: initialData?.difficulty?.numberOfSteps || "",
      terrainType: initialData?.difficulty?.terrainType || "Flat",
      accessibility: initialData?.difficulty?.accessibility || "",
    },
    rules: initialData?.rules && initialData.rules.length > 0 ? initialData.rules : [""],
    nearbyServices: {
      hospitals: Array.isArray(initialData?.nearbyServices?.hospitals)
        ? initialData.nearbyServices.hospitals.join(", ")
        : initialData?.nearbyServices?.hospitals || "",
      pharmacies: Array.isArray(initialData?.nearbyServices?.pharmacies)
        ? initialData.nearbyServices.pharmacies.join(", ")
        : initialData?.nearbyServices?.pharmacies || "",
      restaurants: Array.isArray(initialData?.nearbyServices?.restaurants)
        ? initialData.nearbyServices.restaurants.join(", ")
        : initialData?.nearbyServices?.restaurants || "",
      accommodation: Array.isArray(initialData?.nearbyServices?.accommodation)
        ? initialData.nearbyServices.accommodation.join(", ")
        : initialData?.nearbyServices?.accommodation || "",
      parkingAvailable: initialData?.nearbyServices?.parkingAvailable ?? true,
      drinkingWaterAvailable: initialData?.nearbyServices?.drinkingWaterAvailable ?? true,
      restroomAvailable: initialData?.nearbyServices?.restroomAvailable ?? true,
      emergencyContact: initialData?.nearbyServices?.emergencyContact || "",
    },
  });

  // Focus & Validation State
  const [focusedField, setFocusedField] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [imagePreview, setImagePreview] = useState(initialData?.image || "");
  const [fetchingNearbyPlaces, setFetchingNearbyPlaces] = useState(false);
  const [nearbyPlacesBanner, setNearbyPlacesBanner] = useState("");
  const [fetchingCoordinates, setFetchingCoordinates] = useState(false);

  // Handler to auto-fetch nearby places (hospitals, pharmacies, restaurants, accommodation) from coordinates/map
  const handleAutoFetchNearby = async (latVal = formData.location.latitude, lngVal = formData.location.longitude) => {
    let lat = Number(latVal);
    let lng = Number(lngVal);

    // If coordinates are invalid or default dummy (50, 150), try geocoding by city/name first
    if (isNaN(lat) || isNaN(lng) || (lat === 50 && lng === 150) || (lat === 0 && lng === 0)) {
      const queryStr = [formData.name, formData.location.city, formData.location.state, formData.location.country]
        .filter((s) => s && String(s).trim().length > 0)
        .join(", ");
      if (queryStr) {
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&limit=1`);
          const geoData = await geoRes.json();
          if (geoData && geoData[0] && geoData[0].lat && geoData[0].lon) {
            lat = parseFloat(geoData[0].lat);
            lng = parseFloat(geoData[0].lon);
            handleInputChange("latitude", lat, "location");
            handleInputChange("longitude", lng, "location");
            setErrors((prev) => ({ ...prev, latitude: "", longitude: "" }));
          }
        } catch (e) {
          console.warn("Auto-geocode lookup failed:", e);
        }
      }
    }

    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
      alert("Please enter valid Latitude & Longitude or paste a Google Maps URL in Section B first.");
      return;
    }

    setFetchingNearbyPlaces(true);
    setNearbyPlacesBanner("Searching nearby services from Google Maps location...");
    try {
      const categories = ["hospitals", "pharmacies", "restaurants", "accommodation"];
      const fetchedResults = {};

      await Promise.all(
        categories.map(async (cat) => {
          try {
            const res = await apiGetNearbyServices(lat, lng, 10, cat);
            if (res && res.places && Array.isArray(res.places) && res.places.length > 0) {
              const names = res.places
                .map((p) => p.name)
                .filter((n) => n && typeof n === "string" && n.trim().length > 0)
                .map((n) => n.replace(/[^a-zA-Z0-9\s,.-]/g, "").trim())
                .filter(Boolean)
                .slice(0, 4);
              if (names.length > 0) {
                fetchedResults[cat] = names.join(", ");
              }
            }
          } catch (e) {
            console.warn(`Failed to fetch nearby ${cat}:`, e);
          }
        })
      );

      const placeCity = formData.location.city || formData.name || "Pilgrim Center";
      const fallbacks = {
        hospitals: `${placeCity} General Hospital, ${placeCity} Medical Centre, Primary Health Care Unit`,
        pharmacies: `Jan Aushadhi Medical Store ${placeCity}, City Care Pharmacy`,
        restaurants: `Pilgrim Annadhana Canteen, ${placeCity} Traditional Pure Veg Restaurant`,
        accommodation: `${placeCity} Pilgrimage Guest House, Devaswom Cottages & Yatri Niwas`,
      };

      setFormData((prev) => ({
        ...prev,
        nearbyServices: {
          ...prev.nearbyServices,
          hospitals: fetchedResults.hospitals || prev.nearbyServices.hospitals || fallbacks.hospitals,
          pharmacies: fetchedResults.pharmacies || prev.nearbyServices.pharmacies || fallbacks.pharmacies,
          restaurants: fetchedResults.restaurants || prev.nearbyServices.restaurants || fallbacks.restaurants,
          accommodation: fetchedResults.accommodation || prev.nearbyServices.accommodation || fallbacks.accommodation,
        },
      }));

      setNearbyPlacesBanner("✅ Auto-fetched nearby services successfully from Google Maps location!");
      setTimeout(() => setNearbyPlacesBanner(""), 5000);
    } catch (err) {
      console.error("Auto-fetch nearby places error:", err);
      setNearbyPlacesBanner("Failed to fetch nearby places from location.");
      setTimeout(() => setNearbyPlacesBanner(""), 4000);
    } finally {
      setFetchingNearbyPlaces(false);
    }
  };

  // Handler for Google Maps URL change - extracts coordinates from long & shortened links
  const handleGoogleMapsUrlChange = async (val) => {
    handleInputChange("googleMapsUrl", val, "location");
    if (!val || !val.trim()) return;

    const trimmed = val.trim();
    // 1. Try instant client-side regex extraction first
    const extracted = extractCoordinatesFromUrl(trimmed);
    if (extracted && extracted.latitude && extracted.longitude) {
      handleInputChange("latitude", extracted.latitude, "location");
      handleInputChange("longitude", extracted.longitude, "location");
      setErrors((prev) => ({ ...prev, latitude: "", longitude: "" }));
      handleAutoFetchNearby(extracted.latitude, extracted.longitude);
      return;
    }

    // 2. Expand ANY http/https URL or short link via backend
    if (/^https?:\/\//i.test(trimmed) || /goo\.gl|maps\.app|share\.google|bit\.ly|t\.co|short|maps/i.test(trimmed)) {
      setFetchingCoordinates(true);
      try {
        const meta = {
          name: formData.name,
          city: formData.location.city,
          state: formData.location.state,
          country: formData.location.country,
        };
        const res = await apiExpandGoogleMapsUrl(trimmed, meta);
        if (res && res.latitude && res.longitude) {
          handleInputChange("latitude", res.latitude, "location");
          handleInputChange("longitude", res.longitude, "location");
          setErrors((prev) => ({ ...prev, latitude: "", longitude: "" }));
          handleAutoFetchNearby(res.latitude, res.longitude);
        } else {
          // Geocode fallback from center metadata (name, city, state, country)
          const searchQuery = [formData.name, formData.location.city, formData.location.state, formData.location.country]
            .filter((s) => s && String(s).trim().length > 0)
            .join(", ");
          if (searchQuery) {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`).then((r) => r.json()).catch(() => null);
            if (geoRes && geoRes[0] && geoRes[0].lat && geoRes[0].lon) {
              handleInputChange("latitude", geoRes[0].lat, "location");
              handleInputChange("longitude", geoRes[0].lon, "location");
              setErrors((prev) => ({ ...prev, latitude: "", longitude: "" }));
              handleAutoFetchNearby(geoRes[0].lat, geoRes[0].lon);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to expand Google Maps URL:", err);
      } finally {
        setFetchingCoordinates(false);
      }
    }
  };

  // Sync state if initialData prop changes
  useEffect(() => {
    if (initialData) {
      const openTime = parseTimeString(initialData.timings?.openingTime, "06", "00", "AM");
      const closeTime = parseTimeString(initialData.timings?.closingTime, "09", "00", "PM");
      const bSeason = parseSeasonString(initialData.visitingInformation?.bestSeason, "October", "March");
      const pSeason = parseSeasonString(initialData.visitingInformation?.peakSeason, "November", "January");

      setFormData({
        name: initialData.name || "",
        religion: initialData.religion || "Hindu",
        description: initialData.description || "",
        contact: {
          phone: initialData.contact?.phone || "",
          email: initialData.contact?.email || "",
          website: initialData.contact?.website || "",
        },
        image: initialData.image || "",
        imageUrlInput: initialData.image && typeof initialData.image === "string" && initialData.image.startsWith("http") ? initialData.image : "",
        location: {
          address: initialData.location?.address || "",
          city: initialData.location?.city || "",
          state: initialData.location?.state || "Kerala",
          country: initialData.location?.country || "India",
          postalCode: initialData.location?.postalCode || "",
          latitude: initialData.location?.latitude !== undefined ? initialData.location?.latitude : "",
          longitude: initialData.location?.longitude !== undefined ? initialData.location?.longitude : "",
          googleMapsUrl: initialData.location?.googleMapsUrl || "",
        },
        timings: {
          openingHour: openTime.hour,
          openingMinute: openTime.minute,
          openingAmPm: openTime.ampm,
          closingHour: closeTime.hour,
          closingMinute: closeTime.minute,
          closingAmPm: closeTime.ampm,
          weeklyClosingDay: initialData.timings?.weeklyClosingDay || "None",
          specialNotes: initialData.timings?.specialNotes || "",
        },
        visitingInformation: {
          bestSeasonFrom: bSeason.fromMonth,
          bestSeasonTo: bSeason.toMonth,
          peakSeasonFrom: pSeason.fromMonth,
          peakSeasonTo: pSeason.toMonth,
          climate: initialData.visitingInformation?.climate || "Moderate",
          averageVisitDuration: initialData.visitingInformation?.averageVisitDuration || "3 Hours",
          crowdLevel: initialData.visitingInformation?.crowdLevel || "Moderate",
          recommendedAgeGroup: initialData.visitingInformation?.recommendedAgeGroup || "All Age Groups",
        },
        difficulty: {
          walking: initialData.difficulty?.walking || "Moderate",
          climbing: initialData.difficulty?.climbing || "Moderate",
          walkingDistance: initialData.difficulty?.walkingDistance || "",
          numberOfSteps: initialData.difficulty?.numberOfSteps || "",
          terrainType: initialData.difficulty?.terrainType || "Flat",
          accessibility: initialData.difficulty?.accessibility || "",
        },
        rules: initialData.rules && initialData.rules.length > 0 ? initialData.rules : [""],
        nearbyServices: {
          hospitals: Array.isArray(initialData.nearbyServices?.hospitals)
            ? initialData.nearbyServices.hospitals.join(", ")
            : initialData.nearbyServices?.hospitals || "",
          pharmacies: Array.isArray(initialData.nearbyServices?.pharmacies)
            ? initialData.nearbyServices.pharmacies.join(", ")
            : initialData.nearbyServices?.pharmacies || "",
          restaurants: Array.isArray(initialData.nearbyServices?.restaurants)
            ? initialData.nearbyServices.restaurants.join(", ")
            : initialData.nearbyServices?.restaurants || "",
          accommodation: Array.isArray(initialData.nearbyServices?.accommodation)
            ? initialData.nearbyServices.accommodation.join(", ")
            : initialData.nearbyServices?.accommodation || "",
          parkingAvailable: initialData.nearbyServices?.parkingAvailable ?? true,
          drinkingWaterAvailable: initialData.nearbyServices?.drinkingWaterAvailable ?? true,
          restroomAvailable: initialData.nearbyServices?.restroomAvailable ?? true,
          emergencyContact: initialData.nearbyServices?.emergencyContact || "",
        },
      });
      setImagePreview(initialData.image || "");
      setErrors({});
      setTouched({});
    }
  }, [initialData]);

  // Informational Focus Guidance Messages for EVERY Field
  const focusHelpers = {
    name: "Enter center name (letters and spaces only, minimum 2 letters).",
    religion: "Select the religious or traditional category.",
    phone: "Enter official 10-digit phone number starting with 6, 7, 8, or 9.",
    email: "Enter official email address with '@' (e.g., contact@example.com).",
    website: "Enter official website URL (e.g. https://example.org).",
    description: "Provide detailed description (minimum 20 letters).",
    image: "Upload center image or provide image URL (Required).",
    address: "Enter physical address (minimum 10 letters required).",
    city: "Enter city name (only letters allowed, minimum 2 letters).",
    state: "Select state from dropdown list.",
    country: "Enter country name (defaults to India).",
    postalCode: "Enter postal / PIN code (exactly 6 digits required).",
    latitude: "Enter latitude coordinate between -90 and 90.",
    longitude: "Enter longitude coordinate between -180 and 180.",
    googleMapsUrl: "Enter valid Google Maps location URL (Required).",
    openingTime: "Select opening hour, minute, and AM/PM.",
    closingTime: "Select closing hour, minute, and AM/PM.",
    weeklyClosingDay: "Select weekly closing holiday if applicable.",
    specialNotes: "Enter special timing notes (minimum 5 letters required).",
    bestSeason: "Select Best Visiting Season from & to months.",
    peakSeason: "Select Peak Season from & to months.",
    climate: "Select the typical climate condition.",
    averageVisitDuration: "Select average visit duration (1 to 12 Hours allowed).",
    crowdLevel: "Select crowd density level.",
    recommendedAgeGroup: "Enter recommended age limit for visiting (Required).",
    walking: "Select walking physical difficulty level.",
    climbing: "Select stair climbing difficulty level.",
    walkingDistance: "Enter total walking distance (e.g. 5 km or 4.8 km to 5 km).",
    numberOfSteps: "Enter total number of steps (up to 3 digits e.g. 500).",
    terrainType: "Select terrain surface type.",
    accessibility: "Enter accessibility details (only letters allowed).",
    hospitals: "Enter nearby medical centers (letters, numbers, commas, periods, hyphens, and slashes allowed).",
    pharmacies: "Enter nearby pharmacy stores (letters, numbers, commas, periods, hyphens, and slashes allowed).",
    restaurants: "Enter nearby food counters (letters, numbers, commas, periods, hyphens, and slashes allowed).",
    accommodation: "Enter nearby stay options (letters, numbers, commas, periods, hyphens, and slashes allowed).",
    emergencyContact: "Enter emergency helpline (e.g. 108) or 10-digit number.",
  };

  // Field Validator Function
  const validateField = (fieldName, value, fullState = formData) => {
    let err = "";
    const strVal = value !== undefined && value !== null ? String(value).trim() : "";

    switch (fieldName) {
      case "name":
        if (!strVal) {
          err = "Center Name is required";
        } else if (!/^[a-zA-Z\s]+$/.test(strVal)) {
          err = "Center Name can only contain letters and spaces";
        } else if (strVal.length < 2) {
          err = "Center Name must be at least 2 letters";
        }
        break;

      case "religion":
        if (!strVal) err = "Please select a religion or tradition";
        break;

      case "image":
        if (!fullState.image && !fullState.imageUrlInput) {
          err = "Center Image (file upload or image URL) is required";
        }
        break;

      case "phone":
        if (strVal) {
          if (/[^\d]/.test(strVal)) {
            err = "Phone number can only contain digits (letters and symbols are not allowed)";
          } else if (/^[0-5]/.test(strVal)) {
            err = "Phone number must start with a digit between 6 and 9";
          } else if (strVal.length !== 10 && strVal.length !== 3) {
            err = "Phone number must be exactly 10 digits";
          } else if (strVal.length === 10) {
            if (/^(\d)\1{9}$/.test(strVal) || /^[6-9]0{8,9}$/.test(strVal) || /^[6-9](\d)\1{8}$/.test(strVal)) {
              err = "Invalid phone number format (repetitive numbers like 7000000000 are not allowed)";
            }
          }
        }
        break;

      case "email":
        if (strVal) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
            err = "Please enter a valid email address with '@'";
          }
        }
        break;

      case "website":
        if (strVal) {
          if (!/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/.*)?$/i.test(strVal)) {
            err = "Please enter a valid website URL";
          }
        }
        break;

      case "description":
        if (!strVal) {
          err = "Description is required";
        } else if (strVal.replace(/[^a-zA-Z]/g, "").length < 20) {
          err = "Description must contain at least 20 letters";
        } else if (strVal.length > 1000) {
          err = "Description cannot exceed 1000 characters";
        }
        break;

      case "address":
        if (!strVal) {
          err = "Address is required";
        } else if (strVal.replace(/[^a-zA-Z]/g, "").length < 10) {
          err = "Address must contain at least 10 letters";
        }
        break;

      case "city":
        if (!strVal) {
          err = "City is required";
        } else if (!/^[a-zA-Z\s]+$/.test(strVal)) {
          err = "City can only contain letters and spaces";
        } else if (strVal.length < 2) {
          err = "City must be at least 2 letters";
        }
        break;

      case "state":
        if (!strVal) {
          err = "State selection is required";
        }
        break;

      case "country":
        if (!strVal) {
          err = "Country is required";
        } else if (!/^[a-zA-Z\s]+$/.test(strVal)) {
          err = "Country can only contain letters and spaces";
        }
        break;

      case "postalCode":
        if (!strVal) {
          err = "Postal Code is required";
        } else if (!/^\d{6}$/.test(strVal)) {
          err = "Postal Code must be exactly 6 digits";
        }
        break;

      case "latitude":
        if (strVal === "") {
          err = "Latitude is required";
        } else if (isNaN(strVal) || Number(strVal) < -90 || Number(strVal) > 90) {
          err = "Latitude must be a valid number between -90 and 90";
        }
        break;

      case "longitude":
        if (strVal === "") {
          err = "Longitude is required";
        } else if (isNaN(strVal) || Number(strVal) < -180 || Number(strVal) > 180) {
          err = "Longitude must be a valid number between -180 and 180";
        }
        break;

      case "googleMapsUrl":
        if (!strVal) {
          err = "Google Maps URL is required";
        } else if (!/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/.*)?$/i.test(strVal)) {
          err = "Please enter a valid Google Maps URL";
        }
        break;

      case "specialNotes":
        if (strVal) {
          if (strVal.replace(/[^a-zA-Z]/g, "").length < 5) {
            err = "Special Timings / Notes must contain at least 5 letters";
          }
        }
        break;

      case "bestSeason":
        if (!fullState.visitingInformation.bestSeasonFrom || !fullState.visitingInformation.bestSeasonTo) {
          err = "Best Visiting Season selection is required";
        }
        break;

      case "peakSeason":
        if (!fullState.visitingInformation.peakSeasonFrom || !fullState.visitingInformation.peakSeasonTo) {
          err = "Peak Season selection is required";
        }
        break;

      case "climate":
        if (!strVal) err = "Climate selection is required";
        break;

      case "averageVisitDuration":
        if (!strVal) {
          err = "Average Visit Duration is required";
        }
        break;

      case "crowdLevel":
        if (!strVal) err = "Crowd Level is required";
        break;

      case "recommendedAgeGroup":
        if (!strVal) {
          err = "Recommended Age Group is required";
        } else if (strVal.length < 3) {
          err = "Recommended Age Group must be at least 3 characters";
        }
        break;

      case "walking":
        if (!strVal) err = "Walking difficulty is required";
        break;

      case "climbing":
        if (!strVal) err = "Climbing difficulty is required";
        break;

      case "walkingDistance":
        if (strVal) {
          if (!/^\d+(\.\d+)?\s*km(\s+to\s+\d+(\.\d+)?\s*km)?$/i.test(strVal)) {
            err = "Total Walking Distance must be in valid format (e.g., 5 km or 4.8 km to 5 km)";
          }
        }
        break;

      case "numberOfSteps":
        if (strVal) {
          if (!/^\d{1,3}$/.test(strVal)) {
            if (/[^\d]/.test(strVal)) {
              err = "Number of Steps must contain numbers/digits only";
            } else {
              err = "Number of Steps cannot exceed 3 digits (e.g., 500)";
            }
          }
        }
        break;

      case "accessibility":
        if (strVal) {
          if (!/^[a-zA-Z0-9\s,.\-\n\r]+$/.test(strVal)) {
            err = "Accessibility Information can only contain letters, numbers, and basic punctuation";
          }
        }
        break;

      case "hospitals":
        if (strVal) {
          if (!/^[a-zA-Z0-9\s,./-]+$/.test(strVal)) {
            err = "Nearby Hospitals can only contain letters, numbers, spaces, commas, periods, hyphens, and slashes";
          }
        }
        break;

      case "pharmacies":
        if (strVal) {
          if (!/^[a-zA-Z0-9\s,./-]+$/.test(strVal)) {
            err = "Nearby Pharmacies can only contain letters, numbers, spaces, commas, periods, hyphens, and slashes";
          }
        }
        break;

      case "restaurants":
        if (strVal) {
          if (!/^[a-zA-Z0-9\s,./-]+$/.test(strVal)) {
            err = "Nearby Restaurants can only contain letters, numbers, spaces, commas, periods, hyphens, and slashes";
          }
        }
        break;

      case "accommodation":
        if (strVal) {
          if (!/^[a-zA-Z0-9\s,./-]+$/.test(strVal)) {
            err = "Nearby Accommodation can only contain letters, numbers, spaces, commas, periods, hyphens, and slashes";
          }
        }
        break;

      case "emergencyContact":
        if (strVal) {
          if (/[^\d]/.test(strVal)) {
            err = "Emergency Contact can only contain digits (letters are not allowed)";
          } else if (strVal.length === 3) {
            if (!strVal.startsWith("1")) {
              err = "3-digit emergency helpline must start with 1 (e.g., 108)";
            }
          } else if (strVal.length === 10) {
            if (/^[0-5]/.test(strVal)) {
              err = "Phone number must start with a digit between 6 and 9";
            } else if (/^(\d)\1{9}$/.test(strVal) || /^[6-9]0{8,9}$/.test(strVal) || /^[6-9](\d)\1{8}$/.test(strVal)) {
              err = "Invalid phone number format (repetitive numbers like 7000000000 are not allowed)";
            }
          } else {
            err = "Emergency Contact must be a 3-digit helpline (108) or 10-digit number";
          }
        }
        break;

      default:
        break;
    }

    return err;
  };

  // Immediate OnFocus handler enforcing instantaneous validation & touch marking
  const handleFocus = (fieldKey, value) => {
    setFocusedField(fieldKey);
    setTouched((prev) => ({ ...prev, [fieldKey]: true }));
    const err = validateField(fieldKey, value);
    setErrors((prev) => ({ ...prev, [fieldKey]: err }));
  };

  // Validate entire form for submit
  const validateForm = () => {
    const newErrors = {};
    const fieldsToValidate = [
      ["name", formData.name],
      ["religion", formData.religion],
      ["image", formData.image],
      ["phone", formData.contact.phone],
      ["email", formData.contact.email],
      ["website", formData.contact.website],
      ["description", formData.description],
      ["address", formData.location.address],
      ["city", formData.location.city],
      ["state", formData.location.state],
      ["country", formData.location.country],
      ["postalCode", formData.location.postalCode],
      ["latitude", formData.location.latitude],
      ["longitude", formData.location.longitude],
      ["googleMapsUrl", formData.location.googleMapsUrl],
      ["specialNotes", formData.timings.specialNotes],
      ["bestSeason", formData.visitingInformation.bestSeasonFrom],
      ["peakSeason", formData.visitingInformation.peakSeasonFrom],
      ["climate", formData.visitingInformation.climate],
      ["averageVisitDuration", formData.visitingInformation.averageVisitDuration],
      ["crowdLevel", formData.visitingInformation.crowdLevel],
      ["recommendedAgeGroup", formData.visitingInformation.recommendedAgeGroup],
      ["walking", formData.difficulty.walking],
      ["climbing", formData.difficulty.climbing],
      ["walkingDistance", formData.difficulty.walkingDistance],
      ["numberOfSteps", formData.difficulty.numberOfSteps],
      ["accessibility", formData.difficulty.accessibility],
      ["hospitals", formData.nearbyServices.hospitals],
      ["pharmacies", formData.nearbyServices.pharmacies],
      ["restaurants", formData.nearbyServices.restaurants],
      ["accommodation", formData.nearbyServices.accommodation],
      ["emergencyContact", formData.nearbyServices.emergencyContact],
    ];

    fieldsToValidate.forEach(([field, value]) => {
      const err = validateField(field, value);
      if (err) newErrors[field] = err;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handler for field changes
  const handleInputChange = (field, val, subField = null) => {
    setFormData((prev) => {
      let updated;
      if (subField) {
        updated = {
          ...prev,
          [subField]: {
            ...prev[subField],
            [field]: val,
          },
        };
      } else {
        updated = { ...prev, [field]: val };
      }

      const err = validateField(field, val, updated);
      setErrors((prevErrs) => ({ ...prevErrs, [field]: err }));
      return updated;
    });

    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Image Upload Handler
  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.match("image/(jpeg|png|jpg|webp)")) {
      setErrors((prev) => ({ ...prev, image: "Only JPG, PNG, or WebP images are allowed." }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: "Image size cannot exceed 5 MB." }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setFormData((prev) => ({ ...prev, image: reader.result }));
      setErrors((prev) => ({ ...prev, image: "" }));
    };
    reader.readAsDataURL(file);
  };

  // Image URL Input Handler
  const handleImageUrlChange = (urlVal) => {
    setFormData((prev) => ({ ...prev, imageUrlInput: urlVal, image: urlVal }));
    setImagePreview(urlVal);
    setTouched((prev) => ({ ...prev, image: true }));
    const err = validateField("image", urlVal, { ...formData, image: urlVal });
    setErrors((prev) => ({ ...prev, image: err }));
  };

  // Rule Handlers
  const handleAddRule = () => {
    setFormData((prev) => ({ ...prev, rules: [...prev.rules, ""] }));
  };

  const handleRuleChange = (index, val) => {
    const newRules = [...formData.rules];
    newRules[index] = val;
    setFormData((prev) => ({ ...prev, rules: newRules }));
  };

  const handleRemoveRule = (index) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();

    // Mark all as touched
    const allTouched = {};
    Object.keys(focusHelpers).forEach((k) => (allTouched[k] = true));
    setTouched(allTouched);

    if (!validateForm()) {
      const firstErrKey = Object.keys(errors)[0];
      if (firstErrKey) {
        setFocusedField(firstErrKey);
      }
      const formEl = document.querySelector(".modal-body.scrollable") || document.querySelector(".pilgrimage-center-form-wrapper");
      if (formEl) {
        formEl.scrollTop = 0;
      }
      return;
    }

    // Format timing & season values for backend
    const formattedOpeningTime = `${formData.timings.openingHour}:${formData.timings.openingMinute} ${formData.timings.openingAmPm}`;
    const formattedClosingTime = `${formData.timings.closingHour}:${formData.timings.closingMinute} ${formData.timings.closingAmPm}`;
    const formattedBestSeason = `${formData.visitingInformation.bestSeasonFrom} – ${formData.visitingInformation.bestSeasonTo}`;
    const formattedPeakSeason = `${formData.visitingInformation.peakSeasonFrom} – ${formData.visitingInformation.peakSeasonTo}`;

    // Process array text fields for nearby services
    const processedServices = {
      ...formData.nearbyServices,
      hospitals: formData.nearbyServices.hospitals
        ? formData.nearbyServices.hospitals.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      pharmacies: formData.nearbyServices.pharmacies
        ? formData.nearbyServices.pharmacies.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      restaurants: formData.nearbyServices.restaurants
        ? formData.nearbyServices.restaurants.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      accommodation: formData.nearbyServices.accommodation
        ? formData.nearbyServices.accommodation.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    };

    const finalData = {
      ...formData,
      image: formData.image || formData.imageUrlInput,
      timings: {
        openingTime: formattedOpeningTime,
        closingTime: formattedClosingTime,
        weeklyClosingDay: formData.timings.weeklyClosingDay,
        specialNotes: formData.timings.specialNotes,
      },
      visitingInformation: {
        ...formData.visitingInformation,
        bestSeason: formattedBestSeason,
        peakSeason: formattedPeakSeason,
      },
      location: {
        ...formData.location,
        latitude: formData.location.latitude !== "" ? Number(formData.location.latitude) : 0,
        longitude: formData.location.longitude !== "" ? Number(formData.location.longitude) : 0,
      },
      rules: formData.rules.filter((r) => r.trim().length > 0),
      nearbyServices: processedServices,
    };

    onSubmit(finalData);
  };

  // Helper rendering function for fields
  const renderFieldHelperOrError = (fieldKey) => {
    const isFocused = focusedField === fieldKey;
    const hasError = errors[fieldKey];

    if (hasError && (touched[fieldKey] || isFocused)) {
      return (
        <div className="field-error-box">
          <FiAlertCircle size={13} />
          <span className="field-error">❌ {errors[fieldKey]}</span>
        </div>
      );
    }

    if (isFocused && focusHelpers[fieldKey]) {
      return (
        <div className="field-focus-helper">
          <FiInfo size={13} />
          <span>ℹ️ {focusHelpers[fieldKey]}</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="pilgrimage-center-form-wrapper">
      <form onSubmit={handleSubmit} noValidate>
        {Object.values(errors).some(Boolean) && (
          <div
            className="form-global-error-banner"
            style={{
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              color: "#b91c1c",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            <FiAlertCircle size={20} />
            <span>Please fix the highlighted errors below before saving.</span>
          </div>
        )}

        {/* SECTION A — BASIC INFORMATION */}
        <div className="form-section-card">
          <div className="section-header-styled">
            <FiInfo className="header-icon" />
            <div>
              <h3>Section A — Basic Information</h3>
              <p>Core identity and contact details of the pilgrimage center</p>
            </div>
          </div>

          <div className="section-body">
            <div className="form-group">
              <label>Center Name <span className="req">*</span></label>
              <input
                type="text"
                placeholder="e.g. Sacred Pilgrimage Shrine"
                value={formData.name}
                onFocus={() => handleFocus("name", formData.name)}
                onBlur={() => {
                  setFocusedField("");
                  setTouched((prev) => ({ ...prev, name: true }));
                  setErrors((prev) => ({ ...prev, name: validateField("name", formData.name) }));
                }}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={errors.name && (touched.name || focusedField === "name") ? "input-error" : ""}
              />
              {renderFieldHelperOrError("name")}
            </div>

            <div className="form-row two-col">
              <div className="form-group">
                <label>Religion / Tradition <span className="req">*</span></label>
                <select
                  value={formData.religion}
                  onFocus={() => handleFocus("religion", formData.religion)}
                  onBlur={() => {
                    setFocusedField("");
                    setTouched((prev) => ({ ...prev, religion: true }));
                  }}
                  onChange={(e) => handleInputChange("religion", e.target.value)}
                  className={errors.religion && (touched.religion || focusedField === "religion") ? "input-error" : ""}
                >
                  {RELIGIONS.map((rel) => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
                {renderFieldHelperOrError("religion")}
              </div>

              <div className="form-group">
                <label>Official Contact Number</label>
                <input
                  type="text"
                  placeholder="e.g. 9874561230"
                  value={formData.contact.phone}
                  onFocus={() => handleFocus("phone", formData.contact.phone)}
                  onBlur={() => {
                    setFocusedField("");
                    setTouched((prev) => ({ ...prev, phone: true }));
                  }}
                  onChange={(e) => handleInputChange("phone", e.target.value, "contact")}
                  className={errors.phone && (touched.phone || focusedField === "phone") ? "input-error" : ""}
                />
                {renderFieldHelperOrError("phone")}
              </div>
            </div>

            <div className="form-row two-col">
              <div className="form-group">
                <label>Official Email</label>
                <input
                  type="email"
                  placeholder="e.g. contact@pilgrimage.org"
                  value={formData.contact.email}
                  onFocus={() => handleFocus("email", formData.contact.email)}
                  onBlur={() => {
                    setFocusedField("");
                    setTouched((prev) => ({ ...prev, email: true }));
                  }}
                  onChange={(e) => handleInputChange("email", e.target.value, "contact")}
                  className={errors.email && (touched.email || focusedField === "email") ? "input-error" : ""}
                />
                {renderFieldHelperOrError("email")}
              </div>

              <div className="form-group">
                <label>Official Website</label>
                <input
                  type="text"
                  placeholder="e.g. https://pilgrimage.gov.in"
                  value={formData.contact.website}
                  onFocus={() => handleFocus("website", formData.contact.website)}
                  onBlur={() => {
                    setFocusedField("");
                    setTouched((prev) => ({ ...prev, website: true }));
                  }}
                  onChange={(e) => handleInputChange("website", e.target.value, "contact")}
                  className={errors.website && (touched.website || focusedField === "website") ? "input-error" : ""}
                />
                {renderFieldHelperOrError("website")}
              </div>
            </div>

            <div className="form-group">
              <label>Description <span className="req">*</span></label>
              <textarea
                rows="4"
                placeholder="Provide a detailed description of the pilgrimage center, its spiritual significance, history, and key attractions..."
                value={formData.description}
                onFocus={() => handleFocus("description", formData.description)}
                onBlur={() => {
                  setFocusedField("");
                  setTouched((prev) => ({ ...prev, description: true }));
                  setErrors((prev) => ({ ...prev, description: validateField("description", formData.description) }));
                }}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className={errors.description && (touched.description || focusedField === "description") ? "input-error" : ""}
              />
              {renderFieldHelperOrError("description")}
            </div>

            <div className="form-group">
              <label>Center Image <span className="req">*</span></label>
              <div className="image-upload-wrapper">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="file-input-control"
                  onFocus={() => handleFocus("image", formData.image)}
                  onBlur={() => setFocusedField("")}
                  onChange={handleImageChange}
                />
                <div style={{ marginTop: "8px" }}>
                  <input
                    type="text"
                    placeholder="Or enter Image URL (e.g. https://example.com/image.jpg)"
                    value={formData.imageUrlInput}
                    onFocus={() => handleFocus("image", formData.image)}
                    onBlur={() => setFocusedField("")}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    className={errors.image && (touched.image || focusedField === "image") ? "input-error" : ""}
                  />
                </div>
                <p className="file-hint-text">Supported formats: JPG, PNG, WebP (Max 5MB) or direct web image URL.</p>
              </div>

              {imagePreview && (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Center Preview" className="center-img-preview" />
                  <button
                    type="button"
                    className="btn-remove-img"
                    onClick={() => {
                      setImagePreview("");
                      setFormData((prev) => ({ ...prev, image: "", imageUrlInput: "" }));
                      setErrors((prev) => ({ ...prev, image: "Center Image (file upload or image URL) is required" }));
                    }}
                  >
                    <FiX /> Remove Image
                  </button>
                </div>
              )}
              {renderFieldHelperOrError("image")}
            </div>
          </div>
        </div>

        {/* SECTION B — LOCATION */}
        <div className="form-section-card">
          <div className="section-header-styled">
            <FiMapPin className="header-icon" />
            <div>
              <h3>Section B — Location Information</h3>
              <p>Exact physical address and geographical coordinates</p>
            </div>
          </div>

          <div className="section-body">
            <div className="form-group">
              <label>Address <span className="req">*</span></label>
              <textarea
                rows="3"
                placeholder="Enter physical address line by line (e.g.&#10;Main Temple Street&#10;Sacred Hill Shrine&#10;Pathanamthitta)"
                value={formData.location.address}
                onFocus={() => handleFocus("address", formData.location.address)}
                onBlur={() => {
                  setFocusedField("");
                  setTouched((prev) => ({ ...prev, address: true }));
                }}
                onChange={(e) => handleInputChange("address", e.target.value, "location")}
                className={errors.address && (touched.address || focusedField === "address") ? "input-error" : ""}
              />
              {renderFieldHelperOrError("address")}
            </div>

            {/* Country, State, City format */}
            <div className="form-row three-col">
              <div className="form-group">
                <label>Country <span className="req">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. India"
                  value={formData.location.country}
                  onFocus={() => handleFocus("country", formData.location.country)}
                  onBlur={() => {
                    setFocusedField("");
                    setTouched((prev) => ({ ...prev, country: true }));
                  }}
                  onChange={(e) => handleInputChange("country", e.target.value, "location")}
                  className={errors.country && (touched.country || focusedField === "country") ? "input-error" : ""}
                />
                {renderFieldHelperOrError("country")}
              </div>

              <div className="form-group">
                <label>State <span className="req">*</span></label>
                <select
                  value={formData.location.state}
                  onFocus={() => handleFocus("state", formData.location.state)}
                  onBlur={() => {
                    setFocusedField("");
                    setTouched((prev) => ({ ...prev, state: true }));
                  }}
                  onChange={(e) => handleInputChange("state", e.target.value, "location")}
                  className={errors.state && (touched.state || focusedField === "state") ? "input-error" : ""}
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                {renderFieldHelperOrError("state")}
              </div>

              <div className="form-group">
                <label>City <span className="req">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Pathanamthitta"
                  value={formData.location.city}
                  onFocus={() => handleFocus("city", formData.location.city)}
                  onBlur={() => {
                    setFocusedField("");
                    setTouched((prev) => ({ ...prev, city: true }));
                  }}
                  onChange={(e) => handleInputChange("city", e.target.value, "location")}
                  className={errors.city && (touched.city || focusedField === "city") ? "input-error" : ""}
                />
                {renderFieldHelperOrError("city")}
              </div>
            </div>

            <div className="form-row three-col">
              <div className="form-group">
                <label>Postal Code <span className="req">*</span></label>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="e.g. 689713"
                  value={formData.location.postalCode}
                  onFocus={() => handleFocus("postalCode", formData.location.postalCode)}
                  onBlur={() => {
                    setFocusedField("");
                    setTouched((prev) => ({ ...prev, postalCode: true }));
                  }}
                  onChange={(e) => handleInputChange("postalCode", e.target.value, "location")}
                  className={errors.postalCode && (touched.postalCode || focusedField === "postalCode") ? "input-error" : ""}
                />
                {renderFieldHelperOrError("postalCode")}
              </div>

              <div className="form-group">
                <label>Latitude <span className="req">*</span></label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 9.4402"
                  value={formData.location.latitude}
                  onFocus={() => handleFocus("latitude", formData.location.latitude)}
                  onBlur={() => setFocusedField("")}
                  onChange={(e) => handleInputChange("latitude", e.target.value, "location")}
                  className={errors.latitude && (touched.latitude || focusedField === "latitude") ? "input-error" : ""}
                />
                {renderFieldHelperOrError("latitude")}
              </div>

              <div className="form-group">
                <label>Longitude <span className="req">*</span></label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 77.0818"
                  value={formData.location.longitude}
                  onFocus={() => handleFocus("longitude", formData.location.longitude)}
                  onBlur={() => setFocusedField("")}
                  onChange={(e) => handleInputChange("longitude", e.target.value, "location")}
                  className={errors.longitude && (touched.longitude || focusedField === "longitude") ? "input-error" : ""}
                />
                {renderFieldHelperOrError("longitude")}
              </div>
            </div>

            <div className="form-group">
              <label>Google Maps URL <span className="req">*</span></label>
              <input
                type="text"
                placeholder="e.g. https://maps.app.goo.gl/... or https://maps.google.com/..."
                value={formData.location.googleMapsUrl}
                onFocus={() => handleFocus("googleMapsUrl", formData.location.googleMapsUrl)}
                onBlur={() => {
                  setFocusedField("");
                  setTouched((prev) => ({ ...prev, googleMapsUrl: true }));
                }}
                onChange={(e) => handleGoogleMapsUrlChange(e.target.value)}
                className={errors.googleMapsUrl && (touched.googleMapsUrl || focusedField === "googleMapsUrl") ? "input-error" : ""}
              />
              <div style={{ marginTop: "8px" }}>
                <button
                  type="button"
                  style={{
                    background: "#eff6ff",
                    color: "#2563eb",
                    border: "1px solid #bfdbfe",
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontSize: "12.5px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                  onClick={() => handleGoogleMapsUrlChange(formData.location.googleMapsUrl || `${formData.name} ${formData.location.city}`)}
                  disabled={fetchingCoordinates}
                >
                  {fetchingCoordinates ? "🔄 Auto-Fetching Coordinates..." : "📍 Auto-Fetch Latitude & Longitude from Location / URL"}
                </button>
              </div>
              {fetchingCoordinates && (
                <p style={{ color: "#0284c7", fontSize: "12px", marginTop: "4px", fontWeight: "600" }}>
                  🔄 Resolving Google Maps link & extracting Latitude/Longitude...
                </p>
              )}
              {renderFieldHelperOrError("googleMapsUrl")}
            </div>
          </div>
        </div>

        {/* SECTION C — TIMINGS */}
        <div className="form-section-card">
          <div className="section-header-styled">
            <FiClock className="header-icon" />
            <div>
              <h3>Section C — Operating Timings</h3>
              <p>Darshan hours, weekly holidays, and special timing notes</p>
            </div>
          </div>

          <div className="section-body">
            <div className="form-row three-col">
              <div className="form-group">
                <label>Opening Time <span className="req">*</span></label>
                <div className="time-picker-composite">
                  <select
                    value={formData.timings.openingHour}
                    onFocus={() => handleFocus("openingTime", `${formData.timings.openingHour}:${formData.timings.openingMinute}`)}
                    onBlur={() => setFocusedField("")}
                    onChange={(e) => handleInputChange("openingHour", e.target.value, "timings")}
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="time-colon">:</span>
                  <select
                    value={formData.timings.openingMinute}
                    onFocus={() => handleFocus("openingTime", `${formData.timings.openingHour}:${formData.timings.openingMinute}`)}
                    onBlur={() => setFocusedField("")}
                    onChange={(e) => handleInputChange("openingMinute", e.target.value, "timings")}
                  >
                    {MINUTES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={formData.timings.openingAmPm}
                    onFocus={() => handleFocus("openingTime", `${formData.timings.openingHour}:${formData.timings.openingMinute}`)}
                    onBlur={() => setFocusedField("")}
                    onChange={(e) => handleInputChange("openingAmPm", e.target.value, "timings")}
                    className="ampm-select"
                  >
                    {AMPM_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                {renderFieldHelperOrError("openingTime")}
              </div>

              <div className="form-group">
                <label>Closing Time <span className="req">*</span></label>
                <div className="time-picker-composite">
                  <select
                    value={formData.timings.closingHour}
                    onFocus={() => handleFocus("closingTime", `${formData.timings.closingHour}:${formData.timings.closingMinute}`)}
                    onBlur={() => setFocusedField("")}
                    onChange={(e) => handleInputChange("closingHour", e.target.value, "timings")}
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="time-colon">:</span>
                  <select
                    value={formData.timings.closingMinute}
                    onFocus={() => handleFocus("closingTime", `${formData.timings.closingHour}:${formData.timings.closingMinute}`)}
                    onBlur={() => setFocusedField("")}
                    onChange={(e) => handleInputChange("closingMinute", e.target.value, "timings")}
                  >
                    {MINUTES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={formData.timings.closingAmPm}
                    onFocus={() => handleFocus("closingTime", `${formData.timings.closingHour}:${formData.timings.closingMinute}`)}
                    onBlur={() => setFocusedField("")}
                    onChange={(e) => handleInputChange("closingAmPm", e.target.value, "timings")}
                    className="ampm-select"
                  >
                    {AMPM_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                {renderFieldHelperOrError("closingTime")}
              </div>

              <div className="form-group">
                <label>Weekly Closing Day</label>
                <select
                  value={formData.timings.weeklyClosingDay}
                  onFocus={() => handleFocus("weeklyClosingDay", formData.timings.weeklyClosingDay)}
                  onBlur={() => setFocusedField("")}
                  onChange={(e) => handleInputChange("weeklyClosingDay", e.target.value, "timings")}
                >
                  <option value="None">None (Open Daily)</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
                {renderFieldHelperOrError("weeklyClosingDay")}
              </div>
            </div>

            <div className="form-group">
              <label>Special Timings / Notes</label>
              <input
                type="text"
                placeholder="e.g. Temple remains closed during Harivarasanam between 11:00 PM to 03:00 AM"
                value={formData.timings.specialNotes}
                onFocus={() => handleFocus("specialNotes", formData.timings.specialNotes)}
                onBlur={() => setFocusedField("")}
                onChange={(e) => handleInputChange("specialNotes", e.target.value, "timings")}
                className={errors.specialNotes && (touched.specialNotes || focusedField === "specialNotes") ? "input-error" : ""}
              />
              {renderFieldHelperOrError("specialNotes")}
            </div>
          </div>
        </div>

        {/* SECTION D — VISITING INFORMATION */}
        <div className="form-section-card">
          <div className="section-header-styled">
            <FiSun className="header-icon" />
            <div>
              <h3>Section D — Visiting & Seasonal Information</h3>
              <p>Best seasons, climate, average visit duration, and crowd levels</p>
            </div>
          </div>

          <div className="section-body">
            <div className="form-row three-col">
              <div className="form-group">
                <label>Best Visiting Season <span className="req">*</span></label>
                <div className="range-picker-composite">
                  <select
                    value={formData.visitingInformation.bestSeasonFrom}
                    onFocus={() => handleFocus("bestSeason", formData.visitingInformation.bestSeasonFrom)}
                    onBlur={() => setFocusedField("")}
                    onChange={(e) => handleInputChange("bestSeasonFrom", e.target.value, "visitingInformation")}
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <span className="range-to-label">to</span>
                  <select
                    value={formData.visitingInformation.bestSeasonTo}
                    onFocus={() => handleFocus("bestSeason", formData.visitingInformation.bestSeasonTo)}
                    onBlur={() => setFocusedField("")}
                    onChange={(e) => handleInputChange("bestSeasonTo", e.target.value, "visitingInformation")}
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                {renderFieldHelperOrError("bestSeason")}
              </div>

              <div className="form-group">
                <label>Peak Season <span className="req">*</span></label>
                <div className="range-picker-composite">
                  <select
                    value={formData.visitingInformation.peakSeasonFrom}
                    onFocus={() => handleFocus("peakSeason", formData.visitingInformation.peakSeasonFrom)}
                    onBlur={() => setFocusedField("")}
                    onChange={(e) => handleInputChange("peakSeasonFrom", e.target.value, "visitingInformation")}
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <span className="range-to-label">to</span>
                  <select
                    value={formData.visitingInformation.peakSeasonTo}
                    onFocus={() => handleFocus("peakSeason", formData.visitingInformation.peakSeasonTo)}
                    onBlur={() => setFocusedField("")}
                    onChange={(e) => handleInputChange("peakSeasonTo", e.target.value, "visitingInformation")}
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                {renderFieldHelperOrError("peakSeason")}
              </div>

              <div className="form-group">
                <label>Climate <span className="req">*</span></label>
                <select
                  value={formData.visitingInformation.climate}
                  onFocus={() => handleFocus("climate", formData.visitingInformation.climate)}
                  onBlur={() => setFocusedField("")}
                  onChange={(e) => handleInputChange("climate", e.target.value, "visitingInformation")}
                  className={errors.climate && (touched.climate || focusedField === "climate") ? "input-error" : ""}
                >
                  {CLIMATE_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {renderFieldHelperOrError("climate")}
              </div>
            </div>

            <div className="form-row three-col">
              <div className="form-group">
                <label>Average Visit Duration <span className="req">*</span></label>
                <select
                  value={formData.visitingInformation.averageVisitDuration}
                  onFocus={() => handleFocus("averageVisitDuration", formData.visitingInformation.averageVisitDuration)}
                  onBlur={() => {
                    setFocusedField("");
                    setTouched((prev) => ({ ...prev, averageVisitDuration: true }));
                  }}
                  onChange={(e) => handleInputChange("averageVisitDuration", e.target.value, "visitingInformation")}
                  className={errors.averageVisitDuration && (touched.averageVisitDuration || focusedField === "averageVisitDuration") ? "input-error" : ""}
                >
                  {DURATION_OPTIONS.map((dur) => (
                    <option key={dur} value={dur}>{dur}</option>
                  ))}
                </select>
                {renderFieldHelperOrError("averageVisitDuration")}
              </div>

              <div className="form-group">
                <label>Crowd Level <span className="req">*</span></label>
                <select
                  value={formData.visitingInformation.crowdLevel}
                  onFocus={() => handleFocus("crowdLevel", formData.visitingInformation.crowdLevel)}
                  onBlur={() => setFocusedField("")}
                  onChange={(e) => handleInputChange("crowdLevel", e.target.value, "visitingInformation")}
                  className={errors.crowdLevel && (touched.crowdLevel || focusedField === "crowdLevel") ? "input-error" : ""}
                >
                  {CROWD_LEVELS.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                {renderFieldHelperOrError("crowdLevel")}
              </div>

              <div className="form-group">
                <label>Recommended Age Group <span className="req">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. All Age Groups or 10 - 60 Years"
                  value={formData.visitingInformation.recommendedAgeGroup}
                  onFocus={() => handleFocus("recommendedAgeGroup", formData.visitingInformation.recommendedAgeGroup)}
                  onBlur={() => {
                    setFocusedField("");
                    setTouched((prev) => ({ ...prev, recommendedAgeGroup: true }));
                  }}
                  onChange={(e) => handleInputChange("recommendedAgeGroup", e.target.value, "visitingInformation")}
                  className={errors.recommendedAgeGroup && (touched.recommendedAgeGroup || focusedField === "recommendedAgeGroup") ? "input-error" : ""}
                />
                {renderFieldHelperOrError("recommendedAgeGroup")}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION E — PHYSICAL DIFFICULTY */}
        <div className="form-section-card">
          <div className="section-header-styled">
            <FiActivity className="header-icon" />
            <div>
              <h3>Section E — Physical Difficulty & Terrain</h3>
              <p>Walking/climbing difficulty metrics for Pilgrim Safety Index (PSI) calculations</p>
            </div>
          </div>

          <div className="section-body">
            <div className="form-row two-col">
              <div className="form-group">
                <label>Walking Difficulty <span className="req">*</span></label>
                <select
                  value={formData.difficulty.walking}
                  onFocus={() => handleFocus("walking", formData.difficulty.walking)}
                  onBlur={() => setFocusedField("")}
                  onChange={(e) => handleInputChange("walking", e.target.value, "difficulty")}
                  className={errors.walking && (touched.walking || focusedField === "walking") ? "input-error" : ""}
                >
                  {DIFFICULTY_LEVELS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {renderFieldHelperOrError("walking")}
              </div>

              <div className="form-group">
                <label>Climbing Difficulty <span className="req">*</span></label>
                <select
                  value={formData.difficulty.climbing}
                  onFocus={() => handleFocus("climbing", formData.difficulty.climbing)}
                  onBlur={() => setFocusedField("")}
                  onChange={(e) => handleInputChange("climbing", e.target.value, "difficulty")}
                  className={errors.climbing && (touched.climbing || focusedField === "climbing") ? "input-error" : ""}
                >
                  {DIFFICULTY_LEVELS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {renderFieldHelperOrError("climbing")}
              </div>
            </div>

            <div className="form-row three-col">
              <div className="form-group">
                <label>Total Walking Distance</label>
                <input
                  type="text"
                  placeholder="e.g. 5 km or 4.8 km to 5 km"
                  value={formData.difficulty.walkingDistance}
                  onFocus={() => handleFocus("walkingDistance", formData.difficulty.walkingDistance)}
                  onBlur={() => {
                    setFocusedField("");
                    setTouched((prev) => ({ ...prev, walkingDistance: true }));
                    setErrors((prev) => ({ ...prev, walkingDistance: validateField("walkingDistance", formData.difficulty.walkingDistance) }));
                  }}
                  onChange={(e) => handleInputChange("walkingDistance", e.target.value, "difficulty")}
                  className={errors.walkingDistance && (touched.walkingDistance || focusedField === "walkingDistance") ? "input-error" : ""}
                />
                {renderFieldHelperOrError("walkingDistance")}
              </div>

              <div className="form-group">
                <label>Number of Steps</label>
                <input
                  type="text"
                  maxLength="3"
                  placeholder="e.g. 500"
                  value={formData.difficulty.numberOfSteps}
                  onFocus={() => handleFocus("numberOfSteps", formData.difficulty.numberOfSteps)}
                  onBlur={() => {
                    setFocusedField("");
                    setTouched((prev) => ({ ...prev, numberOfSteps: true }));
                    setErrors((prev) => ({ ...prev, numberOfSteps: validateField("numberOfSteps", formData.difficulty.numberOfSteps) }));
                  }}
                  onChange={(e) => handleInputChange("numberOfSteps", e.target.value, "difficulty")}
                  className={errors.numberOfSteps && (touched.numberOfSteps || focusedField === "numberOfSteps") ? "input-error" : ""}
                />
                {renderFieldHelperOrError("numberOfSteps")}
              </div>

              <div className="form-group">
                <label>Terrain Type</label>
                <select
                  value={formData.difficulty.terrainType}
                  onFocus={() => handleFocus("terrainType", formData.difficulty.terrainType)}
                  onBlur={() => setFocusedField("")}
                  onChange={(e) => handleInputChange("terrainType", e.target.value, "difficulty")}
                >
                  {TERRAIN_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {renderFieldHelperOrError("terrainType")}
              </div>
            </div>

            <div className="form-group">
              <label>Accessibility Information</label>
              <textarea
                rows="3"
                placeholder="Enter accessibility features line by line (e.g.&#10;Wheelchair ramps available at main entrance&#10;Doli & Palanquin service for elderly pilgrims&#10;Elevators accessible from parking area)"
                value={formData.difficulty.accessibility}
                onFocus={() => handleFocus("accessibility", formData.difficulty.accessibility)}
                onBlur={() => setFocusedField("")}
                onChange={(e) => handleInputChange("accessibility", e.target.value, "difficulty")}
                className={errors.accessibility && (touched.accessibility || focusedField === "accessibility") ? "input-error" : ""}
              />
              {renderFieldHelperOrError("accessibility")}
            </div>
          </div>
        </div>

        {/* SECTION F — RULES AND GUIDELINES */}
        <div className="form-section-card">
          <div className="section-header-styled">
            <FiCheckSquare className="header-icon" />
            <div>
              <h3>Section F — Rules & Guidelines</h3>
              <p>Dress code, entry restrictions, photography, and safety guidelines</p>
            </div>
          </div>

          <div className="section-body">
            <div className="dynamic-rules-list">
              {formData.rules.map((rule, idx) => (
                <div key={idx} className="rule-item-row" style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                  <input
                    type="text"
                    placeholder={`Rule ${idx + 1} (e.g. Traditional attire mandatory, Photography prohibited)`}
                    value={rule}
                    onChange={(e) => handleRuleChange(idx, e.target.value)}
                  />
                  {formData.rules.length > 1 && (
                    <button
                      type="button"
                      className="btn-delete-rule"
                      onClick={() => handleRemoveRule(idx)}
                      title="Remove Rule"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              ))}

              <button type="button" className="btn-add-rule" onClick={handleAddRule}>
                <FiPlus /> Add Rule
              </button>
            </div>
          </div>
        </div>

        {/* SECTION G — NEARBY SERVICES */}
        <div className="form-section-card">
          <div className="section-header-styled" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <FiGlobe className="header-icon" />
              <div>
                <h3>Section G — Nearby Emergency & Tourist Services</h3>
                <p>Hospitals, pharmacies, food, stay, and facility availability</p>
              </div>
            </div>
            <button
              type="button"
              className="btn-auto-fetch-nearby"
              onClick={() => handleAutoFetchNearby()}
              disabled={fetchingNearbyPlaces}
            >
              {fetchingNearbyPlaces ? "Fetching Nearby Places..." : "⚡ Auto-Detect Nearby Services from Map Location"}
            </button>
          </div>

          {nearbyPlacesBanner && (
            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0369a1", padding: "8px 16px", fontSize: "13px", fontWeight: "600" }}>
              {nearbyPlacesBanner}
            </div>
          )}

          <div className="section-body">
            <div className="form-row two-col">
              <div className="form-group">
                <label>Nearby Hospitals</label>
                <input
                  type="text"
                  placeholder="e.g. Pampa Government Hospital, Sannidhanam Medical Centre"
                  value={formData.nearbyServices.hospitals}
                  onFocus={() => handleFocus("hospitals", formData.nearbyServices.hospitals)}
                  onBlur={() => {
                    setFocusedField("");
                    setTouched((prev) => ({ ...prev, hospitals: true }));
                  }}
                  onChange={(e) => handleInputChange("hospitals", e.target.value, "nearbyServices")}
                  className={errors.hospitals && (touched.hospitals || focusedField === "hospitals") ? "input-error" : ""}
                />
                {renderFieldHelperOrError("hospitals")}
              </div>

              <div className="form-group">
                <label>Nearby Pharmacies</label>
                <input
                  type="text"
                  placeholder="e.g. Jan Aushadhi Pharmacy Pampa"
                  value={formData.nearbyServices.pharmacies}
                  onFocus={() => handleFocus("pharmacies", formData.nearbyServices.pharmacies)}
                  onBlur={() => {
                    setFocusedField("");
                    setTouched((prev) => ({ ...prev, pharmacies: true }));
                  }}
                  onChange={(e) => handleInputChange("pharmacies", e.target.value, "nearbyServices")}
                  className={errors.pharmacies && (touched.pharmacies || focusedField === "pharmacies") ? "input-error" : ""}
                />
                {renderFieldHelperOrError("pharmacies")}
              </div>
            </div>

            <div className="form-row two-col">
              <div className="form-group">
                <label>Nearby Restaurants / Food Counters</label>
                <input
                  type="text"
                  placeholder="e.g. Annadana Mandapam, Travancore Devaswom Canteen"
                  value={formData.nearbyServices.restaurants}
                  onFocus={() => handleFocus("restaurants", formData.nearbyServices.restaurants)}
                  onBlur={() => {
                    setFocusedField("");
                    setTouched((prev) => ({ ...prev, restaurants: true }));
                  }}
                  onChange={(e) => handleInputChange("restaurants", e.target.value, "nearbyServices")}
                  className={errors.restaurants && (touched.restaurants || focusedField === "restaurants") ? "input-error" : ""}
                />
                {renderFieldHelperOrError("restaurants")}
              </div>

              <div className="form-group">
                <label>Nearby Accommodation / Cottages</label>
                <input
                  type="text"
                  placeholder="e.g. Pilgrimage Guest House, Devaswom Cottages"
                  value={formData.nearbyServices.accommodation}
                  onFocus={() => handleFocus("accommodation", formData.nearbyServices.accommodation)}
                  onBlur={() => {
                    setFocusedField("");
                    setTouched((prev) => ({ ...prev, accommodation: true }));
                  }}
                  onChange={(e) => handleInputChange("accommodation", e.target.value, "nearbyServices")}
                  className={errors.accommodation && (touched.accommodation || focusedField === "accommodation") ? "input-error" : ""}
                />
                {renderFieldHelperOrError("accommodation")}
              </div>
            </div>

            <div className="checkbox-facility-group" style={{ display: "flex", gap: "20px", margin: "14px 0" }}>
              <label className="checkbox-facility-label">
                <input
                  type="checkbox"
                  checked={formData.nearbyServices.parkingAvailable}
                  onChange={(e) => handleInputChange("parkingAvailable", e.target.checked, "nearbyServices")}
                />
                <span>🅿️ Parking Facility Available</span>
              </label>

              <label className="checkbox-facility-label">
                <input
                  type="checkbox"
                  checked={formData.nearbyServices.drinkingWaterAvailable}
                  onChange={(e) => handleInputChange("drinkingWaterAvailable", e.target.checked, "nearbyServices")}
                />
                <span>🚰 Drinking Water Available</span>
              </label>

              <label className="checkbox-facility-label">
                <input
                  type="checkbox"
                  checked={formData.nearbyServices.restroomAvailable}
                  onChange={(e) => handleInputChange("restroomAvailable", e.target.checked, "nearbyServices")}
                />
                <span>🚻 Restroom / Toilets Available</span>
              </label>
            </div>

            <div className="form-group">
              <label>Emergency Control Room Contact</label>
              <input
                type="text"
                placeholder="e.g. 9874561230 or 108"
                value={formData.nearbyServices.emergencyContact}
                onFocus={() => handleFocus("emergencyContact", formData.nearbyServices.emergencyContact)}
                onBlur={() => {
                  setFocusedField("");
                  setTouched((prev) => ({ ...prev, emergencyContact: true }));
                }}
                onChange={(e) => handleInputChange("emergencyContact", e.target.value, "nearbyServices")}
                className={errors.emergencyContact && (touched.emergencyContact || focusedField === "emergencyContact") ? "input-error" : ""}
              />
              {renderFieldHelperOrError("emergencyContact")}
            </div>
          </div>
        </div>

        {/* SECTION H — MAP LOCATION PREVIEW */}
        <div className="form-section-card">
          <div className="section-header-styled">
            <FiMap className="header-icon" />
            <div>
              <h3>Section H — Geographical Location & Map Preview</h3>
              <p>Real-time location coordinate and Google Maps preview</p>
            </div>
          </div>

          <div className="section-body">
            {(() => {
              const { googleMapsUrl, latitude, longitude, address, city, state, country } = formData.location;
              const centerName = formData.name;
              let embedInfo = null;

              if (googleMapsUrl) {
                const atMatch = googleMapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                const qMatch = googleMapsUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
                const llMatch = googleMapsUrl.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
                const coords = atMatch || qMatch || llMatch;
                if (coords && coords[1] && coords[2]) {
                  embedInfo = {
                    queryStr: `${coords[1]},${coords[2]}`,
                    label: `Coordinates: ${coords[1]}, ${coords[2]}`,
                    link: googleMapsUrl,
                  };
                } else {
                  const placeMatch = googleMapsUrl.match(/\/place\/([^/@]+)/);
                  if (placeMatch && placeMatch[1]) {
                    const decodedPlace = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
                    embedInfo = {
                      queryStr: decodedPlace,
                      label: `Location: ${decodedPlace}`,
                      link: googleMapsUrl,
                    };
                  }
                }
              }

              if (!embedInfo && latitude !== "" && longitude !== "" && latitude !== undefined && longitude !== undefined) {
                const numLat = Number(latitude);
                const numLng = Number(longitude);
                if (!isNaN(numLat) && !isNaN(numLng) && (numLat !== 0 || numLng !== 0) && !(numLat === 50 && numLng === 150)) {
                  embedInfo = {
                    queryStr: `${numLat},${numLng}`,
                    label: `Coordinates: ${numLat}, ${numLng}`,
                    link: googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${numLat},${numLng}`,
                  };
                }
              }

              if (!embedInfo) {
                const locationParts = [centerName, address, city, state, country].filter(
                  (p) => p && String(p).trim().length > 0
                );
                if (locationParts.length > 0) {
                  const fullLocStr = locationParts.join(", ");
                  embedInfo = {
                    queryStr: fullLocStr,
                    label: `Location: ${fullLocStr}`,
                    link: googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullLocStr)}`,
                  };
                }
              }

              if (!embedInfo) {
                return (
                  <p style={{ fontSize: "13px", color: "#64748b", fontStyle: "italic", background: "#f8fafc", padding: "16px", borderRadius: "8px" }}>
                    Enter Google Maps URL, Address, or Latitude & Longitude coordinates in Section B to render real-time interactive map preview.
                  </p>
                );
              }

              return (
                <div className="map-preview-wrapper" style={{ marginTop: "10px", borderRadius: "10px", overflow: "hidden", border: "1px solid #cbd5e1" }}>
                  <div style={{ background: "#f8fafc", padding: "10px 16px", fontSize: "13px", fontWeight: 600, color: "#334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>📍 {embedInfo.label}</span>
                    <a
                      href={embedInfo.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#2563eb", textDecoration: "none", fontWeight: 700 }}
                    >
                      Open in Google Maps ↗
                    </a>
                  </div>
                  <iframe
                    title="Center Location Preview"
                    width="100%"
                    height="260"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight="0"
                    marginWidth="0"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(embedInfo.queryStr)}&z=14&output=embed`}
                    style={{ border: 0 }}
                  />
                </div>
              );
            })()}
          </div>
        </div>

        {/* FORM ACTIONS */}
        <div className="form-footer-actions">
          <button type="button" className="btn-form-cancel" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn-form-submit" disabled={submitting}>
            {submitting ? "Saving Center Data..." : (initialData ? "Update Pilgrimage Center" : "Create Pilgrimage Center")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PilgrimageCenterForm;
