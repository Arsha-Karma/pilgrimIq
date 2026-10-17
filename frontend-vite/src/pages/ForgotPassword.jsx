import React, { useState } from "react";
import "../styles/Login.css";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiKey, FiArrowRight, FiCheckCircle, FiEye, FiEyeOff } from "react-icons/fi";
import { apiForgotPassword, apiVerifyCode, apiResetPassword } from "../services/api";
import logo from "../assets/pilgrim-logo.png";

function ForgotPassword() {
  // Step 1: Email Address
  // Step 2: 6-Digit Reset Code Only
  // Step 3: New Password & Confirm Password
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    email: "",
    otpCode: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [dirty, setDirty] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const validateField = (name, value, currentFormData = formData) => {
    let error = "";

    switch (name) {
      case "email":
        if (!value || !value.trim()) {
          error = "Email Address is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          error = "Please enter a valid email address with '@' (e.g., user@example.com)";
        }
        break;

      case "otpCode":
        if (!value || !value.trim()) {
          error = "6-Digit Reset Code is required";
        } else if (!/^\d+$/.test(value.trim())) {
          error = "Reset code must contain digits only";
        } else if (value.trim().length !== 6) {
          error = "Reset code must be exactly 6 digits";
        }
        break;

      case "password":
        if (!value) {
          error = "New Password is required";
        } else if (value.length < 6) {
          error = "Password must be at least 6 characters long";
        } else if (
          !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(value)
        ) {
          error = "Password must include uppercase, lowercase, number, and special character";
        }
        break;

      case "confirmPassword":
        if (!value) {
          error = "Confirm Password is required";
        } else if (value !== currentFormData.password) {
          error = "Passwords do not match";
        }
        break;

      default:
        break;
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);
    setDirty((prev) => ({ ...prev, [name]: true }));

    const error = validateField(name, value, updatedData);
    setFieldErrors((prev) => ({ ...prev, [name]: error }));

    if (name === "password" && (dirty.confirmPassword || isSubmitted)) {
      const confirmError = validateField("confirmPassword", updatedData.confirmPassword, updatedData);
      setFieldErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setDirty((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value, formData);
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const shouldShowError = (fieldName) => {
    return (dirty[fieldName] || isSubmitted) && fieldErrors[fieldName];
  };

  // STEP 1: Send 6-Digit Code to Email
  const handleSendCode = async (e) => {
    e.preventDefault();
    setServerError("");
    setIsSubmitted(true);

    const emailErr = validateField("email", formData.email);
    setFieldErrors((prev) => ({ ...prev, email: emailErr }));
    if (emailErr) return;

    try {
      setLoading(true);
      await apiForgotPassword(formData.email.trim());
      setInfoMessage(`A 6-digit reset code has been sent to ${formData.email.trim()}`);
      setFormData((prev) => ({ ...prev, otpCode: "" })); // Ensure code starts completely blank
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

    const otpErr = validateField("otpCode", formData.otpCode);
    setFieldErrors((prev) => ({ ...prev, otpCode: otpErr }));
    if (otpErr) return;

    try {
      setLoading(true);
      await apiVerifyCode(formData.email.trim(), formData.otpCode.trim());
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

    const passwordErr = validateField("password", formData.password);
    const confirmErr = validateField("confirmPassword", formData.confirmPassword, formData);

    const errors = {
      password: passwordErr,
      confirmPassword: confirmErr,
    };
    setFieldErrors((prev) => ({ ...prev, ...errors }));

    if (passwordErr || confirmErr) return;

    try {
      setLoading(true);
      await apiResetPassword(formData.otpCode.trim(), formData.password, formData.email.trim());

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
            <div className={`input-box ${shouldShowError("email") ? "input-error" : ""}`}>
              <FiMail className="input-icon" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="pilgrim@example.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
              />
            </div>
            {shouldShowError("email") && <span className="field-error">{fieldErrors.email}</span>}

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
            <div className={`input-box ${shouldShowError("otpCode") ? "input-error" : ""}`}>
              <FiKey className="input-icon" />
              <input
                id="otpCode"
                name="otpCode"
                type="text"
                maxLength="6"
                placeholder="Enter 6-digit code"
                value={formData.otpCode}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                style={{ letterSpacing: "2px", fontWeight: "700" }}
              />
            </div>
            {shouldShowError("otpCode") && <span className="field-error">{fieldErrors.otpCode}</span>}

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
          /* STEP 3: Enter New Password & Confirm Password */
          <form onSubmit={handleResetPassword} noValidate>
            <label htmlFor="password">NEW PASSWORD</label>
            <div className={`input-box ${shouldShowError("password") ? "input-error" : ""}`}>
              <FiLock className="input-icon" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <FiEyeOff className="input-icon" /> : <FiEye className="input-icon" />}
              </button>
            </div>
            {shouldShowError("password") && <span className="field-error">{fieldErrors.password}</span>}

            <label htmlFor="confirmPassword">CONFIRM NEW PASSWORD</label>
            <div className={`input-box ${shouldShowError("confirmPassword") ? "input-error" : ""}`}>
              <FiLock className="input-icon" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
              >
                {showConfirmPassword ? <FiEyeOff className="input-icon" /> : <FiEye className="input-icon" />}
              </button>
            </div>
            {shouldShowError("confirmPassword") && (
              <span className="field-error">{fieldErrors.confirmPassword}</span>
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
