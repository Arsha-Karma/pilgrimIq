const MedicalReport = require("../models/MedicalReport");
const User = require("../models/User");

// @desc    Get all medical report review requests for physician queue
// @route   GET /api/physician/medical-reviews
// @access  Private (Physician / Admin)
const getPhysicianReviews = async (req, res, next) => {
  try {
    const reviews = await MedicalReport.find({
      $or: [
        { "physicianReview.required": true },
        { "physicianReview.status": { $in: ["pending", "approved", "not_approved", "further_evaluation"] } },
        { finalStatus: "MEDICAL_REVIEW_REQUIRED" },
      ],
    })
      .populate("userId", "name email phone dob age gender bloodGroup")
      .populate("familyMemberId", "name relationship age gender bloodGroup chronicConditions")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single review request by report ID
// @route   GET /api/physician/medical-reviews/:id
// @access  Private (Physician / Admin)
const getPhysicianReviewById = async (req, res, next) => {
  try {
    const report = await MedicalReport.findById(req.params.id)
      .populate("userId", "name email phone dob age gender bloodGroup")
      .populate("familyMemberId", "name relationship age gender bloodGroup chronicConditions");

    if (!report) {
      res.status(404);
      throw new Error("Medical review record not found.");
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit physician review decision (Approve / Not Approved / Further Evaluation)
// @route   PUT /api/physician/medical-reviews/:id
// @access  Private (Physician / Admin)
const submitPhysicianDecision = async (req, res, next) => {
  try {
    const { decision, comments } = req.body;

    if (!["approved", "not_approved", "further_evaluation"].includes(decision)) {
      res.status(400);
      throw new Error("Invalid physician decision. Allowed: approved, not_approved, further_evaluation");
    }

    const report = await MedicalReport.findById(req.params.id);
    if (!report) {
      res.status(404);
      throw new Error("Medical report record not found.");
    }

    // Preserve AI Risk Status as-is (do NOT overwrite AI result)
    // Update Physician Review section
    report.physicianReview.status = decision;
    report.physicianReview.physicianId = req.user._id;
    report.physicianReview.physicianName = req.user.name || "Duty Physician";
    report.physicianReview.comments = comments || "";
    report.physicianReview.reviewedAt = new Date();

    // Map Final Status
    if (decision === "approved") {
      report.finalStatus = "PHYSICIAN_APPROVED";
    } else if (decision === "not_approved") {
      report.finalStatus = "PHYSICIAN_NOT_APPROVED";
    } else if (decision === "further_evaluation") {
      report.finalStatus = "FURTHER_EVALUATION_REQUIRED";
    }

    await report.save();

    res.status(200).json({
      success: true,
      message: `Physician evaluation recorded as ${decision.toUpperCase()}.`,
      report,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPhysicianReviews,
  getPhysicianReviewById,
  submitPhysicianDecision,
};
