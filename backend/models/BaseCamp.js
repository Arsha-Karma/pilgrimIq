const mongoose = require("mongoose");

const baseCampSchema = new mongoose.Schema(
  {
    baseCampId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Base Camp Name is required"],
      trim: true,
      minlength: [3, "Base Camp Name must be at least 3 characters"],
      maxlength: [100, "Base Camp Name cannot exceed 100 characters"],
    },
    campType: {
      type: String,
      required: [true, "Camp Type is required"],
      enum: [
        "Pilgrimage Base Camp",
        "Medical Base Camp",
        "Accommodation Base Camp",
        "Transit Base Camp",
        "Multi-Purpose Base Camp",
      ],
      default: "Pilgrimage Base Camp",
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      minlength: [10, "Address must be at least 10 characters"],
      maxlength: [300, "Address cannot exceed 300 characters"],
      trim: true,
    },
    locality: {
      type: String,
      required: [true, "Village / Locality is required"],
      trim: true,
    },
    district: {
      type: String,
      required: [true, "District is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    pinCode: {
      type: String,
      required: [true, "PIN Code is required"],
      match: [/^[0-9]{6}$/, "PIN Code must contain exactly 6 digits"],
    },
    latitude: {
      type: Number,
      required: [true, "Latitude is required"],
      min: [-90, "Latitude must be between -90 and 90"],
      max: [90, "Latitude must be between -90 and 90"],
    },
    longitude: {
      type: Number,
      required: [true, "Longitude is required"],
      min: [-180, "Longitude must be between -180 and 180"],
      max: [180, "Longitude must be between -180 and 180"],
    },
    maximumCapacity: {
      type: Number,
      required: [true, "Maximum Capacity is required"],
      min: [1, "Maximum capacity must be at least 1"],
    },
    currentOccupancy: {
      type: Number,
      default: 0,
      min: [0, "Current occupancy cannot be negative"],
    },
    facilities: {
      medicalFacility: { type: Boolean, default: false },
      doctorAvailable: { type: Boolean, default: false },
      pharmacy: { type: Boolean, default: false },
      drinkingWater: { type: Boolean, default: true },
      toilets: { type: Boolean, default: true },
      foodFacility: { type: Boolean, default: false },
      restArea: { type: Boolean, default: true },
      ambulanceAccess: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      emergencySupport: { type: Boolean, default: false },
      security247: { type: Boolean, default: false },
      accessibilityFacility: { type: Boolean, default: false },
    },
    medicalFacility: {
      type: Boolean,
      default: false,
    },
    medicalDetails: {
      medicalFacilityName: { type: String, default: "" },
      numberOfDoctors: { type: Number, default: 0 },
      numberOfNurses: { type: Number, default: 0 },
      numberOfBeds: { type: Number, default: 0 },
      emergencyMedicalSupport: {
        type: String,
        enum: ["Available 24/7", "Available During Operational Hours", "Not Available"],
        default: "Not Available",
      },
    },
    contactPerson: {
      type: String,
      required: [true, "Camp Contact Person is required"],
      trim: true,
      minlength: [3, "Contact person name must be at least 3 characters"],
      maxlength: [100, "Contact person name cannot exceed 100 characters"],
    },
    contactNumber: {
      type: String,
      required: [true, "Contact Number is required"],
      trim: true,
      match: [/^[0-9]{10,12}$/, "Please enter a valid contact number (10-12 digits)"],
    },
    alternateContact: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["Operational", "Temporarily Closed", "Under Maintenance", "Inactive"],
      default: "Operational",
    },
    openingDate: {
      type: Date,
      required: [true, "Opening Date is required"],
    },
    openingTime: {
      type: String,
      default: "06:00 AM",
    },
    closingTime: {
      type: String,
      default: "10:00 PM",
    },
    emergencySupport: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    specialInstructions: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BaseCamp", baseCampSchema);
