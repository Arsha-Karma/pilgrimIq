const crypto = require("crypto");
const AccommodationBooking = require("../models/AccommodationBooking");
const Journey = require("../models/Journey");
const User = require("../models/User");
const {
  getRazorpayClient,
  isRazorpayConfigured,
  getPublicKeyId,
  getWebhookSecret,
  getRazorpayCredentials,
} = require("../config/razorpay");

/**
 * Standard Demo Room Catalog for Pilgrimage Lodgings
 * Clearly labelled demo accommodation inventory as required by specification.
 */
const DEMO_ROOM_TYPES = [
  {
    type: "STANDARD_NON_AC",
    title: "Standard Pilgrim Room (Non-AC)",
    description: "Comfortable, clean budget room with twin beds, hot water bath, and mandir prayer area access.",
    pricePerNight: 950,
    maxAdults: 2,
    maxChildren: 1,
    maxTotalGuests: 3,
    amenities: ["Twin Beds", "Hot Water Facility", "Ceiling Fan", "Drinking Water RO", "Mandir Shuttle Access"],
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=800&auto=format&fit=crop",
    inventoryAvailable: 8,
  },
  {
    type: "DELUXE_AC",
    title: "Deluxe AC Pilgrim Room",
    description: "Air-conditioned restful sanctuary with queen bed, attached modern bath, electric kettle, and satvik tea kit.",
    pricePerNight: 1850,
    maxAdults: 2,
    maxChildren: 2,
    maxTotalGuests: 4,
    amenities: ["Air Conditioning", "Queen Bed", "Geyser Hot Water", "Wi-Fi", "Electric Kettle", "Satvik Tea Kit"],
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=800&auto=format&fit=crop",
    inventoryAvailable: 5,
  },
  {
    type: "FAMILY_SUITE",
    title: "Family Pilgrim Suite (3 Beds)",
    description: "Spacious multi-bed family suite ideal for elder pilgrims and family groups, featuring 2 attached bathrooms.",
    pricePerNight: 2950,
    maxAdults: 4,
    maxChildren: 2,
    maxTotalGuests: 6,
    amenities: ["3 Double Beds", "2 Attached Baths", "Air Conditioning", "Wheelchair Friendly", "Wi-Fi", "RO Water"],
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop",
    inventoryAvailable: 3,
  },
  {
    type: "PILGRIM_DORMITORY",
    title: "Pilgrim Dormitory Bed (Shared Hall)",
    description: "Economical, sacred community dormitory bed with individual locker, clean linens, and communal hot showers.",
    pricePerNight: 350,
    maxAdults: 1,
    maxChildren: 0,
    maxTotalGuests: 1,
    amenities: ["Single Bunk / Cot", "Luggage Locker", "Communal Hot Showers", "Purified Water", "24/7 Security"],
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=800&auto=format&fit=crop",
    inventoryAvailable: 20,
  },
];

// Helper: Find demo room type definition
const findDemoRoomType = (roomType) => {
  return DEMO_ROOM_TYPES.find((r) => r.type === roomType) || DEMO_ROOM_TYPES[0];
};

// @desc    Get Razorpay Public Configuration
// @route   GET /api/accommodation-bookings/config
// @access  Public
const getRazorpayConfig = (req, res) => {
  const isConfigured = isRazorpayConfigured();
  const keyId = getPublicKeyId();

  return res.status(200).json({
    success: true,
    isConfigured,
    mode: "TEST",
    keyId: keyId || null,
    currency: "INR",
    disclaimer: "Razorpay Test Mode integration for PilgrimIQ accommodation reservations.",
  });
};

// @desc    Get Demo Accommodation Room Inventory for a Place
// @route   GET /api/accommodation-bookings/rooms/:placeId
// @access  Public / Authenticated
const getAccommodationRooms = (req, res) => {
  const { placeId } = req.params;
  const placeName = req.query.name || "Pilgrim Accommodation";

  return res.status(200).json({
    success: true,
    placeId,
    placeName,
    isSimulatedData: true,
    label: "Demo Accommodation Inventory",
    note: "Demo room categories & pricing for testing PilgrimIQ Razorpay payments in Test Mode.",
    cancellationPolicy: {
      description: "Free cancellation with 100% refund up to 24 hours prior to check-in. 50% refund within 24 hours. Non-refundable on or after check-in date.",
      freeCancellationWindowHours: 24,
      refundable: true,
    },
    rooms: DEMO_ROOM_TYPES,
  });
};

// @desc    Create / Draft a new Accommodation Booking
// @route   POST /api/accommodation-bookings
// @access  Private (Authenticated User)
const createBookingDraft = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      journeyId,
      placeId,
      accommodationName,
      accommodationAddress,
      accommodationPhone,
      accommodationImage,
      latitude,
      longitude,
      roomType,
      checkInDate,
      checkOutDate,
      numberOfRooms = 1,
      guests = { adults: 1, children: 0 },
      leadGuest = {},
      specialRequests = "",
    } = req.body;

    if (!placeId || !accommodationName) {
      res.status(400);
      throw new Error("Accommodation place identification and name are required.");
    }

    if (!checkInDate || !checkOutDate) {
      res.status(400);
      throw new Error("Check-in and Check-out dates are required.");
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      res.status(400);
      throw new Error("Invalid check-in or check-out date format.");
    }

    // Set time boundaries to normalize dates
    checkIn.setHours(12, 0, 0, 0);
    checkOut.setHours(11, 0, 0, 0);

    const diffMs = checkOut.getTime() - checkIn.getTime();
    const numberOfNights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    if (checkOut <= checkIn) {
      res.status(400);
      throw new Error("Check-out date must be strictly after the check-in date.");
    }

    const parsedRooms = Math.max(1, parseInt(numberOfRooms, 10) || 1);
    const parsedAdults = Math.max(1, parseInt(guests.adults, 10) || 1);
    const parsedChildren = Math.max(0, parseInt(guests.children, 10) || 0);

    // Validate room capacity against authoritative room definition
    const roomDef = findDemoRoomType(roomType);
    const maxCapacity = roomDef.maxTotalGuests * parsedRooms;
    const totalGuests = parsedAdults + parsedChildren;

    if (totalGuests > maxCapacity) {
      res.status(400);
      throw new Error(
        `Selected room capacity exceeded. ${parsedRooms} room(s) of type '${roomDef.title}' can accommodate at most ${maxCapacity} total guests (Requested: ${totalGuests}).`
      );
    }

    // Validate Lead Guest Contact Details
    const gName = (leadGuest.name || req.user.name || "").trim();
    const gPhone = (leadGuest.phone || req.user.phoneNumber || "").trim();
    const gEmail = (leadGuest.email || req.user.email || "").trim();

    if (!gName) {
      res.status(400);
      throw new Error("Lead guest full name is required.");
    }
    if (!gPhone || gPhone.length < 7) {
      res.status(400);
      throw new Error("A valid contact phone number is required.");
    }
    if (!gEmail || !gEmail.includes("@")) {
      res.status(400);
      throw new Error("A valid contact email address is required.");
    }

    // Server-side Authoritative Price Calculation (NEVER trust browser values)
    const pricePerNight = roomDef.pricePerNight;
    const roomSubtotal = pricePerNight * parsedRooms * numberOfNights;
    const taxAmount = Math.round(roomSubtotal * 0.12); // 12% GST
    const totalAmount = roomSubtotal + taxAmount;

    // Verify Journey association if provided
    let verifiedJourneyId = null;
    if (journeyId) {
      const journey = await Journey.findById(journeyId);
      if (journey && (journey.userId.toString() === userId.toString() || req.user.role === "admin")) {
        verifiedJourneyId = journey._id;
      }
    }

    // Unique booking reference
    const timestampPart = Date.now().toString().slice(-6);
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const bookingReference = `PIQ-ACC-${timestampPart}-${randomPart}`;

    const newBooking = new AccommodationBooking({
      userId,
      journeyId: verifiedJourneyId,
      bookingReference,
      placeId,
      accommodationName: accommodationName.trim(),
      accommodationAddress: (accommodationAddress || "").trim(),
      accommodationPhone: (accommodationPhone || "").trim(),
      accommodationImage: accommodationImage || roomDef.image,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      roomType: roomDef.type,
      roomTitle: roomDef.title,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfNights,
      numberOfRooms: parsedRooms,
      guests: {
        adults: parsedAdults,
        children: parsedChildren,
      },
      leadGuest: {
        name: gName,
        phone: gPhone,
        email: gEmail,
        specialRequests: (specialRequests || leadGuest.specialRequests || "").trim(),
      },
      pricing: {
        pricePerNight,
        roomSubtotal,
        taxAmount,
        totalAmount,
        currency: "INR",
      },
      bookingStatus: "PENDING_PAYMENT",
      paymentStatus: "PENDING",
      refundStatus: "NOT_APPLICABLE",
      isSimulatedData: true,
    });

    const savedBooking = await newBooking.save();

    return res.status(201).json({
      success: true,
      message: "Accommodation booking draft created successfully. Proceed to payment.",
      booking: savedBooking,
      pricingSummary: {
        pricePerNight,
        numberOfRooms: parsedRooms,
        numberOfNights,
        roomSubtotal,
        taxAmount,
        totalAmount,
        currency: "INR",
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Razorpay Order for Booking
// @route   POST /api/accommodation-bookings/:bookingId/create-order
// @access  Private (Authenticated User)
const createRazorpayOrder = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { bookingId } = req.params;

    const booking = await AccommodationBooking.findById(bookingId);

    if (!booking) {
      res.status(404);
      throw new Error("Accommodation booking not found.");
    }

    // Ownership check
    if (booking.userId.toString() !== userId.toString() && req.user.role !== "admin") {
      res.status(403);
      throw new Error("Unauthorized: You do not have permission to pay for this booking.");
    }

    // Check payment eligibility
    if (booking.bookingStatus === "CONFIRMED" && booking.paymentStatus === "PAID") {
      res.status(400);
      throw new Error("This booking has already been paid and confirmed.");
    }

    if (booking.bookingStatus === "CANCELLED") {
      res.status(400);
      throw new Error("This booking has been cancelled and cannot be paid.");
    }

    // Ensure Razorpay credentials are ready
    if (!isRazorpayConfigured()) {
      res.status(503);
      throw new Error(
        "Razorpay Test Mode credentials are missing or unconfigured on the server. Please verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
      );
    }

    const razorpay = getRazorpayClient();
    const keyId = getPublicKeyId();

    // Calculate amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(booking.pricing.totalAmount * 100);

    if (amountInPaise <= 0) {
      res.status(400);
      throw new Error("Authoritative booking amount must be greater than zero.");
    }

    // Sanitize receipt (Razorpay receipt max 40 chars)
    const receipt = `RCP_${booking.bookingReference.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 35)}`;

    const orderOptions = {
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        bookingId: booking._id.toString(),
        bookingReference: booking.bookingReference,
        placeId: booking.placeId,
        placeName: booking.accommodationName.slice(0, 30),
        roomType: booking.roomType,
      },
    };

    let order;
    try {
      order = await razorpay.orders.create(orderOptions);
    } catch (rzpErr) {
      console.error("Razorpay order creation error:", rzpErr);
      res.status(502);
      throw new Error(`Razorpay gateway error: ${rzpErr.error?.description || rzpErr.message || "Failed to create order"}`);
    }

    // Save order ID against the booking in MongoDB
    booking.razorpayOrderId = order.id;
    booking.paymentStatus = "PENDING";
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Razorpay order created successfully.",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      bookingReference: booking.bookingReference,
      bookingId: booking._id,
      leadGuest: booking.leadGuest,
      accommodationName: booking.accommodationName,
      roomTitle: booking.roomTitle,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay Payment Signature and Mark Booking Confirmed
// @route   POST /api/accommodation-bookings/:bookingId/verify-payment
// @access  Private (Authenticated User)
const verifyPayment = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { bookingId } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400);
      throw new Error("Missing required payment verification parameters: order ID, payment ID, or signature.");
    }

    const booking = await AccommodationBooking.findById(bookingId);

    if (!booking) {
      res.status(404);
      throw new Error("Accommodation booking not found.");
    }

    // Ownership check
    if (booking.userId.toString() !== userId.toString() && req.user.role !== "admin") {
      res.status(403);
      throw new Error("Unauthorized: You do not have permission to verify this booking.");
    }

    // Idempotency: If already confirmed with same payment ID, return confirmation
    if (
      booking.bookingStatus === "CONFIRMED" &&
      booking.paymentStatus === "PAID" &&
      booking.razorpayPaymentId === razorpay_payment_id
    ) {
      return res.status(200).json({
        success: true,
        message: "Payment already verified and reservation confirmed.",
        booking,
      });
    }

    // Validate that submitted order matches booking record
    if (booking.razorpayOrderId && booking.razorpayOrderId !== razorpay_order_id) {
      res.status(400);
      throw new Error("Submitted Razorpay Order ID does not match the saved order for this booking.");
    }

    const { key_secret } = getRazorpayCredentials();
    if (!key_secret) {
      res.status(503);
      throw new Error("Razorpay Key Secret is missing in backend environment.");
    }

    // Cryptographic Signature Verification
    // Razorpay standard: HMAC_SHA256(order_id + "|" + payment_id, secret)
    const signPayload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(signPayload)
      .digest("hex");

    let isSignatureValid = false;
    try {
      const expectedBuffer = Buffer.from(expectedSignature, "utf8");
      const submittedBuffer = Buffer.from(razorpay_signature, "utf8");
      if (expectedBuffer.length === submittedBuffer.length) {
        isSignatureValid = crypto.timingSafeEqual(expectedBuffer, submittedBuffer);
      }
    } catch (sigErr) {
      isSignatureValid = false;
    }

    if (!isSignatureValid) {
      booking.paymentStatus = "FAILED";
      await booking.save();
      res.status(400);
      throw new Error("Invalid payment signature. Payment verification failed.");
    }

    // Verify payment status with Razorpay API
    let paymentDetails = null;
    try {
      const razorpay = getRazorpayClient();
      paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);

      // Verify that payment amount and currency match authoritative booking
      const expectedAmountPaise = Math.round(booking.pricing.totalAmount * 100);
      if (paymentDetails.amount !== expectedAmountPaise) {
        booking.paymentStatus = "FAILED";
        await booking.save();
        res.status(400);
        throw new Error("Payment amount mismatch detected. Verification rejected.");
      }

      if (paymentDetails.currency !== "INR") {
        booking.paymentStatus = "FAILED";
        await booking.save();
        res.status(400);
        throw new Error("Payment currency mismatch detected.");
      }

      // If authorized but not captured, capture it
      if (paymentDetails.status === "authorized") {
        try {
          paymentDetails = await razorpay.payments.capture(
            razorpay_payment_id,
            expectedAmountPaise,
            "INR"
          );
        } catch (capErr) {
          console.warn("Payment auto-capture note:", capErr.message);
        }
      }
    } catch (fetchErr) {
      console.warn("Razorpay API fetch warning (signature verified):", fetchErr.message);
    }

    // Persist Confirmed State Idempotently
    booking.bookingStatus = "CONFIRMED";
    booking.paymentStatus = "PAID";
    booking.razorpayOrderId = razorpay_order_id;
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpaySignature = razorpay_signature;
    booking.paidAt = new Date();
    booking.refundStatus = "NOT_APPLICABLE";

    await booking.save();

    // Increment user's confirmed bookings counter safely
    try {
      await User.findByIdAndUpdate(userId, { $inc: { bookings: 1 } });
    } catch (uErr) {
      console.warn("Failed to increment user bookings counter:", uErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully. Accommodation booking confirmed!",
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Preview Cancellation Policy, Fees, and Refund Calculation
// @route   GET /api/accommodation-bookings/:bookingId/cancellation-preview
// @access  Private (Authenticated User)
const getCancellationPreview = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { bookingId } = req.params;

    const booking = await AccommodationBooking.findById(bookingId);
    if (!booking) {
      res.status(404);
      throw new Error("Accommodation booking not found.");
    }

    if (booking.userId.toString() !== userId.toString() && req.user.role !== "admin") {
      res.status(403);
      throw new Error("Unauthorized access.");
    }

    const checkInTime = new Date(booking.checkInDate).getTime();
    const nowTime = Date.now();
    const hoursUntilCheckIn = (checkInTime - nowTime) / (1000 * 60 * 60);

    const totalPaid = booking.paymentStatus === "PAID" ? booking.pricing.totalAmount : 0;
    let cancellationFee = 0;
    let eligibleRefund = 0;
    let policyTier = "";

    if (hoursUntilCheckIn >= 24) {
      cancellationFee = 0;
      eligibleRefund = totalPaid;
      policyTier = "Full Refund (More than 24 hours prior to check-in)";
    } else if (hoursUntilCheckIn > 0 && hoursUntilCheckIn < 24) {
      cancellationFee = Math.round(totalPaid * 0.5);
      eligibleRefund = totalPaid - cancellationFee;
      policyTier = "50% Cancellation Fee (Within 24 hours of check-in)";
    } else {
      cancellationFee = totalPaid;
      eligibleRefund = 0;
      policyTier = "Non-Refundable (On or after check-in date)";
    }

    return res.status(200).json({
      success: true,
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      accommodationName: booking.accommodationName,
      checkInDate: booking.checkInDate,
      hoursUntilCheckIn: Math.round(hoursUntilCheckIn * 10) / 10,
      totalPaid,
      cancellationFee,
      eligibleRefund,
      policyTier,
      isEligible: booking.bookingStatus !== "CANCELLED" && booking.refundStatus !== "REFUNDED",
      isTestMode: true,
      notice:
        "Demo Policy: In Razorpay Test Mode, eligible refunds will be initiated via the Razorpay Test API or recorded as a verified Test Mode Simulated Refund.",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel Booking & Process Refund (Razorpay Test Mode API or Simulated)
// @route   POST /api/accommodation-bookings/:bookingId/cancel
// @access  Private (Authenticated User)
const cancelBooking = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { bookingId } = req.params;
    const { reason = "Cancelled by pilgrim" } = req.body;

    const booking = await AccommodationBooking.findById(bookingId);
    if (!booking) {
      res.status(404);
      throw new Error("Accommodation booking not found.");
    }

    if (booking.userId.toString() !== userId.toString() && req.user.role !== "admin") {
      res.status(403);
      throw new Error("Unauthorized: You do not have permission to cancel this booking.");
    }

    if (booking.bookingStatus === "CANCELLED") {
      res.status(400);
      throw new Error("This booking has already been cancelled.");
    }

    // Calculate Refund Amount
    const checkInTime = new Date(booking.checkInDate).getTime();
    const nowTime = Date.now();
    const hoursUntilCheckIn = (checkInTime - nowTime) / (1000 * 60 * 60);

    const totalPaid = booking.paymentStatus === "PAID" ? booking.pricing.totalAmount : 0;
    let cancellationFee = 0;
    let refundAmount = 0;

    if (totalPaid > 0) {
      if (hoursUntilCheckIn >= 24) {
        cancellationFee = 0;
        refundAmount = totalPaid;
      } else if (hoursUntilCheckIn > 0 && hoursUntilCheckIn < 24) {
        cancellationFee = Math.round(totalPaid * 0.5);
        refundAmount = totalPaid - cancellationFee;
      } else {
        cancellationFee = totalPaid;
        refundAmount = 0;
      }
    }

    let refundType = "NOT_APPLICABLE";
    let refundId = null;
    let gatewayResponse = null;
    let finalRefundStatus = "NOT_APPLICABLE";

    if (totalPaid > 0 && refundAmount > 0) {
      finalRefundStatus = "REFUND_INITIATED";

      // Attempt Razorpay Test Mode Refund API
      if (booking.razorpayPaymentId && isRazorpayConfigured()) {
        try {
          const razorpay = getRazorpayClient();
          const refundPaise = Math.round(refundAmount * 100);

          const rzpRefund = await razorpay.payments.refund(booking.razorpayPaymentId, {
            amount: refundPaise,
            notes: {
              bookingReference: booking.bookingReference,
              reason: reason.slice(0, 30),
            },
          });

          refundType = "TEST_MODE_API";
          refundId = rzpRefund.id;
          gatewayResponse = rzpRefund;
          finalRefundStatus = "REFUNDED";
        } catch (rzpErr) {
          console.warn("Razorpay Test API refund fallback to simulated:", rzpErr.message);
          // Fallback to clearly labelled simulated refund in Test Mode
          refundType = "SIMULATED";
          refundId = `SIM_REF_${Date.now().toString().slice(-8)}`;
          finalRefundStatus = "REFUNDED";
          gatewayResponse = {
            note: "Test Mode Simulated Refund processed without live banking debit.",
            originalError: rzpErr.message,
          };
        }
      } else {
        refundType = "SIMULATED";
        refundId = `SIM_REF_${Date.now().toString().slice(-8)}`;
        finalRefundStatus = "REFUNDED";
      }
    } else if (totalPaid > 0 && refundAmount === 0) {
      finalRefundStatus = "NOT_APPLICABLE";
    }

    booking.bookingStatus = "CANCELLED";
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;
    booking.refundStatus = finalRefundStatus;
    booking.refundDetails = {
      refundId,
      amount: refundAmount,
      cancellationFee,
      refundReason: reason,
      refundType,
      refundedAt: refundAmount > 0 ? new Date() : null,
      gatewayResponse,
    };

    const updatedBooking = await booking.save();

    return res.status(200).json({
      success: true,
      message: `Booking cancelled successfully.${refundAmount > 0 ? ` Refund of ₹${refundAmount} processed (${refundType === "SIMULATED" ? "Test Mode Simulated" : "Razorpay Test API"}).` : " No refund applicable per policy."}`,
      booking: updatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Accommodation Bookings for Logged-In User
// @route   GET /api/accommodation-bookings/my-bookings
// @access  Private (Authenticated User)
const getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { journeyId, status } = req.query;

    const query = { userId };
    if (journeyId) {
      query.journeyId = journeyId;
    }
    if (status) {
      query.bookingStatus = status.toUpperCase();
    }

    const bookings = await AccommodationBooking.find(query)
      .populate("journeyId", "journeyDate returnDate status")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Single Booking Details
// @route   GET /api/accommodation-bookings/:bookingId
// @access  Private (Authenticated User)
const getBookingById = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { bookingId } = req.params;

    const booking = await AccommodationBooking.findById(bookingId).populate("journeyId");

    if (!booking) {
      res.status(404);
      throw new Error("Accommodation booking not found.");
    }

    if (booking.userId.toString() !== userId.toString() && req.user.role !== "admin") {
      res.status(403);
      throw new Error("Unauthorized access to booking.");
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Razorpay Webhook Handler
// @route   POST /api/accommodation-bookings/webhook
// @access  Public (Validated by Webhook HMAC Signature)
const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const webhookSignature = req.headers["x-razorpay-signature"];
    const webhookSecret = getWebhookSecret();

    if (!webhookSignature || !webhookSecret) {
      return res.status(400).json({ message: "Missing webhook signature or server secret." });
    }

    // Verify signature using raw body buffer
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    let isValid = false;
    try {
      const expBuf = Buffer.from(expectedSignature, "utf8");
      const sigBuf = Buffer.from(webhookSignature, "utf8");
      if (expBuf.length === sigBuf.length) {
        isValid = crypto.timingSafeEqual(expBuf, sigBuf);
      }
    } catch (whErr) {
      isValid = false;
    }

    if (!isValid) {
      console.warn("Razorpay Webhook signature verification failed.");
      return res.status(400).json({ message: "Invalid webhook signature." });
    }

    const event = req.body;
    const eventType = event.event;

    // Process Supported Events Idempotently
    if (eventType === "payment.captured") {
      const payment = event.payload?.payment?.entity;
      if (payment && payment.order_id) {
        const booking = await AccommodationBooking.findOne({ razorpayOrderId: payment.order_id });
        if (booking && booking.paymentStatus !== "PAID") {
          booking.paymentStatus = "PAID";
          booking.bookingStatus = "CONFIRMED";
          booking.razorpayPaymentId = payment.id;
          booking.paidAt = new Date();
          await booking.save();
        }
      }
    } else if (eventType === "payment.failed") {
      const payment = event.payload?.payment?.entity;
      if (payment && payment.order_id) {
        const booking = await AccommodationBooking.findOne({ razorpayOrderId: payment.order_id });
        if (booking && booking.paymentStatus !== "PAID") {
          booking.paymentStatus = "FAILED";
          await booking.save();
        }
      }
    } else if (eventType === "refund.processed") {
      const refund = event.payload?.refund?.entity;
      if (refund && refund.payment_id) {
        const booking = await AccommodationBooking.findOne({ razorpayPaymentId: refund.payment_id });
        if (booking) {
          booking.refundStatus = "REFUNDED";
          booking.refundDetails.refundId = refund.id;
          booking.refundDetails.refundedAt = new Date();
          await booking.save();
        }
      }
    }

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return res.status(500).json({ message: "Webhook processing error" });
  }
};

module.exports = {
  getRazorpayConfig,
  getAccommodationRooms,
  createBookingDraft,
  createRazorpayOrder,
  verifyPayment,
  getCancellationPreview,
  cancelBooking,
  getMyBookings,
  getBookingById,
  handleRazorpayWebhook,
};
