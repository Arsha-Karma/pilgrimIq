import { useState } from "react";
import "../styles/Services.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/pilgrim-logo.png";

function Services() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : "U");
  const servicesList = [
    {
      icon: "🩺",
      title: "AI Health Assessment & PSI Score",
      desc: "Calculate your Pilgrim Safety Index (PSI) using automated medical report OCR analysis and vital sign parameters before you travel."
    },
    {
      icon: "📍",
      title: "Smart Journey Planning",
      desc: "Get personalized travel plans and itineraries based on your health conditions, altitude acclimatization, distance, and crowd forecasts."
    },
    {
      icon: "☁️",
      title: "Weather Prediction & Microclimate",
      desc: "Receive accurate 7-day micro-weather forecasts, sudden rainfall alerts, temperature fluctuations, and altitude-specific climate modeling."
    },
    {
      icon: "🛡️",
      title: "Pilgrim Safety Index (PSI)",
      desc: "Calculate a personalized dynamic safety score combining medical fitness, weather forecasts, route difficulty, and real-time crowd metrics."
    },
    {
      icon: "📡",
      title: "IoT Health Monitoring",
      desc: "Monitor live heart rate, oxygen levels (SpO₂), and body temperature using wearable IoT devices throughout your trek."
    },
    {
      icon: "🚨",
      title: "24/7 Emergency SOS & Rescue",
      desc: "One-tap emergency dispatch connecting you directly to local high-altitude rescue teams, nearby specialized clinics, and family contacts."
    }
  ];

  return (
    <div className="services-page">
      <nav className="services-navbar">
        <div className="services-logo">
          <img src={logo} alt="PilgrimIQ Logo" />
          <div className="services-logo-text">
            <h2>PilgrimIQ</h2>
            <p>Plan Smart. Travel Safe. Stay Blessed.</p>
          </div>
        </div>

        <ul className="services-nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About Us</Link></li>
          <li><Link to="/features">Features</Link></li>
          <li><Link to="/centers">Pilgrimage Centers</Link></li>
          <li><Link to="/services" className="active-nav">Services</Link></li>
          <li><Link to="/how-it-works">How It Works</Link></li>
          <li><Link to="/contact">Contact</Link></li>
        </ul>

        <div className="services-nav-buttons">
          {user ? (
            <div style={{ position: "relative", display: "inline-block" }}>
              <div
                onClick={() => setShowProfileMenu((prev) => !prev)}
                title="Click to view profile menu"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  backgroundColor: "#123A7A",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "19px",
                  boxShadow: "0 4px 12px rgba(18, 58, 122, 0.35)",
                  border: "2px solid #ffffff",
                  cursor: "pointer",
                  userSelect: "none",
                  transition: "transform 0.2s ease",
                }}
              >
                {firstLetter}
              </div>

              {showProfileMenu && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "54px",
                    backgroundColor: "#ffffff",
                    borderRadius: "14px",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.18)",
                    border: "1px solid #E5E7EB",
                    padding: "16px",
                    minWidth: "220px",
                    zIndex: 1000,
                  }}
                >
                  <div style={{ marginBottom: "12px", borderBottom: "1px solid #F3F4F6", paddingBottom: "10px" }}>
                    <p style={{ fontWeight: "700", color: "#123A7A", fontSize: "15px", margin: 0 }}>
                      {user.name || "Pilgrim User"}
                    </p>
                    <p style={{ color: "#6B7280", fontSize: "13px", margin: "4px 0 0 0", wordBreak: "break-all" }}>
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                      navigate("/");
                    }}
                    style={{
                      width: "100%",
                      backgroundColor: "#dc2626",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "background-color 0.2s ease",
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="services-login-btn">Login</Link>
              <Link to="/register" className="services-signup-btn">Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      <header className="services-hero">
        <div className="services-hero-container">
          <span className="services-badge">INTELLIGENT SERVICES</span>
          <h1>Our Intelligent Services</h1>
          <p>
            Comprehensive health assessment, emergency assistance, weather forecasting, and personalized planning.
          </p>
        </div>
      </header>

      <section className="services-content-section">
        <div className="services-main-container">
          <div className="services-cards-grid">
            {servicesList.map((service, idx) => (
              <div className="service-item-card" key={idx}>
                <div className="service-icon-circle">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.desc}</p>
                <button className="service-btn">Explore Service →</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="services-footer">
        <p>© 2026 PilgrimIQ Inc. All rights reserved. Designed for Safe Pilgrimages.</p>
      </footer>
    </div>
  );
}

export default Services;