import { useState, useEffect } from "react";
import "../styles/Home.css";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCompass, FiCalendar, FiShield } from "react-icons/fi";
import { FaHeartbeat, FaPrayingHands } from "react-icons/fa";
import { apiGetPilgrimageCenters } from "../services/api";

import hero from "../assets/index-background.png";

function Home() {
  const [heartRate, setHeartRate] = useState(74);
  const [spo2, setSpo2] = useState(98);
  const [altitude, setAltitude] = useState(2800);

  const [featuredCenters, setFeaturedCenters] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    const loadFeaturedCenters = async () => {
      try {
        setLoadingFeatured(true);
        const data = await apiGetPilgrimageCenters();
        setFeaturedCenters((data || []).slice(0, 3));
      } catch (err) {
        console.error("Home featured centers load error:", err);
      } finally {
        setLoadingFeatured(false);
      }
    };
    loadFeaturedCenters();
  }, []);

  const calculatePsi = () => {
    let score = 100;
    if (heartRate > 90) score -= 15;
    if (spo2 < 95) score -= 20;
    if (altitude > 3000) score -= 10;
    return Math.max(score, 50);
  };

  const psiScore = calculatePsi();

  return (
    <div className="home-page">
      <Navbar />

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
              Experience a safer, personalized pilgrimage engineered with Artificial Intelligence, family tracking, and microclimate forecasting.
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
              <div className="home-icon-wrapper">👨‍👩‍👧‍👦</div>
              <h3>Family Tracking</h3>
              <p>Live tracking for location, status updates, and safety alerts for all registered family members.</p>
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

      {/* FEATURED PILGRIMAGE CENTERS SECTION */}
      <section className="home-centers-preview-section" style={{ background: "#ffffff", padding: "60px 0" }}>
        <div className="home-container">
          <div className="home-section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", textAlign: "left", marginBottom: "32px" }}>
            <div>
              <span className="home-badge">SACRED DESTINATIONS</span>
              <h2>Featured Pilgrimage Centers</h2>
              <p>Explore official pilgrimage centers added and monitored by administrators.</p>
            </div>
            <Link to="/centers" style={{ color: "#2563eb", fontWeight: 700, textDecoration: "none", fontSize: "14.5px" }}>
              View All Centers →
            </Link>
          </div>

          {loadingFeatured ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
              Loading featured centers...
            </div>
          ) : featuredCenters.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
              <p style={{ color: "#64748b", margin: 0 }}>No pilgrimage centers are currently available.</p>
            </div>
          ) : (
            <div className="home-centers-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
              {featuredCenters.map((center) => (
                <div key={center._id} style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 16px rgba(15,23,42,0.04)" }}>
                  <img
                    src={center.image || "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?q=80&w=600&auto=format&fit=crop"}
                    alt={center.name}
                    style={{ width: "100%", height: "180px", objectFit: "cover" }}
                  />
                  <div style={{ padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ background: "#eff6ff", color: "#2563eb", padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 }}>{center.religion}</span>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{center.visitingInformation?.bestSeason || "All Year"}</span>
                    </div>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: "0 0 6px 0" }}>{center.name}</h3>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 14px 0" }}>📍 {center.location?.city}, {center.location?.state}</p>
                    <Link to={`/pilgrimage-centers/${center._id}`} style={{ display: "inline-block", background: "#2563eb", color: "#ffffff", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
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
            <p>PilgrimIQ is a personalized decision support platform engineered to ensure maximum safety, healthcare monitoring, weather intelligence, and travel comfort for pilgrims worldwide.</p>
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
