const mongoose = require("mongoose");

const accommodationBookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Authenticated User ID is required"],
      index: true,
    },
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Journey",
      default: null,
      index: true,
    },
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    placeId: {
      type: String,
      required: [true, "Accommodation Place ID is required"],
    },
    accommodationName: {
      type: String,
      required: [true, "Accommodation name is required"],
      trim: true,
    },
    accommodationAddress: {
      type: String,
      default: "",
    },
    accommodationPhone: {
      type: String,
      default: "",
    },
    accommodationImage: {
      type: String,
      default: "",
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    roomType: {
      type: String,
      required: [true, "Room type identifier is required"],
    },
    roomTitle: {
      type: String,
      required: [true, "Room title is required"],
    },
    checkInDate: {
      type: Date,
      required: [true, "Check-in date is required"],
    },
    checkOutDate: {
      type: Date,
      required: [true, "Check-out date is required"],
    },
    numberOfNights: {
      type: Number,
      required: true,
      min: [1, "Stay must be at least 1 night"],
    },
    numberOfRooms: {
      type: Number,
      required: true,
      min: [1, "At least 1 room must be booked"],
      default: 1,
    },
    guests: {
      adults: {
        type: Number,
        required: true,
        min: [1, "At least 1 adult guest is required"],
        default: 1,
      },
      children: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    leadGuest: {
      name: {
        type: String,
        required: [true, "Lead guest name is required"],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, "Contact phone number is required"],
        trim: true,
      },
      email: {
        type: String,
        required: [true, "Contact email is required"],
        trim: true,
      },
      specialRequests: {
        type: String,
        default: "",
      },
    },
    pricing: {
      pricePerNight: {
        type: Number,
        required: true,
      },
      roomSubtotal: {
        type: Number,
        required: true,
      },
      taxAmount: {
        type: Number,
        required: true,
        default: 0,
      },
      totalAmount: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: "INR",
      },
    },
    razorpayOrderId: {
      type: String,
      default: null,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
      index: true,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    bookingStatus: {
      type: String,
      enum: ["PENDING_PAYMENT", "CONFIRMED", "CANCELLED"],
      default: "PENDING_PAYMENT",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
      index: true,
    },
    refundStatus: {
      type: String,
      enum: ["NOT_APPLICABLE", "ELIGIBLE", "REFUND_INITIATED", "REFUNDED", "REFUND_FAILED"],
      default: "NOT_APPLICABLE",
      index: true,
    },
    refundDetails: {
      refundId: { type: String, default: null },
      amount: { type: Number, default: 0 },
      cancellationFee: { type: Number, default: 0 },
      refundReason: { type: String, default: "" },
      refundType: {
        type: String,
        enum: ["NOT_APPLICABLE", "TEST_MODE_API", "SIMULATED"],
        default: "NOT_APPLICABLE",
      },
      refundedAt: { type: Date, default: null },
      gatewayResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    cancellationPolicy: {
      description: {
        type: String,
        default:
          "Demo Policy: 100% refund up to 24 hours prior to check-in. 50% refund within 24 hours. Non-refundable on or after check-in date.",
      },
      freeCancellationHours: {
        type: Number,
        default: 24,
      },
    },
    paidAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: "",
    },
    isSimulatedData: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AccommodationBooking", accommodationBookingSchema);
