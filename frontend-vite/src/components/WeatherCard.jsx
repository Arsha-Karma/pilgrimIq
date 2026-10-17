import React, { useState } from "react";
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
  FiRefreshCw
} from "react-icons/fi";

const WeatherCard = ({ weatherData, loading, error, centerName }) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(null); // null = Live Current Weather; 0..6 = Forecast Day

  if (loading) {
    return (
      <div className="weather-card-container loading-card">
        <div className="weather-spinner-wrapper">
          <FiLoader className="weather-spinner-icon" />
          <p className="weather-loading-text">Fetching weather information...</p>
        </div>
      </div>
    );
  }

  if (error || !weatherData) {
    const isMissingCoords = error && error.includes("unavailable for this pilgrimage center");
    return (
      <div className="weather-card-container error-card">
        <div className="weather-error-content">
          <FiAlertTriangle className="weather-error-icon" />
          <div>
            <h4 className="weather-error-title">Weather Service Notice</h4>
            <p className="weather-error-message">
              {error || "Weather information is temporarily unavailable."}
            </p>
            {isMissingCoords && (
              <p className="weather-error-sub">
                Latitude and longitude coordinates are missing for {centerName || "this center"}.
              </p>
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
    forecast = [],
  } = weatherData;

  // Active view: either selected forecast day or live current weather
  const isForecastSelected = selectedDayIndex !== null && forecast[selectedDayIndex];
  const selectedDay = isForecastSelected ? forecast[selectedDayIndex] : null;

  const displayTemp = isForecastSelected ? selectedDay.temp : currentTemp;
  const displayFeelsLike = isForecastSelected ? (selectedDay.feelsLike ?? selectedDay.temp) : currentFeelsLike;
  const displayHumidity = isForecastSelected ? (selectedDay.humidity ?? currentHumidity) : currentHumidity;
  const displayWindSpeed = isForecastSelected ? (selectedDay.windSpeed ?? currentWindSpeed) : currentWindSpeed;
  const displayCondition = isForecastSelected ? selectedDay.condition : currentCondition;
  const displayIcon = isForecastSelected ? selectedDay.icon : currentIcon;
  const displayRainProb = isForecastSelected ? selectedDay.rainProbability : currentRainProb;
  const displaySunrise = isForecastSelected ? (selectedDay.sunrise ?? currentSunrise) : currentSunrise;
  const displaySunset = isForecastSelected ? (selectedDay.sunset ?? currentSunset) : currentSunset;

  return (
    <div className="weather-card-container">
      {/* CARD HEADER */}
      <div className="weather-card-header">
        <div className="header-title-box">
          <span className="header-eyebrow">
            {isForecastSelected ? `SELECTED FORECAST DAY: ${selectedDay.day.toUpperCase()} (${selectedDay.date})` : "LIVE METEOROLOGICAL DATA"}
          </span>
          <h3>
            Weather at {weatherData.centerName || centerName || "Pilgrimage Center"}
            {isForecastSelected && <span className="selected-day-tag"> — {selectedDay.day}, {selectedDay.date}</span>}
          </h3>
        </div>
        {isForecastSelected && (
          <div className="header-action-group">
            <button
              type="button"
              className="reset-live-btn"
              onClick={() => setSelectedDayIndex(null)}
              title="Reset to Live Current Weather"
            >
              <FiRefreshCw className="btn-icon" /> Reset to Current Live
            </button>
          </div>
        )}
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
          <span>Sunrise: <strong>{displaySunrise}</strong></span>
        </div>
        <div className="sun-divider"></div>
        <div className="sun-item">
          <FiSunset className="sun-icon set" />
          <span>Sunset: <strong>{displaySunset}</strong></span>
        </div>
      </div>

      {/* 7-DAY FORECAST SECTION WITH DAY SELECTION */}
      {forecast.length > 0 && (
        <div className="weather-forecast-section">
          <div className="forecast-title-row">
            <div className="forecast-title">
              <FiCalendar className="forecast-icon" />
              <h4>7-Day Weather Forecast</h4>
            </div>
          </div>

          <div className="forecast-grid-7">
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
                      <span className="temp-range">{dayItem.tempMin}° / {dayItem.tempMax}°</span>
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
