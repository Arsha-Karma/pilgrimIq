const express = require("express");
const router = express.Router();

const {
  createGroup,
  joinGroupByCode,
  getSavedFamilyMembers,
  addFamilyMember,
  regenerateMemberInvite,
  revokeMember,
  validateInvitation,
  validateGroupInviteCode,
  joinGroupByCodePublic,
  acceptInvitationAndStartSession,
  sessionSubmitLocation,
  sessionStopTracking,
  sessionGetStatus,
  getMyGroups,
  getGroupDetails,
  getGroupMembers,
  updateGroupSettings,
  updateLocationConsent,
  startTrackingSession,
  stopTrackingSession,
  submitLocation,
  getGroupLocations,
  getGroupAlerts,
  resolveAlert,
  registerIoTDevice,
  getDeviceStatus,
  iotHeartbeat,
  iotGetPendingCommands,
  iotAcknowledgeCommand,
  triggerBuzzerTest,
} = require("../controllers/familyTrackingController");

const { protect } = require("../middleware/authMiddleware");
const { protectIoT } = require("../middleware/iotAuthMiddleware");

// ==========================================
// 1. PUBLIC NO-LOGIN FAMILY MEMBER TRACKING
// ==========================================
// Invitation link validation & session exchange (No PilgrimIQ user account needed)
router.get("/invite/:token", validateInvitation);
router.post("/invite/:token/session", acceptInvitationAndStartSession);

// Group invitation link & QR code endpoints (Join by 6-digit inviteCode)
router.get("/invite/code/:code", validateGroupInviteCode);
router.post("/invite/code/:code/join", joinGroupByCodePublic);

// Restricted tracking session endpoints (Protected by x-tracking-session header)
router.post("/session/location", sessionSubmitLocation);
router.post("/session/stop", sessionStopTracking);
router.get("/session/status", sessionGetStatus);

// ==========================================
// 2. ESP32 IOT HARDWARE DEDICATED ROUTES
// ==========================================
// Device uses hardware authentication (x-device-id & x-device-token headers)
router.post("/iot/heartbeat", protectIoT, iotHeartbeat);
router.get("/iot/commands", protectIoT, iotGetPendingCommands);
router.post("/iot/acknowledge", protectIoT, iotAcknowledgeCommand);

// ==========================================
// 3. MAIN USER DASHBOARD ROUTES (JWT Protect)
// ==========================================
router.use(protect);

// Existing Family Members from Database
router.get("/saved-family-members", getSavedFamilyMembers);

// Group Management
router.post("/groups", createGroup);
router.post("/groups/join", joinGroupByCode);
router.get("/groups/my-groups", getMyGroups);
router.get("/groups/:groupId", getGroupDetails);
router.get("/groups/:groupId/members", getGroupMembers);
router.patch("/groups/:groupId/settings", updateGroupSettings);

// Member Invitation & Management (Add family members without accounts)
router.post("/groups/:groupId/members", addFamilyMember);
router.post("/groups/:groupId/members/:membershipId/regenerate-invite", regenerateMemberInvite);
router.post("/groups/:groupId/members/:membershipId/revoke", revokeMember);
router.delete("/groups/:groupId/members/:membershipId", revokeMember);

// Tracking Sessions & Consent for Main User's Phone
router.post("/tracking/consent", updateLocationConsent);
router.post("/tracking/start", startTrackingSession);
router.post("/tracking/stop", stopTrackingSession);

// GPS Location Submissions & Polling
router.post("/location", submitLocation);
router.get("/groups/:groupId/locations", getGroupLocations);

// Separation Alerts
router.get("/groups/:groupId/alerts", getGroupAlerts);
router.post("/alerts/:alertId/resolve", resolveAlert);

// ESP32 Device Association & Status for Dashboard
router.post("/iot/register", registerIoTDevice);
router.get("/iot/status/:groupId", getDeviceStatus);
router.post("/iot/test-buzzer/:groupId", triggerBuzzerTest);

module.exports = router;
