const mongoose = require("mongoose");
const assert = require("assert");
require("dotenv").config();

const User = require("../models/User");
const FamilyGroup = require("../models/FamilyGroup");
const FamilyMembership = require("../models/FamilyMembership");
const MemberLocation = require("../models/MemberLocation");
const SeparationAlert = require("../models/SeparationAlert");
const IoTDevice = require("../models/IoTDevice");
const { processLocationUpdate } = require("../services/familyTrackingService");

async function testEdgeCases() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB Atlas.");

    // Setup a clean test group with main user
    const testEmail = `edge_user_${Date.now()}@test.com`;
    const user = await User.create({
      name: "Edge Case Main User",
      email: testEmail,
      password: "password123",
      role: "user",
    });

    const group = await FamilyGroup.create({
      name: "Solo Test Group",
      creator: user._id,
      inviteCode: "EDG" + Math.floor(100 + Math.random() * 900),
      separationThresholdMeters: 5,
      locationFreshnessMinutes: 3,
    });

    const mainMembership = await FamilyMembership.create({
      group: group._id,
      user: user._id,
      name: "Edge Main",
      role: "main",
      status: "active",
      isLocationSharing: true,
    });

    // TEST 1: Main user is the only member
    console.log("\n[Test 1] Main user is the only member - submit location:");
    const soloRes = await processLocationUpdate({
      groupId: group._id,
      userId: user._id,
      membershipId: mainMembership._id,
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 5,
    });
    assert(soloRes.alert === null, "No alert created when main user submits location");
    assert(soloRes.separationStatus === "normal", "Separation status is normal for solo main user");

    const soloAlerts = await SeparationAlert.countDocuments({ group: group._id });
    assert(soloAlerts === 0, "Zero alerts generated when main user is alone in group");
    console.log("  [PASS] Verified: No separation alerts generated when main user is the only member.");

    // TEST 2: Member submits location while main user has NO location
    console.log("\n[Test 2] Member submits location while main user location is missing/unavailable:");
    const memberUser = await User.create({
      name: "Edge Member",
      email: `edge_member_${Date.now()}@test.com`,
      password: "password123",
      role: "user",
    });

    const memberMembership = await FamilyMembership.create({
      group: group._id,
      user: memberUser._id,
      name: "Edge Member",
      role: "member",
      status: "active",
      isLocationSharing: true,
    });

    // Delete any main user locations to test unavailable main user GPS
    await MemberLocation.deleteMany({ group: group._id, user: user._id });

    const unavailRes = await processLocationUpdate({
      groupId: group._id,
      userId: memberUser._id,
      membershipId: memberMembership._id,
      latitude: 12.9750, // Far away
      longitude: 77.5990,
      accuracy: 5,
    });
    assert(unavailRes.alert === null, "No alert created when main user location is unavailable");
    assert(unavailRes.separationStatus === "unavailable", "Separation status is 'unavailable'");
    console.log("  [PASS] Verified: No separation alert when main user GPS is unavailable.");

    // TEST 3: Main user location is stale (> 3 minutes ago)
    console.log("\n[Test 3] Member submits location while main user location is STALE:");
    await MemberLocation.create({
      group: group._id,
      membership: mainMembership._id,
      user: user._id,
      name: "Edge Main",
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 5,
      serverReceivedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago (stale)
    });

    const staleRes = await processLocationUpdate({
      groupId: group._id,
      userId: memberUser._id,
      membershipId: memberMembership._id,
      latitude: 12.9750, // Far away
      longitude: 77.5990,
      accuracy: 5,
    });
    assert(staleRes.alert === null, "No alert created when main user location is stale");
    assert(staleRes.separationStatus === "stale", "Separation status is 'stale'");
    console.log("  [PASS] Verified: No separation alert when main user GPS is stale.");

    // TEST 4: Main user or member location is INACCURATE (> 35m error radius)
    console.log("\n[Test 4] Member submits location with degraded/inaccurate GPS accuracy (>35m):");
    // Make main location fresh
    await MemberLocation.create({
      group: group._id,
      membership: mainMembership._id,
      user: user._id,
      name: "Edge Main",
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 5,
      serverReceivedAt: new Date(), // fresh
    });

    const inaccRes = await processLocationUpdate({
      groupId: group._id,
      userId: memberUser._id,
      membershipId: memberMembership._id,
      latitude: 12.9750,
      longitude: 77.5990,
      accuracy: 50, // Inaccurate!
    });
    assert(inaccRes.alert === null, "No alert created when GPS accuracy is degraded");
    assert(inaccRes.separationStatus === "inaccurate_gps", "Separation status is 'inaccurate_gps'");
    console.log("  [PASS] Verified: Inaccurate GPS suppresses separation alerts.");

    // TEST 5: Legitimate separation triggers only once (does not repeatedly create duplicates)
    console.log("\n[Test 5] Legitimate separation creates exactly 1 alert, updates existing on subsequent readings:");
    // 1st reading (warning)
    await processLocationUpdate({
      groupId: group._id,
      userId: memberUser._id,
      membershipId: memberMembership._id,
      latitude: 12.9720,
      longitude: 77.5950,
      accuracy: 5,
    });
    // 2nd reading (separated)
    const legitRes = await processLocationUpdate({
      groupId: group._id,
      userId: memberUser._id,
      membershipId: memberMembership._id,
      latitude: 12.9720,
      longitude: 77.5950,
      accuracy: 5,
    });
    assert(legitRes.alert !== null, "Legitimate separation generates alert");

    const alertCount1 = await SeparationAlert.countDocuments({ group: group._id, status: "active" });
    assert(alertCount1 === 1, "Exactly 1 active alert created");

    // 3rd reading (still separated)
    const legitRes2 = await processLocationUpdate({
      groupId: group._id,
      userId: memberUser._id,
      membershipId: memberMembership._id,
      latitude: 12.9721,
      longitude: 77.5951,
      accuracy: 5,
    });
    const alertCount2 = await SeparationAlert.countDocuments({ group: group._id, status: "active" });
    assert(alertCount2 === 1, "Duplicate alert NOT created; existing alert updated");
    console.log("  [PASS] Verified: Alert de-duplication prevents duplicate database documents.");

    // Clean up test data
    await SeparationAlert.deleteMany({ group: group._id });
    await MemberLocation.deleteMany({ group: group._id });
    await FamilyMembership.deleteMany({ group: group._id });
    await FamilyGroup.findByIdAndDelete(group._id);
    await User.findByIdAndDelete(user._id);
    await User.findByIdAndDelete(memberUser._id);
    console.log("\n[Clean-up] Test data purged successfully.");

    console.log("\n=======================================================");
    console.log("ALL EDGE-CASE & SAFETY REQUIREMENT TESTS PASSED (5/5)!");
    console.log("=======================================================");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

testEdgeCases();
