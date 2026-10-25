import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import JourneyMap from "../components/JourneyMap";
import { useAuth } from "../context/AuthContext";
import { apiGetJourneyById, apiCancelJourney, apiStartJourney } from "../services/journeyService";
import { apiGetWeatherByCenterId } from "../services/weatherService";
import WeatherCard from "../components/WeatherCard";
import "../styles/JourneyDetails.css";
import {
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiTruck,
  FiDollarSign,
  FiArrowLeft,
  FiTrash2,
  FiCpu,
  FiAlertCircle,
  FiPlay,
  FiRefreshCw,
  FiPlus
} from "react-icons/fi";

function JourneyDetails() {
  const { journeyId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState("");

  // Weather state for journey destination & travel date
  const [weatherData, setWeatherData] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState("");

  const fetchJourney = async () => {
    try {
      setLoading(true);
      const data = await apiGetJourneyById(journeyId, token);
      if (data && data.journey) {
        setJourney(data.journey);
      } else {
        setError("Journey details not found.");
      }
    } catch (err) {
      console.error("Error loading journey:", err);
      setError(err.message || "Failed to load journey details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (journeyId && token) {
      fetchJourney();
    }
  }, [journeyId, token]);

  const fetchWeather = async (forceRefresh = false) => {
    const centerId = journey?.pilgrimageCenterId?._id || journey?.pilgrimageCenterId;
    if (!centerId) return;
    try {
      setLoadingWeather(true);
      setWeatherError("");
      const data = await apiGetWeatherByCenterId(
        centerId,
        journey?.journeyDate || null,
        token,
        forceRefresh
      );
      setWeatherData(data);
    } catch (err) {
      console.error("Error loading weather details for journey:", err);
      setWeatherError(err.message || "Weather information is temporarily unavailable.");
    } finally {
      setLoadingWeather(false);
    }
  };

  useEffect(() => {
    if (journey) {
      fetchWeather();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey]);

  const handleStartJourney = async () => {
    try {
      if (journeyId && token) {
        await apiStartJourney(journeyId, token);
      }
      navigate("/journey-assistance");
    } catch (err) {
      console.error("Error starting journey:", err);
      navigate("/journey-assistance");
    }
  };

  const handleCancelJourney = async () => {
    if (!window.confirm("Are you sure you want to cancel this pilgrimage journey booking? Your date will be released and you can rebook anytime.")) {
      return;
    }
    try {
      setDeleting(true);
      const res = await apiCancelJourney(journeyId, token);
      setNoticeMessage(res.message || "Journey booking cancelled successfully.");
      await fetchJourney();
    } catch (err) {
      alert("Failed to cancel journey: " + (err.message || "Server error"));
    } finally {
      setDeleting(false);
    }
  };

  const handleContinueAssessment = () => {
    navigate(`/travel-assessment/${journeyId}`);
  };

  if (loading) {
    return (
      <div className="journey-details-page">
        <Navbar />
        <div className="details-loading-card">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error || !journey) {
    return (
      <div className="journey-details-page">
        <Navbar />
        <div className="details-error-card">
          <FiAlertCircle size={44} className="err-icon" />
          <h3>Unable to Load Journey</h3>
          <p>{error || "The requested journey record does not exist."}</p>
          <Link to="/centers" className="btn-primary-blue">
            Back to Pilgrimage Centers
          </Link>
        </div>
      </div>
    );
  }

  const center = journey.pilgrimageCenterId || {};
  const familyMembers = journey.travelingFamilyMembers || [];

  const isExpired = journey.status === "EXPIRED" || journey.status === "expired";
  const isCancelled = journey.status === "CANCELLED" || journey.status === "cancelled";
  const isCompleted = journey.status === "COMPLETED" || journey.status === "completed";
  const isInProgress = journey.status === "IN_PROGRESS" || journey.status === "active";
  const isScheduled = journey.status === "SCHEDULED" || journey.status === "scheduled";
  const isConfirmed = journey.status === "CONFIRMED" || journey.status === "confirmed";
  const isPlanned = !isExpired && !isCancelled && !isCompleted && !isInProgress && !isScheduled && !isConfirmed;

  let statusBg = "#2563eb";
  if (isExpired) statusBg = "#d97706";
  else if (isCancelled) statusBg = "#64748b";
  else if (isCompleted) statusBg = "#059669";
  else if (isInProgress) statusBg = "#10b981";
  else if (isConfirmed) statusBg = "#0d9488";
  else if (isScheduled) statusBg = "#4f46e5";

  // Flatten selected places for Leaflet Map
  const selectedPlacesMapList = [];
  if (journey.selectedServices) {
    Object.keys(journey.selectedServices).forEach((cat) => {
      const list = journey.selectedServices[cat] || [];
      list.forEach((place) => {
        selectedPlacesMapList.push({
          ...place,
          category: cat,
        });
      });
    });
  }

  return (
    <div className="journey-details-page">
      <Navbar />

      <div className="journey-details-hero">
        <div className="hero-content-wrapper">
          <div className="breadcrumb-nav">
            <Link to="/my-journeys">
              <FiArrowLeft /> My Journeys
            </Link>{" "}
            / <span>Journey #{journey._id.substring(journey._id.length - 6)}</span>
          </div>

          <div className="hero-flex">
            <div>
              <span
                className="status-badge-planned"
                style={{ background: statusBg, color: "#ffffff", padding: "4px 12px", borderRadius: "6px", fontWeight: "700" }}
              >
                {journey.status ? journey.status.toUpperCase() : "PLANNED"}
              </span>
              <h1>Pilgrimage Journey to {center.name || "Pilgrimage Center"}</h1>
              <p className="hero-location">
                <FiMapPin /> {center.location?.city}, {center.location?.state}, {center.location?.country}
              </p>
            </div>

            <div className="hero-actions" style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              {isExpired ? (
                <button
                  type="button"
                  className="btn-primary-blue"
                  onClick={() => navigate(`/journey-planner/${center._id}`)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    background: "#0f172a",
                    color: "#ffffff",
                    fontWeight: "800",
                    border: "none",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                  }}
                >
                  <FiPlus /> Plan New Journey
                </button>
              ) : (
                <>
                  {isPlanned && (
                    <button
                      type="button"
                      className="btn-primary-blue"
                      onClick={handleStartJourney}
                      style={{
                        padding: "10px 20px",
                        borderRadius: "10px",
                        background: "#2563eb",
                        color: "#ffffff",
                        fontWeight: "800",
                        border: "none",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "14px",
                      }}
                    >
                      <FiPlay /> Start Journey
                    </button>
                  )}

                  {isPlanned && (
                    <button
                      type="button"
                      onClick={() => navigate(`/journey-planner/${center._id}?rescheduleJourneyId=${journey._id}`)}
                      style={{
                        padding: "10px 18px",
                        borderRadius: "10px",
                        background: "#f1f5f9",
                        color: "#1e293b",
                        fontWeight: "700",
                        border: "1px solid #cbd5e1",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "14px",
                      }}
                    >
                      <FiRefreshCw /> Reschedule
                    </button>
                  )}

                  {isPlanned && (
                    <button
                      type="button"
                      className="btn-delete-journey"
                      onClick={handleCancelJourney}
                      disabled={deleting}
                    >
                      <FiTrash2 /> Cancel Booking
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Expired journey message banner */}
          {isExpired && (
            <div
              style={{
                marginTop: "16px",
                background: "#fef3c7",
                border: "1px solid #f59e0b",
                borderRadius: "10px",
                padding: "12px 18px",
                color: "#92400e",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <FiAlertCircle size={20} />
              <span>
                Your planned journey to {center.name || "this centre"} has expired. Please plan a new journey if you still wish to visit this centre.
              </span>
            </div>
          )}

          {noticeMessage && (
            <div
              style={{
                marginTop: "16px",
                background: "#f0fdf4",
                border: "1px solid #86efac",
                borderRadius: "10px",
                padding: "12px 18px",
                color: "#166534",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              ✓ {noticeMessage}
            </div>
          )}
        </div>
      </div>

      <div className="details-body-container">
        {/* KEY STATS CARDS */}
        <div className="journey-stats-grid">
          <div className="stat-card">
            <FiCalendar className="stat-icon blue" />
            <div>
              <span className="label">Travel Dates</span>
              <p className="val">{new Date(journey.journeyDate).toLocaleDateString()} - {new Date(journey.returnDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="stat-card">
            <FiUsers className="stat-icon green" />
            <div>
              <span className="label">Total Pilgrims</span>
              <p className="val">{journey.totalPilgrims} Person(s)</p>
            </div>
          </div>

          <div className="stat-card">
            <FiTruck className="stat-icon purple" />
            <div>
              <span className="label">Transport Mode</span>
              <p className="val">{journey.transportMode}</p>
            </div>
          </div>

          <div className="stat-card">
            <FiDollarSign className="stat-icon amber" />
            <div>
              <span className="label">Travel Budget</span>
              <p className="val">
                {journey.budget?.type} {journey.budget?.amount ? `(₹${journey.budget.amount})` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* MAIN DETAILS GRID */}
        <div className="details-main-grid">
          <div className="details-col-left">
            {/* DESTINATION CENTER DETAILS */}
            <div className="detail-section-card">
              <h3>⛩️ Destination Pilgrimage Center</h3>
              <div className="center-card-inner">
                <img
                  src={center.image || "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?q=80&w=800&auto=format&fit=crop"}
                  alt={center.name}
                  className="center-img-thumb"
                />
                <div className="center-text-meta">
                  <h4>{center.name}</h4>
                  <p className="desc">{center.description}</p>
                  <div className="meta-pills">
                    <span>☀️ Season: {center.visitingInformation?.bestSeason}</span>
                    <span>🌡️ Climate: {center.visitingInformation?.climate}</span>
                    <span>🚶 Walking: {center.difficulty?.walking}</span>
                    <span>🧗 Climbing: {center.difficulty?.climbing}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* WEATHER TELEMETRY CARD */}
            <WeatherCard
              weatherData={weatherData}
              loading={loadingWeather}
              error={weatherError}
              centerName={center.name}
              onRetry={() => fetchWeather(true)}
              selectedJourneyDate={journey.journeyDate}
            />

            {/* TRAVELLING PILGRIMS & FAMILY MEMBERS */}
            <div className="detail-section-card">
              <h3>👨‍👩‍👧‍👦 Travelling Pilgrims ({journey.totalPilgrims})</h3>
              <p className="sub-text">
                Main User + {journey.travelingAlone ? "0 Family Members (Traveling Alone)" : `${familyMembers.length} Selected Family Member(s)`}
              </p>

              {familyMembers.length > 0 ? (
                <div className="family-members-list-grid">
                  {familyMembers.map((m) => (
                    <div key={m._id} className="fam-card-item">
                      <div className="fam-avatar">{m.name ? m.name.charAt(0).toUpperCase() : "F"}</div>
                      <div className="fam-details">
                        <h5>{m.name}</h5>
                        <p>{m.relationship} {m.age ? `• ${m.age} Yrs` : ""}</p>
                        {m.chronicConditions && (
                          <span className="health-alert">🩺 {m.chronicConditions}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-fam-msg">No family members registered for this journey.</p>
              )}
            </div>

            {/* SELECTED NEARBY SERVICES */}
            <div className="detail-section-card">
              <h3>📍 Selected Support Services</h3>
              {selectedPlacesMapList.length > 0 ? (
                <div className="selected-places-display-grid">
                  {selectedPlacesMapList.map((place, idx) => (
                    <div key={place.externalPlaceId || idx} className="selected-place-item-card">
                      <div className="place-head">
                        <span className="cat-badge">{place.category ? place.category.toUpperCase() : "SERVICE"}</span>
                        <span className="dist">📍 {place.distanceKm} km</span>
                      </div>
                      <h4>{place.name}</h4>
                      <p>{place.address}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-fam-msg">No specific places pre-selected. Default map services remain accessible.</p>
              )}
            </div>
          </div>

          <div className="details-col-right">
            {/* MAP CARD */}
            <div className="detail-section-card">
              <h3>🗺️ Interactive Journey & Support Map</h3>
              <p className="sub-text">Location map for {center.name}</p>
              <JourneyMap
                centerCoords={center.location}
                centerName={center.name}
                places={selectedPlacesMapList}
              />
            </div>

            {/* AI ASSESSMENT CALLOUT CARD */}
            <div className="ai-assessment-callout-card">
              <div className="ai-head">
                <FiCpu size={28} className="ai-icon" />
                <div>
                  <h4>AI Prediction & Decision Support</h4>
                  <p>Ready to calculate Pilgrim Safety Index (PSI), weather risks, and crowd predictions.</p>
                </div>
              </div>

              <button
                type="button"
                className="btn-continue-assessment"
                onClick={handleContinueAssessment}
              >
                Continue to Travel Assessment →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JourneyDetails;
