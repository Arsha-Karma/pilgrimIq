import { fetchAPI, getHeaders } from "./api";

/**
 * Family Tracking API Service
 */

// Create a new family group (Main user)
export const apiCreateFamilyGroup = async (groupData, token) => {
  return fetchAPI("/family-tracking/groups", {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(groupData),
  });
};

// Join group via invite code (Account users)
export const apiJoinFamilyGroup = async (joinData, token) => {
  return fetchAPI("/family-tracking/groups/join", {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(joinData),
  });
};

// Fetch saved family members from database for the authenticated user
export const apiGetSavedFamilyMembers = async (token) => {
  return fetchAPI("/family-tracking/saved-family-members", {
    method: "GET",
    headers: getHeaders(token),
  });
};

// Add family member without an account and generate secure invitation link
export const apiAddFamilyMember = async (groupId, memberData, token) => {
  return fetchAPI(`/family-tracking/groups/${groupId}/members`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(memberData),
  });
};

// Re-generate invitation link for existing member
export const apiRegenerateMemberInvite = async (groupId, membershipId, token) => {
  return fetchAPI(`/family-tracking/groups/${groupId}/members/${membershipId}/regenerate-invite`, {
    method: "POST",
    headers: getHeaders(token),
  });
};

// Revoke a member's invitation or active tracking session
export const apiRevokeFamilyMember = async (groupId, membershipId, token) => {
  return fetchAPI(`/family-tracking/groups/${groupId}/members/${membershipId}/revoke`, {
    method: "POST",
    headers: getHeaders(token),
  });
};

// Determine configured public frontend URL (never localhost for shareable links)
export const getPublicFrontendUrl = () => {
  if (import.meta.env.VITE_PUBLIC_FRONTEND_URL) {
    return import.meta.env.VITE_PUBLIC_FRONTEND_URL.replace(/\/+$/, "");
  }
  if (import.meta.env.VITE_FRONTEND_URL) {
    return import.meta.env.VITE_FRONTEND_URL.replace(/\/+$/, "");
  }
  const custom = typeof window !== "undefined" ? localStorage.getItem("pilgrim_custom_public_url") : null;
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1" && hostname !== "0.0.0.0") {
      return window.location.origin;
    }
  }
  return "https://pilgrimiq.vercel.app";
};

// ==========================================
// NO-LOGIN FAMILY MEMBER SMARTPHONE APIS
// ==========================================

// Validate individual member invitation link token (No login needed)
export const apiValidateInvitation = async (inviteToken) => {
  return fetchAPI(`/family-tracking/invite/${inviteToken}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
};

// Validate 6-digit group invitation code (Public - No login needed)
export const apiValidateGroupInviteCode = async (inviteCode) => {
  return fetchAPI(`/family-tracking/invite/code/${encodeURIComponent(inviteCode)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
};

// Join group via 6-digit invite code (Public for family members without login)
export const apiJoinGroupByCodePublic = async (inviteCode, memberData) => {
  return fetchAPI(`/family-tracking/invite/code/${encodeURIComponent(inviteCode)}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(memberData),
  });
};

// Accept invitation & exchange for a restricted tracking session (supports optional account linking)
export const apiAcceptInvitationAndStartSession = async (inviteToken, consentGiven = true, userToken = null) => {
  const headers = { "Content-Type": "application/json" };
  if (userToken) {
    headers["Authorization"] = `Bearer ${userToken}`;
  }
  return fetchAPI(`/family-tracking/invite/${inviteToken}/session`, {
    method: "POST",
    headers,
    body: JSON.stringify({ consentGiven }),
  });
};

// Submit location using restricted session token
export const apiSessionSubmitLocation = async (sessionToken, locationData) => {
  return fetchAPI("/family-tracking/session/location", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tracking-session": sessionToken,
    },
    body: JSON.stringify(locationData),
  });
};

// Stop location sharing using restricted session token
export const apiSessionStopTracking = async (sessionToken) => {
  return fetchAPI("/family-tracking/session/stop", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tracking-session": sessionToken,
    },
  });
};

// Get member's own session status
export const apiSessionGetStatus = async (sessionToken) => {
  return fetchAPI("/family-tracking/session/status", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-tracking-session": sessionToken,
    },
  });
};

// ==========================================
// MAIN USER TRACKING DASHBOARD APIS
// ==========================================

// Get all tracking groups user is part of
export const apiGetMyFamilyGroups = async (token) => {
  return fetchAPI("/family-tracking/groups/my-groups", {
    method: "GET",
    headers: getHeaders(token),
  });
};

// Get details for a specific group
export const apiGetFamilyGroupDetails = async (groupId, token) => {
  return fetchAPI(`/family-tracking/groups/${groupId}`, {
    method: "GET",
    headers: getHeaders(token),
  });
};

// Get members of a group with real-time location status
export const apiGetFamilyGroupMembers = async (groupId, token) => {
  return fetchAPI(`/family-tracking/groups/${groupId}/members`, {
    method: "GET",
    headers: getHeaders(token),
  });
};

// Update group settings (threshold, freshness, etc.)
export const apiUpdateFamilyGroupSettings = async (groupId, settings, token) => {
  return fetchAPI(`/family-tracking/groups/${groupId}/settings`, {
    method: "PATCH",
    headers: getHeaders(token),
    body: JSON.stringify(settings),
  });
};

// Update location-sharing consent (Main user)
export const apiUpdateLocationConsent = async (consentData, token) => {
  return fetchAPI("/family-tracking/tracking/consent", {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(consentData),
  });
};

// Start location sharing session (Main user)
export const apiStartTrackingSession = async (groupId, token) => {
  return fetchAPI("/family-tracking/tracking/start", {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ groupId }),
  });
};

// Stop location sharing session (Main user)
export const apiStopTrackingSession = async (groupId, token) => {
  return fetchAPI("/family-tracking/tracking/stop", {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ groupId }),
  });
};

// Submit main user GPS location update
export const apiSubmitLocation = async (locationData, token) => {
  return fetchAPI("/family-tracking/location", {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(locationData),
  });
};

// Retrieve all latest locations for members of a group
export const apiGetFamilyGroupLocations = async (groupId, token) => {
  return fetchAPI(`/family-tracking/groups/${groupId}/locations`, {
    method: "GET",
    headers: getHeaders(token),
  });
};

// Retrieve active and historical separation alerts
export const apiGetFamilyGroupAlerts = async (groupId, token) => {
  return fetchAPI(`/family-tracking/groups/${groupId}/alerts`, {
    method: "GET",
    headers: getHeaders(token),
  });
};

// Manually resolve an alert
export const apiResolveSeparationAlert = async (alertId, reason, token) => {
  return fetchAPI(`/family-tracking/alerts/${alertId}/resolve`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ reason }),
  });
};

// Register / pair ESP32 device with family group
export const apiRegisterIoTDevice = async (deviceData, token) => {
  return fetchAPI("/family-tracking/iot/register", {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(deviceData),
  });
};

// Get paired ESP32 connection status
export const apiGetIoTDeviceStatus = async (groupId, token) => {
  return fetchAPI(`/family-tracking/iot/status/${groupId}`, {
    method: "GET",
    headers: getHeaders(token),
  });
};

// Trigger physical ESP32 buzzer test from dashboard
export const apiTriggerBuzzerTest = async (groupId, token) => {
  return fetchAPI(`/family-tracking/iot/test-buzzer/${groupId}`, {
    method: "POST",
    headers: getHeaders(token),
  });
};
