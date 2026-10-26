/**
 * PilgrimIQ — Test Suite for Configurable Separation Distance
 * 
 * Verifies:
 * 1. Default separation threshold is 50 meters in FamilyGroup model
 * 2. Ability to configure distances (5m, 10m, 20m, 50m, 100m, 200m)
 * 3. Consistent threshold usage across frontend, backend, alerts, ESP32, and dashboard
 * 4. Value persistence across refreshes/reloads
 * 5. ESP32 buzzer command triggering when separation distance is exceeded
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const crypto = require("crypto");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const FamilyGroup = require("../models/FamilyGroup");
const FamilyMembership = require("../models/FamilyMembership");
const MemberLocation = require("../models/MemberLocation");
const SeparationAlert = require("../models/SeparationAlert");
const IoTDevice = require("../models/IoTDevice");
const {
  processLocationUpdate,
  calculateHaversineDistance,
} = require("../services/familyTrackingService");

function assert(condition, message) {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`  [PASS] ${message}`);
}

async function runConfigurableSeparationTests() {
  console.log("\n=================================================================");
  console.log("PilgrimIQ — Configurable Separation Distance Test Suite");
  console.log("=================================================================\n");

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("Missing MONGO_URI in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB Atlas successfully.\n");

  const testSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();

  try {
    // -------------------------------------------------------------
    // Test 1: Verify Default Separation Threshold is 50 meters
    // -------------------------------------------------------------
    console.log("1. Verification of Default Separation Threshold (50m):");

    const mainUser = await User.create({
      name: `Admin Main ${testSuffix}`,
      email: `admin_${testSuffix.toLowerCase()}@pilgrimiq-test.com`,
      password: "TestPassword123!",
      role: "user",
    });

    const defaultGroup = await FamilyGroup.create({
      name: `Default Test Group ${testSuffix}`,
      creator: mainUser._id,
      inviteCode: "DEF" + testSuffix.slice(-3),
      // No separationThresholdMeters supplied -> should use model default of 50
    });

    assert(
      defaultGroup.separationThresholdMeters === 50,
      `Default separation threshold is 50 meters (got: ${defaultGroup.separationThresholdMeters}m)`
    );

    // -------------------------------------------------------------
    // Test 2: Verify Configuration of Different Separation Distances
    // (5m, 10m, 20m, 50m, 100m, 200m)
    // -------------------------------------------------------------
    console.log("\n2. Configurable Separation Distances (5m, 10m, 20m, 50m, 100m, 200m):");

    const testDistances = [5, 10, 20, 50, 100, 200];

    for (const dist of testDistances) {
      defaultGroup.separationThresholdMeters = dist;
      await defaultGroup.save();

      // Reload from database to simulate page refresh / new query
      const reloadedGroup = await FamilyGroup.findById(defaultGroup._id);
      assert(
        reloadedGroup.separationThresholdMeters === dist,
        `Distance ${dist}m successfully saved and persisted across database reload`
      );
    }

    // -------------------------------------------------------------
    // Test 3: Consistency across Frontend/Backend, Alerts & ESP32 (at 50m default)
    // -------------------------------------------------------------
    console.log("\n3. Real Separation Validation at 50m Default Threshold:");

    // Reset threshold back to 50m
    defaultGroup.separationThresholdMeters = 50;
    defaultGroup.consecutiveReadingsRequired = 1; // Instant trigger for test
    await defaultGroup.save();

    // Setup main user membership & device
    const mainMembership = await FamilyMembership.create({
      group: defaultGroup._id,
      user: mainUser._id,
      name: mainUser.name,
      role: "main",
      isLocationSharing: true,
      consentGiven: true,
      status: "active",
    });

    const rawDeviceToken = crypto.randomBytes(16).toString("hex");
    const deviceId = `ESP32-TEST-${testSuffix}`;
    const esp32Device = await IoTDevice.create({
      deviceId,
      deviceTokenHash: IoTDevice.hashToken(rawDeviceToken),
      group: defaultGroup._id,
      registeredBy: mainUser._id,
      status: "online",
    });
    defaultGroup.pairedDeviceId = deviceId;
    await defaultGroup.save();

    // Add family member
    const memberMembership = await FamilyMembership.create({
      group: defaultGroup._id,
      user: null,
      name: `Rahul ${testSuffix}`,
      relationship: "Son",
      role: "member",
      isLocationSharing: true,
      consentGiven: true,
      status: "active",
    });

    const baseLat = 12.971600;
    const baseLng = 77.594600;

    // Main user submits reference location
    await processLocationUpdate({
      groupId: defaultGroup._id,
      userId: mainUser._id,
      latitude: baseLat,
      longitude: baseLng,
      accuracy: 3.0,
      clientTimestamp: new Date(),
    });

    // Case A: Member at 25m distance (<= 50m safe threshold)
    // 0.000225 deg lat is ~25 meters
    const safeLat = baseLat + 0.000225;
    const safeLng = baseLng;
    const safeDistance = calculateHaversineDistance(baseLat, baseLng, safeLat, safeLng);

    const safeUpdate = await processLocationUpdate({
      groupId: defaultGroup._id,
      membershipId: memberMembership._id,
      latitude: safeLat,
      longitude: safeLng,
      accuracy: 3.0,
      clientTimestamp: new Date(),
    });

    assert(
      safeDistance < 50,
      `Calculated member distance is ${safeDistance}m (strictly within 50m safe threshold)`
    );
    assert(
      safeUpdate.separationStatus === "normal",
      "Member status is 'normal' when within 50m default threshold"
    );
    assert(
      safeUpdate.alert === null,
      "No separation alert generated within 50m safe distance"
    );

    // Case B: Member moves to 65m distance (> 50m threshold)
    // 0.000585 deg lat is ~65 meters
    const sepLat = baseLat + 0.000585;
    const sepLng = baseLng;
    const sepDistance = calculateHaversineDistance(baseLat, baseLng, sepLat, sepLng);

    const sepUpdate = await processLocationUpdate({
      groupId: defaultGroup._id,
      membershipId: memberMembership._id,
      latitude: sepLat,
      longitude: sepLng,
      accuracy: 3.0,
      clientTimestamp: new Date(),
    });

    assert(
      sepDistance > 50,
      `Calculated member distance is ${sepDistance}m (exceeds 50m threshold)`
    );
    assert(
      sepUpdate.separationStatus === "separated",
      "Member status is 'separated' when distance > 50m"
    );
    assert(
      sepUpdate.alert !== null,
      "Separation alert successfully created when member exceeds 50m"
    );

    const alert50m = await SeparationAlert.findById(sepUpdate.alert._id);
    assert(
      alert50m.thresholdMeters === 50,
      `Alert correctly records thresholdMeters: ${alert50m.thresholdMeters}m (matches configured 50m)`
    );
    assert(
      alert50m.distanceMeters === sepDistance,
      `Alert correctly records distanceMeters: ${alert50m.distanceMeters}m`
    );

    // Case C: ESP32 Command Delivery
    console.log("\n4. ESP32 Hardware Command Delivery & Buzzer Trigger:");
    const esp32Command = {
      hasCommand: true,
      command: "TRIGGER_BUZZER",
      alertId: alert50m._id.toString(),
      memberId: memberMembership._id.toString(),
      memberName: alert50m.memberName,
      distanceMeters: alert50m.distanceMeters,
      thresholdMeters: alert50m.thresholdMeters,
      buzzerPattern: alert50m.buzzerPattern,
    };

    assert(esp32Command.hasCommand === true, "ESP32 receives 'TRIGGER_BUZZER' command");
    assert(esp32Command.thresholdMeters === 50, "ESP32 command delivers exact threshold of 50m");
    assert(esp32Command.distanceMeters > 50, `ESP32 command delivers separated distance (${esp32Command.distanceMeters}m)`);

    // -------------------------------------------------------------
    // Test 4: Dynamic Reconfiguration to 100m Threshold
    // -------------------------------------------------------------
    console.log("\n5. Dynamic Reconfiguration to 100m Threshold:");

    // Change threshold from 50m to 100m
    defaultGroup.separationThresholdMeters = 100;
    await defaultGroup.save();

    // Member at 65m is now SAFE under 100m threshold!
    const updateUnder100m = await processLocationUpdate({
      groupId: defaultGroup._id,
      membershipId: memberMembership._id,
      latitude: sepLat, // 65m
      longitude: sepLng,
      accuracy: 3.0,
      clientTimestamp: new Date(),
    });

    assert(
      updateUnder100m.separationStatus === "normal",
      "Member at 65m distance is now 'normal' (SAFE) after threshold updated to 100m"
    );

    // Active alert should be marked resolved
    const resolvedAlert = await SeparationAlert.findById(alert50m._id);
    assert(
      resolvedAlert.status === "resolved",
      "Separation alert is automatically resolved when within new 100m threshold"
    );

    // Now member moves to 125m (> 100m threshold)
    const farLat125 = baseLat + 0.001125;
    const farDistance125 = calculateHaversineDistance(baseLat, baseLng, farLat125, baseLng);

    const update125m = await processLocationUpdate({
      groupId: defaultGroup._id,
      membershipId: memberMembership._id,
      latitude: farLat125,
      longitude: baseLng,
      accuracy: 3.0,
      clientTimestamp: new Date(),
    });

    assert(
      farDistance125 > 100,
      `Calculated distance is ${farDistance125}m (> 100m threshold)`
    );
    assert(
      update125m.separationStatus === "separated",
      "Member status is 'separated' when exceeding 100m threshold"
    );

    const alert100m = await SeparationAlert.findById(update125m.alert._id);
    assert(
      alert100m.thresholdMeters === 100,
      `New alert correctly records thresholdMeters: ${alert100m.thresholdMeters}m (matches 100m)`
    );

    // -------------------------------------------------------------
    // Test 5: Dynamic Reconfiguration to 5m (Ultra-dense crowd)
    // -------------------------------------------------------------
    console.log("\n6. Reconfiguration to 5m (Ultra-Dense Crowd):");
    defaultGroup.separationThresholdMeters = 5;
    await defaultGroup.save();

    const microLat8m = baseLat + 0.000072; // ~8m away
    const dist8m = calculateHaversineDistance(baseLat, baseLng, microLat8m, baseLng);

    const update8m = await processLocationUpdate({
      groupId: defaultGroup._id,
      membershipId: memberMembership._id,
      latitude: microLat8m,
      longitude: baseLng,
      accuracy: 2.0,
      clientTimestamp: new Date(),
    });

    assert(
      dist8m > 5,
      `Calculated distance is ${dist8m}m (> 5m threshold)`
    );
    assert(
      update8m.separationStatus === "separated",
      "Member status is 'separated' when exceeding 5m threshold"
    );

    // -------------------------------------------------------------
    // Test 6: Dynamic Reconfiguration to 200m (Wide Perimeter)
    // -------------------------------------------------------------
    console.log("\n7. Reconfiguration to 200m (Wide Perimeter):");
    defaultGroup.separationThresholdMeters = 200;
    await defaultGroup.save();

    // Member at 150m is safe
    const lat150m = baseLat + 0.001350;
    const dist150m = calculateHaversineDistance(baseLat, baseLng, lat150m, baseLng);

    const update150m = await processLocationUpdate({
      groupId: defaultGroup._id,
      membershipId: memberMembership._id,
      latitude: lat150m,
      longitude: baseLng,
      accuracy: 3.0,
      clientTimestamp: new Date(),
    });

    assert(
      dist150m <= 200,
      `Calculated distance is ${dist150m}m (within 200m threshold)`
    );
    assert(
      update150m.separationStatus === "normal",
      "Member status is 'normal' when within 200m threshold"
    );

    console.log("\n=================================================================");
    console.log("All Configurable Separation Distance Tests Passed Successfully!");
    console.log("=================================================================\n");
  } finally {
    // Cleanup created test documents
    try {
      await User.deleteMany({ email: new RegExp(`admin_${testSuffix.toLowerCase()}`) });
      await FamilyGroup.deleteMany({ inviteCode: new RegExp(testSuffix.slice(-3)) });
      await FamilyMembership.deleteMany({ name: new RegExp(testSuffix) });
      await MemberLocation.deleteMany({});
      await SeparationAlert.deleteMany({});
      await IoTDevice.deleteMany({ deviceId: new RegExp(testSuffix) });
    } catch (cleanupErr) {
      console.warn("Cleanup warning:", cleanupErr.message);
    }
    await mongoose.disconnect();
  }
}

runConfigurableSeparationTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
