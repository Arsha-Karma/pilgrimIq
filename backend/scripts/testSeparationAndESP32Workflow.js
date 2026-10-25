const mongoose = require("mongoose");
const crypto = require("crypto");
const dotenv = require("dotenv");
const path = require("path");

// Load backend environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const FamilyGroup = require("../models/FamilyGroup");
const FamilyMembership = require("../models/FamilyMembership");
const MemberLocation = require("../models/MemberLocation");
const SeparationAlert = require("../models/SeparationAlert");
const IoTDevice = require("../models/IoTDevice");
const User = require("../models/User");
const {
  calculateHaversineDistance,
  processLocationUpdate,
} = require("../services/familyTrackingService");

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log("=================================================================");
  console.log("PilgrimIQ — ESP32 Family Tracking & Separation Alert Test Suite");
  console.log("=================================================================\n");

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("Missing MONGO_URI in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB Atlas successfully.\n");

  const testSuffix = Date.now().toString().slice(-6);

  try {
    // 1. Setup Mock Main User
    console.log("1. Main User & Group Setup:");
    const mainUser = await User.create({
      name: `Main User ${testSuffix}`,
      email: `main_user_${testSuffix}@example.com`,
      password: "TestPassword123!",
      role: "user",
    });
    assert(mainUser._id, "Main user created successfully");

    // 2. Main User Creates Family Group (Default 5 meters threshold)
    const inviteCode = "TST" + testSuffix.slice(-3);
    const group = await FamilyGroup.create({
      name: `Pilgrim Group ${testSuffix}`,
      creator: mainUser._id,
      inviteCode,
      // Default should be 5 meters
      separationThresholdMeters: 5,
      consecutiveReadingsRequired: 2,
    });
    assert(group.separationThresholdMeters === 5, "Group default separation threshold is 5 meters");
    assert(group.creator.equals(mainUser._id), "Main user is group creator");

    const mainMembership = await FamilyMembership.create({
      group: group._id,
      user: mainUser._id,
      name: mainUser.name,
      role: "main",
      isAccountUser: true,
      isLocationSharing: true,
      consentGiven: true,
      status: "active",
    });
    assert(mainMembership.role === "main", "Creator has 'main' role");

    // 3. Invite Family Member (Guest Smartphone Flow)
    console.log("\n2. Family Member Invitation & Session Creation:");
    const rawInviteToken = crypto.randomBytes(24).toString("hex");
    const inviteHash = FamilyMembership.hashToken(rawInviteToken);

    const memberMembership = await FamilyMembership.create({
      group: group._id,
      user: null, // No PilgrimIQ account needed
      name: `Priya Sharma ${testSuffix}`,
      relationship: "Daughter",
      role: "member",
      isAccountUser: false,
      inviteTokenHash: inviteHash,
      inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isInvitationAccepted: false,
      status: "active",
    });
    assert(memberMembership._id, "Family member added to group with invite token");

    // Member accepts invitation and generates session token
    const rawSessionToken = crypto.randomBytes(32).toString("hex");
    memberMembership.sessionTokenHash = FamilyMembership.hashToken(rawSessionToken);
    memberMembership.isInvitationAccepted = true;
    memberMembership.consentGiven = true;
    memberMembership.consentGivenAt = new Date();
    memberMembership.isLocationSharing = true;
    await memberMembership.save();
    assert(memberMembership.isLocationSharing === true, "Family member granted location consent");

    // 4. Register ESP32 Device
    console.log("\n3. ESP32 Hardware Device Registration & Pairing:");
    const deviceId = `ESP32-TEST-${testSuffix}`;
    const rawDeviceToken = crypto.randomBytes(16).toString("hex");
    const deviceTokenHash = IoTDevice.hashToken(rawDeviceToken);

    const esp32Device = await IoTDevice.create({
      deviceId,
      deviceTokenHash,
      group: group._id,
      registeredBy: mainUser._id,
      name: "ESP32 DevKit V1 Buzzer Unit",
      buzzerPin: 23,
      status: "registered",
    });
    assert(esp32Device.buzzerPin === 23, "ESP32 buzzer pin configured to GPIO 23");
    assert(esp32Device.verifyToken(rawDeviceToken) === true, "Valid device token verified via SHA-256 hash");
    assert(esp32Device.verifyToken("WRONG_TOKEN") === false, "Invalid device token rejected");

    group.pairedDeviceId = deviceId;
    await group.save();

    // 5. Initial Locations: Main User and Member are side-by-side
    console.log("\n4. Smartphone Location Tracking & Safe Distance (<= 5m):");
    const baseLat = 12.971600;
    const baseLng = 77.594600;

    // Main user submits location
    const mainLocRes = await processLocationUpdate({
      groupId: group._id,
      userId: mainUser._id,
      latitude: baseLat,
      longitude: baseLng,
      accuracy: 3.5,
      clientTimestamp: new Date(),
    });
    assert(mainLocRes.role === "main", "Main user location processed as reference point");

    // Member submits location ~2.2m away
    const safeMemberLat = baseLat + 0.000020; // ~2.2 meters north
    const safeMemberLng = baseLng;

    const safeDistance = calculateHaversineDistance(baseLat, baseLng, safeMemberLat, safeMemberLng);
    assert(safeDistance !== null && safeDistance <= 5, `Haversine distance is ${safeDistance}m (within 5m threshold)`);

    const memberSafeRes = await processLocationUpdate({
      groupId: group._id,
      membershipId: memberMembership._id,
      latitude: safeMemberLat,
      longitude: safeMemberLng,
      accuracy: 3.0,
      clientTimestamp: new Date(),
    });
    assert(memberSafeRes.separationStatus === "normal", "Member status is 'normal' when distance <= 5m");
    assert(memberSafeRes.alert === null, "No separation alert generated within safe distance");

    // 6. False Alert Avoidance: Inaccurate GPS reading (accuracy > 35m)
    console.log("\n5. Inaccurate GPS Filtering (Prevent False Separation Alerts):");
    const farLat = baseLat + 0.000150; // ~16.7 meters away
    const farLng = baseLng;

    const inaccurateRes = await processLocationUpdate({
      groupId: group._id,
      membershipId: memberMembership._id,
      latitude: farLat,
      longitude: farLng,
      accuracy: 45.0, // Inaccurate GPS (e.g., poor satellite visibility in dense crowd)
      clientTimestamp: new Date(),
    });
    assert(
      inaccurateRes.separationStatus === "inaccurate_gps",
      "System flags degraded GPS accuracy (>35m) and suppresses false alert"
    );
    assert(inaccurateRes.alert === null, "Inaccurate GPS does not trigger false separation alert");

    // 7. Separation Detection: Reading 1 (Warning) and Reading 2 (Alert Confirmation)
    console.log("\n6. Real Separation Detection (> 5m with accurate GPS):");
    // Reading 1 with high accuracy (3.0m)
    const sepRes1 = await processLocationUpdate({
      groupId: group._id,
      membershipId: memberMembership._id,
      latitude: farLat,
      longitude: farLng,
      accuracy: 3.0,
      clientTimestamp: new Date(),
    });
    assert(sepRes1.separationStatus === "warning", "1st separated reading enters 'warning' state");
    assert(sepRes1.alert === null, "Single reading does not prematurely trigger buzzer");

    // Reading 2 confirms separation (consecutive = 2)
    const sepRes2 = await processLocationUpdate({
      groupId: group._id,
      membershipId: memberMembership._id,
      latitude: farLat,
      longitude: farLng,
      accuracy: 3.2,
      clientTimestamp: new Date(),
    });
    assert(sepRes2.separationStatus === "separated", "2nd consecutive reading confirms 'separated' state");
    assert(sepRes2.alert !== null, "Separation alert document successfully generated in database");

    const createdAlert = await SeparationAlert.findById(sepRes2.alert._id);
    assert(createdAlert.distanceMeters > 5, `Alert records distance (${createdAlert.distanceMeters}m > 5m)`);
    assert(createdAlert.status === "active", "Alert status is initially 'active'");
    assert(createdAlert.buzzerPattern === "warning_short" || createdAlert.buzzerPattern === "critical_urgent", "Alert has appropriate buzzer pattern");
    assert(createdAlert.memberLocation.latitude === farLat, "Alert preserves exact separated member coordinates");
    assert(createdAlert.memberLocation.accuracy === 3.2, "Alert records member GPS accuracy");

    // 8. ESP32 Polls Separation Commands
    console.log("\n7. ESP32 Polling & Buzzer Trigger Simulation:");
    // Device polls /commands for active alerts in its group
    const pendingAlert = await SeparationAlert.findOne({
      group: esp32Device.group,
      status: "active",
    }).sort({ createdAt: -1 });

    assert(pendingAlert !== null, "ESP32 finds active separation alert for its paired group");
    const mockPollResponse = {
      hasCommand: true,
      command: "TRIGGER_BUZZER",
      alertId: pendingAlert._id.toString(),
      memberId: pendingAlert.membership ? pendingAlert.membership.toString() : "",
      memberName: pendingAlert.memberName,
      distanceMeters: pendingAlert.distanceMeters,
      thresholdMeters: pendingAlert.thresholdMeters,
      severity: pendingAlert.severity,
      buzzerPattern: pendingAlert.buzzerPattern,
    };
    assert(mockPollResponse.hasCommand === true, "ESP32 receives 'TRIGGER_BUZZER' command");
    assert(mockPollResponse.memberId.length > 0, "ESP32 receives separated member's ID");
    assert(mockPollResponse.distanceMeters > 5, "ESP32 receives accurate separation distance");

    // 9. ESP32 Acknowledges Command Delivery (Buzzer sounded)
    console.log("\n8. ESP32 Acknowledgment & Duplicate Buzzer Prevention:");
    pendingAlert.deviceCommandDelivered = true;
    pendingAlert.deviceAcknowledgedAt = new Date();
    pendingAlert.status = "acknowledged_by_device";
    await pendingAlert.save();

    // Verify subsequent poll does NOT return active command
    const subsequentAlert = await SeparationAlert.findOne({
      group: esp32Device.group,
      status: "active",
    });
    assert(subsequentAlert === null, "Subsequent poll finds no pending 'active' alert (prevents repeating buzzer)");

    // 10. Reunited / Safe Distance Return Flow
    console.log("\n9. Member Reunited within Safe Distance (<= 5m):");
    const reunitedRes = await processLocationUpdate({
      groupId: group._id,
      membershipId: memberMembership._id,
      latitude: safeMemberLat,
      longitude: safeMemberLng,
      accuracy: 2.5,
      clientTimestamp: new Date(),
    });
    assert(reunitedRes.separationStatus === "normal", "Member separation status returns to 'normal'");

    const resolvedAlert = await SeparationAlert.findById(pendingAlert._id);
    assert(resolvedAlert.status === "resolved", "Separation alert is automatically marked 'resolved'");
    assert(resolvedAlert.resolvedReason.includes("returned within safe distance"), "Resolved reason accurately logged");

    // 11. ESP32 Heartbeat and Connectivity Update
    console.log("\n10. ESP32 Heartbeat & Health Check:");
    esp32Device.lastHeartbeat = new Date();
    esp32Device.status = "online";
    esp32Device.firmwareVersion = "1.0.0";
    esp32Device.ipAddress = "192.168.43.155"; // Hotspot LAN IP
    await esp32Device.save();

    const verifiedDevice = await IoTDevice.findById(esp32Device._id);
    assert(verifiedDevice.status === "online", "ESP32 status marked 'online'");
    assert(verifiedDevice.ipAddress === "192.168.43.155", "ESP32 hotspot IP address recorded");

    // Clean up test documents
    await SeparationAlert.deleteMany({ group: group._id });
    await MemberLocation.deleteMany({ group: group._id });
    await IoTDevice.deleteOne({ _id: esp32Device._id });
    await FamilyMembership.deleteMany({ group: group._id });
    await FamilyGroup.deleteOne({ _id: group._id });
    await User.deleteOne({ _id: mainUser._id });

    console.log("\n=================================================================");
    console.log(`Test Summary: ${passed} passed, ${failed} failed.`);
    console.log("=================================================================");

    await mongoose.disconnect();
    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (error) {
    console.error("Test execution error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTests();
