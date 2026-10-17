import React, { useState } from "react";
import {
  FiUsers,
  FiShield,
  FiSlash,
  FiInfo
} from "react-icons/fi";

function FamilyCommunityPrivacy({ settings, onUpdateSettings, showToast }) {
  const [famState, setFamState] = useState(
    settings.familyPrivacySettings || {}
  );
  const [showDisableModal, setShowDisableModal] = useState(false);

  const handleToggle = (key) => {
    const updated = { ...famState, [key]: !famState[key] };
    setFamState(updated);
    const newSettings = {
      ...settings,
      familyPrivacySettings: updated,
    };
    onUpdateSettings(newSettings);
    showToast("Privacy setting updated.", "success");
  };

  const handleSharedInfoToggle = (infoKey) => {
    const currentShared = famState.sharedInfoWithCommunity || {};
    const updatedShared = {
      ...currentShared,
      [infoKey]: !currentShared[infoKey],
    };
    const updated = {
      ...famState,
      sharedInfoWithCommunity: updatedShared,
    };
    setFamState(updated);
    const newSettings = {
      ...settings,
      familyPrivacySettings: updated,
    };
    onUpdateSettings(newSettings);
    showToast("Helper sharing permission updated.", "success");
  };

  const handleVisibilityChange = (e) => {
    const val = e.target.value;
    const updated = { ...famState, familyTrackingVisibility: val };
    setFamState(updated);
    const newSettings = {
      ...settings,
      familyPrivacySettings: updated,
    };
    onUpdateSettings(newSettings);
    showToast("Family tracking visibility updated.", "success");
  };

  const handleConfirmDisableCommunity = () => {
    setShowDisableModal(false);
    const updated = {
      ...famState,
      communityAssistancePermission: false,
      sharedInfoWithCommunity: {
        shareName: false,
        shareLocation: false,
        shareJourneyStatus: false,
        shareEmergencyContact: false,
        shareHealthSafetyInfo: false,
      },
    };
    setFamState(updated);
    const newSettings = {
      ...settings,
      familyPrivacySettings: updated,
    };
    onUpdateSettings(newSettings);
    showToast("Community sharing disabled completely.", "success");
  };

  const sharedInfo = famState.sharedInfoWithCommunity || {};

  return (
    <div className="family-privacy-container">
      <div className="settings-section-header">
        <h2>
          <FiUsers size={22} /> Family & Community Privacy
        </h2>
        <p>Manage location sharing permissions for family members and local community helpers.</p>
      </div>

      {/* 1. FAMILY & JOURNEY GROUP SHARING */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon-badge">
              <FiUsers />
            </div>
            <div>
              <h3>Family & Journey Group Sharing</h3>
              <p>Control visibility settings for linked contacts</p>
            </div>
          </div>
        </div>

        <div>
          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-label">Share Location with Family</span>
              <span className="settings-toggle-desc">Allow approved family members to view your real-time position</span>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={!!famState.shareWithFamily}
                onChange={() => handleToggle("shareWithFamily")}
              />
              <span className="slider-round"></span>
            </label>
          </div>

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-label">Share Location with Journey Group</span>
              <span className="settings-toggle-desc">Allow members of your active trekking group to see your coordinates</span>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={!!famState.shareWithJourneyGroup}
                onChange={() => handleToggle("shareWithJourneyGroup")}
              />
              <span className="slider-round"></span>
            </label>
          </div>

          <div className="settings-form-grid" style={{ marginTop: "16px" }}>
            <div className="settings-field-group" style={{ gridColumn: "1 / -1" }}>
              <label>Family Tracking Visibility Rule</label>
              <div className="settings-input-wrapper">
                <select
                  value={famState.familyTrackingVisibility || "ActiveJourneysOnly"}
                  onChange={handleVisibilityChange}
                >
                  <option value="ActiveJourneysOnly">Active Journeys Only (When Trek Starts & Ends)</option>
                  <option value="EmergencyOnly">Emergency SOS Triggers Only</option>
                  <option value="Always">Always Visible to Approved Family</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. COMMUNITY ASSISTANCE GRANULAR CONTROLS */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon-badge">
              <FiShield />
            </div>
            <div>
              <h3>Community Assistance & Helper Permissions</h3>
              <p>Select what information local volunteer helpers can see when you request aid</p>
            </div>
          </div>
        </div>

        <div className="settings-warning-box">
          <FiInfo size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Privacy by Default:</strong>
            <br />
            PilgrimIQ only shares minimal essential info with community helpers. Detailed medical diagnoses and personal history are never disclosed.
          </div>
        </div>

        <div className="settings-toggle-row">
          <div className="settings-toggle-info">
            <span className="settings-toggle-label">Community Assistance Permission</span>
            <span className="settings-toggle-desc">Allow nearby registered community volunteers to assist in emergency alerts</span>
          </div>
          <label className="switch-toggle">
            <input
              type="checkbox"
              checked={!!famState.communityAssistancePermission}
              onChange={() => handleToggle("communityAssistancePermission")}
            />
            <span className="slider-round"></span>
          </label>
        </div>

        {famState.communityAssistancePermission && (
          <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-color)" }}>
            <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "12px", color: "var(--text-dark)" }}>
              Information Shared With Community Helpers:
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px" }}>
                <input
                  type="checkbox"
                  checked={!!sharedInfo.shareName}
                  onChange={() => handleSharedInfoToggle("shareName")}
                  style={{ width: "18px", height: "18px" }}
                />
                Full Name
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px" }}>
                <input
                  type="checkbox"
                  checked={!!sharedInfo.shareLocation}
                  onChange={() => handleSharedInfoToggle("shareLocation")}
                  style={{ width: "18px", height: "18px" }}
                />
                Current GPS Location
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px" }}>
                <input
                  type="checkbox"
                  checked={!!sharedInfo.shareJourneyStatus}
                  onChange={() => handleSharedInfoToggle("shareJourneyStatus")}
                  style={{ width: "18px", height: "18px" }}
                />
                Journey Trekking Status
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px" }}>
                <input
                  type="checkbox"
                  checked={!!sharedInfo.shareEmergencyContact}
                  onChange={() => handleSharedInfoToggle("shareEmergencyContact")}
                  style={{ width: "18px", height: "18px" }}
                />
                Basic Emergency Contact Phone
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px" }}>
                <input
                  type="checkbox"
                  checked={!!sharedInfo.shareHealthSafetyInfo}
                  onChange={() => handleSharedInfoToggle("shareHealthSafetyInfo")}
                  style={{ width: "18px", height: "18px" }}
                />
                Relevant Health & Safety Notes
              </label>
            </div>
          </div>
        )}

        <div style={{ marginTop: "24px" }}>
          <button
            type="button"
            className="btn-settings-danger"
            onClick={() => setShowDisableModal(true)}
          >
            <FiSlash /> Disable All Community Sharing
          </button>
        </div>
      </div>

      {/* DISABLE COMMUNITY SHARING CONFIRMATION MODAL */}
      {showDisableModal && (
        <div className="settings-modal-overlay">
          <div className="settings-modal-card">
            <div className="settings-modal-header">
              <div className="settings-modal-icon warning">
                <FiSlash />
              </div>
              <div className="settings-modal-title-box">
                <h3>Disable All Community Sharing?</h3>
                <p>Revoke helper permissions and broadcasts</p>
              </div>
            </div>

            <div className="settings-modal-body">
              Disabling community sharing will prevent nearby registered volunteers from receiving assistance broadcasts if you request aid on your route.
            </div>

            <div className="settings-modal-footer">
              <button
                type="button"
                className="btn-settings-secondary"
                onClick={() => setShowDisableModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-settings-danger"
                onClick={handleConfirmDisableCommunity}
              >
                Confirm Disable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FamilyCommunityPrivacy;
