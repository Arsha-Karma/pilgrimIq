import "../styles/Login.css";
import { Link } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiArrowRight,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

import logo from "../assets/pilgrim-logo.png";

function Login() {
  return (
    <div className="login-container">

      <div className="login-card">

        {/* Logo */}
        <img
          src={logo}
          alt="PilgrimIQ Logo"
          className="logo"
        />

        {/* Heading */}
        <h1>Welcome Back</h1>

        <p className="subtitle">
          Access your personalized Journey Portal
        </p>

        {/* Login Form */}
        <form>

          {/* Email */}
          <label htmlFor="email">
            EMAIL ADDRESS
          </label>

          <div className="input-box">

            <FiMail className="input-icon" />

            <input
              id="email"
              type="email"
              placeholder="pilgrim@example.com"
              autoComplete="email"
            />

          </div>

          {/* Password */}
          <label htmlFor="password">
            PASSWORD
          </label>

          <div className="input-box">

            <FiLock className="input-icon" />

            <input
              id="password"
              type="password"
              placeholder="••••••••••"
              autoComplete="current-password"
            />

          </div>

          {/* Remember & Forgot */}
          <div className="login-options">

            <label className="remember">

              <input type="checkbox" />

              <span>Remember me</span>

            </label>

            <Link
              to="/forgot-password"
              className="forgot-link"
            >
              Forgot password?
            </Link>

          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="login-btn"
          >

            Login to Dashboard

            <FiArrowRight size={20} />

          </button>

        </form>

        {/* Divider */}
        <div className="divider">

          <span>OR CONTINUE WITH</span>

        </div>

        {/* Google Button */}
        <button
          type="button"
          className="google-btn"
        >

          <FcGoogle size={24} />

          Continue with Google

        </button>

        {/* Register */}
        <p className="register">

          Don't have an account?

          <Link to="/register">

            Sign Up

          </Link>

        </p>

      </div>

    </div>
  );
}

export default Login;