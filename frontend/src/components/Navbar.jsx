import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/pilgrim-logo.png";
import "./Navbar.css";

const NAV_ITEMS = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About Us" },
  { path: "/features", label: "Features" },
  { path: "/centers", label: "Pilgrimage Centers" },
  { path: "/services", label: "Services" },
  { path: "/how-it-works", label: "How It Works" },
  { path: "/contact", label: "Contact" },
];

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const firstLetter = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : "A";

  const handleLogout = () => {
    setShowProfileMenu(false);
    logout();
    navigate("/login");
  };

  return (
    <header className="app-navbar">
      <Link to="/" className="navbar-logo-container">
        <div className="navbar-logo-icon">
          <img src={logo} alt="PilgrimIQ Logo" />
        </div>
        <div className="navbar-logo-text">
          <h2>PilgrimIQ</h2>
          <p>Plan Smart. Travel Safe. Stay Blessed.</p>
        </div>
      </Link>

      <ul className="navbar-links">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <li key={item.path}>
              <Link to={item.path} className={isActive ? "active" : ""}>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="navbar-user-section">
        {user ? (
          <>
            <div
              className="navbar-avatar-btn"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              title="Click to view profile menu"
            >
              {firstLetter}
            </div>

            {showProfileMenu && (
              <div className="navbar-dropdown-menu">
                <div className="navbar-dropdown-header">
                  <p className="name">{user.name || "Pilgrim User"}</p>
                  <p className="email">{user.email}</p>
                </div>

                <div className="navbar-dropdown-links">
                  <Link
                    to="/profile"
                    className="navbar-dropdown-item"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    My Profile
                  </Link>

                  {user.role === "admin" && (
                    <Link
                      to="/admin-dashboard"
                      className="navbar-dropdown-item"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}

                  {user.role === "doctor" && (
                    <Link
                      to="/doctor-dashboard"
                      className="navbar-dropdown-item"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Doctor Dashboard
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="navbar-dropdown-item logout-btn"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="navbar-auth-buttons">
            <Link to="/login" className="navbar-login-btn">
              Login
            </Link>
            <Link to="/register" className="navbar-signup-btn">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
