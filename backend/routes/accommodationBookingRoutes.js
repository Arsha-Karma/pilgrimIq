const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
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
} = require("../controllers/accommodationBookingController");

// Public endpoints
router.get("/config", getRazorpayConfig);
router.get("/rooms/:placeId", getAccommodationRooms);
router.post("/webhook", handleRazorpayWebhook);

// Protected endpoints (Requires user authentication)
router.get("/my-bookings", protect, getMyBookings);
router.post("/", protect, createBookingDraft);
router.get("/:bookingId", protect, getBookingById);
router.get("/:bookingId/cancellation-preview", protect, getCancellationPreview);
router.post("/:bookingId/create-order", protect, createRazorpayOrder);
router.post("/:bookingId/verify-payment", protect, verifyPayment);
router.post("/:bookingId/cancel", protect, cancelBooking);

module.exports = router;
