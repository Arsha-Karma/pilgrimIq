const mongoose = require("mongoose");
const assert = require("assert");
require("dotenv").config({ path: __dirname + "/../.env" });

const User = require("../models/User");
const FamilyGroup = require("../models/FamilyGroup");
const FamilyMembership = require("../models/FamilyMembership");
const MemberLocation = require("../models/MemberLocation");
const SeparationAlert = require("../models/SeparationAlert");
const IoTDevice = require("../models/IoTDevice");
const {
  calculateHaversineDistance,
  isLocationFresh,
} = require("../services/familyTrackingService");

// Test with mocked req/res to verify controller functions directly
const {
  getGroupMembers,
  iotGetPendingCommands,
  iotAcknowledgeCommand,
} = require("../controllers/familyTrackingController");

function mockResponse() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
}

async function runEndToEndVerification() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log("Connected to MongoDB Atlas for E2E Verification.");

    const testSuffix = Date.now().toString().slice(-6);
    const testDeviceId = `ESP32-VERIFY-${testSuffix}`;

    // 1. Setup Test User and Group
    const mainUser = await User.create({
      name: `Tester ${testSuffix}`,
      email: `test-${testSuffix}@example.com`,
      phone: `98765${testSuffix}`,
      password: "password123",
      role: "user",
    });

    const group = await FamilyGroup.create({
      name: `Verify Group ${testSuffix}`,
      creator: mainUser._id,
      inviteCode: `V${testSuffix}`,
      separationThresholdMeters: 5,
      locationFreshnessMinutes: 3,
      pairedDeviceId: testDeviceId,
    });

    const mainMembership = await FamilyMembership.create({
      group: group._id,
      user: mainUser._id,
      name: mainUser.name,
      role: "main",
      status: "active",
      isLocationSharing: true,
      consentGiven: true,
    });

    const rawToken = "verify-token-" + testSuffix;
    const device = await IoTDevice.create({
      deviceId: testDeviceId,
      deviceTokenHash: IoTDevice.hashToken(rawToken),
      group: group._id,
      registeredBy: mainUser._id,
      status: "registered",
      buzzerPin: 23,
    });

    // 2. Add Guest Family Member
    const member = await FamilyMembership.create({
      group: group._id,
      name: "Separated Pilgrim Member",
      relationship: "Parent",
      role: "member",
      isAccountUser: false,
      isInvitationAccepted: true,
      isLocationSharing: true,
      consentGiven: true,
      status: "active",
    });

    console.log("\n[Test 1] Initial state: No locations recorded yet.");
    let reqCmd = { device };
    let resCmd = mockResponse();
    await iotGetPendingCommands(reqCmd, resCmd, (err) => { if (err) throw err; });
    assert.strictEqual(resCmd.data.hasCommand, false, "No command dispatched when idle");
    assert.strictEqual(resCmd.data.status, "SAFE", "Safe status returned when idle");
    console.log("  [PASS] Idle poll correctly reports status: SAFE");

    // 3. Stale / Stopped Location Handling (Ensure No False Alerts)
    console.log("\n[Test 2] Stopped & Stale Location Rejection (Prevent False SEPARATED on Dashboard & ESP32):");
    // Main user stopped with lat 0, lng 0
    await MemberLocation.create({
      group: group._id,
      membership: mainMembership._id,
      user: mainUser._id,
      latitude: 0,
      longitude: 0,
      status: "stopped",
      serverReceivedAt: new Date(),
    });

    // Member has stale location from 20 minutes ago
    await MemberLocation.create({
      group: group._id,
      membership: member._id,
      latitude: 9.5285,
      longitude: 76.8225,
      status: "live",
      serverReceivedAt: new Date(Date.now() - 20 * 60 * 1000),
    });

    // Dashboard check
    let reqMembers = { params: { groupId: group._id }, user: mainUser };
    let resMembers = mockResponse();
    await getGroupMembers(reqMembers, resMembers, (err) => { if (err) throw err; });
    const memberDashboardStatus = resMembers.data.members.find((m) => m.role === "member");
    assert.strictEqual(memberDashboardStatus.isSeparated, false, "Stale/stopped GPS is NOT displayed as separated on dashboard");
    console.log("  [PASS] Dashboard correctly suppresses false SEPARATED when coordinates are stopped/stale.");

    // ESP32 poll check
    resCmd = mockResponse();
    await iotGetPendingCommands(reqCmd, resCmd, (err) => { if (err) throw err; });
    assert.strictEqual(resCmd.data.hasCommand, false, "ESP32 poll ignores stale GPS");
    assert.strictEqual(resCmd.data.status, "SAFE", "ESP32 receives SAFE status");
    console.log("  [PASS] ESP32 commands endpoint ignores stale/stopped GPS.");

    // 4. Real Separation Detection (> 5m with fresh coordinates)
    console.log("\n[Test 3] Genuine Separation Detection (> 5m with fresh coordinates):");
    const baseLat = 9.528200;
    const baseLng = 76.822175;
    // Main user fresh location
    await MemberLocation.create({
      group: group._id,
      membership: mainMembership._id,
      user: mainUser._id,
      latitude: baseLat,
      longitude: baseLng,
      accuracy: 5,
      status: "live",
      serverReceivedAt: new Date(),
    });

    // Member fresh location ~30m away
    const sepLat = baseLat + 0.00027; // ~30m north
    const sepLng = baseLng;
    await MemberLocation.create({
      group: group._id,
      membership: member._id,
      latitude: sepLat,
      longitude: sepLng,
      accuracy: 6,
      status: "live",
      serverReceivedAt: new Date(),
    });

    // Dashboard check: must show member as separated
    resMembers = mockResponse();
    await getGroupMembers(reqMembers, resMembers, (err) => { if (err) throw err; });
    const sepDashboardMember = resMembers.data.members.find((m) => m.role === "member");
    assert.strictEqual(sepDashboardMember.isSeparated, true, "Dashboard displays member as separated");
    assert(sepDashboardMember.distanceMeters > 5, "Dashboard reports accurate distance > 5m");
    console.log(`  [PASS] Dashboard detects real separation (Distance: ${sepDashboardMember.distanceMeters}m > 5m).`);

    // ESP32 poll check: must return genuine TRIGGER_BUZZER command
    resCmd = mockResponse();
    await iotGetPendingCommands(reqCmd, resCmd, (err) => { if (err) throw err; });
    assert.strictEqual(resCmd.data.hasCommand, true, "ESP32 receives hasCommand: true");
    assert.strictEqual(resCmd.data.command, "TRIGGER_BUZZER", "Command is TRIGGER_BUZZER");
    assert(resCmd.data.alertId, "Alert ID returned to ESP32");
    assert(resCmd.data.distanceMeters > 5, "Real separation distance returned");
    assert.strictEqual(resCmd.data.memberName, "Separated Pilgrim Member", "Separated member's name returned");
    console.log(`  [PASS] ESP32 received TRIGGER_BUZZER command! Alert ID: ${resCmd.data.alertId}, Distance: ${resCmd.data.distanceMeters}m`);

    // 5. ESP32 Acknowledges Command Delivery
    console.log("\n[Test 4] ESP32 Command Acknowledgment & Duplicate Suppression:");
    const alertIdToAck = resCmd.data.alertId;
    let reqAck = { body: { alertId: alertIdToAck } };
    let resAck = mockResponse();
    await iotAcknowledgeCommand(reqAck, resAck, (err) => { if (err) throw err; });
    assert.strictEqual(resAck.statusCode, 200, "Acknowledge returns HTTP 200");
    assert.strictEqual(resAck.data.status, "acknowledged_by_device", "Status updated to acknowledged_by_device");
    console.log("  [PASS] ESP32 acknowledged command delivery successfully.");

    // Subsequent poll by ESP32: buzzer must NOT re-trigger continuously while separated
    resCmd = mockResponse();
    await iotGetPendingCommands(reqCmd, resCmd, (err) => { if (err) throw err; });
    assert.strictEqual(resCmd.data.hasCommand, false, "Subsequent poll suppresses duplicate buzzer command");
    assert.strictEqual(resCmd.data.status, "SAFE", "ESP32 reports SAFE to keep buzzer pin strictly OFF");
    console.log("  [PASS] Subsequent poll suppresses duplicate buzzer while separation persists.");

    // Dashboard check: Dashboard still displays member as separated
    resMembers = mockResponse();
    await getGroupMembers(reqMembers, resMembers, (err) => { if (err) throw err; });
    const stillSeparatedMember = resMembers.data.members.find((m) => m.role === "member");
    assert.strictEqual(stillSeparatedMember.isSeparated, true, "Dashboard correctly keeps displaying SEPARATED");
    console.log("  [PASS] Dashboard preserves SEPARATED status on screen.");

    // 6. Member Reunited within Safe Distance (<= 5m)
    console.log("\n[Test 5] Member Reunited within Safe Distance (<= 5m):");
    await MemberLocation.create({
      group: group._id,
      membership: member._id,
      latitude: baseLat + 0.00001, // ~1.1m away
      longitude: baseLng,
      accuracy: 3,
      status: "live",
      serverReceivedAt: new Date(),
    });

    resMembers = mockResponse();
    await getGroupMembers(reqMembers, resMembers, (err) => { if (err) throw err; });
    const reunitedMember = resMembers.data.members.find((m) => m.role === "member");
    assert.strictEqual(reunitedMember.isSeparated, false, "Dashboard updates to SAFE (isSeparated: false)");
    console.log("  [PASS] Dashboard reflects safe distance.");

    resCmd = mockResponse();
    await iotGetPendingCommands(reqCmd, resCmd, (err) => { if (err) throw err; });
    assert.strictEqual(resCmd.data.hasCommand, false, "ESP32 continues reporting SAFE");

    // Check alert status in DB
    const resolvedAlert = await SeparationAlert.findById(alertIdToAck);
    assert.strictEqual(resolvedAlert.status, "resolved", "Separation alert is automatically marked resolved");
    console.log("  [PASS] Separation alert successfully resolved upon reunion.");

    // Clean up test data
    await SeparationAlert.deleteMany({ group: group._id });
    await MemberLocation.deleteMany({ group: group._id });
    await FamilyMembership.deleteMany({ group: group._id });
    await IoTDevice.deleteOne({ _id: device._id });
    await FamilyGroup.deleteOne({ _id: group._id });
    await User.deleteOne({ _id: mainUser._id });

    console.log("\n=======================================================");
    console.log("ALL END-TO-END VERIFICATION CHECKS PASSED (5/5)!");
    console.log("=======================================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
}

runEndToEndVerification();
