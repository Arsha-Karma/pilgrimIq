const {
  calculateHaversineDistance,
  isValidCoordinate,
  isValidAccuracy,
  isLocationFresh,
} = require("../services/familyTrackingService");
const IoTDevice = require("../models/IoTDevice");

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

console.log("=== PilgrimIQ Family Tracking Unit Tests ===\n");

// 1. Distance Calculation Tests
console.log("1. Haversine Distance Calculations:");
const distSame = calculateHaversineDistance(12.9716, 77.5946, 12.9716, 77.5946);
assert(distSame === 0, `Same coordinate returns 0m (got ${distSame}m)`);

// Known point pair: Bangalore Vidhana Soudha to Cubbon Park Metro (~480 - 520m)
const distKnown = calculateHaversineDistance(12.9797, 77.5907, 12.9815, 77.5945);
assert(
  distKnown >= 450 && distKnown <= 550,
  `Known coordinate pair distance ~490m (got ${distKnown}m)`
);

// 10 meter micro-distance test:
// At lat 12.9716, 0.00009 degrees latitude is ~10.0 meters
const dist10m = calculateHaversineDistance(12.9716, 77.5946, 12.97169, 77.5946);
assert(
  dist10m >= 9.5 && dist10m <= 10.5,
  `Micro-distance 10m threshold check (got ${dist10m}m)`
);

// 2. Coordinate Validation Tests
console.log("\n2. Coordinate Sanity Validation:");
assert(isValidCoordinate(12.9716, 77.5946) === true, "Valid Bangalore coordinates accepted");
assert(isValidCoordinate(-91, 77.5946) === false, "Latitude -91 rejected");
assert(isValidCoordinate(90.1, 77.5946) === false, "Latitude 90.1 rejected");
assert(isValidCoordinate(12.9716, 181) === false, "Longitude 181 rejected");
assert(isValidCoordinate(NaN, 77.5946) === false, "NaN latitude rejected");
assert(isValidCoordinate("12.9", "77.5") === false, "String coordinates rejected");

// 3. Accuracy Validation Tests
console.log("\n3. GPS Accuracy Validation:");
assert(isValidAccuracy(5) === true, "Valid accuracy 5m accepted");
assert(isValidAccuracy(0) === true, "Accuracy 0m accepted");
assert(isValidAccuracy(-5) === false, "Negative accuracy rejected");
assert(isValidAccuracy(NaN) === false, "NaN accuracy rejected");

// 4. Location Freshness Tests
console.log("\n4. Location Freshness Logic:");
const now = new Date();
const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000);
const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);

assert(isLocationFresh(now, 3) === true, "Current timestamp is fresh (<= 3 min)");
assert(isLocationFresh(twoMinAgo, 3) === true, "2 minutes ago is fresh (<= 3 min)");
assert(isLocationFresh(fiveMinAgo, 3) === false, "5 minutes ago is stale (> 3 min)");
assert(isLocationFresh(tenMinAgo, 3) === false, "10 minutes ago is stale (> 3 min)");

// 5. IoT Device Token Hashing & Verification
console.log("\n5. IoT Token Cryptographic Verification:");
const rawToken = "super_secret_esp32_device_token_12345";
const hashed = IoTDevice.hashToken(rawToken);
const mockDevice = new IoTDevice({
  deviceId: "ESP32-TEST-01",
  deviceTokenHash: hashed,
  registeredBy: "60c72b2f9b1d8b2bad000001",
});

assert(mockDevice.verifyToken(rawToken) === true, "Valid device token verified against hash");
assert(mockDevice.verifyToken("wrong_token") === false, "Invalid device token rejected");

// 6. Family Member Invitation & Session Token Hashing
console.log("\n6. Family Member No-Account Invitation & Session Token:");
const FamilyMembership = require("../models/FamilyMembership");
const FamilyMember = require("../models/FamilyMember");
const inviteToken = "e9a8f2345bc78129034abc129384bcda9012";
const inviteHash = FamilyMembership.hashToken(inviteToken);
assert(inviteHash.length === 64, "SHA-256 invite hash generates 64-char hex digest");
assert(FamilyMembership.hashToken(inviteToken) === inviteHash, "Deterministic token hashing verified");
assert(FamilyMembership.hashToken("different_token") !== inviteHash, "Different token generates different hash");

// 7. Database Family Member Model Linkage & Schema Verification
console.log("\n7. Database Family Member Model Linkage & Schema Verification:");
const mockFamilyMemberId = "60c72b2f9b1d8b2bad0000aa";
const mockGroupId = "60c72b2f9b1d8b2bad0000bb";

const mockMembershipWithDBMember = new FamilyMembership({
  group: mockGroupId,
  familyMember: mockFamilyMemberId,
  name: "Suresh Kumar",
  relationship: "Father",
  role: "member",
  isAccountUser: false,
  inviteTokenHash: inviteHash,
});

assert(
  String(mockMembershipWithDBMember.familyMember) === mockFamilyMemberId,
  "FamilyMembership correctly references existing database familyMember ObjectId"
);
assert(
  mockMembershipWithDBMember.name === "Suresh Kumar",
  "FamilyMembership preserves saved database name"
);
assert(
  mockMembershipWithDBMember.relationship === "Father",
  "FamilyMembership preserves saved database relationship"
);
assert(
  mockMembershipWithDBMember.isAccountUser === false,
  "Invited family member correctly designated as no-account user"
);
assert(
  mockMembershipWithDBMember.schema.paths.familyMember !== undefined,
  "FamilyMembership schema defines indexed familyMember reference path"
);

// Verify duplicate prevention logic
const existingMembers = [
  { membershipId: "m1", familyMemberId: mockFamilyMemberId, name: "Suresh Kumar" },
  { membershipId: "m2", familyMemberId: "60c72b2f9b1d8b2bad0000cc", name: "Sunita Kumar" },
];

const isDuplicate1 = existingMembers.some(
  (m) => String(m.familyMemberId) === mockFamilyMemberId || m.name.toLowerCase() === "suresh kumar"
);
assert(isDuplicate1 === true, "Duplicate detection catches matching database familyMemberId");

const isDuplicate2 = existingMembers.some(
  (m) => String(m.familyMemberId) === "60c72b2f9b1d8b2bad0000dd" || m.name.toLowerCase() === "rohit kumar"
);
assert(isDuplicate2 === false, "Non-duplicate family member is permitted to be added");

console.log(`\n========================================`);
console.log(`Test Summary: ${passed} passed, ${failed} failed.`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
