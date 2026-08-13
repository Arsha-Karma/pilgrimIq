const mongoose = require("mongoose");

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
      accommodation: [
        {
          name: String,
          category: String,
          address: String,
          latitude: Number,
          longitude: Number,
          distanceKm: Number,
          externalPlaceId: String,
        },
      ],
      restaurants: [
        {
          name: String,
          category: String,
          address: String,
          latitude: Number,
          longitude: Number,
          distanceKm: Number,
          externalPlaceId: String,
        },
      ],
      parking: [
        {
          name: String,
          category: String,
          address: String,
          latitude: Number,
          longitude: Number,
          distanceKm: Number,
          externalPlaceId: String,
        },
      ],
      hospitals: [
        {
          name: String,
          category: String,
          address: String,
          latitude: Number,
          longitude: Number,
          distanceKm: Number,
          externalPlaceId: String,
        },
      ],
      pharmacies: [
        {
          name: String,
          category: String,
          address: String,
          latitude: Number,
          longitude: Number,
          distanceKm: Number,
          externalPlaceId: String,
        },
      ],
      restrooms: [
        {
          name: String,
          category: String,
          address: String,
          latitude: Number,
          longitude: Number,
          distanceKm: Number,
          externalPlaceId: String,
        },
      ],
      drinkingWater: [
        {
          name: String,
          category: String,
          address: String,
          latitude: Number,
          longitude: Number,
          distanceKm: Number,
          externalPlaceId: String,
        },
      ],
      atms: [
        {
          name: String,
          category: String,
          address: String,
          latitude: Number,
          longitude: Number,
          distanceKm: Number,
          externalPlaceId: String,
        },
      ],
    },
    status: {
      type: String,
      enum: ["planned", "ready", "active", "completed", "cancelled"],
      default: "planned",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Journey", journeySchema);
