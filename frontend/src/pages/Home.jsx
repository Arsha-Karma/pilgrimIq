import { useState } from "react";
import "../styles/Home.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiArrowRight, FiCompass, FiCalendar, FiShield } from "react-icons/fi";
import { FaHeartbeat, FaPrayingHands } from "react-icons/fa";

import hero from "../assets/index-background.png";
import logo from "../assets/pilgrim-logo.png";

function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [heartRate, setHeartRate] = useState(74);
  const [spo2, setSpo2] = useState(98);
  const [altitude, setAltitude] = useState(2800);

  const calculatePsi = () => {
    let score = 100;
    if (heartRate > 90) score -= 15;
    if (spo2 < 95) score -= 20;
    if (altitude > 3000) score -= 10;
    return Math.max(score, 50);
  };

  const psiScore = calculatePsi();
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : "U");

  return (
    <div className="home-page">
      <nav className="home-navbar">
        <div className="home-logo">
          <img src={logo} alt="PilgrimIQ Logo" />
          <div className="home-logo-text">
            <h2>PilgrimIQ</h2>
            <p>Plan Smart. Travel Safe. Stay Blessed.</p>
          </div>
        </div>

        <ul className="home-nav-links">
          <li><Link to="/" className="active-nav">Home</Link></li>
          <li><Link to="/about">About Us</Link></li>
          <li><Link to="/features">Features</Link></li>
          <li><Link to="/centers">Pilgrimage Centers</Link></li>
          <li><Link to="/services">Services</Link></li>
          <li><Link to="/how-it-works">How It Works</Link></li>
          <li><Link to="/contact">Contact</Link></li>
        </ul>

        <div className="home-nav-buttons">
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
              <Link to="/login" className="home-login-btn">
                Login
              </Link>
              <Link to="/register" className="home-signup-btn">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      <section
        className="home-hero"
        style={{ backgroundImage: `url(${hero})` }}
      >
        <div className="home-overlay">
          <div className="home-hero-container">
            <div className="home-hero-content">
              <h2>
                Your Journey.
                <br />
                Our Intelligent Support.
              </h2>
              <p className="home-hero-subtitle">
                PilgrimIQ is a platform that helps you plan, prepare and complete your pilgrimage with personalized health insights, smart planning and real-time assistance.
              </p>

              <div className="home-hero-buttons">
                <Link to="/register" className="home-btn-primary">
                  <span>Start Your Journey</span>
                  <FiArrowRight className="home-btn-icon" />
                </Link>
                <Link to="/features" className="home-btn-secondary">
                  <span>Explore Features</span>
                  <FiCompass className="home-btn-icon" />
                </Link>
              </div>
            </div>

            <div className="home-features-grid">
              <div className="home-feature-card">
                <div className="home-feature-icon-wrapper">
                  <FaHeartbeat className="home-feature-icon" />
                </div>
                <div className="home-feature-info">
                  <h4>Health Assessment</h4>
                  <p>AI health risk analysis and safety index</p>
                </div>
              </div>

              <div className="home-feature-card">
                <div className="home-feature-icon-wrapper">
                  <FiCalendar className="home-feature-icon" />
                </div>
                <div className="home-feature-info">
                  <h4>Smart Planning</h4>
                  <p>Weather, crowd & route predictions</p>
                </div>
              </div>

              <div className="home-feature-card">
                <div className="home-feature-icon-wrapper">
                  <FiShield className="home-feature-icon" />
                </div>
                <div className="home-feature-info">
                  <h4>Safe & Secure</h4>
                  <p>Real-time alerts, AI chat & emergency support</p>
                </div>
              </div>

              <div className="home-feature-card">
                <div className="home-feature-icon-wrapper">
                  <FaPrayingHands className="home-feature-icon" />
                </div>
                <div className="home-feature-info">
                  <h4>All Faiths</h4>
                  <p>Temples, Churches, Mosques & more</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-why-section">
        <div className="home-container">
          <div className="home-section-title">
            <span className="home-badge">WHY CHOOSE PILGRIMIQ</span>
            <h2>Intelligent Healthcare & Journey Analytics</h2>
            <p>
              Experience a safer, personalized pilgrimage engineered with Artificial Intelligence, IoT bio-monitoring, and microclimate forecasting.
            </p>
          </div>

          <div className="home-why-grid">
            <div className="home-why-card">
              <div className="home-icon-wrapper">🩺</div>
              <h3>AI Health Risk Assessment</h3>
              <p>Analyzes your vital stats and medical reports to ensure journey readiness before stepping foot on the trail.</p>
              <Link to="/features" className="home-card-link">Learn More →</Link>
            </div>

            <div className="home-why-card">
              <div className="home-icon-wrapper">📍</div>
              <h3>Smart Journey Planning</h3>
              <p>Personalized itineraries generated based on your health profile, route slope, and live weather conditions.</p>
              <Link to="/services" className="home-card-link">Learn More →</Link>
            </div>

            <div className="home-why-card">
              <div className="home-icon-wrapper">🛡️</div>
              <h3>Pilgrim Safety Index (PSI)</h3>
              <p>Calculates a real-time safety score combining personal vitals, altitude sickness risks, and crowd density.</p>
              <Link to="/features" className="home-card-link">Learn More →</Link>
            </div>

            <div className="home-why-card">
              <div className="home-icon-wrapper">📡</div>
              <h3>IoT Health Monitoring</h3>
              <p>Live tracking for SpO₂, heart rate, and body temperature via wearable smart device integration.</p>
              <Link to="/services" className="home-card-link">Learn More →</Link>
            </div>

            <div className="home-why-card">
              <div className="home-icon-wrapper">☁️</div>
              <h3>Weather Intelligence</h3>
              <p>Accurate 7-day micro-weather forecasting for high-altitude mountain routes and desert shrines.</p>
              <Link to="/features" className="home-card-link">Learn More →</Link>
            </div>

            <div className="home-why-card">
              <div className="home-icon-wrapper">🚨</div>
              <h3>24/7 Emergency Support</h3>
              <p>Instant SOS broadcast to nearest medical relief posts, specialized clinics, and family emergency contacts.</p>
              <Link to="/services" className="home-card-link">Learn More →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="home-demo-simulator-section">
        <div className="home-container">
          <div className="simulator-box">
            <div className="simulator-info">
              <span className="home-badge">LIVE DEMO SIMULATOR</span>
              <h2>Interactive Pilgrim Safety Index (PSI) Calculator</h2>
              <p>Adjust vitals below to see how PilgrimIQ calculates your real-time travel safety score.</p>

              <div className="sim-sliders">
                <div className="slider-group">
                  <label>Heart Rate: <strong>{heartRate} bpm</strong></label>
                  <input
                    type="range"
                    min="60"
                    max="120"
                    value={heartRate}
                    onChange={(e) => setHeartRate(Number(e.target.value))}
                  />
                </div>

                <div className="slider-group">
                  <label>SpO₂ Level: <strong>{spo2}%</strong></label>
                  <input
                    type="range"
                    min="80"
                    max="100"
                    value={spo2}
                    onChange={(e) => setSpo2(Number(e.target.value))}
                  />
                </div>

                <div className="slider-group">
                  <label>Route Altitude: <strong>{altitude} m</strong></label>
                  <input
                    type="range"
                    min="500"
                    max="4500"
                    step="100"
                    value={altitude}
                    onChange={(e) => setAltitude(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="simulator-card-score">
              <div className="score-circle-outer">
                <div className="score-number">{psiScore}</div>
                <div className="score-label">PSI SCORE / 100</div>
              </div>
              <div className={`status-pill ${psiScore >= 80 ? "status-safe" : "status-warn"}`}>
                {psiScore >= 80 ? "✅ SAFE TO TRAVEL" : "⚠️ CAUTION RECOMMENDED"}
              </div>
              <p className="score-desc">
                {psiScore >= 80
                  ? "Optimal health & weather conditions. Recommended for trek."
                  : "Elevated altitude or vital risk detected. Rest stops advised."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-journey-section">
        <div className="home-container">
          <div className="home-section-title">
            <span className="home-badge">SEAMLESS PROCESS</span>
            <h2>Start Your Journey in 5 Simple Steps</h2>
            <p>PilgrimIQ guides you from medical assessment to a safe, spiritually peaceful journey.</p>
          </div>

          <div className="home-journey-grid">
            <div className="home-step-card">
              <div className="home-step-circle">01</div>
              <h3>Create Account</h3>
              <p>Register in under 30 seconds for yourself or elderly family members.</p>
            </div>

            <div className="home-step-card">
              <div className="home-step-circle">02</div>
              <h3>Health Assessment</h3>
              <p>Input vital statistics or upload medical reports for automated OCR scanning.</p>
            </div>

            <div className="home-step-card">
              <div className="home-step-circle">03</div>
              <h3>AI Risk Analysis</h3>
              <p>Our AI computes your personalized Pilgrim Safety Index (PSI) score.</p>
            </div>

            <div className="home-step-card">
              <div className="home-step-circle">04</div>
              <h3>Plan Journey</h3>
              <p>Receive AI-optimized route recommendations, stay & meal advice.</p>
            </div>

            <div className="home-step-card">
              <div className="home-step-circle">05</div>
              <h3>Travel Safely</h3>
              <p>Embark with live weather alerts, crowd updates, and emergency SOS backup.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-stats-section">
        <div className="home-container home-stats-grid">
          <div className="home-stat-glow-card">
            <span className="stat-icon">👥</span>
            <h2>10,000+</h2>
            <p>Pilgrims Assisted</p>
          </div>
          <div className="home-stat-glow-card">
            <span className="stat-icon">📍</span>
            <h2>500+</h2>
            <p>Pilgrimage Centers</p>
          </div>
          <div className="home-stat-glow-card">
            <span className="stat-icon">🎯</span>
            <h2>98%</h2>
            <p>Prediction Accuracy</p>
          </div>
          <div className="home-stat-glow-card">
            <span className="stat-icon">🚨</span>
            <h2>24/7</h2>
            <p>Emergency SOS Dispatch</p>
          </div>
        </div>
      </section>

      <section className="home-testimonials-section">
        <div className="home-container">
          <div className="home-section-title">
            <span className="home-badge">REAL PILGRIM EXPERIENCES</span>
            <h2>Trusted by Pilgrims Worldwide</h2>
            <p>Read how PilgrimIQ transformed travel safety and health monitoring for families.</p>
          </div>

          <div className="home-testimonial-grid">
            <div className="home-testimonial-card">
              <div className="home-star-quote">★★★★★</div>
              <p>"PilgrimIQ evaluated my blood pressure history and recommended an optimal 3-day itinerary for Kedarnath. The hydration and oxygen alerts saved me from altitude sickness!"</p>
              <h4>Rahul Nair</h4>
              <span>Senior Citizen Pilgrim</span>
            </div>

            <div className="home-testimonial-card">
              <div className="home-star-quote">★★★★★</div>
              <p>"As a doctor, I was amazed by how accurately the OCR parsed my family’s health records and generated real-time risk scores for our Vaishno Devi trip. Exceptional technology!"</p>
              <h4>Dr. Ananya Iyer</h4>
              <span>Medical Practitioner & Traveler</span>
            </div>

            <div className="home-testimonial-card">
              <div className="home-star-quote">★★★★★</div>
              <p>"The crowd prediction and heat management notifications in PilgrimIQ helped us navigate Medina seamlessly. It gives peace of mind to elderly pilgrims and their families."</p>
              <h4>Mohammed Al-Mansoor</h4>
              <span>Hajj & Umrah Traveler</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-cta-wrapper-section">
        <div className="home-container">
          <div className="home-cta-floating-card">
            <span className="home-gold-pill">START YOUR JOURNEY TODAY</span>
            <h2>Ready to Begin Your Pilgrimage?</h2>
            <p>Ensure maximum health safety, weather accuracy, and trip peace of mind with PilgrimIQ's personalized AI decision support system.</p>

            <div className="home-cta-buttons">
              <Link to="/register" className="home-cta-gold-btn">Get Started Free →</Link>
              <Link to="/features" className="home-cta-outline-btn">Explore Features</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-container home-footer-grid">
          <div>
            <h2>PilgrimIQ</h2>
            <p>PilgrimIQ is an AI-powered personalized decision support platform engineered to ensure maximum safety, healthcare monitoring, weather intelligence, and travel comfort for pilgrims worldwide.</p>
            <div className="home-footer-badges">
              <span className="home-cert-badge">🔒 HIPAA Compliant</span>
              <span className="home-cert-badge">🤖 AI Powered</span>
            </div>
          </div>

          <div>
            <h3>Quick Links</h3>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/features">Key Features</Link></li>
              <li><Link to="/centers">Pilgrimage Centers</Link></li>
              <li><Link to="/how-it-works">How It Works</Link></li>
            </ul>
          </div>

          <div>
            <h3>Services</h3>
            <ul>
              <li><Link to="/services">AI Health Assessment</Link></li>
              <li><Link to="/services">Pilgrim Safety Index (PSI)</Link></li>
              <li><Link to="/services">Medical OCR Scanning</Link></li>
              <li><Link to="/services">Crowd & Queue Forecasting</Link></li>
              <li><Link to="/services">Emergency SOS & Rescue</Link></li>
            </ul>
          </div>

          <div>
            <h3>Contact Us</h3>
            <p>📍 PilgrimIQ ,India</p>
            <p>📧 pilgrimlq03@gmail.com</p>
            <p>📞 +91 9874561232-PILGRIM (24/7)</p>
          </div>
        </div>

        <div className="home-footer-bottom">
          <p>© 2026 PilgrimIQ Inc. All rights reserved. Designed for Safe Pilgrimages.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;