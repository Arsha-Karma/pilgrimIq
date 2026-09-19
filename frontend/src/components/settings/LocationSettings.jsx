import React, { useState } from "react";
import {
  FiMapPin,
  FiNavigation,
  FiClock,
  FiTrash2,
  FiAlertTriangle,
  FiInfo,
  FiX
} from "react-icons/fi";

function LocationSettings({ settings, onUpdateSettings, showToast }) {
  const [locState, setLocState] = useState(settings.locationSettings || {});
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const handleToggle = (key) => {
    const updated = { ...locState, [key]: !locState[key] };
    setLocState(updated);
    const newSettings = {
      ...settings,
      locationSettings: updated,
    };
    onUpdateSettings(newSettings);
    showToast("Location setting updated.", "success");
  };

  const handleConfirmClearHistory = () => {
    setShowClearModal(false);
    const updated = { ...locState, locationHistory: [] };
    setLocState(updated);
    const newSettings = {
      ...settings,
      locationSettings: updated,
    };
    onUpdateSettings(newSettings);
    showToast("Location history cleared permanently.", "success");
  };

  return (
    <div className="location-settings-container">
      <div className="settings-section-header">
        <h2>
          <FiMapPin size={22} /> Location & GPS Settings
        </h2>
        <p>Configure live GPS tracking, journey location sharing, and location history logs.</p>
      </div>

      {/* 1. LOCATION SERVICES & GPS TRACKING */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon-badge">
              <FiMapPin />
            </div>
            <div>
              <h3>Device Location Services</h3>
              <p>Control browser and GPS device positioning access</p>
            </div>
          </div>
        </div>

        <div className="settings-warning-box">
          <FiInfo size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Why Location Access is Needed:</strong>
            <br />
            PilgrimIQ relies on device location to dispatch emergency medical base camps, alert you to mountain weather changes, and help family members verify your safety along trekking routes.
          </div>
        </div>

        <div>
          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-label">Location Services</span>
              <span className="settings-toggle-desc">Enable location positioning permissions across PilgrimIQ</span>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={!!locState.locationServices}
                onChange={() => handleToggle("locationServices")}
              />
              <span className="slider-round"></span>
            </label>
          </div>

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-label">High Precision GPS Tracking</span>
              <span className="settings-toggle-desc">Use high-accuracy GPS positioning for trail navigation</span>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={!!locState.gpsTracking}
                disabled={!locState.locationServices}
                onChange={() => handleToggle("gpsTracking")}
              />
              <span className="slider-round"></span>
            </label>
          </div>
        </div>
      </div>

      {/* 2. JOURNEY TRACKING & FAMILY SHARING */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon-badge">
              <FiNavigation />
            </div>
            <div>
              <h3>Journey Location Tracking</h3>
              <p>Configure automated tracking rules during active pilgrimages</p>
            </div>
          </div>
        </div>

        <div>
          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-label">Track Location During Active Journey</span>
              <span className="settings-toggle-desc">Allow PilgrimIQ to continuously track location while on an active trek</span>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={!!locState.journeyTracking}
                onChange={() => handleToggle("journeyTracking")}
              />
              <span className="slider-round"></span>
            </label>
          </div>

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-label">Family Member Location Sharing</span>
              <span className="settings-toggle-desc">Share live GPS position with approved family members</span>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={!!locState.familyLocationSharing}
                onChange={() => handleToggle("familyLocationSharing")}
              />
              <span className="slider-round"></span>
            </label>
          </div>

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-label">
                Stop Tracking After Journey Completion
                <span className="badge-current-session" style={{ marginLeft: "8px" }}>Default Recommended</span>
              </span>
              <span className="settings-toggle-desc">Automatically disable location background tracking once a journey is marked completed</span>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={!!locState.stopTrackingAfterJourney}
                onChange={() => handleToggle("stopTrackingAfterJourney")}
              />
              <span className="slider-round"></span>
            </label>
          </div>
        </div>
      </div>

      {/* 3. LOCATION HISTORY MANAGEMENT */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon-badge">
              <FiClock />
            </div>
            <div>
              <h3>Location History Logs</h3>
              <p>Stored route history checkpoints and GPS logs</p>
            </div>
          </div>
        </div>

        <div className="settings-toggle-row" style={{ borderBottom: "none" }}>
          <div className="settings-toggle-info">
            <span className="settings-toggle-label">Store Location History</span>
            <span className="settings-toggle-desc">
              Currently storing {locState.locationHistory?.length || 0} location checkpoints
            </span>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              className="btn-settings-secondary"
              onClick={() => setShowHistoryModal(true)}
            >
              <FiClock /> View History
            </button>

            <button
              type="button"
              className="btn-settings-danger"
              onClick={() => setShowClearModal(true)}
            >
              <FiTrash2 /> Clear Location History
            </button>
          </div>
        </div>
      </div>

      {/* VIEW HISTORY MODAL */}
      {showHistoryModal && (
        <div className="settings-modal-overlay">
          <div className="settings-modal-card" style={{ maxWidth: "600px" }}>
            <div className="settings-modal-header" style={{ justifyContent: "space-between", width: "100%" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div className="settings-modal-icon info">
                  <FiMapPin />
                </div>
                <div className="settings-modal-title-box">
                  <h3>Location History Checkpoints</h3>
                  <p>Recent recorded positions along pilgrimage routes</p>
                </div>
              </div>
              <button
                type="button"
                className="input-password-toggle"
                onClick={() => setShowHistoryModal(false)}
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="settings-modal-body">
              {locState.locationHistory && locState.locationHistory.length > 0 ? (
                <div className="sessions-list">
                  {locState.locationHistory.map((item) => (
                    <div key={item.id} className="session-item-card">
                      <div>
                        <h4 style={{ fontSize: "14px", fontWeight: "700" }}>{item.spot}</h4>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                          {item.timestamp} • Coordinates: {item.lat}, {item.lng}
                        </p>
                      </div>
                      <span className="badge-current-session">Verified GPS</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px" }}>
                  No location history logs recorded.
                </p>
              )}
            </div>

            <div className="settings-modal-footer">
              <button
                type="button"
                className="btn-settings-secondary"
                onClick={() => setShowHistoryModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR LOCATION HISTORY CONFIRMATION MODAL */}
      {showClearModal && (
        <div className="settings-modal-overlay">
          <div className="settings-modal-card">
            <div className="settings-modal-header">
              <div className="settings-modal-icon warning">
                <FiTrash2 />
              </div>
              <div className="settings-modal-title-box">
                <h3>Clear Location History?</h3>
                <p>Delete all recorded GPS checkpoints and route history</p>
              </div>
            </div>

            <div className="settings-modal-body">
              <div className="settings-warning-box danger-style">
                <FiAlertTriangle size={20} style={{ flexShrink: 0 }} />
                <div>
                  This action cannot be undone. Once deleted, past location history and checkpoint logs cannot be recovered.
                </div>
              </div>
            </div>

            <div className="settings-modal-footer">
              <button
                type="button"
                className="btn-settings-secondary"
                onClick={() => setShowClearModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-settings-danger"
                onClick={handleConfirmClearHistory}
              >
                Confirm Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationSettings;
