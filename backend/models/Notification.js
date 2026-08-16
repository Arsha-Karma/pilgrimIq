const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["DOCTOR_REJECTION", "DOCTOR_APPROVAL", "GENERAL"],
      default: "GENERAL",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    personName: {
      type: String,
      default: "",
    },
    personRelationship: {
      type: String,
      default: "",
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "notifications",
  }
);

module.exports = mongoose.model("Notification", notificationSchema, "notifications");
