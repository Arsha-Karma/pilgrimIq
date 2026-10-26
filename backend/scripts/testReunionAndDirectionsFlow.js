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

const {
  getGroupMembers,
  resolveAlert,
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

let passed = 0;
let failed = 0;

function check(condition, testName) {
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
  console.log("PilgrimIQ — Family Tracking: Directions & Mark Reunited Suite");
  console.log("=================================================================\n");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("Missing MONGO_URI in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB Atlas successfully.\n");

  const testSuffix = Date.now().toString().slice(-6);
  const testDeviceId = `ESP32-REUNION-${testSuffix}`;

  try {
    // -------------------------------------------------------------
    // Test Set 1: Distance Calculation & Google Maps Directions
    // -------------------------------------------------------------
    console.log("1. Distance Calculation & Google Maps Directions Validation:");
    const mainLat = 12.9716;
    const mainLng = 77.5946;
    // ~70m away
    const memberLat = mainLat + 0.00063;
    const memberLng = mainLng;

    const distance = calculateHaversineDistance(mainLat, mainLng, memberLat, memberLng);
    check(distance !== null && distance >= 68 && distance <= 72, `Haversine distance calculated accurately (${distance}m, ~70m)`);

    // Verify Google Maps URL construction logic
    function buildGoogleMapsDirectionsUrl(originLat, originLng, destLat, destLng) {
      if (
        typeof originLat !== "number" || typeof originLng !== "number" ||
        typeof destLat !== "number" || typeof destLng !== "number" ||
        isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng) ||
        originLat < -90 || originLat > 90 || originLng < -180 || originLng > 180 ||
        destLat < -90 || destLat > 90 || destLng < -180 || destLng > 180 ||
        (originLat === 0 && originLng === 0) || (destLat === 0 && destLng === 0)
      ) {
        return null;
      }
      return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
    }

    const validUrl = buildGoogleMapsDirectionsUrl(mainLat, mainLng, memberLat, memberLng);
    check(
      validUrl === `https://www.google.com/maps/dir/?api=1&origin=12.9716,77.5946&destination=${memberLat},77.5946&travelmode=driving`,
      "Google Maps URL uses main user coordinates as origin and separated member coordinates as destination"
    );

    const invalidUrl = buildGoogleMapsDirectionsUrl(null, 77.5946, memberLat, memberLng);
    check(invalidUrl === null, "Invalid origin coordinates rejected without opening incorrect route");

    // Freshness check validation
    const freshTimestamp = new Date(Date.now() - 30 * 1000); // 30s ago
    const staleTimestamp = new Date(Date.now() - 10 * 60 * 1000); // 10 min ago
    check(isLocationFresh(freshTimestamp, 3) === true, "Fresh location (30s ago) recognized as live");
    check(isLocationFresh(staleTimestamp, 3) === false, "Stale location (10 min ago) flagged as stale");

    // -------------------------------------------------------------
    // Test Set 2: Group Setup with Multiple Members & Paired ESP32
    // -------------------------------------------------------------
    console.log("\n2. Group Setup with Multiple Members & Paired ESP32:");
    const mainUser = await User.create({
      name: `Arsha Creator ${testSuffix}`,
      email: `arsha_${testSuffix}@example.com`,
      password: "TestPassword123!",
      role: "user",
    });

    const otherUser = await User.create({
      name: `Unauthorized User ${testSuffix}`,
      email: `unauth_${testSuffix}@example.com`,
      password: "TestPassword123!",
      role: "user",
    });

    const group = await FamilyGroup.create({
      name: `Pilgrim Group ${testSuffix}`,
      creator: mainUser._id,
      inviteCode: `R${testSuffix}`,
      separationThresholdMeters: 50,
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

    const member1 = await FamilyMembership.create({
      group: group._id,
      name: "Kishor (Member 1)",
      relationship: "Father",
      role: "member",
      isAccountUser: false,
      isInvitationAccepted: true,
      isLocationSharing: true,
      consentGiven: true,
      status: "active",
    });

    const member2 = await FamilyMembership.create({
      group: group._id,
      name: "Sunita (Member 2)",
      relationship: "Mother",
      role: "member",
      isAccountUser: false,
      isInvitationAccepted: true,
      isLocationSharing: true,
      consentGiven: true,
      status: "active",
    });

    const rawDeviceToken = "device-secret-" + testSuffix;
    const device = await IoTDevice.create({
      deviceId: testDeviceId,
      deviceTokenHash: IoTDevice.hashToken(rawDeviceToken),
      group: group._id,
      registeredBy: mainUser._id,
      status: "online",
      buzzerPin: 23,
    });

    check(mainMembership._id && member1._id && member2._id, "Group created with main user and two family members");
    check(device.deviceId === testDeviceId, "ESP32 tracker paired with group on GPIO 23");

    // -------------------------------------------------------------
    // Test Set 3: Multiple Separations (Both Member 1 & Member 2 Separated)
    // -------------------------------------------------------------
    console.log("\n3. Multiple Active Separations (Both Members Separated):");
    const mainLocTime = new Date();
    await MemberLocation.create({
      group: group._id,
      membership: mainMembership._id,
      user: mainUser._id,
      latitude: mainLat,
      longitude: mainLng,
      accuracy: 5,
      status: "live",
      serverReceivedAt: mainLocTime,
    });

    // Member 1 is 70m away (> 50m threshold)
    const m1LocTime = new Date(Date.now() - 5000);
    await MemberLocation.create({
      group: group._id,
      membership: member1._id,
      latitude: memberLat,
      longitude: memberLng,
      accuracy: 6,
      status: "live",
      serverReceivedAt: m1LocTime,
    });

    // Member 2 is 85m away (> 50m threshold)
    const m2Lat = mainLat - 0.00076;
    const m2Lng = mainLng;
    const m2LocTime = new Date(Date.now() - 5000);
    await MemberLocation.create({
      group: group._id,
      membership: member2._id,
      latitude: m2Lat,
      longitude: m2Lng,
      accuracy: 5,
      status: "live",
      serverReceivedAt: m2LocTime,
    });

    // Create Active SeparationAlert for Member 1
    const alert1 = await SeparationAlert.create({
      group: group._id,
      membership: member1._id,
      memberName: member1.name,
      mainUser: mainUser._id,
      distanceMeters: 70,
      thresholdMeters: 50,
      severity: "warning",
      buzzerPattern: "warning_short",
      memberLocation: {
        latitude: memberLat,
        longitude: memberLng,
        accuracy: 6,
        recordedAt: m1LocTime,
      },
      mainLocation: {
        latitude: mainLat,
        longitude: mainLng,
        accuracy: 5,
        recordedAt: mainLocTime,
      },
      status: "active",
      deviceCommandDelivered: false,
    });

    // Create Active SeparationAlert for Member 2
    const alert2 = await SeparationAlert.create({
      group: group._id,
      membership: member2._id,
      memberName: member2.name,
      mainUser: mainUser._id,
      distanceMeters: 85,
      thresholdMeters: 50,
      severity: "warning",
      buzzerPattern: "warning_short",
      memberLocation: {
        latitude: m2Lat,
        longitude: m2Lng,
        accuracy: 5,
        recordedAt: m2LocTime,
      },
      mainLocation: {
        latitude: mainLat,
        longitude: mainLng,
        accuracy: 5,
        recordedAt: mainLocTime,
      },
      status: "active",
      deviceCommandDelivered: false,
    });

    check(alert1._id && alert2._id, "Two distinct active separation alerts exist in database");

    // Verify getGroupMembers reports both members as separated
    let reqMembers = { params: { groupId: group._id.toString() }, user: mainUser };
    let resMembers = mockResponse();
    await getGroupMembers(reqMembers, resMembers, (err) => { if (err) throw err; });
    const m1Status = resMembers.data.members.find((m) => m.membershipId.toString() === member1._id.toString());
    const m2Status = resMembers.data.members.find((m) => m.membershipId.toString() === member2._id.toString());
    check(m1Status.isSeparated === true && m1Status.locationStatus === "separated", "Member 1 is reported as SEPARATED");
    check(m2Status.isSeparated === true && m2Status.locationStatus === "separated", "Member 2 is reported as SEPARATED");

    // -------------------------------------------------------------
    // Test Set 4: ESP32 Buzzer Delivery & Acknowledgment for Member 1
    // -------------------------------------------------------------
    console.log("\n4. ESP32 Buzzer Delivery & Command Polling:");
    let reqCmd = { device };
    let resCmd = mockResponse();
    await iotGetPendingCommands(reqCmd, resCmd, (err) => { if (err) throw err; });
    check(resCmd.data.hasCommand === true, "ESP32 received hasCommand: true");
    check(resCmd.data.command === "TRIGGER_BUZZER", "ESP32 command is TRIGGER_BUZZER");

    // Acknowledge alert 1 delivery
    let reqAck = { body: { alertId: alert1._id.toString() } };
    let resAck = mockResponse();
    await iotAcknowledgeCommand(reqAck, resAck, (err) => { if (err) throw err; });
    check(resAck.data.success === true, "ESP32 command acknowledged successfully");

    // -------------------------------------------------------------
    // Test Set 5: Mark Reunited for Member 1 (Kishor)
    // -------------------------------------------------------------
    console.log("\n5. Mark Reunited Workflow & Authorization:");
    // Attempt resolve by unauthorized user -> must fail (HTTP 403)
    let reqResolveUnauth = {
      params: { alertId: alert1._id.toString() },
      body: { reason: "Attempt unauthorized resolve" },
      user: otherUser,
    };
    let resResolveUnauth = mockResponse();
    let authFailed = false;
    try {
      await resolveAlert(reqResolveUnauth, resResolveUnauth, (err) => {
        if (err) authFailed = true;
      });
    } catch (e) {
      authFailed = true;
    }
    check(authFailed || resResolveUnauth.statusCode === 403, "Unauthorized user cannot mark member as reunited (403)");

    // Authorized Mark Reunited by main user
    let reqResolve = {
      params: { alertId: alert1._id.toString() },
      body: { reason: "Reunited & verified on dashboard" },
      user: mainUser,
    };
    let resResolve = mockResponse();
    await resolveAlert(reqResolve, resResolve, (err) => { if (err) throw err; });
    check(resResolve.data.success === true, "Main user successfully marks Member 1 as reunited");
    check(
      resResolve.data.message === "Family member reunited successfully. Your group is now safe.",
      "Confirmation message matches requirement"
    );

    // Verify Alert 1 is resolved in database and preserved
    const dbAlert1 = await SeparationAlert.findById(alert1._id);
    check(dbAlert1.status === "resolved", "Alert 1 is marked 'resolved'");
    check(dbAlert1.resolvedAt !== null, "Alert 1 preserves resolvedAt timestamp");

    // Verify Alert 2 (Sunita) remains ACTIVE
    const dbAlert2 = await SeparationAlert.findById(alert2._id);
    check(dbAlert2.status === "active", "Alert 2 for Member 2 remains ACTIVE (not accidentally resolved)");

    // Verify Member 1 membership record updated
    const dbMember1 = await FamilyMembership.findById(member1._id);
    check(dbMember1.reunionStatus === "reunited", "Member 1 reunionStatus recorded as 'reunited'");
    check(dbMember1.reunitedAt !== null, "Member 1 reunitedAt timestamp recorded");

    // -------------------------------------------------------------
    // Test Set 6: State After Reunion & Stale Coordinate Re-trigger Prevention
    // -------------------------------------------------------------
    console.log("\n6. Correct State After Reunion & Stale Re-trigger Prevention:");
    // Fetch members on dashboard: Member 1 must be REUNITED, Member 2 must still be SEPARATED
    resMembers = mockResponse();
    await getGroupMembers(reqMembers, resMembers, (err) => { if (err) throw err; });
    const updatedM1 = resMembers.data.members.find((m) => m.membershipId.toString() === member1._id.toString());
    const updatedM2 = resMembers.data.members.find((m) => m.membershipId.toString() === member2._id.toString());

    check(updatedM1.isSeparated === false, "Member 1 isSeparated is false after reunion");
    check(updatedM1.locationStatus === "reunited", "Member 1 status displays 'reunited'");
    check(updatedM1.distanceMeters > 50, "Member 1 actual calculated distance is preserved (not fabricated)");
    check(updatedM2.isSeparated === true, "Member 2 remains SEPARATED");

    // Now resolve Member 2 as well so no active alerts exist
    let reqResolve2 = {
      params: { alertId: alert2._id.toString() },
      body: { reason: "Reunited & verified on dashboard" },
      user: mainUser,
    };
    let resResolve2 = mockResponse();
    await resolveAlert(reqResolve2, resResolve2, (err) => { if (err) throw err; });
    check(resResolve2.data.success === true, "Member 2 also marked reunited");

    // ESP32 Poll Check: Both members are reunited, but their GPS distance remains > 50m (no new GPS fix yet)
    // ESP32 MUST NOT trigger buzzer or recreate an alert from stale coordinates!
    resCmd = mockResponse();
    await iotGetPendingCommands(reqCmd, resCmd, (err) => { if (err) throw err; });
    check(resCmd.data.hasCommand === false, "ESP32 receives hasCommand: false (does NOT re-trigger buzzer from stale coordinates)");
    check(resCmd.data.status === "SAFE", "ESP32 reports status: SAFE");

    // Verify no new SeparationAlert was created during polling
    const activeAlertCount = await SeparationAlert.countDocuments({
      group: group._id,
      status: { $in: ["active", "acknowledged_by_device"] },
    });
    check(activeAlertCount === 0, "No duplicate or re-created active alerts in database");

    // -------------------------------------------------------------
    // Test Set 7: Subsequent Movement & Genuine New Separation
    // -------------------------------------------------------------
    console.log("\n7. Subsequent Movement & Return to Safe Distance:");
    // Member 1 returns within safe distance (10m)
    await MemberLocation.create({
      group: group._id,
      membership: member1._id,
      latitude: mainLat + 0.00008, // ~9m away
      longitude: mainLng,
      accuracy: 4,
      status: "live",
      serverReceivedAt: new Date(Date.now() + 2000),
    });

    resMembers = mockResponse();
    await getGroupMembers(reqMembers, resMembers, (err) => { if (err) throw err; });
    const safeM1 = resMembers.data.members.find((m) => m.membershipId.toString() === member1._id.toString());
    check(safeM1.distanceMeters <= 50, `Member 1 distance is within safe threshold (${safeM1.distanceMeters}m <= 50m)`);
    check(safeM1.isSeparated === false, "Member 1 isSeparated is false");
    check(safeM1.locationStatus === "live", "Member 1 locationStatus transitioned to 'live' / safe");

    // Cleanup test data
    await SeparationAlert.deleteMany({ group: group._id });
    await MemberLocation.deleteMany({ group: group._id });
    await FamilyMembership.deleteMany({ group: group._id });
    await IoTDevice.deleteOne({ _id: device._id });
    await FamilyGroup.deleteOne({ _id: group._id });
    await User.deleteMany({ _id: { $in: [mainUser._id, otherUser._id] } });

    console.log("\n=================================================================");
    console.log(`Test Summary: ${passed} passed, ${failed} failed.`);
    console.log("=================================================================\n");

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("Test execution failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTests();
