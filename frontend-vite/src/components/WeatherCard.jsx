import React, { useState, useEffect } from "react";
import "./WeatherCard.css";
import {
  FiSun,
  FiCloudRain,
  FiWind,
  FiDroplet,
  FiSunrise,
  FiSunset,
  FiAlertTriangle,
  FiLoader,
  FiCalendar,
  FiCloud,
  FiThermometer,
  FiCheck,
  FiRefreshCw,
  FiInfo,
} from "react-icons/fi";

const WeatherCard = ({
  weatherData,
  loading,
  error,
  centerName,
  onRetry,
  selectedJourneyDate,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(null); // null = Live Current Weather; 0..15 = Forecast Day

  const forecast = weatherData?.forecast || [];

  // When selectedJourneyDate changes or weatherData loads, auto-select matching forecast day
  useEffect(() => {
    if (selectedJourneyDate && forecast.length > 0) {
      const parsedDate = selectedJourneyDate.includes("T")
        ? selectedJourneyDate.split("T")[0]
        : selectedJourneyDate;

      const idx = forecast.findIndex((f) => f.date === parsedDate);
      if (idx !== -1) {
        setSelectedDayIndex(idx);
      } else {
        setSelectedDayIndex(null);
      }
    } else {
      setSelectedDayIndex(null);
    }
  }, [selectedJourneyDate, forecast]);

  if (loading) {
    return (
      <div className="weather-card-container loading-card">
        <div className="weather-spinner-wrapper">
          <FiLoader className="weather-spinner-icon" />
          <p className="weather-loading-text">Fetching real-time weather information...</p>
        </div>
      </div>
    );
  }

  if (error || !weatherData) {
    const isMissingCoords =
      error &&
      (error.includes("unavailable for this pilgrimage center") ||
        error.includes("coordinates are missing"));

    return (
      <div className="weather-card-container error-card">
        <div className="weather-error-content">
          <FiAlertTriangle className="weather-error-icon" />
          <div style={{ flex: 1 }}>
            <h4 className="weather-error-title">Weather Telemetry Notice</h4>
            <p className="weather-error-message">
              {error || "Weather information is temporarily unavailable."}
            </p>
            {isMissingCoords && (
              <p className="weather-error-sub">
                Latitude and longitude coordinates are missing for {centerName || "this center"}.
              </p>
            )}
            {onRetry && (
              <button
                type="button"
                className="btn-retry-weather"
                onClick={onRetry}
                style={{
                  marginTop: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                <FiRefreshCw /> Retry Weather Telemetry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const {
    temperature: currentTemp,
    feelsLike: currentFeelsLike,
    humidity: currentHumidity,
    windSpeed: currentWindSpeed,
    condition: currentCondition,
    weatherIcon: currentIcon,
    rainProbability: currentRainProb,
    sunrise: currentSunrise,
    sunset: currentSunset,
    forecastNotice,
    isForecastAvailable,
    source,
  } = weatherData;

  // Active view: either selected forecast day or live current weather
  const isForecastSelected =
    selectedDayIndex !== null && forecast[selectedDayIndex] !== undefined;
  const selectedDay = isForecastSelected ? forecast[selectedDayIndex] : null;

  const displayTemp = isForecastSelected ? selectedDay.temp : currentTemp;
  const displayFeelsLike = isForecastSelected
    ? selectedDay.feelsLike ?? selectedDay.temp
    : currentFeelsLike;
  const displayHumidity = isForecastSelected
    ? selectedDay.humidity ?? currentHumidity
    : currentHumidity;
  const displayWindSpeed = isForecastSelected
    ? selectedDay.windSpeed ?? currentWindSpeed
    : currentWindSpeed;
  const displayCondition = isForecastSelected
    ? selectedDay.condition
    : currentCondition;
  const displayIcon = isForecastSelected ? selectedDay.icon : currentIcon;
  const displayRainProb = isForecastSelected
    ? selectedDay.rainProbability
    : currentRainProb;
  const displaySunrise = isForecastSelected
    ? selectedDay.sunrise ?? currentSunrise
    : currentSunrise;
  const displaySunset = isForecastSelected
    ? selectedDay.sunset ?? currentSunset
    : currentSunset;

  let eyebrowText = "LIVE METEOROLOGICAL TELEMETRY";
  if (isForecastSelected) {
    eyebrowText = `FORECAST FOR JOURNEY DAY: ${selectedDay.day.toUpperCase()} (${selectedDay.date})`;
  } else if (forecastNotice) {
    eyebrowText = "CURRENT LIVE WEATHER (Forecast not yet available for selected date)";
  }

  return (
    <div className="weather-card-container">
      {/* Notice Banner for Unsupported / Future Date */}
      {forecastNotice && (
        <div
          className="weather-notice-banner"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "#fffbeb",
            border: "1px solid #fde68a",
            color: "#92400e",
            padding: "10px 14px",
            borderRadius: "10px",
            marginBottom: "16px",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          <FiInfo style={{ color: "#d97706", fontSize: "20px", flexShrink: 0 }} />
          <span>{forecastNotice}</span>
        </div>
      )}

      {/* CARD HEADER */}
      <div className="weather-card-header">
        <div className="header-title-box">
          <span className="header-eyebrow">{eyebrowText}</span>
          <h3>
            Weather at {weatherData.centerName || centerName || "Pilgrimage Center"}
            {isForecastSelected && (
              <span className="selected-day-tag">
                {" "}
                — {selectedDay.day}, {selectedDay.date}
              </span>
            )}
          </h3>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>
            Source: {source || "Live Meteorological Telemetry"}
          </span>
        </div>

        <div className="header-action-group" style={{ display: "flex", gap: "8px" }}>
          {isForecastSelected && (
            <button
              type="button"
              className="reset-live-btn"
              onClick={() => setSelectedDayIndex(null)}
              title="Reset to Live Current Weather"
            >
              <FiRefreshCw className="btn-icon" /> Reset to Current Live
            </button>
          )}

          {onRetry && (
            <button
              type="button"
              className="reset-live-btn"
              onClick={onRetry}
              title="Refresh Weather Telemetry"
              style={{ background: "#f1f5f9", color: "#334155" }}
            >
              <FiRefreshCw className="btn-icon" /> Refresh
            </button>
          )}
        </div>
      </div>

      {/* CURRENT / SELECTED DAY WEATHER HERO */}
      <div className="weather-hero-section">
        <div className="hero-main-temp">
          <div className="icon-wrapper">
            {displayIcon ? (
              <img
                src={`https://openweathermap.org/img/wn/${displayIcon}@2x.png`}
                alt={displayCondition}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <FiSun className="temp-fallback-icon" />
            )}
          </div>
          <div>
            <div className="temperature-value">{displayTemp}°C</div>
            <div className="condition-text">{displayCondition}</div>
          </div>
        </div>

        <div className="hero-meta-pills">
          <div className="hero-pill">
            <FiThermometer className="pill-icon" />
            <div>
              <span className="pill-label">Feels Like</span>
              <strong className="pill-value">{displayFeelsLike}°C</strong>
            </div>
          </div>

          <div className="hero-pill">
            <FiCloudRain className="pill-icon" />
            <div>
              <span className="pill-label">Rain Probability</span>
              <strong className="pill-value">{displayRainProb}%</strong>
            </div>
          </div>

          <div className="hero-pill">
            <FiDroplet className="pill-icon" />
            <div>
              <span className="pill-label">Humidity</span>
              <strong className="pill-value">{displayHumidity}%</strong>
            </div>
          </div>

          <div className="hero-pill">
            <FiWind className="pill-icon" />
            <div>
              <span className="pill-label">Wind Speed</span>
              <strong className="pill-value">{displayWindSpeed} km/h</strong>
            </div>
          </div>
        </div>
      </div>

      {/* SUNRISE & SUNSET BAR */}
      <div className="sun-schedule-bar">
        <div className="sun-item">
          <FiSunrise className="sun-icon rise" />
          <span>
            Sunrise: <strong>{displaySunrise}</strong>
          </span>
        </div>
        <div className="sun-divider"></div>
        <div className="sun-item">
          <FiSunset className="sun-icon set" />
          <span>
            Sunset: <strong>{displaySunset}</strong>
          </span>
        </div>
      </div>

      {/* MULTI-DAY FORECAST SECTION WITH DAY SELECTION */}
      {forecast.length > 0 && (
        <div className="weather-forecast-section">
          <div className="forecast-title-row">
            <div className="forecast-title">
              <FiCalendar className="forecast-icon" />
              <h4>{forecast.length}-Day Meteorological Forecast</h4>
            </div>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Click any day to view forecast details
            </span>
          </div>

          <div
            className="forecast-grid-7"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
              gap: "10px",
            }}
          >
            {forecast.map((dayItem, idx) => {
              const isSelected = selectedDayIndex === idx;
              return (
                <button
                  type="button"
                  key={idx}
                  className={`forecast-day-card ${isSelected ? "active-selected-day" : ""}`}
                  onClick={() => setSelectedDayIndex(idx)}
                >
                  {isSelected && (
                    <span className="selected-check-badge">
                      <FiCheck /> Selected
                    </span>
                  )}
                  <span className="forecast-day-name">{dayItem.day}</span>
                  <span className="forecast-date">{dayItem.date}</span>
                  <div className="forecast-icon-box">
                    {dayItem.icon ? (
                      <img
                        src={`https://openweathermap.org/img/wn/${dayItem.icon}.png`}
                        alt={dayItem.condition}
                      />
                    ) : (
                      <FiCloud />
                    )}
                  </div>
                  <div className="forecast-temp">
                    <strong>{dayItem.temp}°C</strong>
                    {dayItem.tempMin !== undefined && dayItem.tempMax !== undefined && (
                      <span className="temp-range">
                        {dayItem.tempMin}° / {dayItem.tempMax}°
                      </span>
                    )}
                  </div>
                  <span className="forecast-cond">{dayItem.condition}</span>
                  <div className="forecast-rain">
                    <FiCloudRain className="rain-icon" /> {dayItem.rainProbability}%
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherCard;
