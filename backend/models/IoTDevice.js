const mongoose = require("mongoose");
const crypto = require("crypto");

const ioTDeviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: [true, "Device ID is required"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    deviceTokenHash: {
      type: String,
      required: [true, "Device token hash is required"],
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyGroup",
      default: null,
      index: true,
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Registering user is required"],
    },
    name: {
      type: String,
      default: "ESP32 DevKit V1 Tracker",
      trim: true,
    },
    status: {
      type: String,
      enum: ["registered", "online", "offline"],
      default: "registered",
    },
    lastHeartbeat: {
      type: Date,
      default: null,
    },
    firmwareVersion: {
      type: String,
      default: "1.0.0",
    },
    batteryLevel: {
      type: Number,
      default: 100,
    },
    buzzerPin: {
      type: Number,
      default: 23,
    },
    ipAddress: {
      type: String,
      default: "",
    },
    pendingTestCommand: {
      type: Boolean,
      default: false,
    },
    testCommandPattern: {
      type: String,
      default: "warning_short",
    },
  },
  {
    timestamps: true,
    collection: "iot_device",
  }
);

// Helper static method to generate hash for device token
ioTDeviceSchema.statics.hashToken = function (token) {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// Helper method to verify token
ioTDeviceSchema.methods.verifyToken = function (token) {
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return this.deviceTokenHash === hash;
};

const IoTDevice = mongoose.model("IoTDevice", ioTDeviceSchema, "iot_device");

module.exports = IoTDevice;
