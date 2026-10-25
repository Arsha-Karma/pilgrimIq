import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FiX,
  FiCalendar,
  FiUsers,
  FiCreditCard,
  FiCheckCircle,
  FiAlertCircle,
  FiShield,
  FiInfo,
  FiMapPin,
  FiHome,
  FiPhone,
  FiMail,
} from "react-icons/fi";
import {
  loadRazorpayCheckoutScript,
  apiGetAccommodationRooms,
  apiCreateBookingDraft,
  apiCreateRazorpayOrder,
  apiVerifyPayment,
} from "../services/accommodationBookingService";
import { apiGetMyJourneys } from "../services/journeyService";
import { apiGetProfile } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./AccommodationBookingModal.css";

const AccommodationBookingModal = ({
  isOpen,
  onClose,
  place,
  initialJourneyId = null,
  initialCheckInDate = null,
  initialCheckOutDate = null,
  onBookingConfirmed,
}) => {
  const { user, token } = useAuth();

  // State: Room Inventory & Loading
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState("");

  // State: Journeys list for association
  const [journeys, setJourneys] = useState([]);
  const [selectedJourneyId, setSelectedJourneyId] = useState(initialJourneyId || "");

  // Form State
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  const [checkInDate, setCheckInDate] = useState(todayStr);
  const [checkOutDate, setCheckOutDate] = useState(tomorrowStr);
  const [numberOfRooms, setNumberOfRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const [leadName, setLeadName] = useState(user?.name || "");
  const [leadPhone, setLeadPhone] = useState(user?.phone || user?.phoneNumber || "");
  const [leadEmail, setLeadEmail] = useState(user?.email || "");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSpecialRequestFocused, setIsSpecialRequestFocused] = useState(false);

  // Sync planned journey dates when passed
  useEffect(() => {
    if (initialCheckInDate) {
      const formattedIn = initialCheckInDate.includes("T") ? initialCheckInDate.split("T")[0] : initialCheckInDate;
      setCheckInDate(formattedIn);
    }
    if (initialCheckOutDate) {
      const formattedOut = initialCheckOutDate.includes("T") ? initialCheckOutDate.split("T")[0] : initialCheckOutDate;
      setCheckOutDate(formattedOut);
    }
  }, [initialCheckInDate, initialCheckOutDate, isOpen]);

  // Validation field tracking onFocus/onBlur
  const [touchedFields, setTouchedFields] = useState({});

  const handleFieldFocus = (field) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const handleFieldBlur = (field) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  // Processing & Payment State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Confirmation Voucher State
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Fetch verified user details directly from database profile
  useEffect(() => {
    const fetchFreshProfile = async () => {
      if (token && isOpen) {
        try {
          const profile = await apiGetProfile(token);
          if (profile) {
            if (profile.name) setLeadName(profile.name);
            if (profile.email) setLeadEmail(profile.email);
            const dbPhone = profile.phone || profile.phoneNumber || profile.emergencyContact?.phone || "";
            if (dbPhone) setLeadPhone(dbPhone);
          }
        } catch (pErr) {
          console.warn("Could not fetch user profile for accommodation booking:", pErr);
        }
      }
    };
    fetchFreshProfile();
  }, [token, isOpen]);

  // Sync fallback user details from context
  useEffect(() => {
    if (user) {
      if (!leadName && user.name) setLeadName(user.name);
      if (!leadPhone && (user.phone || user.phoneNumber)) setLeadPhone(user.phone || user.phoneNumber);
      if (!leadEmail && user.email) setLeadEmail(user.email);
    }
  }, [user, leadName, leadPhone, leadEmail]);

  // Load Rooms and User Journeys
  const loadRoomsAndJourneys = useCallback(async () => {
    if (!place) return;
    try {
      setLoadingRooms(true);
      setErrorMessage("");

      const placeId = place.externalPlaceId || place.serviceId || place._id || "place_acc_default";
      const roomData = await apiGetAccommodationRooms(placeId, place.name);
      if (roomData && Array.isArray(roomData.rooms) && roomData.rooms.length > 0) {
        setRooms(roomData.rooms);
        setSelectedRoomType(roomData.rooms[0].type);
      }

      if (token) {
        try {
          const journeyData = await apiGetMyJourneys(token);
          if (journeyData && Array.isArray(journeyData.journeys)) {
            setJourneys(journeyData.journeys);
            if (initialJourneyId) {
              const matched = journeyData.journeys.find((j) => j._id === initialJourneyId);
              if (matched) {
                if (matched.journeyDate) {
                  setCheckInDate(new Date(matched.journeyDate).toISOString().split("T")[0]);
                }
                if (matched.returnDate) {
                  setCheckOutDate(new Date(matched.returnDate).toISOString().split("T")[0]);
                }
              }
            }
          }
        } catch (jErr) {
          console.warn("Could not load user journeys for booking modal:", jErr);
        }
      }
    } catch (err) {
      console.error("Failed to load accommodation rooms:", err);
      setErrorMessage(err.message || "Failed to load accommodation room inventory.");
    } finally {
      setLoadingRooms(false);
    }
  }, [place, token, initialJourneyId]);

  useEffect(() => {
    if (isOpen) {
      setConfirmedBooking(null);
      setErrorMessage("");
      loadRoomsAndJourneys();
    }
  }, [isOpen, loadRoomsAndJourneys]);

  // Handle Journey selection change to auto-align travel dates
  const handleJourneyChange = (jId) => {
    setSelectedJourneyId(jId);
    if (!jId) return;
    const selected = journeys.find((j) => j._id === jId);
    if (selected) {
      if (selected.journeyDate) {
        setCheckInDate(new Date(selected.journeyDate).toISOString().split("T")[0]);
      }
      if (selected.returnDate) {
        setCheckOutDate(new Date(selected.returnDate).toISOString().split("T")[0]);
      }
    }
  };

  // Selected Room Object
  const selectedRoom = useMemo(() => {
    return rooms.find((r) => r.type === selectedRoomType) || rooms[0] || null;
  }, [rooms, selectedRoomType]);

  // Live Price Calculation Preview (Backend remains authoritative)
  const calculationPreview = useMemo(() => {
    if (!checkInDate || !checkOutDate || !selectedRoom) {
      return { nights: 1, subtotal: 0, tax: 0, total: 0 };
    }

    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diff = end.getTime() - start.getTime();
    const nights = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));

    const pricePerNight = selectedRoom.pricePerNight || 0;
    const subtotal = pricePerNight * numberOfRooms * nights;
    const tax = Math.round(subtotal * 0.12);
    const total = subtotal + tax;

    return { nights, pricePerNight, subtotal, tax, total };
  }, [checkInDate, checkOutDate, selectedRoom, numberOfRooms]);

  // Handle Checkout & Server Verification
  const handleProceedToPayment = async () => {
    if (!token) {
      setErrorMessage("Please log in to PilgrimIQ to book accommodation.");
      return;
    }

    if (!selectedRoom) {
      setErrorMessage("Please select a room type.");
      return;
    }

    if (!leadName.trim()) {
      setErrorMessage("Please provide the lead guest name.");
      return;
    }

    if (!leadPhone.trim() || leadPhone.trim().length < 7) {
      setErrorMessage("Please provide a valid contact phone number.");
      return;
    }

    if (!leadEmail.trim() || !leadEmail.includes("@")) {
      setErrorMessage("Please provide a valid contact email.");
      return;
    }

    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      setErrorMessage("Check-out date must be after the check-in date.");
      return;
    }

    if (specialRequests.trim().length > 0) {
      if (!/^[a-zA-Z\s]+$/.test(specialRequests.trim())) {
        setErrorMessage("Special requests must contain only letters and spaces.");
        return;
      }
      const lettersOnly = specialRequests.replace(/[^a-zA-Z]/g, "");
      if (lettersOnly.length < 5) {
        setErrorMessage("Special requests must contain at least 5 letters.");
        return;
      }
    }

    try {
      setIsProcessing(true);
      setErrorMessage("");
      setProcessingStep("Verifying room availability & calculating secure total...");

      // 1. Load Razorpay SDK
      const sdkLoaded = await loadRazorpayCheckoutScript();
      if (!sdkLoaded) {
        throw new Error("Unable to load Razorpay Checkout SDK. Please check your internet connection.");
      }

      // 2. Draft Booking on Backend (Server Authoritative Price Calculation)
      const placeId = place.externalPlaceId || place.serviceId || place._id || `place_${Date.now()}`;
      const bookingPayload = {
        journeyId: selectedJourneyId || null,
        placeId,
        accommodationName: place.name || "Pilgrim Accommodation",
        accommodationAddress: place.address || "",
        accommodationPhone: place.contact?.phone || place.phone || "",
        accommodationImage: place.image || selectedRoom.image,
        latitude: place.latitude || null,
        longitude: place.longitude || null,
        roomType: selectedRoom.type,
        checkInDate,
        checkOutDate,
        numberOfRooms: parseInt(numberOfRooms, 10),
        guests: {
          adults: parseInt(adults, 10),
          children: parseInt(children, 10),
        },
        leadGuest: {
          name: leadName.trim(),
          phone: leadPhone.trim(),
          email: leadEmail.trim(),
          specialRequests: specialRequests.trim(),
        },
      };

      const draftRes = await apiCreateBookingDraft(bookingPayload, token);
      if (!draftRes || !draftRes.booking) {
        throw new Error(draftRes?.message || "Failed to create booking draft on server.");
      }

      const booking = draftRes.booking;

      // 3. Create Razorpay Order on Backend
      setProcessingStep("Preparing booking order...");
      const orderRes = await apiCreateRazorpayOrder(booking._id, token);

      if (!orderRes || !orderRes.orderId) {
        throw new Error(orderRes?.message || "Failed to create Razorpay payment order.");
      }

      const { orderId, amount, currency, keyId } = orderRes;

      setProcessingStep("Opening checkout...");

      // 4. Configure Razorpay Standard Checkout
      const razorpayOptions = {
        key: keyId,
        amount: amount,
        currency: currency || "INR",
        name: "PilgrimIQ Accommodations",
        description: `${selectedRoom.title} • ${place.name}`,
        image: "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?q=80&w=200&auto=format&fit=crop",
        order_id: orderId,
        prefill: {
          name: leadName.trim(),
          email: leadEmail.trim(),
          contact: leadPhone.trim(),
        },
        notes: {
          bookingReference: booking.bookingReference,
          placeName: place.name,
          roomType: selectedRoom.type,
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setProcessingStep("");
            setErrorMessage("Payment was dismissed. Your booking draft remains saved. You may retry payment whenever you are ready.");
          },
        },
        handler: async (response) => {
          try {
            setProcessingStep("Cryptographically verifying payment with server...");
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };

            const verifyRes = await apiVerifyPayment(booking._id, verifyPayload, token);

            if (verifyRes && verifyRes.success && verifyRes.booking) {
              setConfirmedBooking(verifyRes.booking);
              if (onBookingConfirmed) {
                onBookingConfirmed(verifyRes.booking);
              }
            } else {
              throw new Error(verifyRes?.message || "Payment verification could not be confirmed by the server.");
            }
          } catch (vErr) {
            console.error("Payment verification failure:", vErr);
            setErrorMessage(vErr.message || "Payment verification failed. Please contact support.");
          } finally {
            setIsProcessing(false);
            setProcessingStep("");
          }
        },
      };

      const rzpInstance = new window.Razorpay(razorpayOptions);

      rzpInstance.on("payment.failed", (failedRes) => {
        console.error("Razorpay payment failed:", failedRes.error);
        setIsProcessing(false);
        setProcessingStep("");
        setErrorMessage(
          `Payment failed: ${failedRes.error?.description || "Transaction was declined"}. Reason: ${failedRes.error?.reason || "Unknown"}`
        );
      });

      rzpInstance.open();
    } catch (err) {
      console.error("Booking error:", err);
      setErrorMessage(err.message || "An error occurred while preparing your booking.");
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  if (!isOpen || !place) return null;

  return (
    <div className="acc-booking-overlay">
      <div className="acc-booking-modal">
        {/* MODAL HEADER */}
        <div className="acc-booking-header">
          <div className="acc-header-title-group">
            <h2>{confirmedBooking ? "Booking Confirmation Voucher" : `Book Stay at ${place.name}`}</h2>
            <p className="acc-header-subtitle">
              <FiMapPin size={13} /> {place.address || "Pilgrimage Center Vicinity"}
            </p>
          </div>

          <button
            type="button"
            className="acc-close-btn"
            onClick={onClose}
            aria-label="Close"
            disabled={isProcessing}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="acc-booking-body">
          {errorMessage && (
            <div className="acc-alert-error">
              <FiAlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* VIEW A: CONFIRMED BOOKING VOUCHER (Rendered in front at the top) */}
          {confirmedBooking ? (
            <div className="acc-confirmation-view" style={{ paddingTop: "8px" }}>
              <div className="acc-voucher-card" style={{ marginTop: 0 }}>
                <div className="acc-voucher-header">
                  <div>
                    <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Booking Reference</span>
                    <div className="acc-voucher-ref">#{confirmedBooking.bookingReference}</div>
                  </div>
                  <span className="acc-voucher-status-pill" style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" }}>
                    ✓ Confirmed & Guaranteed
                  </span>
                </div>

                <div className="acc-voucher-grid">
                  <div className="acc-voucher-field">
                    <span className="label">Accommodation</span>
                    <p className="val">{confirmedBooking.accommodationName}</p>
                  </div>

                  <div className="acc-voucher-field">
                    <span className="label">Room Category</span>
                    <p className="val">{confirmedBooking.roomTitle} ({confirmedBooking.numberOfRooms} Room)</p>
                  </div>

                  <div className="acc-voucher-field">
                    <span className="label">Check-In Date</span>
                    <p className="val">{new Date(confirmedBooking.checkInDate).toLocaleDateString()}</p>
                  </div>

                  <div className="acc-voucher-field">
                    <span className="label">Check-Out Date</span>
                    <p className="val">{new Date(confirmedBooking.checkOutDate).toLocaleDateString()} ({confirmedBooking.numberOfNights} Night(s))</p>
                  </div>

                  <div className="acc-voucher-field">
                    <span className="label">Lead Pilgrim</span>
                    <p className="val">{confirmedBooking.leadGuest?.name} ({confirmedBooking.leadGuest?.phone})</p>
                  </div>

                  <div className="acc-voucher-field">
                    <span className="label">Contact Email</span>
                    <p className="val">{confirmedBooking.leadGuest?.email}</p>
                  </div>
                </div>

                <div className="acc-voucher-total-row">
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Total Paid (Inc. 12% GST):</span>
                  </div>
                  <strong>₹{confirmedBooking.pricing?.totalAmount?.toLocaleString()} INR</strong>
                </div>
              </div>

              <div className="acc-policy-box" style={{ textAlign: "left", marginBottom: "16px" }}>
                <strong>Cancellation Policy:</strong>
                <p style={{ margin: "4px 0 0 0" }}>
                  {confirmedBooking.cancellationPolicy?.description ||
                    "Free cancellation up to 24 hours prior to check-in. 50% refund within 24 hours."}
                </p>
              </div>
            </div>
          ) : (
            /* VIEW B: BOOKING & ROOM SELECTION FORM */
            <>
              {/* 1. ROOM TYPE SELECTION */}
              <h3 className="acc-rooms-section-title">
                <FiHome size={16} /> Select Room Category
              </h3>

              {loadingRooms ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#64748b" }}>
                  Loading room inventory...
                </div>
              ) : (
                <div className="acc-rooms-grid">
                  {rooms.map((room) => {
                    const isSelected = selectedRoomType === room.type;
                    return (
                      <div
                        key={room.type}
                        className={`acc-room-card ${isSelected ? "selected" : ""}`}
                        onClick={() => setSelectedRoomType(room.type)}
                      >
                        {isSelected && <span className="acc-room-card-selected-tag">Selected</span>}
                        <img src={room.image} alt={room.title} className="acc-room-thumb" />
                        <h4>{room.title}</h4>
                        <div className="acc-room-price">
                          ₹{room.pricePerNight?.toLocaleString()} <small>/ night</small>
                        </div>
                        <div className="acc-room-capacity">
                          👥 Max {room.maxTotalGuests} guests ({room.maxAdults} adults, {room.maxChildren} children)
                        </div>
                        <div className="acc-room-amenities">
                          {room.amenities?.slice(0, 3).map((a, i) => (
                            <span key={i} className="acc-room-amenity-tag">✓ {a}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. JOURNEY ASSOCIATION & STAY DATES */}
              <h3 className="acc-rooms-section-title">
                <FiCalendar size={16} /> Stay Dates & Pilgrimage Itinerary
              </h3>

              <div className="acc-form-grid cols-3">
                <div className="acc-form-group">
                  <label>Associate with Journey</label>
                  <select
                    value={selectedJourneyId}
                    onChange={(e) => handleJourneyChange(e.target.value)}
                  >
                    <option value="">Standalone / Unassigned Journey</option>
                    {journeys.map((j) => (
                      <option key={j._id} value={j._id}>
                        {j.pilgrimageCenterId?.name || "Pilgrimage"} ({new Date(j.journeyDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="acc-form-group">
                  <label>Check-In Date *</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={checkInDate}
                    onFocus={() => handleFieldFocus("checkInDate")}
                    onBlur={() => handleFieldBlur("checkInDate")}
                    onChange={(e) => setCheckInDate(e.target.value)}
                  />
                  {touchedFields.checkInDate && !checkInDate && (
                    <span className="acc-field-error-msg">* This field is required</span>
                  )}
                </div>

                <div className="acc-form-group">
                  <label>Check-Out Date *</label>
                  <input
                    type="date"
                    min={checkInDate || todayStr}
                    value={checkOutDate}
                    onFocus={() => handleFieldFocus("checkOutDate")}
                    onBlur={() => handleFieldBlur("checkOutDate")}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                  />
                  {touchedFields.checkOutDate && !checkOutDate && (
                    <span className="acc-field-error-msg">* This field is required</span>
                  )}
                </div>
              </div>

              {/* 3. ROOMS & GUEST COUNT */}
              <div className="acc-form-grid cols-3">
                <div className="acc-form-group">
                  <label>Number of Rooms *</label>
                  <select
                    value={numberOfRooms}
                    onChange={(e) => setNumberOfRooms(parseInt(e.target.value, 10))}
                  >
                    <option value={1}>1 Room</option>
                    <option value={2}>2 Rooms</option>
                    <option value={3}>3 Rooms</option>
                    <option value={4}>4 Rooms</option>
                  </select>
                </div>

                <div className="acc-form-group">
                  <label>Adults (12+ Yrs) *</label>
                  <select
                    value={adults}
                    onChange={(e) => setAdults(parseInt(e.target.value, 10))}
                  >
                    <option value={1}>1 Adult</option>
                    <option value={2}>2 Adults</option>
                    <option value={3}>3 Adults</option>
                    <option value={4}>4 Adults</option>
                    <option value={6}>6 Adults</option>
                    <option value={8}>8 Adults</option>
                  </select>
                </div>

                <div className="acc-form-group">
                  <label>Children (0-11 Yrs)</label>
                  <select
                    value={children}
                    onChange={(e) => setChildren(parseInt(e.target.value, 10))}
                  >
                    <option value={0}>0 Children</option>
                    <option value={1}>1 Child</option>
                    <option value={2}>2 Children</option>
                    <option value={3}>3 Children</option>
                  </select>
                </div>
              </div>

              {/* 4. LEAD GUEST CONTACT DETAILS (Fetched from database & non-editable) */}
              <h3 className="acc-rooms-section-title">
                <FiUsers size={16} /> Lead Guest Contact Details
              </h3>

              <div className="acc-form-grid">
                <div className="acc-form-group">
                  <label>Lead Guest Name *</label>
                  <input
                    type="text"
                    readOnly
                    value={leadName}
                    className="acc-input-readonly"
                    placeholder="Guest full name"
                    onFocus={() => handleFieldFocus("leadName")}
                    onBlur={() => handleFieldBlur("leadName")}
                  />
                  {touchedFields.leadName && !leadName && (
                    <span className="acc-field-error-msg">* This field is required</span>
                  )}
                </div>

                <div className="acc-form-group">
                  <label>Contact Phone Number *</label>
                  <input
                    type="tel"
                    readOnly
                    value={leadPhone}
                    className="acc-input-readonly"
                    placeholder="Fetched from user profile"
                    onFocus={() => handleFieldFocus("leadPhone")}
                    onBlur={() => handleFieldBlur("leadPhone")}
                  />
                  {(!leadPhone || (touchedFields.leadPhone && !leadPhone)) && (
                    <span className="acc-field-error-msg" style={{ color: leadPhone ? "#64748b" : "#dc2626" }}>
                      {leadPhone ? "Fetched from database profile (non-editable)" : "* Phone number is required in profile."}
                    </span>
                  )}
                </div>

                <div className="acc-form-group">
                  <label>Contact Email *</label>
                  <input
                    type="email"
                    readOnly
                    value={leadEmail}
                    className="acc-input-readonly"
                    placeholder="Email for booking voucher"
                    onFocus={() => handleFieldFocus("leadEmail")}
                    onBlur={() => handleFieldBlur("leadEmail")}
                  />
                  {touchedFields.leadEmail && !leadEmail && (
                    <span className="acc-field-error-msg">* This field is required</span>
                  )}
                </div>

                <div className="acc-form-group">
                  <label>Special Requests (Optional)</label>
                  <input
                    type="text"
                    placeholder="Ground floor, early check-in, etc."
                    value={specialRequests}
                    onFocus={() => {
                      handleFieldFocus("specialRequests");
                      setIsSpecialRequestFocused(true);
                    }}
                    onBlur={() => {
                      handleFieldBlur("specialRequests");
                      setIsSpecialRequestFocused(false);
                    }}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                  />
                  {isSpecialRequestFocused && (
                    <span style={{ fontSize: "12px", color: "#2563eb", marginTop: "4px", display: "block", fontWeight: "600" }}>
                      ℹ️ Only letters and spaces are allowed (minimum 5 letters required).
                    </span>
                  )}
                  {specialRequests.trim().length > 0 && !/^[a-zA-Z\s]+$/.test(specialRequests.trim()) && (
                    <span className="acc-field-error-msg">* Only letters and spaces are allowed</span>
                  )}
                  {specialRequests.trim().length > 0 && /^[a-zA-Z\s]+$/.test(specialRequests.trim()) && specialRequests.replace(/[^a-zA-Z]/g, "").length < 5 && (
                    <span className="acc-field-error-msg">* At least 5 letters are required</span>
                  )}
                </div>
              </div>

              {/* 5. PRICE BREAKDOWN & SUMMARY */}
              <div className="acc-summary-box">
                <div className="acc-summary-row">
                  <span>Room Rate:</span>
                  <span>₹{calculationPreview.pricePerNight?.toLocaleString()} × {numberOfRooms} Room(s) × {calculationPreview.nights} Night(s)</span>
                </div>
                <div className="acc-summary-row">
                  <span>Room Subtotal:</span>
                  <span>₹{calculationPreview.subtotal?.toLocaleString()}</span>
                </div>
                <div className="acc-summary-row">
                  <span>Taxes & GST (12%):</span>
                  <span>₹{calculationPreview.tax?.toLocaleString()}</span>
                </div>
                <div className="acc-summary-row total">
                  <span>Authoritative Total Payable:</span>
                  <span className="price-tag">₹{calculationPreview.total?.toLocaleString()} INR</span>
                </div>
              </div>

              <div className="acc-policy-box">
                <strong>Cancellation Policy:</strong> Free cancellation with full refund up to 24 hours prior to check-in. 50% refund within 24 hours of check-in date.
              </div>
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="acc-booking-footer">
          {confirmedBooking ? (
            <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="acc-btn-pay"
                onClick={onClose}
              >
                Close Voucher
              </button>
            </div>
          ) : (
            <>
              <div className="acc-footer-total">
                Total Payable:
                <strong>₹{calculationPreview.total?.toLocaleString()} INR</strong>
              </div>

              <div className="acc-btn-group">
                <button
                  type="button"
                  className="acc-btn-cancel"
                  onClick={onClose}
                  disabled={isProcessing}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="acc-btn-pay"
                  onClick={handleProceedToPayment}
                  disabled={isProcessing}
                >
                  <FiCreditCard size={16} />
                  {isProcessing ? processingStep || "Processing..." : "Confirm & Pay"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccommodationBookingModal;
