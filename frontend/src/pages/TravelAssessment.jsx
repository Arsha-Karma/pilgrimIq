import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import UserSidebar from "../components/UserSidebar";
import { useAuth } from "../context/AuthContext";
import { apiGetJourneyById, apiGetActiveJourney, apiGetMyJourneys } from "../services/journeyService";
import { apiPredictCrowd } from "../services/crowdService";
import { apiGetWeatherByCenterId } from "../services/weatherService";
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
  FiActivity
} from "react-icons/fi";

function TravelAssessment() {
  const { journeyId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [journey, setJourney] = useState(null);
  const [myJourneys, setMyJourneys] = useState([]);
  const [loadingJourney, setLoadingJourney] = useState(true);
  const [journeyError, setJourneyError] = useState("");

  const [crowdData, setCrowdData] = useState(null);
  const [loadingCrowd, setLoadingCrowd] = useState(false);
  const [crowdError, setCrowdError] = useState("");

  const [weatherData, setWeatherData] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState("");

  // Deduplication cache ref to prevent duplicate concurrent API requests
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
            // Fetch list of user's journeys as fallback selection
            const listRes = await apiGetMyJourneys(token);
            if (listRes && listRes.journeys && listRes.journeys.length > 0) {
              setMyJourneys(listRes.journeys);
              // Pick most recent active or upcoming journey
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

  // 2. Fetch Crowd & Weather Predictions based on Journey
  const fetchPredictions = async (targetJourney, forceRefresh = false) => {
    if (!targetJourney || !targetJourney.pilgrimageCenterId) return;

    const center = targetJourney.pilgrimageCenterId;
    const centerId = center._id || center.id || center;
    const centerName = center.name || "Pilgrimage Center";

    const journeyDateRaw = targetJourney.journeyDate || new Date().toISOString();
    const dateStr = new Date(journeyDateRaw).toISOString().split("T")[0];

    const requestKey = `${targetJourney._id || journeyId}_${centerId}_${dateStr}`;

    if (!forceRefresh && fetchedKeyRef.current === requestKey) {
      return; // Deduplicated
    }

    fetchedKeyRef.current = requestKey;

    // Fetch Crowd Prediction
    setLoadingCrowd(true);
    setCrowdError("");
    apiPredictCrowd(
      {
        pilgrimage_center: centerName,
        prediction_date: dateStr,
      },
      token
    )
      .then((res) => {
        const payloadData = (res && res.data) ? res.data : res;
        setCrowdData(payloadData);
      })
      .catch((err) => {
        console.error("Crowd Prediction error:", err);
        setCrowdError(err.message || "Unable to fetch crowd prediction.");
      })
      .finally(() => {
        setLoadingCrowd(false);
      });

    // Fetch Weather Assessment
    setLoadingWeather(true);
    setWeatherError("");
    apiGetWeatherByCenterId(centerId, dateStr, token)
      .then((data) => {
        setWeatherData(data);
      })
      .catch((err) => {
        console.error("Weather Prediction error:", err);
        setWeatherError(err.message || "Unable to fetch weather prediction.");
      })
      .finally(() => {
        setLoadingWeather(false);
      });
  };

  useEffect(() => {
    if (journey && journey.pilgrimageCenterId) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      fetchPredictions(journey);
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
      fetchPredictions(journey, true);
    }
  };

  // Compute Overall Safety & Risk Index
  const computeOverallSafety = () => {
    let score = 90;
    const warnings = [];

    // Crowd risk deduction
    if (crowdData) {
      const crowdLevel = (crowdData.crowd_category || crowdData.crowd_level || "").toUpperCase();
      if (crowdLevel === "VERY HIGH") {
        score -= 30;
        warnings.push("Extremely high crowd density expected");
      } else if (crowdLevel === "HIGH") {
        score -= 20;
        warnings.push("Heavy crowd density anticipated");
      } else if (crowdLevel === "MODERATE") {
        score -= 10;
      }

      if (crowdData.is_festival) {
        score -= 10;
        warnings.push(`Special Festival Event: ${crowdData.festival_name || "Major Pilgrimage Festival"}`);
      }
    }

    // Weather risk deduction
    if (weatherData) {
      const weatherRisk = (weatherData.weatherRisk || "").toUpperCase();
      if (weatherRisk === "HIGH") {
        score -= 25;
        warnings.push("High weather risk (adverse weather conditions)");
      } else if (weatherRisk === "MODERATE") {
        score -= 12;
        warnings.push("Moderate weather variability expected");
      }

      if (weatherData.rainProbability >= 60) {
        warnings.push(`High rain probability (${weatherData.rainProbability}%)`);
      }
    }

    score = Math.max(20, Math.min(98, score));

    let riskLevel = "LOW RISK";
    let riskColor = "var(--success-color, #10b981)";
    let headline = "Optimal Pilgrimage Travel Conditions";

    if (score < 55) {
      riskLevel = "HIGH RISK";
      riskColor = "var(--danger-color, #ef4444)";
      headline = "Exercise High Caution & Plan Extra Time";
    } else if (score < 78) {
      riskLevel = "MODERATE RISK";
      riskColor = "var(--warning-color, #f59e0b)";
      headline = "Moderate Crowds & Weather Variability";
    }

    return { score, riskLevel, riskColor, headline, warnings };
  };

  const safetyInfo = computeOverallSafety();
  const centerInfo = journey?.pilgrimageCenterId || {};

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

            <button className="btn-refresh" onClick={handleRefresh} title="Refresh Predictions">
              <FiRefreshCw className={loadingCrowd || loadingWeather ? "spin" : ""} /> Refresh Assessment
            </button>
          </div>

          {/* Loading State */}
          {loadingJourney && (
            <div className="assessment-loading">
              <div className="spinner"></div>
              <p>Loading assessment...</p>
            </div>
          )}

          {/* Journey Error / No Selection State */}
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
                    <FiZap /> Travel Assessment Engine
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
                      <span className="meta-value">{journey.totalPilgrims || (journey.travelingAlone ? 1 : 1 + (journey.travelingFamilyMembers?.length || 0))} Person(s)</span>
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

              {/* AI Safety Index Overview Bar */}
              <div className="safety-index-banner" style={{ borderLeftColor: safetyInfo.riskColor }}>
                <div className="safety-score-circle" style={{ borderColor: safetyInfo.riskColor }}>
                  <span className="score-num" style={{ color: safetyInfo.riskColor }}>
                    {safetyInfo.score}
                  </span>
                  <span className="score-max">/100</span>
                </div>

                <div className="safety-details">
                  <div className="safety-head">
                    <h2>{safetyInfo.headline}</h2>
                    <span className="safety-tag" style={{ backgroundColor: `${safetyInfo.riskColor}22`, color: safetyInfo.riskColor, borderColor: safetyInfo.riskColor }}>
                      <FiShield /> {safetyInfo.riskLevel}
                    </span>
                  </div>
                  <p className="safety-sub">
                    Combined PilgrimIQ assessment generated from real-time crowd density ML predictions and weather metrics.
                  </p>
                  {safetyInfo.warnings.length > 0 && (
                    <div className="safety-warnings-list">
                      {safetyInfo.warnings.map((w, idx) => (
                        <span key={idx} className="warning-pill">
                          <FiAlertTriangle /> {w}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Assessment Cards Grid */}
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
                    {crowdData && (
                      <span className={`crowd-badge badge-${(crowdData.crowd_category || crowdData.crowd_level || "MODERATE").toLowerCase().replace(" ", "-")}`}>
                        {crowdData.crowd_category || crowdData.crowd_level || "Moderate Density"}
                      </span>
                    )}
                  </div>

                  <div className="card-body">
                    {loadingCrowd ? (
                      <div className="card-loading">
                        <div className="spinner"></div>
                        <p>Calculating crowd density...</p>
                      </div>
                    ) : crowdError ? (
                      <div className="card-error-notice">
                        <FiAlertTriangle />
                        <span>{crowdError}</span>
                        <button className="btn-retry" onClick={() => fetchPredictions(journey, true)}>
                          Retry
                        </button>
                      </div>
                    ) : crowdData ? (
                      <>
                        {/* Festival Banner if active */}
                        {crowdData.is_festival && (
                          <div className="festival-alert-banner">
                            <FiZap className="fest-icon" />
                            <div>
                              <strong>Special Festival Event: {crowdData.festival_name}</strong>
                              <p>Significant surge in pilgrim arrivals expected on this date.</p>
                            </div>
                          </div>
                        )}

                        <div className="crowd-metrics-row">
                          <div className="metric-box highlighted-metric">
                            <span className="metric-label">Predicted Pilgrims</span>
                            <span className="metric-value">
                              {(crowdData.predicted_crowd || crowdData.expected_visitors || crowdData.crowd_count || 15000).toLocaleString()}
                            </span>
                            <span className="metric-note">Estimated daily count</span>
                          </div>

                          <div className="metric-box">
                            <span className="metric-label">Expected Queue Time</span>
                            <span className="metric-value">{crowdData.estimated_wait_time || crowdData.queue_time || "45 - 60 mins"}</span>
                            <span className="metric-note">At main darshan queue</span>
                          </div>
                        </div>

                        {/* Capacity Bar */}
                        <div className="capacity-section">
                          <div className="capacity-header">
                            <span>Peak Capacity Utilization</span>
                            <span>{crowdData.capacity_utilization_percent || (crowdData.crowd_category === "VERY HIGH" ? 92 : crowdData.crowd_category === "HIGH" ? 78 : 45)}%</span>
                          </div>
                          <div className="capacity-bar-track">
                            <div
                              className={`capacity-bar-fill fill-${(crowdData.crowd_category || "MODERATE").toLowerCase().replace(" ", "-")}`}
                              style={{ width: `${crowdData.capacity_utilization_percent || (crowdData.crowd_category === "VERY HIGH" ? 92 : crowdData.crowd_category === "HIGH" ? 78 : 45)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Advisory Notes */}
                        <div className="advisory-section">
                          <h4><FiInfo /> Crowd Advisory & Peak Hours</h4>
                          <ul>
                            <li><strong>Peak Crowd Hours:</strong> {crowdData.peak_hours || "06:00 AM - 11:30 AM, 05:00 PM - 08:30 PM"}</li>
                            <li><strong>Recommended Darshan Window:</strong> {crowdData.recommended_window || "Early morning before 06:00 AM or post 08:30 PM"}</li>
                            <li><strong>Senior & Special Assistance:</strong> {crowdData.special_access_info || "Dedicated priority queue available at Gate 2"}</li>
                          </ul>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* WEATHER PREDICTION CARD */}
                <div className="assessment-card weather-card">
                  <div className="card-header">
                    <div className="header-title">
                      <FiSun className="card-icon weather-icon-style" />
                      <div>
                        <h3>Weather Prediction</h3>
                        <span className="card-subtitle">Corresponding OpenWeather Assessment</span>
                      </div>
                    </div>
                    {weatherData && (
                      <span className={`weather-risk-badge risk-${(weatherData.weatherRisk || "LOW").toLowerCase()}`}>
                        {weatherData.weatherRisk || "LOW"} RISK
                      </span>
                    )}
                  </div>

                  <div className="card-body">
                    {loadingWeather ? (
                      <div className="card-loading">
                        <div className="spinner"></div>
                        <p>Fetching weather telemetry for {centerInfo.name}...</p>
                      </div>
                    ) : weatherError ? (
                      <div className="card-error-notice">
                        <FiAlertTriangle />
                        <span>{weatherError}</span>
                        <button className="btn-retry" onClick={() => fetchPredictions(journey, true)}>
                          Retry
                        </button>
                      </div>
                    ) : weatherData ? (
                      <>
                        {/* Notice if forecast date is beyond range */}
                        {weatherData.isForecastAvailable === false && (
                          <div className="weather-forecast-notice">
                            <FiInfo className="notice-icon" />
                            <span>
                              {weatherData.forecastNotice ||
                                "Weather forecast for this journey date is not yet available. Weather will be updated when the forecast becomes available."}
                            </span>
                          </div>
                        )}

                        <div className="weather-current-grid">
                          <div className="temp-display">
                            <div className="temp-main">
                              <span className="temp-val">
                                {weatherData.selectedDateWeather ? weatherData.selectedDateWeather.temp : weatherData.temperature}°C
                              </span>
                              <span className="temp-cond">
                                {weatherData.selectedDateWeather ? weatherData.selectedDateWeather.condition : weatherData.condition}
                              </span>
                            </div>
                            <span className="temp-feels">
                              Feels like {weatherData.selectedDateWeather ? weatherData.selectedDateWeather.feelsLike : weatherData.feelsLike}°C
                            </span>
                          </div>

                          <div className="weather-stats-grid">
                            <div className="weather-stat">
                              <FiCloudRain className="stat-icon rain-icon" />
                              <div>
                                <span className="stat-label">Rain Chance</span>
                                <span className="stat-val">
                                  {weatherData.selectedDateWeather ? weatherData.selectedDateWeather.rainProbability : weatherData.rainProbability}%
                                </span>
                              </div>
                            </div>

                            <div className="weather-stat">
                              <FiDroplet className="stat-icon humidity-icon" />
                              <div>
                                <span className="stat-label">Humidity</span>
                                <span className="stat-val">
                                  {weatherData.selectedDateWeather ? weatherData.selectedDateWeather.humidity : weatherData.humidity}%
                                </span>
                              </div>
                            </div>

                            <div className="weather-stat">
                              <FiWind className="stat-icon wind-icon" />
                              <div>
                                <span className="stat-label">Wind Speed</span>
                                <span className="stat-val">
                                  {weatherData.selectedDateWeather ? weatherData.selectedDateWeather.windSpeed : weatherData.windSpeed} km/h
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Weather Risk Reasons */}
                        {weatherData.riskReasons && weatherData.riskReasons.length > 0 && (
                          <div className="weather-risk-reasons">
                            <h4>Weather Factors:</h4>
                            <ul>
                              {weatherData.riskReasons.map((reason, i) => (
                                <li key={i}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 7-Day Weather Forecast Strip */}
                        {weatherData.forecast && weatherData.forecast.length > 0 && (
                          <div className="forecast-strip-container">
                            <h4>7-Day Regional Forecast</h4>
                            <div className="forecast-strip">
                              {weatherData.forecast.map((fItem, idx) => (
                                <div
                                  key={idx}
                                  className={`forecast-day-card ${
                                    fItem.date === new Date(journey.journeyDate).toISOString().split("T")[0] ? "active-journey-day" : ""
                                  }`}
                                >
                                  <span className="f-day">{fItem.day}</span>
                                  <span className="f-date">{fItem.date.slice(5)}</span>
                                  <span className="f-temp">{fItem.temp}°C</span>
                                  <span className="f-rain"><FiCloudRain /> {fItem.rainProbability}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Pilgrim Advisory & Essential Checklist Card */}
              <div className="assessment-card checklist-card">
                <div className="card-header">
                  <div className="header-title">
                    <FiCheckCircle className="card-icon check-icon-style" />
                    <div>
                      <h3>Pilgrim Preparation & Safety Checklist</h3>
                      <span className="card-subtitle">Tailored recommendations for {centerInfo.name}</span>
                    </div>
                  </div>
                </div>

                <div className="checklist-grid">
                  <div className="check-column">
                    <h4><FiShield /> Travel Recommendations</h4>
                    <ul className="check-list">
                      <li><FiCheck className="chk-ic" /> Carry re-usable water bottles to stay hydrated during queue hours.</li>
                      <li><FiCheck className="chk-ic" /> Wear breathable, comfortable footwear suitable for walking.</li>
                      <li><FiCheck className="chk-ic" /> Keep valid photo ID proof handy for entry verification.</li>
                      <li><FiCheck className="chk-ic" /> Download offline map route & emergency contact numbers.</li>
                    </ul>
                  </div>

                  <div className="check-column">
                    <h4><FiThermometer /> Weather & Health Gear</h4>
                    <ul className="check-list">
                      {weatherData && weatherData.rainProbability >= 40 && (
                        <li className="highlighted-chk"><FiCheck className="chk-ic" /> Rain umbrella / poncho recommended due to forecasted precipitation.</li>
                      )}
                      {weatherData && (weatherData.temperature > 32 || (weatherData.selectedDateWeather && weatherData.selectedDateWeather.temp > 32)) && (
                        <li className="highlighted-chk"><FiCheck className="chk-ic" /> Sun protection cap, sunglasses, and high-SPF sunscreen required.</li>
                      )}
                      <li><FiCheck className="chk-ic" /> Personal medication & basic first-aid supplies for elderly travel group members.</li>
                      <li><FiCheck className="chk-ic" /> Emergency medical card and pilgrim registration token.</li>
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
        </div>
      </div>
    </div>
  );
}

export default TravelAssessment;
