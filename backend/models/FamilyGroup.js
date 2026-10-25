const mongoose = require("mongoose");

const familyGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
      maxlength: [100, "Group name cannot exceed 100 characters"],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Group creator reference is required"],
      index: true,
    },
    inviteCode: {
      type: String,
      required: [true, "Unique invitation code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    separationThresholdMeters: {
      type: Number,
      default: 5,
      min: [1, "Minimum separation threshold is 1 meter"],
      max: [5000, "Maximum separation threshold is 5000 meters"],
    },
    locationFreshnessMinutes: {
      type: Number,
      default: 3,
      min: [1, "Freshness timeout must be at least 1 minute"],
      max: [60, "Freshness timeout cannot exceed 60 minutes"],
    },
    consecutiveReadingsRequired: {
      type: Number,
      default: 2,
      min: [1, "Must require at least 1 reading"],
      max: [10, "Cannot exceed 10 readings"],
    },
    alertCooldownSeconds: {
      type: Number,
      default: 30,
      min: [10, "Cooldown must be at least 10 seconds"],
      max: [300, "Cooldown cannot exceed 300 seconds"],
    },
    isTrackingActive: {
      type: Boolean,
      default: true,
    },
    pairedDeviceId: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "family_group",
  }
);

// Helper method to generate clean 6-character alphanumeric code
familyGroupSchema.statics.generateInviteCode = function () {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // omit ambiguous 0, O, 1, I
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const FamilyGroup = mongoose.model("FamilyGroup", familyGroupSchema, "family_group");

module.exports = FamilyGroup;
