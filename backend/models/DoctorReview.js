const mongoose = require("mongoose");

const consultationRecordSchema = new mongoose.Schema(
  {
    consultationId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journey",
      default: null,
    },
    medicalReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalReport",
      default: null,
    },
    familyMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyMember",
      default: null,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorName: {
      type: String,
      required: true,
    },
    doctorCode: {
      type: String,
      default: "",
    },
    specialization: {
      type: String,
      default: "",
    },
    consultationStatus: {
      type: String,
      enum: ["PENDING", "IN_REVIEW", "CONSULTED", "APPROVED", "APPROVED_WITH_CONDITIONS", "REJECTED"],
      default: "CONSULTED",
    },
    decision: {
      type: String,
      enum: ["APPROVED", "APPROVED_WITH_CONDITIONS", "REJECTED", "approved", "rejected", "approved_with_conditions"],
      required: true,
    },
    doctorNotes: {
      type: String,
      default: "",
    },
    decisionReason: {
      type: String,
      default: "",
    },
    precautions: {
      type: String,
      default: "",
    },
    psiScore: {
      type: Number,
      default: 50,
    },
    healthRiskLevel: {
      type: String,
      default: "",
    },
    consultedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true, timestamps: true }
);

const alertAcknowledgementSchema = new mongoose.Schema(
  {
    alertId: { type: String, required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorName: { type: String, default: "" },
    acknowledged: { type: Boolean, default: true },
    acknowledgedAt: { type: Date, default: Date.now },
  },
  { _id: true, timestamps: true }
);

const doctorReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    personType: {
      type: String,
      enum: ["user", "family_member"],
      default: "user",
    },
    familyMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyMember",
      default: null,
    },
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journey",
      default: null,
    },
    personName: {
      type: String,
      required: true,
    },
    relationship: {
      type: String,
      default: "Self",
    },
    age: {
      type: Number,
      default: null,
    },
    gender: {
      type: String,
      default: "",
    },
    medicalReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalReport",
      default: null,
    },
    healthSummary: {
      vitals: { type: mongoose.Schema.Types.Mixed, default: {} },
      chronicConditions: { type: String, default: "" },
      labValues: { type: Array, default: [] },
      extractedText: { type: String, default: "" },
      abnormalFindings: { type: Array, default: [] },
    },
    aiRiskLevel: {
      type: String,
      enum: ["LOW_RISK", "MODERATE_RISK", "HIGH_RISK", "CRITICAL_RISK"],
      default: "HIGH_RISK",
    },
    psiScore: {
      type: Number,
      default: 50,
    },
    riskFactors: [{ type: String }],
    aiRecommendations: [{ type: String }],
    journeyDetails: {
      centerId: { type: String, default: "" },
      centerName: { type: String, default: "" },
      journeyDate: { type: String, default: "" },
      walkingDistance: { type: String, default: "" },
      terrainDifficulty: { type: String, default: "" },
      weatherForecast: { type: String, default: "" },
    },
    consultationStatus: {
      type: String,
      enum: ["PENDING", "IN_REVIEW", "CONSULTED", "APPROVED", "APPROVED_WITH_CONDITIONS", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "approved_with_conditions", "consulted"],
      default: "pending",
      index: true,
    },
    doctorDecision: {
      type: String,
      enum: ["none", "approved", "rejected", "approved_with_conditions", "APPROVED", "APPROVED_WITH_CONDITIONS", "REJECTED"],
      default: "none",
    },
    doctorReason: {
      type: String,
      default: "",
    },
    doctorNotes: {
      type: String,
      default: "",
    },
    precautions: {
      type: String,
      default: "",
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    doctorName: {
      type: String,
      default: "",
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    consultations: [consultationRecordSchema],
    alertAcknowledgements: [alertAcknowledgementSchema],
    responsibilityAccepted: {
      type: Boolean,
      default: false,
    },
    responsibilityAcceptedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "doctor_reviews",
  }
);

module.exports = mongoose.model("DoctorReview", doctorReviewSchema, "doctor_reviews");

