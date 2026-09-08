const Journey = require("../models/Journey");
const PilgrimageCenter = require("../models/PilgrimageCenter");
const FamilyMember = require("../models/FamilyMember");
const User = require("../models/User");
const DoctorReview = require("../models/DoctorReview");

// @desc    Create a new journey plan
// @route   POST /api/journeys
// @access  Private (Authenticated User)
const createJourney = async (req, res, next) => {
  try {
    const {
      pilgrimageCenterId,
      journeyDate,
      returnDate,
      travelingFamilyMembers = [],
      travelingAlone = false,
      startLocation = {},
      transportMode,
      walkingLevel = "Moderate",
      budget = { type: "Moderate", amount: 0 },
      accommodationRequired = true,
      foodRequired = true,
      foodPreference = "No preference",
      searchRadius = 5,
      selectedServices = {},
    } = req.body;

    // 1. Basic validation
    if (!pilgrimageCenterId) {
      res.status(400);
      throw new Error("Pilgrimage center ID is required");
    }

    if (!journeyDate || !returnDate) {
      res.status(400);
      throw new Error("Journey start date and expected return date are required");
    }

    const startDateObj = new Date(journeyDate);
    const returnDateObj = new Date(returnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDateObj < today) {
      res.status(400);
      throw new Error("Journey start date cannot be in the past");
    }

    if (returnDateObj < startDateObj) {
      res.status(400);
      throw new Error("Return date cannot be earlier than start date");
    }

    if (!transportMode) {
      res.status(400);
      throw new Error("Mode of transport is required");
    }

    // 2. Verify pilgrimage center exists
    const center = await PilgrimageCenter.findById(pilgrimageCenterId);
    if (!center) {
      res.status(404);
      throw new Error("Selected Pilgrimage Center not found");
    }

    // 3. Medical Authorization & Doctor Approval Backend Enforcement
    const currentUser = await User.findById(req.user._id);
    if (currentUser && (currentUser.doctorApprovalStatus === "pending" || currentUser.psiRiskLevel === "High Risk")) {
      if (currentUser.doctorApprovalStatus === "pending" && !currentUser.responsibilityAccepted) {
        res.status(403);
        throw new Error(`Doctor approval is required for ${currentUser.name} (Main User) before creating a journey.`);
      }
      if (currentUser.doctorApprovalStatus === "rejected" && !currentUser.responsibilityAccepted) {
        res.status(403);
        throw new Error(`Travel request for ${currentUser.name} (Main User) was rejected by doctor. You must explicitly accept responsibility before continuing.`);
      }
    }

    // 4. Security check & Medical Risk check on selected family members
    let validFamilyMembers = [];
    if (!travelingAlone && Array.isArray(travelingFamilyMembers) && travelingFamilyMembers.length > 0) {
      const ownedMembers = await FamilyMember.find({
        _id: { $in: travelingFamilyMembers },
        user: req.user._id,
      });

      if (ownedMembers.length !== travelingFamilyMembers.length) {
        res.status(403);
        throw new Error("Unauthorized: One or more selected family members do not belong to your profile.");
      }

      // Check each family member for doctor approval status
      for (const fm of ownedMembers) {
        const isHighRiskFm = fm.aiRiskLevel === "HIGH_RISK" || fm.doctorApprovalStatus === "pending" || fm.doctorApprovalStatus === "rejected";
        if (isHighRiskFm) {
          if (fm.doctorApprovalStatus === "pending" && !fm.responsibilityAccepted) {
            res.status(403);
            throw new Error(`Doctor approval is required for family member ${fm.name} (${fm.relationship}) before creating a journey.`);
          }
          if (fm.doctorApprovalStatus === "rejected" && !fm.responsibilityAccepted) {
            res.status(403);
            throw new Error(`Travel request for family member ${fm.name} (${fm.relationship}) was rejected by doctor. You must explicitly accept responsibility before continuing.`);
          }
        }
      }

      validFamilyMembers = ownedMembers.map((m) => m._id);
    }

    // 4. Calculate total pilgrims (Logged in user + selected family members)
    const totalPilgrims = travelingAlone ? 1 : 1 + validFamilyMembers.length;

    // 5. Create journey document
    const journey = await Journey.create({
      userId: req.user._id,
      pilgrimageCenterId,
      journeyDate: startDateObj,
      returnDate: returnDateObj,
      travelingFamilyMembers: validFamilyMembers,
      totalPilgrims,
      travelingAlone,
      startLocation,
      transportMode,
      walkingLevel,
      budget,
      accommodationRequired,
      foodRequired,
      foodPreference,
      searchRadius,
      selectedServices,
      status: "planned",
    });

    // Populate references for response
    const populatedJourney = await Journey.findById(journey._id)
      .populate("pilgrimageCenterId")
      .populate("travelingFamilyMembers");

    res.status(201).json({
      success: true,
      message: "Journey planned and saved successfully!",
      journey: populatedJourney,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's journeys
// @route   GET /api/journeys/user/my-journeys
// @access  Private
const getMyJourneys = async (req, res, next) => {
  try {
    const journeys = await Journey.find({ userId: req.user._id })
      .populate("pilgrimageCenterId")
      .populate("travelingFamilyMembers")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: journeys.length,
      journeys,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all journeys (for Admin or system view)
// @route   GET /api/journeys
// @access  Private / Admin
const getJourneys = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role !== "admin") {
      query.userId = req.user._id;
    }

    const journeys = await Journey.find(query)
      .populate("userId", "name email phone")
      .populate("pilgrimageCenterId")
      .populate("travelingFamilyMembers")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: journeys.length,
      journeys,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single journey details by ID
// @route   GET /api/journeys/:id
// @access  Private
const getJourneyById = async (req, res, next) => {
  try {
    const journey = await Journey.findById(req.params.id)
      .populate("userId", "name email phone location")
      .populate("pilgrimageCenterId")
      .populate("travelingFamilyMembers");

    if (!journey) {
      res.status(404);
      throw new Error("Journey record not found");
    }

    // Verify ownership or admin access
    if (journey.userId._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      res.status(403);
      throw new Error("Unauthorized: You do not have permission to view this journey.");
    }

    res.status(200).json({
      success: true,
      journey,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update journey details
// @route   PUT /api/journeys/:id
// @access  Private
const updateJourney = async (req, res, next) => {
  try {
    const journey = await Journey.findById(req.params.id);

    if (!journey) {
      res.status(404);
      throw new Error("Journey record not found");
    }

    // Ownership check
    if (journey.userId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      res.status(403);
      throw new Error("Unauthorized: You do not have permission to edit this journey.");
    }

    const {
      journeyDate,
      returnDate,
      travelingFamilyMembers = [],
      travelingAlone = false,
      startLocation,
      transportMode,
      walkingLevel,
      budget,
      accommodationRequired,
      foodRequired,
      foodPreference,
      searchRadius,
      selectedServices,
      status,
    } = req.body;

    if (journeyDate) journey.journeyDate = new Date(journeyDate);
    if (returnDate) journey.returnDate = new Date(returnDate);

    if (travelingFamilyMembers !== undefined) {
      if (!travelingAlone && Array.isArray(travelingFamilyMembers) && travelingFamilyMembers.length > 0) {
        const ownedMembers = await FamilyMember.find({
          _id: { $in: travelingFamilyMembers },
          user: req.user._id,
        });
        if (ownedMembers.length !== travelingFamilyMembers.length) {
          res.status(403);
          throw new Error("Unauthorized: One or more selected family members do not belong to your profile.");
        }
        journey.travelingFamilyMembers = ownedMembers.map((m) => m._id);
      } else {
        journey.travelingFamilyMembers = [];
      }
    }

    if (travelingAlone !== undefined) journey.travelingAlone = travelingAlone;
    journey.totalPilgrims = journey.travelingAlone ? 1 : 1 + journey.travelingFamilyMembers.length;

    if (startLocation) journey.startLocation = startLocation;
    if (transportMode) journey.transportMode = transportMode;
    if (walkingLevel) journey.walkingLevel = walkingLevel;
    if (budget) journey.budget = budget;
    if (accommodationRequired !== undefined) journey.accommodationRequired = accommodationRequired;
    if (foodRequired !== undefined) journey.foodRequired = foodRequired;
    if (foodPreference) journey.foodPreference = foodPreference;
    if (searchRadius) journey.searchRadius = searchRadius;
    if (selectedServices) journey.selectedServices = selectedServices;
    if (status) journey.status = status;

    await journey.save();

    const updatedJourney = await Journey.findById(journey._id)
      .populate("pilgrimageCenterId")
      .populate("travelingFamilyMembers");

    res.status(200).json({
      success: true,
      message: "Journey updated successfully!",
      journey: updatedJourney,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Cancel journey
// @route   DELETE /api/journeys/:id
// @access  Private
const deleteJourney = async (req, res, next) => {
  try {
    const journey = await Journey.findById(req.params.id);

    if (!journey) {
      res.status(404);
      throw new Error("Journey record not found");
    }

    if (journey.userId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      res.status(403);
      throw new Error("Unauthorized: You do not have permission to delete this journey.");
    }

    await journey.deleteOne();

    res.status(200).json({
      success: true,
      message: "Journey plan removed successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept responsibility for high risk travel
// @route   POST /api/journeys/accept-responsibility
// @access  Private (Authenticated User)
const acceptResponsibility = async (req, res, next) => {
  try {
    const { personType = "user", familyMemberId } = req.body;

    const now = new Date();

    if (personType === "family_member" && familyMemberId) {
      const familyMember = await FamilyMember.findOne({ _id: familyMemberId, user: req.user._id });
      if (!familyMember) {
        res.status(404);
        throw new Error("Family member not found.");
      }
      familyMember.responsibilityAccepted = true;
      familyMember.responsibilityAcceptedAt = now;
      await familyMember.save();

      await DoctorReview.updateMany(
        { userId: req.user._id, familyMemberId },
        { responsibilityAccepted: true, responsibilityAcceptedAt: now }
      );

      return res.status(200).json({
        success: true,
        message: `Responsibility accepted for family member ${familyMember.name}.`,
        personType: "family_member",
        personName: familyMember.name,
      });
    } else {
      const user = await User.findById(req.user._id);
      if (!user) {
        res.status(404);
        throw new Error("User profile not found.");
      }
      user.responsibilityAccepted = true;
      user.responsibilityAcceptedAt = now;
      await user.save();

      await DoctorReview.updateMany(
        { userId: req.user._id, personType: "user" },
        { responsibilityAccepted: true, responsibilityAcceptedAt: now }
      );

      return res.status(200).json({
        success: true,
        message: `Responsibility accepted for main user ${user.name}.`,
        personType: "user",
        personName: user.name,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Start / Activate a journey (or fetch existing active journey)
// @route   POST /api/journeys/start
// @access  Private (Authenticated User)
const startJourney = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { journeyId } = req.body;

    // Check if an active/in-progress journey already exists for this user
    let activeJourney = await Journey.findOne({
      userId,
      status: { $in: ["IN_PROGRESS", "PAUSED", "active"] },
    })
      .populate("pilgrimageCenterId")
      .populate("travelingFamilyMembers");

    // If active journey exists and matches requested or no specific ID requested, return it
    if (activeJourney && (!journeyId || activeJourney._id.toString() === journeyId)) {
      return res.status(200).json({
        success: true,
        message: "Active journey retrieved.",
        journey: activeJourney,
      });
    }

    let targetJourney;
    if (journeyId) {
      targetJourney = await Journey.findById(journeyId);
      if (!targetJourney || targetJourney.userId.toString() !== userId.toString()) {
        res.status(404);
        throw new Error("Journey plan not found or unauthorized.");
      }
    } else {
      // Find latest planned journey
      targetJourney = await Journey.findOne({ userId, status: { $in: ["planned", "ready", "NOT_STARTED"] } })
        .sort({ createdAt: -1 });
    }

    if (!targetJourney) {
      res.status(404);
      throw new Error("No planned journey found to start. Please plan a journey first.");
    }

    // Load center details for destination coordinates
    const center = await PilgrimageCenter.findById(targetJourney.pilgrimageCenterId);
    if (!center) {
      res.status(404);
      throw new Error("Pilgrimage center details not found.");
    }

    const startLat = targetJourney.startLocation?.latitude || 8.5241;
    const startLng = targetJourney.startLocation?.longitude || 76.9366;
    const destLat = center.location?.latitude || 9.4344;
    const destLng = center.location?.longitude || 77.0811;

    // Calculate approximate initial distance
    const rad = (x) => (x * Math.PI) / 180;
    const R = 6371;
    const dLat = rad(destLat - startLat);
    const dLon = rad(destLng - startLng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rad(startLat)) * Math.cos(rad(destLat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = Math.round(R * c * 10) / 10 || 10.0;

    targetJourney.status = "IN_PROGRESS";
    targetJourney.startedAt = targetJourney.startedAt || new Date();
    targetJourney.startCoordinates = { latitude: startLat, longitude: startLng };
    targetJourney.destinationCoordinates = { latitude: destLat, longitude: destLng };
    targetJourney.currentLocation = {
      address: targetJourney.startLocation?.address || `${startLat.toFixed(4)}, ${startLng.toFixed(4)}`,
      city: targetJourney.startLocation?.city || center.location?.city || "",
      state: targetJourney.startLocation?.state || center.location?.state || "",
      latitude: startLat,
      longitude: startLng,
      updatedAt: new Date(),
    };
    targetJourney.totalDistance = distanceKm;
    targetJourney.distanceTravelled = 0;
    targetJourney.distanceRemaining = distanceKm;
    targetJourney.progressPercentage = 0;
    targetJourney.estimatedArrivalTime = `${Math.round(distanceKm * 2)} minutes`;

    await targetJourney.save();

    const populated = await Journey.findById(targetJourney._id)
      .populate("pilgrimageCenterId")
      .populate("travelingFamilyMembers");

    res.status(200).json({
      success: true,
      message: "Journey started successfully!",
      journey: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently active journey for authenticated user
// @route   GET /api/journeys/active
// @access  Private
const getActiveJourney = async (req, res, next) => {
  try {
    const activeJourney = await Journey.findOne({
      userId: req.user._id,
      status: { $in: ["IN_PROGRESS", "PAUSED", "active"] },
    })
      .populate("pilgrimageCenterId")
      .populate("travelingFamilyMembers");

    if (!activeJourney) {
      return res.status(200).json({
        success: true,
        active: false,
        journey: null,
        message: "No active journey found.",
      });
    }

    res.status(200).json({
      success: true,
      active: true,
      journey: activeJourney,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update journey live location & calculate progress
// @route   PATCH /api/journeys/:id/location
// @access  Private
const updateJourneyLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, address, city, state, distanceTravelled, distanceRemaining, progressPercentage, estimatedArrivalTime } = req.body;

    const journey = await Journey.findById(req.params.id);
    if (!journey) {
      res.status(404);
      throw new Error("Journey not found.");
    }

    if (journey.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Unauthorized access to this journey.");
    }

    const now = new Date();
    journey.currentLocation = {
      address: address || journey.currentLocation?.address || `${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}`,
      city: city || journey.currentLocation?.city || "",
      state: state || journey.currentLocation?.state || "",
      latitude: latitude !== undefined ? latitude : journey.currentLocation?.latitude,
      longitude: longitude !== undefined ? longitude : journey.currentLocation?.longitude,
      updatedAt: now,
    };

    if (distanceTravelled !== undefined) {
      journey.distanceTravelled = Math.max(0, Math.round(distanceTravelled * 10) / 10);
    }
    if (distanceRemaining !== undefined) {
      journey.distanceRemaining = Math.max(0, Math.round(distanceRemaining * 10) / 10);
    }
    if (progressPercentage !== undefined) {
      journey.progressPercentage = Math.min(100, Math.max(0, Math.round(progressPercentage)));
    }
    if (estimatedArrivalTime) {
      journey.estimatedArrivalTime = estimatedArrivalTime;
    }

    journey.locationUpdateCount = (journey.locationUpdateCount || 0) + 1;
    await journey.save();

    res.status(200).json({
      success: true,
      message: "Location and progress updated.",
      journey,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update journey status (PAUSED, IN_PROGRESS, CANCELLED)
// @route   PATCH /api/journeys/:id/status
// @access  Private
const updateJourneyStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ["IN_PROGRESS", "PAUSED", "CANCELLED", "COMPLETED"];
    if (!status || !allowed.includes(status)) {
      res.status(400);
      throw new Error("Invalid status update.");
    }

    const journey = await Journey.findById(req.params.id);
    if (!journey) {
      res.status(404);
      throw new Error("Journey record not found.");
    }

    if (journey.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Unauthorized.");
    }

    journey.status = status;
    if (status === "PAUSED") {
      journey.pausedAt = new Date();
    } else if (status === "COMPLETED") {
      journey.completedAt = new Date();
      journey.progressPercentage = 100;
      journey.distanceRemaining = 0;
    }
    await journey.save();

    res.status(200).json({
      success: true,
      message: `Journey status updated to ${status}.`,
      journey,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get journey live progress summary
// @route   GET /api/journeys/:id/progress
// @access  Private
const getJourneyProgress = async (req, res, next) => {
  try {
    const journey = await Journey.findById(req.params.id)
      .populate("pilgrimageCenterId")
      .populate("travelingFamilyMembers");

    if (!journey) {
      res.status(404);
      throw new Error("Journey not found.");
    }

    if (journey.userId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      res.status(403);
      throw new Error("Unauthorized.");
    }

    res.status(200).json({
      success: true,
      progress: {
        journeyId: journey._id,
        status: journey.status,
        currentLocation: journey.currentLocation,
        startCoordinates: journey.startCoordinates,
        destinationCoordinates: journey.destinationCoordinates,
        totalDistance: journey.totalDistance,
        distanceTravelled: journey.distanceTravelled,
        distanceRemaining: journey.distanceRemaining,
        progressPercentage: journey.progressPercentage,
        estimatedArrivalTime: journey.estimatedArrivalTime,
        locationUpdateCount: journey.locationUpdateCount,
        startedAt: journey.startedAt,
        completedAt: journey.completedAt,
      },
      journey,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark active journey as completed
// @route   POST /api/journeys/:id/complete
// @access  Private
const completeJourney = async (req, res, next) => {
  try {
    const journey = await Journey.findById(req.params.id);
    if (!journey) {
      res.status(404);
      throw new Error("Journey record not found.");
    }

    if (journey.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Unauthorized.");
    }

    journey.status = "COMPLETED";
    journey.completedAt = new Date();
    journey.progressPercentage = 100;
    journey.distanceRemaining = 0;
    journey.distanceTravelled = journey.totalDistance || journey.distanceTravelled;

    await journey.save();

    const populated = await Journey.findById(journey._id)
      .populate("pilgrimageCenterId")
      .populate("travelingFamilyMembers");

    res.status(200).json({
      success: true,
      message: "🎉 Pilgrimage journey completed successfully!",
      journey: populated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJourney,
  getJourneys,
  getMyJourneys,
  getJourneyById,
  updateJourney,
  deleteJourney,
  acceptResponsibility,
  startJourney,
  getActiveJourney,
  updateJourneyLocation,
  updateJourneyStatus,
  getJourneyProgress,
  completeJourney,
};
