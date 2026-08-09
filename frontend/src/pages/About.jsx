import "../styles/About.css";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import logo from "../assets/pilgrim-logo.png";

function About() {

  return (
    <div className="about-page">
      <Navbar />

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
            <p>📧 pilgrimlq03@gmail.com</p>
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
