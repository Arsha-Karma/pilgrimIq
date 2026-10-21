const mongoose = require("mongoose");

const memberLocationSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyGroup",
      required: [true, "Group reference is required"],
      index: true,
    },
    // Membership reference links directly to the family member (with or without user account)
    membership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyMembership",
      default: null,
      index: true,
    },
    // User reference is preserved for account-holding users (e.g. main user)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    memberName: {
      type: String,
      default: "",
    },
    latitude: {
      type: Number,
      required: [true, "Latitude is required"],
      min: [-90, "Latitude must be >= -90"],
      max: [90, "Latitude must be <= 90"],
    },
    longitude: {
      type: Number,
      required: [true, "Longitude is required"],
      min: [-180, "Longitude must be >= -180"],
      max: [180, "Longitude must be <= 180"],
    },
    accuracy: {
      type: Number,
      default: 0,
      min: [0, "Accuracy cannot be negative"],
    },
    altitude: {
      type: Number,
      default: null,
    },
    speed: {
      type: Number,
      default: null,
    },
    heading: {
      type: Number,
      default: null,
    },
    clientTimestamp: {
      type: Date,
      default: Date.now,
    },
    serverReceivedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    distanceFromMain: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["live", "stale", "unavailable", "stopped", "separated"],
      default: "live",
    },
    isSimulated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "member_location",
  }
);

// Indexes for fast lookup of latest locations per group/user and group/membership
memberLocationSchema.index({ group: 1, membership: 1, serverReceivedAt: -1 });
memberLocationSchema.index({ group: 1, user: 1, serverReceivedAt: -1 });

const MemberLocation = mongoose.model(
  "MemberLocation",
  memberLocationSchema,
  "member_location"
);

module.exports = MemberLocation;
