import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "../styles/CenterDetails.css";
import Navbar from "../components/Navbar";
import { apiGetPilgrimageCenterById } from "../services/api";
import {
  FiMapPin,
  FiClock,
  FiActivity,
  FiCheckSquare,
  FiGlobe,
  FiPhone,
  FiArrowLeft,
  FiCompass,
  FiCheckCircle,
  FiInfo,
  FiAlertCircle
} from "react-icons/fi";

function CenterDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [center, setCenter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCenterDetail = async () => {
      try {
        setLoading(true);
        const data = await apiGetPilgrimageCenterById(id);
        setCenter(data);
      } catch (err) {
        console.error("Error loading center details:", err);
        setError(err.message || "Failed to load pilgrimage center details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCenterDetail();
  }, [id]);

  const handlePlanJourney = () => {
    navigate(`/journey-planner/${id}`);
  };

  return (
    <div className="center-details-page-wrapper">
      <Navbar />

      <div className="details-container">
        {/* BREADCRUMB / BACK LINK */}
        <div className="details-navigation">
          <Link to="/centers" className="back-link">
            <FiArrowLeft /> Back to Pilgrimage Centers
          </Link>
        </div>

        {loading ? (
          <div className="loading-state-card">
            <div className="spinner"></div>
            <p>Fetching pilgrimage center details from database...</p>
          </div>
        ) : error ? (
          <div className="error-state-card">
            <FiAlertCircle size={40} className="err-icon" />
            <h3>Unable to load pilgrimage center</h3>
            <p>{error}</p>
            <Link to="/centers" className="btn-primary-blue" style={{ marginTop: 12, display: "inline-block" }}>
              Return to Centers
            </Link>
          </div>
        ) : !center ? (
          <div className="error-state-card">
            <h3>Pilgrimage Center Not Found</h3>
            <p>The requested pilgrimage center does not exist or has been removed.</p>
            <Link to="/centers" className="btn-primary-blue" style={{ marginTop: 12, display: "inline-block" }}>
              View Available Centers
            </Link>
          </div>
        ) : (
          <>
            {/* HERO CARD */}
            <div className="center-details-hero-card">
              <div className="hero-image-box">
                <img
                  src={center.image || "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?q=80&w=1200&auto=format&fit=crop"}
                  alt={center.name}
                  className="hero-center-img"
                />
                <span className="religion-hero-badge">{center.religion}</span>
              </div>

              <div className="hero-content-box">
                <div className="hero-header-meta">
                  <h1>{center.name}</h1>
                  <p className="hero-location-text">
                    <FiMapPin className="pin-icon" /> {center.location?.address}, {center.location?.city}, {center.location?.state}, {center.location?.country} - {center.location?.postalCode}
                  </p>
                </div>

                <div className="hero-key-badges">
                  <div className="meta-badge-item">
                    <span className="lbl">Walking Difficulty</span>
                    <span className={`val diff-pill ${center.difficulty?.walking?.toLowerCase()}`}>
                      {center.difficulty?.walking || "Moderate"}
                    </span>
                  </div>

                  <div className="meta-badge-item">
                    <span className="lbl">Climbing Difficulty</span>
                    <span className={`val diff-pill ${center.difficulty?.climbing?.toLowerCase()}`}>
                      {center.difficulty?.climbing || "Moderate"}
                    </span>
                  </div>

                  <div className="meta-badge-item">
                    <span className="lbl">Best Season</span>
                    <span className="val season-val">{center.visitingInformation?.bestSeason || "All Year"}</span>
                  </div>

                  <div className="meta-badge-item">
                    <span className="lbl">Crowd Level</span>
                    <span className="val crowd-val">{center.visitingInformation?.crowdLevel || "Moderate"}</span>
                  </div>
                </div>

                <div className="hero-action-row">
                  <button className="btn-plan-journey" onClick={handlePlanJourney}>
                    <FiCompass size={18} /> Plan Journey to this Center
                  </button>

                  {center.contact?.website && (
                    <a
                      href={center.contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-official-site"
                    >
                      <FiGlobe /> Official Website ↗
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* MAIN SPECS GRID */}
            <div className="details-sections-grid">
              {/* DESCRIPTION & OVERVIEW */}
              <div className="info-card">
                <div className="card-title">
                  <FiInfo className="icon" />
                  <h3>About {center.name}</h3>
                </div>
                <p className="description-text">{center.description}</p>

                {center.contact && (center.contact.phone || center.contact.email) && (
                  <div className="contact-sub-box">
                    {center.contact.phone && <div><strong>📞 Official Contact:</strong> {center.contact.phone}</div>}
                    {center.contact.email && <div><strong>✉️ Email:</strong> {center.contact.email}</div>}
                  </div>
                )}
              </div>

              {/* TIMINGS & CLIMATE */}
              <div className="info-card">
                <div className="card-title">
                  <FiClock className="icon" />
                  <h3>Darshan Timings & Climate</h3>
                </div>
                <div className="two-col-info">
                  <div>
                    <span className="info-lbl">Opening Time:</span>
                    <span className="info-val">{center.timings?.openingTime}</span>
                  </div>
                  <div>
                    <span className="info-lbl">Closing Time:</span>
                    <span className="info-val">{center.timings?.closingTime}</span>
                  </div>
                  <div>
                    <span className="info-lbl">Weekly Closing Day:</span>
                    <span className="info-val">{center.timings?.weeklyClosingDay}</span>
                  </div>
                  <div>
                    <span className="info-lbl">Typical Climate:</span>
                    <span className="info-val">{center.visitingInformation?.climate}</span>
                  </div>
                  <div>
                    <span className="info-lbl">Peak Season:</span>
                    <span className="info-val">{center.visitingInformation?.peakSeason || "N/A"}</span>
                  </div>
                  <div>
                    <span className="info-lbl">Avg Duration:</span>
                    <span className="info-val">{center.visitingInformation?.averageVisitDuration || "2-3 Hours"}</span>
                  </div>
                </div>

                {center.timings?.specialNotes && (
                  <div className="special-notes-box">
                    <strong>ℹ️ Special Timing Note:</strong> {center.timings.specialNotes}
                  </div>
                )}
              </div>

              {/* TERRAIN & DIFFICULTY METRICS */}
              <div className="info-card">
                <div className="card-title">
                  <FiActivity className="icon" />
                  <h3>Physical Difficulty & Terrain Metrics</h3>
                </div>
                <div className="two-col-info">
                  <div>
                    <span className="info-lbl">Walking Difficulty:</span>
                    <span className="info-val">{center.difficulty?.walking}</span>
                  </div>
                  <div>
                    <span className="info-lbl">Climbing Difficulty:</span>
                    <span className="info-val">{center.difficulty?.climbing}</span>
                  </div>
                  <div>
                    <span className="info-lbl">Walking Distance:</span>
                    <span className="info-val">{center.difficulty?.walkingDistance || "Standard"}</span>
                  </div>
                  <div>
                    <span className="info-lbl">Steps to Climb:</span>
                    <span className="info-val">{center.difficulty?.numberOfSteps || "None"}</span>
                  </div>
                  <div>
                    <span className="info-lbl">Terrain Type:</span>
                    <span className="info-val">{center.difficulty?.terrainType}</span>
                  </div>
                  <div>
                    <span className="info-lbl">Recommended Age:</span>
                    <span className="info-val">{center.visitingInformation?.recommendedAgeGroup || "All"}</span>
                  </div>
                </div>

                {center.difficulty?.accessibility && (
                  <div className="access-info-box">
                    <strong>♿ Accessibility:</strong> {center.difficulty.accessibility}
                  </div>
                )}
              </div>

              {/* RULES & GUIDELINES */}
              {center.rules && center.rules.length > 0 && (
                <div className="info-card">
                  <div className="card-title">
                    <FiCheckSquare className="icon" />
                    <h3>Rules & Important Guidelines</h3>
                  </div>
                  <ul className="rules-list">
                    {center.rules.map((rule, idx) => (
                      <li key={idx}>
                        <FiCheckCircle className="check-icon" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* NEARBY SERVICES & FACILITIES */}
              <div className="info-card full-width">
                <div className="card-title">
                  <FiGlobe className="icon" />
                  <h3>Nearby Emergency Services & On-Site Facilities</h3>
                </div>

                <div className="facilities-pills-row">
                  <span className={`facility-chip ${center.nearbyServices?.parkingAvailable ? "available" : "unavailable"}`}>
                    {center.nearbyServices?.parkingAvailable ? "✅ Parking Available" : "❌ No Parking"}
                  </span>
                  <span className={`facility-chip ${center.nearbyServices?.drinkingWaterAvailable ? "available" : "unavailable"}`}>
                    {center.nearbyServices?.drinkingWaterAvailable ? "✅ Drinking Water" : "❌ No Water Facilities"}
                  </span>
                  <span className={`facility-chip ${center.nearbyServices?.restroomAvailable ? "available" : "unavailable"}`}>
                    {center.nearbyServices?.restroomAvailable ? "✅ Restrooms Available" : "❌ No Restrooms"}
                  </span>
                </div>

                <div className="services-grid">
                  {center.nearbyServices?.hospitals && center.nearbyServices.hospitals.length > 0 && (
                    <div className="service-sub-card">
                      <h5>🏥 Nearby Hospitals</h5>
                      <p>{center.nearbyServices.hospitals.join(", ")}</p>
                    </div>
                  )}

                  {center.nearbyServices?.pharmacies && center.nearbyServices.pharmacies.length > 0 && (
                    <div className="service-sub-card">
                      <h5>💊 Pharmacies</h5>
                      <p>{center.nearbyServices.pharmacies.join(", ")}</p>
                    </div>
                  )}

                  {center.nearbyServices?.restaurants && center.nearbyServices.restaurants.length > 0 && (
                    <div className="service-sub-card">
                      <h5>🍱 Food & Dining</h5>
                      <p>{center.nearbyServices.restaurants.join(", ")}</p>
                    </div>
                  )}

                  {center.nearbyServices?.accommodation && center.nearbyServices.accommodation.length > 0 && (
                    <div className="service-sub-card">
                      <h5>🏨 Accommodation</h5>
                      <p>{center.nearbyServices.accommodation.join(", ")}</p>
                    </div>
                  )}
                </div>

                {center.nearbyServices?.emergencyContact && (
                  <div className="emergency-contact-card">
                    <FiPhone size={20} />
                    <div>
                      <strong>Emergency Control Helpline:</strong> {center.nearbyServices.emergencyContact}
                    </div>
                  </div>
                )}
              </div>

              {/* MAP LOCATION PREVIEW */}
              {center.location?.latitude && center.location?.longitude && (
                <div className="info-card full-width">
                  <div className="card-title">
                    <FiMapPin className="icon" />
                    <h3>Geographical Location & Directions</h3>
                  </div>
                  <div className="map-view-box">
                    <iframe
                      title="Geographical Map Location"
                      width="100%"
                      height="340"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight="0"
                      marginWidth="0"
                      src={`https://maps.google.com/maps?q=${center.location.latitude},${center.location.longitude}&z=14&output=embed`}
                      style={{ border: 0, borderRadius: 12 }}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CenterDetails;
