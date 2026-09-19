import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import UserSidebar from "../components/UserSidebar";
import SettingsSidebar from "../components/settings/SettingsSidebar";
import AccountSettings from "../components/settings/AccountSettings";
import NotificationSettings from "../components/settings/NotificationSettings";
import PrivacySecuritySettings from "../components/settings/PrivacySecuritySettings";
import LocationSettings from "../components/settings/LocationSettings";
import FamilyCommunityPrivacy from "../components/settings/FamilyCommunityPrivacy";
import AppearanceSettings from "../components/settings/AppearanceSettings";
import { getStoredSettings, saveSettingsToStorage, applyThemePreference } from "../services/settingsService";
import "../styles/Settings.css";
import { FiCheckCircle, FiAlertCircle, FiMenu } from "react-icons/fi";

function Settings() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get("category") || queryParams.get("tab") || "account";

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [settings, setSettings] = useState(getStoredSettings());
  const [toasts, setToasts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Sync category with URL or theme on mount
  useEffect(() => {
    applyThemePreference(settings.appearanceSettings?.theme || "light");
  }, [settings.appearanceSettings?.theme]);

  // Toast Notification Helper
  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Category Selector Handler
  const handleSelectCategory = (catId) => {
    setActiveCategory(catId);
    navigate(`/settings?category=${catId}`, { replace: true });
  };

  // Update Settings Handler
  const handleUpdateSettings = (newSettings) => {
    setSettings(newSettings);
    saveSettingsToStorage(newSettings);
  };

  return (
    <div className="pilgrim-settings-wrapper">
      {/* Top Navbar Header */}
      <Navbar />

      {/* Main Page Header Bar */}
      <div
        style={{
          backgroundColor: "var(--card-bg)",
          borderBottom: "1px solid var(--border-color)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle Sidebar"
          >
            <FiMenu size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: "800", color: "var(--navy-primary)", margin: 0 }}>
              PilgrimIQ Settings
            </h1>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
              Preferences, Account Security, Notifications, Location & Privacy
            </p>
          </div>
        </div>
      </div>

      {/* Page Body Container */}
      <div className="settings-body-container">
        {/* User Sidebar */}
        {sidebarOpen && <UserSidebar activeTab="settings" />}

        {/* Settings Left Navigation Sidebar & Mobile Switcher */}
        <SettingsSidebar
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
        />

        {/* Settings Main Content Area */}
        <main className="settings-main-content">
          {activeCategory === "account" && (
            <AccountSettings
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              showToast={showToast}
            />
          )}

          {activeCategory === "notifications" && (
            <NotificationSettings
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              showToast={showToast}
            />
          )}

          {activeCategory === "privacy" && (
            <PrivacySecuritySettings
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onSelectCategory={handleSelectCategory}
              showToast={showToast}
            />
          )}

          {activeCategory === "location" && (
            <LocationSettings
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              showToast={showToast}
            />
          )}

          {activeCategory === "family" && (
            <FamilyCommunityPrivacy
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              showToast={showToast}
            />
          )}

          {activeCategory === "appearance" && (
            <AppearanceSettings
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Toast Notification Container */}
      <div className="settings-toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`settings-toast ${toast.type}`}>
            {toast.type === "success" ? (
              <FiCheckCircle size={18} style={{ color: "var(--emerald-brand)" }} />
            ) : (
              <FiAlertCircle size={18} style={{ color: "var(--rose-brand)" }} />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Settings;
