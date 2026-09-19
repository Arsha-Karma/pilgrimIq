import React, { useState } from "react";
import {
  FiBell,
  FiCloudRain,
  FiAlertTriangle,
  FiNavigation,
  FiHeart,
  FiDroplet,
  FiUsers,
  FiShield,
  FiMail,
  FiGlobe,
  FiSave
} from "react-icons/fi";

const NOTIF_FIELDS = [
  {
    key: "weatherAlerts",
    label: "Weather Alerts",
    desc: "Receive real-time weather update notifications for your pilgrimage route.",
    icon: FiCloudRain,
  },
  {
    key: "severeWeatherAlerts",
    label: "Severe Weather Warnings",
    desc: "Critical alerts for heavy rain, landslides, extreme temperatures, or storm advisories.",
    icon: FiAlertTriangle,
  },
  {
    key: "journeyProgressAlerts",
    label: "Journey Progress Alerts",
    desc: "Notifications on checkpoint completions, distance covered, and rest stops.",
    icon: FiNavigation,
  },
  {
    key: "medicineReminders",
    label: "Medicine Reminders",
    desc: "Timely reminders to take scheduled medications based on your health profile.",
    icon: FiHeart,
  },
  {
    key: "hydrationReminders",
    label: "Hydration & Health Reminders",
    desc: "Water and rest break prompts recommended for high-altitude or physically demanding routes.",
    icon: FiDroplet,
  },
  {
    key: "familyTrackingAlerts",
    label: "Family Tracking Alerts",
    desc: "Updates when linked family members complete checkpoints or request assistance.",
    icon: FiUsers,
  },
  {
    key: "communityAssistanceAlerts",
    label: "Community Assistance Alerts",
    desc: "Notifications when nearby pilgrims request help or community volunteers respond.",
    icon: FiUsers,
  },
  {
    key: "emergencyNotifications",
    label: "Emergency & SOS Alerts",
    desc: "High-priority emergency alerts, base camp rescue updates, and medical dispatch notifications.",
    icon: FiShield,
    isSafetyCritical: true,
  },
  {
    key: "emailNotifications",
    label: "Email Notifications",
    desc: "Receive booking confirmations, itinerary updates, and weekly health summaries via email.",
    icon: FiMail,
  },
  {
    key: "browserNotifications",
    label: "Browser & Push Notifications",
    desc: "Allow push notifications directly on your browser tab or desktop.",
    icon: FiGlobe,
  },
];

function NotificationSettings({ settings, onUpdateSettings, showToast }) {
  const [notifState, setNotifState] = useState(
    settings.notificationSettings || {}
  );
  const [saving, setSaving] = useState(false);

  const handleToggle = (key) => {
    const updated = { ...notifState, [key]: !notifState[key] };
    setNotifState(updated);
    
    // Auto save to settings
    const newSettings = {
      ...settings,
      notificationSettings: updated,
    };
    onUpdateSettings(newSettings);
    showToast("Notification preference updated.", "success");
  };

  const handleSaveAll = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      const newSettings = {
        ...settings,
        notificationSettings: notifState,
      };
      onUpdateSettings(newSettings);
      showToast("Notification settings saved successfully!", "success");
    }, 600);
  };

  return (
    <div className="notification-settings-container">
      <div className="settings-section-header">
        <h2>
          <FiBell size={22} /> Notification Preferences
        </h2>
        <p>Customize alert notifications, health reminders, and safety dispatches.</p>
      </div>

      {/* EMERGENCY SAFETY NOTICE */}
      {!notifState.emergencyNotifications && (
        <div className="settings-warning-box danger-style">
          <FiAlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Warning: Emergency Alerts Disables</strong>
            <br />
            Disabling emergency notifications may reduce real-time safety alerts and SOS dispatch warnings while trekking on pilgrim routes.
          </div>
        </div>
      )}

      {/* NOTIFICATIONS TOGGLE CARD */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon-badge">
              <FiBell />
            </div>
            <div>
              <h3>Alert & Notification Controls</h3>
              <p>Turn individual notifications ON or OFF</p>
            </div>
          </div>

          <button type="button" className="btn-settings-primary" onClick={handleSaveAll} disabled={saving}>
            <FiSave /> {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>

        <div>
          {NOTIF_FIELDS.map((field) => {
            const Icon = field.icon;
            const isChecked = !!notifState[field.key];
            return (
              <div key={field.key} className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">
                    <Icon size={16} style={{ color: field.isSafetyCritical ? "var(--rose-brand)" : "var(--blue-brand)" }} />
                    {field.label}
                    {field.isSafetyCritical && (
                      <span className="badge-current-session" style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>
                        Safety Critical
                      </span>
                    )}
                  </span>
                  <span className="settings-toggle-desc">{field.desc}</span>
                </div>

                <label className="switch-toggle">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggle(field.key)}
                  />
                  <span className="slider-round"></span>
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default NotificationSettings;
