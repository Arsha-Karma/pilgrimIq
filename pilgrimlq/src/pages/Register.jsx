import "../styles/Register.css";
import { Link } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiArrowRight,
} from "react-icons/fi";

import logo from "../assets/pilgrim-logo.png";

function Register() {
  return (
    <div className="register-container">

      <div className="register-card">

        <img
          src={logo}
          alt="PilgrimIQ Logo"
          className="logo"
        />

        <h1>Create Account</h1>

        <p className="subtitle">
          Begin your personalized pilgrimage journey.
        </p>

        <form>

          <label>FULL NAME</label>

          <div className="input-box">
            <FiUser className="input-icon" />
            <input
              type="text"
              placeholder="Full Name"
            />
          </div>

          <label>EMAIL ADDRESS</label>

          <div className="input-box">
            <FiMail className="input-icon" />
            <input
              type="email"
              placeholder="pilgrim@example.com"
            />
          </div>

          <label>PHONE NUMBER</label>

          <div className="input-box">
            <FiPhone className="input-icon" />
            <input
              type="tel"
              placeholder="+91 XXXXX XXXXX"
            />
          </div>

          <label>PASSWORD</label>

          <div className="input-box">
            <FiLock className="input-icon" />
            <input
              type="password"
              placeholder="••••••••••"
            />
          </div>

          <label>CONFIRM PASSWORD</label>

          <div className="input-box">
            <FiLock className="input-icon" />
            <input
              type="password"
              placeholder="••••••••••"
            />
          </div>

          <button
            type="submit"
            className="register-btn"
          >
            Create Account
            <FiArrowRight />
          </button>

        </form>

        <p className="login-text">

          Already have an account?

          <Link to="/login">

            Login

          </Link>

        </p>

      </div>

    </div>
  );
}

export default Register;