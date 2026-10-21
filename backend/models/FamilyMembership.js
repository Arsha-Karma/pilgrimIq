const mongoose = require("mongoose");
const crypto = require("crypto");

const familyMembershipSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyGroup",
      required: [true, "Group reference is required"],
      index: true,
    },
    // Optional reference to existing FamilyMember database record
    familyMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyMember",
      default: null,
      index: true,
    },
    // User is optional: main user has an account, but invited family members do NOT need an account
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Member name is required"],
      trim: true,
    },
    relationship: {
      type: String,
      trim: true,
      default: "",
    },
    role: {
      type: String,
      enum: ["main", "member"],
      default: "member",
    },
    isAccountUser: {
      type: Boolean,
      default: false,
    },
    // Cryptographically secure invitation token hash & expiry
    inviteTokenHash: {
      type: String,
      default: null,
      index: true,
    },
    inviteExpiresAt: {
      type: Date,
      default: null,
    },
    // Active tracking session token hash & expiry for no-login smartphones
    sessionTokenHash: {
      type: String,
      default: null,
      index: true,
    },
    sessionExpiresAt: {
      type: Date,
      default: null,
    },
    isInvitationAccepted: {
      type: Boolean,
      default: false,
    },
    isLocationSharing: {
      type: Boolean,
      default: false,
    },
    consentGiven: {
      type: Boolean,
      default: false,
    },
    consentGivenAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "removed", "revoked"],
      default: "active",
    },
    consecutiveSeparatedCount: {
      type: Number,
      default: 0,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "family_membership",
  }
);

// Unique compound index for registered account users in the group
familyMembershipSchema.index(
  { group: 1, user: 1 },
  {
    unique: true,
    partialFilterExpression: { user: { $type: "objectId" } },
  }
);

// Unique compound index for existing database family members in the group
familyMembershipSchema.index(
  { group: 1, familyMember: 1 },
  {
    unique: true,
    partialFilterExpression: { familyMember: { $type: "objectId" } },
  }
);

// Helper static method for hashing invitation and session tokens
familyMembershipSchema.statics.hashToken = function (token) {
  if (!token) return "";
  return crypto.createHash("sha256").update(token).digest("hex");
};

const FamilyMembership = mongoose.model(
  "FamilyMembership",
  familyMembershipSchema,
  "family_membership"
);

module.exports = FamilyMembership;
