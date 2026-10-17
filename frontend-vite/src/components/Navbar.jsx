import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiMenu, FiX } from "react-icons/fi";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const firstLetter = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : "A";

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    setIsMobileMenuOpen(false);
    logout();
    navigate("/login");
  };

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowProfileMenu(false);
  }, [location.pathname]);

  // Handle escape key to close menus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
        setShowProfileMenu(false);
      }
    };

    if (isMobileMenuOpen || showProfileMenu) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen, showProfileMenu]);

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Close mobile drawer when resizing beyond mobile breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  return (
    <>
      <header className="app-navbar">
        <Link to="/" className="navbar-logo-container" onClick={closeMobileMenu}>
          <div className="navbar-logo-icon">
            <img src={logo} alt="PilgrimIQ Logo" />
          </div>
          <div className="navbar-logo-text">
            <h2>PilgrimIQ</h2>
            <p>Plan Smart. Travel Safe. Stay Blessed.</p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
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

        {/* Desktop User / Auth Section */}
        <div className="navbar-user-section" ref={profileMenuRef}>
          {user ? (
            <>
              <div
                className="navbar-avatar-btn"
                onClick={() => setShowProfileMenu((prev) => !prev)}
                title="Click to view profile menu"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setShowProfileMenu((prev) => !prev);
                  }
                }}
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
                    {user.role !== "admin" && (
                      <Link
                        to="/profile"
                        className="navbar-dropdown-item"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        My Profile
                      </Link>
                    )}

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
                      type="button"
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

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className="navbar-mobile-toggle"
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-nav-drawer"
        >
          {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </header>

      {/* Mobile Drawer Overlay / Backdrop */}
      <div
        className={`mobile-backdrop ${isMobileMenuOpen ? "active" : ""}`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Mobile Navigation Drawer */}
      <nav
        id="mobile-nav-drawer"
        className={`mobile-nav-drawer ${isMobileMenuOpen ? "open" : ""}`}
        aria-label="Mobile Navigation"
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="mobile-drawer-header">
          <Link to="/" className="mobile-drawer-brand" onClick={closeMobileMenu}>
            <div className="mobile-drawer-logo">
              <img src={logo} alt="PilgrimIQ Logo" />
            </div>
            <div className="mobile-drawer-brand-text">
              <h3>PilgrimIQ</h3>
              <p>Plan Smart. Travel Safe. Stay Blessed.</p>
            </div>
          </Link>
          <button
            type="button"
            className="mobile-drawer-close"
            onClick={closeMobileMenu}
            aria-label="Close navigation menu"
          >
            <FiX size={22} />
          </button>
        </div>

        <div className="mobile-drawer-content">
          <ul className="mobile-nav-links">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`mobile-nav-link ${isActive ? "active" : ""}`}
                    onClick={closeMobileMenu}
                  >
                    <span>{item.label}</span>
                    {isActive && <span className="mobile-active-dot" aria-hidden="true" />}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mobile-drawer-footer">
            {user ? (
              <div className="mobile-user-section">
                <div className="mobile-user-profile">
                  <div className="mobile-avatar">{firstLetter}</div>
                  <div className="mobile-user-info">
                    <p className="mobile-user-name">{user.name || "Pilgrim User"}</p>
                    <p className="mobile-user-email">{user.email}</p>
                  </div>
                </div>

                <div className="mobile-user-actions">
                  {user.role !== "admin" && (
                    <Link
                      to="/profile"
                      className="mobile-action-btn"
                      onClick={closeMobileMenu}
                    >
                      My Profile
                    </Link>
                  )}

                  {user.role === "admin" && (
                    <Link
                      to="/admin-dashboard"
                      className="mobile-action-btn"
                      onClick={closeMobileMenu}
                    >
                      Admin Dashboard
                    </Link>
                  )}

                  {user.role === "doctor" && (
                    <Link
                      to="/doctor-dashboard"
                      className="mobile-action-btn"
                      onClick={closeMobileMenu}
                    >
                      Doctor Dashboard
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mobile-action-btn mobile-logout-btn"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="mobile-auth-buttons">
                <Link
                  to="/login"
                  className="mobile-login-btn"
                  onClick={closeMobileMenu}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="mobile-signup-btn"
                  onClick={closeMobileMenu}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
