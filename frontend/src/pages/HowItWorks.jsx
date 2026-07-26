import { useState } from "react";
import "../styles/HowItWorks.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/pilgrim-logo.png";

function HowItWorks() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : "U");
  const steps = [
    {
      num: "01",
      title: "Register Account",
      desc: "Create your secure profile in under 30 seconds for yourself or elderly family members."
    },
    {
      num: "02",
      title: "Create Health Profile",
      desc: "Input vital statistics, age, chronic medical conditions, and mobility levels."
    },
    {
      num: "03",
      title: "Upload Medical Reports",
      desc: "Upload diagnostic lab reports or prescriptions for automated AI OCR scanning."
    },
    {
      num: "04",
      title: "AI Safety Assessment",
      desc: "Our engine computes your Pilgrim Safety Index (PSI) and identifies health risk vectors."
    },
    {
      num: "05",
      title: "Receive Smart Journey Plan",
      desc: "Get custom route recommendations, altitude acclimatization schedules, and hydration alerts."
    },
    {
      num: "06",
      title: "Travel Safely",
      desc: "Embark with live weather monitoring, crowd density updates, and 24/7 SOS dispatch backup."
    }
  ];

  return (
    <div className="works-page">
      <nav className="works-navbar">
        <div className="works-logo">
          <img src={logo} alt="PilgrimIQ Logo" />
          <div className="works-logo-text">
            <h2>PilgrimIQ</h2>
            <p>Plan Smart. Travel Safe. Stay Blessed.</p>
          </div>
        </div>

        <ul className="works-nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About Us</Link></li>
          <li><Link to="/features">Features</Link></li>
          <li><Link to="/centers">Pilgrimage Centers</Link></li>
          <li><Link to="/services">Services</Link></li>
          <li><Link to="/how-it-works" className="active-nav">How It Works</Link></li>
          <li><Link to="/contact">Contact</Link></li>
        </ul>

        <div className="works-nav-buttons">
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
              <Link to="/login" className="works-login-btn">Login</Link>
              <Link to="/register" className="works-signup-btn">Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      <header className="works-hero">
        <div className="works-hero-container">
          <span className="works-badge">SEAMLESS PROCESS</span>
          <h1>How PilgrimIQ Works</h1>
          <p>
            Six simple steps from registration to a safe, guided pilgrimage experience.
          </p>
        </div>
      </header>

      <section className="works-content-section">
        <div className="works-main-container">
          <div className="works-cards-grid">
            {steps.map((step, idx) => (
              <div className="works-step-card" key={idx}>
                <div className="works-step-circle">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="works-footer">
        <p>© 2026 PilgrimIQ Inc. All rights reserved. Designed for Safe Pilgrimages.</p>
      </footer>
    </div>
  );
}

export default HowItWorks;