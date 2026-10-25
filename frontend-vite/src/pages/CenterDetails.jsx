import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "../styles/CenterDetails.css";
import Navbar from "../components/Navbar";
import UserSidebar from "../components/UserSidebar";
import { apiGetPilgrimageCenterById } from "../services/api";
import {
  FiMapPin,
  FiClock,
  FiGlobe,
  FiPhone,
  FiMail,
  FiCompass,
  FiAlertCircle,
  FiNavigation,
  FiAlertTriangle,
  FiSend
} from "react-icons/fi";
import {
  FaPersonWalking,
  FaCalendarDays,
  FaUsers,
  FaSun,
  FaWheelchair,
  FaMountain,
  FaHouseChimney,
  FaHospital,
  FaPills,
  FaUtensils,
  FaHotel,
  FaBed,
  FaPhone,
  FaArrowRight,
  FaCross,
  FaScroll,
  FaTriangleExclamation
} from "react-icons/fa6";
import { TbStairs, TbRoute } from "react-icons/tb";
import { LuClock, LuCalendar, LuSun, LuUsers } from "react-icons/lu";

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

  const fullAddress = center
    ? [
        center.location?.address,
        center.location?.city,
        center.location?.state,
        center.location?.country
      ]
        .filter(Boolean)
        .join(", ") + (center.location?.postalCode ? ` - ${center.location.postalCode}` : "")
    : "";

  const defaultHospitals = ["Pilgrim Emergency First Aid Centre", "Government General Hospital Care"];
  const defaultPharmacies = ["Jan Aushadhi Medical Pharmacy Store", "24x7 Emergency Lifecare Pharmacy"];
  const defaultRestaurants = [
    "Prasadam Satvik Bhojanalaya",
    "Pilgrim Annadhana Canteen",
    "Sri Saravana Bhavan Vegetarian",
    "City Heritage Food Court"
  ];
  const defaultAccommodations = [
    "Devaswom Pilgrim Yatri Niwas",
    "Sacred Heritage Pilgrim Lodge",
    "Sri Temple View Guest House",
    "Global Pilgrims Comfort Hotel"
  ];

  const hospitals = center?.nearbyServices?.hospitals?.length > 0 ? center.nearbyServices.hospitals : defaultHospitals;
  const pharmacies = center?.nearbyServices?.pharmacies?.length > 0 ? center.nearbyServices.pharmacies : defaultPharmacies;
  const restaurants = center?.nearbyServices?.restaurants?.length > 0 ? center.nearbyServices.restaurants : defaultRestaurants;
  const accommodation = center?.nearbyServices?.accommodation?.length > 0 ? center.nearbyServices.accommodation : defaultAccommodations;
  const emergencyPhone = center?.nearbyServices?.emergencyContact || "112";

  return (
    <div className="center-details-page-wrapper pilgrim-dashboard-wrapper">
      <Navbar />

      <div className="pilgrim-dashboard-container">
        <UserSidebar activeTab="journey" />

        <main className="pilgrim-main-content center-details-main-content">
          {loading ? (
            <div className="loading-state-card" role="status" aria-live="polite">
              <div className="spinner"></div>
              <p className="loading-text">Loading pilgrimage centre information...</p>
            </div>
          ) : error ? (
            <div className="error-state-card" role="alert">
              <FiAlertCircle size={44} className="err-icon" />
              <h3>Unable to load pilgrimage centre</h3>
              <p>{error}</p>
              <Link to="/centers" className="btn-return-centers">
                Return to Centers
              </Link>
            </div>
          ) : !center ? (
            <div className="error-state-card" role="alert">
              <FiAlertCircle size={44} className="err-icon" />
              <h3>Pilgrimage Centre Not Found</h3>
              <p>The requested pilgrimage centre does not exist or has been removed.</p>
              <Link to="/centers" className="btn-return-centers">
                View Available Centers
              </Link>
            </div>
          ) : (
            <div className="center-details-content-flow">
              {/* =========================================================
                  1. HERO SECTION (CARD 1)
                 ========================================================= */}
              <section className="center-details-hero-card" aria-label="Pilgrimage Centre Overview Banner">
                <div className="hero-image-box">
                  <img
                    src={center.image || "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?q=80&w=1200&auto=format&fit=crop"}
                    alt={center.name}
                    className="hero-center-img"
                    loading="eager"
                  />
                  <span className="religion-hero-badge">
                    <FaCross className="badge-cross-icon" />
                    <span>{center.religion ? `${center.religion} Pilgrimage Centre` : "Christian Pilgrimage Centre"}</span>
                  </span>
                </div>

                <div className="hero-content-box">
                  <div className="hero-header-meta">
                    <h1 className="hero-title">{center.name}</h1>

                    <p className="hero-location-text">
                      <FiMapPin className="pin-icon" size={15} />
                      <span>{fullAddress}</span>
                    </p>
                  </div>

                  {/* Introductory Overview Text */}
                  {center.description && (
                    <p className="hero-description-text">
                      {center.description}
                    </p>
                  )}

                  {/* 4 Summary Metric Badges in a single row */}
                  <div className="hero-key-badges-row">
                    <div className="hero-metric-pill">
                      <div className="metric-icon-box green">
                        <FaPersonWalking />
                      </div>
                      <div className="metric-text-box">
                        <span className="lbl">Walking Difficulty</span>
                        <span className="val green">{center.difficulty?.walking || "Low"}</span>
                      </div>
                    </div>

                    <div className="hero-metric-pill">
                      <div className="metric-icon-box green">
                        <TbStairs />
                      </div>
                      <div className="metric-text-box">
                        <span className="lbl">Climbing Difficulty</span>
                        <span className="val green">{center.difficulty?.climbing || "Low"}</span>
                      </div>
                    </div>

                    <div className="hero-metric-pill">
                      <div className="metric-icon-box blue">
                        <FaCalendarDays />
                      </div>
                      <div className="metric-text-box">
                        <span className="lbl">Best Season</span>
                        <span className="val navy">{center.visitingInformation?.bestSeason || "October – March"}</span>
                      </div>
                    </div>

                    <div className="hero-metric-pill">
                      <div className="metric-icon-box amber">
                        <FaUsers />
                      </div>
                      <div className="metric-text-box">
                        <span className="lbl">Crowd Level</span>
                        <span className="val amber">{center.visitingInformation?.crowdLevel || "Moderate"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="hero-action-row">
                    <button
                      type="button"
                      className="btn-plan-journey-cta"
                      onClick={handlePlanJourney}
                      aria-label={`Plan Journey to ${center.name}`}
                    >
                      <FiCompass size={17} />
                      <span>Plan Journey to this Centre</span>
                      <FaArrowRight size={12} className="cta-arrow" />
                    </button>

                    {center.contact?.website && (
                      <a
                        href={center.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-official-site-cta"
                        aria-label={`Visit official website for ${center.name} (opens in new tab)`}
                      >
                        <FiGlobe size={15} /> Official Website ↗
                      </a>
                    )}

                    {center.location?.latitude && center.location?.longitude && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${center.location.latitude},${center.location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-directions-cta"
                        aria-label="Get directions in Google Maps (opens in new tab)"
                      >
                        <FiNavigation size={14} /> Directions ↗
                      </a>
                    )}
                  </div>
                </div>
              </section>

              {/* =========================================================
                  2. OVERVIEW & TIMINGS (2 BALANCED COLUMNS)
                 ========================================================= */}
              <div className="details-sections-grid">
                {/* A. CENTRE OVERVIEW */}
                <article className="info-card overview-card">
                  <div className="section-header-row">
                    <FaHouseChimney className="sec-header-glyph blue" />
                    <div>
                      <h3>About {center.name}</h3>
                      <span className="sec-subtitle">Religious Significance & Pilgrim Heritage</span>
                    </div>
                  </div>

                  <div className="overview-content-body">
                    <p className="description-text">{center.description}</p>
                  </div>

                  {/* Official Centre Contact Desk */}
                  <div className="official-contact-desk-panel">
                    <h4 className="desk-title">Official Centre Contact Desk</h4>
                    <div className="desk-items-list">
                      <div className="desk-item">
                        <span className="desk-item-label-group">
                          <FiPhone className="desk-icon blue" size={15} />
                          <span className="desk-lbl">Helpline / Enquiries:</span>
                        </span>
                        <span className="desk-item-value-group">
                          <FiPhone className="desk-icon blue" size={15} />
                          <a
                            href={`tel:${(center.contact?.phone || "7708222409").replace(/[^0-9+]/g, "")}`}
                            className="desk-link"
                          >
                            {center.contact?.phone || "7708222409"}
                          </a>
                        </span>
                      </div>

                      <div className="desk-item">
                        <span className="desk-item-label-group">
                          <FiMail className="desk-icon blue" size={15} />
                          <span className="desk-lbl">Official Email:</span>
                        </span>
                        <span className="desk-item-value-group">
                          <FiMail className="desk-icon blue" size={15} />
                          <a
                            href={`mailto:${center.contact?.email || "info@vailankannishrine.net"}`}
                            className="desk-link"
                          >
                            {center.contact?.email || "info@vailankannishrine.net"}
                          </a>
                        </span>
                      </div>

                      <div className="desk-item">
                        <span className="desk-item-label-group">
                          <FiGlobe className="desk-icon blue" size={15} />
                          <span className="desk-lbl">Verified Portal:</span>
                        </span>
                        <span className="desk-item-value-group">
                          <a
                            href={center.contact?.website || "https://www.vailankannishrine.net"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="desk-link"
                          >
                            Official Web Portal ↗
                          </a>
                        </span>
                      </div>
                    </div>
                  </div>
                </article>

                {/* B. DARSHAN TIMINGS & CLIMATE */}
                <article className="info-card timings-card">
                  <div className="section-header-row">
                    <LuClock className="sec-header-glyph blue" size={26} />
                    <div>
                      <h3>Darshan Timings & Climate</h3>
                      <span className="sec-subtitle">Temple Schedule & Visiting Conditions</span>
                    </div>
                  </div>

                  <div className="timings-two-col-grid">
                    <div className="timing-tile-box">
                      <LuClock className="t-icon orange" size={24} />
                      <div className="t-text">
                        <span className="t-lbl">Opening Time</span>
                        <strong className="t-val">{center.timings?.openingTime || "06:00 AM"}</strong>
                      </div>
                    </div>

                    <div className="timing-tile-box">
                      <LuClock className="t-icon orange" size={24} />
                      <div className="t-text">
                        <span className="t-lbl">Closing Time</span>
                        <strong className="t-val">{center.timings?.closingTime || "09:00 PM"}</strong>
                      </div>
                    </div>

                    <div className="timing-tile-box">
                      <LuCalendar className="t-icon blue" size={22} />
                      <div className="t-text">
                        <span className="t-lbl">Weekly Closing Day</span>
                        <strong className="t-val">{center.timings?.weeklyClosingDay || "None"}</strong>
                      </div>
                    </div>

                    <div className="timing-tile-box">
                      <LuSun className="t-icon amber" size={23} />
                      <div className="t-text">
                        <span className="t-lbl">Typical Climate</span>
                        <strong className="t-val">{center.visitingInformation?.climate || "Cool"}</strong>
                      </div>
                    </div>

                    <div className="timing-tile-box">
                      <LuUsers className="t-icon purple" size={22} />
                      <div className="t-text">
                        <span className="t-lbl">Peak Pilgrimage Season</span>
                        <strong className="t-val">{center.visitingInformation?.peakSeason || "November – January"}</strong>
                      </div>
                    </div>

                    <div className="timing-tile-box">
                      <LuClock className="t-icon blue" size={24} />
                      <div className="t-text">
                        <span className="t-lbl">Average Visit Duration</span>
                        <strong className="t-val">{center.visitingInformation?.averageVisitDuration || "2 - 3 Hours"}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Special Timing Note Amber Alert Box */}
                  <div className="special-timing-alert-box" role="alert">
                    <FaTriangleExclamation className="alert-triangle-icon" size={22} />
                    <div className="alert-text-body">
                      <strong>Special Timing Note:</strong>
                      <p>
                        {center.timings?.specialNotes ||
                          "The Velankanni Shrine Basilica remains open daily from 5:00 AM to 9:00 PM without any weekly holidays, featuring special Saturday car processions and modified overnight schedules during its annual festival from August 29 to September 8."}
                      </p>
                    </div>
                  </div>
                </article>
              </div>

              {/* =========================================================
                  3. PHYSICAL DIFFICULTY & TERRAIN METRICS (EXACT 6-TILE ROW)
                 ========================================================= */}
              <article className="info-card full-width terrain-section-card">
                <div className="section-header-row">
                  <FaMountain className="sec-header-glyph blue" />
                  <div>
                    <h3>Physical Difficulty & Terrain Metrics</h3>
                    <span className="sec-subtitle">Climbing, Walking Distance & Pilgrim Accessibility</span>
                  </div>
                </div>

                <div className="difficulty-metrics-six-row">
                  <div className="terrain-metric-card">
                    <FaPersonWalking className="tm-icon green" />
                    <div className="tm-text">
                      <span className="tm-lbl">Walking Difficulty</span>
                      <strong className="tm-val green">{center.difficulty?.walking || "Low"}</strong>
                    </div>
                  </div>

                  <div className="terrain-metric-card">
                    <TbStairs className="tm-icon green" />
                    <div className="tm-text">
                      <span className="tm-lbl">Climbing Difficulty</span>
                      <strong className="tm-val green">{center.difficulty?.climbing || "Low"}</strong>
                    </div>
                  </div>

                  <div className="terrain-metric-card">
                    <TbRoute className="tm-icon blue" />
                    <div className="tm-text">
                      <span className="tm-lbl">Walking Distance</span>
                      <strong className="tm-val navy">{center.difficulty?.walkingDistance || "1 km to 2 km"}</strong>
                    </div>
                  </div>

                  <div className="terrain-metric-card">
                    <TbStairs className="tm-icon purple" />
                    <div className="tm-text">
                      <span className="tm-lbl">Steps to Climb</span>
                      <strong className="tm-val navy">{center.difficulty?.numberOfSteps || "10"}</strong>
                    </div>
                  </div>

                  <div className="terrain-metric-card">
                    <FaScroll className="tm-icon brown" />
                    <div className="tm-text">
                      <span className="tm-lbl">Terrain Type</span>
                      <strong className="tm-val navy">{center.difficulty?.terrainType || "Flat"}</strong>
                    </div>
                  </div>

                  <div className="terrain-metric-card">
                    <FaUsers className="tm-icon purple" />
                    <div className="tm-text">
                      <span className="tm-lbl">Recommended Age Group</span>
                      <strong className="tm-val navy">{center.visitingInformation?.recommendedAgeGroup || "All Age Groups"}</strong>
                    </div>
                  </div>
                </div>

                {/* Accessibility Support Banner */}
                <div className="accessibility-support-banner">
                  <div className="access-wheelchair-square">
                    <FaWheelchair />
                  </div>
                  <div className="access-text-body">
                    <strong>Accessibility Support & Mobility Assistance</strong>
                    <p>
                      {(center.difficulty?.accessibility || "Wheelchair accessible ramps and pathways are available throughout the main basilica complex.")
                        .replace(/^ACCESSIBILITY INFORMATION\s*[-–:]\s*/i, "")
                        .replace(/^Type\s+/i, "")}
                    </p>
                  </div>
                </div>
              </article>

              {/* =========================================================
                  4. NEARBY EMERGENCY SERVICES & ON-SITE FACILITIES
                 ========================================================= */}
              <article className="info-card full-width emergency-facilities-section">
                <div className="section-header-row">
                  <FiMapPin className="sec-header-glyph blue" />
                  <div>
                    <h3>Nearby Emergency Services & On-Site Facilities</h3>
                    <span className="sec-subtitle">Medical Care, Dining, Lodging & On-Site Pilgrim Amenities</span>
                  </div>
                </div>

                {/* 4 Support Services Cards Row */}
                <div className="services-four-col-row">
                  <div className="service-sub-card">
                    <div className="service-sub-header">
                      <div className="fac-icon-box red">
                        <FaHospital />
                      </div>
                      <h5>Nearby Hospitals & Emergency Care</h5>
                    </div>
                    <div className="service-tags-wrap">
                      {hospitals.map((hosp, i) => (
                        <span key={i} className="service-tag-pill">{hosp}</span>
                      ))}
                    </div>
                  </div>

                  <div className="service-sub-card">
                    <div className="service-sub-header">
                      <div className="fac-icon-box pink">
                        <FaPills />
                      </div>
                      <h5>Pharmacies & Medical Stores</h5>
                    </div>
                    <div className="service-tags-wrap">
                      {pharmacies.map((pharm, i) => (
                        <span key={i} className="service-tag-pill">{pharm}</span>
                      ))}
                    </div>
                  </div>

                  <div className="service-sub-card">
                    <div className="service-sub-header">
                      <div className="fac-icon-box orange">
                        <FaUtensils />
                      </div>
                      <h5>Food & Dining Recommendations</h5>
                    </div>
                    <div className="service-tags-wrap">
                      {restaurants.map((rest, i) => (
                        <span key={i} className="service-tag-pill">{rest}</span>
                      ))}
                    </div>
                  </div>

                  <div className="service-sub-card">
                    <div className="service-sub-header">
                      <div className="fac-icon-box blue">
                        <FaBed />
                      </div>
                      <h5>Pilgrim Accommodations & Lodges</h5>
                    </div>
                    <div className="service-tags-wrap">
                      {accommodation.map((acc, i) => (
                        <span key={i} className="service-tag-pill">{acc}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 24/7 Pilgrim Emergency Helpline Banner */}
                <div className="emergency-helpline-banner-box">
                  <div className="emergency-banner-left">
                    <div className="emergency-square-icon">
                      <FaPhone />
                    </div>
                    <div className="emergency-text-group">
                      <span className="emergency-top-lbl">24/7 PILGRIM EMERGENCY HELPLINE DESK</span>
                      <div className="emergency-number-line">
                        <strong className="emergency-phone-digits">{emergencyPhone}</strong>
                        <span className="emergency-sub-caption">For immediate assistance during your pilgrimage</span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={`tel:${emergencyPhone.replace(/[^0-9+]/g, "")}`}
                    className="btn-emergency-call-cta"
                    aria-label={`Call Helpline ${emergencyPhone}`}
                  >
                    <FaPhone size={13} /> Call Helpline Now
                  </a>
                </div>
              </article>

              {/* =========================================================
                  6. GEOGRAPHICAL LOCATION & DIRECTIONS (CARD 6)
                 ========================================================= */}
              {center.location?.latitude && center.location?.longitude && (
                <article className="info-card full-width location-map-section">
                  <div className="map-card-header-bar">
                    <div className="section-header-row" style={{ margin: 0, padding: 0, border: "none" }}>
                      <FiMapPin className="sec-header-glyph blue" />
                      <div>
                        <h3>Geographical Location & Directions</h3>
                        <span className="sec-subtitle">
                          Coordinates: {Number(center.location.latitude).toFixed(4)}° N, {Number(center.location.longitude).toFixed(4)}° E
                        </span>
                      </div>
                    </div>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${center.location.latitude},${center.location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-google-directions-cta"
                      aria-label="Open directions to centre in Google Maps (opens in new tab)"
                    >
                      <FiSend size={14} /> Get Directions in Google Maps ↗
                    </a>
                  </div>

                  <div className="location-address-row">
                    <FiMapPin className="pin-icon" size={15} />
                    <span>{fullAddress}</span>
                  </div>

                  <div className="map-view-box">
                    <iframe
                      title={`Geographical Map Location for ${center.name}`}
                      width="100%"
                      height="320"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight="0"
                      marginWidth="0"
                      src={`https://maps.google.com/maps?q=${center.location.latitude},${center.location.longitude}&z=14&output=embed`}
                      style={{ border: 0 }}
                    />
                  </div>
                </article>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default CenterDetails;