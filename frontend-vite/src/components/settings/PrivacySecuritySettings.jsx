import React, { useState } from "react";
import {
  FiLock,
  FiShield,
  FiCpu,
  FiShare2,
  FiDownload,
  FiEye,
  FiClock,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiX
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { exportUserAccountData } from "../../services/settingsService";

function PrivacySecuritySettings({ settings, onUpdateSettings, onSelectCategory, showToast }) {
  const { user } = useAuth();
  const [privacy, setPrivacy] = useState(settings.privacySettings || {});

  // Modal for Viewing Raw Account Data
  const [showDataModal, setShowDataModal] = useState(false);

  const handleTogglePrivacy = (key) => {
    const updated = { ...privacy, [key]: !privacy[key] };
    setPrivacy(updated);
    const newSettings = {
      ...settings,
      privacySettings: updated,
    };
    onUpdateSettings(newSettings);
    showToast("Privacy preference updated.", "success");
  };

  const handleMedicalVisibilityChange = (e) => {
    const val = e.target.value;
    const updated = { ...privacy, medicalDataVisibility: val };
    setPrivacy(updated);
    const newSettings = {
      ...settings,
      privacySettings: updated,
    };
    onUpdateSettings(newSettings);
    showToast("Medical data visibility updated.", "success");
  };

  const handleExportData = () => {
    exportUserAccountData(user, settings);
    showToast("Account data exported successfully!", "success");
  };

  return (
    <div className="privacy-settings-container">
      <div className="section-header settings-section-header">
        <h2>
          <FiLock size={22} /> Privacy & Security Settings
        </h2>
        <p>Manage 2FA, AI data consents, session history, and account data exports.</p>
      </div>

      {/* 1. PASSWORD & 2FA CARD */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon-badge">
              <FiShield />
            </div>
            <div>
              <h3>Authentication & Security Controls</h3>
              <p>Password updates & multi-factor authentication</p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-label">Account Password</span>
              <span className="settings-toggle-desc">
                Regularly change your password to safeguard health data and journey credentials.
              </span>
            </div>

            <button
              type="button"
              className="btn-settings-secondary"
              onClick={() => onSelectCategory("account")}
            >
              Change Password <FiArrowRight />
            </button>
          </div>

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-label">
                Two-Factor Authentication (2FA) <span className="badge-coming-soon">Coming Soon</span>
              </span>
              <span className="settings-toggle-desc">
                Add an extra layer of security requiring an OTP code from an authenticator app upon login.
              </span>
            </div>

            <label className="switch-toggle" style={{ opacity: 0.5, cursor: "not-allowed" }}>
              <input type="checkbox" disabled checked={false} />
              <span className="slider-round"></span>
            </label>
          </div>
        </div>
      </div>

      {/* 2. AI PROCESSING CONSENT CARD */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon-badge">
              <FiCpu />
            </div>
            <div>
              <h3>AI Processing Consent</h3>
              <p>Control how PilgrimIQ's AI calculates your Pilgrim Safety Index (PSI)</p>
            </div>
          </div>
        </div>

        <div className="settings-toggle-row">
          <div className="settings-toggle-info">
            <span className="settings-toggle-label">
              Allow PilgrimIQ AI Health Analysis
            </span>
            <span className="settings-toggle-desc">
              Allow PilgrimIQ to process my health and medical information for AI-based risk analysis, terrain suitability scoring, and personalized trekking recommendations.
            </span>
          </div>

          <label className="switch-toggle">
            <input
              type="checkbox"
              checked={!!privacy.aiProcessingConsent}
              onChange={() => handleTogglePrivacy("aiProcessingConsent")}
            />
            <span className="slider-round"></span>
          </label>
        </div>

        {!privacy.aiProcessingConsent && (
          <div className="settings-warning-box danger-style" style={{ marginTop: "16px" }}>
            <FiAlertCircle size={20} style={{ flexShrink: 0 }} />
            <div>
              Disabling AI processing consent will pause automated PSI risk scoring, medical hazard advisories, and smart terrain recommendations for your journeys.
            </div>
          </div>
        )}
      </div>

      {/* 3. MEDICAL DATA PRIVACY */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon-badge">
              <FiFileText />
            </div>
            <div>
              <h3>Medical Data Privacy Controls</h3>
              <p>Configure who can view your medical profile and emergency history</p>
            </div>
          </div>
        </div>

        <div className="settings-form-grid" style={{ marginBottom: "16px" }}>
          <div className="settings-field-group" style={{ gridColumn: "1 / -1" }}>
            <label>Medical Information Access Rights</label>
            <div className="settings-input-wrapper">
              <select
                value={privacy.medicalDataVisibility || "EmergencyOnly"}
                onChange={handleMedicalVisibilityChange}
              >
                <option value="Private">Strictly Private (Only Me)</option>
                <option value="EmergencyOnly">Emergency Only (Verified Base Camp Doctors during Active SOS)</option>
                <option value="ApprovedHelpers">Approved Community Helpers & Verified Physicians</option>
              </select>
            </div>
          </div>
        </div>

        <div className="settings-warning-box">
          <FiCheckCircle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>How PilgrimIQ Protects Medical Data:</strong>
            <br />
            Medical records are encrypted at rest and in transit. Your complete medical reports are never made public or sold to third parties.
          </div>
        </div>
      </div>

      {/* 4. DATA SHARING PREFERENCES */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon-badge">
              <FiShare2 />
            </div>
            <div>
              <h3>Data Sharing Preferences</h3>
              <p>Granular controls over shared features</p>
            </div>
          </div>
        </div>

        <div>
          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-label">Family Member Sharing</span>
              <span className="settings-toggle-desc">Share journey progress with approved family members</span>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={!!privacy.familySharing}
                onChange={() => handleTogglePrivacy("familySharing")}
              />
              <span className="slider-round"></span>
            </label>
          </div>

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-label">Journey Group Sharing</span>
              <span className="settings-toggle-desc">Allow members of your active journey group to coordinate</span>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={!!privacy.journeyGroupSharing}
                onChange={() => handleTogglePrivacy("journeyGroupSharing")}
              />
              <span className="slider-round"></span>
            </label>
          </div>

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-label">Community Assistance Sharing</span>
              <span className="settings-toggle-desc">Allow verified local volunteers to receive assistance broadcasts</span>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={!!privacy.communityAssistanceSharing}
                onChange={() => handleTogglePrivacy("communityAssistanceSharing")}
              />
              <span className="slider-round"></span>
            </label>
          </div>
        </div>
      </div>

      {/* 5. SESSION HISTORY & ACCOUNT DATA EXPORT */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon-badge">
              <FiClock />
            </div>
            <div>
              <h3>Account Data & Security Export</h3>
              <p>Inspect or download all stored personal data</p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn-settings-secondary"
            onClick={() => setShowDataModal(true)}
          >
            <FiEye /> View Stored Account Data
          </button>

          <button
            type="button"
            className="btn-settings-primary"
            onClick={handleExportData}
          >
            <FiDownload /> Download Data Export (JSON)
          </button>
        </div>
      </div>

      {/* RAW DATA MODAL */}
      {showDataModal && (
        <div className="settings-modal-overlay">
          <div className="settings-modal-card" style={{ maxWidth: "680px" }}>
            <div className="settings-modal-header" style={{ justifyContent: "space-between", width: "100%" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div className="settings-modal-icon info">
                  <FiFileText />
                </div>
                <div className="settings-modal-title-box">
                  <h3>Stored Account Data Summary</h3>
                  <p>Read-only inspect of your profile and settings model</p>
                </div>
              </div>
              <button
                type="button"
                className="input-password-toggle"
                onClick={() => setShowDataModal(false)}
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="settings-modal-body" style={{ maxHeight: "350px", overflowY: "auto" }}>
              <pre
                style={{
                  backgroundColor: "#0f172a",
                  color: "#38bdf8",
                  padding: "16px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  overflowX: "auto",
                }}
              >
                {JSON.stringify(
                  {
                    user: {
                      name: user?.name,
                      email: user?.email,
                      phone: user?.phone,
                      role: user?.role,
                      location: user?.location,
                    },
                    settings: settings,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="settings-modal-footer">
              <button
                type="button"
                className="btn-settings-primary"
                onClick={handleExportData}
              >
                <FiDownload /> Export File
              </button>
              <button
                type="button"
                className="btn-settings-secondary"
                onClick={() => setShowDataModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PrivacySecuritySettings;
