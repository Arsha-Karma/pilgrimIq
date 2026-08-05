const mongoose = require("mongoose");

const familyMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Parent user reference is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Family member name is required"],
      trim: true,
    },
    relationship: {
      type: String,
      required: [true, "Relationship is required"],
      trim: true,
    },
    age: {
      type: Number,
      default: null,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Male",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    bloodGroup: {
      type: String,
      trim: true,
      default: "",
    },
    medicalConditions: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "family_member", // Explicit MongoDB collection name 'family_member'
  }
);

const FamilyMember = mongoose.model("FamilyMember", familyMemberSchema, "family_member");

module.exports = FamilyMember;
