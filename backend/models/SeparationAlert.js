const mongoose = require("mongoose");

const separationAlertSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyGroup",
      required: [true, "Group reference is required"],
      index: true,
    },
    // Reference to the member's group membership record (works for both account and no-account members)
    membership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyMembership",
      default: null,
      index: true,
    },
    // User reference is optional for family members without PilgrimIQ accounts
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    memberName: {
      type: String,
      default: "Family Member",
    },
    mainUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Main user reference is required"],
    },
    distanceMeters: {
      type: Number,
      required: [true, "Distance in meters is required"],
    },
    thresholdMeters: {
      type: Number,
      required: true,
    },
    severity: {
      type: String,
      enum: ["warning", "critical"],
      default: "warning",
    },
    memberLocation: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      accuracy: { type: Number, default: 0 },
      recordedAt: { type: Date, default: Date.now },
    },
    mainLocation: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      accuracy: { type: Number, default: 0 },
      recordedAt: { type: Date, default: Date.now },
    },
    status: {
      type: String,
      enum: ["active", "acknowledged_by_device", "resolved", "expired"],
      default: "active",
      index: true,
    },
    deviceCommandDelivered: {
      type: Boolean,
      default: false,
    },
    deviceAcknowledgedAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedReason: {
      type: String,
      default: "",
    },
    consecutiveCount: {
      type: Number,
      default: 1,
    },
    buzzerPattern: {
      type: String,
      enum: ["warning_short", "critical_urgent"],
      default: "warning_short",
    },
  },
  {
    timestamps: true,
    collection: "separation_alert",
  }
);

// Compound index for active alerts lookup
separationAlertSchema.index({ group: 1, status: 1, createdAt: -1 });

const SeparationAlert = mongoose.model(
  "SeparationAlert",
  separationAlertSchema,
  "separation_alert"
);

module.exports = SeparationAlert;
