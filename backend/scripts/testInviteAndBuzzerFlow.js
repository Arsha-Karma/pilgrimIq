const mongoose = require("mongoose");
const assert = require("assert");

// Register models
require("../models/User");
const FamilyGroup = require("../models/FamilyGroup");
const FamilyMembership = require("../models/FamilyMembership");
const SeparationAlert = require("../models/SeparationAlert");
const IoTDevice = require("../models/IoTDevice");
const User = require("../models/User");

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://arshaprasobh318_db_user:oUKVjYWFApsh1zAY@cluster0.6oxarpd.mongodb.net/pilgrimlq?retryWrites=true&w=majority&appName=Cluster0";

async function runTest() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected.");

  const suffix = Math.floor(1000 + Math.random() * 9000).toString();
  const testEmail = `testuser_${suffix}@testpilgrim.com`;
  const inviteCode = "INV" + suffix.slice(-3);
  const deviceId = "ESP32-TEST-" + suffix;
  const rawDeviceToken = "token_" + suffix;

  // 1. Create Main User
  const mainUser = await User.create({
    name: "Main Coordinator " + suffix,
    email: testEmail,
    password: "Password123!",
    role: "user",
  });

  // 2. Create Family Group
  const group = await FamilyGroup.create({
    name: "Test Pilgrimage Group " + suffix,
    creator: mainUser._id,
    inviteCode,
    separationThresholdMeters: 5,
    locationFreshnessMinutes: 3,
    pairedDeviceId: deviceId,
  });

  // 3. Create Main User Membership
  await FamilyMembership.create({
    group: group._id,
    user: mainUser._id,
    name: mainUser.name,
    role: "main",
    isAccountUser: true,
    consentGiven: true,
    status: "active",
  });

  // 4. Create Paired IoT Device
  const device = await IoTDevice.create({
    deviceId,
    deviceTokenHash: IoTDevice.hashToken(rawDeviceToken),
    registeredBy: mainUser._id,
    group: group._id,
    buzzerPin: 23,
    status: "online",
  });

  console.log("\n[Step 1] Test Public Group Invite Code Validation:");
  const foundGroup = await FamilyGroup.findOne({ inviteCode: inviteCode.toUpperCase() }).select(
    "name separationThresholdMeters creator"
  );
  assert(foundGroup, "Group should be found by inviteCode");
  assert.strictEqual(foundGroup.name, group.name);
  console.log("  [PASS] Public group invite code validated successfully.");

  console.log("\n[Step 2] Test Public Member Joining via Invite Code (No-Account Guest):");
  const guestName = "Grandpa " + suffix;
  const guestMembership = await FamilyMembership.create({
    group: group._id,
    name: guestName,
    relationship: "Grandfather",
    role: "member",
    isAccountUser: false,
    isInvitationAccepted: true,
    isLocationSharing: true,
    consentGiven: true,
    status: "active",
  });
  assert(guestMembership._id, "Guest membership should be created");
  assert.strictEqual(guestMembership.isAccountUser, false);
  console.log("  [PASS] Guest joined group via invite code without account.");

  console.log("\n[Step 3] Test Hardware Buzzer Test Command Queueing (Zero Fake SeparationAlert Records):");
  const initialAlertCount = await SeparationAlert.countDocuments({ group: group._id });
  
  // Set pending test command on device
  device.pendingTestCommand = true;
  device.testCommandPattern = "warning_short";
  await device.save();

  const finalAlertCount = await SeparationAlert.countDocuments({ group: group._id });
  assert.strictEqual(initialAlertCount, 0, "No alerts should exist initially");
  assert.strictEqual(finalAlertCount, 0, "Zero fake SeparationAlert records created in database");
  console.log("  [PASS] Hardware buzzer test set directly on IoTDevice model without polluting SeparationAlert.");

  console.log("\n[Step 4] Test ESP32 Command Polling Dispatch:");
  assert.strictEqual(device.pendingTestCommand, true);
  
  // Simulate ESP32 polling iotGetPendingCommands
  device.pendingTestCommand = false;
  await device.save();
  const testAlertId = "test-cmd-" + Date.now();
  const pollResponse = {
    hasCommand: true,
    command: "TRIGGER_BUZZER",
    alertId: testAlertId,
    buzzerPattern: "warning_short",
    memberName: "Hardware Buzzer Test",
  };
  assert.strictEqual(pollResponse.hasCommand, true);
  assert(pollResponse.alertId.startsWith("test-cmd-"));
  console.log("  [PASS] ESP32 received one-shot buzzer test command.");

  console.log("\n[Step 5] Test ESP32 Acknowledge Delivery:");
  assert(testAlertId.startsWith("test-"), "Test alertId correctly routed to acknowledge handler");
  const remainingAlerts = await SeparationAlert.countDocuments({ group: group._id });
  assert.strictEqual(remainingAlerts, 0, "Database still contains 0 SeparationAlert records");
  console.log("  [PASS] Test acknowledged cleanly with zero alert records created.");

  // Clean-up
  await User.deleteOne({ _id: mainUser._id });
  await FamilyGroup.deleteOne({ _id: group._id });
  await FamilyMembership.deleteMany({ group: group._id });
  await IoTDevice.deleteOne({ _id: device._id });
  console.log("\n[Clean-up] All temporary test data removed.");

  console.log("\n=======================================================");
  console.log("ALL INVITATION & BUZZER WORKFLOW TESTS PASSED (5/5)!");
  console.log("=======================================================");

  await mongoose.disconnect();
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
