const Journey = require("../models/Journey");
const PilgrimageCenter = require("../models/PilgrimageCenter");
const FamilyMember = require("../models/FamilyMember");
const User = require("../models/User");
const DoctorReview = require("../models/DoctorReview");
const AccommodationBooking = require("../models/AccommodationBooking");

// Active journey statuses that occupy scheduling dates & centres and block duplicate/overlapping bookings
const ACTIVE_JOURNEY_STATUSES = [
  "planned",
  "PLANNED",
  "scheduled",
  "SCHEDULED",
  "confirmed",
  "CONFIRMED",
  "ready",
  "READY",
  "active",
  "ACTIVE",
  "NOT_STARTED",
  "IN_PROGRESS",
  "PAUSED",
];

// Unstarted statuses eligible for expiration when journey start date passes
// NEVER includes in-progress (IN_PROGRESS, active, PAUSED), completed, or cancelled journeys
const UNSTARTED_EXPIRABLE_STATUSES = [
  "planned",
  "PLANNED",
  "scheduled",
  "SCHEDULED",
  "confirmed",
  "CONFIRMED",
  "ready",
  "READY",
  "NOT_STARTED",
];

// Consistent timezone-safe date-only normalization (UTC midnight)
const normalizeDateOnly = (dateInput) => {
  if (!dateInput) return null;
  if (typeof dateInput === "string") {
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    }
  }
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
};

const getEndOfDayUTC = (dateInput) => {
  const d = normalizeDateOnly(dateInput);
  if (!d) return null;
  d.setUTCHours(23, 59, 59, 999);
  return d;
};

const formatJourneyDateDisplay = (dateInput) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Automatically mark unstarted journeys whose date has passed as EXPIRED (preserves history)
// Explicitly protects IN_PROGRESS, active, PAUSED, completed, and cancelled journeys
const syncExpiredJourneys = async (userId = null) => {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayStart = normalizeDateOnly(todayStr);

    const query = {
      status: { $in: UNSTARTED_EXPIRABLE_STATUSES },
      journeyDate: { $lt: todayStart },
    };
    if (userId) {
      query.userId = userId;
    }

    await Journey.updateMany(query, {
      $set: { status: "EXPIRED" },
    });
  } catch (err) {
    console.error("Error syncing expired journeys:", err.message);
  }
};

// Concurrency-safe per-user locking to prevent simultaneous booking race conditions
const userBookingLocks = new Map();

const acquireUserLock = async (userId) => {
  const key = userId ? userId.toString() : "global";
  while (userBookingLocks.has(key)) {
    await userBookingLocks.get(key);
  }
  let unlock;
  const promise = new Promise((resolve) => {
    unlock = resolve;
  });
  userBookingLocks.set(key, promise);
  return () => {
    userBookingLocks.delete(key);
    unlock();
  };
};

// @desc    Create a new journey plan
// @route   POST /api/journeys
// @access  Private (Authenticated User)
const createJourney = async (req, res, next) => {
  let releaseLock;
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

    const startDateObj = normalizeDateOnly(journeyDate);
    const returnDateObj = normalizeDateOnly(returnDate);
    const returnDateEndObj = getEndOfDayUTC(returnDate);

    const todayStr = new Date().toISOString().split("T")[0];
    const todayStart = normalizeDateOnly(todayStr);

    if (startDateObj < todayStart) {
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

    // Acquire lock for this user to ensure concurrent requests are processed sequentially
    releaseLock = await acquireUserLock(req.user._id);

    // Sync expired journeys so passed dates don't block
    await syncExpiredJourneys(req.user._id);

    // 2. Prevent Duplicate Scheduling for the Same Centre (Same centre, different dates)
    const existingCentreJourney = await Journey.findOne({
      userId: req.user._id,
      pilgrimageCenterId,
      status: { $in: ACTIVE_JOURNEY_STATUSES },
    }).populate("pilgrimageCenterId");

    if (existingCentreJourney) {
      const formattedDate = formatJourneyDateDisplay(existingCentreJourney.journeyDate);
      return res.status(409).json({
        success: false,
        conflictType: "DUPLICATE_CENTRE",
        message: `A journey to this pilgrimage centre is already scheduled for ${formattedDate}. Would you like to reschedule it?`,
        existingJourney: existingCentreJourney,
      });
    }

    // 3. Prevent Overlapping Journey Dates (Same date, different centres or any centre)
    const dateConflictJourney = await Journey.findOne({
      userId: req.user._id,
      status: { $in: ACTIVE_JOURNEY_STATUSES },
      journeyDate: { $lte: returnDateEndObj },
      returnDate: { $gte: startDateObj },
    }).populate("pilgrimageCenterId");

    if (dateConflictJourney) {
      return res.status(409).json({
        success: false,
        conflictType: "DATE_CONFLICT",
        message: "You already have a journey scheduled for this date. Please choose another date or reschedule your existing journey.",
        conflictingJourney: dateConflictJourney,
      });
    }

    // 4. Verify pilgrimage center exists
    const center = await PilgrimageCenter.findById(pilgrimageCenterId);
    if (!center) {
      res.status(404);
      throw new Error("Selected Pilgrimage Center not found");
    }

    // 5. Medical Authorization & Doctor Approval Backend Enforcement
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

    // 6. Security check & Medical Risk check on selected family members
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

    // 7. Calculate total pilgrims (Logged in user + selected family members)
    const totalPilgrims = travelingAlone ? 1 : 1 + validFamilyMembers.length;

    // 8. Create journey document
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

    // Automatically calculate & persist Travel Assessment PSI for newly selected pilgrimage center
    try {
      const { calculateJourneyPsi } = require("../services/psiService");
      await calculateJourneyPsi(journey._id, req.user._id, true);
    } catch (psiErr) {
      console.warn("Auto PSI calculation warning on journey creation:", psiErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Journey planned and saved successfully!",
      journey: populatedJourney,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        conflictType: "DUPLICATE_CENTRE",
        message: "An active journey to this pilgrimage centre is already scheduled. Would you like to reschedule it?",
      });
    }
    next(error);
  } finally {
    if (releaseLock) releaseLock();
  }
};

// @desc    Get logged in user's journeys
// @route   GET /api/journeys/user/my-journeys
// @access  Private
const getMyJourneys = async (req, res, next) => {
  try {
    await syncExpiredJourneys(req.user._id);

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
    if (req.user.role !== "admin") {
      await syncExpiredJourneys(req.user._id);
    } else {
      await syncExpiredJourneys();
    }

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
    await syncExpiredJourneys(req.user._id);

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

// @desc    Update journey details (Reschedule Journey)
// @route   PUT /api/journeys/:id
// @access  Private
const updateJourney = async (req, res, next) => {
  let releaseLock;
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

    // Prevent modifying completed or cancelled journeys
    if (journey.status === "completed" || journey.status === "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "Cannot reschedule a completed journey.",
      });
    }

    if (journey.status === "cancelled" || journey.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Cannot reschedule a cancelled journey. Please plan a new journey instead.",
      });
    }

    releaseLock = await acquireUserLock(req.user._id);
    await syncExpiredJourneys(req.user._id);

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

    const todayStr = new Date().toISOString().split("T")[0];
    const todayStart = normalizeDateOnly(todayStr);

    let newStartDate = journey.journeyDate;
    let newReturnDate = journey.returnDate;

    if (journeyDate) {
      newStartDate = normalizeDateOnly(journeyDate);
      if (newStartDate < todayStart) {
        res.status(400);
        throw new Error("Journey start date cannot be in the past");
      }
    }

    if (returnDate) {
      newReturnDate = normalizeDateOnly(returnDate);
    }

    if (newReturnDate < newStartDate) {
      res.status(400);
      throw new Error("Return date cannot be earlier than start date");
    }

    const newReturnDateEnd = getEndOfDayUTC(newReturnDate);

    // Validate new dates against all other active journeys of this user (excluding this journey)
    const dateConflictJourney = await Journey.findOne({
      _id: { $ne: journey._id },
      userId: req.user._id,
      status: { $in: ACTIVE_JOURNEY_STATUSES },
      journeyDate: { $lte: newReturnDateEnd },
      returnDate: { $gte: newStartDate },
    }).populate("pilgrimageCenterId");

    if (dateConflictJourney) {
      return res.status(409).json({
        success: false,
        conflictType: "DATE_CONFLICT",
        message: "You already have a journey scheduled for this date. Please choose another date or reschedule your existing journey.",
        conflictingJourney: dateConflictJourney,
      });
    }

    // Validate duplicate centre check against all OTHER active journeys
    const centreConflict = await Journey.findOne({
      _id: { $ne: journey._id },
      userId: req.user._id,
      pilgrimageCenterId: journey.pilgrimageCenterId,
      status: { $in: ACTIVE_JOURNEY_STATUSES },
    }).populate("pilgrimageCenterId");

    if (centreConflict) {
      return res.status(409).json({
        success: false,
        conflictType: "DUPLICATE_CENTRE",
        message: "Another active journey to this pilgrimage centre already exists.",
        conflictingJourney: centreConflict,
      });
    }

    journey.journeyDate = newStartDate;
    journey.returnDate = newReturnDate;

    // If journey was previously marked EXPIRED, reset to planned upon valid reschedule
    if (journey.status === "EXPIRED" || journey.status === "expired") {
      journey.status = "planned";
    }

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
    if (status && status !== "EXPIRED") journey.status = status;

    await journey.save();

    // Recalculate or refresh travel assessment data for the rescheduled journey
    try {
      const { calculateJourneyPsi } = require("../services/psiService");
      await calculateJourneyPsi(journey._id, req.user._id, true);
    } catch (psiErr) {
      console.warn("Auto PSI calculation warning on journey reschedule:", psiErr.message);
    }

    const updatedJourney = await Journey.findById(journey._id)
      .populate("pilgrimageCenterId")
      .populate("travelingFamilyMembers");

    res.status(200).json({
      success: true,
      message: "Journey rescheduled and updated successfully!",
      journey: updatedJourney,
    });
  } catch (error) {
    next(error);
  } finally {
    if (releaseLock) releaseLock();
  }
};

// @desc    Cancel journey booking (Preserves record in history, releases date & centre)
// @route   DELETE /api/journeys/:id
// @route   POST /api/journeys/:id/cancel
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
      throw new Error("Unauthorized: You do not have permission to cancel this journey.");
    }

    if (journey.status === "completed" || journey.status === "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a pilgrimage journey that has already been completed.",
      });
    }

    if (journey.status === "cancelled" || journey.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "This journey booking has already been cancelled.",
      });
    }

    // Process cancellations for accommodation bookings associated with this journey
    try {
      const associatedBookings = await AccommodationBooking.find({
        journeyId: journey._id,
        bookingStatus: { $ne: "CANCELLED" },
      });

      for (const b of associatedBookings) {
        const checkInTime = new Date(b.checkInDate).getTime();
        const hoursUntilCheckIn = (checkInTime - Date.now()) / (1000 * 60 * 60);
        const totalPaid = b.paymentStatus === "PAID" ? b.pricing.totalAmount : 0;
        let refundAmount = 0;
        let cancellationFee = 0;

        if (totalPaid > 0) {
          if (hoursUntilCheckIn >= 24) {
            refundAmount = totalPaid;
            cancellationFee = 0;
          } else if (hoursUntilCheckIn > 0 && hoursUntilCheckIn < 24) {
            cancellationFee = Math.round(totalPaid * 0.5);
            refundAmount = totalPaid - cancellationFee;
          } else {
            cancellationFee = totalPaid;
            refundAmount = 0;
          }
        }

        b.bookingStatus = "CANCELLED";
        b.cancelledAt = new Date();
        b.cancellationReason = "Journey itinerary cancelled by user";
        if (refundAmount > 0) {
          b.refundStatus = "REFUNDED";
          b.refundDetails = {
            refundId: `SIM_REF_${Date.now().toString().slice(-8)}`,
            amount: refundAmount,
            cancellationFee,
            refundReason: "Journey cancelled by user",
            refundType: "SIMULATED",
            refundedAt: new Date(),
          };
        }
        await b.save();
      }
    } catch (bookingErr) {
      console.warn("Notice: Error cancelling associated accommodation bookings on journey cancellation:", bookingErr.message);
    }

    // Retain booking record in database & journey history with CANCELLED status
    journey.status = "CANCELLED";
    journey.cancelledAt = new Date();
    await journey.save();

    res.status(200).json({
      success: true,
      message: "Journey booking cancelled successfully.",
      journey,
    });
  } catch (error) {
    next(error);
  }
};

const cancelJourney = deleteJourney;

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

    // If active journey exists and matches requested or no specific ID requested, activate and return it
    if (activeJourney && (!journeyId || activeJourney._id.toString() === journeyId)) {
      if (!activeJourney.startedAt) {
        activeJourney.startedAt = new Date();
      }
      activeJourney.status = "IN_PROGRESS";
      await activeJourney.save();
      return res.status(200).json({
        success: true,
        message: "Journey started and live tracking active.",
        journey: activeJourney,
      });
    }

    await syncExpiredJourneys(userId);

    let targetJourney;
    if (journeyId) {
      targetJourney = await Journey.findById(journeyId);
      if (!targetJourney || targetJourney.userId.toString() !== userId.toString()) {
        res.status(404);
        throw new Error("Journey plan not found or unauthorized.");
      }
      if (targetJourney.status === "EXPIRED" || targetJourney.status === "expired") {
        res.status(400);
        throw new Error("This planned journey has expired. Please plan a new journey.");
      }
      if (targetJourney.status === "CANCELLED" || targetJourney.status === "cancelled") {
        res.status(400);
        throw new Error("This journey plan has been cancelled.");
      }
    } else {
      // Find latest planned journey
      targetJourney = await Journey.findOne({
        userId,
        status: { $in: ["PLANNED", "SCHEDULED", "CONFIRMED", "planned", "ready", "NOT_STARTED"] }
      }).sort({ journeyDate: 1, createdAt: -1 });
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
    let activeJourney = await Journey.findOne({
      userId: req.user._id,
      status: { $in: ["IN_PROGRESS", "PAUSED", "active"] },
    })
      .populate("pilgrimageCenterId")
      .populate("travelingFamilyMembers");

    // If no in-progress journey exists, check for upcoming planned/scheduled journey
    if (!activeJourney) {
      activeJourney = await Journey.findOne({
        userId: req.user._id,
        status: { $in: ["PLANNED", "SCHEDULED", "CONFIRMED", "planned", "ready", "NOT_STARTED"] },
      })
        .sort({ journeyDate: 1, createdAt: -1 })
        .populate("pilgrimageCenterId")
        .populate("travelingFamilyMembers");
    }

    if (!activeJourney) {
      return res.status(200).json({
        success: true,
        active: false,
        journey: null,
        message: "No active or planned journey found.",
      });
    }

    res.status(200).json({
      success: true,
      active: ["IN_PROGRESS", "PAUSED", "active"].includes(activeJourney.status),
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

// @desc    Get selected Google Maps recommendations for a specific journey ID (No booking/price concepts & Transport excluded)
// @route   GET /api/journeys/:id/bookings
// @access  Private (Authenticated User)
const getJourneyBookings = async (req, res, next) => {
  try {
    const journey = await Journey.findById(req.params.id)
      .populate("pilgrimageCenterId")
      .populate("travelingFamilyMembers");

    if (!journey) {
      res.status(404);
      throw new Error("Journey record not found");
    }

    // Authorization Check: Must belong to authenticated user (or admin)
    if (journey.userId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      res.status(403);
      throw new Error("Unauthorized access: You do not have permission to view recommendations for this journey.");
    }

    const center = journey.pilgrimageCenterId || {};
    const services = journey.selectedServices || {};

    // Helper function to sanitize contact phone
    const formatPhone = (p1, p2, p3) => {
      const raw = p1 || p2 || p3;
      if (!raw || typeof raw !== "string") return "Not available";
      const trimmed = raw.trim();
      if (!trimmed || trimmed.toLowerCase().includes("not available") || trimmed.toLowerCase().includes("not specified")) {
        return "Not available";
      }
      return trimmed;
    };

    // Helper function to build full address
    const formatAddress = (placeName, rawAddr, distKm) => {
      const centerName = center.name || "Pilgrimage Center";
      const city = center.location?.city || "";
      const state = center.location?.state || "";

      if (!rawAddr || typeof rawAddr !== "string" || rawAddr.startsWith("Located ") || rawAddr.toLowerCase().includes("not available")) {
        const distStr = distKm ? `${distKm} km from ${centerName}` : `Near ${centerName}`;
        return [placeName, distStr, city, state].filter(Boolean).join(", ");
      }

      // If address is short without city/state, append center city/state if missing
      let full = rawAddr.trim();
      if (city && !full.toLowerCase().includes(city.toLowerCase())) {
        full += `, ${city}`;
      }
      if (state && !full.toLowerCase().includes(state.toLowerCase())) {
        full += `, ${state}`;
      }
      return full;
    };

    // Helper function to build Google Maps Link
    const formatGoogleMapUrl = (place) => {
      if (place.googleMapLink && place.googleMapLink.startsWith("http")) {
        return place.googleMapLink;
      }
      if (place.externalPlaceId && place.externalPlaceId.startsWith("google-")) {
        const pId = place.externalPlaceId.replace("google-", "");
        return `https://www.google.com/maps/place/?q=place_id:${pId}`;
      }
      if (place.latitude && place.longitude) {
        return `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
      }
      const q = encodeURIComponent(`${place.name || ""} ${center.name || ""} ${center.location?.city || ""}`);
      return `https://www.google.com/maps/search/?api=1&query=${q}`;
    };

    // 1. SELECTED ACCOMMODATION (Google Maps places)
    const rawAccommodation = services.accommodation || [];
    const accommodation = rawAccommodation.map((acc, idx) => {
      const pName = acc.name || "Selected Accommodation";
      const phone = formatPhone(acc.phone, acc.contactNumber, acc.contact?.phone);
      const address = formatAddress(pName, acc.address, acc.distanceKm);
      const gLink = formatGoogleMapUrl(acc);
      const website = acc.website || acc.contact?.website || (acc.externalPlaceId?.startsWith("google-") ? gLink : "");
      const hours = (acc.openingHours && !acc.openingHours.toLowerCase().includes("not specified"))
        ? acc.openingHours
        : "Open 24 Hours";

      return {
        _id: acc._id || `acc_${idx}`,
        journeyId: journey._id,
        userId: journey.userId,
        placeId: acc.externalPlaceId || acc.serviceId || `place_acc_${idx}`,
        name: pName,
        category: acc.category || acc.placeType || "Lodging / Hotel",
        address,
        phone,
        website,
        rating: acc.rating || 4.5,
        openingHours: hours,
        facilities: acc.facilities?.length ? acc.facilities : ["Free Wi-Fi", "Clean Drinking Water", "Hot Water Bath", "Mandir Access"],
        latitude: acc.latitude || center.location?.latitude || null,
        longitude: acc.longitude || center.location?.longitude || null,
        description: acc.description || `Selected accommodation recommendation near ${center.name || "Pilgrimage Center"}.`,
        googleMapLink: gLink,
      };
    });

    // 2. SELECTED FOOD RECOMMENDATIONS (Google Maps places)
    const rawFood = services.restaurants || [];
    const food = rawFood.map((f, idx) => {
      const pName = f.name || "Pilgrim Satvik Dining";
      const phone = formatPhone(f.phone, f.contactNumber, f.contact?.phone);
      const address = formatAddress(pName, f.address, f.distanceKm);
      const gLink = formatGoogleMapUrl(f);
      const website = f.website || f.contact?.website || (f.externalPlaceId?.startsWith("google-") ? gLink : "");
      const hours = (f.openingHours && !f.openingHours.toLowerCase().includes("not specified"))
        ? f.openingHours
        : (f.time || "06:30 AM - 10:00 PM");

      return {
        _id: f._id || `food_${idx}`,
        journeyId: journey._id,
        userId: journey.userId,
        placeId: f.externalPlaceId || f.serviceId || `place_food_${idx}`,
        name: pName,
        category: f.category || f.placeType || "Restaurant / Annadhanam",
        foodType: f.mealType || "Satvik Vegetarian Dining",
        address,
        phone,
        website,
        rating: f.rating || 4.6,
        openingHours: hours,
        facilities: f.facilities?.length ? f.facilities : ["100% Pure Satvik Vegetarian", "Clean Drinking Water", "Hygiene Certified"],
        latitude: f.latitude || center.location?.latitude || null,
        longitude: f.longitude || center.location?.longitude || null,
        description: f.description || `Satvik food dining option near ${center.name || "Pilgrimage Center"}.`,
        googleMapLink: gLink,
      };
    });

    // 3. PARKING & OTHER SELECTED SERVICES (Hospitals, Base camps, Pharmacies, Restrooms, Water, ATMs)
    const otherServices = [];

    (services.parking || []).forEach((pk, idx) => {
      const pName = pk.name || `${center.name || "Pilgrimage Center"} Parking Facility`;
      otherServices.push({
        _id: pk._id || `prk_${idx}`,
        journeyId: journey._id,
        userId: journey.userId,
        placeId: pk.externalPlaceId || pk.serviceId || `place_prk_${idx}`,
        name: pName,
        category: "Parking Location",
        serviceType: "Vehicle Parking",
        address: formatAddress(pName, pk.address, pk.distanceKm),
        phone: formatPhone(pk.phone, pk.contactNumber, pk.contact?.phone),
        facilities: pk.facilities?.length ? pk.facilities : ["Security Guarded", "CCTV Monitored"],
        latitude: pk.latitude || center.location?.latitude || null,
        longitude: pk.longitude || center.location?.longitude || null,
        googleMapLink: formatGoogleMapUrl(pk),
      });
    });

    (services.hospitals || []).forEach((h, idx) => {
      otherServices.push({
        _id: h._id || `hosp_${idx}`,
        journeyId: journey._id,
        userId: journey.userId,
        placeId: h.externalPlaceId || h.serviceId || `place_hosp_${idx}`,
        name: h.name,
        category: "Medical & Health Support",
        serviceType: "Hospital / First-Aid Clinic",
        address: h.address,
        phone: h.phone || "Emergency Helpline: 108",
        latitude: h.latitude,
        longitude: h.longitude,
      });
    });

    (services.baseCamps || []).forEach((bc, idx) => {
      otherServices.push({
        _id: bc._id || `bc_${idx}`,
        journeyId: journey._id,
        userId: journey.userId,
        placeId: bc.externalPlaceId || bc.serviceId || `place_bc_${idx}`,
        name: bc.name,
        category: "Pilgrimage Base Camp",
        serviceType: "Base Camp / Shelter",
        address: bc.address,
        phone: bc.phone || "Not available",
        latitude: bc.latitude,
        longitude: bc.longitude,
      });
    });

    (services.pharmacies || []).forEach((p, idx) => {
      otherServices.push({
        _id: p._id || `pharm_${idx}`,
        journeyId: journey._id,
        userId: journey.userId,
        placeId: p.externalPlaceId || p.serviceId || `place_phr_${idx}`,
        name: p.name,
        category: "Medical Support",
        serviceType: "Pharmacy",
        address: p.address,
        phone: p.phone || "Not available",
        latitude: p.latitude,
        longitude: p.longitude,
      });
    });

    (services.restrooms || []).forEach((r, idx) => {
      otherServices.push({
        _id: r._id || `rst_${idx}`,
        journeyId: journey._id,
        userId: journey.userId,
        placeId: r.externalPlaceId || r.serviceId || `place_rst_${idx}`,
        name: r.name,
        category: "Sanitation Kiosk",
        serviceType: "Public Restroom",
        address: r.address,
        latitude: r.latitude,
        longitude: r.longitude,
      });
    });

    (services.drinkingWater || []).forEach((w, idx) => {
      otherServices.push({
        _id: w._id || `wtr_${idx}`,
        journeyId: journey._id,
        userId: journey.userId,
        placeId: w.externalPlaceId || w.serviceId || `place_wtr_${idx}`,
        name: w.name,
        category: "Drinking Water Kiosk",
        serviceType: "Purified Water",
        address: w.address,
        latitude: w.latitude,
        longitude: w.longitude,
      });
    });

    // TOTAL SELECTED RECOMMENDATIONS COUNT (Excluding transport completely!)
    const totalRecommendationsCount = accommodation.length + food.length + otherServices.length;

    res.status(200).json({
      success: true,
      journeySummary: {
        journeyId: journey._id,
        pilgrimageCenter: {
          id: center._id,
          name: center.name || "Pilgrimage Center",
          city: center.location?.city || "",
          state: center.location?.state || "",
          country: center.location?.country || "India",
          image: center.image || "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?q=80&w=800&auto=format&fit=crop",
          latitude: center.location?.latitude,
          longitude: center.location?.longitude,
        },
        startDate: journey.journeyDate,
        returnDate: journey.returnDate,
        status: journey.status || "PLANNED",
        totalPilgrims: journey.totalPilgrims || 1,
        totalRecommendationsCount,
      },
      recommendations: {
        accommodation,
        food,
        otherServices,
      },
      // Backward compatibility field name if needed
      bookings: {
        accommodation,
        food,
        otherServices,
      },
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
  cancelJourney,
  acceptResponsibility,
  startJourney,
  getActiveJourney,
  updateJourneyLocation,
  updateJourneyStatus,
  getJourneyProgress,
  completeJourney,
  getJourneyBookings,
  syncExpiredJourneys,
  normalizeDateOnly,
  getEndOfDayUTC,
};
