const mongoose = require("mongoose");
const assert = require("assert");
require("dotenv").config();

const IoTDevice = require("../models/IoTDevice");
const FamilyGroup = require("../models/FamilyGroup");
const SeparationAlert = require("../models/SeparationAlert");
const User = require("../models/User");

async function runBuzzerAckTest() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB Atlas.");

    // Find our test group
    const group = await FamilyGroup.findOne({ pairedDeviceId: "ESP32-TRACKER-01" });
    assert(group, "Found group paired with ESP32-TRACKER-01");

    const device = await IoTDevice.findOne({ deviceId: "ESP32-TRACKER-01" });
    assert(device, "Found IoTDevice ESP32-TRACKER-01");

    // 1. Clean up old test alerts for this group
    await SeparationAlert.deleteMany({ group: group._id, memberName: "Physical Buzzer Test" });

    // 2. Simulate triggerBuzzerTest creating a test alert
    const testAlert = await SeparationAlert.create({
      group: group._id,
      mainUser: group.creator,
      memberName: "Physical Buzzer Test",
      distanceMeters: 0,
      thresholdMeters: group.separationThreshold || 5,
      severity: "warning",
      buzzerPattern: "warning_short",
      memberLocation: { latitude: 0, longitude: 0, accuracy: 1, recordedAt: new Date() },
      mainLocation: { latitude: 0, longitude: 0, accuracy: 1, recordedAt: new Date() },
      status: "active",
      deviceCommandDelivered: false,
    });
    console.log("[PASS] Created test alert:", testAlert._id.toString());

    // 3. Simulate ESP32 calling iotGetPendingCommands
    const activeAlert = await SeparationAlert.findOne({
      group: device.group,
      status: "active",
      deviceCommandDelivered: false,
    }).sort({ createdAt: -1 });

    assert(activeAlert !== null, "Backend finds the active, undelivered test alert");
    assert(activeAlert._id.toString() === testAlert._id.toString(), "Alert IDs match");
    console.log("[PASS] ESP32 retrieves command for alert:", activeAlert._id.toString());

    // 4. Simulate ESP32 acknowledging command
    testAlert.deviceCommandDelivered = true;
    testAlert.deviceAcknowledgedAt = new Date();
    testAlert.status = "acknowledged_by_device";
    await testAlert.save();
    console.log("[PASS] Alert successfully acknowledged and saved.");

    // 5. Simulate subsequent poll by ESP32
    const subsequentAlert = await SeparationAlert.findOne({
      group: device.group,
      status: "active",
      deviceCommandDelivered: false,
    });
    assert(subsequentAlert === null, "Subsequent poll finds NO active commands (buzzer remains OFF)");
    console.log("[PASS] Subsequent poll returns SAFE / no command.");

    // Clean up test alert
    await SeparationAlert.findByIdAndDelete(testAlert._id);
    console.log("[PASS] Test alert cleaned up.");

    console.log("\nAll buzzer acknowledgment & de-duplication tests passed!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

runBuzzerAckTest();
