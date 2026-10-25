import React from "react";
import {
  FiNavigation,
  FiMapPin,
  FiFlag,
  FiClock,
  FiCheckCircle,
  FiPauseCircle,
  FiPlayCircle
} from "react-icons/fi";

function JourneyProgressCard({
  journey,
  currentLocation,
  startLocationName,
  destinationName,
  distanceTravelled = 0,
  distanceRemaining = 0,
  progressPercentage = 0,
  estimatedArrivalTime = "ETA unavailable",
  status = "IN_PROGRESS",
  lastUpdatedText = "Just now",
  onStart,
  onPause,
  onResume,
  onEnd,
}) {
  const getStatusBadge = () => {
    switch (status) {
      case "IN_PROGRESS":
      case "active":
        return <span className="status-badge-active">🟢 Journey Active</span>;
      case "PAUSED":
        return <span className="status-badge-paused">⏸️ Journey Paused</span>;
      case "COMPLETED":
        return <span className="status-badge-completed">🎉 Journey Completed</span>;
      case "CANCELLED":
        return <span className="status-badge-cancelled">🔴 Journey Cancelled</span>;
      default:
        return <span className="status-badge-planned">📋 Journey Planned</span>;
    }
  };

  const currAddr = currentLocation?.address || (currentLocation?.latitude && currentLocation?.longitude ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}` : (startLocationName || "Tracking active location..."));

  return (
    <div className="journey-progress-card">
      <div className="card-header-row">
        <div>
          <h3 className="card-title">Journey in Progress</h3>
        </div>
        {getStatusBadge()}
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-label">
          <span>Overall Route Progress</span>
          <span className="progress-percent-val">{Math.round(progressPercentage)}% Completed</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
          ></div>
        </div>
      </div>

      <div className="locations-stack">
        <div className="loc-item">
          <FiNavigation className="loc-icon current-icon" />
          <div className="loc-text">
            <span className="loc-label">Current Location</span>
            <p className="loc-val">{currAddr}</p>
          </div>
        </div>

        <div className="loc-item">
          <FiMapPin className="loc-icon start-icon" />
          <div className="loc-text">
            <span className="loc-label">Starting Point</span>
            <p className="loc-val">{startLocationName || "Origin Location"}</p>
          </div>
        </div>

        <div className="loc-item">
          <FiFlag className="loc-icon dest-icon" />
          <div className="loc-text">
            <span className="loc-label">Destination</span>
            <p className="loc-val">{destinationName || "Pilgrimage Destination"}</p>
          </div>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-box">
          <span className="metric-label">Distance Travelled</span>
          <span className="metric-val">{Number(distanceTravelled).toFixed(1)} km</span>
        </div>
        <div className="metric-box">
          <span className="metric-label">Remaining Distance</span>
          <span className="metric-val highlight">{Number(distanceRemaining).toFixed(1)} km</span>
        </div>
        <div className="metric-box">
          <span className="metric-label">Estimated Arrival</span>
          <span className="metric-val eta-val">
            <FiClock /> {estimatedArrivalTime}
          </span>
        </div>
        <div className="metric-box">
          <span className="metric-label">Last Updated</span>
          <span className="metric-val small-val">{lastUpdatedText}</span>
        </div>
      </div>

      {status !== "COMPLETED" && (
        <div className="journey-card-actions" style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {/* Start Journey Button: Shown only when journey is not yet active */}
          {status !== "IN_PROGRESS" && status !== "PAUSED" && (
            <button
              type="button"
              className="btn-action start"
              onClick={onStart}
              style={{
                flex: "1 1 140px",
                background: "#10b981",
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
                fontWeight: 700,
              }}
            >
              <FiPlayCircle size={18} /> Start Journey
            </button>
          )}

          {status === "PAUSED" ? (
            <button type="button" className="btn-action resume" onClick={onResume} style={{ flex: "1 1 120px" }}>
              <FiPlayCircle /> Resume Journey
            </button>
          ) : (
            status === "IN_PROGRESS" && (
              <button type="button" className="btn-action pause" onClick={onPause} style={{ flex: "1 1 120px" }}>
                <FiPauseCircle /> Pause Journey
              </button>
            )
          )}

          <button type="button" className="btn-action end" onClick={onEnd} style={{ flex: "1 1 120px" }}>
            <FiCheckCircle /> End Journey
          </button>
        </div>
      )}
    </div>
  );
}

export default JourneyProgressCard;
