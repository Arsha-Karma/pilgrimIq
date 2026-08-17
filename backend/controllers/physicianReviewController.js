const MedicalReport = require("../models/MedicalReport");
const User = require("../models/User");
const FamilyMember = require("../models/FamilyMember");
const DoctorReview = require("../models/DoctorReview");
const Notification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");

// @desc    Get all medical review requests for physician queue
// @route   GET /api/physician/medical-reviews
// @access  Private (Physician / Admin)
const getPhysicianReviews = async (req, res, next) => {
  try {
    // 1. Fetch from DoctorReview model
    const doctorReviews = await DoctorReview.find()
      .populate("userId", "name email phone dob age gender bloodGroup")
      .populate("familyMemberId", "name relationship age gender bloodGroup chronicConditions")
      .sort({ updatedAt: -1 });

    // 2. Fetch legacy / report review items from MedicalReport
    const reportReviews = await MedicalReport.find({
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
      count: doctorReviews.length + reportReviews.length,
      doctorReviews,
      reviews: reportReviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single review request by ID
// @route   GET /api/physician/medical-reviews/:id
// @access  Private (Physician / Admin)
const getPhysicianReviewById = async (req, res, next) => {
  try {
    let review = await DoctorReview.findById(req.params.id)
      .populate("userId", "name email phone dob age gender bloodGroup")
      .populate("familyMemberId", "name relationship age gender bloodGroup chronicConditions");

    if (!review) {
      const report = await MedicalReport.findById(req.params.id)
        .populate("userId", "name email phone dob age gender bloodGroup")
        .populate("familyMemberId", "name relationship age gender bloodGroup chronicConditions");

      if (!report) {
        res.status(404);
        throw new Error("Medical review record not found.");
      }

      return res.status(200).json({
        success: true,
        report,
      });
    }

    res.status(200).json({
      success: true,
      doctorReview: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit physician review decision (Approve / Reject)
// @route   PUT /api/physician/medical-reviews/:id
// @access  Private (Physician / Admin)
const submitPhysicianDecision = async (req, res, next) => {
  try {
    const { decision, comments, reason } = req.body;
    const doctorNotes = comments || reason || "";

    const normalizedDecision = decision === "approved" ? "approved" : "rejected";

    if (!["approved", "rejected", "not_approved", "further_evaluation"].includes(decision)) {
      res.status(400);
      throw new Error("Invalid physician decision. Allowed: approved, rejected");
    }

    if (normalizedDecision === "rejected" && !doctorNotes.trim()) {
      res.status(400);
      throw new Error("Rejection reason is required when rejecting a medical travel clearance.");
    }

    // Try finding DoctorReview first
    let doctorReview = await DoctorReview.findById(req.params.id);
    let report = null;

    if (!doctorReview) {
      report = await MedicalReport.findById(req.params.id);
    } else if (doctorReview.medicalReportId) {
      report = await MedicalReport.findById(doctorReview.medicalReportId);
    }

    if (!doctorReview && !report) {
      res.status(404);
      throw new Error("Medical review record not found.");
    }

    // Extract patient details
    let targetUserId = doctorReview ? doctorReview.userId : report?.userId;
    let targetPersonType = doctorReview ? doctorReview.personType : report?.ownerType || "user";
    let targetFamilyMemberId = doctorReview ? doctorReview.familyMemberId : report?.familyMemberId;
    let targetPersonName = doctorReview ? doctorReview.personName : "";
    let targetRelationship = doctorReview ? doctorReview.relationship : "Self";

    // Fetch user for email address
    const mainUser = await User.findById(targetUserId);
    if (!mainUser) {
      res.status(404);
      throw new Error("Associated main user not found.");
    }

    if (!targetPersonName) {
      if (targetPersonType === "family_member" && targetFamilyMemberId) {
        const fm = await FamilyMember.findById(targetFamilyMemberId);
        if (fm) {
          targetPersonName = fm.name;
          targetRelationship = fm.relationship || "Family Member";
        }
      } else {
        targetPersonName = mainUser.name;
        targetRelationship = "Main User";
      }
    }

    // Update DoctorReview if exists
    if (doctorReview) {
      doctorReview.status = normalizedDecision;
      doctorReview.doctorDecision = normalizedDecision;
      doctorReview.doctorReason = doctorNotes;
      doctorReview.doctorId = req.user._id;
      doctorReview.doctorName = req.user.name || "Duty Physician";
      doctorReview.reviewedAt = new Date();
      doctorReview.responsibilityAccepted = false;
      await doctorReview.save();
    }

    // Update MedicalReport if exists
    if (report) {
      report.physicianReview.status = normalizedDecision === "approved" ? "approved" : "not_approved";
      report.physicianReview.physicianId = req.user._id;
      report.physicianReview.physicianName = req.user.name || "Duty Physician";
      report.physicianReview.comments = doctorNotes;
      report.physicianReview.reviewedAt = new Date();
      report.finalStatus = normalizedDecision === "approved" ? "PHYSICIAN_APPROVED" : "PHYSICIAN_NOT_APPROVED";
      await report.save();
    }

    // Update target Person (User or Family Member) status
    if (targetPersonType === "family_member" && targetFamilyMemberId) {
      await FamilyMember.findByIdAndUpdate(targetFamilyMemberId, {
        doctorApprovalStatus: normalizedDecision,
        doctorReason: doctorNotes,
        responsibilityAccepted: false,
      });
    } else {
      await User.findByIdAndUpdate(mainUser._id, {
        doctorApprovalStatus: normalizedDecision,
        doctorReason: doctorNotes,
        responsibilityAccepted: false,
      });
    }

    // Handle Notifications & Email on Rejection or Approval
    if (normalizedDecision === "rejected") {
      const emailSubject = `Travel Approval Rejected for ${targetPersonName}`;
      const emailText = `Hello ${mainUser.name},\n\n` +
        `Travel Approval Rejected\n\n` +
        `The travel request for ${targetPersonName} (${targetRelationship}) has been rejected by the doctor based on the medical assessment.\n\n` +
        `Doctor Rejection Reason: ${doctorNotes}\n\n` +
        `Please review the doctor's decision and safety recommendations on PilgrimIQ.\n\n` +
        `PilgrimIQ Healthcare Team`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
          <h2 style="color: #ef4444;">Travel Approval Rejected</h2>
          <p>Hello <strong>${mainUser.name}</strong>,</p>
          <p>The travel request for <strong>${targetPersonName} (${targetRelationship})</strong> has been rejected by the doctor based on the medical assessment.</p>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 16px 0;">
            <strong>Doctor's Rejection Reason:</strong><br/>
            ${doctorNotes}
          </div>
          <p>Please review the doctor's decision and safety recommendations on PilgrimIQ.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
          <p style="font-size: 12px; color: #64748b;">PilgrimIQ Medical Safety System</p>
        </div>
      `;

      try {
        await sendEmail({
          email: mainUser.email,
          subject: emailSubject,
          message: emailText,
          html: emailHtml,
        });
      } catch (mailErr) {
        console.warn(`[NOTIFICATION] Unable to send rejection email to ${mainUser.email}:`, mailErr.message);
      }

      // Delete previous duplicate notifications for this person to ensure strictly 1 notification
      await Notification.deleteMany({
        userId: mainUser._id,
        personName: targetPersonName,
        type: { $in: ["DOCTOR_REJECTION", "DOCTOR_APPROVAL"] },
      });

      // Create In-App Notification specifically identifying the person
      await Notification.create({
        userId: mainUser._id,
        type: "DOCTOR_REJECTION",
        title: `Travel Approval Rejected for ${targetPersonName}`,
        message: `The travel request for ${targetPersonName} (${targetRelationship}) has been rejected by the doctor. Reason: ${doctorNotes}`,
        personName: targetPersonName,
        personRelationship: targetRelationship,
      });
    } else if (normalizedDecision === "approved") {
      // Delete previous duplicate notifications for this person to ensure strictly 1 notification
      await Notification.deleteMany({
        userId: mainUser._id,
        personName: targetPersonName,
        type: { $in: ["DOCTOR_REJECTION", "DOCTOR_APPROVAL"] },
      });

      // In-app notification for approval
      await Notification.create({
        userId: mainUser._id,
        type: "DOCTOR_APPROVAL",
        title: `Travel Medically Approved for ${targetPersonName}`,
        message: `The medical travel request for ${targetPersonName} (${targetRelationship}) has been approved by the doctor.`,
        personName: targetPersonName,
        personRelationship: targetRelationship,
      });
    }

    res.status(200).json({
      success: true,
      message: `Physician decision recorded as ${normalizedDecision.toUpperCase()} for ${targetPersonName}.`,
      doctorReview,
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
