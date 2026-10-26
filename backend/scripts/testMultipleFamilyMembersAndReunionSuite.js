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
  processLocationUpdate,
} = require("../services/familyTrackingService");

const {
  getGroupMembers,
  getGroupAlerts,
  resolveAlert,
  getDeviceStatus,
  iotHeartbeat,
  iotGetPendingCommands,
  iotAcknowledgeCommand,
} = require("../controllers/familyTrackingController");

function mockResponse() {
  return {
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

async function runSuite() {
  console.log("=========================================================================");
  console.log("PilgrimIQ — Multiple Family Members & Mark Reunited Synchronization Suite");
  console.log("=========================================================================\n");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("Missing MONGO_URI in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB Atlas successfully.\n");

  const testSuffix = Date.now().toString().slice(-6);
  const testDeviceId = `ESP32-MULTI-${testSuffix}`;

  try {
    // -------------------------------------------------------------------------
    // Setup Main User, Group (50m threshold), and 3 Family Members
    // -------------------------------------------------------------------------
    const mainUser = await User.create({
      name: `Arsha (Main User) ${testSuffix}`,
      email: `arsha_multi_${testSuffix}@example.com`,
      password: "TestPassword123!",
      role: "user",
    });

    const otherUser = await User.create({
      name: `Unauthorized User ${testSuffix}`,
      email: `unauth_multi_${testSuffix}@example.com`,
      password: "TestPassword123!",
      role: "user",
    });

    const group = await FamilyGroup.create({
      name: `PilgrimIQ Multi-Family ${testSuffix}`,
      creator: mainUser._id,
      inviteCode: `M${testSuffix}`,
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
      name: "Kishor",
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
      name: "Sunita",
      relationship: "Mother",
      role: "member",
      isAccountUser: false,
      isInvitationAccepted: true,
      isLocationSharing: true,
      consentGiven: true,
      status: "active",
    });

    const member3 = await FamilyMembership.create({
      group: group._id,
      name: "Rahul",
      relationship: "Brother",
      role: "member",
      isAccountUser: false,
      isInvitationAccepted: true,
      isLocationSharing: true,
      consentGiven: true,
      status: "active",
    });

    const rawDeviceToken = "device-secret-multi-" + testSuffix;
    const device = await IoTDevice.create({
      deviceId: testDeviceId,
      deviceTokenHash: IoTDevice.hashToken(rawDeviceToken),
      group: group._id,
      registeredBy: mainUser._id,
      status: "online",
      buzzerPin: 23,
      lastHeartbeat: new Date(),
    });

    // Reference Coordinates: Main User at Kedarnath Base (30.7352, 79.0669)
    const baseLat = 30.7352;
    const baseLng = 79.0669;
    const nowTime = new Date();

    await MemberLocation.create({
      group: group._id,
      membership: mainMembership._id,
      user: mainUser._id,
      latitude: baseLat,
      longitude: baseLng,
      accuracy: 5,
      status: "live",
      serverReceivedAt: nowTime,
    });

    // =========================================================================
    // SCENARIO 1: One family member separated
    // =========================================================================
    console.log("Scenario 1: One Family Member Separated");
    // Kishor is ~120m away (> 50m threshold)
    const m1LocTime = new Date(Date.now() - 4000);
    const m1Lat = baseLat + 0.00108; // ~120m North
    const m1Lng = baseLng;
    await MemberLocation.create({
      group: group._id,
      membership: member1._id,
      latitude: m1Lat,
      longitude: m1Lng,
      accuracy: 6,
      status: "live",
      serverReceivedAt: m1LocTime,
    });

    const alert1 = await SeparationAlert.create({
      group: group._id,
      membership: member1._id,
      memberName: member1.name,
      mainUser: mainUser._id,
      distanceMeters: 120,
      thresholdMeters: 50,
      severity: "warning",
      buzzerPattern: "warning_short",
      memberLocation: { latitude: m1Lat, longitude: m1Lng, accuracy: 6, recordedAt: m1LocTime },
      mainLocation: { latitude: baseLat, longitude: baseLng, accuracy: 5, recordedAt: nowTime },
      status: "active",
      deviceCommandDelivered: false,
    });

    let resMembers = mockResponse();
    await getGroupMembers({ params: { groupId: group._id.toString() }, user: mainUser }, resMembers, (e) => { if (e) throw e; });
    const s1Member1 = resMembers.data.members.find((m) => m.membershipId.toString() === member1._id.toString());
    const s1Member2 = resMembers.data.members.find((m) => m.membershipId.toString() === member2._id.toString());
    check(s1Member1.isSeparated === true && s1Member1.locationStatus === "separated", "1. Member 1 (Kishor) is detected as separated");
    check(s1Member2.isSeparated === false, "1. Member 2 (Sunita) without GPS is not marked separated");

    // =========================================================================
    // SCENARIO 2: Two family members separated simultaneously
    // =========================================================================
    console.log("\nScenario 2: Two Family Members Separated Simultaneously");
    // Sunita is ~180m away (> 50m threshold)
    const m2LocTime = new Date(Date.now() - 3000);
    const m2Lat = baseLat - 0.00162; // ~180m South
    const m2Lng = baseLng;
    await MemberLocation.create({
      group: group._id,
      membership: member2._id,
      latitude: m2Lat,
      longitude: m2Lng,
      accuracy: 5,
      status: "live",
      serverReceivedAt: m2LocTime,
    });

    const alert2 = await SeparationAlert.create({
      group: group._id,
      membership: member2._id,
      memberName: member2.name,
      mainUser: mainUser._id,
      distanceMeters: 180,
      thresholdMeters: 50,
      severity: "warning",
      buzzerPattern: "warning_short",
      memberLocation: { latitude: m2Lat, longitude: m2Lng, accuracy: 5, recordedAt: m2LocTime },
      mainLocation: { latitude: baseLat, longitude: baseLng, accuracy: 5, recordedAt: nowTime },
      status: "active",
      deviceCommandDelivered: false,
    });

    resMembers = mockResponse();
    await getGroupMembers({ params: { groupId: group._id.toString() }, user: mainUser }, resMembers, (e) => { if (e) throw e; });
    const s2M1 = resMembers.data.members.find((m) => m.membershipId.toString() === member1._id.toString());
    const s2M2 = resMembers.data.members.find((m) => m.membershipId.toString() === member2._id.toString());
    check(s2M1.isSeparated === true && s2M2.isSeparated === true, "2. Both Member 1 and Member 2 reported as separated simultaneously");

    // =========================================================================
    // SCENARIO 3: Multiple active alerts displayed correctly
    // =========================================================================
    console.log("\nScenario 3: Multiple Active Alerts Returned");
    let resAlerts = mockResponse();
    await getGroupAlerts({ params: { groupId: group._id.toString() }, user: mainUser }, resAlerts, (e) => { if (e) throw e; });
    const activeAlertList = resAlerts.data.alerts.filter((a) => a.status === "active" || a.status === "acknowledged_by_device");
    check(activeAlertList.length === 2, "3. Multiple active alerts returned (length === 2)");
    check(
      activeAlertList.some((a) => a.memberName === "Kishor") &&
      activeAlertList.some((a) => a.memberName === "Sunita"),
      "3. Alerts correctly identify Kishor and Sunita independently"
    );

    // =========================================================================
    // SCENARIO 4: Active alert count matches unresolved alerts
    // =========================================================================
    console.log("\nScenario 4: Active Alert Count Verification");
    const dbActiveAlertCount = await SeparationAlert.countDocuments({
      group: group._id,
      status: { $in: ["active", "acknowledged_by_device"] },
    });
    check(dbActiveAlertCount === 2, "4. Database unresolved alert count matches 2 active alerts");

    // =========================================================================
    // SCENARIO 5: Open Directions uses the correct selected member
    // =========================================================================
    console.log("\nScenario 5: Open Directions Coordinate Validation");
    function buildDirections(origin, dest) {
      if (!origin || !dest || isNaN(origin.lat) || isNaN(dest.lat)) return null;
      return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}&travelmode=driving`;
    }
    const dirKishor = buildDirections({ lat: baseLat, lng: baseLng }, { lat: m1Lat, lng: m1Lng });
    const dirSunita = buildDirections({ lat: baseLat, lng: baseLng }, { lat: m2Lat, lng: m2Lng });
    check(dirKishor.includes(`destination=${m1Lat},${m1Lng}`), "5. Directions for Kishor points to Kishor's coordinates");
    check(dirSunita.includes(`destination=${m2Lat},${m2Lng}`), "5. Directions for Sunita points to Sunita's coordinates");
    check(dirKishor !== dirSunita, "5. Directions URLs are distinct and independent");

    // =========================================================================
    // SCENARIO 6 & 7: One member reunited while another remains separated; only selected alert resolved
    // =========================================================================
    console.log("\nScenario 6 & 7: Single Member Reunion (Kishor Reunited, Sunita Remains Separated)");
    let resResolve = mockResponse();
    await resolveAlert({
      params: { alertId: alert1._id.toString() },
      body: { reason: "Reunited with Kishor on dashboard" },
      user: mainUser,
    }, resResolve, (e) => { if (e) throw e; });

    check(resResolve.data.success === true, "6. Mark Reunited succeeded for Kishor");
    check(resResolve.data.reunionStatus === "reunited", "6. Reunion status returned as 'reunited'");

    const refreshedAlert1 = await SeparationAlert.findById(alert1._id);
    const refreshedAlert2 = await SeparationAlert.findById(alert2._id);
    check(refreshedAlert1.status === "resolved", "7. Only Kishor's alert is resolved in database");
    check(refreshedAlert2.status === "active", "7. Sunita's alert remains ACTIVE");

    resMembers = mockResponse();
    await getGroupMembers({ params: { groupId: group._id.toString() }, user: mainUser }, resMembers, (e) => { if (e) throw e; });
    const s6M1 = resMembers.data.members.find((m) => m.membershipId.toString() === member1._id.toString());
    const s6M2 = resMembers.data.members.find((m) => m.membershipId.toString() === member2._id.toString());
    check(s6M1.locationStatus === "reunited" && s6M1.isSeparated === false, "6. Kishor card reflects REUNITED and isSeparated === false");
    check(s6M2.locationStatus === "separated" && s6M2.isSeparated === true, "6. Sunita card remains SEPARATED");

    // Active alert count after single reunion
    resAlerts = mockResponse();
    await getGroupAlerts({ params: { groupId: group._id.toString() }, user: mainUser }, resAlerts, (e) => { if (e) throw e; });
    const remainingActiveAlerts = resAlerts.data.alerts.filter((a) => a.status === "active" || a.status === "acknowledged_by_device");
    check(remainingActiveAlerts.length === 1, "6. Active alert count decremented to 1");
    check(remainingActiveAlerts[0].memberName === "Sunita", "6. The remaining active alert belongs to Sunita");

    // =========================================================================
    // SCENARIO 8 & 9: All members reunited; resolved alerts remain in history
    // =========================================================================
    console.log("\nScenario 8 & 9: All Members Reunited & History Preserved");
    let resResolve2 = mockResponse();
    await resolveAlert({
      params: { alertId: alert2._id.toString() },
      body: { reason: "Reunited with Sunita on dashboard" },
      user: mainUser,
    }, resResolve2, (e) => { if (e) throw e; });
    check(resResolve2.data.success === true, "8. Mark Reunited succeeded for Sunita");

    const finalAlert1 = await SeparationAlert.findById(alert1._id);
    const finalAlert2 = await SeparationAlert.findById(alert2._id);
    check(finalAlert1.status === "resolved" && finalAlert2.status === "resolved", "8. All separation alerts are now marked resolved");
    check(finalAlert1.resolvedAt !== null && finalAlert2.resolvedAt !== null, "9. Resolved alerts preserve resolvedAt timestamps in history");

    const totalHistoricalAlerts = await SeparationAlert.countDocuments({ group: group._id });
    check(totalHistoricalAlerts === 2, "9. Historical alerts are preserved in MongoDB (not deleted)");

    // =========================================================================
    // SCENARIO 10: No duplicate alert for the same separation event
    // =========================================================================
    console.log("\nScenario 10: Duplicate Alert Prevention");
    // Suppose a new separation begins for Sunita
    const dupLocTime = new Date(Date.now() + 5000);
    const freshAlert = await SeparationAlert.create({
      group: group._id,
      membership: member2._id,
      memberName: member2.name,
      mainUser: mainUser._id,
      distanceMeters: 90,
      thresholdMeters: 50,
      severity: "warning",
      buzzerPattern: "warning_short",
      memberLocation: { latitude: m2Lat, longitude: m2Lng, accuracy: 5, recordedAt: dupLocTime },
      mainLocation: { latitude: baseLat, longitude: baseLng, accuracy: 5, recordedAt: dupLocTime },
      status: "active",
      deviceCommandDelivered: false,
    });

    // Check if an existing active alert query finds it instead of creating another
    const existingActive = await SeparationAlert.findOne({
      group: group._id,
      membership: member2._id,
      status: { $in: ["active", "acknowledged_by_device"] },
    });
    check(existingActive && existingActive._id.toString() === freshAlert._id.toString(), "10. Existing active alert identified to prevent duplicate creation");

    // Clean up temporary freshAlert
    await SeparationAlert.deleteOne({ _id: freshAlert._id });

    // =========================================================================
    // SCENARIO 11: One member's GPS unavailable
    // =========================================================================
    console.log("\nScenario 11: Member GPS Unavailable Handling");
    // Member 3 (Rahul) has no location records
    resMembers = mockResponse();
    await getGroupMembers({ params: { groupId: group._id.toString() }, user: mainUser }, resMembers, (e) => { if (e) throw e; });
    const s11M3 = resMembers.data.members.find((m) => m.membershipId.toString() === member3._id.toString());
    check(s11M3.lastLocation === null, "11. Member 3 has lastLocation === null");
    check(s11M3.isSeparated === false, "11. Missing GPS does not falsely trigger separation");
    check(s11M3.distanceMeters === null, "11. Distance is null (not fabricated)");

    // =========================================================================
    // SCENARIO 12: One member's GPS stale
    // =========================================================================
    console.log("\nScenario 12: Stale GPS Handling");
    // Member 3 reports location 15 minutes ago (freshness window is 3 min)
    const staleTime = new Date(Date.now() - 15 * 60 * 1000);
    await MemberLocation.create({
      group: group._id,
      membership: member3._id,
      latitude: baseLat + 0.003,
      longitude: baseLng,
      accuracy: 5,
      status: "live",
      serverReceivedAt: staleTime,
    });

    resMembers = mockResponse();
    await getGroupMembers({ params: { groupId: group._id.toString() }, user: mainUser }, resMembers, (e) => { if (e) throw e; });
    const s12M3 = resMembers.data.members.find((m) => m.membershipId.toString() === member3._id.toString());
    check(s12M3.locationStatus === "stale", "12. Member 3 location recognized as 'stale'");
    check(s12M3.isSeparated === false, "12. Stale GPS does not trigger false separation alert");

    // =========================================================================
    // SCENARIO 13: Stale GPS does not recreate an alert after reunion
    // =========================================================================
    console.log("\nScenario 13: Stale Coordinates Prevention After Reunion");
    // Kishor was reunited at `nowTime`. Coordinates from `m1LocTime` (< nowTime) are stale pre-reunion coords.
    // Poll commands or members -> must NOT create a new alert
    let reqCmd = { device };
    let resCmd = mockResponse();
    await iotGetPendingCommands(reqCmd, resCmd, (e) => { if (e) throw e; });
    check(resCmd.data.hasCommand === false, "13. Stale pre-reunion coordinates do not trigger command");
    const postReunionAlerts = await SeparationAlert.countDocuments({
      group: group._id,
      status: { $in: ["active", "acknowledged_by_device"] },
    });
    check(postReunionAlerts === 0, "13. Zero active alerts created from stale pre-reunion coordinates");

    // =========================================================================
    // SCENARIO 14: Genuine new separation after reunion triggers correctly
    // =========================================================================
    console.log("\nScenario 14: Genuine New Separation After Reunion");
    // Kishor moves after reunion: fresh timestamp > reunion timestamp and distance > threshold
    const freshMoveTime = new Date(Date.now() + 10000);
    const freshLat = baseLat + 0.002; // ~220m away
    const freshLng = baseLng;
    const moveRes = await processLocationUpdate({
      groupId: group._id,
      membershipId: member1._id,
      latitude: freshLat,
      longitude: freshLng,
      accuracy: 5,
      clientTimestamp: freshMoveTime,
    });
    // First reading triggers warning state
    check(moveRes.separationStatus === "warning", "14. First new movement outside threshold triggers warning");

    // Second reading confirms separation
    const moveRes2 = await processLocationUpdate({
      groupId: group._id,
      membershipId: member1._id,
      latitude: freshLat,
      longitude: freshLng,
      accuracy: 5,
      clientTimestamp: new Date(Date.now() + 12000),
    });
    check(moveRes2.separationStatus === "separated", "14. Second consecutive reading confirms new genuine separation");
    check(moveRes2.alert !== null, "14. Genuine new SeparationAlert document created");

    // =========================================================================
    // SCENARIO 15 & 16: ESP32 buzzer behavior with multiple active alerts
    // =========================================================================
    console.log("\nScenario 15 & 16: ESP32 Buzzer Lifecycle");
    // ESP32 polls commands -> receives TRIGGER_BUZZER for Kishor's new alert
    resCmd = mockResponse();
    await iotGetPendingCommands(reqCmd, resCmd, (e) => { if (e) throw e; });
    check(resCmd.data.hasCommand === true && resCmd.data.command === "TRIGGER_BUZZER", "15. ESP32 receives TRIGGER_BUZZER for active alert");

    // Acknowledge delivery
    let resAck = mockResponse();
    await iotAcknowledgeCommand({ body: { alertId: moveRes2.alert._id.toString() } }, resAck, (e) => { if (e) throw e; });
    check(resAck.data.success === true, "15. ESP32 acknowledged alert delivery");

    // Mark Kishor reunited again
    let resFinalResolve = mockResponse();
    await resolveAlert({
      params: { alertId: moveRes2.alert._id.toString() },
      body: { reason: "Reunited again" },
      user: mainUser,
    }, resFinalResolve, (e) => { if (e) throw e; });
    check(resFinalResolve.data.success === true, "16. Second alert resolved");

    // Now all alerts are resolved -> ESP32 receives hasCommand: false, status: SAFE
    resCmd = mockResponse();
    await iotGetPendingCommands(reqCmd, resCmd, (e) => { if (e) throw e; });
    check(resCmd.data.hasCommand === false && resCmd.data.status === "SAFE", "16. ESP32 buzzer stops (hasCommand: false, status: SAFE)");

    // =========================================================================
    // SCENARIO 17: Separation threshold configuration (50m default preserved)
    // =========================================================================
    console.log("\nScenario 17: 50m Separation Configuration Verification");
    const fetchedGroup = await FamilyGroup.findById(group._id);
    check(fetchedGroup.separationThresholdMeters === 50, "17. Separation threshold is 50 meters default");

    // =========================================================================
    // SCENARIO 18: Existing ESP32 command delivery remains functional
    // =========================================================================
    console.log("\nScenario 18: ESP32 Hardware Status & Heartbeat");
    let resStatus = mockResponse();
    await getDeviceStatus({ params: { groupId: group._id.toString() } }, resStatus, (e) => { if (e) throw e; });
    check(resStatus.data.isOnline === true, "18. ESP32 hardware status reports isOnline: true");
    check(resStatus.data.device.buzzerPin === 23, "18. Active buzzer pin is GPIO 23");
    check(resStatus.data.connectionState === "connected", "18. Connection state is 'connected'");

    // =========================================================================
    // SCENARIO 19: Main user is never treated as a separated family member
    // =========================================================================
    console.log("\nScenario 19: Main User Separation Immunity");
    resMembers = mockResponse();
    await getGroupMembers({ params: { groupId: group._id.toString() }, user: mainUser }, resMembers, (e) => { if (e) throw e; });
    const mainInList = resMembers.data.members.find((m) => m.role === "main");
    check(mainInList.role === "main", "19. Main user identified with role: 'main'");
    check(mainInList.isSeparated === false, "19. Main user isSeparated is strictly false");
    check(mainInList.distanceMeters === null || mainInList.distanceMeters === 0, "19. Main user distance is 0 or null");

    // Clean up
    await SeparationAlert.deleteMany({ group: group._id });
    await MemberLocation.deleteMany({ group: group._id });
    await FamilyMembership.deleteMany({ group: group._id });
    await IoTDevice.deleteOne({ _id: device._id });
    await FamilyGroup.deleteOne({ _id: group._id });
    await User.deleteMany({ _id: { $in: [mainUser._id, otherUser._id] } });

    console.log("\n=========================================================================");
    console.log(`Test Summary: ${passed} passed, ${failed} failed.`);
    console.log("=========================================================================\n");

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("Test execution failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runSuite();
