import { useState } from "react";
import "../styles/Features.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/pilgrim-logo.png";

function Features() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : "U");
  const capabilities = [
    {
      icon: "📄",
      title: "AI Medical Report Analysis",
      desc: "Extract lab values, blood pressure, and cardiac conditions from scans."
    },
    {
      icon: "⏲️",
      title: "Pilgrim Safety Index",
      desc: "Real-time updated safety score calculated from 20+ environmental & personal parameters."
    },
    {
      icon: "🌤️",
      title: "Weather Prediction",
      desc: "7-day micro-weather forecasting customized for high-altitude pilgrimage routes."
    },
    {
      icon: "👥",
      title: "Crowd Prediction",
      desc: "AI crowd density heatmaps to avoid peak choke points and long waiting queues."
    },
    {
      icon: "🕒",
      title: "Waiting Time Prediction",
      desc: "Live queue monitoring and estimated darshan / entrance wait time calculations."
    },
    {
      icon: "🏨",
      title: "Accommodation Recommendation",
      desc: "Rest-stop and stay recommendations filtered for medical accessibility and comfort."
    },
    {
      icon: "🍴",
      title: "Food Recommendation",
      desc: "Tailored dietary plans matching medical needs, altitude energy demands, and sacred traditions."
    },
    {
      icon: "📍",
      title: "Journey Timeline",
      desc: "Step-by-step interactive travel timeline with checkpoints and rest milestones."
    },
    {
      icon: "💊",
      title: "Medicine Reminder",
      desc: "Time-zone aware pill alerts synced with trek schedules and meals."
    },
    {
      icon: "💧",
      title: "Hydration Reminder",
      desc: "Dynamic hydration intake notifications adjusted for elevation and ambient heat."
    },
    {
      icon: "⚠️",
      title: "Emergency Support",
      desc: "24/7 dedicated dispatch helpline, GPS broadcast, and rescue team coordination."
    },
    {
      icon: "🏥",
      title: "Nearby Hospitals",
      desc: "Instant directions and emergency contact channels for nearest specialized clinics."
    }
  ];

  return (
    <div className="features-page">
      <nav className="features-navbar">
        <div className="features-logo">
          <img src={logo} alt="PilgrimIQ Logo" />
          <div className="features-logo-text">
            <h2>PilgrimIQ</h2>
            <p>Plan Smart. Travel Safe. Stay Blessed.</p>
          </div>
        </div>

        <ul className="features-nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About Us</Link></li>
          <li><Link to="/features" className="active-nav">Features</Link></li>
          <li><Link to="/centers">Pilgrimage Centers</Link></li>
          <li><Link to="/services">Services</Link></li>
          <li><Link to="/how-it-works">How It Works</Link></li>
          <li><Link to="/contact">Contact</Link></li>
        </ul>

        <div className="features-nav-buttons">
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
              <Link to="/login" className="features-login-btn">Login</Link>
              <Link to="/register" className="features-signup-btn">Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      <header className="features-hero">
        <div className="features-hero-container">
          <span className="features-badge">COMPREHENSIVE PLATFORM CAPABILITIES</span>
          <h1>
            Next-Gen AI Decision Support <span className="gold-text">Features</span>
          </h1>
          <p>
            Discover all 12 intelligent modules engineered to transform pre-journey preparation, live route monitoring, and emergency response for pilgrims worldwide.
          </p>

          <div className="features-hero-actions">
            <button className="gold-action-btn">✨ Try PSI Score Calculator</button>
            <button className="outline-action-btn">Test Medical Report OCR</button>
          </div>
        </div>
      </header>

      <section className="features-grid-section">
        <div className="features-main-container">
          <div className="capabilities-3col-grid">
            {capabilities.map((item, index) => (
              <div className="capability-card" key={index}>
                <div className="cap-icon-circle">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="features-cta-banner">
            <div className="cta-left-content">
              <h2>Ready to Experience AI Decision Support Live?</h2>
              <p>
                Try our interactive live dashboard simulator to monitor weather, hydration alerts, and crowd forecasts in real-time.
              </p>
            </div>
            <button className="cta-gold-btn">Launch Live Dashboard Demo →</button>
          </div>
        </div>
      </section>

      <footer className="centers-footer">
        <p>© 2026 PilgrimIQ Inc. All rights reserved. Designed for Safe Pilgrimages.</p>
      </footer>
    </div>
  );
}

export default Features;
