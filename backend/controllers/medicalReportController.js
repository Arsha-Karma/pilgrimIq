const MedicalReport = require("../models/MedicalReport");
const FamilyMember = require("../models/FamilyMember");
const User = require("../models/User");
const { extractTextFromReport } = require("../services/medicalOCRService");
const { parseMedicalEntities } = require("../services/medicalNLPService");
const { assessTravelRisk } = require("../services/medicalRiskService");
const { generateMedicalSummary } = require("../services/medicalSummaryService");

// @desc    Upload and analyze a new medical report
// @route   POST /api/medical-reports/upload
// @access  Private (Authenticated User)
const uploadAndAnalyzeReport = async (req, res, next) => {
  try {
    const { fileName, fileType, mimeType, fileData, ownerType = "user", familyMemberId } = req.body;

    if (!fileName || !fileData) {
      res.status(400);
      throw new Error("File name and file content are required.");
    }

    // 1. Ownership & Family Member Verification
    let targetPatientName = req.user.name || "Main User";
    let targetAge = req.user.age || 40;
    let verifiedFamilyMemberId = null;

    if (ownerType === "family_member") {
      if (!familyMemberId) {
        res.status(400);
        throw new Error("Family member selection is required.");
      }
      const familyMember = await FamilyMember.findOne({ _id: familyMemberId, user: req.user._id });
      if (!familyMember) {
        res.status(403);
        throw new Error("Unauthorized access: Selected family member does not belong to your account.");
      }
      targetPatientName = familyMember.name;
      targetAge = familyMember.age || 40;
      verifiedFamilyMemberId = familyMember._id;
    }

    // 2. Validate File Size (Max 10 MB)
    const base64Clean = fileData.replace(/^data:([a-zA-Z0-9+\/]+);base64,/, "");
    const estimatedSizeBytes = Math.round((base64Clean.length * 3) / 4);
    if (estimatedSizeBytes > 10 * 1024 * 1024) {
      res.status(400);
      throw new Error("File size exceeds maximum limit of 10 MB.");
    }

    // 3. OCR Text Extraction Pipeline Stage
    let extractedText = "";
    let extractionStatus = "completed";
    let extractionError = "";

    try {
      extractedText = await extractTextFromReport(fileData, mimeType || "application/pdf");
    } catch (ocrErr) {
      console.warn("OCR Service Error:", ocrErr.message);
      extractionStatus = "failed";
      extractionError = ocrErr.message;
    }

    if (extractionStatus === "failed" || !extractedText) {
      // Save report record with failed extraction status
      const failedReport = await MedicalReport.create({
        userId: req.user._id,
        ownerType,
        familyMemberId: verifiedFamilyMemberId,
        fileName: fileName.trim(),
        fileType: fileType || "pdf",
        mimeType: mimeType || "application/pdf",
        fileSize: estimatedSizeBytes,
        url: fileData,
        extractedText: "",
        extractionStatus: "failed",
        extractionError: extractionError || "Unable to reliably read this medical report. Please upload a clearer document.",
        aiSummary: "Unable to read document text clearly for analysis.",
        finalStatus: "AI_PRELIMINARY_CAUTION",
      });

      return res.status(200).json({
        success: false,
        message: extractionError || "Unable to reliably read this medical report. Please upload a clearer document.",
        report: failedReport,
      });
    }

    // 4. Biomedical Entity NLP Extraction Pipeline Stage
    const nlpResult = await parseMedicalEntities(extractedText);

    // 5. Medical Summary Pipeline Stage
    const summary = await generateMedicalSummary(nlpResult.extractedMedicalData, targetPatientName, targetAge);

    // 6. Travel Risk Assessment Pipeline Stage
    const riskAssessment = await assessTravelRisk(nlpResult.extractedMedicalData, { age: targetAge, name: targetPatientName });

    // Determine Final Status & Physician Review Need
    let finalStatus = "AI_PRELIMINARY_LOW_RISK";
    let physicianRequired = false;
    let physicianStatus = "none";

    if (riskAssessment.overallStatus === "MEDICAL_REVIEW_REQUIRED") {
      finalStatus = "MEDICAL_REVIEW_REQUIRED";
      physicianRequired = true;
      physicianStatus = "pending";
    } else if (riskAssessment.overallStatus === "CAUTION") {
      finalStatus = "AI_PRELIMINARY_CAUTION";
    }

    // 7. Save Report to Database
    const report = await MedicalReport.create({
      userId: req.user._id,
      ownerType,
      familyMemberId: verifiedFamilyMemberId,
      fileName: fileName.trim(),
      fileType: fileType || "pdf",
      mimeType: mimeType || "application/pdf",
      fileSize: estimatedSizeBytes,
      url: fileData,
      extractedText,
      extractionStatus: "completed",
      extractedMedicalData: nlpResult.extractedMedicalData,
      extractionConfidence: nlpResult.extractionConfidence,
      aiSummary: summary,
      aiRiskAssessment: riskAssessment,
      physicianReview: {
        required: physicianRequired,
        status: physicianStatus,
      },
      finalStatus,
    });

    res.status(201).json({
      success: true,
      message: "Medical report uploaded and analyzed successfully.",
      report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all medical reports for authenticated user (and family members)
// @route   GET /api/medical-reports/my-reports
// @access  Private (Authenticated User)
const getMyReports = async (req, res, next) => {
  try {
    const reports = await MedicalReport.find({ userId: req.user._id })
      .populate("familyMemberId", "name relationship age gender")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single medical report by ID with ownership verification
// @route   GET /api/medical-reports/:id
// @access  Private (Owner User or Physician)
const getReportById = async (req, res, next) => {
  try {
    const report = await MedicalReport.findById(req.params.id)
      .populate("userId", "name email phone")
      .populate("familyMemberId", "name relationship age gender bloodGroup chronicConditions");

    if (!report) {
      res.status(404);
      throw new Error("Medical report not found.");
    }

    // Access Check: Owner or Admin or Physician
    const isOwner = report.userId._id.toString() === req.user._id.toString();
    const isPhysicianOrAdmin = req.user.role === "physician" || req.user.role === "admin";

    if (!isOwner && !isPhysicianOrAdmin) {
      res.status(403);
      throw new Error("Unauthorized: You do not have permission to view this medical report.");
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get medical reports for a specific family member
// @route   GET /api/medical-reports/family/:familyMemberId
// @access  Private (Authenticated Parent User)
const getFamilyMemberReports = async (req, res, next) => {
  try {
    const { familyMemberId } = req.params;

    // Verify family member ownership
    const familyMember = await FamilyMember.findOne({ _id: familyMemberId, user: req.user._id });
    if (!familyMember) {
      res.status(403);
      throw new Error("Unauthorized access to family member medical reports.");
    }

    const reports = await MedicalReport.find({
      userId: req.user._id,
      familyMemberId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      familyMember,
      count: reports.length,
      reports,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Re-trigger AI Analysis for an existing report
// @route   POST /api/medical-reports/:id/analyze
// @access  Private (Owner User)
const analyzeReport = async (req, res, next) => {
  try {
    const report = await MedicalReport.findOne({ _id: req.params.id, userId: req.user._id });
    if (!report) {
      res.status(404);
      throw new Error("Medical report not found or unauthorized.");
    }

    let targetPatientName = req.user.name || "User";
    let targetAge = req.user.age || 40;

    if (report.ownerType === "family_member" && report.familyMemberId) {
      const fm = await FamilyMember.findById(report.familyMemberId);
      if (fm) {
        targetPatientName = fm.name;
        targetAge = fm.age || 40;
      }
    }

    const nlpResult = await parseMedicalEntities(report.extractedText || "");
    const summary = await generateMedicalSummary(nlpResult.extractedMedicalData, targetPatientName, targetAge);
    const riskAssessment = await assessTravelRisk(nlpResult.extractedMedicalData, { age: targetAge, name: targetPatientName });

    report.extractedMedicalData = nlpResult.extractedMedicalData;
    report.extractionConfidence = nlpResult.extractionConfidence;
    report.aiSummary = summary;
    report.aiRiskAssessment = riskAssessment;
    report.extractionStatus = "completed";

    if (riskAssessment.overallStatus === "MEDICAL_REVIEW_REQUIRED") {
      report.finalStatus = "MEDICAL_REVIEW_REQUIRED";
      report.physicianReview.required = true;
      if (report.physicianReview.status === "none") {
        report.physicianReview.status = "pending";
      }
    } else if (riskAssessment.overallStatus === "CAUTION") {
      report.finalStatus = "AI_PRELIMINARY_CAUTION";
    } else {
      report.finalStatus = "AI_PRELIMINARY_LOW_RISK";
    }

    await report.save();

    res.status(200).json({
      success: true,
      message: "Report re-analyzed successfully.",
      report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send report for physician review
// @route   POST /api/medical-reports/:id/send-for-review
// @access  Private (Owner User)
const sendReportForReview = async (req, res, next) => {
  try {
    const report = await MedicalReport.findOne({ _id: req.params.id, userId: req.user._id });
    if (!report) {
      res.status(404);
      throw new Error("Medical report not found or unauthorized.");
    }

    report.physicianReview.required = true;
    report.physicianReview.status = "pending";
    report.finalStatus = "MEDICAL_REVIEW_REQUIRED";

    await report.save();

    res.status(200).json({
      success: true,
      message: "Medical report has been submitted to on-duty physician for review.",
      report,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadAndAnalyzeReport,
  getMyReports,
  getReportById,
  getFamilyMemberReports,
  analyzeReport,
  sendReportForReview,
};
