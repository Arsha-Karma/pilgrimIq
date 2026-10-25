import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import UserSidebar from "../components/UserSidebar";
import { useAuth } from "../context/AuthContext";
import { apiGetMyJourneys, apiGetJourneyBookings } from "../services/journeyService";
import {
  apiGetMyAccommodationBookings,
  apiGetCancellationPreview,
  apiCancelAccommodationBooking,
} from "../services/accommodationBookingService";
import AccommodationBookingModal from "../components/AccommodationBookingModal";
import "../styles/Bookings.css";
import {
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiEye,
  FiPhone,
  FiAlertCircle,
  FiNavigation,
  FiX,
  FiGrid,
  FiStar,
  FiExternalLink,
  FiCreditCard,
  FiCheckCircle,
  FiHome,
  FiSlash,
  FiShield,
  FiPrinter,
} from "react-icons/fi";

function Bookings() {
  const { journeyId: routeJourneyId } = useParams();
  const [searchParams] = useSearchParams();
  const queryJourneyId = searchParams.get("journeyId");
  const selectedJourneyId = routeJourneyId || queryJourneyId;

  const navigate = useNavigate();
  const { token } = useAuth();

  // Top Tabs: "accommodation" (Default: Paid / Stored Bookings) vs "recommendations" (Saved Map Places)
  const initialTab = selectedJourneyId ? "recommendations" : "accommodation";
  const [activeMainTab, setActiveMainTab] = useState(initialTab);

  // State: Accommodation Bookings (Saved in MongoDB Atlas)
  const [accommodationBookings, setAccommodationBookings] = useState([]);
  const [loadingAccBookings, setLoadingAccBookings] = useState(true);
  const [accBookingsError, setAccBookingsError] = useState("");

  // Modal State for Booking Voucher
  const [selectedVoucherBooking, setSelectedVoucherBooking] = useState(null);

  // Modal State for Cancellation Preview
  const [cancelTargetBooking, setCancelTargetBooking] = useState(null);
  const [cancelPreview, setCancelPreview] = useState(null);
  const [loadingCancelPreview, setLoadingCancelPreview] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // State: Direct Booking Modal Trigger from Recommendation Cards
  const [bookingModalTargetPlace, setBookingModalTargetPlace] = useState(null);

  // State: Journeys list for selector
  const [journeys, setJourneys] = useState([]);
  const [loadingJourneys, setLoadingJourneys] = useState(true);
  const [journeysError, setJourneysError] = useState("");

  // State: Recommendations data for selected journey
  const [journeySummary, setJourneySummary] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState("");

  // Modal State for View Details of Recommendation Place
  const [selectedDetailPlace, setSelectedDetailPlace] = useState(null);

  // Fetch all accommodation bookings belonging to the user from the backend
  const loadAccommodationBookings = useCallback(async () => {
    try {
      setLoadingAccBookings(true);
      setAccBookingsError("");
      const data = await apiGetMyAccommodationBookings(token);
      if (data && Array.isArray(data.bookings)) {
        setAccommodationBookings(data.bookings);
      } else {
        setAccommodationBookings([]);
      }
    } catch (err) {
      console.error("Failed to load accommodation bookings:", err);
      setAccBookingsError(err.message || "Unable to load your accommodation bookings.");
    } finally {
      setLoadingAccBookings(false);
    }
  }, [token]);

  // Fetch all journeys belonging to the user
  const loadJourneys = useCallback(async () => {
    try {
      setLoadingJourneys(true);
      setJourneysError("");
      const data = await apiGetMyJourneys(token);
      if (data && Array.isArray(data.journeys)) {
        setJourneys(data.journeys);
      } else {
        setJourneys([]);
      }
    } catch (err) {
      console.error("Failed to load journeys:", err);
      setJourneysError(err.message || "Unable to load your pilgrimage journeys.");
    } finally {
      setLoadingJourneys(false);
    }
  }, [token]);

  // Fetch recommendations for specific journey ID
  const loadJourneyRecommendations = useCallback(async (jId) => {
    try {
      setLoadingRecommendations(true);
      setRecommendationsError("");
      const data = await apiGetJourneyBookings(jId, token);
      if (data) {
        setJourneySummary(data.journeySummary || null);
        const recs = data.recommendations || data.bookings || {};
        setRecommendations({
          accommodation: recs.accommodation || [],
          food: recs.food || recs.restaurants || [],
          otherServices: recs.otherServices || [],
        });
      } else {
        setRecommendations(null);
        setJourneySummary(null);
      }
    } catch (err) {
      console.error("Failed to load journey recommendations:", err);
      setRecommendationsError(err.message || "Failed to load recommendations for this journey.");
    } finally {
      setLoadingRecommendations(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadAccommodationBookings();
      loadJourneys();
    }
  }, [token, loadAccommodationBookings, loadJourneys]);

  useEffect(() => {
    if (selectedJourneyId && token) {
      loadJourneyRecommendations(selectedJourneyId);
      setActiveMainTab("recommendations");
    } else {
      setJourneySummary(null);
      setRecommendations(null);
    }
  }, [selectedJourneyId, token, loadJourneyRecommendations]);

  const handleSelectJourney = (jId) => {
    setActiveMainTab("recommendations");
    navigate(`/bookings/${jId}`);
  };

  const handleClearSelection = () => {
    navigate("/bookings");
  };

  const handleOpenMap = (placeOrLat, lng, address) => {
    if (typeof placeOrLat === "object" && placeOrLat !== null) {
      const p = placeOrLat;
      if (p.googleMapLink && p.googleMapLink.startsWith("http")) {
        window.open(p.googleMapLink, "_blank");
        return;
      }
      if (p.latitude && p.longitude) {
        window.open(`https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`, "_blank");
        return;
      }
      if (p.address) {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((p.name || "") + " " + p.address)}`, "_blank");
        return;
      }
    }
    const lat = placeOrLat;
    if (lat && lng) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, "_blank");
    } else if (address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, "_blank");
    } else {
      alert("Map location unavailable for this recommendation.");
    }
  };

  const handleGetDirections = (placeOrLat, lng, address) => {
    if (typeof placeOrLat === "object" && placeOrLat !== null) {
      const p = placeOrLat;
      if (p.latitude && p.longitude) {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`, "_blank");
        return;
      }
      if (p.address) {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((p.name || "") + " " + p.address)}`, "_blank");
        return;
      }
    }
    const lat = placeOrLat;
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
    } else if (address) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, "_blank");
    } else {
      alert("Directions destination unavailable.");
    }
  };

  // Trigger Cancellation Preview Modal
  const handleOpenCancelModal = async (booking) => {
    try {
      setCancelTargetBooking(booking);
      setCancelError("");
      setCancelReason("");
      setLoadingCancelPreview(true);

      const preview = await apiGetCancellationPreview(booking._id, token);
      setCancelPreview(preview);
    } catch (err) {
      console.error("Failed to load cancellation preview:", err);
      setCancelError(err.message || "Failed to load cancellation policy preview.");
    } finally {
      setLoadingCancelPreview(false);
    }
  };

  // Confirm Cancellation
  const handleConfirmCancellation = async () => {
    if (!cancelTargetBooking) return;
    try {
      setIsCancelling(true);
      setCancelError("");

      await apiCancelAccommodationBooking(cancelTargetBooking._id, cancelReason || "Cancelled by pilgrim", token);

      // Refresh bookings
      await loadAccommodationBookings();
      setCancelTargetBooking(null);
      setCancelPreview(null);
      alert("Booking has been cancelled. Any eligible refund has been processed.");
    } catch (err) {
      console.error("Cancellation error:", err);
      setCancelError(err.message || "Failed to cancel booking. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const renderStatusPill = (status) => {
    const s = (status || "PLANNED").toUpperCase();
    let cls = "planned";
    if (s === "CONFIRMED" || s === "ACTIVE" || s === "COMPLETED") cls = "confirmed";
    else if (s === "CANCELLED") cls = "cancelled";

    return <span className={`status-pill ${cls}`}>{s}</span>;
  };

  const totalRecsCount = journeySummary
    ? (journeySummary.totalRecommendationsCount !== undefined
        ? journeySummary.totalRecommendationsCount
        : ((recommendations?.accommodation?.length || 0) + (recommendations?.food?.length || 0) + (recommendations?.otherServices?.length || 0)))
    : 0;

  // Active bookings count
  const confirmedBookingsCount = accommodationBookings.filter(
    (b) => b.bookingStatus === "CONFIRMED"
  ).length;

  return (
    <div className="bookings-page pilgrim-dashboard-wrapper">
      <Navbar />

      <div className="pilgrim-dashboard-container">
        <UserSidebar activeTab="bookings" />

        <div className="pilgrim-main-content bookings-main-content">
          {/* TOP HEADER */}
          <div className="bookings-header">
            <div>
              <h1>My Bookings & Recommendations</h1>
              <p>Manage your confirmed accommodation reservations, Razorpay payments, and journey support recommendations.</p>
            </div>

            {selectedJourneyId && activeMainTab === "recommendations" && (
              <button
                type="button"
                className="btn-change-journey"
                onClick={handleClearSelection}
              >
                <FiGrid /> Select Journey
              </button>
            )}
          </div>

          {/* MAIN NAVIGATION TABS */}
          <div className="bookings-nav-tabs">
            <button
              type="button"
              className={`bookings-tab-btn ${activeMainTab === "accommodation" ? "active" : ""}`}
              onClick={() => setActiveMainTab("accommodation")}
            >
              <FiHome size={16} /> Accommodation Bookings
              <span className="badge-count">{accommodationBookings.length}</span>
            </button>

            <button
              type="button"
              className={`bookings-tab-btn ${activeMainTab === "recommendations" ? "active" : ""}`}
              onClick={() => setActiveMainTab("recommendations")}
            >
              <FiGrid size={16} /> Saved Journey Recommendations
              {journeys.length > 0 && <span className="badge-count">{journeys.length}</span>}
            </button>
          </div>

          {/* =========================================================
              TAB 1: CONFIRMED ACCOMMODATION BOOKINGS (Persistent)
             ========================================================= */}
          {activeMainTab === "accommodation" && (
            <div>
              {loadingAccBookings ? (
                <div style={{ padding: "60px", textAlign: "center" }}>
                  <div className="spinner" style={{ margin: "0 auto" }}></div>
                  <p style={{ marginTop: "14px", color: "#64748b" }}>Loading your accommodation reservations...</p>
                </div>
              ) : accBookingsError ? (
                <div className="error-card" style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "24px", borderRadius: "16px", color: "#991b1b" }}>
                  <FiAlertCircle size={36} />
                  <h3>Failed to load bookings</h3>
                  <p>{accBookingsError}</p>
                  <button
                    type="button"
                    className="btn-change-journey"
                    onClick={loadAccommodationBookings}
                    style={{ marginTop: "12px" }}
                  >
                    Retry Loading
                  </button>
                </div>
              ) : accommodationBookings.length === 0 ? (
                /* EMPTY STATE: USER HAS NO ACCOMMODATION BOOKINGS */
                <div className="empty-bookings-card">
                  <div className="empty-bookings-icon">🏨</div>
                  <h3>No accommodation booked yet</h3>
                  <p>
                    Reserve comfortable rooms near your pilgrimage destination with instant confirmation.
                    Explore nearby accommodations in the Journey Planner or your saved recommendations.
                  </p>
                  <button
                    type="button"
                    className="btn-empty-action"
                    onClick={() => setActiveMainTab("recommendations")}
                  >
                    View Recommended Accommodations →
                  </button>
                </div>
              ) : (
                /* ACCOMMODATION BOOKINGS GRID */
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>
                      Displaying <strong>{accommodationBookings.length}</strong> reservation(s) ({confirmedBookingsCount} Confirmed & Paid)
                    </p>
                    <span style={{ fontSize: "12px", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", padding: "4px 10px", borderRadius: "999px", fontWeight: "700" }}>
                      🔒 Secure Online Booking
                    </span>
                  </div>

                  <div className="acc-bookings-grid">
                    {accommodationBookings.map((b) => {
                      const isConfirmed = b.bookingStatus === "CONFIRMED";
                      const isCancelled = b.bookingStatus === "CANCELLED";
                      const isPending = b.bookingStatus === "PENDING_PAYMENT";

                      return (
                        <div key={b._id} className="acc-booking-card">
                          <div className="acc-card-top-bar">
                            <span className="acc-ref-number">#{b.bookingReference}</span>
                            <span className={`acc-status-pill ${isConfirmed ? "confirmed" : isCancelled ? "cancelled" : "pending"}`}>
                              {b.bookingStatus}
                            </span>
                          </div>

                          <div className="acc-card-main">
                            <h3 className="acc-card-name">{b.accommodationName}</h3>
                            <div className="acc-card-room-title">
                              {b.roomTitle} ({b.numberOfRooms} Room{b.numberOfRooms > 1 ? "s" : ""})
                            </div>
                            <div className="acc-card-address">
                              <FiMapPin size={13} /> {b.accommodationAddress || "Near Pilgrimage Destination"}
                            </div>

                            <div className="acc-card-meta-grid">
                              <div className="acc-meta-item">
                                <span className="label">Check-In</span>
                                <p className="val">{new Date(b.checkInDate).toLocaleDateString()}</p>
                              </div>
                              <div className="acc-meta-item">
                                <span className="label">Check-Out</span>
                                <p className="val">{new Date(b.checkOutDate).toLocaleDateString()} ({b.numberOfNights} nt)</p>
                              </div>
                              <div className="acc-meta-item">
                                <span className="label">Lead Guest</span>
                                <p className="val">{b.leadGuest?.name || "Pilgrim"}</p>
                              </div>
                              <div className="acc-meta-item">
                                <span className="label">Payment Status</span>
                                <p className="val" style={{ color: b.paymentStatus === "PAID" ? "#047857" : "#b45309" }}>
                                  {b.paymentStatus === "PAID" ? "✓ Paid" : b.paymentStatus}
                                </p>
                              </div>
                            </div>

                            {/* Refund Banner if Cancelled */}
                            {isCancelled && b.refundDetails && b.refundDetails.amount > 0 && (
                              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", color: "#166534", marginBottom: "10px" }}>
                                <strong>Refund Processed:</strong> ₹{b.refundDetails.amount}
                              </div>
                            )}

                            <div className="acc-card-price-row">
                              <span className="acc-rzp-tag" style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>
                                ✓ Guaranteed Reservation
                              </span>
                              <span className="acc-price-total">
                                ₹{b.pricing?.totalAmount?.toLocaleString()} INR
                              </span>
                            </div>
                          </div>

                          <div className="acc-card-actions">
                            <button
                              type="button"
                              className="acc-btn-act voucher"
                              onClick={() => setSelectedVoucherBooking(b)}
                            >
                              <FiEye /> View Voucher
                            </button>

                            {/* Cancellation Action if not yet cancelled */}
                            {!isCancelled && (
                              <button
                                type="button"
                                className="acc-btn-act cancel"
                                onClick={() => handleOpenCancelModal(b)}
                              >
                                <FiSlash /> Cancel Stay
                              </button>
                            )}

                            {/* Retry Pay button if pending */}
                            {isPending && (
                              <button
                                type="button"
                                className="acc-btn-act pay"
                                onClick={() => {
                                  const placeObj = {
                                    externalPlaceId: b.placeId,
                                    name: b.accommodationName,
                                    address: b.accommodationAddress,
                                    phone: b.accommodationPhone,
                                    image: b.accommodationImage,
                                    category: "accommodation",
                                  };
                                  setBookingModalTargetPlace(placeObj);
                                }}
                              >
                                <FiCreditCard /> Pay Now
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              TAB 2: SAVED JOURNEY RECOMMENDATIONS (Existing Module)
             ========================================================= */}
          {activeMainTab === "recommendations" && (
            <div>
              {/* MODE A: JOURNEY SELECTOR VIEW (No journey selected) */}
              {!selectedJourneyId && (
                <div className="journey-selector-container">
                  <div style={{ marginBottom: "24px" }}>
                    <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px 0" }}>
                      Select Pilgrimage Journey
                    </h2>
                    <p style={{ color: "#64748b", fontSize: "14.5px", margin: 0 }}>
                      Choose a journey to inspect its selected Google Maps accommodations, food recommendations, and support places.
                    </p>
                  </div>

                  {loadingJourneys ? (
                    <div style={{ padding: "60px", textAlign: "center" }}>
                      <div className="spinner" style={{ margin: "0 auto" }}></div>
                    </div>
                  ) : journeysError ? (
                    <div className="error-card" style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "24px", borderRadius: "16px", color: "#991b1b" }}>
                      <FiAlertCircle size={36} />
                      <h3>Failed to load journeys</h3>
                      <p>{journeysError}</p>
                    </div>
                  ) : journeys.length === 0 ? (
                    <div className="empty-bookings-card">
                      <div className="empty-bookings-icon">🏛️</div>
                      <h3>No pilgrimage journeys planned yet</h3>
                      <p>
                        Plan a pilgrimage journey to receive personalized recommendations for accommodation and satvik food places.
                      </p>
                      <Link to="/centers" className="btn-empty-action">
                        Plan a Journey →
                      </Link>
                    </div>
                  ) : (
                    <div className="journeys-selector-grid">
                      {journeys.map((j) => {
                        const center = j.pilgrimageCenterId || {};
                        const servicesCount = j.selectedServices
                          ? ((j.selectedServices.accommodation?.length || 0) +
                             (j.selectedServices.restaurants?.length || 0) +
                             (j.selectedServices.parking?.length || 0) +
                             (j.selectedServices.hospitals?.length || 0) +
                             (j.selectedServices.pharmacies?.length || 0) +
                             (j.selectedServices.restrooms?.length || 0) +
                             (j.selectedServices.drinkingWater?.length || 0) +
                             (j.selectedServices.atms?.length || 0) +
                             (j.selectedServices.baseCamps?.length || 0))
                          : 0;

                        return (
                          <div
                            key={j._id}
                            className="journey-select-card"
                            onClick={() => handleSelectJourney(j._id)}
                          >
                            <div className="journey-card-thumb">
                              <img
                                src={
                                  center.image ||
                                  "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?q=80&w=800&auto=format&fit=crop"
                                }
                                alt={center.name || "Pilgrimage Center"}
                              />
                              <div className="journey-card-badge">{renderStatusPill(j.status)}</div>
                            </div>

                            <div className="journey-card-body">
                              <h3>{center.name || "Pilgrimage Center"}</h3>
                              <div className="journey-location">
                                <FiMapPin /> {center.location?.city || "Location"}, {center.location?.state || "India"}
                              </div>

                              <div className="journey-meta-pills">
                                <span className="meta-pill-item">
                                  <FiCalendar /> {new Date(j.journeyDate).toLocaleDateString()} – {new Date(j.returnDate).toLocaleDateString()}
                                </span>
                                <span className="meta-pill-item">
                                  <FiUsers /> {j.totalPilgrims} Pilgrim(s)
                                </span>
                              </div>

                              <div className="journey-card-footer">
                                <span className="services-count-tag">
                                  📍 {servicesCount} Recommendations Selected
                                </span>
                                <button
                                  type="button"
                                  className="btn-view-journey-bookings"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectJourney(j._id);
                                  }}
                                >
                                  View Recommendations →
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* MODE B: SELECTED JOURNEY RECOMMENDATIONS VIEW */}
              {selectedJourneyId && (
                <div>
                  {loadingRecommendations ? (
                    <div style={{ padding: "60px", textAlign: "center" }}>
                      <div className="spinner" style={{ margin: "0 auto" }}></div>
                    </div>
                  ) : recommendationsError ? (
                    <div className="error-card" style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "24px", borderRadius: "16px", color: "#991b1b" }}>
                      <FiAlertCircle size={36} />
                      <h3>Unable to fetch recommendations</h3>
                      <p>{recommendationsError}</p>
                      <button type="button" className="btn-change-journey" onClick={handleClearSelection} style={{ marginTop: "12px" }}>
                        Back to Journeys List
                      </button>
                    </div>
                  ) : journeySummary && recommendations ? (
                    <>
                      {/* SELECTED JOURNEY BANNER */}
                      <div className="selected-journey-banner">
                        <div className="banner-left">
                          <img
                            src={journeySummary.pilgrimageCenter.image}
                            alt={journeySummary.pilgrimageCenter.name}
                            className="banner-center-thumb"
                          />
                          <div className="banner-title-area">
                            <h2>{journeySummary.pilgrimageCenter.name}</h2>
                            <div className="banner-meta-row">
                              <span className="banner-meta-item">
                                <FiMapPin /> {journeySummary.pilgrimageCenter.city}, {journeySummary.pilgrimageCenter.state}
                              </span>
                              <span className="banner-meta-item">
                                <FiCalendar /> {new Date(journeySummary.startDate).toLocaleDateString()} – {new Date(journeySummary.returnDate).toLocaleDateString()}
                              </span>
                              <span className="banner-meta-item">
                                <FiUsers /> {journeySummary.totalPilgrims} Pilgrim(s)
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="banner-right">
                          {renderStatusPill(journeySummary.status)}
                          <button
                            type="button"
                            className="btn-change-journey"
                            onClick={handleClearSelection}
                          >
                            Change Journey
                          </button>
                        </div>
                      </div>

                      {/* EMPTY STATE FOR JOURNEY WITH NO RECOMMENDATIONS */}
                      {totalRecsCount === 0 && (
                        <div className="empty-bookings-card">
                          <div className="empty-bookings-icon">📍</div>
                          <h3>No recommendations selected for this journey yet</h3>
                          <p>
                            Open Journey Planner to explore Google Maps recommendations for accommodation, satvik dining, and pilgrimage support.
                          </p>
                          <Link to={`/journey-planner/${journeySummary.pilgrimageCenter.id}`} className="btn-empty-action">
                            Go to Journey Planner →
                          </Link>
                        </div>
                      )}

                      {/* RECOMMENDATIONS CATEGORIES BREAKDOWN (3 COLUMNS) */}
                      {totalRecsCount > 0 && (
                        <div className="recommendations-three-columns-grid">
                          {/* COLUMN 1: SELECTED ACCOMMODATION RECOMMENDATIONS */}
                          <section className="booking-category-section">
                            <h3 className="category-section-title">
                              <span className="category-icon">🏨</span> Selected Accommodation ({recommendations.accommodation?.length || 0})
                            </h3>

                            {recommendations.accommodation && recommendations.accommodation.length > 0 ? (
                              <div className="category-cards-column">
                                {recommendations.accommodation.map((item) => (
                                  <div key={item._id} className="booking-item-card">
                                    <div className="booking-card-header">
                                      <div>
                                        <h4 className="booking-card-title">{item.name}</h4>
                                        <p className="booking-card-category">{item.category}</p>
                                      </div>
                                      {item.rating && (
                                        <span className="rating-badge">
                                          <FiStar color="#eab308" fill="#eab308" size={13} /> {item.rating}
                                        </span>
                                      )}
                                    </div>

                                    <div className="booking-details-grid">
                                      <div className="detail-field">
                                        <span className="field-label">Address</span>
                                        <span className="field-val">{item.address || "Vicinity Address"}</span>
                                      </div>
                                      <div className="detail-field">
                                        <span className="field-label">Phone</span>
                                        <span className="field-val">{item.phone || "Not available"}</span>
                                      </div>
                                      <div className="detail-field">
                                        <span className="field-label">Opening Information</span>
                                        <span className="field-val">{item.openingHours || "Not available"}</span>
                                      </div>
                                    </div>

                                    {item.facilities && item.facilities.length > 0 && (
                                      <div className="booking-facilities-row">
                                        {item.facilities.map((fac, idx) => (
                                          <span key={idx} className="facility-tag">✓ {fac}</span>
                                        ))}
                                      </div>
                                    )}

                                    <div className="booking-card-actions" style={{ flexWrap: "wrap" }}>
                                      {/* Direct Accommodation Book Stay Button */}
                                      <button
                                        type="button"
                                        className="btn-card-action"
                                        style={{ background: "#059669", color: "#ffffff", border: "none" }}
                                        onClick={() => setBookingModalTargetPlace(item)}
                                      >
                                        <FiCreditCard /> Book Stay
                                      </button>

                                      <button
                                        type="button"
                                        className="btn-card-action primary"
                                        onClick={() => setSelectedDetailPlace(item)}
                                      >
                                        <FiEye /> View Details
                                      </button>

                                      <button
                                        type="button"
                                        className="btn-card-action secondary"
                                        onClick={() => handleOpenMap(item)}
                                      >
                                        <FiMapPin /> Map
                                      </button>

                                      {item.phone && item.phone !== "Not available" && (
                                        <a
                                          href={`tel:${item.phone}`}
                                          className="btn-card-action success"
                                        >
                                          <FiPhone /> Call
                                        </a>
                                      )}

                                      <button
                                        type="button"
                                        className="btn-card-action secondary"
                                        onClick={() => handleGetDirections(item)}
                                      >
                                        <FiNavigation /> Directions
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="empty-column-card">
                                <p>No accommodation selected for this journey.</p>
                              </div>
                            )}
                          </section>

                          {/* COLUMN 2: SELECTED FOOD RECOMMENDATIONS */}
                          <section className="booking-category-section">
                            <h3 className="category-section-title">
                              <span className="category-icon">🍱</span> Selected Food ({recommendations.food?.length || 0})
                            </h3>

                            {recommendations.food && recommendations.food.length > 0 ? (
                              <div className="category-cards-column">
                                {recommendations.food.map((item) => (
                                  <div key={item._id} className="booking-item-card">
                                    <div className="booking-card-header">
                                      <div>
                                        <h4 className="booking-card-title">{item.name}</h4>
                                        <p className="booking-card-category">{item.category} • {item.foodType}</p>
                                      </div>
                                      {item.rating && (
                                        <span className="rating-badge">
                                          <FiStar color="#eab308" fill="#eab308" size={13} /> {item.rating}
                                        </span>
                                      )}
                                    </div>

                                    <div className="booking-details-grid">
                                      <div className="detail-field">
                                        <span className="field-label">Address</span>
                                        <span className="field-val">{item.address || "Dining Address"}</span>
                                      </div>
                                      <div className="detail-field">
                                        <span className="field-label">Phone</span>
                                        <span className="field-val">{item.phone || "Not available"}</span>
                                      </div>
                                      <div className="detail-field">
                                        <span className="field-label">Opening Hours</span>
                                        <span className="field-val">{item.openingHours || "Not available"}</span>
                                      </div>
                                    </div>

                                    {item.facilities && item.facilities.length > 0 && (
                                      <div className="booking-facilities-row">
                                        {item.facilities.map((fac, idx) => (
                                          <span key={idx} className="facility-tag">🍃 {fac}</span>
                                        ))}
                                      </div>
                                    )}

                                    <div className="booking-card-actions">
                                      <button
                                        type="button"
                                        className="btn-card-action primary"
                                        onClick={() => setSelectedDetailPlace(item)}
                                      >
                                        <FiEye /> View Details
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-card-action secondary"
                                        onClick={() => handleOpenMap(item)}
                                      >
                                        <FiMapPin /> View on Map
                                      </button>
                                      {item.phone && item.phone !== "Not available" && (
                                        <a
                                          href={`tel:${item.phone}`}
                                          className="btn-card-action success"
                                        >
                                          <FiPhone /> Call
                                        </a>
                                      )}
                                      <button
                                        type="button"
                                        className="btn-card-action secondary"
                                        onClick={() => handleGetDirections(item)}
                                      >
                                        <FiNavigation /> Get Directions
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="empty-column-card">
                                <p>No food place selected for this journey.</p>
                              </div>
                            )}
                          </section>

                          {/* COLUMN 3: SELECTED SUPPORT SERVICES */}
                          <section className="booking-category-section">
                            <h3 className="category-section-title">
                              <span className="category-icon">🅿️</span> Support Services ({recommendations.otherServices?.length || 0})
                            </h3>

                            {recommendations.otherServices && recommendations.otherServices.length > 0 ? (
                              <div className="category-cards-column">
                                {recommendations.otherServices.map((item) => (
                                  <div key={item._id} className="booking-item-card">
                                    <div className="booking-card-header">
                                      <div>
                                        <h4 className="booking-card-title">{item.name}</h4>
                                        <p className="booking-card-category">{item.category}</p>
                                      </div>
                                      {item.rating && (
                                        <span className="rating-badge">
                                          <FiStar color="#eab308" fill="#eab308" size={13} /> {item.rating}
                                        </span>
                                      )}
                                    </div>

                                    <div className="booking-details-grid">
                                      <div className="detail-field">
                                        <span className="field-label">Address</span>
                                        <span className="field-val">{item.address || "Service Location"}</span>
                                      </div>
                                      <div className="detail-field">
                                        <span className="field-label">Phone</span>
                                        <span className="field-val">{item.phone || "Not available"}</span>
                                      </div>
                                      <div className="detail-field">
                                        <span className="field-label">Timings</span>
                                        <span className="field-val">{item.openingHours || "Open 24/7"}</span>
                                      </div>
                                    </div>

                                    <div className="booking-card-actions">
                                      <button
                                        type="button"
                                        className="btn-card-action primary"
                                        onClick={() => setSelectedDetailPlace(item)}
                                      >
                                        <FiEye /> View Details
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-card-action secondary"
                                        onClick={() => handleOpenMap(item)}
                                      >
                                        <FiMapPin /> View on Map
                                      </button>
                                      {item.phone && item.phone !== "Not available" && (
                                        <a
                                          href={`tel:${item.phone}`}
                                          className="btn-card-action success"
                                        >
                                          <FiPhone /> Call
                                        </a>
                                      )}
                                      <button
                                        type="button"
                                        className="btn-card-action secondary"
                                        onClick={() => handleGetDirections(item)}
                                      >
                                        <FiNavigation /> Get Directions
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="empty-column-card">
                                <p>No support service selected for this journey.</p>
                              </div>
                            )}
                          </section>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              MODAL 1: VIEW RECOMMENDATION PLACE DETAILS
             ========================================================= */}
          {selectedDetailPlace && (
            <div className="place-detail-modal-overlay" onClick={() => setSelectedDetailPlace(null)}>
              <div className="place-detail-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div className="modal-title-area">
                    <span className="modal-badge">{selectedDetailPlace.category}</span>
                    <h2>{selectedDetailPlace.name}</h2>
                  </div>
                  <button
                    type="button"
                    className="btn-close-modal"
                    onClick={() => setSelectedDetailPlace(null)}
                  >
                    <FiX size={20} />
                  </button>
                </div>

                <div className="modal-body">
                  <div className="modal-section-title">⛩️ Pilgrimage Journey</div>
                  <div className="modal-info-block modal-grid-2">
                    <div>
                      <span className="field-label">Pilgrimage Center</span>
                      <p className="field-val" style={{ margin: "2px 0 0 0" }}>{journeySummary?.pilgrimageCenter?.name}</p>
                    </div>
                    <div>
                      <span className="field-label">Journey Dates</span>
                      <p className="field-val" style={{ margin: "2px 0 0 0" }}>
                        {journeySummary?.startDate ? new Date(journeySummary.startDate).toLocaleDateString() : ""} – {journeySummary?.returnDate ? new Date(journeySummary.returnDate).toLocaleDateString() : ""}
                      </p>
                    </div>
                  </div>

                  <div className="modal-section-title">📍 Google Maps Place Information</div>
                  <div className="modal-info-block">
                    <div style={{ marginBottom: "14px" }}>
                      <span className="field-label">Full Address</span>
                      <p className="field-val" style={{ margin: "2px 0 0 0" }}>{selectedDetailPlace.address || "Not available"}</p>
                    </div>

                    <div className="modal-grid-2" style={{ marginBottom: "14px" }}>
                      <div>
                        <span className="field-label">Phone Number</span>
                        <p className="field-val" style={{ margin: "2px 0 0 0" }}>{selectedDetailPlace.phone || "Not available"}</p>
                      </div>
                      <div>
                        <span className="field-label">Rating</span>
                        <p className="field-val" style={{ margin: "2px 0 0 0" }}>
                          {selectedDetailPlace.rating ? `⭐ ${selectedDetailPlace.rating} / 5` : "Not available"}
                        </p>
                      </div>
                    </div>

                    <div className="modal-grid-2">
                      <div>
                        <span className="field-label">Opening Hours</span>
                        <p className="field-val" style={{ margin: "2px 0 0 0" }}>{selectedDetailPlace.openingHours || "Not available"}</p>
                      </div>
                      <div>
                        <span className="field-label">Website</span>
                        {selectedDetailPlace.website ? (
                          <a href={selectedDetailPlace.website} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            Visit Website <FiExternalLink size={12} />
                          </a>
                        ) : (
                          <p className="field-val" style={{ margin: "2px 0 0 0" }}>Not available</p>
                        )}
                      </div>
                    </div>

                    {selectedDetailPlace.description && (
                      <div style={{ marginTop: "14px" }}>
                        <span className="field-label">Description</span>
                        <p className="field-val" style={{ margin: "2px 0 0 0" }}>{selectedDetailPlace.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer" style={{ flexWrap: "wrap" }}>
                  {/* If accommodation, allow direct booking */}
                  {(selectedDetailPlace.category === "accommodation" || selectedDetailPlace.placeType?.toLowerCase().includes("hotel") || selectedDetailPlace.placeType?.toLowerCase().includes("lodge")) && (
                    <button
                      type="button"
                      className="btn-card-action"
                      style={{ background: "#059669", color: "#ffffff", border: "none" }}
                      onClick={() => {
                        const target = selectedDetailPlace;
                        setSelectedDetailPlace(null);
                        setBookingModalTargetPlace(target);
                      }}
                    >
                      <FiCreditCard /> Book Stay
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-card-action secondary"
                    onClick={() => handleOpenMap(selectedDetailPlace)}
                  >
                    <FiMapPin /> View on Map
                  </button>
                  {selectedDetailPlace.phone && selectedDetailPlace.phone !== "Not available" && (
                    <a
                      href={`tel:${selectedDetailPlace.phone}`}
                      className="btn-card-action success"
                    >
                      <FiPhone /> Call
                    </a>
                  )}
                  <button
                    type="button"
                    className="btn-card-action secondary"
                    onClick={() => handleGetDirections(selectedDetailPlace)}
                  >
                    <FiNavigation /> Get Directions
                  </button>
                  <button
                    type="button"
                    className="btn-card-action primary"
                    onClick={() => setSelectedDetailPlace(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              MODAL 2: BOOKING VOUCHER / RECEIPT (Requirement 11)
             ========================================================= */}
          {selectedVoucherBooking && (
            <div
              className="place-detail-modal-overlay"
              style={{
                position: "fixed",
                inset: 0,
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 99999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(15, 23, 42, 0.75)",
                backdropFilter: "blur(8px)",
                padding: "20px",
                boxSizing: "border-box"
              }}
              onClick={() => setSelectedVoucherBooking(null)}
            >
              <div
                className="place-detail-modal-card"
                style={{
                  maxWidth: "600px",
                  width: "100%",
                  maxHeight: "90vh",
                  background: "#ffffff",
                  borderRadius: "20px",
                  overflow: "hidden",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                  display: "flex",
                  flexDirection: "column",
                  margin: "auto",
                  position: "relative",
                  zIndex: 100000
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header" style={{ background: "#0f172a", color: "#ffffff" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase" }}>Accommodation Receipt</span>
                    <h2 style={{ color: "#ffffff", margin: "2px 0 0 0" }}>#{selectedVoucherBooking.bookingReference}</h2>
                  </div>
                  <button
                    type="button"
                    className="btn-close-modal"
                    style={{ color: "#ffffff" }}
                    onClick={() => setSelectedVoucherBooking(null)}
                  >
                    <FiX size={20} />
                  </button>
                </div>

                <div className="modal-body">
                  <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <div style={{ width: "48px", height: "48px", background: "#dcfce7", color: "#16a34a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px auto" }}>
                      <FiCheckCircle size={26} />
                    </div>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#0f172a" }}>
                      {selectedVoucherBooking.bookingStatus === "CONFIRMED" ? "Booking Confirmed & Guaranteed" : selectedVoucherBooking.bookingStatus}
                    </h3>
                    <p style={{ margin: 0, fontSize: "13px", color: "#15803d", fontWeight: "600" }}>
                      Reservation secured & verified
                    </p>
                  </div>

                  <div className="modal-info-block">
                    <div style={{ marginBottom: "12px" }}>
                      <span className="field-label">Accommodation</span>
                      <p className="field-val" style={{ fontSize: "15px", fontWeight: "800", margin: "2px 0 0 0" }}>
                        {selectedVoucherBooking.accommodationName}
                      </p>
                      <p style={{ margin: "2px 0 0 0", fontSize: "12.5px", color: "#64748b" }}>
                        {selectedVoucherBooking.accommodationAddress}
                      </p>
                    </div>

                    <div className="modal-grid-2" style={{ marginBottom: "12px" }}>
                      <div>
                        <span className="field-label">Room Type</span>
                        <p className="field-val" style={{ margin: "2px 0 0 0" }}>
                          {selectedVoucherBooking.roomTitle} ({selectedVoucherBooking.numberOfRooms} Room)
                        </p>
                      </div>
                      <div>
                        <span className="field-label">Stay Duration</span>
                        <p className="field-val" style={{ margin: "2px 0 0 0" }}>
                          {selectedVoucherBooking.numberOfNights} Night(s)
                        </p>
                      </div>
                    </div>

                    <div className="modal-grid-2" style={{ marginBottom: "12px" }}>
                      <div>
                        <span className="field-label">Check-In</span>
                        <p className="field-val" style={{ margin: "2px 0 0 0" }}>
                          {new Date(selectedVoucherBooking.checkInDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="field-label">Check-Out</span>
                        <p className="field-val" style={{ margin: "2px 0 0 0" }}>
                          {new Date(selectedVoucherBooking.checkOutDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="modal-grid-2" style={{ marginBottom: "12px" }}>
                      <div>
                        <span className="field-label">Lead Guest</span>
                        <p className="field-val" style={{ margin: "2px 0 0 0" }}>
                          {selectedVoucherBooking.leadGuest?.name}
                        </p>
                        <small style={{ color: "#64748b" }}>{selectedVoucherBooking.leadGuest?.phone}</small>
                      </div>
                      <div>
                        <span className="field-label">Total Pilgrims</span>
                        <p className="field-val" style={{ margin: "2px 0 0 0" }}>
                          {selectedVoucherBooking.guests?.adults || 1} Adult(s), {selectedVoucherBooking.guests?.children || 0} Child(ren)
                        </p>
                      </div>
                    </div>

                    <div className="modal-grid-2" style={{ borderTop: "1px dashed #cbd5e1", paddingTop: "10px", marginTop: "10px" }}>
                      <div>
                        <span className="field-label">Payment Status</span>
                        <p className="field-val" style={{ fontSize: "13px", color: "#047857", fontWeight: "700", margin: "2px 0 0 0" }}>
                          ✓ Confirmed & Paid
                        </p>
                      </div>
                      <div>
                        <span className="field-label">Total Amount Paid</span>
                        <p className="field-val" style={{ fontSize: "16px", color: "#047857", fontWeight: "900", margin: "2px 0 0 0" }}>
                          ₹{selectedVoucherBooking.pricing?.totalAmount?.toLocaleString()} INR
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "10px", fontSize: "12px", color: "#166534", marginTop: "14px" }}>
                    <FiShield size={14} style={{ marginRight: "4px" }} />
                    <strong>Cancellation Terms:</strong> {selectedVoucherBooking.cancellationPolicy?.description || "Free cancellation up to 24h before check-in."}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-card-action secondary"
                    onClick={() => window.print()}
                  >
                    <FiPrinter /> Print Voucher
                  </button>
                  <button
                    type="button"
                    className="btn-card-action primary"
                    onClick={() => setSelectedVoucherBooking(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              MODAL 3: CANCELLATION & REFUND PREVIEW (Requirement 10)
             ========================================================= */}
          {cancelTargetBooking && (
            <div className="acc-cancel-modal-overlay">
              <div className="acc-cancel-modal-content">
                <h3>
                  <FiAlertCircle size={22} /> Cancel Accommodation Stay
                </h3>
                <p style={{ margin: "0 0 12px 0", fontSize: "13.5px", color: "#475569" }}>
                  Are you sure you want to cancel your reservation at <strong>{cancelTargetBooking.accommodationName}</strong>?
                </p>

                {loadingCancelPreview ? (
                  <div style={{ padding: "24px 0", textAlign: "center", color: "#64748b" }}>
                    <div className="spinner" style={{ margin: "0 auto" }}></div>
                    <p style={{ margin: "8px 0 0 0", fontSize: "13px" }}>Calculating backend refund per demo policy...</p>
                  </div>
                ) : cancelPreview ? (
                  <>
                    <div className="acc-cancel-breakdown-box">
                      <div className="acc-cancel-breakdown-row">
                        <span>Check-In Date:</span>
                        <strong>{new Date(cancelPreview.checkInDate).toLocaleDateString()}</strong>
                      </div>
                      <div className="acc-cancel-breakdown-row">
                        <span>Hours Until Check-In:</span>
                        <strong>{cancelPreview.hoursUntilCheckIn} hours</strong>
                      </div>
                      <div className="acc-cancel-breakdown-row">
                        <span>Total Paid Amount:</span>
                        <strong>₹{cancelPreview.totalPaid?.toLocaleString()}</strong>
                      </div>
                      <div className="acc-cancel-breakdown-row">
                        <span>Cancellation Fee:</span>
                        <strong style={{ color: "#b91c1c" }}>₹{cancelPreview.cancellationFee?.toLocaleString()}</strong>
                      </div>
                      <div className="acc-cancel-breakdown-row refund">
                        <span>Eligible Refund Amount:</span>
                        <span>₹{cancelPreview.eligibleRefund?.toLocaleString()} INR</span>
                      </div>
                    </div>

                    <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "10px", borderRadius: "8px", fontSize: "12px", color: "#1e40af", marginBottom: "14px" }}>
                      <strong>Cancellation Policy:</strong> {cancelPreview.policyTier}. Eligible refund will be returned directly to the original payment source.
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                        Reason for Cancellation (Optional)
                      </label>
                      <input
                        type="text"
                        style={{ width: "100%", padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                        placeholder="Change in pilgrimage schedule, etc."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                      />
                    </div>
                  </>
                ) : null}

                {cancelError && (
                  <div style={{ background: "#fef2f2", color: "#991b1b", padding: "8px 12px", borderRadius: "8px", fontSize: "12.5px", marginBottom: "12px" }}>
                    {cancelError}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    type="button"
                    style={{ padding: "8px 16px", borderRadius: "8px", background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#475569", fontWeight: "700", cursor: "pointer" }}
                    onClick={() => {
                      setCancelTargetBooking(null);
                      setCancelPreview(null);
                    }}
                    disabled={isCancelling}
                  >
                    Keep Booking
                  </button>

                  <button
                    type="button"
                    style={{ padding: "8px 18px", borderRadius: "8px", background: "#dc2626", border: "none", color: "#ffffff", fontWeight: "800", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    onClick={handleConfirmCancellation}
                    disabled={isCancelling || loadingCancelPreview}
                  >
                    {isCancelling ? "Processing Cancellation..." : "Confirm Cancellation"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              MODAL 4: ACCOMMODATION BOOKING MODAL
             ========================================================= */}
          {bookingModalTargetPlace && (
            <AccommodationBookingModal
              isOpen={!!bookingModalTargetPlace}
              onClose={() => setBookingModalTargetPlace(null)}
              place={bookingModalTargetPlace}
              initialJourneyId={selectedJourneyId || null}
              onBookingConfirmed={(newBooking) => {
                loadAccommodationBookings();
                setActiveMainTab("accommodation");
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Bookings;
