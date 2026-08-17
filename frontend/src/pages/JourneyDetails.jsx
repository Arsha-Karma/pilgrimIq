import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import JourneyMap from "../components/JourneyMap";
import { useAuth } from "../context/AuthContext";
import { apiGetJourneyById, apiDeleteJourney } from "../services/journeyService";
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
  FiAlertCircle
} from "react-icons/fi";

function JourneyDetails() {
  const { journeyId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
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

    if (journeyId && token) {
      fetchJourney();
    }
  }, [journeyId, token]);

  const handleDeleteJourney = async () => {
    if (!window.confirm("Are you sure you want to cancel and delete this journey plan?")) {
      return;
    }
    try {
      setDeleting(true);
      await apiDeleteJourney(journeyId, token);
      alert("Journey plan cancelled successfully.");
      navigate("/my-journeys");
    } catch (err) {
      alert("Failed to delete journey: " + (err.message || "Server error"));
    } finally {
      setDeleting(false);
    }
  };

  const handleContinueAssessment = () => {
    alert("🚀 Ready for AI Decision Support! In future modules, this triggers the AI Pilgrim Safety Index & Travel Assessment Engine.");
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
              <span className="status-badge-planned">{journey.status ? journey.status.toUpperCase() : "PLANNED"}</span>
              <h1>Pilgrimage Journey to {center.name || "Pilgrimage Center"}</h1>
              <p className="hero-location">
                <FiMapPin /> {center.location?.city}, {center.location?.state}, {center.location?.country}
              </p>
            </div>

            <div className="hero-actions">
              <button
                type="button"
                className="btn-delete-journey"
                onClick={handleDeleteJourney}
                disabled={deleting}
              >
                <FiTrash2 /> Cancel Journey
              </button>
            </div>
          </div>
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
