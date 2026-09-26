const mongoose = require("mongoose");

const travelAssessmentSchema = new mongoose.Schema(
  {
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journey",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    pilgrimageCenterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PilgrimageCenter",
      required: true,
    },
    journeyDate: {
      type: Date,
      required: true,
    },

    // 1. Health Input (Main User)
    healthRiskScore: {
      type: Number,
      required: true,
      default: 20,
    },
    healthRiskLevel: {
      type: String,
      required: true,
      default: "LOW_RISK",
    },
    healthDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // 2. Crowd Input
    crowdRiskScore: {
      type: Number,
      required: true,
      default: 20,
    },
    crowdRiskLevel: {
      type: String,
      required: true,
      default: "LOW",
    },
    crowdDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // 3. Weather Input
    weatherRiskScore: {
      type: Number,
      required: true,
      default: 20,
    },
    weatherRiskLevel: {
      type: String,
      required: true,
      default: "LOW",
    },
    weatherDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // 4. Aggregated Pilgrim Safety Index (PSI)
    psiScore: {
      type: Number,
      required: true,
      default: 20,
    },
    psiLevel: {
      type: String,
      enum: ["LOW RISK", "MODERATE RISK", "HIGH RISK", "CRITICAL RISK"],
      required: true,
      default: "LOW RISK",
    },

    // Factor Breakdown (Explainable weights & contributions)
    factors: [
      {
        name: { type: String, required: true },
        score: { type: Number, required: true },
        weight: { type: Number, required: true },
        contribution: { type: Number, required: true },
      },
    ],

    // Family Member Assessments
    familyMembersAssessments: [
      {
        familyMemberId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "FamilyMember",
        },
        name: { type: String },
        relationship: { type: String },
        healthRiskScore: { type: Number },
        healthRiskLevel: { type: String },
        psiScore: { type: Number },
        psiLevel: { type: String },
        doctorApprovalStatus: { type: String },
        medicalReviewRequired: { type: Boolean },
      },
    ],
    familyOverallStatus: {
      type: String,
      default: null,
    },
    familyHighestRiskReason: {
      type: String,
      default: "",
    },

    // Medical Safety Override & Physician Workflow
    medicalReviewRequired: {
      type: Boolean,
      default: false,
    },
    doctorApprovalStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    isBlockedByPhysician: {
      type: Boolean,
      default: false,
    },

    // Advisory Recommendations
    recommendations: [
      {
        type: String,
      },
    ],
    assessmentSummary: {
      type: String,
      default: "",
    },

    // Assessment Execution Status
    assessmentStatus: {
      type: String,
      enum: ["PENDING", "CALCULATING", "COMPLETED", "INCOMPLETE", "ERROR"],
      default: "COMPLETED",
    },
    missingInputs: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
    collection: "travel_assessments",
  }
);

module.exports = mongoose.model("TravelAssessment", travelAssessmentSchema);
