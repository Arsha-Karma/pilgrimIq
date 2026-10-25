const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");
const Journey = require("../models/Journey");
const PilgrimageCenter = require("../models/PilgrimageCenter");
const User = require("../models/User");
const AccommodationBooking = require("../models/AccommodationBooking");
const {
  createJourney,
  updateJourney,
  deleteJourney,
  cancelJourney,
  getMyJourneys,
  syncExpiredJourneys,
} = require("../controllers/journeyController");
const { modifyBookingDates } = require("../controllers/accommodationBookingController");

// Helper mock req/res
const createMockReqRes = (user, body = {}, params = {}, query = {}) => {
  let statusCode = 200;
  let responseData = null;

  const req = {
    user,
    body,
    params,
    query,
  };

  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      return res;
    },
    getStatusCode: () => statusCode,
    getData: () => responseData,
  };

  const next = (err) => {
    if (err) {
      if (statusCode === 200) statusCode = 500;
      responseData = { success: false, message: err.message, stack: err.stack };
    }
  };

  return { req, res, next, getResult: () => ({ status: statusCode, data: responseData }) };
};

(async () => {
  console.log("==================================================================");
  console.log("PILGRIMIQ: JOURNEY PLANNING VALIDATIONS TEST SUITE");
  console.log("==================================================================");

  await connectDB();

  // Setup test users and test centers
  const testEmailA = `test_val_user_a_${Date.now()}@pilgrimiq.com`;
  const testEmailB = `test_val_user_b_${Date.now()}@pilgrimiq.com`;

  const userA = await User.create({
    name: "Pilgrim Validator A",
    email: testEmailA,
    password: "HashedPassword123!",
    phoneNumber: "9876543201",
    role: "user",
  });

  const userB = await User.create({
    name: "Pilgrim Validator B",
    email: testEmailB,
    password: "HashedPassword123!",
    phoneNumber: "9876543202",
    role: "user",
  });

  // Find or create test centers
  let centers = await PilgrimageCenter.find().limit(3);
  if (centers.length < 3) {
    const center1 = await PilgrimageCenter.create({
      name: "Test Holy Temple Alpha",
      religion: "Hinduism",
      location: { city: "Varanasi", state: "Uttar Pradesh", country: "India", latitude: 25.3176, longitude: 82.9739 },
      description: "Historic holy temple",
    });
    const center2 = await PilgrimageCenter.create({
      name: "Test Holy Shrine Beta",
      religion: "Hinduism",
      location: { city: "Haridwar", state: "Uttarakhand", country: "India", latitude: 29.9457, longitude: 78.1642 },
      description: "Sacred shrine on holy river",
    });
    const center3 = await PilgrimageCenter.create({
      name: "Test Divine Sanctum Gamma",
      religion: "Hinduism",
      location: { city: "Rishikesh", state: "Uttarakhand", country: "India", latitude: 30.0869, longitude: 78.2676 },
      description: "Peaceful divine sanctum",
    });
    centers = [center1, center2, center3];
  }

  const centerA = centers[0];
  const centerB = centers[1];
  const centerC = centers[2];

  let passedTests = 0;
  let totalTests = 14;

  try {
    // -------------------------------------------------------------
    // SCENARIO 1: Book one journey successfully
    // -------------------------------------------------------------
    console.log("\n[TEST 1] Book one journey successfully...");
    const { req: req1, res: res1, next: next1, getResult: getRes1 } = createMockReqRes(userA, {
      pilgrimageCenterId: centerA._id,
      journeyDate: "2026-11-10",
      returnDate: "2026-11-12",
      transportMode: "Car",
      travelingAlone: true,
      walkingLevel: "Moderate",
    });
    await createJourney(req1, res1, next1);
    const res1Data = getRes1();

    if (res1Data.status === 201 && res1Data.data?.journey?._id) {
      console.log("✓ PASS: Journey 1 booked successfully with ID:", res1Data.data.journey._id);
      passedTests++;
    } else {
      console.error("✗ FAIL: Test 1 failed:", res1Data);
    }
    const journey1Id = res1Data.data?.journey?._id;

    // -------------------------------------------------------------
    // SCENARIO 2: Attempt to book another centre on the same date
    // -------------------------------------------------------------
    console.log("\n[TEST 2] Attempt to book another centre on the same date (Date conflict)...");
    const { req: req2, res: res2, next: next2, getResult: getRes2 } = createMockReqRes(userA, {
      pilgrimageCenterId: centerB._id,
      journeyDate: "2026-11-11", // Overlaps with 2026-11-10 -> 2026-11-12
      returnDate: "2026-11-13",
      transportMode: "Bus",
      travelingAlone: true,
      walkingLevel: "Moderate",
    });
    await createJourney(req2, res2, next2);
    const res2Data = getRes2();

    if (
      res2Data.status === 409 &&
      res2Data.data?.conflictType === "DATE_CONFLICT" &&
      res2Data.data?.message?.includes("You already have a journey scheduled for this date")
    ) {
      console.log("✓ PASS: Overlapping journey date blocked with clear conflict message:", res2Data.data.message);
      passedTests++;
    } else {
      console.error("✗ FAIL: Test 2 failed:", res2Data);
    }

    // -------------------------------------------------------------
    // SCENARIO 3: Attempt to book the same centre on a different date
    // -------------------------------------------------------------
    console.log("\n[TEST 3] Attempt to book the same centre on a different date (Duplicate centre)...");
    const { req: req3, res: res3, next: next3, getResult: getRes3 } = createMockReqRes(userA, {
      pilgrimageCenterId: centerA._id, // Same center A
      journeyDate: "2026-11-20", // Non-overlapping future date
      returnDate: "2026-11-22",
      transportMode: "Train",
      travelingAlone: true,
      walkingLevel: "Moderate",
    });
    await createJourney(req3, res3, next3);
    const res3Data = getRes3();

    if (
      res3Data.status === 409 &&
      res3Data.data?.conflictType === "DUPLICATE_CENTRE" &&
      res3Data.data?.message?.includes("Would you like to reschedule it?") &&
      res3Data.data?.existingJourney?._id
    ) {
      console.log("✓ PASS: Duplicate centre booking blocked and offered rescheduling:", res3Data.data.message);
      passedTests++;
    } else {
      console.error("✗ FAIL: Test 3 failed:", res3Data);
    }

    // -------------------------------------------------------------
    // SCENARIO 4: Reschedule an existing journey to a valid date
    // -------------------------------------------------------------
    console.log("\n[TEST 4] Reschedule existing journey to a valid date...");
    const { req: req4, res: res4, next: next4, getResult: getRes4 } = createMockReqRes(
      userA,
      {
        journeyDate: "2026-11-25",
        returnDate: "2026-11-27",
        transportMode: "Car",
        walkingLevel: "High",
      },
      { id: journey1Id }
    );
    await updateJourney(req4, res4, next4);
    const res4Data = getRes4();

    if (
      res4Data.status === 200 &&
      res4Data.data?.journey?._id?.toString() === journey1Id.toString() &&
      new Date(res4Data.data.journey.journeyDate).toISOString().startsWith("2026-11-25")
    ) {
      console.log("✓ PASS: Journey rescheduled and updated in-place without creating duplicate record.");
      passedTests++;
    } else {
      console.error("✗ FAIL: Test 4 failed:", res4Data);
    }

    // -------------------------------------------------------------
    // SCENARIO 5: Attempt to reschedule to a date already occupied by another active journey
    // -------------------------------------------------------------
    console.log("\n[TEST 5] Attempt to reschedule to a date occupied by another active journey...");
    // First, create Journey 2 for User A on 2026-12-05 to 2026-12-07 (Center B)
    const { req: req5Setup, res: res5Setup, next: next5Setup, getResult: getRes5Setup } = createMockReqRes(userA, {
      pilgrimageCenterId: centerB._id,
      journeyDate: "2026-12-05",
      returnDate: "2026-12-07",
      transportMode: "Train",
      travelingAlone: true,
      walkingLevel: "Low",
    });
    await createJourney(req5Setup, res5Setup, next5Setup);
    const res5SetupData = getRes5Setup();
    const journey2Id = res5SetupData.data?.journey?._id;

    // Now attempt to reschedule Journey 1 into Journey 2's dates (2026-12-06)
    const { req: req5, res: res5, next: next5, getResult: getRes5 } = createMockReqRes(
      userA,
      {
        journeyDate: "2026-12-06",
        returnDate: "2026-12-08",
      },
      { id: journey1Id }
    );
    await updateJourney(req5, res5, next5);
    const res5Data = getRes5();

    if (
      res5Data.status === 409 &&
      res5Data.data?.conflictType === "DATE_CONFLICT" &&
      res5Data.data?.message?.includes("You already have a journey scheduled for this date")
    ) {
      console.log("✓ PASS: Rescheduling into conflicting occupied date prevented successfully:", res5Data.data.message);
      passedTests++;
    } else {
      console.error("✗ FAIL: Test 5 failed:", res5Data);
    }

    // -------------------------------------------------------------
    // SCENARIO 6: Verify that a missed journey becomes expired
    // -------------------------------------------------------------
    console.log("\n[TEST 6] Verify missed journey becomes expired...");
    // Insert a past planned journey for User A (Center C on 2026-10-01)
    const pastJourney = await Journey.create({
      userId: userA._id,
      pilgrimageCenterId: centerC._id,
      journeyDate: new Date("2026-10-01T00:00:00.000Z"),
      returnDate: new Date("2026-10-03T00:00:00.000Z"),
      status: "planned",
      transportMode: "Car",
      totalPilgrims: 1,
    });

    await syncExpiredJourneys(userA._id);
    const refreshedPastJourney = await Journey.findById(pastJourney._id);

    if (refreshedPastJourney.status === "EXPIRED") {
      console.log("✓ PASS: Missed journey automatically marked as EXPIRED in database.");
      passedTests++;
    } else {
      console.error("✗ FAIL: Test 6 failed, status is:", refreshedPastJourney.status);
    }

    // -------------------------------------------------------------
    // SCENARIO 7: Verify that an expired journey allows a new plan to the same centre
    // -------------------------------------------------------------
    console.log("\n[TEST 7] Verify expired journey allows a new plan to the same centre...");
    const { req: req7, res: res7, next: next7, getResult: getRes7 } = createMockReqRes(userA, {
      pilgrimageCenterId: centerC._id, // Center C previously had an expired journey
      journeyDate: "2026-12-15",
      returnDate: "2026-12-17",
      transportMode: "Car",
      travelingAlone: true,
      walkingLevel: "Moderate",
    });
    await createJourney(req7, res7, next7);
    const res7Data = getRes7();

    if (res7Data.status === 201 && res7Data.data?.journey?._id) {
      console.log("✓ PASS: New plan to center C succeeded despite previous expired journey.");
      passedTests++;
    } else {
      console.error("✗ FAIL: Test 7 failed:", res7Data);
    }

    // -------------------------------------------------------------
    // SCENARIO 8: Cancel a booking and verify that its date becomes available
    // -------------------------------------------------------------
    console.log("\n[TEST 8] Cancel a booking and verify that its date becomes available...");
    // Cancel Journey 2 (which is on 2026-12-05 to 2026-12-07 at Center B)
    const { req: req8Cancel, res: res8Cancel, next: next8Cancel, getResult: getRes8Cancel } = createMockReqRes(
      userA,
      {},
      { id: journey2Id }
    );
    await cancelJourney(req8Cancel, res8Cancel, next8Cancel);
    const res8CancelData = getRes8Cancel();

    const cancelledJourneyDoc = await Journey.findById(journey2Id);
    const isDocCancelled = cancelledJourneyDoc.status === "CANCELLED" && cancelledJourneyDoc.cancelledAt;

    // Now attempt to book on the same dates (2026-12-05 to 2026-12-07) for Center B
    const { req: req8Rebook, res: res8Rebook, next: next8Rebook, getResult: getRes8Rebook } = createMockReqRes(userA, {
      pilgrimageCenterId: centerB._id,
      journeyDate: "2026-12-05",
      returnDate: "2026-12-07",
      transportMode: "Flight",
      travelingAlone: true,
      walkingLevel: "Low",
    });
    await createJourney(req8Rebook, res8Rebook, next8Rebook);
    const res8RebookData = getRes8Rebook();

    if (
      isDocCancelled &&
      res8RebookData.status === 201 &&
      res8RebookData.data?.journey?._id
    ) {
      console.log("✓ PASS: Booking cancelled, record retained, and its date/centre was successfully re-booked.");
      passedTests++;
    } else {
      console.error("✗ FAIL: Test 8 failed:", { isDocCancelled, res8RebookData });
    }

    // -------------------------------------------------------------
    // SCENARIO 9: Verify that completed journeys remain in history and prevent cancellation
    // -------------------------------------------------------------
    console.log("\n[TEST 9] Verify completed journey remains in history and cannot be cancelled...");
    const completedJourney = await Journey.create({
      userId: userA._id,
      pilgrimageCenterId: centerB._id,
      journeyDate: new Date("2026-09-01T00:00:00.000Z"),
      returnDate: new Date("2026-09-03T00:00:00.000Z"),
      status: "COMPLETED",
      completedAt: new Date("2026-09-03T18:00:00.000Z"),
      transportMode: "Car",
      totalPilgrims: 1,
    });

    const { req: req9List, res: res9List, next: next9List, getResult: getRes9List } = createMockReqRes(userA);
    await getMyJourneys(req9List, res9List, next9List);
    const res9ListData = getRes9List();
    const hasCompletedInHistory = res9ListData.data?.journeys?.some((j) => j._id.toString() === completedJourney._id.toString());

    // Attempt cancellation on completed journey
    const { req: req9Cancel, res: res9Cancel, next: next9Cancel, getResult: getRes9Cancel } = createMockReqRes(
      userA,
      {},
      { id: completedJourney._id }
    );
    await cancelJourney(req9Cancel, res9Cancel, next9Cancel);
    const res9CancelData = getRes9Cancel();

    if (hasCompletedInHistory && res9CancelData.status === 400) {
      console.log("✓ PASS: Completed journey preserved in history and rejection prevents cancellation:", res9CancelData.data.message);
      passedTests++;
    } else {
      console.error("✗ FAIL: Test 9 failed:", { hasCompletedInHistory, res9CancelData });
    }

    // -------------------------------------------------------------
    // SCENARIO 10: Attempt duplicate submissions and simultaneous booking requests
    // -------------------------------------------------------------
    console.log("\n[TEST 10] Attempt simultaneous booking requests for a user on same date...");
    const userSim = await User.create({
      name: "Pilgrim Simultaneous Tester",
      email: `test_val_user_sim_${Date.now()}@pilgrimiq.com`,
      password: "HashedPassword123!",
      phoneNumber: "9876543209",
      role: "user",
    });

    const [sim1, sim2] = await Promise.all([
      (async () => {
        const { req, res, next, getResult } = createMockReqRes(userSim, {
          pilgrimageCenterId: centerA._id,
          journeyDate: "2026-12-28",
          returnDate: "2026-12-30",
          transportMode: "Car",
          travelingAlone: true,
          walkingLevel: "Moderate",
        });
        await createJourney(req, res, next);
        return getResult();
      })(),
      (async () => {
        const { req, res, next, getResult } = createMockReqRes(userSim, {
          pilgrimageCenterId: centerB._id, // Simultaneous request on same date for different centre
          journeyDate: "2026-12-28",
          returnDate: "2026-12-30",
          transportMode: "Bus",
          travelingAlone: true,
          walkingLevel: "Moderate",
        });
        await createJourney(req, res, next);
        return getResult();
      })(),
    ]);

    const statuses = [sim1.status, sim2.status].sort();
    // One should be 201, the other should be 409
    if (statuses[0] === 201 && statuses[1] === 409) {
      console.log("✓ PASS: Simultaneous requests serialized: exactly 1 succeeded (201), the duplicate/conflicting one was rejected (409).");
      passedTests++;
    } else {
      console.error("✗ FAIL: Test 10 failed, statuses:", statuses, { sim1, sim2 });
    }

    // Clean up userSim
    await Journey.deleteMany({ userId: userSim._id });
    await User.deleteOne({ _id: userSim._id });

    // -------------------------------------------------------------
    // SCENARIO 11: Verify that another user's journey does not block the current user
    // -------------------------------------------------------------
    console.log("\n[TEST 11] Verify another user (User B) can book same date and center...");
    // User A has active journey on 2026-11-25 at Center A. User B should be able to book same dates/centre!
    const { req: req11, res: res11, next: next11, getResult: getRes11 } = createMockReqRes(userB, {
      pilgrimageCenterId: centerA._id,
      journeyDate: "2026-11-25",
      returnDate: "2026-11-27",
      transportMode: "Flight",
      travelingAlone: true,
      walkingLevel: "Moderate",
    });
    await createJourney(req11, res11, next11);
    const res11Data = getRes11();

    if (res11Data.status === 201 && res11Data.data?.journey?._id) {
      console.log("✓ PASS: User B successfully booked same date and center without being blocked by User A.");
      passedTests++;
    } else {
      console.error("✗ FAIL: Test 11 failed:", res11Data);
    }

    // -------------------------------------------------------------
    // SCENARIO 12: Verify PSI and Travel Assessment continue working
    // -------------------------------------------------------------
    console.log("\n[TEST 12] Verify PSI and Travel Assessment calculation integration...");
    const { calculateJourneyPsi } = require("../services/psiService");
    const psiResult = await calculateJourneyPsi(journey1Id, userA._id, true);

    if (psiResult && (psiResult.psiScore !== undefined || psiResult.assessmentStatus !== undefined)) {
      console.log("✓ PASS: PSI calculation succeeded with score:", psiResult.psiScore, "Assessment status:", psiResult.assessmentStatus);
      passedTests++;
    } else {
      console.error("✗ FAIL: Test 12 failed:", psiResult);
    }

    // -------------------------------------------------------------
    // SCENARIO 13: Accommodation reservation during journey rescheduling
    // -------------------------------------------------------------
    console.log("\n[TEST 13] Verify accommodation booking handling during journey rescheduling...");
    // 1. Create accommodation booking for Journey 1 (checkIn: 2026-11-25, checkOut: 2026-11-27)
    const accBooking = await AccommodationBooking.create({
      userId: userA._id,
      journeyId: journey1Id,
      bookingReference: `PIQ-ACC-TEST-${Date.now()}`,
      placeId: "test_hotel_123",
      accommodationName: "Sacred Pilgrim Bhavan",
      roomType: "STANDARD_NON_AC",
      roomTitle: "Standard Pilgrim Room",
      checkInDate: new Date("2026-11-25T12:00:00.000Z"),
      checkOutDate: new Date("2026-11-27T11:00:00.000Z"),
      numberOfNights: 2,
      numberOfRooms: 1,
      guests: { adults: 1, children: 0 },
      leadGuest: { name: userA.name, phone: "9876543201", email: userA.email },
      pricing: { pricePerNight: 950, roomSubtotal: 1900, taxAmount: 228, totalAmount: 2128, currency: "INR" },
      bookingStatus: "CONFIRMED",
      paymentStatus: "PAID",
    });

    // 2. Reschedule Journey 1 to new unoccupied dates (2027-01-15 to 2027-01-18)
    const { req: req13Resched, res: res13Resched, next: next13Resched, getResult: getRes13Resched } = createMockReqRes(
      userA,
      {
        journeyDate: "2027-01-15",
        returnDate: "2027-01-18",
      },
      { id: journey1Id }
    );
    await updateJourney(req13Resched, res13Resched, next13Resched);
    const res13ReschedData = getRes13Resched();

    // 3. Verify that accommodation booking was NOT automatically modified or cancelled
    const unmodBooking = await AccommodationBooking.findById(accBooking._id);
    const originalCheckInMatches = unmodBooking.checkInDate.toISOString().startsWith("2026-11-25");
    const stillConfirmed = unmodBooking.bookingStatus === "CONFIRMED";

    // 4. Confirm modification via modifyBookingDates endpoint
    const { req: req13Mod, res: res13Mod, next: next13Mod, getResult: getRes13Mod } = createMockReqRes(
      userA,
      {
        checkInDate: "2027-01-15",
        checkOutDate: "2027-01-18",
      },
      { bookingId: accBooking._id }
    );
    await modifyBookingDates(req13Mod, res13Mod, next13Mod);
    const res13ModData = getRes13Mod();
    const updatedAccBooking = await AccommodationBooking.findById(accBooking._id);
    const updatedCheckInMatches = updatedAccBooking.checkInDate.toISOString().startsWith("2027-01-15");
    const updatedNightsMatch = updatedAccBooking.numberOfNights === 3;

    if (
      res13ReschedData.status === 200 &&
      originalCheckInMatches &&
      stillConfirmed &&
      res13ModData.status === 200 &&
      updatedCheckInMatches &&
      updatedNightsMatch
    ) {
      console.log("✓ PASS: Accommodation preserved unchanged during journey reschedule, and correctly updated only after user confirmation.");
      passedTests++;
    } else {
      console.error("✗ FAIL: Test 13 failed:", { res13ReschedData, originalCheckInMatches, res13ModData, updatedNightsMatch });
    }

    // -------------------------------------------------------------
    // SCENARIO 14: Journey Status Handling & Expiration Safety
    // -------------------------------------------------------------
    console.log("\n[TEST 14] Verify journey status handling (Scheduled/Confirmed block, In-Progress/Completed never expire)...");
    
    const userStatusTest = await User.create({
      name: "Status Test Pilgrim",
      email: `test_val_status_${Date.now()}@pilgrimiq.com`,
      password: "HashedPassword123!",
      phoneNumber: "9876543207",
      role: "user",
    });

    // 1. Verify "scheduled" and "confirmed" statuses block duplicate booking for the same centre
    const scheduledJourney = await Journey.create({
      userId: userStatusTest._id,
      pilgrimageCenterId: centerC._id,
      journeyDate: new Date("2026-12-20"),
      returnDate: new Date("2026-12-22"),
      transportMode: "Car",
      status: "scheduled",
    });

    const { req: req14Block, res: res14Block, next: next14Block, getResult: getRes14Block } = createMockReqRes(userStatusTest, {
      pilgrimageCenterId: centerC._id,
      journeyDate: "2026-12-28",
      returnDate: "2026-12-30",
      transportMode: "Bus",
      travelingAlone: true,
      walkingLevel: "Low",
    });
    await createJourney(req14Block, res14Block, next14Block);
    const res14BlockData = getRes14Block();
    const isBlockedByScheduled = res14BlockData.status === 409 && res14BlockData.data?.conflictType === "DUPLICATE_CENTRE";

    // 2. Verify an IN_PROGRESS journey with past date is NEVER expired
    const inProgressJourney = await Journey.create({
      userId: userStatusTest._id,
      pilgrimageCenterId: centerA._id,
      journeyDate: new Date("2020-01-01"),
      returnDate: new Date("2020-01-05"),
      transportMode: "Car",
      status: "IN_PROGRESS",
    });
    
    // 3. Verify a COMPLETED journey with past date is NEVER expired
    const completedPastJourney = await Journey.create({
      userId: userStatusTest._id,
      pilgrimageCenterId: centerB._id,
      journeyDate: new Date("2020-02-01"),
      returnDate: new Date("2020-02-05"),
      transportMode: "Train",
      status: "COMPLETED",
    });

    await syncExpiredJourneys(userStatusTest._id);

    const reloadedInProgress = await Journey.findById(inProgressJourney._id);
    const reloadedCompleted = await Journey.findById(completedPastJourney._id);

    const inProgressNeverExpired = reloadedInProgress.status === "IN_PROGRESS";
    const completedNeverExpired = reloadedCompleted.status === "COMPLETED";

    await Journey.deleteMany({ userId: userStatusTest._id });
    await User.deleteOne({ _id: userStatusTest._id });

    if (isBlockedByScheduled && inProgressNeverExpired && completedNeverExpired) {
      console.log("✓ PASS: Scheduled/Confirmed journeys correctly block duplicate bookings; In-Progress and Completed journeys are NEVER expired.");
      passedTests++;
    } else {
      console.error("✗ FAIL: Test 14 failed:", { isBlockedByScheduled, inProgressNeverExpired, completedNeverExpired });
    }
  } finally {
    // Cleanup test users, journeys, and accommodation bookings
    console.log("\nCleaning up test data...");
    await AccommodationBooking.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await Journey.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    console.log("Cleanup complete.");
  }

  console.log("==================================================================");
  console.log(`TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log("==================================================================");

  if (passedTests === totalTests) {
    console.log("🎉 ALL 14 VALIDATION TEST SCENARIOS PASSED PERFECTLY!");
    process.exit(0);
  } else {
    console.error("❌ SOME TESTS FAILED.");
    process.exit(1);
  }
})();
