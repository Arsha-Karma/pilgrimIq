import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import UserSidebar from "../components/UserSidebar";
import { useAuth } from "../context/AuthContext";
import { apiGetMyJourneys, apiGetJourneyBookings } from "../services/journeyService";
import "../styles/Bookings.css";
import {
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiEye,
  FiPhone,
  FiAlertCircle,
  FiHome,
  FiCoffee,
  FiNavigation,
  FiX,
  FiGrid,
  FiGlobe,
  FiClock,
  FiStar,
  FiExternalLink
} from "react-icons/fi";

function Bookings() {
  const { journeyId: routeJourneyId } = useParams();
  const [searchParams] = useSearchParams();
  const queryJourneyId = searchParams.get("journeyId");
  const selectedJourneyId = routeJourneyId || queryJourneyId;

  const navigate = useNavigate();
  const { token } = useAuth();

  // State: Journeys list for selector
  const [journeys, setJourneys] = useState([]);
  const [loadingJourneys, setLoadingJourneys] = useState(true);
  const [journeysError, setJourneysError] = useState("");

  // State: Recommendations data for selected journey
  const [journeySummary, setJourneySummary] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState("");

  // Modal State for View Details
  const [selectedDetailPlace, setSelectedDetailPlace] = useState(null);

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
      loadJourneys();
    }
  }, [token, loadJourneys]);

  useEffect(() => {
    if (selectedJourneyId && token) {
      loadJourneyRecommendations(selectedJourneyId);
    } else {
      setJourneySummary(null);
      setRecommendations(null);
    }
  }, [selectedJourneyId, token, loadJourneyRecommendations]);

  const handleSelectJourney = (jId) => {
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

  return (
    <div className="bookings-page pilgrim-dashboard-wrapper">
      <Navbar />

      <div className="pilgrim-dashboard-container" style={{ paddingTop: "72px" }}>
        <UserSidebar activeTab="bookings" />

        <div className="pilgrim-main-content bookings-main-content">
          {/* TOP HEADER */}
          <div className="bookings-header">
            <div>
              <h1>My Recommendations</h1>
              <p>View accommodations, food options, and support places you selected for your pilgrimage journeys.</p>
            </div>

            {selectedJourneyId && (
              <button
                type="button"
                className="btn-change-journey"
                onClick={handleClearSelection}
              >
                <FiGrid /> Select Journey
              </button>
            )}
          </div>

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
                /* EMPTY STATE: USER HAS NO JOURNEYS */
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
                /* JOURNEYS GRID */
                <div className="journeys-selector-grid">
                  {journeys.map((j) => {
                    const center = j.pilgrimageCenterId || {};
                    // Exclude transport items when counting selected recommendations
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

                  {/* RECOMMENDATIONS CATEGORIES BREAKDOWN (3 COLUMNS HORIZONTAL ROW) */}
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

                      {/* COLUMN 3: OTHER SELECTED RECOMMENDATIONS */}
                      <section className="booking-category-section">
                        <h3 className="category-section-title">
                          <span className="category-icon">🏥</span> Other Services ({recommendations.otherServices?.length || 0})
                        </h3>

                        {recommendations.otherServices && recommendations.otherServices.length > 0 ? (
                          <div className="category-cards-column">
                            {recommendations.otherServices.map((item) => (
                              <div key={item._id} className="booking-item-card">
                                <div className="booking-card-header">
                                  <div>
                                    <h4 className="booking-card-title">{item.name}</h4>
                                    <p className="booking-card-category">{item.serviceType || item.category}</p>
                                  </div>
                                </div>

                                <div className="booking-details-grid">
                                  <div className="detail-field">
                                    <span className="field-label">Address</span>
                                    <span className="field-val">{item.address || "Pilgrimage Path Hub"}</span>
                                  </div>
                                  <div className="detail-field">
                                    <span className="field-label">Phone</span>
                                    <span className="field-val">{item.phone || "Not available"}</span>
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
                            <p>No medical or support places selected for this journey.</p>
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
      </div>

      {/* RECOMMENDATION DETAILS MODAL */}
      {selectedDetailPlace && (
        <div className="modal-overlay" onClick={() => setSelectedDetailPlace(null)}>
          <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedDetailPlace.name}</h2>
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>
                  {selectedDetailPlace.category || selectedDetailPlace.serviceType || "Google Maps Place"}
                </span>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setSelectedDetailPlace(null)}
              >
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              {/* SECTION 1: JOURNEY CONTEXT */}
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

              {/* SECTION 2: PLACE DETAILS */}
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

            <div className="modal-footer">
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
    </div>
  );
}

export default Bookings;
