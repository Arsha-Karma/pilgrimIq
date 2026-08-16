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

module.exports = {
  createJourney,
  getJourneys,
  getMyJourneys,
  getJourneyById,
  updateJourney,
  deleteJourney,
  acceptResponsibility,
};
