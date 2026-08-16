const mongoose = require("mongoose");

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
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    doctorDecision: {
      type: String,
      enum: ["none", "approved", "rejected"],
      default: "none",
    },
    doctorReason: {
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
