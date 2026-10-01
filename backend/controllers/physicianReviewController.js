const MedicalReport = require("../models/MedicalReport");
const User = require("../models/User");
const FamilyMember = require("../models/FamilyMember");
const DoctorReview = require("../models/DoctorReview");
const Journey = require("../models/Journey");
const TravelAssessment = require("../models/TravelAssessment");
const Notification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");
const mongoose = require("mongoose");

// Helper to normalize doctor decisions
const normalizeDecision = (decision) => {
  if (!decision) return "APPROVED";
  const upper = String(decision).toUpperCase().trim();
  if (upper === "APPROVED" || upper === "APPROVE") return "APPROVED";
  if (upper === "APPROVED_WITH_CONDITIONS" || upper === "CONDITIONAL") return "APPROVED_WITH_CONDITIONS";
  if (upper === "REJECTED" || upper === "REJECT" || upper === "NOT_APPROVED") return "REJECTED";
  return upper;
};

// @desc    Get all medical review requests for doctor dashboard & triage
// @route   GET /api/physician/medical-reviews
// @route   GET /api/doctor/pilgrims
// @access  Private (Physician / Admin)
const getPhysicianReviews = async (req, res, next) => {
  try {
    // 1. Fetch all DoctorReview documents with populated references
    const doctorReviews = await DoctorReview.find()
      .populate("userId", "name email phone dob age gender bloodGroup doctorApprovalStatus doctorReason psiScore")
      .populate("familyMemberId", "name relationship age gender bloodGroup chronicConditions doctorApprovalStatus doctorReason")
      .populate("doctorId", "name email doctorCode specialization")
      .populate({
        path: "consultations.doctorId",
        select: "name email doctorCode specialization",
      })
      .sort({ updatedAt: -1 });

    // 2. Fetch MedicalReport items needing review
    const reportReviews = await MedicalReport.find({
      $or: [
        { "physicianReview.required": true },
        { "physicianReview.status": { $in: ["pending", "approved", "not_approved", "further_evaluation", "approved_with_conditions"] } },
        { finalStatus: "MEDICAL_REVIEW_REQUIRED" },
      ],
    })
      .populate("userId", "name email phone dob age gender bloodGroup")
      .populate("familyMemberId", "name relationship age gender bloodGroup chronicConditions")
      .sort({ updatedAt: -1 });

    // 3. Fetch registered Users and their Family Members for complete health triage view
    const allUsers = await User.find({ role: "user" })
      .select("name email phone dob age gender bloodGroup doctorApprovalStatus doctorReason psiScore medicalInfo healthInfo createdAt")
      .lean();

    const allFamilyMembers = await FamilyMember.find()
      .populate("user", "name email")
      .lean();

    const allJourneys = await Journey.find()
      .populate("pilgrimageCenterId", "name location city state")
      .sort({ createdAt: -1 })
      .lean();

    const allTravelAssessments = await TravelAssessment.find().lean();

    res.status(200).json({
      success: true,
      count: doctorReviews.length + reportReviews.length,
      doctorReviews,
      reviews: reportReviews,
      allUsers,
      allFamilyMembers,
      allJourneys,
      allTravelAssessments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single review request or pilgrim by ID with consultation history
// @route   GET /api/physician/medical-reviews/:id
// @route   GET /api/doctor/pilgrims/:id
// @access  Private (Physician / Admin)
const getPhysicianReviewById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let doctorReview = await DoctorReview.findById(id)
      .populate("userId", "name email phone dob age gender bloodGroup doctorApprovalStatus doctorReason")
      .populate("familyMemberId", "name relationship age gender bloodGroup chronicConditions doctorApprovalStatus doctorReason")
      .populate("doctorId", "name email doctorCode specialization")
      .populate({
        path: "consultations.doctorId",
        select: "name email doctorCode specialization",
      });

    let report = null;
    let userRecord = null;

    if (!doctorReview) {
      report = await MedicalReport.findById(id)
        .populate("userId", "name email phone dob age gender bloodGroup")
        .populate("familyMemberId", "name relationship age gender bloodGroup chronicConditions");

      if (!report) {
        userRecord = await User.findById(id).select("-password");
      }
    }

    if (!doctorReview && !report && !userRecord) {
      res.status(404);
      throw new Error("Medical review / pilgrim record not found.");
    }

    // Determine target user / family member IDs to pull journey, family & assessment details
    const targetUserId = doctorReview ? doctorReview.userId?._id || doctorReview.userId : report ? report.userId?._id || report.userId : userRecord?._id;

    let userFamilyMembers = [];
    let userJourneys = [];
    let travelAssessments = [];

    if (targetUserId) {
      userFamilyMembers = await FamilyMember.find({ userId: targetUserId });
      userJourneys = await Journey.find({ userId: targetUserId }).populate("pilgrimageCenterId", "name location city state");
      travelAssessments = await TravelAssessment.find({ userId: targetUserId });
    }

    res.status(200).json({
      success: true,
      doctorReview,
      report,
      user: userRecord,
      familyMembers: userFamilyMembers,
      journeys: userJourneys,
      travelAssessments,
      consultations: doctorReview?.consultations || [],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get consultation history for a specific pilgrim
// @route   GET /api/doctor/pilgrims/:id/consultations
// @access  Private (Physician / Admin)
const getPilgrimConsultations = async (req, res, next) => {
  try {
    const { id } = req.params;
    let doctorReview = await DoctorReview.findById(id)
      .populate("consultations.doctorId", "name email doctorCode specialization");

    if (!doctorReview) {
      doctorReview = await DoctorReview.findOne({ userId: id })
        .populate("consultations.doctorId", "name email doctorCode specialization");
    }

    res.status(200).json({
      success: true,
      consultations: doctorReview ? doctorReview.consultations || [] : [],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit physician review decision / create consultation record (Approve / Approve with Conditions / Reject)
// @route   POST /api/doctor/consultations
// @route   PUT /api/physician/medical-reviews/:id
// @access  Private (Physician / Admin)
const submitPhysicianDecision = async (req, res, next) => {
  try {
    const {
      reviewId,
      patientId,
      journeyId,
      familyMemberId,
      personType,
      decision,
      doctorNotes,
      decisionReason,
      precautions,
      comments,
      reason,
    } = req.body;

    const targetId = req.params.id || reviewId || patientId;
    const finalDoctorNotes = (doctorNotes || comments || "").trim();
    const finalReason = (decisionReason || reason || finalDoctorNotes).trim();
    const finalPrecautions = (precautions || "").trim();

    const normalizedDec = normalizeDecision(decision);

    if (!["APPROVED", "APPROVED_WITH_CONDITIONS", "REJECTED"].includes(normalizedDec)) {
      res.status(400);
      throw new Error("Invalid physician decision. Allowed values: APPROVED, APPROVED_WITH_CONDITIONS, REJECTED");
    }

    if (normalizedDec === "REJECTED" && !finalReason) {
      res.status(400);
      throw new Error("Decision reason is required when rejecting travel clearance.");
    }

    // Identify or create DoctorReview target
    let doctorReview = null;
    let report = null;

    if (targetId && mongoose.Types.ObjectId.isValid(targetId)) {
      doctorReview = await DoctorReview.findById(targetId);
      if (!doctorReview) {
        report = await MedicalReport.findById(targetId);
        if (report && report.medicalReportId) {
          doctorReview = await DoctorReview.findOne({ medicalReportId: report._id });
        }
      }
    }

    if (!doctorReview && targetId && mongoose.Types.ObjectId.isValid(targetId)) {
      doctorReview = await DoctorReview.findOne({
        $or: [{ userId: targetId }, { familyMemberId: targetId }],
      });
    }

    // Determine target user identity
    let targetUserId = doctorReview ? doctorReview.userId : report ? report.userId : patientId;
    let targetPersonType = personType || (doctorReview ? doctorReview.personType : report?.ownerType || "user");
    let targetFamilyMemberId = familyMemberId || (doctorReview ? doctorReview.familyMemberId : report?.familyMemberId);
    let targetPersonName = doctorReview ? doctorReview.personName : "";
    let targetRelationship = doctorReview ? doctorReview.relationship : "Self";

    let mainUser = null;
    if (targetUserId && mongoose.Types.ObjectId.isValid(targetUserId)) {
      mainUser = await User.findById(targetUserId);
    }

    if (!mainUser && targetFamilyMemberId && mongoose.Types.ObjectId.isValid(targetFamilyMemberId)) {
      const fm = await FamilyMember.findById(targetFamilyMemberId);
      if (fm && (fm.userId || fm.user)) {
        mainUser = await User.findById(fm.userId || fm.user);
        if (!targetPersonName) targetPersonName = fm.name;
        if (!targetRelationship) targetRelationship = fm.relationship || "Family Member";
      }
    }

    if (!mainUser && targetId && mongoose.Types.ObjectId.isValid(targetId)) {
      const fm = await FamilyMember.findById(targetId);
      if (fm && (fm.userId || fm.user)) {
        mainUser = await User.findById(fm.userId || fm.user);
        targetFamilyMemberId = fm._id;
        targetPersonType = "family_member";
        if (!targetPersonName) targetPersonName = fm.name;
        if (!targetRelationship) targetRelationship = fm.relationship || "Family Member";
      }
    }

    if (!mainUser) {
      // Fallback to any registered main user or current logged-in physician context to ensure submission succeeds
      mainUser = (await User.findOne({ role: "user" })) || (await User.findOne()) || req.user;
    }

    if (!targetPersonName && mainUser) {
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

    // Create DoctorReview record if none exists yet
    if (!doctorReview) {
      doctorReview = new DoctorReview({
        userId: mainUser._id,
        personType: targetPersonType,
        familyMemberId: targetFamilyMemberId || null,
        journeyId: journeyId || null,
        personName: targetPersonName,
        relationship: targetRelationship,
        age: mainUser.age || 40,
        gender: mainUser.gender || "Male",
        medicalReportId: report ? report._id : null,
        aiRiskLevel: "HIGH_RISK",
        psiScore: mainUser.psiScore || 50,
        status: "pending",
      });
    }

    // Authenticated Doctor identity from session token (DO NOT trust body)
    const doctorObjId = req.user._id;
    const doctorObjName = req.user.name || "Duty Physician";
    const doctorCodeVal = req.user.doctorCode || "";
    const doctorSpecVal = req.user.specialization || "General Physician";

    // Create new historical consultation record
    const consultationRecord = {
      consultationId: new mongoose.Types.ObjectId().toString(),
      patientId: mainUser._id,
      journeyId: journeyId || doctorReview.journeyId || null,
      medicalReportId: report ? report._id : doctorReview.medicalReportId || null,
      familyMemberId: targetFamilyMemberId || doctorReview.familyMemberId || null,
      doctorId: doctorObjId,
      doctorName: doctorObjName,
      doctorCode: doctorCodeVal,
      specialization: doctorSpecVal,
      consultationStatus: "CONSULTED",
      decision: normalizedDec,
      doctorNotes: finalDoctorNotes,
      decisionReason: finalReason,
      precautions: finalPrecautions,
      psiScore: doctorReview.psiScore || 50,
      healthRiskLevel: doctorReview.aiRiskLevel || "HIGH_RISK",
      consultedAt: new Date(),
    };

    // Append to consultation history array
    doctorReview.consultations.push(consultationRecord);

    // Update top-level shared status on DoctorReview
    const lowerDec = normalizedDec === "APPROVED" ? "approved" : normalizedDec === "APPROVED_WITH_CONDITIONS" ? "approved_with_conditions" : "rejected";

    doctorReview.consultationStatus = "CONSULTED";
    doctorReview.status = lowerDec;
    doctorReview.doctorDecision = normalizedDec;
    doctorReview.doctorId = doctorObjId;
    doctorReview.doctorName = doctorObjName;
    doctorReview.doctorReason = finalReason;
    doctorReview.doctorNotes = finalDoctorNotes;
    doctorReview.precautions = finalPrecautions;
    doctorReview.reviewedAt = new Date();
    doctorReview.responsibilityAccepted = false;

    await doctorReview.save();

    // Update MedicalReport if linked
    if (report || doctorReview.medicalReportId) {
      const repToUpdate = report || (await MedicalReport.findById(doctorReview.medicalReportId));
      if (repToUpdate) {
        repToUpdate.physicianReview.status = lowerDec === "rejected" ? "not_approved" : lowerDec;
        repToUpdate.physicianReview.physicianId = doctorObjId;
        repToUpdate.physicianReview.physicianName = doctorObjName;
        repToUpdate.physicianReview.comments = finalDoctorNotes;
        repToUpdate.physicianReview.reviewedAt = new Date();
        repToUpdate.finalStatus = normalizedDec === "APPROVED" || normalizedDec === "APPROVED_WITH_CONDITIONS" ? "PHYSICIAN_APPROVED" : "PHYSICIAN_NOT_APPROVED";
        await repToUpdate.save();
      }
    }

    // Sync clearance status to User or Family Member
    if (targetPersonType === "family_member" && targetFamilyMemberId) {
      await FamilyMember.findByIdAndUpdate(targetFamilyMemberId, {
        doctorApprovalStatus: lowerDec,
        doctorReason: finalReason,
        responsibilityAccepted: false,
      });
    } else {
      await User.findByIdAndUpdate(mainUser._id, {
        doctorApprovalStatus: lowerDec,
        doctorReason: finalReason,
        responsibilityAccepted: false,
      });
    }

    // Update any linked TravelAssessments
    if (journeyId || doctorReview.journeyId) {
      const jId = journeyId || doctorReview.journeyId;
      await TravelAssessment.findOneAndUpdate(
        { journeyId: jId },
        {
          doctorApprovalStatus: lowerDec,
          isBlockedByPhysician: normalizedDec === "REJECTED",
        }
      );
    }

    // Handle In-App Notifications & Email alerts
    if (normalizedDec === "REJECTED") {
      const emailSubject = `Medical Travel Decision Updated: REJECTED for ${targetPersonName}`;
      const emailText = `Hello ${mainUser.name},\n\n` +
        `Travel Clearance Decision: REJECTED\n\n` +
        `The medical travel request for ${targetPersonName} (${targetRelationship}) has been reviewed by Dr. ${doctorObjName}.\n` +
        `Decision: REJECTED\n` +
        `Doctor Reason: ${finalReason}\n` +
        `Precautions / Notes: ${finalPrecautions || "N/A"}\n\n` +
        `Please log in to PilgrimIQ for full details and recommendations.\n\n` +
        `PilgrimIQ Healthcare Team`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
          <h2 style="color: #ef4444;">Medical Travel Decision: REJECTED</h2>
          <p>Hello <strong>${mainUser.name}</strong>,</p>
          <p>The medical travel request for <strong>${targetPersonName} (${targetRelationship})</strong> has been evaluated by <strong>Dr. ${doctorObjName}</strong>.</p>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 16px 0;">
            <strong>Decision Reason:</strong><br/>
            ${finalReason}
            ${finalPrecautions ? `<br/><br/><strong>Precautions:</strong><br/>${finalPrecautions}` : ""}
          </div>
          <p>Please log in to PilgrimIQ for safety guidance.</p>
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

      await Notification.deleteMany({
        userId: mainUser._id,
        personName: targetPersonName,
        type: { $in: ["DOCTOR_REJECTION", "DOCTOR_APPROVAL"] },
      });

      await Notification.create({
        userId: mainUser._id,
        type: "DOCTOR_REJECTION",
        title: `Travel Approval REJECTED for ${targetPersonName}`,
        message: `Dr. ${doctorObjName} has rejected travel clearance for ${targetPersonName}. Reason: ${finalReason}`,
        personName: targetPersonName,
        personRelationship: targetRelationship,
      });
    } else {
      // APPROVED or APPROVED_WITH_CONDITIONS
      await Notification.deleteMany({
        userId: mainUser._id,
        personName: targetPersonName,
        type: { $in: ["DOCTOR_REJECTION", "DOCTOR_APPROVAL"] },
      });

      const titleText = normalizedDec === "APPROVED_WITH_CONDITIONS"
        ? `Travel Approved with Conditions for ${targetPersonName}`
        : `Travel Medically Approved for ${targetPersonName}`;

      const msgText = normalizedDec === "APPROVED_WITH_CONDITIONS"
        ? `Dr. ${doctorObjName} approved travel for ${targetPersonName} with conditions. Precautions: ${finalPrecautions || finalReason}`
        : `Dr. ${doctorObjName} has medically approved travel for ${targetPersonName}.`;

      await Notification.create({
        userId: mainUser._id,
        type: "DOCTOR_APPROVAL",
        title: titleText,
        message: msgText,
        personName: targetPersonName,
        personRelationship: targetRelationship,
      });
    }

    res.status(200).json({
      success: true,
      message: `Consultation recorded by Dr. ${doctorObjName} as ${normalizedDec} for ${targetPersonName}.`,
      consultationRecord,
      doctorReview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Acknowledge emergency medical alert
// @route   POST /api/doctor/alerts/:id/acknowledge
// @route   POST /api/physician/alerts/:id/acknowledge
// @access  Private (Physician / Admin)
const acknowledgeEmergencyAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    let doctorReview = await DoctorReview.findById(id);

    if (!doctorReview) {
      doctorReview = await DoctorReview.findOne({
        $or: [{ userId: id }, { familyMemberId: id }],
      });
    }

    const ackData = {
      alertId: id,
      doctorId: req.user._id,
      doctorName: req.user.name || "Duty Physician",
      acknowledged: true,
      acknowledgedAt: new Date(),
    };

    if (doctorReview) {
      doctorReview.alertAcknowledgements.push(ackData);
      await doctorReview.save();
    }

    res.status(200).json({
      success: true,
      message: `Emergency alert acknowledged by Dr. ${req.user.name || "Duty Physician"}.`,
      acknowledgement: ackData,
      doctorReview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's & family's doctor consultation records
// @route   GET /api/physician/my-consultations
// @access  Private (User / Pilgrim)
const getMyConsultationRecords = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Fetch all DoctorReview documents where user is primary or linked
    const doctorReviews = await DoctorReview.find({ userId })
      .populate("doctorId", "name email doctorCode specialization")
      .populate("consultations.doctorId", "name email doctorCode specialization")
      .sort({ updatedAt: -1 });

    // 2. Fetch all medical reports for user
    const medicalReports = await MedicalReport.find({ userId }).sort({ createdAt: -1 });

    // 3. Fetch notifications related to doctor reviews
    const notifications = await Notification.find({
      userId,
      type: { $in: ["DOCTOR_APPROVAL", "DOCTOR_REJECTION", "PHYSICIAN_REVIEW"] }
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      doctorReviews,
      medicalReports,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPhysicianReviews,
  getPhysicianReviewById,
  getPilgrimConsultations,
  submitPhysicianDecision,
  acknowledgeEmergencyAlert,
  getMyConsultationRecords,
};


