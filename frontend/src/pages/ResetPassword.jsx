import React, { useState, useEffect } from "react";
import "../styles/Login.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiLock, FiKey, FiCheckCircle } from "react-icons/fi";
import { apiResetPassword } from "../services/api";
import logo from "../assets/pilgrim-logo.png";

function ResetPassword() {
  const { resetToken: urlToken } = useParams();
  const [token, setToken] = useState(urlToken || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (urlToken) {
      setToken(urlToken);
    }
  }, [urlToken]);

  const validate = () => {
    const errors = {};
    if (!token || !token.trim()) {
      errors.token = "Reset Token is required";
    }
    if (!password) {
      errors.password = "New Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    }
    if (confirmPassword !== password) {
      errors.confirmPassword = "Passwords do not match";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setIsSubmitted(true);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setLoading(true);
      await apiResetPassword(token.trim(), password);
      navigate("/login", {
        state: { successMessage: "Password has been reset successfully! Please log in with your new password." },
      });
    } catch (err) {
      setServerError(err.message || "Failed to reset password. Token may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={logo} alt="PilgrimIQ Logo" className="logo" />

        <h1>Set New Password</h1>
        <p className="subtitle">Choose a secure password for your PilgrimIQ account</p>

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

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="token">RESET TOKEN / CODE</label>
          <div className={`input-box ${isSubmitted && fieldErrors.token ? "input-error" : ""}`}>
            <FiKey className="input-icon" />
            <input
              id="token"
              type="text"
              placeholder="Paste your reset token here"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={loading}
            />
          </div>
          {isSubmitted && fieldErrors.token && (
            <span className="field-error">{fieldErrors.token}</span>
          )}

          <label htmlFor="password">NEW PASSWORD</label>
          <div className={`input-box ${isSubmitted && fieldErrors.password ? "input-error" : ""}`}>
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
          {isSubmitted && fieldErrors.password && (
            <span className="field-error">{fieldErrors.password}</span>
          )}

          <label htmlFor="confirmPassword">CONFIRM NEW PASSWORD</label>
          <div className={`input-box ${isSubmitted && fieldErrors.confirmPassword ? "input-error" : ""}`}>
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
          {isSubmitted && fieldErrors.confirmPassword && (
            <span className="field-error">{fieldErrors.confirmPassword}</span>
          )}

          <button type="submit" className="login-btn" style={{ marginTop: "14px" }} disabled={loading}>
            {loading ? "Updating Password..." : "Reset Password"}
            <FiCheckCircle size={18} />
          </button>

          <p className="register" style={{ marginTop: "18px" }}>
            Back to <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
