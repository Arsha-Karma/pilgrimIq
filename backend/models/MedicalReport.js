const mongoose = require("mongoose");

const medicalReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    ownerType: {
      type: String,
      enum: ["user", "family_member"],
      default: "user",
    },
    familyMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyMember",
      default: null,
    },
    fileName: {
      type: String,
      required: [true, "File name is required"],
      trim: true,
    },
    fileType: {
      type: String,
      default: "pdf",
    },
    mimeType: {
      type: String,
      default: "application/pdf",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    url: {
      type: String,
      default: "",
    },

    // Raw extracted OCR text
    extractedText: {
      type: String,
      default: "",
    },
    extractionStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    extractionError: {
      type: String,
      default: "",
    },

    // Structured biomedical parameters
    extractedMedicalData: {
      vitals: {
        bloodPressure: {
          systolic: { type: Number, default: null },
          diastolic: { type: Number, default: null },
        },
        heartRate: {
          value: { type: Number, default: null },
          unit: { type: String, default: "bpm" },
        },
        temperature: {
          value: { type: Number, default: null },
          unit: { type: String, default: "°F" },
        },
        spo2: {
          value: { type: Number, default: null },
          unit: { type: String, default: "%" },
        },
      },
      laboratoryValues: [
        {
          parameter: { type: String, required: true },
          value: { type: mongoose.Schema.Types.Mixed, default: "Not detected" },
          unit: { type: String, default: "" },
          normalRange: { type: String, default: "" },
          confidence: { type: Number, default: 0.9 },
        },
      ],
      conditions: [{ type: String }],
      medications: [{ type: String }],
      allergies: [{ type: String }],
      abnormalFindings: [{ type: String }],
    },

    extractionConfidence: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "high",
    },

    // Generated AI medical summary
    aiSummary: {
      type: String,
      default: "",
    },

    // Pilgrimage travel risk assessment
    aiRiskAssessment: {
      heatRisk: { type: String, default: "Not detected" },
      dehydrationRisk: { type: String, default: "Not detected" },
      exertionRisk: { type: String, default: "Not detected" },
      fatigueRisk: { type: String, default: "Not detected" },
      walkingRisk: { type: String, default: "Not detected" },
      overallStatus: {
        type: String,
        enum: ["LOW_RISK", "CAUTION", "MEDICAL_REVIEW_REQUIRED"],
        default: "LOW_RISK",
      },
      explanation: [{ type: String }],
    },

    // Physician Review workflow
    physicianReview: {
      required: { type: Boolean, default: false },
      status: {
        type: String,
        enum: ["none", "pending", "approved", "not_approved", "further_evaluation"],
        default: "none",
      },
      physicianId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      physicianName: { type: String, default: "" },
      comments: { type: String, default: "" },
      reviewedAt: { type: Date, default: null },
    },

    // Overall final status combining AI assessment + Physician decision
    finalStatus: {
      type: String,
      enum: [
        "AI_PRELIMINARY_LOW_RISK",
        "AI_PRELIMINARY_CAUTION",
        "MEDICAL_REVIEW_REQUIRED",
        "PHYSICIAN_APPROVED",
        "PHYSICIAN_NOT_APPROVED",
        "FURTHER_EVALUATION_REQUIRED",
      ],
      default: "AI_PRELIMINARY_LOW_RISK",
    },
  },
  {
    timestamps: true,
    collection: "medical_reports",
  }
);

const MedicalReport = mongoose.model("MedicalReport", medicalReportSchema, "medical_reports");

module.exports = MedicalReport;
