import { useState } from "react";
import "../styles/About.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/pilgrim-logo.png";

function About() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : "U");

  return (
    <div className="about-page">
      <nav className="about-navbar">
        <div className="about-logo">
          <img src={logo} alt="PilgrimIQ Logo" />
          <div className="about-logo-text">
            <h2>PilgrimIQ</h2>
            <p>Plan Smart. Travel Safe. Stay Blessed.</p>
          </div>
        </div>

        <ul className="about-nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about" className="active-nav">About Us</Link></li>
          <li><Link to="/features">Features</Link></li>
          <li><Link to="/centers">Pilgrimage Centers</Link></li>
          <li><Link to="/services">Services</Link></li>
          <li><Link to="/how-it-works">How It Works</Link></li>
          <li><Link to="/contact">Contact</Link></li>
        </ul>

        <div className="about-nav-buttons">
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
              <Link to="/login" className="about-login-btn">Login</Link>
              <Link to="/register" className="about-signup-btn">Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      <header className="about-hero">
        <div className="about-hero-container">
          <span className="about-badge">ABOUT PILGRIMIQ</span>
          <h1>Pioneering AI-Powered Pilgrimage Safety & Healthcare Support</h1>
          <p>
            PilgrimIQ was built to solve a critical global challenge: ensuring millions of pilgrims travel safely across steep altitude terrains, harsh weather conditions, and dense crowds with real-time decision intelligence.
          </p>
        </div>
      </header>

      <section className="about-mission-section">
        <div className="about-main-container">
          <div className="mission-grid">
            <div className="mission-content-left">
              <span className="tag-sub">OUR MISSION</span>
              <h2>Combining AI Precision with Sacred Journeys</h2>
              <p className="mission-desc">
                Whether trekking 16 km up Himalayan slopes to Kedarnath or navigating intense heat in Madinah, every pilgrim deserves continuous healthcare monitoring and micro-environment forecasts. PilgrimIQ integrates AI health diagnostic scanning, weather intelligence, and live crowd tracking into a single unified SaaS solution.
              </p>

              <div className="mission-feature-cards">
                <div className="mini-card">
                  <div className="mini-icon icon-green">🛡️</div>
                  <div>
                    <h4>Pilgrim Safety Index (PSI)</h4>
                    <p>Dynamic score based on vitals, weather, terrain, and altitude.</p>
                  </div>
                </div>

                <div className="mini-card">
                  <div className="mini-icon icon-blue">💻</div>
                  <div>
                    <h4>Automated Medical OCR</h4>
                    <p>Instant scanning of prescriptions and blood report parameters.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mission-image-right">
              <div className="image-box">
                <img
                  src="https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop"
                  alt="Pilgrim Journey Support"
                />
                <div className="image-overlay-card">
                  <span className="gold-tag">10,000+ Journeys Secured</span>
                  <h3>Serving Faiths Across the Globe</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-why-section">
        <div className="about-main-container">
          <div className="why-title-box">
            <h2>Why PilgrimIQ Matters</h2>
            <p>Built with empathy, medical accuracy, and high-performance cloud technology</p>
          </div>

          <div className="why-cards-grid">
            <div className="why-item-card">
              <div className="why-icon-circle circle-blue">💙</div>
              <h3>Health First</h3>
              <p>Prioritizing early warning systems, SpO2 altitude alerts, and customized hydration intake.</p>
            </div>

            <div className="why-item-card">
              <div className="why-icon-circle circle-yellow">🪄</div>
              <h3>Predictive AI</h3>
              <p>Real-time microclimate models forecasting mountain weather changes up to 7 days ahead.</p>
            </div>

            <div className="why-item-card">
              <div className="why-icon-circle circle-green">🌐</div>
              <h3>Multi-Faith Support</h3>
              <p>Tailored for temples, churches, mosques, monasteries, and holy shrines globally.</p>
            </div>

            <div className="why-item-card">
              <div className="why-icon-circle circle-pink">🏅</div>
              <h3>24/7 SOS Backup</h3>
              <p>Instant GPS location broadcast and integration with local emergency dispatch units.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="about-footer">
        <div className="about-main-container about-footer-grid">
          <div>
            <div className="footer-logo">
              <img src={logo} alt="PilgrimIQ Logo" />
              <h3>PilgrimIQ</h3>
            </div>
            <p className="footer-desc">
              PilgrimIQ is an AI-powered personalized decision support platform engineered to ensure maximum safety, healthcare monitoring, weather intelligence, and travel comfort for pilgrims worldwide.
            </p>
            <div className="cert-badges-row">
              <span className="cert-badge">🛡️ HIPAA Compliant</span>
              <span className="cert-badge">🤖 AI Powered</span>
            </div>
          </div>

          <div>
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/features">Key Features</Link></li>
              <li><Link to="/centers">Pilgrimage Centers</Link></li>
              <li><Link to="/how-it-works">How It Works</Link></li>
            </ul>
          </div>

          <div>
            <h4>Services</h4>
            <ul>
              <li><Link to="/services">AI Health Assessment</Link></li>
              <li><Link to="/services">Pilgrim Safety Index (PSI)</Link></li>
              <li><Link to="/services">Medical OCR Scanning</Link></li>
              <li><Link to="/services">Crowd & Queue Forecasting</Link></li>
              <li><Link to="/services">Emergency SOS & Rescue</Link></li>
              <li><Link to="/services">Hydration & Meal Planner</Link></li>
            </ul>
          </div>

          <div>
            <h4>Contact Us</h4>
            <p>📍 PilgrimIQ ,India</p>
            <p>📧 support@pilgrim-iq.com</p>
            <p>📞 +91 9874561232-PILGRIM (24/7)</p>
          </div>
        </div>

        <div className="about-footer-bottom">
          <p>© 2026 PilgrimIQ Inc. All rights reserved. Designed for Safe Pilgrimages.</p>
        </div>
      </footer>
    </div>
  );
}

export default About;
