import React, { useState } from "react";
import {
  FiSliders,
  FiSun,
  FiMoon,
  FiMonitor,
  FiThermometer,
  FiCompass,
  FiClock
} from "react-icons/fi";
import { applyThemePreference } from "../../services/settingsService";

function AppearanceSettings({ settings, onUpdateSettings, showToast }) {
  const [appState, setAppState] = useState(
    settings.appearanceSettings || {}
  );

  const handleThemeChange = (themeVal) => {
    const updated = { ...appState, theme: themeVal };
    setAppState(updated);
    applyThemePreference(themeVal);
    const newSettings = {
      ...settings,
      appearanceSettings: updated,
    };
    onUpdateSettings(newSettings);
    showToast(`Theme updated to ${themeVal.toUpperCase()}`, "success");
  };

  const handleUnitChange = (field, val) => {
    const updated = { ...appState, [field]: val };
    setAppState(updated);
    const newSettings = {
      ...settings,
      appearanceSettings: updated,
    };
    onUpdateSettings(newSettings);
    showToast("Display preferences updated.", "success");
  };

  return (
    <div className="appearance-settings-container">
      <div className="settings-section-header">
        <h2>
          <FiSliders size={22} /> Appearance & Regional Preferences
        </h2>
        <p>Customize app themes, temperature scales, distance metrics, and clock formats.</p>
      </div>

      {/* 1. THEME SELECTION CARD */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon-badge">
              <FiSun />
            </div>
            <div>
              <h3>Interface Theme</h3>
              <p>Choose your preferred color scheme for PilgrimIQ</p>
            </div>
          </div>
        </div>

        <div className="theme-selector-grid">
          {/* Light Theme */}
          <div
            className={`theme-card-option ${appState.theme === "light" ? "active" : ""}`}
            onClick={() => handleThemeChange("light")}
          >
            <div className="theme-preview-box light">
              <div className="pv-bar" style={{ width: "100%", height: "14px" }}></div>
            </div>
            <span>
              <FiSun size={16} /> Light Theme
            </span>
          </div>

          {/* Dark Theme */}
          <div
            className={`theme-card-option ${appState.theme === "dark" ? "active" : ""}`}
            onClick={() => handleThemeChange("dark")}
          >
            <div className="theme-preview-box dark">
              <div className="pv-bar" style={{ width: "100%", height: "14px" }}></div>
            </div>
            <span>
              <FiMoon size={16} /> Dark Mode
            </span>
          </div>

          {/* System Default */}
          <div
            className={`theme-card-option ${appState.theme === "system" ? "active" : ""}`}
            onClick={() => handleThemeChange("system")}
          >
            <div className="theme-preview-box system">
              <div className="pv-bar" style={{ width: "100%", height: "14px" }}></div>
            </div>
            <span>
              <FiMonitor size={16} /> System Default
            </span>
          </div>
        </div>
      </div>

      {/* 2. UNITS & REGIONAL PREFERENCES */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon-badge">
              <FiThermometer />
            </div>
            <div>
              <h3>Units & Measurement Standards</h3>
              <p>Configure measurement scales used in weather and maps</p>
            </div>
          </div>
        </div>

        <div className="settings-form-grid">
          {/* Temperature Unit */}
          <div className="settings-field-group">
            <label>
              <FiThermometer size={16} /> Temperature Unit
            </label>
            <div className="settings-input-wrapper">
              <select
                value={appState.temperatureUnit || "C"}
                onChange={(e) => handleUnitChange("temperatureUnit", e.target.value)}
              >
                <option value="C">Celsius (°C)</option>
                <option value="F">Fahrenheit (°F)</option>
              </select>
            </div>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
              Applied to weather cards, advisories, and trek forecasts.
            </span>
          </div>

          {/* Distance Unit */}
          <div className="settings-field-group">
            <label>
              <FiCompass size={16} /> Distance Unit
            </label>
            <div className="settings-input-wrapper">
              <select
                value={appState.distanceUnit || "km"}
                onChange={(e) => handleUnitChange("distanceUnit", e.target.value)}
              >
                <option value="km">Kilometres (km)</option>
                <option value="mi">Miles (mi)</option>
              </select>
            </div>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
              Applied to journey lengths, route maps, and nearby medical stations.
            </span>
          </div>

          {/* Time Format */}
          <div className="settings-field-group">
            <label>
              <FiClock size={16} /> Time Format
            </label>
            <div className="settings-input-wrapper">
              <select
                value={appState.timeFormat || "12h"}
                onChange={(e) => handleUnitChange("timeFormat", e.target.value)}
              >
                <option value="12h">12-Hour Clock (e.g. 02:30 PM)</option>
                <option value="24h">24-Hour Clock (e.g. 14:30)</option>
              </select>
            </div>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
              Applied to journey schedules, notifications, and login history logs.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppearanceSettings;
