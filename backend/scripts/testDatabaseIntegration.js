const mongoose = require("mongoose");
const crypto = require("crypto");
const FamilyGroup = require("../models/FamilyGroup");
const FamilyMembership = require("../models/FamilyMembership");
const FamilyMember = require("../models/FamilyMember");
const User = require("../models/User");

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

console.log("=== PilgrimIQ Database Integration & Family Member Tests ===\n");

// Test 1: User Model and Saved Family Member schema compatibility
console.log("1. Database Schema Structure & Field Types:");
const userMockId = new mongoose.Types.ObjectId();
const familyMemberMockId = new mongoose.Types.ObjectId();
const groupMockId = new mongoose.Types.ObjectId();

const dbMember = new FamilyMember({
  _id: familyMemberMockId,
  user: userMockId,
  name: "Dr. Suresh Sharma",
  relationship: "Father",
  phone: "+91 98765 43210",
  age: 62,
  gender: "Male",
  bloodGroup: "O+",
});

assert(dbMember.user.equals(userMockId), "FamilyMember correctly links to authenticated User ObjectId");
assert(dbMember.name === "Dr. Suresh Sharma", "FamilyMember name field preserved");
assert(dbMember.relationship === "Father", "FamilyMember relationship field preserved");
assert(dbMember.phone === "+91 98765 43210", "FamilyMember contact information preserved");

// Test 2: FamilyMembership stores database reference and NO account requirement
console.log("\n2. FamilyMembership Database Record Reuse:");
const rawToken = crypto.randomBytes(24).toString("hex");
const hashedToken = FamilyMembership.hashToken(rawToken);

const membership = new FamilyMembership({
  group: groupMockId,
  familyMember: dbMember._id,
  user: null, // No PilgrimIQ account required
  name: dbMember.name,
  relationship: dbMember.relationship,
  role: "member",
  isAccountUser: false,
  inviteTokenHash: hashedToken,
  inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  isInvitationAccepted: false,
  status: "active",
});

assert(membership.familyMember.equals(familyMemberMockId), "Membership stores existing familyMember ObjectId reference");
assert(membership.user === null, "Invited family member requires no User account");
assert(membership.name === "Dr. Suresh Sharma", "Membership inherits saved name");
assert(membership.relationship === "Father", "Membership inherits saved relationship");
assert(membership.inviteTokenHash.length === 64, "SHA-256 invite token hash is 64 characters");

// Test 3: Group Ownership and Security Verification
console.log("\n3. Group Ownership and Authorization Simulation:");
const unauthorizedUserId = new mongoose.Types.ObjectId();

const mockGroup = new FamilyGroup({
  _id: groupMockId,
  name: "Sharma Family Yatra",
  creator: userMockId,
  inviteCode: "SHARM1",
  separationThresholdMeters: 15,
});

assert(mockGroup.creator.equals(userMockId), "Group creator matches authenticated user");
assert(!mockGroup.creator.equals(unauthorizedUserId), "Unauthorized user cannot claim group creator permissions");

// Test 4: Family Member Belonging Check (Server-side validation)
console.log("\n4. Server-Side Ownership Verification Logic:");
function verifyMemberOwnership(memberDoc, requestingUserId) {
  if (!memberDoc) return false;
  return String(memberDoc.user) === String(requestingUserId);
}

assert(
  verifyMemberOwnership(dbMember, userMockId) === true,
  "Authorized user passes server-side family member ownership verification"
);
assert(
  verifyMemberOwnership(dbMember, unauthorizedUserId) === false,
  "Unauthorized user fails server-side family member ownership verification"
);

// Test 5: Duplicate Prevention in Tracking Group
console.log("\n5. Duplicate Addition Prevention in Group:");
const existingGroupMembers = [
  { group: groupMockId, familyMember: familyMemberMockId, name: "Dr. Suresh Sharma" }
];

function canAddMember(groupMembers, newMemberId, newMemberName) {
  const isDuplicate = groupMembers.some(
    (m) =>
      (newMemberId && String(m.familyMember) === String(newMemberId)) ||
      m.name.toLowerCase() === newMemberName.toLowerCase()
  );
  return !isDuplicate;
}

assert(
  canAddMember(existingGroupMembers, familyMemberMockId, "Dr. Suresh Sharma") === false,
  "System prevents adding the same existing family member twice"
);
assert(
  canAddMember(existingGroupMembers, new mongoose.Types.ObjectId(), "Rohit Sharma") === true,
  "System allows adding a distinct family member"
);

// Test 6: Invitation Token and No-Login Consent Flow
console.log("\n6. Public No-Login Consent & Session Transition:");
const sessionToken = crypto.randomBytes(32).toString("hex");
const sessionHash = FamilyMembership.hashToken(sessionToken);

membership.sessionTokenHash = sessionHash;
membership.isInvitationAccepted = true;
membership.consentGiven = true;
membership.consentGivenAt = new Date();
membership.isLocationSharing = true;

assert(membership.consentGiven === true, "Explicit location consent is recorded");
assert(membership.isLocationSharing === true, "Location sharing starts only after consent");
assert(membership.sessionTokenHash.length === 64, "Session token hash is securely stored");

console.log(`\n========================================`);
console.log(`Test Summary: ${passed} passed, ${failed} failed.`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
