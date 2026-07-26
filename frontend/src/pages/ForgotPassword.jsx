import React, { useState } from "react";
import "../styles/Login.css";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiKey, FiArrowRight, FiCheckCircle } from "react-icons/fi";
import { apiForgotPassword, apiVerifyCode, apiResetPassword } from "../services/api";
import logo from "../assets/pilgrim-logo.png";

function ForgotPassword() {
  // Step 1: Email Address
  // Step 2: 6-Digit Reset Code Only
  // Step 3: New Password & Confirm Password
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState(""); // Kept strictly empty by default
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const navigate = useNavigate();

  const validateEmail = (val) => {
    if (!val || !val.trim()) return "Email address is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return "Please enter a valid email address.";
    return "";
  };

  // STEP 1: Send 6-Digit Code to Email
  const handleSendCode = async (e) => {
    e.preventDefault();
    setServerError("");
    setIsSubmitted(true);

    const emailErr = validateEmail(email);
    setErrors({ email: emailErr });
    if (emailErr) return;

    try {
      setLoading(true);
      await apiForgotPassword(email.trim());
      setInfoMessage(`A 6-digit reset code has been sent to ${email.trim()}`);
      setOtpCode(""); // Ensure code input starts completely blank
      setStep(2);
      setIsSubmitted(false);
    } catch (err) {
      setServerError(err.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify 6-Digit Code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setServerError("");
    setIsSubmitted(true);

    if (!otpCode || !otpCode.trim()) {
      setErrors({ otpCode: "Please enter the 6-digit reset code." });
      return;
    }

    try {
      setLoading(true);
      await apiVerifyCode(email.trim(), otpCode.trim());
      setInfoMessage("Reset code verified successfully! Now set your new password below.");
      setStep(3);
      setIsSubmitted(false);
    } catch (err) {
      setServerError(err.message || "Invalid or expired reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Change Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setServerError("");
    setIsSubmitted(true);

    const errs = {};
    if (!password) {
      errs.password = "New password is required.";
    } else if (password.length < 6) {
      errs.password = "Password must be at least 6 characters long.";
    }
    if (confirmPassword !== password) {
      errs.confirmPassword = "Passwords do not match.";
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      setLoading(true);
      await apiResetPassword(otpCode.trim(), password, email.trim());
      
      // Navigate to login page upon success
      navigate("/login", {
        state: { successMessage: "Password changed successfully! Please log in with your new password." },
      });
    } catch (err) {
      setServerError(err.message || "Failed to change password. Please request a new code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={logo} alt="PilgrimIQ Logo" className="logo" />

        <h1>Forgot Password</h1>
        <p className="subtitle">
          {step === 1 && "Enter your email address to receive a 6-digit reset code"}
          {step === 2 && "Enter the 6-digit reset code sent to your email"}
          {step === 3 && "Create a new password for your account"}
        </p>

        {serverError && (
          <div
            className="error-banner"
            style={{
              backgroundColor: "#ffebee",
              color: "#c62828",
              padding: "10px 14px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            {serverError}
          </div>
        )}

        {infoMessage && (
          <div
            style={{
              backgroundColor: "#e6fffa",
              color: "#234e52",
              border: "1px solid #b2f5ea",
              padding: "10px 14px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "13.5px",
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            ✅ {infoMessage}
          </div>
        )}

        {step === 1 && (
          /* STEP 1: Enter Email */
          <form onSubmit={handleSendCode} noValidate>
            <label htmlFor="email">EMAIL ADDRESS</label>
            <div className={`input-box ${isSubmitted && errors.email ? "input-error" : ""}`}>
              <FiMail className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="pilgrim@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            {isSubmitted && errors.email && <span className="field-error">{errors.email}</span>}

            <button type="submit" className="login-btn" style={{ marginTop: "14px" }} disabled={loading}>
              {loading ? "Sending Code..." : "Send Reset Code"}
              <FiArrowRight size={20} />
            </button>

            <p className="register" style={{ marginTop: "18px" }}>
              Remembered your password? <Link to="/login">Back to Login</Link>
            </p>
          </form>
        )}

        {step === 2 && (
          /* STEP 2: Enter 6-Digit Code ONLY */
          <form onSubmit={handleVerifyCode} noValidate>
            <label htmlFor="otpCode">6-DIGIT RESET CODE</label>
            <div className={`input-box ${isSubmitted && errors.otpCode ? "input-error" : ""}`}>
              <FiKey className="input-icon" />
              <input
                id="otpCode"
                type="text"
                maxLength="6"
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                disabled={loading}
                style={{ letterSpacing: "2px", fontWeight: "700" }}
              />
            </div>
            {isSubmitted && errors.otpCode && <span className="field-error">{errors.otpCode}</span>}

            <button type="submit" className="login-btn" style={{ marginTop: "14px" }} disabled={loading}>
              {loading ? "Verifying Code..." : "Verify Code"}
              <FiArrowRight size={20} />
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "18px" }}>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setServerError("");
                  setInfoMessage("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6B7280",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                ← Change Email
              </button>

              <Link to="/login" style={{ color: "#2563EB", fontSize: "13px", fontWeight: "700", textDecoration: "none" }}>
                Back to Login
              </Link>
            </div>
          </form>
        )}

        {step === 3 && (
          /* STEP 3: Enter New Password & Confirm Password (ONLY after code is verified) */
          <form onSubmit={handleResetPassword} noValidate>
            <label htmlFor="password">NEW PASSWORD</label>
            <div className={`input-box ${isSubmitted && errors.password ? "input-error" : ""}`}>
              <FiLock className="input-icon" />
              <input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            {isSubmitted && errors.password && <span className="field-error">{errors.password}</span>}

            <label htmlFor="confirmPassword">CONFIRM NEW PASSWORD</label>
            <div className={`input-box ${isSubmitted && errors.confirmPassword ? "input-error" : ""}`}>
              <FiLock className="input-icon" />
              <input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            {isSubmitted && errors.confirmPassword && (
              <span className="field-error">{errors.confirmPassword}</span>
            )}

            <button type="submit" className="login-btn" style={{ marginTop: "14px" }} disabled={loading}>
              {loading ? "Changing Password..." : "Change Password"}
              <FiCheckCircle size={18} />
            </button>

            <p className="register" style={{ marginTop: "18px" }}>
              Back to <Link to="/login">Login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
