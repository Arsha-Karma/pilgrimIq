const mongoose = require("mongoose");

const serviceItemSchema = new mongoose.Schema(
  {
    name: { type: String },
    category: { type: String },
    address: { type: String, default: "" },
    latitude: { type: Number },
    longitude: { type: Number },
    distanceKm: { type: Number },
    externalPlaceId: { type: String },
    serviceId: { type: String },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    contactNumber: { type: String, default: "" },
    website: { type: String, default: "" },
    checkIn: { type: Date },
    checkOut: { type: Date },
    roomsCount: { type: Number },
    peopleCount: { type: Number },
    roomType: { type: String },
    facilities: [{ type: String }],
    price: { type: Number },
    status: { type: String, default: "Confirmed" },
    bookingRef: { type: String },
    mealType: { type: String },
    mealPackage: { type: String },
    date: { type: Date },
    time: { type: String },
    quantity: { type: Number },
    pickupLocation: { type: String },
    dropLocation: { type: String },
    pickupTime: { type: String },
    vehicleType: { type: String },
    vehicleInfo: { type: String },
    passengersCount: { type: Number },
    parkingName: { type: String },
    entryTime: { type: String },
    exitTime: { type: String },
    description: { type: String },
  },
  { _id: true, timestamps: true, strict: false }
);

const journeySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pilgrimageCenterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PilgrimageCenter",
      required: [true, "Pilgrimage Center ID is required"],
    },
    journeyDate: {
      type: Date,
      required: [true, "Journey Start Date is required"],
    },
    returnDate: {
      type: Date,
      required: [true, "Expected Return Date is required"],
    },
    travelingFamilyMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FamilyMember",
      },
    ],
    totalPilgrims: {
      type: Number,
      required: true,
      default: 1,
    },
    travelingAlone: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        enum: ["current", "manual"],
        default: "manual",
      },
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    transportMode: {
      type: String,
      enum: ["Car", "Bus", "Train", "Flight", "Taxi/Cab", "Walking", "Other"],
      required: [true, "Mode of transport is required"],
    },
    walkingLevel: {
      type: String,
      enum: ["Low", "Moderate", "High"],
      default: "Moderate",
    },
    budget: {
      type: {
        type: String,
        enum: ["Low", "Moderate", "High", "Custom"],
        default: "Moderate",
      },
      amount: { type: Number, default: 0 },
    },
    accommodationRequired: {
      type: Boolean,
      default: true,
    },
    foodRequired: {
      type: Boolean,
      default: true,
    },
    foodPreference: {
      type: String,
      enum: ["Vegetarian", "Non-Vegetarian", "Vegan", "No preference"],
      default: "No preference",
    },
    searchRadius: {
      type: Number,
      default: 5, // Radius in kilometers (1, 2, 5, 10)
    },
    selectedServices: {
      accommodation: [serviceItemSchema],
      restaurants: [serviceItemSchema],
      parking: [serviceItemSchema],
      transport: [serviceItemSchema],
      hospitals: [serviceItemSchema],
      pharmacies: [serviceItemSchema],
      restrooms: [serviceItemSchema],
      drinkingWater: [serviceItemSchema],
      atms: [serviceItemSchema],
      baseCamps: [serviceItemSchema],
      otherServices: [serviceItemSchema],
    },
    status: {
      type: String,
      enum: ["planned", "ready", "active", "completed", "cancelled", "NOT_STARTED", "IN_PROGRESS", "PAUSED", "COMPLETED", "CANCELLED"],
      default: "planned",
    },
    startedAt: { type: Date },
    pausedAt: { type: Date },
    completedAt: { type: Date },
    currentLocation: {
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      latitude: { type: Number },
      longitude: { type: Number },
      updatedAt: { type: Date },
    },
    startCoordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    destinationCoordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    routeGeometry: {
      type: { type: String, default: "LineString" },
      coordinates: { type: Array, default: [] },
    },
    totalDistance: { type: Number, default: 0 },
    distanceTravelled: { type: Number, default: 0 },
    distanceRemaining: { type: Number, default: 0 },
    progressPercentage: { type: Number, default: 0 },
    estimatedArrivalTime: { type: String, default: "ETA unavailable" },
    locationUpdateCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Journey", journeySchema);
