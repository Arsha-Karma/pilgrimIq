const mongoose = require("mongoose");

const journeyAssistantConversationSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journey",
      default: null,
    },
    isEmergency: {
      type: Boolean,
      default: false,
    },
    contextSnapshot: {
      journeyStage: { type: String, default: "" },
      riskLevel: { type: String, default: "" },
      doctorApprovalStatus: { type: String, default: "" },
      locationName: { type: String, default: "" },
      weatherCondition: { type: String, default: "" },
    },
    suggestedPlaces: [
      {
        name: { type: String },
        category: { type: String },
        address: { type: String },
        distanceKm: { type: Number },
        latitude: { type: Number },
        longitude: { type: Number },
        phone: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true,
    collection: "journey_assistant_conversations",
  }
);

module.exports = mongoose.model(
  "JourneyAssistantConversation",
  journeyAssistantConversationSchema,
  "journey_assistant_conversations"
);
