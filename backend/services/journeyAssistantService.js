const User = require("../models/User");
const Journey = require("../models/Journey");
const PilgrimageCenter = require("../models/PilgrimageCenter");
const FamilyMember = require("../models/FamilyMember");
const DoctorReview = require("../models/DoctorReview");
const MedicalReport = require("../models/MedicalReport");
const weatherService = require("./weatherService");
const nearbyPlacesService = require("./nearbyPlacesService");

/**
 * Determine Journey Stage from progress percentage and journey status
 */
function determineJourneyStage(journey) {
  if (!journey) return "Journey Not Started";

  const status = (journey.status || "").toLowerCase();
  const percentage = journey.progressPercentage || 0;

  if (status === "planned" || status === "not_started" || status === "cancelled") {
    return "Journey Not Started";
  }

  if (status === "completed") {
    return "Destination Reached";
  }

  if (percentage === 0) {
    return "Journey Started";
  } else if (percentage > 0 && percentage < 30) {
    return "On the Way";
  } else if (percentage >= 30 && percentage < 60) {
    return "Reached Base Camp";
  } else if (percentage >= 60 && percentage < 85) {
    return "Walking/Climbing";
  } else if (percentage >= 85 && percentage < 95) {
    return "Rest Point";
  } else if (percentage >= 95 && percentage < 100) {
    return "Near Destination";
  } else {
    return "Destination Reached";
  }
}

/**
 * Aggregates complete context for the AI Journey Assistant
 */
async function collectJourneyContext(userId, explicitJourneyId = null) {
  try {
    // 1. Fetch User Profile
    const user = await User.findById(userId).select("-password").lean();
    if (!user) {
      throw new Error("Authenticated user record not found.");
    }

    // 2. Fetch Active Journey or Specific Journey
    let journey = null;
    if (explicitJourneyId) {
      journey = await Journey.findOne({ _id: explicitJourneyId, userId })
        .populate("pilgrimageCenterId")
        .populate("travelingFamilyMembers")
        .lean();
    }

    if (!journey) {
      // Find active or latest journey
      journey = await Journey.findOne({
        userId,
        status: { $in: ["IN_PROGRESS", "active", "ready", "planned", "PAUSED"] },
      })
        .sort({ updatedAt: -1 })
        .populate("pilgrimageCenterId")
        .populate("travelingFamilyMembers")
        .lean();
    }

    if (!journey) {
      // Fallback to any latest journey for context
      journey = await Journey.findOne({ userId })
        .sort({ createdAt: -1 })
        .populate("pilgrimageCenterId")
        .populate("travelingFamilyMembers")
        .lean();
    }

    // 3. User Health Assessment & Doctor Approval Status
    const userDoctorReview = await DoctorReview.findOne({ userId, personType: "user" })
      .sort({ createdAt: -1 })
      .lean();

    const userMedicalReport = await MedicalReport.findOne({ userId, ownerType: "user" })
      .sort({ createdAt: -1 })
      .lean();

    let userRiskLevel = user.psiRiskLevel || "LOW_RISK";
    let userDoctorStatus = user.doctorApprovalStatus || "none";
    let userResponsibilityAccepted = user.responsibilityAccepted || false;

    if (userDoctorReview) {
      userRiskLevel = userDoctorReview.aiRiskLevel || userRiskLevel;
      userDoctorStatus = userDoctorReview.status || userDoctorStatus;
      userResponsibilityAccepted = userDoctorReview.responsibilityAccepted || userResponsibilityAccepted;
    } else if (userMedicalReport) {
      userRiskLevel = userMedicalReport.aiRiskAssessment?.overallStatus || userRiskLevel;
      userDoctorStatus = userMedicalReport.physicianReview?.status || userDoctorStatus;
    }

    // Standardize risk format (LOW, MODERATE, HIGH, CRITICAL)
    let userRiskCategory = "LOW";
    const riskStr = (userRiskLevel || "").toUpperCase();
    if (riskStr.includes("CRITICAL")) userRiskCategory = "CRITICAL";
    else if (riskStr.includes("HIGH") || riskStr.includes("MEDICAL_REVIEW")) userRiskCategory = "HIGH";
    else if (riskStr.includes("MODERATE") || riskStr.includes("CAUTION")) userRiskCategory = "MODERATE";

    // 4. Family Members Context
    let familyMembersList = [];
    const dbFamilyMembers = await FamilyMember.find({ user: userId }).lean();

    if (dbFamilyMembers && dbFamilyMembers.length > 0) {
      familyMembersList = dbFamilyMembers.map((fm) => ({
        id: fm._id.toString(),
        name: fm.name,
        relationship: fm.relationship,
        age: fm.age,
        gender: fm.gender,
        healthConditions: fm.chronicConditions || fm.allergies || "No recorded chronic illness",
        riskLevel: fm.aiRiskLevel || "LOW_RISK",
        doctorApprovalStatus: fm.doctorApprovalStatus || "none",
        responsibilityAccepted: fm.responsibilityAccepted || false,
      }));
    } else if (user.familyMembers && user.familyMembers.length > 0) {
      familyMembersList = user.familyMembers.map((fm, idx) => ({
        id: fm._id ? fm._id.toString() : `embedded-${idx}`,
        name: fm.name,
        relationship: fm.relationship,
        age: fm.age,
        gender: fm.gender,
        healthConditions: fm.medicalConditions || "No recorded chronic illness",
        riskLevel: "LOW_RISK",
        doctorApprovalStatus: "none",
        responsibilityAccepted: false,
      }));
    }

    // 5. Journey Stage & Route Information
    const journeyStage = determineJourneyStage(journey);
    const center = journey?.pilgrimageCenterId || {};
    const centerName = center.name || "Pilgrimage Destination";

    const currentLocation = journey?.currentLocation || {
      address: journey?.startLocation?.address || user.address || "Start Location",
      latitude: journey?.startCoordinates?.latitude || 8.5241,
      longitude: journey?.startCoordinates?.longitude || 76.9366,
    };

    const rawDestLat = journey?.destinationCoordinates?.latitude || center?.location?.latitude;
    const rawDestLng = journey?.destinationCoordinates?.longitude || center?.location?.longitude;

    let destinationLocation = {
      latitude: rawDestLat,
      longitude: rawDestLng,
    };

    const knownMatch = findKnownDestination(centerName);
    if (knownMatch) {
      if (
        !destinationLocation.latitude ||
        !destinationLocation.longitude ||
        (knownMatch.name !== "Sabarimala" &&
          Math.abs(destinationLocation.latitude - 9.4344) < 0.05 &&
          Math.abs(destinationLocation.longitude - 77.0811) < 0.05)
      ) {
        destinationLocation.latitude = knownMatch.latitude;
        destinationLocation.longitude = knownMatch.longitude;

        if (center && center._id) {
          PilgrimageCenter.updateOne(
            { _id: center._id },
            { $set: { "location.latitude": knownMatch.latitude, "location.longitude": knownMatch.longitude, "location.city": knownMatch.city, "location.state": knownMatch.state } }
          ).catch(() => {});
        }
        if (journey && journey._id) {
          Journey.updateOne(
            { _id: journey._id },
            { $set: { "destinationCoordinates.latitude": knownMatch.latitude, "destinationCoordinates.longitude": knownMatch.longitude } }
          ).catch(() => {});
        }
      }
    }

    if (!destinationLocation.latitude || !destinationLocation.longitude) {
      destinationLocation.latitude = knownMatch ? knownMatch.latitude : 10.6811;
      destinationLocation.longitude = knownMatch ? knownMatch.longitude : 79.8458;
    }

    // 6. Weather Context
    let weatherData = null;
    try {
      const lat = currentLocation.latitude || destinationLocation.latitude || 8.5241;
      const lon = currentLocation.longitude || destinationLocation.longitude || 76.9366;
      const centerId = center._id ? center._id.toString() : "current_loc";
      weatherData = await weatherService.fetchWeatherData(centerId, lat, lon, centerName);
    } catch (weatherErr) {
      console.warn("Weather fetch notice in assistant context:", weatherErr.message);
    }

    // 7. Structured Context Snapshot
    const context = {
      user: {
        id: user._id.toString(),
        name: user.name,
        age: user.age,
        gender: user.gender,
        bloodGroup: user.bloodGroup,
        healthInfo: {
          chronicDiseases: user.healthInfo?.chronicDiseases || user.medicalInfo?.existingConditions?.join(", ") || "None",
          allergies: user.healthInfo?.allergies || user.medicalInfo?.drugAllergies || "None",
          medications: user.healthInfo?.currentMedicines || user.medicalInfo?.currentMedications || "None",
        },
        riskLevel: userRiskCategory,
        rawRiskLevel: userRiskLevel,
        doctorApprovalStatus: userDoctorStatus,
        responsibilityAccepted: userResponsibilityAccepted,
      },
      journey: journey
        ? {
            id: journey._id.toString(),
            journeyId: journey._id.toString(),
            destination: centerName,
            destinationName: centerName,
            destinationPlaceId: center._id ? center._id.toString() : null,
            destinationLatitude: destinationLocation.latitude,
            destinationLongitude: destinationLocation.longitude,
            googleMapsUrl: center.location?.googleMapsUrl || `https://maps.google.com/?q=${destinationLocation.latitude},${destinationLocation.longitude}`,
            status: journey.status || "IN_PROGRESS",
            journeyStage,
            progressPercentage: journey.progressPercentage || 0,
            distanceTravelled: journey.distanceTravelled || 0,
            distanceRemaining: journey.distanceRemaining || 0,
            totalDistance: journey.totalDistance || 0,
            estimatedArrivalTime: journey.estimatedArrivalTime || "ETA unavailable",
            transportMode: journey.transportMode || "Walking",
            walkingLevel: journey.walkingLevel || "Moderate",
            currentLocation: {
              address: currentLocation.address || "Current Location",
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            },
            destinationLocation: {
              name: centerName,
              destinationName: centerName,
              latitude: destinationLocation.latitude,
              longitude: destinationLocation.longitude,
              address: center.location?.address || center.location?.city || "Destination",
              city: center.location?.city || "",
              state: center.location?.state || "",
              googleMapsUrl: center.location?.googleMapsUrl || `https://maps.google.com/?q=${destinationLocation.latitude},${destinationLocation.longitude}`,
              placeId: center._id ? center._id.toString() : null,
            },
            totalPilgrims: journey.totalPilgrims || 1,
          }
        : null,
      familyMembers: familyMembersList,
      weather: weatherData
        ? {
            temperature: weatherData.temperature,
            condition: weatherData.condition,
            feelsLike: weatherData.feelsLike,
            humidity: weatherData.humidity,
            rainProbability: weatherData.rainProbability,
            weatherRisk: weatherData.weatherRisk,
            riskReasons: weatherData.riskReasons,
          }
        : null,
    };

    return context;
  } catch (err) {
    console.error("Error collecting journey context:", err);
    throw err;
  }
}

/**
 * Keyword-based Emergency Detector
 */
function detectEmergencyIntent(userMessage) {
  if (!userMessage || typeof userMessage !== "string") return false;
  const lower = userMessage.toLowerCase();
  const emergencyKeywords = [
    "injured",
    "injury",
    "cannot breathe",
    "can't breathe",
    "breathless",
    "collapsed",
    "collapse",
    "unconscious",
    "fainted",
    "chest pain",
    "heart attack",
    "bleeding",
    "head injury",
    "snake bite",
    "emergency help",
    "need help urgently",
    "call ambulance",
    "severe pain",
    "fracture",
  ];

  return emergencyKeywords.some((kw) => lower.includes(kw));
}

/**
 * Query Classifier to identify user intent
 */
function classifyUserIntent(message) {
  const m = message.toLowerCase();

  if (m.includes("hospital") || m.includes("doctor") || m.includes("medical camp") || m.includes("clinic")) {
    return "NEARBY_HOSPITALS";
  }
  if (m.includes("pharmacy") || m.includes("medicine") || m.includes("chemist")) {
    return "NEARBY_PHARMACIES";
  }
  if (m.includes("rest") || m.includes("break") || m.includes("toilet") || m.includes("washroom") || m.includes("stop")) {
    return "REST_RECOMMENDATION";
  }
  if (m.includes("weather") || m.includes("rain") || m.includes("temperature") || m.includes("climate") || m.includes("storm")) {
    return "WEATHER_QUERY";
  }
  if (m.includes("continue") || m.includes("can i proceed") || m.includes("should i travel") || m.includes("safe to go")) {
    return "CONTINUE_JOURNEY_QUERY";
  }
  if (m.includes("progress") || m.includes("how is my journey") || m.includes("where am i") || m.includes("eta")) {
    return "JOURNEY_PROGRESS_QUERY";
  }
  if (m.includes("family") || m.includes("member") || m.includes("father") || m.includes("mother") || m.includes("wife") || m.includes("husband") || m.includes("son") || m.includes("daughter")) {
    return "FAMILY_QUERY";
  }
  if (m.includes("food") || m.includes("hotel") || m.includes("stay") || m.includes("accommodation") || m.includes("eat") || m.includes("water")) {
    return "NEARBY_AMENITIES";
  }
  return "GENERAL_GUIDANCE";
}

const PILGRIMAGE_DESTINATION_MAP = [
  {
    name: "Sabarimala",
    keywords: ["sabarimala", "sabrimala", "sabari mala", "pamba", "sannidhanam"],
    latitude: 9.4344,
    longitude: 77.0811,
    city: "Pathanamthitta",
    state: "Kerala",
    address: "Sabarimala Temple, Periyar Tiger Reserve, Pathanamthitta, Kerala 689662",
    googleMapsUrl: "https://maps.google.com/?q=9.4344,77.0811"
  },
  {
    name: "Velankanni",
    keywords: ["velankanni", "vailankanni", "velkanni", "velakkani", "velankani", "our lady of health", "velanganni"],
    latitude: 10.6811,
    longitude: 79.8458,
    city: "Velankanni",
    state: "Tamil Nadu",
    address: "Basilica of Our Lady of Good Health, Velankanni, Nagapattinam, Tamil Nadu 611111",
    googleMapsUrl: "https://maps.google.com/?q=10.6811,79.8458"
  },
  {
    name: "Tirupati",
    keywords: ["tirupati", "tirumala", "tirupathi", "venkateswara", "balaji"],
    latitude: 13.6288,
    longitude: 79.4192,
    city: "Tirupati",
    state: "Andhra Pradesh",
    address: "Tirumala Venkateswara Temple, Tirupati, Andhra Pradesh 517504",
    googleMapsUrl: "https://maps.google.com/?q=13.6288,79.4192"
  },
  {
    name: "Kedarnath",
    keywords: ["kedarnath", "kedar"],
    latitude: 30.7346,
    longitude: 79.0669,
    city: "Rudraprayag",
    state: "Uttarakhand",
    address: "Kedarnath Temple, Rudraprayag, Uttarakhand 246445",
    googleMapsUrl: "https://maps.google.com/?q=30.7346,79.0669"
  },
  {
    name: "Badrinath",
    keywords: ["badrinath", "badri"],
    latitude: 30.7433,
    longitude: 79.4938,
    city: "Chamoli",
    state: "Uttarakhand",
    address: "Badrinath Temple, Badrinath, Uttarakhand 246422",
    googleMapsUrl: "https://maps.google.com/?q=30.7433,79.4938"
  },
  {
    name: "Amarnath",
    keywords: ["amarnath", "amarnath cave"],
    latitude: 34.2155,
    longitude: 75.5038,
    city: "Anantnag",
    state: "Jammu and Kashmir",
    address: "Amarnath Cave Temple, Baltal-Pahlgam Route, Jammu and Kashmir 192231",
    googleMapsUrl: "https://maps.google.com/?q=34.2155,75.5038"
  },
  {
    name: "Varanasi",
    keywords: ["varanasi", "kashi", "banaras", "kashi vishwanath"],
    latitude: 25.3176,
    longitude: 82.9739,
    city: "Varanasi",
    state: "Uttar Pradesh",
    address: "Kashi Vishwanath Temple, Lahori Tola, Varanasi, Uttar Pradesh 221001",
    googleMapsUrl: "https://maps.google.com/?q=25.3176,82.9739"
  },
  {
    name: "Haridwar",
    keywords: ["haridwar", "hardwar", "har ki pauri"],
    latitude: 29.9457,
    longitude: 78.1642,
    city: "Haridwar",
    state: "Uttarakhand",
    address: "Har Ki Pauri, Haridwar, Uttarakhand 249401",
    googleMapsUrl: "https://maps.google.com/?q=29.9457,78.1642"
  },
  {
    name: "Golden Temple",
    keywords: ["golden temple", "amritsar", "harmandir sahib"],
    latitude: 31.6200,
    longitude: 74.8765,
    city: "Amritsar",
    state: "Punjab",
    address: "Golden Temple, Golden Temple Road, Amritsar, Punjab 143006",
    googleMapsUrl: "https://maps.google.com/?q=31.6200,74.8765"
  },
  {
    name: "Palani",
    keywords: ["palani", "dhandayuthapani"],
    latitude: 10.4500,
    longitude: 77.5200,
    city: "Palani",
    state: "Tamil Nadu",
    address: "Arulmigu Dhandayuthapani Swamy Temple, Palani, Dindigul, Tamil Nadu 624601",
    googleMapsUrl: "https://maps.google.com/?q=10.4500,77.5200"
  },
  {
    name: "Guruvayur",
    keywords: ["guruvayur", "guruvayoor"],
    latitude: 10.5946,
    longitude: 76.0369,
    city: "Guruvayur",
    state: "Kerala",
    address: "Guruvayur Temple, Guruvayur, Thrissur, Kerala 680101",
    googleMapsUrl: "https://maps.google.com/?q=10.5946,76.0369"
  },
  {
    name: "Madurai",
    keywords: ["madurai", "meenakshi temple", "meenakshi amman"],
    latitude: 9.9195,
    longitude: 78.1193,
    city: "Madurai",
    state: "Tamil Nadu",
    address: "Arulmigu Meenakshi Sundareswarar Temple, Madurai, Tamil Nadu 625001",
    googleMapsUrl: "https://maps.google.com/?q=9.9195,78.1193"
  },
  {
    name: "Rameshwaram",
    keywords: ["rameshwaram", "rameshwar", "ramanathaswamy"],
    latitude: 9.2876,
    longitude: 79.3129,
    city: "Rameshwaram",
    state: "Tamil Nadu",
    address: "Ramanathaswamy Temple, Rameswaram, Tamil Nadu 623526",
    googleMapsUrl: "https://maps.google.com/?q=9.2876,79.3129"
  },
  {
    name: "Puri Jagannath",
    keywords: ["puri", "jagannath", "puri jagannath"],
    latitude: 19.8135,
    longitude: 85.8312,
    city: "Puri",
    state: "Odisha",
    address: "Shree Jagannatha Temple, Puri, Odisha 752001",
    googleMapsUrl: "https://maps.google.com/?q=19.8135,85.8312"
  },
  {
    name: "Shirdi",
    keywords: ["shirdi", "sai baba"],
    latitude: 19.7667,
    longitude: 74.4762,
    city: "Shirdi",
    state: "Maharashtra",
    address: "Shree Saibaba Sansthan Temple, Shirdi, Ahmednagar, Maharashtra 423109",
    googleMapsUrl: "https://maps.google.com/?q=19.7667,74.4762"
  },
  {
    name: "Vaishno Devi",
    keywords: ["vaishno devi", "vaishnodevi", "katra"],
    latitude: 33.0308,
    longitude: 74.9490,
    city: "Katra",
    state: "Jammu and Kashmir",
    address: "Shri Mata Vaishno Devi Katra, Reasi, Jammu and Kashmir 182301",
    googleMapsUrl: "https://maps.google.com/?q=33.0308,74.9490"
  }
];

function findKnownDestination(searchString) {
  if (!searchString || typeof searchString !== "string") return null;
  const lower = searchString.toLowerCase();
  for (const item of PILGRIMAGE_DESTINATION_MAP) {
    if (item.keywords.some((kw) => lower.includes(kw))) {
      return item;
    }
  }
  return null;
}

/**
 * Extract visiting destination name from user message if user expresses visiting intent
 */
function extractDestinationFromMessage(message) {
  if (!message || typeof message !== "string") return null;
  const lower = message.toLowerCase();

  const known = findKnownDestination(lower);
  if (known) return known.name;

  const destinationPatterns = [
    /(?:going to visit|visiting|going to|traveling to|travelling to|planning to visit|trip to|destination is|head to|headed to)\s+([a-z0-9\s]+)/i,
    /(?:visit|destination)\s+([a-z0-9\s]+)/i
  ];

  for (const pattern of destinationPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim().replace(/[.,!?]/g, "");
      const stopwords = ["today", "now", "tomorrow", "next week", "my family", "a hospital", "a doctor", "a rest stop"];
      if (extracted.length >= 3 && !stopwords.includes(extracted.toLowerCase())) {
        return extracted;
      }
    }
  }

  return null;
}

/**
 * Update user's active journey destination when user specifies a visiting place in chat
 */
async function handleDestinationSwitch(userId, destinationName) {
  try {
    const knownDest = findKnownDestination(destinationName);

    const searchRegex = new RegExp((destinationName || "").replace(/sabrimala/i, "sabarimala"), "i");
    let center = await PilgrimageCenter.findOne({
      $or: [
        { name: searchRegex },
        { "location.city": searchRegex },
        { "location.state": searchRegex },
        { description: searchRegex }
      ]
    });

    if (!center && knownDest) {
      center = await PilgrimageCenter.create({
        name: `${knownDest.name} Pilgrimage Center`,
        religion: "Hindu",
        description: `Revered pilgrimage center located at ${knownDest.name}, ${knownDest.city}, ${knownDest.state}.`,
        contact: { phone: "+91 1800 123 4567", website: knownDest.googleMapsUrl },
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
        location: {
          address: knownDest.address,
          city: knownDest.city,
          state: knownDest.state,
          country: "India",
          postalCode: "600001",
          latitude: knownDest.latitude,
          longitude: knownDest.longitude,
          googleMapsUrl: knownDest.googleMapsUrl
        },
        timings: { openingTime: "05:00 AM", closingTime: "09:00 PM" },
        visitingInformation: { bestSeason: "All Year", climate: "Moderate", crowdLevel: "Moderate" },
        difficulty: { walking: "Moderate", elevation: "Standard", healthcareAvailability: "Local clinics available" },
        isActive: true
      });
    }

    if (!center) {
      const capName = destinationName.charAt(0).toUpperCase() + destinationName.slice(1);
      center = await PilgrimageCenter.create({
        name: `${capName} Pilgrimage Center`,
        religion: "Hindu",
        description: `Pilgrimage center located at ${capName}.`,
        contact: { phone: "+91 1800 123 4567" },
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
        location: {
          address: `${capName} Region`,
          city: capName,
          state: "India",
          country: "India",
          postalCode: "600001",
          latitude: 10.6811, // Default fallback coordinate for unlisted Tamil Nadu/India places
          longitude: 79.8458,
          googleMapsUrl: ""
        },
        timings: { openingTime: "05:00 AM", closingTime: "09:00 PM" },
        visitingInformation: { bestSeason: "All Year", climate: "Moderate", crowdLevel: "Moderate" },
        difficulty: { walking: "Moderate", elevation: "Standard", healthcareAvailability: "Local clinics available" },
        isActive: true
      });
    } else if (knownDest && center) {
      // Ensure coordinates in DB match known destination
      if (Math.abs((center.location?.latitude || 0) - knownDest.latitude) > 0.05 || Math.abs((center.location?.longitude || 0) - knownDest.longitude) > 0.05) {
        center.location = center.location || {};
        center.location.latitude = knownDest.latitude;
        center.location.longitude = knownDest.longitude;
        center.location.city = knownDest.city;
        center.location.state = knownDest.state;
        await PilgrimageCenter.updateOne(
          { _id: center._id },
          {
            $set: {
              "location.latitude": knownDest.latitude,
              "location.longitude": knownDest.longitude,
              "location.city": knownDest.city,
              "location.state": knownDest.state
            }
          }
        );
      }
    }

    const finalLat = center.location?.latitude || (knownDest ? knownDest.latitude : 10.6811);
    const finalLng = center.location?.longitude || (knownDest ? knownDest.longitude : 79.8458);

    // Update all active user journeys in MongoDB so destination is strictly synchronized
    await Journey.updateMany(
      { userId, status: { $in: ["IN_PROGRESS", "active", "ready", "planned", "PAUSED"] } },
      {
        $set: {
          pilgrimageCenterId: center._id,
          destinationCoordinates: {
            latitude: finalLat,
            longitude: finalLng
          },
          status: "IN_PROGRESS"
        }
      }
    );

    let journey = await Journey.findOne({
      userId,
      status: { $in: ["IN_PROGRESS", "active", "ready", "planned", "PAUSED"] }
    }).sort({ updatedAt: -1 });

    if (!journey) {
      journey = new Journey({
        userId,
        pilgrimageCenterId: center._id,
        journeyDate: new Date(),
        returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        totalPilgrims: 1,
        transportMode: "Walking",
        walkingLevel: "Moderate",
        status: "IN_PROGRESS",
        progressPercentage: 0,
        destinationCoordinates: {
          latitude: finalLat,
          longitude: finalLng
        }
      });
      await journey.save();
    }

    return { center, journey };
  } catch (err) {
    console.error("Error in handleDestinationSwitch:", err);
    return null;
  }
}

/**
 * Helper to extract destination/current coordinates for nearby services lookup
 */
function getQueryCoordinates(context, userMessage = "") {
  const msg = (userMessage || "").toLowerCase();
  const isExplicitNearMe =
    msg.includes("near me") ||
    msg.includes("around me") ||
    msg.includes("near my location") ||
    msg.includes("near my current position") ||
    msg.includes("my current gps");

  const destLat = context.journey?.destinationLatitude || context.journey?.destinationLocation?.latitude;
  const destLng = context.journey?.destinationLongitude || context.journey?.destinationLocation?.longitude;

  const currentLat = context.journey?.currentLocation?.latitude;
  const currentLng = context.journey?.currentLocation?.longitude;

  const destName = context.journey?.destinationName || context.journey?.destination || context.journey?.destinationLocation?.name || "your destination";
  const journeyId = context.journey?.journeyId || context.journey?.id || "active";

  if (isExplicitNearMe && currentLat && currentLng) {
    return { lat: currentLat, lng: currentLng, destName: "your current location", journeyId, isNearMe: true };
  }

  // ALWAYS default to destination location coordinates for all destination queries
  const lat = destLat || 9.4344;
  const lng = destLng || 77.0811;

  return { lat, lng, destName, journeyId, isNearMe: false };
}

/**
 * Process AI Assistant Chat Message
 */
async function processAssistantChat(userId, userMessage, explicitJourneyId = null) {
  // 1. Check if user expresses visiting a specific destination (e.g. Sabarimala)
  const detectedDestName = extractDestinationFromMessage(userMessage);
  let destinationSwitchResult = null;
  if (detectedDestName) {
    destinationSwitchResult = await handleDestinationSwitch(userId, detectedDestName);
  }

  // 2. Collect current journey context (will use updated destination if switched)
  const context = await collectJourneyContext(
    userId,
    destinationSwitchResult?.journey?._id || explicitJourneyId
  );

  const isEmergency = detectEmergencyIntent(userMessage);

  let responseText = "";
  let suggestedPlaces = [];

  // DESTINATION SWITCH ACKNOWLEDGEMENT FLOW
  if (destinationSwitchResult && destinationSwitchResult.center) {
    const center = destinationSwitchResult.center;
    responseText = `🙏 **Destination Updated: ${center.name}**\n\nI have updated your active pilgrimage destination context to **${center.name}** (${center.location?.city || center.name}, ${center.location?.state || ''}).\n\n- **Weather Advisory**: ${context.weather ? `${context.weather.temperature}°C, ${context.weather.condition}` : 'Updated'}\n- **Trek Difficulty**: ${center.difficulty?.walking || 'Moderate'}\n- **Health Clearance Risk**: ${context.user?.riskLevel} Risk\n\nHow can I guide your journey to **${center.name}** today?`;

    return {
      message: responseText,
      sender: "assistant",
      isEmergency: false,
      contextSnapshot: {
        journeyStage: context.journey?.journeyStage || "Unknown",
        riskLevel: context.user?.riskLevel || "LOW",
        doctorApprovalStatus: context.user?.doctorApprovalStatus || "none",
        locationName: context.journey?.currentLocation?.address || "Current Location",
        weatherCondition: context.weather?.condition || "Clear",
      },
      context,
      suggestedPlaces,
    };
  }

  const { lat: queryLat, lng: queryLng, destName, journeyId: activeJourneyId } = getQueryCoordinates(context, userMessage);

  // EMERGENCY FLOW
  if (isEmergency) {
    let nearbyHospitals = [];
    try {
      nearbyHospitals = await nearbyPlacesService.getNearbyServices(queryLat, queryLng, 15, "hospitals", "No preference", destName, activeJourneyId);
    } catch (_) {}

    const nearestHosp = nearbyHospitals[0];

    responseText = `🚨 **EMERGENCY ALERT**\nPlease seek immediate assistance from nearby emergency services or medical personnel near **${destName}**!`;
    if (nearestHosp) {
      responseText += `\n\n**Nearest Medical Facility:**\n📍 **${nearestHosp.name}**\nAddress: ${nearestHosp.address}\nDistance: ${nearestHosp.distanceKm} km away`;
      if (nearestHosp.contact?.phone) {
        responseText += `\nEmergency Phone: ${nearestHosp.contact.phone}`;
      }
      suggestedPlaces = nearbyHospitals.slice(0, 3);
    }
    responseText += `\n\nIf you are on a pilgrim route, contact local helpline **108** or seek immediate assistance at the nearest pilgrim medical camp.`;

    return {
      message: responseText,
      sender: "assistant",
      isEmergency: true,
      contextSnapshot: {
        journeyStage: context.journey?.journeyStage || "Unknown",
        riskLevel: context.user?.riskLevel || "LOW",
        doctorApprovalStatus: context.user?.doctorApprovalStatus || "none",
        locationName: context.journey?.currentLocation?.address || "Current Location",
        weatherCondition: context.weather?.condition || "Clear",
      },
      context,
      suggestedPlaces,
    };
  }

  // INTENT CLASSIFICATION & DOMAIN ENGINE
  const intent = classifyUserIntent(userMessage);

  if (intent === "NEARBY_HOSPITALS") {
    try {
      suggestedPlaces = await nearbyPlacesService.getNearbyServices(queryLat, queryLng, 15, "hospitals", "No preference", destName, activeJourneyId);
    } catch (_) {}

    if (suggestedPlaces.length > 0) {
      responseText = `I have located the nearest medical facilities relative to **${destName}**:\n\n`;
      suggestedPlaces.slice(0, 3).forEach((p, idx) => {
        responseText += `${idx + 1}. **${p.name}** (${p.distanceKm} km away) - ${p.address}\n`;
      });
      responseText += `\nIf you or any pilgrim family member feels unwell, please visit the nearest hospital or contact emergency services (108).`;
    } else {
      responseText = `I am unable to retrieve exact hospital locations near **${destName}** right now. Please seek assistance at the nearest medical camp or call 108.`;
    }
  } else if (intent === "NEARBY_PHARMACIES") {
    try {
      suggestedPlaces = await nearbyPlacesService.getNearbyServices(queryLat, queryLng, 10, "pharmacies", "No preference", destName, activeJourneyId);
    } catch (_) {}

    if (suggestedPlaces.length > 0) {
      responseText = `Here are the nearest pharmacies available near **${destName}**:\n\n`;
      suggestedPlaces.slice(0, 3).forEach((p, idx) => {
        responseText += `${idx + 1}. **${p.name}** (${p.distanceKm} km away) - ${p.address}\n`;
      });
      responseText += `\nEnsure you carry your required daily prescriptions and stay hydrated.`;
    } else {
      responseText = `No specific pharmacy was found within 10 km of **${destName}**. Please check the nearest pilgrimage base camp for medical supplies.`;
    }
  } else if (intent === "CONTINUE_JOURNEY_QUERY") {
    const riskLevel = context.user.riskLevel;
    const docStatus = context.user.doctorApprovalStatus;
    const weatherRisk = context.weather?.weatherRisk || "LOW";

    if ((riskLevel === "HIGH" || riskLevel === "CRITICAL") && docStatus !== "approved") {
      responseText = `🛑 **Medical Approval Required Before Continuing**\n\nYour current health evaluation risk status is **${riskLevel} Risk**. Standard pilgrimage safety protocols require doctor clearance before resuming heavy physical trekking or climbing.\n\nPlease complete the physician review workflow in your PilgrimIQ dashboard before continuing your journey.`;
    } else if (weatherRisk === "HIGH") {
      responseText = `⚠️ **Weather Advisory Warning**\n\nCurrent weather forecast indicates severe conditions (${context.weather?.condition || "Severe weather"}, Rain prob: ${context.weather?.rainProbability}%). We advise temporarily holding movement at a safe shelter or base camp until conditions stabilize.`;
    } else if (docStatus === "approved") {
      responseText = `✅ **Approved to Continue**\n\nYour medical review has been completed and approved by a physician. Current weather conditions (${context.weather?.condition || "Favorable"}, ${context.weather?.temperature || 25}°C) are suitable for continuing your journey at a steady, comfortable pace.`;
    } else {
      responseText = `Your current journey stage is **${context.journey?.journeyStage || "In Progress"}**. Weather conditions (${context.weather?.temperature || 25}°C, ${context.weather?.condition || "Clear"}) appear suitable for continuing your pilgrimage. Stay hydrated and take periodic rest breaks.`;
    }
  } else if (intent === "JOURNEY_PROGRESS_QUERY") {
    if (!context.journey) {
      responseText = `You currently do not have an active journey logged. You can plan or select a pilgrimage center from your PilgrimIQ Journey Planner.`;
    } else {
      const j = context.journey;
      responseText = `📍 **Journey Progress Summary**\n\n- **Current Stage**: ${j.journeyStage}\n- **Destination**: ${j.destination}\n- **Progress**: ${j.progressPercentage}% Completed\n- **Distance Travelled**: ${j.distanceTravelled} km\n- **Distance Remaining**: ${j.distanceRemaining} km\n- **Estimated Arrival Time**: ${j.estimatedArrivalTime}\n\nMaintain a comfortable walking pace and keep hydrated!`;
    }
  } else if (intent === "WEATHER_QUERY") {
    if (!context.weather) {
      responseText = `Weather information is currently unavailable for your location. Please check your weather card in the PilgrimIQ dashboard.`;
    } else {
      const w = context.weather;
      responseText = `☀️ **Weather Information**\n\n- **Location/Destination**: ${context.journey?.destination || "Pilgrimage Region"}\n- **Temperature**: ${w.temperature}°C (Feels like ${w.feelsLike}°C)\n- **Condition**: ${w.condition}\n- **Humidity**: ${w.humidity}%\n- **Rain Probability**: ${w.rainProbability}%\n- **Weather Safety Status**: ${w.weatherRisk} Risk\n\n${w.weatherRisk === "HIGH" ? "⚠️ Advisory: Weather conditions may be challenging. Consider waiting for improvement." : "Current weather conditions appear suitable for continuing your journey."}`;
    }
  } else if (intent === "REST_RECOMMENDATION") {
    try {
      suggestedPlaces = await nearbyPlacesService.getNearbyServices(queryLat, queryLng, 10, "restrooms");
    } catch (_) {}

    responseText = `🛋️ **Rest & Hydration Guidance for ${destName}**\n\nBased on your journey progress (${context.journey?.journeyStage || "Walking"}), it is essential to take a 10–15 minute break every hour during uphill trekking. Drink water regularly and sit in shaded areas.`;

    if (suggestedPlaces.length > 0) {
      responseText += `\n\n**Nearby Rest Points / Facilities near ${destName}:**\n`;
      suggestedPlaces.slice(0, 3).forEach((p, idx) => {
        responseText += `${idx + 1}. **${p.name}** (${p.distanceKm} km away) - ${p.address}\n`;
      });
    }
  } else if (intent === "FAMILY_QUERY") {
    if (!context.familyMembers || context.familyMembers.length === 0) {
      responseText = `You have not registered any family members in your PilgrimIQ profile. You can add family members under the **My Family** tab in your dashboard.`;
    } else {
      responseText = `👨‍👩‍👧‍👦 **Family Members Context**\n\nYou have ${context.familyMembers.length} family member(s) listed:\n\n`;
      context.familyMembers.forEach((fm, idx) => {
        responseText += `${idx + 1}. **${fm.name}** (${fm.relationship}, Age: ${fm.age || "N/A"})\n`;
        responseText += `   - Health Note: ${fm.healthConditions}\n`;
        responseText += `   - Medical Risk: ${fm.riskLevel} | Approval: ${fm.doctorApprovalStatus}\n`;
      });
      responseText += `\nOnly you as the main account holder can manage journey itineraries and tracking for your family.`;
    }
  } else if (intent === "NEARBY_AMENITIES") {
    try {
      suggestedPlaces = await nearbyPlacesService.getNearbyServices(queryLat, queryLng, 10, "restaurants");
    } catch (_) {}

    responseText = `🍽️ **Food & Accommodation Guidance near ${destName}**\n\nEnsure you consume light satvik meals or fresh fruits while traveling to prevent fatigue.`;
    if (suggestedPlaces.length > 0) {
      responseText += `\n\n**Nearby Food Points near ${destName}:**\n`;
      suggestedPlaces.slice(0, 3).forEach((p, idx) => {
        responseText += `${idx + 1}. **${p.name}** (${p.distanceKm} km away) - ${p.address}\n`;
      });
    }
  } else {
    // GENERAL GUIDANCE
    const stage = context.journey?.journeyStage || "Journey In Progress";
    responseText = `Welcome to **PilgrimIQ Journey Assistant**. Your journey is currently in state: **${stage}**.\n\nBased on your profile (${context.user.name}, Health Risk: ${context.user.riskLevel}) and active route details, I can assist you with:\n- Current travel progress & ETA\n- Weather advisories & continuation safety\n- Nearest hospitals, pharmacies, rest stops & food facilities\n- Family member travel guidance\n\nHow may I help you further on your pilgrimage today?`;
  }

  return {
    message: responseText,
    sender: "assistant",
    isEmergency: false,
    contextSnapshot: {
      journeyStage: context.journey?.journeyStage || "Unknown",
      riskLevel: context.user?.riskLevel || "LOW",
      doctorApprovalStatus: context.user?.doctorApprovalStatus || "none",
      locationName: context.journey?.currentLocation?.address || "Current Location",
      weatherCondition: context.weather?.condition || "Clear",
    },
    context,
    suggestedPlaces,
  };
}

module.exports = {
  collectJourneyContext,
  processAssistantChat,
  detectEmergencyIntent,
  determineJourneyStage,
};
