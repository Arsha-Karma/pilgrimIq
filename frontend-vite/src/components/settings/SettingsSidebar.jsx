import React from "react";
import {
  FiUser,
  FiBell,
  FiLock,
  FiMapPin,
  FiUsers,
  FiSliders,
  FiChevronRight,
  FiSettings
} from "react-icons/fi";

export const CATEGORIES = [
  { id: "account", label: "Account", icon: FiUser, desc: "Password, Phone, Photo, Sessions" },
  { id: "notifications", label: "Notifications", icon: FiBell, desc: "Weather, Emergency, Reminders" },
  { id: "privacy", label: "Privacy & Security", icon: FiLock, desc: "2FA, AI Consent, Data Sharing" },
  { id: "location", label: "Location & GPS", icon: FiMapPin, desc: "Tracking, History, Permissions" },
  { id: "family", label: "Family & Community Privacy", icon: FiUsers, desc: "Family Sharing, Helper Visibility" },
  { id: "appearance", label: "Appearance", icon: FiSliders, desc: "Theme, Units, Time Format" },
];

function SettingsSidebar({ activeCategory, onSelectCategory }) {
  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="settings-sidebar-nav">
        <div className="settings-sidebar-header">
          <h3>
            <FiSettings size={20} /> Settings
          </h3>
          <p>Manage your PilgrimIQ preferences & account</p>
        </div>

        <ul className="settings-nav-list">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  className={`settings-nav-item ${isActive ? "active" : ""}`}
                  onClick={() => onSelectCategory(cat.id)}
                >
                  <div className="settings-nav-item-left">
                    <Icon className="settings-nav-icon" />
                    <span>{cat.label}</span>
                  </div>
                  <FiChevronRight size={16} style={{ opacity: isActive ? 1 : 0.4 }} />
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Mobile Selector Dropdown */}
      <div className="settings-mobile-tabs">
        <select
          className="settings-mobile-select"
          value={activeCategory}
          onChange={(e) => onSelectCategory(e.target.value)}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label} — ({cat.desc})
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

export default SettingsSidebar;
