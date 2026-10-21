import { fetchAPI, getHeaders } from "./api";

/**
 * Loads the Razorpay Standard Checkout SDK dynamically in the browser
 */
export const loadRazorpayCheckoutScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.error("Failed to load Razorpay Checkout script.");
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

/**
 * Fetch Razorpay Public Configuration
 */
export const apiGetRazorpayConfig = async () => {
  return fetchAPI("/accommodation-bookings/config", {
    method: "GET",
    headers: getHeaders(),
  });
};

/**
 * Fetch Demo Room Inventory for an Accommodation Place
 */
export const apiGetAccommodationRooms = async (placeId, placeName = "") => {
  const query = placeName ? `?name=${encodeURIComponent(placeName)}` : "";
  return fetchAPI(`/accommodation-bookings/rooms/${placeId}${query}`, {
    method: "GET",
    headers: getHeaders(),
  });
};

/**
 * Draft a new Accommodation Booking
 */
export const apiCreateBookingDraft = async (bookingData, token) => {
  return fetchAPI("/accommodation-bookings", {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(bookingData),
  });
};

/**
 * Create Razorpay Order on Backend
 */
export const apiCreateRazorpayOrder = async (bookingId, token) => {
  return fetchAPI(`/accommodation-bookings/${bookingId}/create-order`, {
    method: "POST",
    headers: getHeaders(token),
  });
};

/**
 * Verify Payment Signature on Backend
 */
export const apiVerifyPayment = async (bookingId, paymentPayload, token) => {
  return fetchAPI(`/accommodation-bookings/${bookingId}/verify-payment`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(paymentPayload),
  });
};

/**
 * Get User's Accommodation Bookings
 */
export const apiGetMyAccommodationBookings = async (token, queryParams = {}) => {
  const params = new URLSearchParams();
  if (queryParams.journeyId) params.append("journeyId", queryParams.journeyId);
  if (queryParams.status) params.append("status", queryParams.status);
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  return fetchAPI(`/accommodation-bookings/my-bookings${queryStr}`, {
    method: "GET",
    headers: getHeaders(token),
  });
};

/**
 * Get Single Accommodation Booking
 */
export const apiGetAccommodationBookingById = async (bookingId, token) => {
  return fetchAPI(`/accommodation-bookings/${bookingId}`, {
    method: "GET",
    headers: getHeaders(token),
  });
};

/**
 * Get Cancellation Policy & Refund Preview
 */
export const apiGetCancellationPreview = async (bookingId, token) => {
  return fetchAPI(`/accommodation-bookings/${bookingId}/cancellation-preview`, {
    method: "GET",
    headers: getHeaders(token),
  });
};

/**
 * Cancel an Accommodation Booking
 */
export const apiCancelAccommodationBooking = async (bookingId, reason, token) => {
  return fetchAPI(`/accommodation-bookings/${bookingId}/cancel`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ reason }),
  });
};
