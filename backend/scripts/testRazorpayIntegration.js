/**
 * Comprehensive Automated Test Suite for PilgrimIQ Razorpay Test Mode Integration
 * Runs locally against MongoDB Atlas and verifies all 13 requirement items.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const crypto = require("crypto");

dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");
const User = require("../models/User");
const Journey = require("../models/Journey");
const PilgrimageCenter = require("../models/PilgrimageCenter");
const AccommodationBooking = require("../models/AccommodationBooking");
const {
  getRazorpayClient,
  isRazorpayConfigured,
  getPublicKeyId,
  getRazorpayCredentials,
} = require("../config/razorpay");
const {
  createBookingDraft,
  createRazorpayOrder,
  verifyPayment,
  getCancellationPreview,
  cancelBooking,
  getMyBookings,
} = require("../controllers/accommodationBookingController");

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runTests() {
  console.log("\n========================================================");
  console.log("🚀 PILGRIMIQ — RAZORPAY TEST MODE INTEGRATION TEST SUITE");
  console.log("========================================================\n");

  await connectDB();

  // Test 1: Razorpay Credentials & Config
  console.log("[Test Group 1] Secure Razorpay Configuration");
  assert(isRazorpayConfigured() === true, "Razorpay is recognized as configured in Test Mode");
  const keyId = getPublicKeyId();
  assert(keyId && keyId.startsWith("rzp_test_"), "Public Key ID is a valid Razorpay Test Mode key");
  const { key_secret } = getRazorpayCredentials();
  assert(key_secret && key_secret.length > 10, "Key Secret is loaded securely in backend environment");

  const razorpayClient = getRazorpayClient();
  assert(Boolean(razorpayClient && razorpayClient.orders), "Razorpay Node.js SDK client initialized successfully");

  // Setup Test Users
  console.log("\n[Test Group 2] User Setup & Authentication Isolation");
  let testUserA = await User.findOne({ email: "test_pilgrim_a@pilgrimiq.com" });
  if (!testUserA) {
    testUserA = await User.create({
      name: "Arun Pilgrim",
      email: "test_pilgrim_a@pilgrimiq.com",
      password: "HashedPassword123!",
      phoneNumber: "9876543210",
      role: "user",
    });
  }

  let testUserB = await User.findOne({ email: "test_pilgrim_b@pilgrimiq.com" });
  if (!testUserB) {
    testUserB = await User.create({
      name: "Bhavana Pilgrim",
      email: "test_pilgrim_b@pilgrimiq.com",
      password: "HashedPassword123!",
      phoneNumber: "9123456789",
      role: "user",
    });
  }
  assert(testUserA._id && testUserB._id, "Two distinct test users established for isolation checks");

  // Test 3: Server-side Authoritative Price Calculation & Validation
  console.log("\n[Test Group 3] Server-Side Booking Validation & Price Authority");
  const mockReqInvalidDates = {
    user: testUserA,
    body: {
      placeId: "test_place_001",
      accommodationName: "Shree Ganesh Yatri Nivas",
      checkInDate: "2026-11-15",
      checkOutDate: "2026-11-10", // Check-out before check-in
      roomType: "DELUXE_AC",
    },
  };

  let caughtDateError = false;
  try {
    await createBookingDraft(mockReqInvalidDates, { status: () => ({ json: () => {} }) }, (err) => {
      if (err) caughtDateError = true;
    });
  } catch (e) {
    caughtDateError = true;
  }
  assert(caughtDateError, "Backend rejects invalid check-out date prior to check-in date");

  // Valid Draft Booking
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 5);
  const checkOut = new Date();
  checkOut.setDate(checkOut.getDate() + 7); // 2 nights

  let createdBooking = null;
  const mockReqValid = {
    user: testUserA,
    body: {
      placeId: "test_place_somnath_01",
      accommodationName: "Somnath Sagar Atithi Bhavan",
      accommodationAddress: "Near Main Somnath Temple Gate, Prabhas Patan, Gujarat",
      roomType: "DELUXE_AC", // ₹1,850/night
      checkInDate: checkIn.toISOString(),
      checkOutDate: checkOut.toISOString(),
      numberOfRooms: 2, // 2 rooms * 2 nights * 1850 = ₹7,400 subtotal
      guests: { adults: 4, children: 1 },
      leadGuest: {
        name: "Arun Pilgrim",
        phone: "9876543210",
        email: "test_pilgrim_a@pilgrimiq.com",
      },
    },
  };

  const mockResDraft = {
    status: (code) => {
      assert(code === 201, "Draft booking returns HTTP 201 Created");
      return {
        json: (data) => {
          createdBooking = data.booking;
        },
      };
    },
  };

  await createBookingDraft(mockReqValid, mockResDraft, (err) => {
    if (err) throw err;
  });

  assert(createdBooking && createdBooking._id, "Booking draft document saved in MongoDB Atlas");
  assert(createdBooking.numberOfNights === 2, "Backend calculated exact 2 stay nights");
  assert(createdBooking.pricing.pricePerNight === 1850, "Backend authoritative price per night is ₹1,850");
  assert(createdBooking.pricing.roomSubtotal === 7400, "Backend authoritative room subtotal is ₹7,400 (2 rooms * 2 nights * 1850)");
  assert(createdBooking.pricing.taxAmount === Math.round(7400 * 0.12), "Backend calculated exact 12% GST (₹888)");
  assert(createdBooking.pricing.totalAmount === 7400 + 888, "Backend calculated authoritative total ₹8,288");
  assert(createdBooking.bookingStatus === "PENDING_PAYMENT", "Initial booking status is PENDING_PAYMENT");
  assert(createdBooking.paymentStatus === "PENDING", "Initial payment status is PENDING");

  // Test 4: Server-Side Razorpay Order Creation in Test Mode
  console.log("\n[Test Group 4] Razorpay Test Mode Order Creation");
  let orderResult = null;
  const mockReqOrder = {
    user: testUserA,
    params: { bookingId: createdBooking._id.toString() },
  };

  const mockResOrder = {
    status: (code) => {
      assert(code === 200, "Order creation returns HTTP 200 OK");
      return {
        json: (data) => {
          orderResult = data;
        },
      };
    },
  };

  await createRazorpayOrder(mockReqOrder, mockResOrder, (err) => {
    if (err) throw err;
  });

  assert(orderResult && orderResult.orderId, "Received official Razorpay order ID from Test Gateway");
  assert(orderResult.orderId.startsWith("order_"), "Order ID format matches Razorpay convention ('order_...')");
  assert(orderResult.amount === 8288 * 100, "Order amount is accurately calculated in paise (828800)");
  assert(orderResult.currency === "INR", "Order currency is strictly INR");

  // Verify stored order ID in MongoDB
  const reloadedBooking = await AccommodationBooking.findById(createdBooking._id);
  assert(reloadedBooking.razorpayOrderId === orderResult.orderId, "Razorpay Order ID persisted against booking in MongoDB");

  // Test 5: Unauthorized Access Protection
  console.log("\n[Test Group 5] Access Control & Ownership Enforcement");
  let caughtUnauthorized = false;
  const mockReqUserB = {
    user: testUserB, // Different user!
    params: { bookingId: createdBooking._id.toString() },
  };

  try {
    await createRazorpayOrder(mockReqUserB, { status: () => ({ json: () => {} }) }, (err) => {
      if (err && err.message.includes("Unauthorized")) {
        caughtUnauthorized = true;
      }
    });
  } catch (e) {
    if (e.message.includes("Unauthorized")) caughtUnauthorized = true;
  }
  assert(caughtUnauthorized, "User B is forbidden from creating an order or accessing User A's booking (403)");

  // Test 6: Payment Signature Verification
  console.log("\n[Test Group 6] Cryptographic Signature Verification & Capture Checks");
  const fakePaymentId = `pay_test_${Date.now()}`;
  const validPayload = `${orderResult.orderId}|${fakePaymentId}`;
  const validSignature = crypto
    .createHmac("sha256", key_secret)
    .update(validPayload)
    .digest("hex");

  // 6A: Invalid Signature Test
  let caughtInvalidSig = false;
  const mockReqInvalidSig = {
    user: testUserA,
    params: { bookingId: createdBooking._id.toString() },
    body: {
      razorpay_order_id: orderResult.orderId,
      razorpay_payment_id: fakePaymentId,
      razorpay_signature: "tampered_fake_signature_12345",
    },
  };

  try {
    await verifyPayment(mockReqInvalidSig, { status: () => ({ json: () => {} }) }, (err) => {
      if (err && err.message.includes("signature")) caughtInvalidSig = true;
    });
  } catch (e) {
    if (e.message.includes("signature")) caughtInvalidSig = true;
  }
  assert(caughtInvalidSig, "Tampered payment signature is rejected with error");

  const failedBooking = await AccommodationBooking.findById(createdBooking._id);
  assert(failedBooking.bookingStatus !== "CONFIRMED", "Booking is NOT marked confirmed after signature failure");

  // 6B: Valid Signature Test
  let verifyResult = null;
  const mockReqValidSig = {
    user: testUserA,
    params: { bookingId: createdBooking._id.toString() },
    body: {
      razorpay_order_id: orderResult.orderId,
      razorpay_payment_id: fakePaymentId,
      razorpay_signature: validSignature,
    },
  };

  const mockResVerify = {
    status: (code) => {
      assert(code === 200, "Successful verification returns HTTP 200");
      return {
        json: (data) => {
          verifyResult = data;
        },
      };
    },
  };

  await verifyPayment(mockReqValidSig, mockResVerify, (err) => {
    if (err) throw err;
  });

  assert(verifyResult && verifyResult.booking, "Verification returns confirmed booking");
  assert(verifyResult.booking.bookingStatus === "CONFIRMED", "Booking status is authoritative 'CONFIRMED'");
  assert(verifyResult.booking.paymentStatus === "PAID", "Payment status is authoritative 'PAID'");
  assert(verifyResult.booking.razorpayPaymentId === fakePaymentId, "Payment ID correctly recorded in database");

  // 6C: Idempotency Test (Duplicate Verification)
  let idempotencyResult = null;
  const mockResIdempotent = {
    status: (code) => {
      assert(code === 200, "Idempotent duplicate verification returns HTTP 200");
      return {
        json: (data) => {
          idempotencyResult = data;
        },
      };
    },
  };

  await verifyPayment(mockReqValidSig, mockResIdempotent, (err) => {
    if (err) throw err;
  });
  assert(idempotencyResult && idempotencyResult.booking.bookingStatus === "CONFIRMED", "Duplicate verification request handled idempotently without error");

  // Test 7: Cancellation Preview & Refund Calculation (Requirement 10)
  console.log("\n[Test Group 7] Cancellation Policy Preview & Refund Calculation");
  let previewResult = null;
  const mockReqPreview = {
    user: testUserA,
    params: { bookingId: createdBooking._id.toString() },
  };

  const mockResPreview = {
    status: (code) => {
      assert(code === 200, "Cancellation preview returns HTTP 200");
      return {
        json: (data) => {
          previewResult = data;
        },
      };
    },
  };

  await getCancellationPreview(mockReqPreview, mockResPreview, (err) => {
    if (err) throw err;
  });

  assert(previewResult.totalPaid === 8288, "Cancellation preview reports accurate total paid (₹8,288)");
  assert(previewResult.hoursUntilCheckIn > 24, "Check-in is more than 24 hours in the future");
  assert(previewResult.cancellationFee === 0, "Cancellation fee is ₹0 for > 24h prior to check-in");
  assert(previewResult.eligibleRefund === 8288, "Eligible refund is 100% (₹8,288)");

  // Test 8: Process Cancellation & Simulated / Test Mode Refund
  console.log("\n[Test Group 8] Cancellation Execution & Test Mode Refund Handling");
  let cancelResult = null;
  const mockReqCancel = {
    user: testUserA,
    params: { bookingId: createdBooking._id.toString() },
    body: { reason: "Change in pilgrimage travel dates" },
  };

  const mockResCancel = {
    status: (code) => {
      assert(code === 200, "Cancellation returns HTTP 200");
      return {
        json: (data) => {
          cancelResult = data;
        },
      };
    },
  };

  await cancelBooking(mockReqCancel, mockResCancel, (err) => {
    if (err) throw err;
  });

  assert(cancelResult && cancelResult.booking.bookingStatus === "CANCELLED", "Booking status updated to 'CANCELLED'");
  assert(cancelResult.booking.refundStatus === "REFUNDED", "Refund status updated to 'REFUNDED'");
  assert(cancelResult.booking.refundDetails.amount === 8288, "Refund details record ₹8,288 returned");
  assert(
    ["TEST_MODE_API", "SIMULATED"].includes(cancelResult.booking.refundDetails.refundType),
    `Refund type is explicitly distinguished ('${cancelResult.booking.refundDetails.refundType}')`
  );

  // 8B: Prevent Duplicate Cancellation
  let duplicateCancelCaught = false;
  try {
    await cancelBooking(mockReqCancel, { status: () => ({ json: () => {} }) }, (err) => {
      if (err) duplicateCancelCaught = true;
    });
  } catch (e) {
    duplicateCancelCaught = true;
  }
  assert(duplicateCancelCaught, "Backend prevents duplicate cancellation on already cancelled booking");

  // Test 9: Fetch User Bookings from Database
  console.log("\n[Test Group 9] Persistence & Retrieval (My Bookings)");
  let myBookingsResult = null;
  const mockReqMy = {
    user: testUserA,
    query: {},
  };

  const mockResMy = {
    status: (code) => {
      assert(code === 200, "My Bookings returns HTTP 200");
      return {
        json: (data) => {
          myBookingsResult = data;
        },
      };
    },
  };

  await getMyBookings(mockReqMy, mockResMy, (err) => {
    if (err) throw err;
  });

  assert(myBookingsResult && Array.isArray(myBookingsResult.bookings), "My Bookings returns array of bookings from MongoDB Atlas");
  const foundInList = myBookingsResult.bookings.find((b) => b._id.toString() === createdBooking._id.toString());
  assert(Boolean(foundInList), "Newly created booking is persistently retrieved from database");

  // Clean up test booking
  await AccommodationBooking.deleteOne({ _id: createdBooking._id });
  console.log("\n  ✓ Test accommodation booking cleaned up from database");

  console.log("\n========================================================");
  console.log(`✅ ALL ${passedTests} / ${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log("========================================================\n");

  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch((err) => {
  console.error("\n❌ Test Suite encountered fatal error:", err);
  process.exit(1);
});
