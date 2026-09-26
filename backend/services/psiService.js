const Journey = require("../models/Journey");
const PilgrimageCenter = require("../models/PilgrimageCenter");
const FamilyMember = require("../models/FamilyMember");
const User = require("../models/User");
const MedicalReport = require("../models/MedicalReport");
const TravelAssessment = require("../models/TravelAssessment");
const { predictCrowd } = require("./mlService");
const { fetchWeatherData } = require("./weatherService");
const {
  PSI_WEIGHTS,
  normalizeRiskScore,
  getPsiRiskLevel,
} = require("../config/psiConfig");

/**
 * Fallback crowd risk score calculation if ML call fails
 */
const getFallbackCrowdScore = (centerName, dateStr) => {
  const d = new Date(dateStr);
  const dayOfWeek = d.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  let hash = 0;
  for (let i = 0; i < centerName.length; i++) {
    hash = (hash << 5) - hash + centerName.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash) % 25000;
  const baseVisitors = 28000 + seed + (isWeekend ? 12000 : 0);

  if (baseVisitors > 65000) return { score: 95, level: "VERY_HIGH", visitors: baseVisitors };
  if (baseVisitors > 40000) return { score: 75, level: "HIGH", visitors: baseVisitors };
  if (baseVisitors > 22000) return { score: 50, level: "MODERATE", visitors: baseVisitors };
  return { score: 20, level: "LOW", visitors: baseVisitors };
};

/**
 * Retrieves latest medical risk assessment for a user or family member
 */
const fetchMedicalAssessment = async (userId, familyMemberId = null) => {
  let query = { userId };
  if (familyMemberId) {
    query.ownerType = "family_member";
    query.familyMemberId = familyMemberId;
  } else {
    query.ownerType = "user";
  }

  // Fetch latest uploaded medical report
  const latestReport = await MedicalReport.findOne(query).sort({ createdAt: -1 });

  if (latestReport) {
    let rawStatus = latestReport.finalStatus || latestReport.aiRiskAssessment?.overallStatus || "LOW_RISK";
    let physicianRequired = latestReport.physicianReview?.required || rawStatus === "MEDICAL_REVIEW_REQUIRED" || rawStatus === "PHYSICIAN_NOT_APPROVED";
    let physicianStatus = latestReport.physicianReview?.status || "none";

    const isRejectedOrCritical =
      physicianStatus === "rejected" ||
      physicianStatus === "not_approved" ||
      physicianStatus === "Not_approved" ||
      rawStatus === "PHYSICIAN_NOT_APPROVED" ||
      rawStatus === "REJECTED" ||
      rawStatus === "CRITICAL" ||
      rawStatus === "CRITICAL_RISK";

    let score = isRejectedOrCritical ? 90 : normalizeRiskScore(rawStatus, 20);
    let level = isRejectedOrCritical ? "PHYSICIAN_NOT_APPROVED" : rawStatus;

    return {
      available: true,
      score,
      level,
      aiSummary: latestReport.aiSummary || "",
      physicianRequired: physicianRequired || isRejectedOrCritical,
      physicianStatus,
      isRejectedOrCritical,
      reportId: latestReport._id,
      extractedMedicalData: latestReport.extractedMedicalData,
    };
  }

  // Fallback: check User or FamilyMember profile flags if report is not uploaded
  if (familyMemberId) {
    const fm = await FamilyMember.findById(familyMemberId);
    if (fm) {
      const isRejectedOrCritical =
        fm.doctorApprovalStatus === "rejected" ||
        fm.doctorApprovalStatus === "not_approved" ||
        fm.doctorApprovalStatus === "Not_approved" ||
        fm.aiRiskLevel === "HIGH_RISK" ||
        fm.aiRiskLevel === "CRITICAL" ||
        fm.aiRiskLevel === "PHYSICIAN_NOT_APPROVED";

      let score = isRejectedOrCritical ? 90 : normalizeRiskScore(fm.aiRiskLevel || "LOW_RISK", 20);
      let physicianRequired = fm.aiRiskLevel === "HIGH_RISK" || fm.doctorApprovalStatus === "pending" || isRejectedOrCritical;
      return {
        available: true,
        score,
        level: isRejectedOrCritical ? "PHYSICIAN_NOT_APPROVED" : (fm.aiRiskLevel || "LOW_RISK"),
        physicianRequired,
        physicianStatus: fm.doctorApprovalStatus || "none",
        isRejectedOrCritical,
        responsibilityAccepted: fm.responsibilityAccepted || false,
      };
    }
  } else {
    const user = await User.findById(userId);
    if (user) {
      const isRejectedOrCritical =
        user.doctorApprovalStatus === "rejected" ||
        user.doctorApprovalStatus === "not_approved" ||
        user.doctorApprovalStatus === "Not_approved" ||
        user.psiRiskLevel === "High Risk" ||
        user.psiRiskLevel === "CRITICAL";

      let userRisk = user.psiRiskLevel || "Low Risk";
      let score = isRejectedOrCritical ? 90 : normalizeRiskScore(userRisk, 20);
      let physicianRequired = user.doctorApprovalStatus === "pending" || user.doctorApprovalStatus === "rejected" || isRejectedOrCritical;
      return {
        available: true,
        score,
        level: isRejectedOrCritical ? "PHYSICIAN_NOT_APPROVED" : userRisk,
        physicianRequired,
        physicianStatus: user.doctorApprovalStatus || "none",
        isRejectedOrCritical,
        responsibilityAccepted: user.responsibilityAccepted || false,
      };
    }
  }

  return {
    available: false,
    score: null,
    level: "UNAVAILABLE",
    physicianRequired: false,
    physicianStatus: "none",
  };
};

/**
 * Retrieves crowd prediction for a center and date
 */
const fetchCrowdAssessment = async (centerName, dateStr) => {
  try {
    const mlRes = await predictCrowd({
      pilgrimage_center: centerName,
      prediction_date: dateStr,
    });

    const level = mlRes.crowd_category || mlRes.crowd_level || "MODERATE";
    const visitors = mlRes.predicted_visitors || mlRes.predicted_crowd || 25000;
    const score = normalizeRiskScore(level, 50);

    return {
      available: true,
      score,
      level: level.toUpperCase(),
      predictedVisitors: visitors,
      estimatedWaitTime: mlRes.estimated_wait_time || "30 - 45 mins",
      isFestival: mlRes.is_festival || false,
      festivalName: mlRes.festival_name || "",
    };
  } catch (err) {
    console.warn("Crowd assessment fallback used for PSI:", err.message);
    const fb = getFallbackCrowdScore(centerName, dateStr);
    return {
      available: true,
      score: fb.score,
      level: fb.level,
      predictedVisitors: fb.visitors,
      estimatedWaitTime: "30 - 45 mins",
      isFallback: true,
    };
  }
};

/**
 * Retrieves weather prediction for a center and date
 */
const fetchWeatherAssessment = async (centerId, lat, lon, centerName, dateStr) => {
  try {
    if (lat === undefined || lat === null || lon === undefined || lon === null) {
      return { available: false, error: "Center missing coordinates" };
    }

    const weatherData = await fetchWeatherData(centerId.toString(), Number(lat), Number(lon), centerName);

    let selectedWeather = null;
    if (dateStr && weatherData.forecast) {
      selectedWeather = weatherData.forecast.find((f) => f.date === dateStr);
    }

    const level = weatherData.weatherRisk || "LOW";
    const score = normalizeRiskScore(level, 20);

    return {
      available: true,
      score,
      level: level.toUpperCase(),
      temperature: selectedWeather ? selectedWeather.temp : weatherData.temperature,
      condition: selectedWeather ? selectedWeather.condition : weatherData.condition,
      rainProbability: selectedWeather ? selectedWeather.rainProbability : weatherData.rainProbability,
      humidity: weatherData.humidity,
      windSpeed: weatherData.windSpeed,
      riskReasons: weatherData.riskReasons || [],
    };
  } catch (err) {
    console.warn("Weather assessment failed for PSI:", err.message);
    return {
      available: false,
      error: err.message,
    };
  }
};

/**
 * Generates recommendations based on risk factors
 */
const generateRecommendations = (healthRes, crowdRes, weatherRes, familyRes, isBlockedByPhysician) => {
  const recommendations = [];

  if (isBlockedByPhysician) {
    recommendations.push("Physician approval or explicit travel responsibility consent is required prior to starting this journey due to elevated health indicators.");
  }

  // Health Recommendations
  if (healthRes.score >= 70) {
    recommendations.push("Follow all medical precautions and emergency instructions provided in your medical assessment.");
    recommendations.push("Carry essential prescription medicines and maintain a copy of your emergency medical summary.");
  } else if (healthRes.score >= 40) {
    recommendations.push("Maintain steady pace during walking and monitor vitals regularly during the trek.");
  }

  // Crowd Recommendations
  if (crowdRes.score >= 70) {
    recommendations.push("High crowd density expected. Consider avoiding peak queue hours (06:00 AM - 11:30 AM).");
    recommendations.push("Plan extra buffer time for darshan queues and security check points.");
  } else if (crowdRes.score >= 40) {
    recommendations.push("Moderate crowds anticipated. Follow designated pilgrimage queue lines and stay with your group.");
  }

  // Weather Recommendations
  if (weatherRes.score >= 70) {
    recommendations.push("Severe weather conditions forecasted. Monitor weather alerts and carry suitable protective gear.");
    recommendations.push("Consider delaying travel if severe rain or high temperature warnings are issued.");
  } else if (weatherRes.score >= 40) {
    recommendations.push("Carry rain umbrella/poncho and stay hydrated to combat local weather variability.");
  }

  // General Pilgrim Recommendations
  if (recommendations.length === 0) {
    recommendations.push("Conditions are favorable for pilgrimage travel. Maintain hydration and wear comfortable walking shoes.");
  }

  recommendations.push("Keep emergency contact details and offline maps accessible on your device.");

  return recommendations;
};

/**
 * Authoritative Backend PSI Calculation Service
 */
const calculateJourneyPsi = async (journeyId, userId, forceRefresh = false) => {
  // 1. Fetch Journey
  const journey = await Journey.findById(journeyId)
    .populate("pilgrimageCenterId")
    .populate("travelingFamilyMembers");

  if (!journey) {
    throw new Error("Journey not found");
  }

  if (journey.userId.toString() !== userId.toString()) {
    throw new Error("Unauthorized: Journey does not belong to user");
  }

  const center = journey.pilgrimageCenterId;
  if (!center) {
    throw new Error("Pilgrimage center not found for journey");
  }

  const journeyDateRaw = journey.journeyDate || new Date();
  const dateStr = new Date(journeyDateRaw).toISOString().split("T")[0];

  const missingInputs = [];

  // 2. Fetch Medical Assessment (Main User)
  const healthRes = await fetchMedicalAssessment(userId);
  if (!healthRes.available) {
    missingInputs.push("Medical Report Analysis");
  }

  // 3. Fetch Crowd Assessment
  const crowdRes = await fetchCrowdAssessment(center.name, dateStr);
  if (!crowdRes.available) {
    missingInputs.push("Crowd Prediction");
  }

  // 4. Fetch Weather Assessment
  const weatherRes = await fetchWeatherAssessment(
    center._id,
    center.location?.latitude,
    center.location?.longitude,
    center.name,
    dateStr
  );
  if (!weatherRes.available) {
    missingInputs.push("Weather Prediction");
  }

  // 5. Handle Incomplete Input Data
  if (missingInputs.length > 0) {
    // If any input is completely missing and unavailable, return INCOMPLETE assessment status
    const incompleteAssessment = {
      journeyId: journey._id,
      userId,
      pilgrimageCenterId: center._id,
      journeyDate: journey.journeyDate,
      assessmentStatus: "INCOMPLETE",
      missingInputs,
      healthRiskScore: healthRes.score || 0,
      healthRiskLevel: healthRes.level || "UNAVAILABLE",
      healthDetails: healthRes,
      crowdRiskScore: crowdRes.score || 0,
      crowdRiskLevel: crowdRes.level || "UNAVAILABLE",
      crowdDetails: crowdRes,
      weatherRiskScore: weatherRes.score || 0,
      weatherRiskLevel: weatherRes.level || "UNAVAILABLE",
      weatherDetails: weatherRes,
      psiScore: 0,
      psiLevel: "LOW RISK",
      factors: [],
      recommendations: [
        "PSI cannot be finalized because required assessment data is unavailable.",
        ...missingInputs.map((m) => `${m} is unavailable for this journey.`),
      ],
    };

    return incompleteAssessment;
  }

  // 6. Weighted PSI Calculation
  const healthScore = healthRes.score;
  const crowdScore = crowdRes.score;
  const weatherScore = weatherRes.score;

  const healthContrib = Math.round(healthScore * PSI_WEIGHTS.health * 100) / 100;
  const crowdContrib = Math.round(crowdScore * PSI_WEIGHTS.crowd * 100) / 100;
  const weatherContrib = Math.round(weatherScore * PSI_WEIGHTS.weather * 100) / 100;

  let rawPsi = healthContrib + crowdContrib + weatherContrib;
  const isMainUserRejected =
    healthRes.isRejectedOrCritical ||
    healthScore >= 80 ||
    healthRes.physicianStatus === "rejected" ||
    healthRes.physicianStatus === "not_approved" ||
    healthRes.physicianStatus === "Not_approved";

  if (isMainUserRejected) {
    rawPsi = Math.max(rawPsi, 80);
  }

  const psiScore = Math.max(0, Math.min(100, Math.round(rawPsi)));
  const psiLevel = getPsiRiskLevel(psiScore);

  const factors = [
    {
      name: "Health Risk",
      score: healthScore,
      weight: PSI_WEIGHTS.health,
      contribution: healthContrib,
    },
    {
      name: "Crowd Risk",
      score: crowdScore,
      weight: PSI_WEIGHTS.crowd,
      contribution: crowdContrib,
    },
    {
      name: "Weather Risk",
      score: weatherScore,
      weight: PSI_WEIGHTS.weather,
      contribution: weatherContrib,
    },
  ];

  // 7. Family Members PSI Calculation
  const familyAssessments = [];
  let highestFamilyScore = psiScore;
  let highestFamilyLevel = psiLevel;
  let familyHighestRiskReason = "";

  if (Array.isArray(journey.travelingFamilyMembers) && journey.travelingFamilyMembers.length > 0) {
    for (const fm of journey.travelingFamilyMembers) {
      const fmMed = await fetchMedicalAssessment(userId, fm._id);
      const fmHealthScore = fmMed.available ? fmMed.score : healthScore;

      const fmHealthContrib = Math.round(fmHealthScore * PSI_WEIGHTS.health * 100) / 100;
      let fmRawPsi = fmHealthContrib + crowdContrib + weatherContrib;

      const isFmRejected =
        fmMed.isRejectedOrCritical ||
        fmHealthScore >= 80 ||
        fmMed.physicianStatus === "rejected" ||
        fmMed.physicianStatus === "not_approved" ||
        fmMed.physicianStatus === "Not_approved" ||
        fm.doctorApprovalStatus === "rejected" ||
        fm.doctorApprovalStatus === "not_approved" ||
        fm.doctorApprovalStatus === "Not_approved";

      if (isFmRejected) {
        fmRawPsi = Math.max(fmRawPsi, 80);
      }

      const fmPsiScore = Math.round(fmRawPsi);
      const fmPsiLevel = getPsiRiskLevel(fmPsiScore);

      familyAssessments.push({
        familyMemberId: fm._id,
        name: fm.name,
        relationship: fm.relationship,
        healthRiskScore: fmHealthScore,
        healthRiskLevel: fmMed.level || "LOW_RISK",
        psiScore: fmPsiScore,
        psiLevel: fmPsiLevel,
        doctorApprovalStatus: fmMed.physicianStatus || fm.doctorApprovalStatus || "none",
        medicalReviewRequired: fmMed.physicianRequired || false,
      });

      if (fmPsiScore >= highestFamilyScore || isFmRejected) {
        highestFamilyScore = fmPsiScore;
        highestFamilyLevel = fmPsiLevel;
        familyHighestRiskReason = `Family member ${fm.name} (${fm.relationship}) has an elevated travel risk assessment (Doctor Status: ${fmMed.physicianStatus || fm.doctorApprovalStatus || "Not_approved"}, Health Risk: ${fmHealthScore}/100, PSI: ${fmPsiScore}/100).`;
      }
    }
  }

  const familyOverallStatus = familyAssessments.length > 0 ? highestFamilyLevel : null;

  // 8. Physician Approval & Override Workflow
  const mainUserBlocked =
    healthRes.physicianRequired &&
    healthRes.physicianStatus !== "approved" &&
    !healthRes.responsibilityAccepted;

  const familyMemberBlocked = familyAssessments.some(
    (fm) => fm.medicalReviewRequired && fm.doctorApprovalStatus !== "approved"
  );

  const isBlockedByPhysician = mainUserBlocked || familyMemberBlocked;

  // 9. Generate Explainable Recommendations
  const recommendations = generateRecommendations(
    healthRes,
    crowdRes,
    weatherRes,
    familyAssessments,
    isBlockedByPhysician
  );

  const summary = `Pilgrim Safety Index generated for ${center.name}. Health contributes ${healthScore}/100, Crowd contributes ${crowdScore}/100, Weather contributes ${weatherScore}/100. Overall safety risk is ${psiLevel}.`;

  // 10. Persist or Update TravelAssessment in DB
  let assessmentDoc = await TravelAssessment.findOne({ journeyId: journey._id });

  const assessmentData = {
    journeyId: journey._id,
    userId,
    pilgrimageCenterId: center._id,
    journeyDate: journey.journeyDate,
    healthRiskScore: healthScore,
    healthRiskLevel: healthRes.level,
    healthDetails: healthRes,
    crowdRiskScore: crowdScore,
    crowdRiskLevel: crowdRes.level,
    crowdDetails: crowdRes,
    weatherRiskScore: weatherScore,
    weatherRiskLevel: weatherRes.level,
    weatherDetails: weatherRes,
    psiScore,
    psiLevel,
    factors,
    familyMembersAssessments: familyAssessments,
    familyOverallStatus,
    familyHighestRiskReason,
    medicalReviewRequired: healthRes.physicianRequired,
    doctorApprovalStatus: healthRes.physicianStatus,
    isBlockedByPhysician,
    recommendations,
    assessmentSummary: summary,
    assessmentStatus: "COMPLETED",
    missingInputs: [],
  };

  if (assessmentDoc) {
    Object.assign(assessmentDoc, assessmentData);
    await assessmentDoc.save();
  } else {
    assessmentDoc = await TravelAssessment.create(assessmentData);
  }

  return assessmentDoc;
};

module.exports = {
  calculateJourneyPsi,
  fetchMedicalAssessment,
  fetchCrowdAssessment,
  fetchWeatherAssessment,
};
