import React, { useState } from "react";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiPhone,
  FiCamera,
  FiTrash2,
  FiSmartphone,
  FiMonitor,
  FiLogOut,
  FiAlertTriangle,
  FiShieldOff,
  FiUserX,
  FiCheck,
  FiRefreshCw
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { apiUpdateProfile } from "../../services/api";

function AccountSettings({ settings, onUpdateSettings, showToast }) {
  const { user, token, logout } = useAuth();

  // Password State
  const [pwdForm, setPwdForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
  const [pwdErrors, setPwdErrors] = useState({});
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

  // Phone State
  const [phoneForm, setPhoneForm] = useState({
    currentPhone: user?.phone || "+91 98765 43210",
    newPhone: "",
  });
  const [phoneError, setPhoneError] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpTimer, setOtpTimer] = useState(30);

  // Profile Photo State
  const [photoPreview, setPhotoPreview] = useState(user?.avatar || null);
  const [photoError, setPhotoError] = useState("");
  const [photoSubmitting, setPhotoSubmitting] = useState(false);

  // Active Sessions State
  const [sessions, setSessions] = useState(settings.accountSettings.activeSessions || []);

  // Modal States for Destructive Actions
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Calculate Password Strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score: 1, label: "Weak", class: "weak" };
    if (score <= 4) return { score: 2, label: "Medium", class: "medium" };
    return { score: 3, label: "Strong", class: "strong" };
  };

  const pwdStrength = getPasswordStrength(pwdForm.newPassword);

  // Handle Change Password Submit
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwdForm.currentPassword) errs.currentPassword = "Current password is required";
    if (!pwdForm.newPassword) {
      errs.newPassword = "New password is required";
    } else if (pwdForm.newPassword.length < 6) {
      errs.newPassword = "Password must be at least 6 characters";
    }
    if (pwdForm.confirmPassword !== pwdForm.newPassword) {
      errs.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errs).length > 0) {
      setPwdErrors(errs);
      return;
    }

    setPwdErrors({});
    setPwdSubmitting(true);

    setTimeout(() => {
      setPwdSubmitting(false);
      setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("Password updated successfully!", "success");
    }, 1000);
  };

  // Handle Phone Submit & OTP trigger
  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    const cleanPhone = phoneForm.newPhone.trim();
    if (!cleanPhone || !/^[0-9]{10,12}$/.test(cleanPhone.replace(/\D/g, ""))) {
      setPhoneError("Please enter a valid 10-digit phone number");
      return;
    }
    setPhoneError("");
    setShowOtpModal(true);
    setOtpTimer(30);
  };

  const handleVerifyOtp = () => {
    if (otpCode.length !== 6) {
      setPhoneError("Please enter a 6-digit OTP code");
      return;
    }
    setShowOtpModal(false);
    setPhoneForm((prev) => ({ currentPhone: prev.newPhone, newPhone: "" }));
    setOtpCode("");
    showToast("Phone number verified and updated successfully!", "success");
  };

  // Profile Photo Upload Validation
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Please select a valid JPEG, PNG, or WEBP image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image size must be less than 5MB");
      return;
    }

    setPhotoError("");
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    setPhotoSubmitting(true);
    try {
      if (token) {
        await apiUpdateProfile({ avatar: photoPreview }, token);
      }
      showToast("Profile photo updated successfully!", "success");
    } catch (err) {
      console.error("Failed to save profile photo:", err);
      showToast(err.message || "Failed to update profile photo", "error");
    } finally {
      setPhotoSubmitting(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    showToast("Profile photo removed.", "success");
  };

  // Session Management
  const handleLogoutSession = (sessionId) => {
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);
    const updatedSettings = {
      ...settings,
      accountSettings: { ...settings.accountSettings, activeSessions: updated },
    };
    onUpdateSettings(updatedSettings);
    showToast("Session logged out successfully.", "success");
  };

  const handleConfirmLogoutAll = () => {
    setShowLogoutAllModal(false);
    const currentOnly = sessions.filter((s) => s.isCurrent);
    setSessions(currentOnly);
    const updatedSettings = {
      ...settings,
      accountSettings: { ...settings.accountSettings, activeSessions: currentOnly },
    };
    onUpdateSettings(updatedSettings);
    showToast("Successfully logged out from all other devices.", "success");
  };

  const handleConfirmDeactivate = () => {
    if (!deactivatePassword) {
      showToast("Please enter your password to confirm deactivation", "error");
      return;
    }
    setShowDeactivateModal(false);
    setDeactivatePassword("");
    showToast("Account deactivated. Logging out...", "error");
    setTimeout(() => {
      logout();
    }, 1500);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") {
      showToast("Please type DELETE in capital letters to confirm", "error");
      return;
    }
    setShowDeleteModal(false);
    setDeleteConfirmText("");
    showToast("Account deleted permanently. Goodbye!", "error");
    setTimeout(() => {
      logout();
    }, 1500);
  };

  return (
    <div className="account-settings-container">
      <div className="settings-section-header">
        <h2>
          <FiLock size={22} /> Account Settings
        </h2>
        <p>Manage your password, contact phone, avatar, and active login sessions.</p>
      </div>

      {/* 1. CHANGE PASSWORD CARD */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon-badge">
              <FiLock />
            </div>
            <div>
              <h3>Change Password</h3>
              <p>Update your password regularly to secure your PilgrimIQ account</p>
            </div>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="settings-form-grid">
          {/* Current Password */}
          <div className="settings-field-group">
            <label>Current Password</label>
            <div className="settings-input-wrapper">
              <input
                type={showPwd.current ? "text" : "password"}
                placeholder="Enter current password"
                value={pwdForm.currentPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                className={pwdErrors.currentPassword ? "error-border" : ""}
              />
              <button
                type="button"
                className="input-password-toggle"
                onClick={() => setShowPwd({ ...showPwd, current: !showPwd.current })}
              >
                {showPwd.current ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {pwdErrors.currentPassword && (
              <span className="field-error-msg">{pwdErrors.currentPassword}</span>
            )}
          </div>

          {/* New Password */}
          <div className="settings-field-group">
            <label>New Password</label>
            <div className="settings-input-wrapper">
              <input
                type={showPwd.new ? "text" : "password"}
                placeholder="Enter new password (min. 6 chars)"
                value={pwdForm.newPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                className={pwdErrors.newPassword ? "error-border" : ""}
              />
              <button
                type="button"
                className="input-password-toggle"
                onClick={() => setShowPwd({ ...showPwd, new: !showPwd.new })}
              >
                {showPwd.new ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {pwdErrors.newPassword && (
              <span className="field-error-msg">{pwdErrors.newPassword}</span>
            )}

            {/* Password Strength Indicator */}
            {pwdForm.newPassword && (
              <div className="password-strength-container">
                <div className="password-strength-bar">
                  <div className={`strength-segment ${pwdStrength.score >= 1 ? pwdStrength.class : ""}`}></div>
                  <div className={`strength-segment ${pwdStrength.score >= 2 ? pwdStrength.class : ""}`}></div>
                  <div className={`strength-segment ${pwdStrength.score >= 3 ? pwdStrength.class : ""}`}></div>
                </div>
                <span className={`password-strength-text ${pwdStrength.class}`}>
                  Strength: {pwdStrength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="settings-field-group">
            <label>Confirm New Password</label>
            <div className="settings-input-wrapper">
              <input
                type={showPwd.confirm ? "text" : "password"}
                placeholder="Confirm new password"
                value={pwdForm.confirmPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                className={pwdErrors.confirmPassword ? "error-border" : ""}
              />
              <button
                type="button"
                className="input-password-toggle"
                onClick={() => setShowPwd({ ...showPwd, confirm: !showPwd.confirm })}
              >
                {showPwd.confirm ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {pwdErrors.confirmPassword && (
              <span className="field-error-msg">{pwdErrors.confirmPassword}</span>
            )}
          </div>

          <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
            <button type="submit" className="btn-settings-primary" disabled={pwdSubmitting}>
              {pwdSubmitting ? <FiRefreshCw className="spin-icon" /> : <FiCheck />} Update Password
            </button>
          </div>
        </form>
      </div>

      {/* 2. CHANGE PHONE NUMBER CARD */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon-badge">
              <FiPhone />
            </div>
            <div>
              <h3>Change Phone Number</h3>
              <p>Used for emergency SMS alerts and journey group verification</p>
            </div>
          </div>
        </div>

        <form onSubmit={handlePhoneSubmit} className="settings-form-grid">
          <div className="settings-field-group">
            <label>Current Phone Number</label>
            <div className="settings-input-wrapper">
              <input type="text" value={phoneForm.currentPhone} disabled style={{ backgroundColor: "#f8fafc" }} />
            </div>
          </div>

          <div className="settings-field-group">
            <label>New Phone Number</label>
            <div className="settings-input-wrapper">
              <input
                type="tel"
                placeholder="e.g. +91 98765 12345"
                value={phoneForm.newPhone}
                onChange={(e) => {
                  setPhoneForm({ ...phoneForm, newPhone: e.target.value });
                  setPhoneError("");
                }}
                className={phoneError ? "error-border" : ""}
              />
            </div>
            {phoneError && <span className="field-error-msg">{phoneError}</span>}
          </div>

          <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
            <button type="submit" className="btn-settings-primary">
              Verify & Save Phone Number
            </button>
          </div>
        </form>
      </div>

      {/* 3. PROFILE PHOTO CARD */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon-badge">
              <FiCamera />
            </div>
            <div>
              <h3>Profile Photo</h3>
              <p>Upload a clear profile picture for your pilgrim identification card</p>
            </div>
          </div>
        </div>

        <div className="profile-photo-container">
          {photoPreview ? (
            <img src={photoPreview} alt="Profile Avatar" className="profile-avatar-preview" />
          ) : (
            <div className="profile-avatar-placeholder">
              {user?.name ? user.name.charAt(0).toUpperCase() : "P"}
            </div>
          )}

          <div className="profile-photo-actions">
            <div className="profile-photo-btns">
              <label className="btn-settings-secondary" style={{ cursor: "pointer" }}>
                <FiCamera /> Upload New Image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  style={{ display: "none" }}
                />
              </label>

              {photoPreview && (
                <button type="button" className="btn-settings-danger" onClick={handleRemovePhoto}>
                  <FiTrash2 /> Remove Photo
                </button>
              )}
            </div>

            {photoError && <span className="field-error-msg">{photoError}</span>}
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Supported formats: JPEG, PNG, WEBP. Maximum file size: 5MB.
            </span>

            {photoPreview !== (user?.avatar || null) && (
              <button
                type="button"
                className="btn-settings-primary"
                onClick={handleSavePhoto}
                disabled={photoSubmitting}
                style={{ marginTop: "8px", width: "fit-content" }}
              >
                {photoSubmitting ? "Saving..." : "Save Photo Changes"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. LOGIN & SESSION MANAGEMENT */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon-badge">
              <FiMonitor />
            </div>
            <div>
              <h3>Active Login Sessions</h3>
              <p>Devices and locations currently authenticated with your account</p>
            </div>
          </div>

          <button
            type="button"
            className="btn-settings-danger"
            onClick={() => setShowLogoutAllModal(true)}
          >
            <FiLogOut /> Logout From All Devices
          </button>
        </div>

        <div className="sessions-list">
          {sessions.map((sess) => (
            <div key={sess.id} className="session-item-card">
              <div className="session-item-left">
                <div className="session-device-icon">
                  {sess.device.toLowerCase().includes("mobile") || sess.device.toLowerCase().includes("android") ? (
                    <FiSmartphone />
                  ) : (
                    <FiMonitor />
                  )}
                </div>
                <div className="session-details">
                  <h4>
                    {sess.device}{" "}
                    {sess.isCurrent && <span className="badge-current-session">Current Session</span>}
                  </h4>
                  <p>
                    {sess.browser} • {sess.location} (IP: {sess.ip}) — Last active: {sess.lastActive}
                  </p>
                </div>
              </div>

              {!sess.isCurrent && (
                <button
                  type="button"
                  className="btn-settings-secondary"
                  onClick={() => handleLogoutSession(sess.id)}
                >
                  Logout Device
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. DEACTIVATION & DELETION ACTIONS */}
      <div className="settings-card settings-danger-card">
        <div className="settings-card-header">
          <div className="settings-card-title">
            <div className="settings-card-icon-badge danger">
              <FiShieldOff />
            </div>
            <div>
              <h3>Account Management & Destructive Actions</h3>
              <p>Temporarily deactivate or permanently delete your PilgrimIQ account</p>
            </div>
          </div>
        </div>

        <div className="settings-warning-box danger-style">
          <FiAlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Important Security Notice:</strong>
            <br />
            Deactivating your account will pause health tracking, notifications, and journey group updates.
            Deleting your account will permanently remove all medical records, journey histories, and family links.
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "16px" }}>
          <button
            type="button"
            className="btn-settings-secondary"
            onClick={() => setShowDeactivateModal(true)}
          >
            <FiUserX /> Deactivate Account
          </button>

          <button
            type="button"
            className="btn-settings-danger"
            onClick={() => setShowDeleteModal(true)}
          >
            <FiTrash2 /> Delete Account Permanently
          </button>
        </div>
      </div>

      {/* OTP MODAL */}
      {showOtpModal && (
        <div className="settings-modal-overlay">
          <div className="settings-modal-card">
            <div className="settings-modal-header">
              <div className="settings-modal-icon info">
                <FiPhone />
              </div>
              <div className="settings-modal-title-box">
                <h3>Verify Phone Number</h3>
                <p>We've sent a 6-digit OTP code to {phoneForm.newPhone}</p>
              </div>
            </div>

            <div className="settings-modal-body">
              <div className="settings-field-group">
                <label>Enter 6-Digit OTP</label>
                <div className="settings-input-wrapper">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    style={{ textAlign: "center", fontSize: "20px", letterSpacing: "6px" }}
                  />
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px", textAlign: "center" }}>
                  Resend OTP code available in {otpTimer}s
                </p>
              </div>
            </div>

            <div className="settings-modal-footer">
              <button
                type="button"
                className="btn-settings-secondary"
                onClick={() => setShowOtpModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-settings-primary"
                onClick={handleVerifyOtp}
              >
                Verify Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT ALL DEVICES MODAL */}
      {showLogoutAllModal && (
        <div className="settings-modal-overlay">
          <div className="settings-modal-card">
            <div className="settings-modal-header">
              <div className="settings-modal-icon warning">
                <FiLogOut />
              </div>
              <div className="settings-modal-title-box">
                <h3>Logout From All Devices?</h3>
                <p>Are you sure you want to end all active sessions across all devices?</p>
              </div>
            </div>

            <div className="settings-modal-body">
              This action will revoke authentication tokens on all connected phones, tablets, and desktop browsers.
              Your current active browser session will remain logged in.
            </div>

            <div className="settings-modal-footer">
              <button
                type="button"
                className="btn-settings-secondary"
                onClick={() => setShowLogoutAllModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-settings-danger"
                onClick={handleConfirmLogoutAll}
              >
                Confirm Logout All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEACTIVATE ACCOUNT MODAL */}
      {showDeactivateModal && (
        <div className="settings-modal-overlay">
          <div className="settings-modal-card">
            <div className="settings-modal-header">
              <div className="settings-modal-icon warning">
                <FiUserX />
              </div>
              <div className="settings-modal-title-box">
                <h3>Deactivate PilgrimIQ Account</h3>
                <p>Temporarily suspend your account activity</p>
              </div>
            </div>

            <div className="settings-modal-body">
              <p style={{ marginBottom: "12px" }}>
                Deactivating your account will hide your profile from community helpers and journey groups.
                You can reactivate your account at any time by logging back in.
              </p>
              <div className="settings-field-group">
                <label>Enter Password to Confirm</label>
                <div className="settings-input-wrapper">
                  <input
                    type="password"
                    placeholder="Your password"
                    value={deactivatePassword}
                    onChange={(e) => setDeactivatePassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="settings-modal-footer">
              <button
                type="button"
                className="btn-settings-secondary"
                onClick={() => setShowDeactivateModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-settings-danger"
                onClick={handleConfirmDeactivate}
              >
                Deactivate Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT PERMANENTLY MODAL */}
      {showDeleteModal && (
        <div className="settings-modal-overlay">
          <div className="settings-modal-card">
            <div className="settings-modal-header">
              <div className="settings-modal-icon">
                <FiTrash2 />
              </div>
              <div className="settings-modal-title-box">
                <h3>Delete Account Permanently?</h3>
                <p>This action is non-reversible and permanent</p>
              </div>
            </div>

            <div className="settings-modal-body">
              <div className="settings-warning-box danger-style">
                All saved medical records, family profiles, trip bookings, and health PSI safety index metrics will be permanently erased.
              </div>

              <div className="settings-field-group" style={{ marginTop: "12px" }}>
                <label>Type "DELETE" below to confirm</label>
                <div className="settings-input-wrapper">
                  <input
                    type="text"
                    placeholder="DELETE"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="settings-modal-footer">
              <button
                type="button"
                className="btn-settings-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-settings-danger"
                disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE"}
                onClick={handleConfirmDelete}
              >
                Permanently Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountSettings;
