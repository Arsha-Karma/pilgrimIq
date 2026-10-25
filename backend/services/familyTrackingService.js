const MemberLocation = require("../models/MemberLocation");
const SeparationAlert = require("../models/SeparationAlert");
const FamilyMembership = require("../models/FamilyMembership");
const FamilyGroup = require("../models/FamilyGroup");

/**
 * Calculates great-circle distance between two GPS coordinates using the Haversine formula
 * @param {number} lat1 Latitude of point 1 in degrees
 * @param {number} lon1 Longitude of point 1 in degrees
 * @param {number} lat2 Latitude of point 2 in degrees
 * @param {number} lon2 Longitude of point 2 in degrees
 * @returns {number} Distance in meters
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined || lon1 === undefined ||
    lat2 === undefined || lon2 === undefined ||
    isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)
  ) {
    return null;
  }

  const R = 6371000; // Earth's mean radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Round to 1 decimal place (0.1 meter precision)
  return Math.round(distance * 10) / 10;
}

/**
 * Validates coordinate ranges
 */
function isValidCoordinate(lat, lon) {
  if (typeof lat !== "number" || typeof lon !== "number" || isNaN(lat) || isNaN(lon)) {
    return false;
  }
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/**
 * Validates GPS accuracy measurement
 */
function isValidAccuracy(accuracy) {
  if (accuracy === undefined || accuracy === null) return true;
  return typeof accuracy === "number" && !isNaN(accuracy) && accuracy >= 0;
}

/**
 * Checks whether a given location timestamp is considered fresh
 */
function isLocationFresh(timestamp, freshnessMinutes = 3) {
  if (!timestamp) return false;
  const time = new Date(timestamp).getTime();
  const now = Date.now();
  const maxAgeMs = freshnessMinutes * 60 * 1000;
  return now - time <= maxAgeMs && time <= now + 60000; // Not older than freshness, not far in future
}

/**
 * Determines friendly status label for a location
 */
function determineLocationStatus(location, freshnessMinutes = 3, isSharing = true) {
  if (!isSharing) return "stopped";
  if (!location) return "unavailable";
  const fresh = isLocationFresh(location.serverReceivedAt || location.clientTimestamp, freshnessMinutes);
  if (!fresh) return "stale";
  return location.status || "live";
}

/**
 * Core business logic: Process an incoming GPS location update, calculate distance, and handle alerts
 * Supports both account-holding users (userId) and no-account guest members (membershipId)
 */
async function processLocationUpdate({
  groupId,
  userId = null,
  membershipId = null,
  latitude,
  longitude,
  accuracy = 0,
  altitude = null,
  speed = null,
  heading = null,
  clientTimestamp = new Date(),
  isSimulated = false,
}) {
  // 1. Validate coordinates
  if (!isValidCoordinate(latitude, longitude)) {
    throw new Error("Invalid GPS coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.");
  }

  if (!isValidAccuracy(accuracy)) {
    throw new Error("Invalid accuracy value. Accuracy must be a non-negative number.");
  }

  // 2. Fetch group and membership
  const group = await FamilyGroup.findById(groupId);
  if (!group) {
    throw new Error("Family group not found.");
  }

  let membership = null;
  if (membershipId) {
    membership = await FamilyMembership.findById(membershipId);
  } else if (userId) {
    membership = await FamilyMembership.findOne({ group: groupId, user: userId });
  }

  if (!membership || membership.status !== "active") {
    throw new Error("Member is not active in this family group.");
  }

  const isMainUser =
    membership.role === "main" ||
    (userId && String(group.creator) === String(userId));

  // 3. Find main user membership and latest location
  let mainUserId = group.creator;
  let mainUserLocation = null;
  let computedDistance = null;
  let alertCreated = null;

  if (isMainUser) {
    // If updating main user's location, save it first
    const savedLocation = await MemberLocation.create({
      group: groupId,
      membership: membership._id,
      user: userId || membership.user,
      memberName: membership.name || "Main User",
      latitude,
      longitude,
      accuracy,
      altitude,
      speed,
      heading,
      clientTimestamp,
      serverReceivedAt: new Date(),
      distanceFromMain: 0,
      status: "live",
      isSimulated,
    });

    // Check all active members against this new main user position
    await reevaluateMembersSeparation(group, savedLocation);

    return {
      location: savedLocation,
      role: "main",
      distanceFromMain: 0,
      separationStatus: "normal",
      alert: null,
    };
  } else {
    // Current user is a family member. Retrieve latest main user location
    mainUserLocation = await MemberLocation.findOne({
      group: groupId,
      user: mainUserId,
    }).sort({ serverReceivedAt: -1 });

    const isMainFresh = mainUserLocation
      ? isLocationFresh(mainUserLocation.serverReceivedAt, group.locationFreshnessMinutes)
      : false;

    let separationStatus = "normal";

    if (mainUserLocation && isMainFresh) {
      computedDistance = calculateHaversineDistance(
        mainUserLocation.latitude,
        mainUserLocation.longitude,
        latitude,
        longitude
      );

      const threshold = group.separationThresholdMeters || 10;
      const isSeparated = computedDistance !== null && computedDistance > threshold;

      if (isSeparated) {
        membership.consecutiveSeparatedCount = (membership.consecutiveSeparatedCount || 0) + 1;

        if (membership.consecutiveSeparatedCount >= (group.consecutiveReadingsRequired || 2)) {
          separationStatus = "separated";

          // Determine severity & buzzer pattern
          const isCritical =
            computedDistance > threshold * 2.5 || membership.consecutiveSeparatedCount >= 4;
          const severity = isCritical ? "critical" : "warning";
          const buzzerPattern = isCritical ? "critical_urgent" : "warning_short";

          // Check for active alert to prevent duplicate records
          const activeAlertQuery = {
            group: groupId,
            status: { $in: ["active", "acknowledged_by_device"] },
            $or: [
              { membership: membership._id },
              ...(membership.user ? [{ member: membership.user }] : []),
            ],
          };

          const activeAlert = await SeparationAlert.findOne(activeAlertQuery).sort({ createdAt: -1 });

          if (!activeAlert) {
            // Create fresh separation incident
            alertCreated = await SeparationAlert.create({
              group: groupId,
              membership: membership._id,
              member: membership.user || null,
              memberName: membership.name || "Family Member",
              mainUser: mainUserId,
              distanceMeters: computedDistance,
              thresholdMeters: threshold,
              severity,
              buzzerPattern,
              memberLocation: {
                latitude,
                longitude,
                accuracy,
                recordedAt: new Date(),
              },
              mainLocation: {
                latitude: mainUserLocation.latitude,
                longitude: mainUserLocation.longitude,
                accuracy: mainUserLocation.accuracy,
                recordedAt: mainUserLocation.serverReceivedAt,
              },
              status: "active",
              deviceCommandDelivered: false,
              consecutiveCount: membership.consecutiveSeparatedCount,
            });
          } else {
            // Update existing active alert with latest distance and severity
            activeAlert.distanceMeters = computedDistance;
            activeAlert.consecutiveCount = membership.consecutiveSeparatedCount;
            activeAlert.memberName = membership.name || activeAlert.memberName;
            if (severity === "critical") {
              activeAlert.severity = "critical";
              activeAlert.buzzerPattern = "critical_urgent";
            }
            activeAlert.memberLocation = {
              latitude,
              longitude,
              accuracy,
              recordedAt: new Date(),
            };
            await activeAlert.save();
            alertCreated = activeAlert;
          }
        } else {
          // Warning state before full threshold confirmation
          separationStatus = "warning";
        }
      } else {
        // Member is within safe distance
        membership.consecutiveSeparatedCount = 0;
        separationStatus = "normal";

        // Auto-resolve any existing active alert
        await SeparationAlert.updateMany(
          {
            group: groupId,
            status: { $in: ["active", "acknowledged_by_device"] },
            $or: [
              { membership: membership._id },
              ...(membership.user ? [{ member: membership.user }] : []),
            ],
          },
          {
            $set: {
              status: "resolved",
              resolvedAt: new Date(),
              resolvedReason: "Member reunited within safe distance (" + computedDistance + "m)",
            },
          }
        );
      }
    } else {
      separationStatus = mainUserLocation ? "stale" : "unavailable";
    }

    await membership.save();

    const savedLocation = await MemberLocation.create({
      group: groupId,
      membership: membership._id,
      user: membership.user || null,
      memberName: membership.name || "Family Member",
      latitude,
      longitude,
      accuracy,
      altitude,
      speed,
      heading,
      clientTimestamp,
      serverReceivedAt: new Date(),
      distanceFromMain: computedDistance,
      status: separationStatus,
      isSimulated,
    });

    return {
      location: savedLocation,
      role: "member",
      distanceFromMain: computedDistance,
      separationStatus,
      alert: alertCreated,
    };
  }
}

/**
 * Re-evaluate other members when the main user's location updates
 */
async function reevaluateMembersSeparation(group, mainLocation) {
  const memberships = await FamilyMembership.find({
    group: group._id,
    role: "member",
    status: "active",
  });

  for (const member of memberships) {
    const locQuery = {
      group: group._id,
      $or: [
        { membership: member._id },
        ...(member.user ? [{ user: member.user }] : []),
      ],
    };

    const latestLoc = await MemberLocation.findOne(locQuery).sort({ serverReceivedAt: -1 });

    if (latestLoc && isLocationFresh(latestLoc.serverReceivedAt, group.locationFreshnessMinutes)) {
      const distance = calculateHaversineDistance(
        mainLocation.latitude,
        mainLocation.longitude,
        latestLoc.latitude,
        latestLoc.longitude
      );

      const threshold = group.separationThresholdMeters || 10;
      if (distance !== null && distance <= threshold) {
        member.consecutiveSeparatedCount = 0;
        await member.save();

        await SeparationAlert.updateMany(
          {
            group: group._id,
            status: { $in: ["active", "acknowledged_by_device"] },
            $or: [
              { membership: member._id },
              ...(member.user ? [{ member: member.user }] : []),
            ],
          },
          {
            $set: {
              status: "resolved",
              resolvedAt: new Date(),
              resolvedReason: "Reunited after main user moved closer (" + distance + "m)",
            },
          }
        );
      }
    }
  }
}

module.exports = {
  calculateHaversineDistance,
  isValidCoordinate,
  isValidAccuracy,
  isLocationFresh,
  determineLocationStatus,
  processLocationUpdate,
};
