const { calculateJourneyPsi } = require("../services/psiService");

/**
 * @desc    Calculate or retrieve Pilgrim Safety Index (PSI) for a journey
 * @route   POST /api/travel-assessment/psi
 * @route   GET /api/travel-assessment/psi/:journeyId
 * @access  Private (Authenticated User)
 */
const getTravelAssessmentPsi = async (req, res, next) => {
  try {
    const journeyId = req.params.journeyId || req.body.journeyId;
    const forceRefresh = req.body.forceRefresh === true || req.query.refresh === "true";

    if (!journeyId) {
      return res.status(400).json({
        success: false,
        message: "journeyId is required to calculate Pilgrim Safety Index.",
      });
    }

    const assessment = await calculateJourneyPsi(journeyId, req.user._id, forceRefresh);

    return res.status(200).json({
      success: true,
      data: {
        journeyId: assessment.journeyId,
        pilgrimageCenterId: assessment.pilgrimageCenterId,
        journeyDate: assessment.journeyDate,
        assessmentStatus: assessment.assessmentStatus,
        missingInputs: assessment.missingInputs,

        health: {
          score: assessment.healthRiskScore,
          level: assessment.healthRiskLevel,
          details: assessment.healthDetails,
        },

        crowd: {
          score: assessment.crowdRiskScore,
          level: assessment.crowdRiskLevel,
          details: assessment.crowdDetails,
        },

        weather: {
          score: assessment.weatherRiskScore,
          level: assessment.weatherRiskLevel,
          details: assessment.weatherDetails,
        },

        psi: {
          score: assessment.psiScore,
          level: assessment.psiLevel,
        },

        factors: assessment.factors,
        familyMembersAssessments: assessment.familyMembersAssessments,
        familyOverallStatus: assessment.familyOverallStatus,
        familyHighestRiskReason: assessment.familyHighestRiskReason,
        medicalReviewRequired: assessment.medicalReviewRequired,
        doctorApprovalStatus: assessment.doctorApprovalStatus,
        isBlockedByPhysician: assessment.isBlockedByPhysician,
        recommendations: assessment.recommendations,
        assessmentSummary: assessment.assessmentSummary,
        updatedAt: assessment.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error in getTravelAssessmentPsi controller:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to calculate the Pilgrim Safety Index right now.",
      error: error.message,
    });
  }
};

module.exports = {
  getTravelAssessmentPsi,
};
