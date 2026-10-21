const crypto = require("crypto");
const mongoose = require("mongoose");
const FamilyGroup = require("../models/FamilyGroup");
const FamilyMembership = require("../models/FamilyMembership");
const MemberLocation = require("../models/MemberLocation");
const SeparationAlert = require("../models/SeparationAlert");
const IoTDevice = require("../models/IoTDevice");
const User = require("../models/User");
const FamilyMember = require("../models/FamilyMember");
const {
  processLocationUpdate,
  determineLocationStatus,
  calculateHaversineDistance,
  isLocationFresh,
} = require("../services/familyTrackingService");

// @desc    Create a new family tracking group
// @route   POST /api/family-tracking/groups
// @access  Private (JWT User)
const createGroup = async (req, res, next) => {
  try {
    const { name, separationThresholdMeters = 10 } = req.body;

    if (!name || !name.trim()) {
      res.status(400);
      throw new Error("Group name is required.");
    }

    // Generate unique invite code for group fallback
    let inviteCode = "";
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      inviteCode = FamilyGroup.generateInviteCode();
      const existing = await FamilyGroup.findOne({ inviteCode });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      res.status(500);
      throw new Error("Failed to generate unique invite code. Please try again.");
    }

    const group = await FamilyGroup.create({
      name: name.trim(),
      creator: req.user._id,
      inviteCode,
      separationThresholdMeters: Number(separationThresholdMeters) || 10,
    });

    // Create membership for creator as "main"
    const membership = await FamilyMembership.create({
      group: group._id,
      user: req.user._id,
      name: req.user.name || "Main User",
      role: "main",
      isAccountUser: true,
      isLocationSharing: true,
      consentGiven: true,
      consentGivenAt: new Date(),
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Family tracking group created successfully.",
      group,
      membership,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join an existing family tracking group via invite code (Account users)
// @route   POST /api/family-tracking/groups/join
// @access  Private (JWT User)
const joinGroupByCode = async (req, res, next) => {
  try {
    const { inviteCode, displayName } = req.body;

    if (!inviteCode || !inviteCode.trim()) {
      res.status(400);
      throw new Error("Invitation code is required.");
    }

    const cleanCode = inviteCode.trim().toUpperCase();
    const group = await FamilyGroup.findOne({ inviteCode: cleanCode });

    if (!group) {
      res.status(404);
      throw new Error("Invalid invitation code. No matching family group found.");
    }

    // Check existing membership
    let membership = await FamilyMembership.findOne({
      group: group._id,
      user: req.user._id,
    });

    if (membership) {
      if (membership.status === "removed" || membership.status === "revoked") {
        membership.status = "active";
        await membership.save();
      }
      return res.status(200).json({
        success: true,
        message: "You are already a member of this group.",
        group,
        membership,
      });
    }

    const role = String(group.creator) === String(req.user._id) ? "main" : "member";

    membership = await FamilyMembership.create({
      group: group._id,
      user: req.user._id,
      name: displayName || req.user.name || "Family Member",
      role,
      isAccountUser: true,
      isLocationSharing: false,
      consentGiven: false,
      status: "active",
    });

    res.status(200).json({
      success: true,
      message: `Joined group '${group.name}' successfully.`,
      group,
      membership,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's existing saved family members from the database
// @route   GET /api/family-tracking/saved-family-members
// @access  Private (JWT Main User)
const getSavedFamilyMembers = async (req, res, next) => {
  try {
    // 1. Primary Source: FamilyMember collection belonging to the authenticated user
    const dbMembers = await FamilyMember.find({ user: req.user._id })
      .select("_id name relationship age gender phone bloodGroup profilePhoto")
      .sort({ createdAt: -1 })
      .lean();

    let membersList = [];

    if (dbMembers && dbMembers.length > 0) {
      membersList = dbMembers.map((m) => ({
        _id: m._id.toString(),
        name: m.name,
        relationship: m.relationship || "",
        phone: m.phone || "",
        age: m.age || null,
        gender: m.gender || "",
        bloodGroup: m.bloodGroup || "",
        profilePhoto: m.profilePhoto || "",
        source: "database",
      }));
    } else {
      // 2. Fallback: check embedded familyMembers on user document if any
      const userDoc = await User.findById(req.user._id).select("familyMembers").lean();
      if (userDoc && Array.isArray(userDoc.familyMembers) && userDoc.familyMembers.length > 0) {
        membersList = userDoc.familyMembers.map((m) => ({
          _id: m._id ? m._id.toString() : "",
          name: m.name,
          relationship: m.relationship || "",
          phone: m.phone || "",
          age: m.age || null,
          gender: m.gender || "",
          bloodGroup: m.bloodGroup || "",
          profilePhoto: "",
          source: "user_embedded",
        }));
      }
    }

    res.status(200).json({
      success: true,
      count: membersList.length,
      familyMembers: membersList,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a family member without an account and generate secure invitation link
// @route   POST /api/family-tracking/groups/:groupId/members
// @access  Private (JWT Main User)
const addFamilyMember = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { familyMemberId, name, relationship = "" } = req.body;

    const group = await FamilyGroup.findById(groupId);
    if (!group) {
      res.status(404);
      throw new Error("Family group not found.");
    }

    if (String(group.creator) !== String(req.user._id)) {
      res.status(403);
      throw new Error("Only the group creator can add family members.");
    }

    let finalName = "";
    let finalRelationship = "";
    let linkedFamilyMemberId = null;

    if (familyMemberId) {
      // 1. Verify existence and ownership of saved FamilyMember record in MongoDB
      if (!mongoose.Types.ObjectId.isValid(familyMemberId)) {
        res.status(400);
        throw new Error("Invalid family member ID format.");
      }

      // Check FamilyMember collection for member belonging to req.user._id
      let memberRecord = await FamilyMember.findOne({
        _id: familyMemberId,
        user: req.user._id,
      });

      // Secondary check on user's embedded familyMembers if not in separate collection
      let embeddedRecord = null;
      if (!memberRecord) {
        const userDoc = await User.findById(req.user._id).select("familyMembers");
        if (userDoc && userDoc.familyMembers) {
          embeddedRecord = userDoc.familyMembers.id
            ? userDoc.familyMembers.id(familyMemberId)
            : userDoc.familyMembers.find((f) => String(f._id) === String(familyMemberId));
        }
      }

      if (!memberRecord && !embeddedRecord) {
        res.status(404);
        throw new Error("Saved family member not found or does not belong to your account.");
      }

      // Extract verified database records
      finalName = memberRecord ? memberRecord.name : embeddedRecord.name;
      finalRelationship = memberRecord ? memberRecord.relationship : (embeddedRecord.relationship || "");
      linkedFamilyMemberId = memberRecord ? memberRecord._id : (embeddedRecord ? embeddedRecord._id : null);

      // Check if this saved family member has already been added to this tracking group
      const duplicateConditions = [
        { name: finalName, status: { $in: ["active", "inactive"] } },
      ];
      if (linkedFamilyMemberId && mongoose.Types.ObjectId.isValid(linkedFamilyMemberId)) {
        duplicateConditions.push({ familyMember: linkedFamilyMemberId, status: { $in: ["active", "inactive"] } });
      }

      const existingMembership = await FamilyMembership.findOne({
        group: group._id,
        $or: duplicateConditions,
      });

      if (existingMembership) {
        res.status(400);
        throw new Error(`'${finalName}' is already added to this tracking group.`);
      }
    } else {
      // Manual member entry
      if (!name || !name.trim()) {
        res.status(400);
        throw new Error("Family member name is required.");
      }
      finalName = name.trim();
      finalRelationship = relationship ? relationship.trim() : "";

      // Check if user already has an existing saved FamilyMember with this name to reuse database record
      const existingSaved = await FamilyMember.findOne({
        user: req.user._id,
        name: { $regex: new RegExp(`^${finalName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      });

      if (existingSaved) {
        linkedFamilyMemberId = existingSaved._id;
        if (!finalRelationship && existingSaved.relationship) {
          finalRelationship = existingSaved.relationship;
        }
      }

      // Check duplicate by name in this group
      const existingMembership = await FamilyMembership.findOne({
        group: group._id,
        name: finalName,
        status: { $in: ["active", "inactive"] },
      });

      if (existingMembership) {
        res.status(400);
        throw new Error(`'${finalName}' is already added to this tracking group.`);
      }
    }

    // Generate cryptographically secure 48-character hex invitation token
    const rawInviteToken = crypto.randomBytes(24).toString("hex");
    const inviteTokenHash = FamilyMembership.hashToken(rawInviteToken);
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day validity

    const membership = await FamilyMembership.create({
      group: group._id,
      familyMember: linkedFamilyMemberId || null,
      user: null, // No PilgrimIQ account required
      name: finalName,
      relationship: finalRelationship,
      role: "member",
      isAccountUser: false,
      inviteTokenHash,
      inviteExpiresAt,
      isInvitationAccepted: false,
      isLocationSharing: false,
      consentGiven: false,
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: `Family member '${membership.name}' added successfully.`,
      member: {
        _id: membership._id,
        familyMemberId: linkedFamilyMemberId,
        name: membership.name,
        relationship: membership.relationship,
        role: membership.role,
        isAccountUser: false,
        isInvitationAccepted: false,
        inviteExpiresAt,
        status: membership.status,
      },
      inviteToken: rawInviteToken, // Returned once so main user can share/display QR
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Re-generate invitation link for an existing family member
// @route   POST /api/family-tracking/groups/:groupId/members/:membershipId/regenerate-invite
// @access  Private (JWT Main User)
const regenerateMemberInvite = async (req, res, next) => {
  try {
    const { groupId, membershipId } = req.params;

    const group = await FamilyGroup.findById(groupId);
    if (!group || String(group.creator) !== String(req.user._id)) {
      res.status(403);
      throw new Error("Unauthorized to manage members for this group.");
    }

    const membership = await FamilyMembership.findOne({
      _id: membershipId,
      group: groupId,
    });

    if (!membership) {
      res.status(404);
      throw new Error("Member not found in this group.");
    }

    const rawInviteToken = crypto.randomBytes(24).toString("hex");
    membership.inviteTokenHash = FamilyMembership.hashToken(rawInviteToken);
    membership.inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    membership.sessionTokenHash = null; // Reset previous session if any
    membership.isInvitationAccepted = false;
    membership.status = "active";
    await membership.save();

    res.status(200).json({
      success: true,
      message: "New secure invitation link generated.",
      inviteToken: rawInviteToken,
      inviteExpiresAt: membership.inviteExpiresAt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Revoke member invitation or active session
// @route   POST /api/family-tracking/groups/:groupId/members/:membershipId/revoke
// @access  Private (JWT Main User)
const revokeMember = async (req, res, next) => {
  try {
    const { groupId, membershipId } = req.params;

    const group = await FamilyGroup.findById(groupId);
    if (!group || String(group.creator) !== String(req.user._id)) {
      res.status(403);
      throw new Error("Unauthorized to manage members for this group.");
    }

    const membership = await FamilyMembership.findOne({
      _id: membershipId,
      group: groupId,
    });

    if (!membership) {
      res.status(404);
      throw new Error("Member not found in this group.");
    }

    membership.status = "revoked";
    membership.isLocationSharing = false;
    membership.sessionTokenHash = null;
    membership.inviteTokenHash = null;
    await membership.save();

    // Mark latest location as stopped
    await MemberLocation.create({
      group: groupId,
      membership: membership._id,
      user: membership.user,
      memberName: membership.name,
      latitude: 0,
      longitude: 0,
      accuracy: 0,
      status: "stopped",
      serverReceivedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: `Access for '${membership.name}' has been revoked.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate a family member invitation link (No login required)
// @route   GET /api/family-tracking/invite/:token
// @access  Public
const validateInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token || !token.trim()) {
      return res.status(400).json({ valid: false, message: "Invitation token is required." });
    }

    const tokenHash = FamilyMembership.hashToken(token.trim());
    const membership = await FamilyMembership.findOne({
      inviteTokenHash: tokenHash,
      status: "active",
    }).populate("group", "name creator separationThresholdMeters");

    if (!membership || !membership.group) {
      return res.status(404).json({
        valid: false,
        message: "Invalid or revoked invitation link. Please request a new link from the group creator.",
      });
    }

    if (membership.inviteExpiresAt && new Date(membership.inviteExpiresAt) < new Date()) {
      return res.status(410).json({
        valid: false,
        message: "This invitation link has expired. Please ask the group creator for a new link.",
      });
    }

    res.status(200).json({
      valid: true,
      membershipId: membership._id,
      memberName: membership.name,
      relationship: membership.relationship,
      groupName: membership.group.name,
      separationThresholdMeters: membership.group.separationThresholdMeters || 10,
      isInvitationAccepted: membership.isInvitationAccepted,
      isLocationSharing: membership.isLocationSharing,
      consentGiven: membership.consentGiven,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept invitation and create a restricted tracking session (No login required)
// @route   POST /api/family-tracking/invite/:token/session
// @access  Public (Validated by invitation token)
const acceptInvitationAndStartSession = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { consentGiven = true } = req.body;

    if (!consentGiven) {
      res.status(400);
      throw new Error("Explicit location sharing consent is required.");
    }

    const tokenHash = FamilyMembership.hashToken(token.trim());
    const membership = await FamilyMembership.findOne({
      inviteTokenHash: tokenHash,
      status: "active",
    }).populate("group", "name separationThresholdMeters");

    if (!membership || !membership.group) {
      res.status(404);
      throw new Error("Invalid or revoked invitation link.");
    }

    if (membership.inviteExpiresAt && new Date(membership.inviteExpiresAt) < new Date()) {
      res.status(410);
      throw new Error("This invitation link has expired.");
    }

    // Generate restricted 64-character session token
    const rawSessionToken = crypto.randomBytes(32).toString("hex");
    const sessionTokenHash = FamilyMembership.hashToken(rawSessionToken);
    const sessionExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48-hour session

    membership.sessionTokenHash = sessionTokenHash;
    membership.sessionExpiresAt = sessionExpiresAt;
    membership.isInvitationAccepted = true;
    membership.consentGiven = true;
    membership.consentGivenAt = new Date();
    membership.isLocationSharing = true;
    await membership.save();

    res.status(200).json({
      success: true,
      message: "Tracking session initialized successfully.",
      sessionToken: rawSessionToken, // Restricted token stored in member's browser
      sessionExpiresAt,
      member: {
        id: membership._id,
        name: membership.name,
        relationship: membership.relationship,
      },
      group: {
        id: membership.group._id,
        name: membership.group.name,
        separationThresholdMeters: membership.group.separationThresholdMeters,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit GPS location via restricted member session token (No account needed)
// @route   POST /api/family-tracking/session/location
// @access  Restricted (Validated by x-tracking-session header)
const sessionSubmitLocation = async (req, res, next) => {
  try {
    const sessionToken = req.headers["x-tracking-session"];

    if (!sessionToken) {
      res.status(401);
      throw new Error("Missing tracking session token header (x-tracking-session).");
    }

    const sessionTokenHash = FamilyMembership.hashToken(sessionToken);
    const membership = await FamilyMembership.findOne({
      sessionTokenHash,
      status: "active",
    });

    if (!membership) {
      res.status(401);
      throw new Error("Invalid or revoked tracking session.");
    }

    if (membership.sessionExpiresAt && new Date(membership.sessionExpiresAt) < new Date()) {
      res.status(401);
      throw new Error("Tracking session expired. Please open your invitation link again.");
    }

    if (!membership.consentGiven) {
      res.status(403);
      throw new Error("Location sharing consent not granted.");
    }

    const {
      latitude,
      longitude,
      accuracy = 0,
      altitude = null,
      speed = null,
      heading = null,
      clientTimestamp,
      isSimulated = false,
    } = req.body;

    if (!membership.isLocationSharing) {
      membership.isLocationSharing = true;
      await membership.save();
    }

    const result = await processLocationUpdate({
      groupId: membership.group,
      membershipId: membership._id,
      userId: membership.user,
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: Number(accuracy) || 0,
      altitude: altitude !== null ? Number(altitude) : null,
      speed: speed !== null ? Number(speed) : null,
      heading: heading !== null ? Number(heading) : null,
      clientTimestamp: clientTimestamp ? new Date(clientTimestamp) : new Date(),
      isSimulated: Boolean(isSimulated),
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Stop location sharing via restricted member session token
// @route   POST /api/family-tracking/session/stop
// @access  Restricted (Validated by x-tracking-session header)
const sessionStopTracking = async (req, res, next) => {
  try {
    const sessionToken = req.headers["x-tracking-session"];

    if (!sessionToken) {
      res.status(401);
      throw new Error("Missing tracking session token header.");
    }

    const sessionTokenHash = FamilyMembership.hashToken(sessionToken);
    const membership = await FamilyMembership.findOne({
      sessionTokenHash,
      status: "active",
    });

    if (!membership) {
      res.status(401);
      throw new Error("Invalid or revoked tracking session.");
    }

    membership.isLocationSharing = false;
    membership.consecutiveSeparatedCount = 0;
    await membership.save();

    await MemberLocation.create({
      group: membership.group,
      membership: membership._id,
      user: membership.user,
      memberName: membership.name,
      latitude: 0,
      longitude: 0,
      accuracy: 0,
      status: "stopped",
      serverReceivedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Location sharing has been stopped.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tracking status for member's own session
// @route   GET /api/family-tracking/session/status
// @access  Restricted (Validated by x-tracking-session header)
const sessionGetStatus = async (req, res, next) => {
  try {
    const sessionToken = req.headers["x-tracking-session"];

    if (!sessionToken) {
      return res.status(401).json({ valid: false, message: "Missing tracking session token." });
    }

    const sessionTokenHash = FamilyMembership.hashToken(sessionToken);
    const membership = await FamilyMembership.findOne({
      sessionTokenHash,
      status: "active",
    }).populate("group", "name separationThresholdMeters");

    if (!membership || !membership.group) {
      return res.status(401).json({ valid: false, message: "Session expired or invalid." });
    }

    const latestLoc = await MemberLocation.findOne({
      group: membership.group._id,
      membership: membership._id,
    }).sort({ serverReceivedAt: -1 });

    res.status(200).json({
      valid: true,
      memberName: membership.name,
      relationship: membership.relationship,
      groupName: membership.group.name,
      separationThresholdMeters: membership.group.separationThresholdMeters,
      isLocationSharing: membership.isLocationSharing,
      consentGiven: membership.consentGiven,
      lastLocation: latestLoc
        ? {
            latitude: latestLoc.latitude,
            longitude: latestLoc.longitude,
            accuracy: latestLoc.accuracy,
            distanceFromMain: latestLoc.distanceFromMain,
            status: latestLoc.status,
            timestamp: latestLoc.serverReceivedAt,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tracking groups the user belongs to (Main user)
// @route   GET /api/family-tracking/groups/my-groups
// @access  Private (JWT User)
const getMyGroups = async (req, res, next) => {
  try {
    const memberships = await FamilyMembership.find({
      user: req.user._id,
      status: "active",
    }).populate("group");

    const activeGroups = [];

    for (const m of memberships) {
      if (m.group) {
        const memberCount = await FamilyMembership.countDocuments({
          group: m.group._id,
          status: "active",
        });

        const activeAlertCount = await SeparationAlert.countDocuments({
          group: m.group._id,
          status: "active",
        });

        activeGroups.push({
          group: m.group,
          membership: m,
          memberCount,
          activeAlertCount,
        });
      }
    }

    res.status(200).json({
      success: true,
      groups: activeGroups,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get group details and check authorization
// @route   GET /api/family-tracking/groups/:groupId
// @access  Private (JWT User)
const getGroupDetails = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const group = await FamilyGroup.findById(groupId).populate("creator", "name email phone");
    if (!group) {
      res.status(404);
      throw new Error("Family group not found.");
    }

    const membership = await FamilyMembership.findOne({
      group: groupId,
      user: req.user._id,
      status: "active",
    });

    if (!membership) {
      res.status(403);
      throw new Error("You are not authorized to access this family group.");
    }

    let pairedDevice = null;
    if (group.pairedDeviceId) {
      pairedDevice = await IoTDevice.findOne({ deviceId: group.pairedDeviceId }).select("-deviceTokenHash");
    }

    res.status(200).json({
      success: true,
      group,
      membership,
      pairedDevice,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all members of a group with their real-time location status
// @route   GET /api/family-tracking/groups/:groupId/members
// @access  Private (JWT User)
const getGroupMembers = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const group = await FamilyGroup.findById(groupId);
    if (!group) {
      res.status(404);
      throw new Error("Family group not found.");
    }

    // Verify requesting user is an active member or creator
    const userMembership = await FamilyMembership.findOne({
      group: groupId,
      user: req.user._id,
      status: "active",
    });

    if (!userMembership && String(group.creator) !== String(req.user._id)) {
      res.status(403);
      throw new Error("Not authorized to view members of this group.");
    }

    // Fetch all active group memberships
    const memberships = await FamilyMembership.find({
      group: groupId,
      status: { $in: ["active", "inactive"] },
    })
      .populate("user", "name email phone avatar")
      .populate("familyMember", "name relationship age gender phone bloodGroup profilePhoto");

    // Fetch latest location of the main user (creator)
    const mainLocation = await MemberLocation.findOne({
      group: groupId,
      user: group.creator,
    }).sort({ serverReceivedAt: -1 });

    const membersWithStatus = await Promise.all(
      memberships.map(async (m) => {
        // Query location by membership._id (or fallback user._id)
        const locQuery = {
          group: groupId,
          $or: [
            { membership: m._id },
            ...(m.user ? [{ user: m.user._id }] : []),
          ],
        };

        const latestLoc = await MemberLocation.findOne(locQuery).sort({ serverReceivedAt: -1 });

        const locationStatus = determineLocationStatus(
          latestLoc,
          group.locationFreshnessMinutes,
          m.isLocationSharing
        );

        let distanceMeters = null;
        let isSeparated = false;

        if (latestLoc && mainLocation && m.role !== "main") {
          distanceMeters = calculateHaversineDistance(
            mainLocation.latitude,
            mainLocation.longitude,
            latestLoc.latitude,
            latestLoc.longitude
          );
          if (distanceMeters !== null && distanceMeters > (group.separationThresholdMeters || 10)) {
            isSeparated = true;
          }
        }

        const isMain = m.role === "main" || (m.user && String(m.user._id) === String(group.creator));

        return {
          membershipId: m._id,
          familyMember: m.familyMember,
          familyMemberId: m.familyMember ? (m.familyMember._id || m.familyMember) : null,
          user: m.user,
          role: isMain ? "main" : "member",
          name: m.name || m.familyMember?.name || m.user?.name || "Family Member",
          relationship: m.relationship || m.familyMember?.relationship || "",
          isAccountUser: m.isAccountUser || Boolean(m.user),
          isInvitationAccepted: m.isInvitationAccepted,
          hasInviteLink: Boolean(m.inviteTokenHash),
          isLocationSharing: m.isLocationSharing,
          consentGiven: m.consentGiven,
          locationStatus,
          isSeparated,
          distanceMeters,
          lastLocation: latestLoc
            ? {
                latitude: latestLoc.latitude,
                longitude: latestLoc.longitude,
                accuracy: latestLoc.accuracy,
                timestamp: latestLoc.serverReceivedAt || latestLoc.clientTimestamp,
                isSimulated: latestLoc.isSimulated || false,
              }
            : null,
          joinedAt: m.joinedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      members: membersWithStatus,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update tracking group settings
// @route   PATCH /api/family-tracking/groups/:groupId/settings
// @access  Private (Main User / Creator only)
const updateGroupSettings = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const {
      name,
      separationThresholdMeters,
      locationFreshnessMinutes,
      consecutiveReadingsRequired,
      alertCooldownSeconds,
      isTrackingActive,
      pairedDeviceId,
    } = req.body;

    const group = await FamilyGroup.findById(groupId);
    if (!group) {
      res.status(404);
      throw new Error("Family group not found.");
    }

    if (String(group.creator) !== String(req.user._id)) {
      res.status(403);
      throw new Error("Only the family group creator can update tracking settings.");
    }

    if (name) group.name = name.trim();
    if (separationThresholdMeters !== undefined) {
      group.separationThresholdMeters = Number(separationThresholdMeters);
    }
    if (locationFreshnessMinutes !== undefined) {
      group.locationFreshnessMinutes = Number(locationFreshnessMinutes);
    }
    if (consecutiveReadingsRequired !== undefined) {
      group.consecutiveReadingsRequired = Number(consecutiveReadingsRequired);
    }
    if (alertCooldownSeconds !== undefined) {
      group.alertCooldownSeconds = Number(alertCooldownSeconds);
    }
    if (isTrackingActive !== undefined) {
      group.isTrackingActive = Boolean(isTrackingActive);
    }
    if (pairedDeviceId !== undefined) {
      group.pairedDeviceId = pairedDeviceId.trim().toUpperCase();
    }

    await group.save();

    res.status(200).json({
      success: true,
      message: "Group settings updated successfully.",
      group,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user location-sharing consent (Main user)
// @route   POST /api/family-tracking/tracking/consent
// @access  Private (JWT User)
const updateLocationConsent = async (req, res, next) => {
  try {
    const { groupId, consentGiven } = req.body;

    if (!groupId) {
      res.status(400);
      throw new Error("Group ID is required.");
    }

    const membership = await FamilyMembership.findOne({
      group: groupId,
      user: req.user._id,
      status: "active",
    });

    if (!membership) {
      res.status(404);
      throw new Error("Membership not found for this group.");
    }

    membership.consentGiven = Boolean(consentGiven);
    membership.consentGivenAt = consentGiven ? new Date() : null;
    if (!consentGiven) {
      membership.isLocationSharing = false;
    }
    await membership.save();

    res.status(200).json({
      success: true,
      message: consentGiven ? "Location sharing consent granted." : "Location sharing consent revoked.",
      membership,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start location sharing session (Main user)
// @route   POST /api/family-tracking/tracking/start
// @access  Private (JWT User)
const startTrackingSession = async (req, res, next) => {
  try {
    const { groupId } = req.body;

    const membership = await FamilyMembership.findOne({
      group: groupId,
      user: req.user._id,
      status: "active",
    });

    if (!membership) {
      res.status(404);
      throw new Error("Membership not found for this group.");
    }

    if (!membership.consentGiven) {
      res.status(400);
      throw new Error("Cannot start tracking without explicit location sharing consent.");
    }

    membership.isLocationSharing = true;
    await membership.save();

    res.status(200).json({
      success: true,
      message: "Location tracking session started.",
      membership,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Stop location sharing session (Main user)
// @route   POST /api/family-tracking/tracking/stop
// @access  Private (JWT User)
const stopTrackingSession = async (req, res, next) => {
  try {
    const { groupId } = req.body;

    const membership = await FamilyMembership.findOne({
      group: groupId,
      user: req.user._id,
      status: "active",
    });

    if (!membership) {
      res.status(404);
      throw new Error("Membership not found for this group.");
    }

    membership.isLocationSharing = false;
    membership.consecutiveSeparatedCount = 0;
    await membership.save();

    await MemberLocation.create({
      group: groupId,
      membership: membership._id,
      user: req.user._id,
      memberName: membership.name || "Main User",
      latitude: 0,
      longitude: 0,
      accuracy: 0,
      status: "stopped",
      serverReceivedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Location tracking session stopped.",
      membership,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit main user's current GPS location
// @route   POST /api/family-tracking/location
// @access  Private (JWT User)
const submitLocation = async (req, res, next) => {
  try {
    const {
      groupId,
      latitude,
      longitude,
      accuracy = 0,
      altitude = null,
      speed = null,
      heading = null,
      clientTimestamp,
      isSimulated = false,
    } = req.body;

    if (!groupId) {
      res.status(400);
      throw new Error("Group ID is required.");
    }

    const membership = await FamilyMembership.findOne({
      group: groupId,
      user: req.user._id,
      status: "active",
    });

    if (!membership) {
      res.status(403);
      throw new Error("You are not an active member of this group.");
    }

    if (!membership.consentGiven && !isSimulated) {
      res.status(403);
      throw new Error("Location sharing consent has not been granted.");
    }

    if (!membership.isLocationSharing) {
      membership.isLocationSharing = true;
      await membership.save();
    }

    const result = await processLocationUpdate({
      groupId,
      userId: req.user._id,
      membershipId: membership._id,
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: Number(accuracy) || 0,
      altitude: altitude !== null ? Number(altitude) : null,
      speed: speed !== null ? Number(speed) : null,
      heading: heading !== null ? Number(heading) : null,
      clientTimestamp: clientTimestamp ? new Date(clientTimestamp) : new Date(),
      isSimulated: Boolean(isSimulated),
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get latest locations for all members in a group
// @route   GET /api/family-tracking/groups/:groupId/locations
// @access  Private (JWT User)
const getGroupLocations = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const membership = await FamilyMembership.findOne({
      group: groupId,
      user: req.user._id,
      status: "active",
    });

    if (!membership) {
      res.status(403);
      throw new Error("Not authorized to view locations for this group.");
    }

    const group = await FamilyGroup.findById(groupId);
    const members = await FamilyMembership.find({ group: groupId, status: "active" });

    const locations = await Promise.all(
      members.map(async (m) => {
        const loc = await MemberLocation.findOne({
          group: groupId,
          $or: [
            { membership: m._id },
            ...(m.user ? [{ user: m.user }] : []),
          ],
        }).sort({ serverReceivedAt: -1 });

        const status = determineLocationStatus(
          loc,
          group.locationFreshnessMinutes,
          m.isLocationSharing
        );

        return {
          membershipId: m._id,
          name: m.name,
          role: m.role,
          status,
          isLocationSharing: m.isLocationSharing,
          location: loc,
        };
      })
    );

    res.status(200).json({
      success: true,
      locations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent separation alerts for a group
// @route   GET /api/family-tracking/groups/:groupId/alerts
// @access  Private (JWT User)
const getGroupAlerts = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const membership = await FamilyMembership.findOne({
      group: groupId,
      user: req.user._id,
      status: "active",
    });

    if (!membership) {
      res.status(403);
      throw new Error("Not authorized to view alerts for this group.");
    }

    const alerts = await SeparationAlert.find({ group: groupId })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("member", "name email phone avatar")
      .populate("mainUser", "name email");

    res.status(200).json({
      success: true,
      alerts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually resolve a separation alert
// @route   POST /api/family-tracking/alerts/:alertId/resolve
// @access  Private (JWT User)
const resolveAlert = async (req, res, next) => {
  try {
    const { alertId } = req.params;
    const { reason = "Resolved manually from dashboard" } = req.body;

    const alert = await SeparationAlert.findById(alertId);
    if (!alert) {
      res.status(404);
      throw new Error("Alert not found.");
    }

    alert.status = "resolved";
    alert.resolvedAt = new Date();
    alert.resolvedReason = reason;
    await alert.save();

    const memberQuery = alert.membership
      ? { _id: alert.membership }
      : { group: alert.group, user: alert.member };

    await FamilyMembership.updateOne(memberQuery, {
      $set: { consecutiveSeparatedCount: 0 },
    });

    res.status(200).json({
      success: true,
      message: "Alert marked as resolved.",
      alert,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// IOT ESP32 HARDWARE CONTROLLER ENDPOINTS
// ==========================================

// @desc    Register or pair an ESP32 device with a tracking group
// @route   POST /api/family-tracking/iot/register
// @access  Private (JWT User)
const registerIoTDevice = async (req, res, next) => {
  try {
    const { groupId, deviceId = "ESP32-TRACKER-01", name = "ESP32 DevKit V1 Buzzer" } = req.body;

    const cleanDeviceId = deviceId.trim().toUpperCase();

    if (!groupId) {
      res.status(400);
      throw new Error("Group ID is required to associate ESP32 device.");
    }

    const group = await FamilyGroup.findById(groupId);
    if (!group) {
      res.status(404);
      throw new Error("Family group not found.");
    }

    if (String(group.creator) !== String(req.user._id)) {
      res.status(403);
      throw new Error("Only the group creator can pair an ESP32 hardware device.");
    }

    const rawDeviceToken = crypto.randomBytes(16).toString("hex");
    const deviceTokenHash = IoTDevice.hashToken(rawDeviceToken);

    let device = await IoTDevice.findOne({ deviceId: cleanDeviceId });

    if (device) {
      device.deviceTokenHash = deviceTokenHash;
      device.group = group._id;
      device.registeredBy = req.user._id;
      device.name = name;
      device.status = "registered";
      device.lastHeartbeat = null;
      await device.save();
    } else {
      device = await IoTDevice.create({
        deviceId: cleanDeviceId,
        deviceTokenHash,
        group: group._id,
        registeredBy: req.user._id,
        name,
        status: "registered",
      });
    }

    group.pairedDeviceId = cleanDeviceId;
    await group.save();

    res.status(200).json({
      success: true,
      message: "ESP32 device registered and paired successfully.",
      deviceId: cleanDeviceId,
      deviceToken: rawDeviceToken,
      deviceInfo: {
        id: device._id,
        name: device.name,
        status: device.status,
        buzzerPin: device.buzzerPin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get paired ESP32 device status for a group
// @route   GET /api/family-tracking/iot/status/:groupId
// @access  Private (JWT User)
const getDeviceStatus = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const group = await FamilyGroup.findById(groupId);
    if (!group) {
      res.status(404);
      throw new Error("Family group not found.");
    }

    if (!group.pairedDeviceId) {
      return res.status(200).json({
        success: true,
        hasDevice: false,
        device: null,
      });
    }

    const device = await IoTDevice.findOne({ deviceId: group.pairedDeviceId }).select("-deviceTokenHash");

    if (!device) {
      return res.status(200).json({
        success: true,
        hasDevice: false,
        device: null,
      });
    }

    const now = Date.now();
    const lastSeen = device.lastHeartbeat ? new Date(device.lastHeartbeat).getTime() : 0;
    const isOnline = now - lastSeen <= 45000;

    res.status(200).json({
      success: true,
      hasDevice: true,
      isOnline,
      device: {
        ...device.toObject(),
        isOnline,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    ESP32 Heartbeat endpoint
// @route   POST /api/family-tracking/iot/heartbeat
// @access  Private (IoT Device Auth)
const iotHeartbeat = async (req, res, next) => {
  try {
    const { firmwareVersion, batteryLevel, ipAddress } = req.body;
    const device = req.device;

    device.lastHeartbeat = new Date();
    device.status = "online";
    if (firmwareVersion) device.firmwareVersion = firmwareVersion;
    if (batteryLevel !== undefined) device.batteryLevel = Number(batteryLevel);
    if (ipAddress) device.ipAddress = ipAddress;

    await device.save();

    res.status(200).json({
      success: true,
      message: "Heartbeat acknowledged.",
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    ESP32 Poll Pending Commands
// @route   GET /api/family-tracking/iot/commands
// @access  Private (IoT Device Auth)
const iotGetPendingCommands = async (req, res, next) => {
  try {
    const device = req.device;

    if (!device.group) {
      return res.status(200).json({
        hasCommand: false,
        command: "NONE",
        message: "Device is not yet paired to an active family group.",
      });
    }

    device.lastHeartbeat = new Date();
    device.status = "online";
    await device.save();

    const activeAlert = await SeparationAlert.findOne({
      group: device.group,
      status: "active",
    })
      .sort({ createdAt: -1 })
      .populate("member", "name");

    if (activeAlert) {
      const memberDisplayName =
        activeAlert.memberName || (activeAlert.member ? activeAlert.member.name : "Family Member");

      return res.status(200).json({
        hasCommand: true,
        command: "TRIGGER_BUZZER",
        alertId: activeAlert._id,
        severity: activeAlert.severity,
        buzzerPattern: activeAlert.buzzerPattern,
        distanceMeters: activeAlert.distanceMeters,
        thresholdMeters: activeAlert.thresholdMeters,
        memberName: memberDisplayName,
        timestamp: activeAlert.createdAt,
      });
    }

    return res.status(200).json({
      hasCommand: false,
      command: "NONE",
      status: "SAFE",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    ESP32 Acknowledge Command Delivery
// @route   POST /api/family-tracking/iot/acknowledge
// @access  Private (IoT Device Auth)
const iotAcknowledgeCommand = async (req, res, next) => {
  try {
    const { alertId } = req.body;

    if (!alertId) {
      res.status(400);
      throw new Error("Alert ID is required to acknowledge command.");
    }

    const alert = await SeparationAlert.findById(alertId);
    if (!alert) {
      res.status(404);
      throw new Error("Alert not found.");
    }

    alert.deviceCommandDelivered = true;
    alert.deviceAcknowledgedAt = new Date();
    alert.status = "acknowledged_by_device";
    await alert.save();

    res.status(200).json({
      success: true,
      message: "Command delivery acknowledged by ESP32.",
      alertId: alert._id,
      acknowledgedAt: alert.deviceAcknowledgedAt,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGroup,
  joinGroupByCode,
  getSavedFamilyMembers,
  addFamilyMember,
  regenerateMemberInvite,
  revokeMember,
  validateInvitation,
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
};
