const mongoose = require("mongoose");

const familyMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Parent user reference is required"],
      index: true,
    },
    // Personal Information
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
    dob: {
      type: String,
      default: "",
    },
    age: {
      type: Number,
      default: null,
    },
    gender: {
      type: String,
      default: "",
    },
    height: {
      type: Number,
      default: null,
    },
    weight: {
      type: Number,
      default: null,
    },
    bloodGroup: {
      type: String,
      default: "",
    },
    nationality: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },
    district: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    profilePhoto: {
      type: String,
      default: "",
    },

    // Emergency Contact
    emergencyContactName: {
      type: String,
      default: "",
    },
    emergencyContactRelationship: {
      type: String,
      default: "",
    },
    emergencyContactPhone: {
      type: String,
      default: "",
    },

    // Medical Information
    chronicConditions: {
      type: String,
      default: "",
    },
    existingConditions: {
      type: [String],
      default: [],
    },
    currentMedicines: {
      type: String,
      default: "",
    },
    drugAllergies: {
      type: String,
      default: "",
    },
    foodAllergies: {
      type: String,
      default: "",
    },
    allergies: {
      type: String,
      default: "",
    },
    previousSurgeries: {
      type: String,
      default: "",
    },
    mobilityLimitations: {
      type: String,
      default: "",
    },
    smokingStatus: {
      type: String,
      default: "",
    },
    alcoholStatus: {
      type: String,
      default: "",
    },

    // Health Measurements
    bloodPressure: {
      type: String,
      default: "",
    },
    bloodSugar: {
      type: String,
      default: "",
    },
    heartRate: {
      type: String,
      default: "",
    },
    spo2: {
      type: String,
      default: "",
    },
    hemoglobin: {
      type: String,
      default: "",
    },

    // Fitness Information
    activityLevel: {
      type: String,
      default: "",
    },
    walkingCapacity: {
      type: String,
      default: "",
    },
    stairClimbing: {
      type: String,
      default: "",
    },
    usesAssistance: {
      type: String,
      default: "",
    },

    // Medical Reports Uploaded
    reports: [
      {
        fileName: { type: String, required: true },
        fileType: { type: String, default: "pdf" },
        category: { type: String, default: "Other Medical Report" },
        uploadDate: { type: String, default: "" },
        uploadedBy: { type: String, default: "" },
        url: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true,
    collection: "family_member",
  }
);

const FamilyMember = mongoose.model("FamilyMember", familyMemberSchema, "family_member");

module.exports = FamilyMember;
