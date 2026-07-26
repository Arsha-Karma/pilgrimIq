import React, { useState } from "react";
import "../styles/Register.css";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiPhone, FiLock, FiArrowRight } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { apiGoogleLogin } from "../services/api";
import logo from "../assets/pilgrim-logo.png";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [dirty, setDirty] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const validateField = (name, value, currentFormData = formData) => {
    let error = "";

    switch (name) {
      case "name":
        if (!value || !value.trim()) {
          error = "Full Name is required";
        } else if (/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) {
          error = "Numbers and special symbols are not allowed in name";
        } else if (value.trim().length < 2) {
          error = "Full Name must be at least 2 letters";
        }
        break;

      case "email":
        if (!value || !value.trim()) {
          error = "Email Address is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please enter a valid email address with '@' (e.g., user@example.com)";
        }
        break;

      case "phone":
        if (!value || !value.trim()) {
          error = "Phone Number is required";
        } else if (/[^\d]/.test(value)) {
          error = "Phone number must contain digits only";
        } else if (/^[0-5]/.test(value)) {
          error = "Phone number cannot start with 0, 1, 2, 3, 4, or 5";
        } else if (value.length !== 10) {
          error = "Phone number must be exactly 10 digits";
        } else if (/^(\d)\1{9}$/.test(value)) {
          error = "Invalid phone number format (e.g., 1000000000 is not allowed)";
        }
        break;

      case "password":
        if (!value) {
          error = "Password is required";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");
    setIsSubmitted(true);

    const errors = {
      name: validateField("name", formData.name),
      email: validateField("email", formData.email),
      phone: validateField("phone", formData.phone),
      password: validateField("password", formData.password),
      confirmPassword: validateField("confirmPassword", formData.confirmPassword),
    };

    setFieldErrors(errors);

    const hasErrors = Object.values(errors).some((err) => err !== "");
    if (hasErrors) {
      return;
    }

    try {
      setLoading(true);
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      setSuccessMsg("Account registered successfully! Redirecting to login page...");
      setTimeout(() => {
        navigate("/login", {
          state: { successMessage: "Account registered successfully! Now you can log in." },
        });
      }, 1500);
    } catch (err) {
      setFormError(err.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    setFormError("");
    setSuccessMsg("");
    try {
      setLoading(true);
      await apiGoogleLogin({ accessToken: tokenResponse.access_token });
      setSuccessMsg("Account registered successfully! Redirecting to login page...");
      setTimeout(() => {
        navigate("/login", {
          state: { successMessage: "Account registered successfully! Now you can log in." },
        });
      }, 1500);
    } catch (err) {
      setFormError(err.message || "Google Sign-Up failed. Please try again.");
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
    <div className="register-container">
      <div className="register-card">
        <img src={logo} alt="PilgrimIQ Logo" className="logo" />

        <h1>Create Account</h1>
        <p className="subtitle">Begin your personalized pilgrimage journey.</p>

        {successMsg && (
          <div
            className="success-banner"
            style={{
              backgroundColor: "#e6fffa",
              color: "#234e52",
              border: "1px solid #b2f5ea",
              padding: "8px 12px",
              borderRadius: "8px",
              marginBottom: "12px",
              fontSize: "13px",
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
              padding: "8px 12px",
              borderRadius: "8px",
              marginBottom: "12px",
              fontSize: "13px",
              textAlign: "center",
            }}
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="name">FULL NAME</label>
          <div className={`input-box ${shouldShowError("name") ? "input-error" : ""}`}>
            <FiUser className="input-icon" />
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loading}
            />
          </div>
          {shouldShowError("name") && (
            <span className="field-error">{fieldErrors.name}</span>
          )}

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
          {shouldShowError("email") && (
            <span className="field-error">{fieldErrors.email}</span>
          )}

          <label htmlFor="phone">PHONE NUMBER</label>
          <div className={`input-box ${shouldShowError("phone") ? "input-error" : ""}`}>
            <FiPhone className="input-icon" />
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+91 XXXXX XXXXX"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loading}
            />
          </div>
          {shouldShowError("phone") && (
            <span className="field-error">{fieldErrors.phone}</span>
          )}

          <label htmlFor="password">PASSWORD</label>
          <div className={`input-box ${shouldShowError("password") ? "input-error" : ""}`}>
            <FiLock className="input-icon" />
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••••"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loading}
            />
          </div>
          {shouldShowError("password") && (
            <span className="field-error">{fieldErrors.password}</span>
          )}

          <label htmlFor="confirmPassword">CONFIRM PASSWORD</label>
          <div className={`input-box ${shouldShowError("confirmPassword") ? "input-error" : ""}`}>
            <FiLock className="input-icon" />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loading}
            />
          </div>
          {shouldShowError("confirmPassword") && (
            <span className="field-error">{fieldErrors.confirmPassword}</span>
          )}

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
            <FiArrowRight />
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
          <FcGoogle size={22} />
          Sign up with Google
        </button>

        <p className="login-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
