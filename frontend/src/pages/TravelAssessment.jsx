import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import UserSidebar from "../components/UserSidebar";
import { useAuth } from "../context/AuthContext";
import { apiGetJourneyById, apiGetActiveJourney, apiGetMyJourneys } from "../services/journeyService";
import { apiGetTravelAssessmentPsi } from "../services/travelAssessmentService";
import "../styles/TravelAssessment.css";

import {
  FiMapPin,
  FiCalendar,
  FiUsers,
  FiCloudRain,
  FiSun,
  FiWind,
  FiDroplet,
  FiAlertTriangle,
  FiCheckCircle,
  FiShield,
  FiRefreshCw,
  FiNavigation,
  FiZap,
  FiCheck,
  FiInfo,
  FiThermometer,
  FiActivity,
  FiHeart,
  FiUserCheck,
  FiAlertOctagon
} from "react-icons/fi";

function TravelAssessment() {
  const { journeyId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [journey, setJourney] = useState(null);
  const [myJourneys, setMyJourneys] = useState([]);
  const [loadingJourney, setLoadingJourney] = useState(true);
  const [journeyError, setJourneyError] = useState("");

  // PSI Backend Assessment State
  const [psiData, setPsiData] = useState(null);
  const [loadingPsi, setLoadingPsi] = useState(false);
  const [psiError, setPsiError] = useState("");

  // Deduplication ref to prevent duplicate concurrent API calls
  const fetchedKeyRef = useRef("");

  // 1. Fetch Journey Information
  useEffect(() => {
    let isMounted = true;

    const loadJourney = async () => {
      try {
        setLoadingJourney(true);
        setJourneyError("");

        let targetJourney = null;

        if (journeyId && token) {
          const res = await apiGetJourneyById(journeyId, token);
          if (res && res.journey) {
            targetJourney = res.journey;
          }
        } else if (token) {
          const res = await apiGetActiveJourney(token);
          if (res && res.active && res.journey) {
            targetJourney = res.journey;
          } else {
            const listRes = await apiGetMyJourneys(token);
            if (listRes && listRes.journeys && listRes.journeys.length > 0) {
              setMyJourneys(listRes.journeys);
              targetJourney = listRes.journeys[0];
            }
          }
        }

        if (isMounted) {
          if (targetJourney) {
            setJourney(targetJourney);
          } else {
            setJourneyError("No journey plan found. Please select or create a journey in Journey Planner.");
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error loading journey for Travel Assessment:", err);
          setJourneyError(err.message || "Failed to load journey details.");
        }
      } finally {
        if (isMounted) setLoadingJourney(false);
      }
    };

    loadJourney();

    return () => {
      isMounted = false;
    };
  }, [journeyId, token]);

  // 2. Fetch Authoritative Backend PSI Assessment
  const fetchPsiAssessment = async (targetJourney, forceRefresh = false) => {
    if (!targetJourney || !targetJourney._id) return;

    const reqKey = `${targetJourney._id}_${forceRefresh ? Date.now() : "initial"}`;
    if (!forceRefresh && fetchedKeyRef.current === targetJourney._id) {
      return; // Deduplicated
    }

    fetchedKeyRef.current = targetJourney._id;

    setLoadingPsi(true);
    setPsiError("");

    try {
      const res = await apiGetTravelAssessmentPsi(targetJourney._id, forceRefresh, token);
      if (res && res.success && res.data) {
        setPsiData(res.data);
      } else {
        setPsiError("Unable to calculate the Pilgrim Safety Index right now.");
      }
    } catch (err) {
      console.error("PSI Assessment Fetch Error:", err);
      setPsiError(err.message || "Unable to calculate the Pilgrim Safety Index right now.");
    } finally {
      setLoadingPsi(false);
    }
  };

  useEffect(() => {
    if (journey && journey._id) {
      fetchPsiAssessment(journey);
    }
  }, [journey]);

  const handleSelectJourneyChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId) {
      navigate(`/travel-assessment/${selectedId}`);
    }
  };

  const handleRefresh = () => {
    if (journey) {
      fetchPsiAssessment(journey, true);
    }
  };

  const formatDateString = (dateVal) => {
    if (!dateVal) return "N/A";
    try {
      const d = new Date(dateVal);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (_) {
      return String(dateVal);
    }
  };

  const centerInfo = journey?.pilgrimageCenterId || {};

  // Color helper based on risk level or score
  const getRiskColor = (levelOrScore) => {
    if (typeof levelOrScore === "number" && !isNaN(levelOrScore)) {
      if (levelOrScore >= 75) return "#ef4444"; // Red (Critical)
      if (levelOrScore >= 50) return "#f97316"; // Orange (High)
      if (levelOrScore >= 25) return "#f59e0b"; // Yellow/Amber (Moderate)
      return "#10b981"; // Green (Low)
    }
    const str = String(levelOrScore).toUpperCase();
    if (
      str.includes("CRITICAL") ||
      str.includes("VERY_HIGH") ||
      str.includes("VERY HIGH") ||
      str.includes("REJECTED") ||
      str.includes("NOT_APPROVED") ||
      str.includes("NOT APPROVED")
    ) return "#ef4444";
    if (str.includes("HIGH")) return "#f97316";
    if (str.includes("MODERATE") || str.includes("CAUTION")) return "#f59e0b";
    return "#10b981";
  };

  const getDoctorStatusColor = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("reject") || s.includes("not_approved") || s.includes("not approved")) return "#ef4444";
    if (s.includes("approve")) return "#10b981";
    return "#f59e0b";
  };

  return (
    <div className="travel-assessment-page pilgrim-dashboard-wrapper">
      <Navbar />

      <div className="pilgrim-dashboard-container" style={{ paddingTop: "72px" }}>
        <UserSidebar activeTab="journey" />

        <div className="pilgrim-main-content" style={{ flex: 1, padding: "1.5rem" }}>
          {/* Top Bar Action Section */}
          <div className="assessment-action-bar">
            {myJourneys.length > 1 ? (
              <div className="journey-selector">
                <label htmlFor="select-journey">Switch Journey: </label>
                <select
                  id="select-journey"
                  value={journey?._id || ""}
                  onChange={handleSelectJourneyChange}
                >
                  {myJourneys.map((j) => (
                    <option key={j._id} value={j._id}>
                      {j.pilgrimageCenterId?.name || "Pilgrimage"} ({formatDateString(j.journeyDate)})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div></div>
            )}

            <button
              className="btn-refresh"
              onClick={handleRefresh}
              disabled={loadingPsi}
              title="Refresh Pilgrim Safety Index"
            >
              <FiRefreshCw className={loadingPsi ? "spin" : ""} /> Refresh PSI Assessment
            </button>
          </div>

          {/* Loading State for Journey */}
          {loadingJourney && (
            <div className="assessment-loading">
              <div className="spinner"></div>
              <p>Loading journey details...</p>
            </div>
          )}

          {/* Journey Error State */}
          {!loadingJourney && journeyError && (
            <div className="assessment-error-card">
              <FiAlertTriangle className="error-icon" />
              <h3>No Active Journey Found</h3>
              <p>{journeyError}</p>
              <div className="error-actions">
                <Link to="/journey-planner" className="btn-primary">
                  Plan a New Journey
                </Link>
                <Link to="/my-journeys" className="btn-secondary">
                  View My Journeys
                </Link>
              </div>
            </div>
          )}

          {/* Main Content */}
          {!loadingJourney && journey && (
            <>
              {/* Header Banner */}
              <div className="assessment-header-card">
                <div className="header-main-info">
                  <span className="assessment-badge">
                    <FiZap /> Travel Assessment Engine & PSI
                  </span>
                  <h1 className="center-title">{centerInfo.name || "Pilgrimage Center"}</h1>
                  <p className="center-location">
                    <FiMapPin /> {centerInfo.location?.city || centerInfo.location?.address || "Location Details"}, {centerInfo.location?.state || ""}, {centerInfo.location?.country || "India"}
                  </p>
                </div>

                <div className="header-meta-grid">
                  <div className="meta-box">
                    <FiCalendar className="meta-icon" />
                    <div>
                      <span className="meta-label">Target Journey Date</span>
                      <span className="meta-value">{formatDateString(journey.journeyDate)}</span>
                    </div>
                  </div>

                  <div className="meta-box">
                    <FiUsers className="meta-icon" />
                    <div>
                      <span className="meta-label">Total Pilgrims</span>
                      <span className="meta-value">
                        {journey.totalPilgrims || (journey.travelingAlone ? 1 : 1 + (journey.travelingFamilyMembers?.length || 0))} Person(s)
                      </span>
                    </div>
                  </div>

                  <div className="meta-box">
                    <FiNavigation className="meta-icon" />
                    <div>
                      <span className="meta-label">Transport Mode</span>
                      <span className="meta-value">{journey.transportMode || "Own Transport"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loading State for PSI Calculation */}
              {loadingPsi && (
                <div className="assessment-loading" style={{ background: "#ffffff", borderRadius: "16px", padding: "2.5rem", marginBottom: "1.5rem" }}>
                  <div className="spinner"></div>
                  <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                    Calculating Pilgrim Safety Index...
                  </p>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    Aggregating Medical Analysis, Crowd Density ML, and Weather Telemetry
                  </span>
                </div>
              )}

              {/* PSI Error State */}
              {!loadingPsi && psiError && (
                <div className="assessment-error-card" style={{ marginBottom: "1.5rem" }}>
                  <FiAlertTriangle className="error-icon" />
                  <h3>PSI Calculation Failed</h3>
                  <p>{psiError}</p>
                  <div className="error-actions">
                    <button className="btn-refresh" onClick={handleRefresh}>
                      <FiRefreshCw /> Retry PSI Assessment
                    </button>
                  </div>
                </div>
              )}

              {/* Incomplete Assessment Warning State */}
              {!loadingPsi && psiData && psiData.assessmentStatus === "INCOMPLETE" && (
                <div className="assessment-error-card" style={{ borderLeft: "6px solid #f59e0b", marginBottom: "1.5rem" }}>
                  <FiAlertTriangle className="error-icon" style={{ color: "#f59e0b" }} />
                  <h3>Incomplete Safety Assessment</h3>
                  <p style={{ fontWeight: 600, color: "#92400e" }}>
                    PSI cannot be finalized because required assessment data is unavailable.
                  </p>

                  <div style={{ margin: "1rem 0", textAlign: "left", background: "#fef3c7", padding: "1rem", borderRadius: "10px" }}>
                    <strong>Missing Data Inputs:</strong>
                    <ul style={{ margin: "0.4rem 0 0 1.2rem", color: "#78350f" }}>
                      {psiData.missingInputs && psiData.missingInputs.map((missing, idx) => (
                        <li key={idx}>{missing} is unavailable for this journey.</li>
                      ))}
                    </ul>
                  </div>

                  <div className="error-actions">
                    <button className="btn-refresh" onClick={handleRefresh}>
                      <FiRefreshCw /> Retry Assessment
                    </button>
                  </div>
                </div>
              )}

              {/* Authoritative PSI Assessment Display */}
              {!loadingPsi && psiData && psiData.assessmentStatus === "COMPLETED" && (
                <>
                  {/* Medical Safety Override Banner */}
                  {psiData.isBlockedByPhysician && (
                    <div className="festival-alert-banner" style={{ background: "#fef2f2", borderColor: "#fca5a5", marginBottom: "1.5rem" }}>
                      <FiAlertOctagon className="fest-icon" style={{ color: "#ef4444" }} />
                      <div>
                        <strong style={{ color: "#991b1b", fontSize: "1.05rem" }}>
                          Physician Review Required / Blocked
                        </strong>
                        <p style={{ color: "#7f1d1d" }}>
                          Elevated health indicators require physician review or explicit travel responsibility consent before starting this journey. PSI calculation is provided for informational assessment.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Main Pilgrim Safety Index Banner */}
                  <div
                    className="safety-index-banner"
                    style={{ borderLeftColor: getRiskColor(psiData.psi?.level) }}
                  >
                    <div
                      className="safety-score-circle"
                      style={{ borderColor: getRiskColor(psiData.psi?.level) }}
                    >
                      <span
                        className="score-num"
                        style={{ color: getRiskColor(psiData.psi?.level) }}
                      >
                        {psiData.psi?.score}
                      </span>
                      <span className="score-max">/100</span>
                    </div>

                    <div className="safety-details">
                      <div className="safety-head">
                        <div>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: uppercaseText("PILGRIM SAFETY INDEX (PSI)") }}>
                            PILGRIM SAFETY INDEX
                          </span>
                          <h2>Overall Risk: {psiData.psi?.level}</h2>
                        </div>

                        <span
                          className="safety-tag"
                          style={{
                            backgroundColor: `${getRiskColor(psiData.psi?.level)}18`,
                            color: getRiskColor(psiData.psi?.level),
                            borderColor: getRiskColor(psiData.psi?.level),
                          }}
                        >
                          <FiShield /> {psiData.psi?.level}
                        </span>
                      </div>

                      <p className="safety-sub">
                        {psiData.assessmentSummary ||
                          "Authoritative journey-risk aggregation calculated from Health, Crowd ML, and Weather Telemetry."}
                      </p>

                      {psiData.isBlockedByPhysician && (
                        <div className="safety-warnings-list">
                          <span className="warning-pill">
                            <FiAlertTriangle /> Doctor Approval / Consent Pending
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Factor Breakdown Section */}
                  <div className="assessment-card" style={{ marginBottom: "1.5rem" }}>
                    <div className="card-header">
                      <div className="header-title">
                        <FiActivity className="card-icon" style={{ color: "#3b82f6" }} />
                        <div>
                          <h3>Risk Factor Breakdown</h3>
                          <span className="card-subtitle">
                            Weighted formula: PSI = (Health × 50%) + (Crowd × 25%) + (Weather × 25%)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="factors-breakdown-grid" style={{ display: "grid", gap: "1.2rem" }}>
                      {psiData.factors &&
                        psiData.factors.map((factor, idx) => {
                          const barColor = getRiskColor(factor.score);
                          return (
                            <div key={idx} className="factor-row-item">
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                                <span style={{ fontWeight: 700, color: "#0f172a" }}>
                                  {factor.name}
                                </span>
                                <span style={{ fontWeight: 800, color: barColor }}>
                                  {factor.score} / 100 ({Math.round(factor.weight * 100)}% Weight = +{factor.contribution} pts)
                                </span>
                              </div>

                              <div
                                style={{
                                  height: "12px",
                                  background: "#e2e8f0",
                                  borderRadius: "6px",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    height: "100%",
                                    width: `${factor.score}%`,
                                    backgroundColor: barColor,
                                    borderRadius: "6px",
                                    transition: "width 0.6s ease",
                                  }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Group & Individual Pilgrim Safety Assessment */}
                  <div className="assessment-card" style={{ marginBottom: "1.5rem" }}>
                    <div className="card-header">
                      <div className="header-title">
                        <FiUsers className="card-icon" style={{ color: "#8b5cf6" }} />
                        <div>
                          <h3>
                            {psiData.familyMembersAssessments && psiData.familyMembersAssessments.length > 0
                              ? "Family & Registered Pilgrim Safety Assessment"
                              : "Registered Pilgrim Safety Assessment"}
                          </h3>
                          <span className="card-subtitle">
                            {psiData.familyMembersAssessments && psiData.familyMembersAssessments.length > 0
                              ? "Individual pilgrim and family member risk assessments"
                              : "Individual registered pilgrim risk assessment"}
                          </span>
                        </div>
                      </div>
                      {psiData.familyOverallStatus && (
                        <span
                          className="crowd-badge"
                          style={{
                            backgroundColor: `${getRiskColor(psiData.familyOverallStatus)}18`,
                            color: getRiskColor(psiData.familyOverallStatus),
                            borderColor: getRiskColor(psiData.familyOverallStatus),
                          }}
                        >
                          Family Status: {psiData.familyOverallStatus}
                        </span>
                      )}
                    </div>

                    {psiData.familyHighestRiskReason && (
                      <div className="festival-alert-banner" style={{ background: "#fffbeb", borderColor: "#fde68a", marginBottom: "1rem" }}>
                        <FiInfo className="fest-icon" style={{ color: "#b45309" }} />
                        <div>
                          <strong style={{ color: "#92400e" }}>Family Overall Safety Reason:</strong>
                          <p style={{ color: "#78350f" }}>{psiData.familyHighestRiskReason}</p>
                        </div>
                      </div>
                    )}

                    <div className="family-members-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                      {/* Registered Pilgrim (Primary User) Card */}
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: "1.05rem", color: "#0f172a" }}>
                              {user?.name || user?.fullName || journey?.userId?.name || "Registered Pilgrim"}
                            </h4>
                            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>
                              Registered Pilgrim (Primary)
                            </span>
                          </div>
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: "1.1rem",
                              color: getRiskColor(psiData.psi?.score !== undefined ? psiData.psi.score : psiData.psiScore)
                            }}
                          >
                            PSI {psiData.psi?.score !== undefined ? psiData.psi.score : psiData.psiScore}/100
                          </span>
                        </div>

                        <div style={{ fontSize: "0.85rem", color: "#334155" }}>
                          <div>
                            Health Risk: <strong>{psiData.health?.score !== undefined ? psiData.health.score : psiData.healthRiskScore}/100</strong> ({psiData.health?.level || psiData.healthRiskLevel || "LOW_RISK"})
                          </div>
                          <div>
                            Doctor Status: <strong style={{ textTransform: "capitalize", color: getDoctorStatusColor(psiData.doctorApprovalStatus || "approved") }}>{psiData.doctorApprovalStatus || "approved"}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Family Members Cards */}
                      {psiData.familyMembersAssessments &&
                        psiData.familyMembersAssessments.map((fm, idx) => (
                          <div key={idx} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                              <div>
                                <h4 style={{ margin: 0, fontSize: "1.05rem", color: "#0f172a" }}>{fm.name}</h4>
                                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{fm.relationship}</span>
                              </div>
                              <span style={{ fontWeight: 800, fontSize: "1.1rem", color: getRiskColor(fm.psiScore) }}>
                                PSI {fm.psiScore}/100
                              </span>
                            </div>

                            <div style={{ fontSize: "0.85rem", color: "#334155" }}>
                              <div>
                                Health Risk: <strong style={{ color: getRiskColor(fm.healthRiskScore) }}>{fm.healthRiskScore}/100</strong> ({fm.healthRiskLevel})
                              </div>
                              <div>
                                Doctor Status: <strong style={{ textTransform: "capitalize", color: getDoctorStatusColor(fm.doctorApprovalStatus) }}>{fm.doctorApprovalStatus}</strong>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Individual Prediction Details Cards Grid */}
                  <div className="assessment-grid">
                    {/* CROWD PREDICTION CARD */}
                    <div className="assessment-card crowd-card">
                      <div className="card-header">
                        <div className="header-title">
                          <FiUsers className="card-icon crowd-icon-style" />
                          <div>
                            <h3>Crowd Prediction</h3>
                            <span className="card-subtitle">AI Pilgrimage ML Density Forecast</span>
                          </div>
                        </div>
                        <span className={`crowd-badge badge-${(psiData.crowd?.level || "MODERATE").toLowerCase().replace("_", "-").replace(" ", "-")}`}>
                          {psiData.crowd?.level || "Moderate Density"}
                        </span>
                      </div>

                      <div className="card-body">
                        {psiData.crowd?.details?.isFestival && (
                          <div className="festival-alert-banner">
                            <FiZap className="fest-icon" />
                            <div>
                              <strong>Special Festival Event: {psiData.crowd.details.festivalName || "Pilgrimage Festival"}</strong>
                              <p>Significant surge in pilgrim arrivals expected on this date.</p>
                            </div>
                          </div>
                        )}

                        <div className="crowd-metrics-row">
                          <div className="metric-box highlighted-metric">
                            <span className="metric-label">Predicted Pilgrims</span>
                            <span className="metric-value">
                              {(psiData.crowd?.details?.predictedVisitors || 25000).toLocaleString()}
                            </span>
                            <span className="metric-note">Estimated daily count</span>
                          </div>

                          <div className="metric-box">
                            <span className="metric-label">Expected Queue Time</span>
                            <span className="metric-value">
                              {psiData.crowd?.details?.estimatedWaitTime || "30 - 45 mins"}
                            </span>
                            <span className="metric-note">At main darshan queue</span>
                          </div>
                        </div>

                        <div className="capacity-section">
                          <div className="capacity-header">
                            <span>Crowd Risk Contribution Score</span>
                            <span>{psiData.crowd?.score} / 100</span>
                          </div>
                          <div className="capacity-bar-track">
                            <div
                              className="capacity-bar-fill"
                              style={{
                                width: `${psiData.crowd?.score}%`,
                                backgroundColor: getRiskColor(psiData.crowd?.score),
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* WEATHER PREDICTION CARD */}
                    <div className="assessment-card weather-card">
                      <div className="card-header">
                        <div className="header-title">
                          <FiSun className="card-icon weather-icon-style" />
                          <div>
                            <h3>Weather Assessment</h3>
                            <span className="card-subtitle">Corresponding OpenWeather Telemetry</span>
                          </div>
                        </div>
                        <span className={`weather-risk-badge risk-${(psiData.weather?.level || "LOW").toLowerCase()}`}>
                          {psiData.weather?.level} RISK
                        </span>
                      </div>

                      <div className="card-body">
                        <div className="weather-current-grid">
                          <div className="temp-display">
                            <div className="temp-main">
                              <span className="temp-val">
                                {psiData.weather?.details?.temperature !== undefined ? psiData.weather.details.temperature : 28}°C
                              </span>
                              <span className="temp-cond">
                                {psiData.weather?.details?.condition || "Clear"}
                              </span>
                            </div>
                          </div>

                          <div className="weather-stats-grid">
                            <div className="weather-stat">
                              <FiCloudRain className="stat-icon rain-icon" />
                              <div>
                                <span className="stat-label">Rain Chance</span>
                                <span className="stat-val">
                                  {psiData.weather?.details?.rainProbability !== undefined ? psiData.weather.details.rainProbability : 10}%
                                </span>
                              </div>
                            </div>

                            <div className="weather-stat">
                              <FiDroplet className="stat-icon humidity-icon" />
                              <div>
                                <span className="stat-label">Humidity</span>
                                <span className="stat-val">
                                  {psiData.weather?.details?.humidity !== undefined ? psiData.weather.details.humidity : 60}%
                                </span>
                              </div>
                            </div>

                            <div className="weather-stat">
                              <FiWind className="stat-icon wind-icon" />
                              <div>
                                <span className="stat-label">Wind Speed</span>
                                <span className="stat-val">
                                  {psiData.weather?.details?.windSpeed !== undefined ? psiData.weather.details.windSpeed : 12} km/h
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {psiData.weather?.details?.riskReasons && psiData.weather.details.riskReasons.length > 0 && (
                          <div className="weather-risk-reasons">
                            <h4>Weather Factors:</h4>
                            <ul>
                              {psiData.weather.details.riskReasons.map((reason, i) => (
                                <li key={i}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pilgrim Advisory & Safety Recommendations Card */}
                  <div className="assessment-card checklist-card">
                    <div className="card-header">
                      <div className="header-title">
                        <FiCheckCircle className="card-icon check-icon-style" />
                        <div>
                          <h3>Safety Recommendations & Advisory</h3>
                          <span className="card-subtitle">Generated based on PSI risk factors for {centerInfo.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="checklist-grid">
                      <div className="check-column" style={{ gridColumn: "1 / -1" }}>
                        <h4><FiShield /> Actionable Recommendations</h4>
                        <ul className="check-list">
                          {psiData.recommendations &&
                            psiData.recommendations.map((rec, idx) => (
                              <li key={idx}>
                                <FiCheck className="chk-ic" /> {rec}
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>

                    <div className="assessment-bottom-actions">
                      <button className="btn-start-action" onClick={() => navigate("/journey-assistance")}>
                        <FiActivity /> Start Live Journey Tracking & Assistance
                      </button>
                      <Link to={`/journey/${journey._id}`} className="btn-view-plan">
                        View Full Journey Details
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper for uppercase string formatting
function uppercaseText(str) {
  return String(str).toUpperCase();
}

export default TravelAssessment;
