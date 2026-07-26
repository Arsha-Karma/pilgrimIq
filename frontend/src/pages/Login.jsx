import React, { useState } from "react";
import "../styles/Login.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiMail, FiLock, FiArrowRight } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/pilgrim-logo.png";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [dirty, setDirty] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const successMsg = location.state?.successMessage || "";

  const { login, googleAuth } = useAuth();
  const navigate = useNavigate();

  const validateField = (name, value) => {
    let error = "";
    if (name === "email") {
      if (!value || !value.trim()) {
        error = "Email Address is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = "Please enter a valid email address with '@' (e.g., user@example.com)";
      }
    } else if (name === "password") {
      if (!value) {
        error = "Password is required";
      }
    }
    return error;
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setDirty((prev) => ({ ...prev, email: true }));
    const err = validateField("email", val);
    setFieldErrors((prev) => ({ ...prev, email: err }));
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setDirty((prev) => ({ ...prev, password: true }));
    const err = validateField("password", val);
    setFieldErrors((prev) => ({ ...prev, password: err }));
  };

  const handleBlur = (e) => {
    const { id, value } = e.target;
    setDirty((prev) => ({ ...prev, [id]: true }));
    const err = validateField(id, value);
    setFieldErrors((prev) => ({ ...prev, [id]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitted(true);

    const emailErr = validateField("email", email);
    const passwordErr = validateField("password", password);

    setFieldErrors({ email: emailErr, password: passwordErr });

    if (emailErr || passwordErr) {
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate("/");
    } catch (err) {
      setFormError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    setFormError("");
    try {
      setLoading(true);
      await googleAuth({ accessToken: tokenResponse.access_token });
      navigate("/");
    } catch (err) {
      setFormError(err.message || "Google Sign-In failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginClick = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setFormError("Google authentication was unsuccessful."),
  });

  const shouldShowError = (fieldName) => {
    return (dirty[fieldName] || isSubmitted) && fieldErrors[fieldName];
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={logo} alt="PilgrimIQ Logo" className="logo" />

        <h1>Welcome Back</h1>
        <p className="subtitle">Access your personalized Journey Portal</p>

        {successMsg && (
          <div
            className="success-banner"
            style={{
              backgroundColor: "#e6fffa",
              color: "#234e52",
              border: "1px solid #b2f5ea",
              padding: "10px 14px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "14px",
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            {successMsg}
          </div>
        )}

        {formError && (
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
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="email">EMAIL ADDRESS</label>
          <div className={`input-box ${shouldShowError("email") ? "input-error" : ""}`}>
            <FiMail className="input-icon" />
            <input
              id="email"
              type="email"
              placeholder="pilgrim@example.com"
              autoComplete="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleBlur}
              disabled={loading}
            />
          </div>
          {shouldShowError("email") && (
            <span className="field-error">{fieldErrors.email}</span>
          )}

          <label htmlFor="password">PASSWORD</label>
          <div className={`input-box ${shouldShowError("password") ? "input-error" : ""}`}>
            <FiLock className="input-icon" />
            <input
              id="password"
              type="password"
              placeholder="••••••••••"
              autoComplete="current-password"
              value={password}
              onChange={handlePasswordChange}
              onBlur={handleBlur}
              disabled={loading}
            />
          </div>
          {shouldShowError("password") && (
            <span className="field-error">{fieldErrors.password}</span>
          )}

          <div className="login-options">
            <label className="remember">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>

            <Link to="/forgot-password" className="forgot-link">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing in..." : "Login to Dashboard"}
            <FiArrowRight size={20} />
          </button>
        </form>

        <div className="divider">
          <span>OR CONTINUE WITH</span>
        </div>

        <button
          type="button"
          className="google-btn"
          onClick={() => {
            handleGoogleLoginClick();
          }}
          disabled={loading}
        >
          <FcGoogle size={24} />
          Continue with Google
        </button>

        <p className="register">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;