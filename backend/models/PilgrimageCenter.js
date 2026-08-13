const mongoose = require("mongoose");

const pilgrimageCenterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Center Name is required"],
      trim: true,
      minlength: [3, "Center Name must be at least 3 characters"],
      maxlength: [100, "Center Name cannot exceed 100 characters"],
    },
    religion: {
      type: String,
      required: [true, "Religion / Tradition is required"],
      enum: ["Hindu", "Christian", "Muslim", "Buddhist", "Jain", "Sikh", "Other"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    contact: {
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      website: { type: String, default: "" },
    },
    image: {
      type: String,
      default: "",
    },
    location: {
      address: { type: String, required: [true, "Address is required"] },
      city: { type: String, required: [true, "City is required"] },
      state: { type: String, required: [true, "State is required"] },
      country: { type: String, required: [true, "Country is required"] },
      postalCode: { type: String, required: [true, "Postal Code is required"] },
      latitude: { type: Number, required: [true, "Latitude is required"] },
      longitude: { type: Number, required: [true, "Longitude is required"] },
      googleMapsUrl: { type: String, default: "" },
    },
    timings: {
      openingTime: { type: String, required: [true, "Opening Time is required"] },
      closingTime: { type: String, required: [true, "Closing Time is required"] },
      weeklyClosingDay: { type: String, default: "None" },
      specialNotes: { type: String, default: "" },
    },
    visitingInformation: {
      bestSeason: { type: String, required: [true, "Best Visiting Season is required"] },
      peakSeason: { type: String, default: "" },
      climate: { type: String, required: [true, "Climate is required"] },
      averageVisitDuration: { type: String, default: "" },
      crowdLevel: {
        type: String,
        enum: ["Low", "Moderate", "High", "Very High"],
        default: "Moderate",
      },
      recommendedAgeGroup: { type: String, default: "All Age Groups" },
    },
    difficulty: {
      walking: {
        type: String,
        required: [true, "Walking Difficulty is required"],
        enum: ["Low", "Moderate", "High", "Very High"],
        default: "Moderate",
      },
      climbing: {
        type: String,
        required: [true, "Climbing Difficulty is required"],
        enum: ["Low", "Moderate", "High", "Very High"],
        default: "Moderate",
      },
      walkingDistance: { type: String, default: "" },
      numberOfSteps: { type: String, default: "" },
      terrainType: {
        type: String,
        enum: ["Flat", "Hilly", "Mountain", "Forest", "Mixed"],
        default: "Flat",
      },
      accessibility: { type: String, default: "" },
    },
    rules: [{ type: String }],
    nearbyServices: {
      hospitals: [{ type: String }],
      pharmacies: [{ type: String }],
      restaurants: [{ type: String }],
      accommodation: [{ type: String }],
      parkingAvailable: { type: Boolean, default: false },
      drinkingWaterAvailable: { type: Boolean, default: true },
      restroomAvailable: { type: Boolean, default: true },
      emergencyContact: { type: String, default: "" },
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

module.exports = mongoose.model("PilgrimageCenter", pilgrimageCenterSchema, "pilgrimage_centers");
