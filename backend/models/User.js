const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, "Please provide a valid email address"],
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
      minlength: [6, "Password must be at least 6 characters long"],
    },
    googleId: {
      type: String,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    role: {
      type: String,
      enum: ["user", "physician", "admin"],
      default: "user",
    },
    specialization: {
      type: String,
      default: "",
    },
    assignedCamp: {
      type: String,
      default: "",
    },
    doctorCode: {
      type: String,
      default: "",
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpire: {
      type: Date,
      default: null,
    },
    location: {
      type: String,
      default: "",
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
    bloodGroup: {
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
    preferredLanguage: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    completionPercentage: {
      type: Number,
      default: 0,
    },
    psiScore: {
      type: Number,
      default: 100,
    },
    psiRiskLevel: {
      type: String,
      default: "Low Risk",
    },
    doctorApprovalStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    responsibilityAccepted: {
      type: Boolean,
      default: false,
    },
    responsibilityAcceptedAt: {
      type: Date,
      default: null,
    },
    doctorReason: {
      type: String,
      default: "",
    },
    healthInfo: {
      chronicDiseases: { type: String, default: "" },
      allergies: { type: String, default: "" },
      currentMedicines: { type: String, default: "" },
      bloodGroup: { type: String, default: "" },
      bmi: { type: String, default: "" },
      fitnessLevel: { type: String, default: "" },
      medicalConditions: { type: String, default: "" },
      disabilities: { type: String, default: "" },
    },
    medicalInfo: {
      existingConditions: [{ type: String }],
      otherCondition: { type: String, default: "" },
      previousSurgeries: { type: String, default: "" },
      currentMedications: { type: String, default: "" },
      drugAllergies: { type: String, default: "" },
      foodAllergies: { type: String, default: "" },
      mobilityLimitations: { type: String, default: "" },
      visionProblems: { type: String, default: "" },
      hearingProblems: { type: String, default: "" },
      smokingStatus: { type: String, default: "" },
      alcoholStatus: { type: String, default: "" },
      pregnancyStatus: { type: String, default: "" },
    },
    healthMeasurements: {
      restingBP: { type: String, default: "" },
      bloodSugar: { type: String, default: "" },
      heartRate: { type: String, default: "" },
      spo2: { type: String, default: "" },
      hemoglobin: { type: String, default: "" },
    },
    fitnessInfo: {
      activityLevel: { type: String, default: "" },
      continuousWalking: { type: String, default: "" },
      stairClimbing: { type: String, default: "" },
      usesAssistance: { type: String, default: "" },
    },
    medicalReports: [
      {
        fileName: { type: String, required: true },
        fileType: { type: String, default: "pdf" },
        category: { type: String, default: "General" },
        uploadDate: { type: String, default: "" },
        url: { type: String, default: "" },
      },
    ],
    consent: {
      accurate: { type: Boolean, default: false },
      aiRisk: { type: Boolean, default: false },
      terms: { type: Boolean, default: false },
    },
    emergencyContact: {
      contactName: { type: String, default: "" },
      relationship: { type: String, default: "" },
      phone: { type: String, default: "" },
      alternatePhone: { type: String, default: "" },
    },
    pilgrimagePreferences: {
      preferredReligion: { type: String, default: "" },
      preferredLanguage: { type: String, default: "" },
      preferredClimate: { type: String, default: "" },
      travelFrequency: { type: String, default: "" },
      preferredTravelType: { type: String, default: "" },
      specialAssistance: { type: String, default: "" },
    },
    quickOverview: {
      healthRecords: { type: Number, default: 0 },
      upcomingTrips: { type: Number, default: 0 },
      bookings: { type: Number, default: 0 },
      feedbackRating: { type: Number, default: 0 },
    },
    familyMembers: [
      {
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
    ],
  },
  {
    timestamps: true,
    collection: "user", // Explicitly mapping to singular 'user' collection in MongoDB Atlas
  }
);

// Encrypt password using bcrypt before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Explicit collection name 'user' ensures compatibility with MongoDB Atlas collection 'user'
const User = mongoose.model("User", userSchema, "user");

module.exports = User;
