import "../styles/Home.css";
import { Link } from "react-router-dom";

import hero from "../assets/index-background.png";
import logo from "../assets/pilgrim-logo.png";

function Home() {
  return (
    <div className="home-page">
      {/* NAVBAR */}
      <nav className="home-navbar">
        <div className="home-logo">
          <img src={logo} alt="PilgrimIQ Logo" />
          <div className="home-logo-text">
            <h2>PilgrimIQ</h2>
            <p>Plan Smart. Travel Safe. Stay Blessed.</p>
          </div>
        </div>

        <ul className="home-nav-links">
          <li><a href="/">Home</a></li>
          <li><a href="#about">About Us</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#centers">Pilgrimage Centers</a></li>
          <li><a href="#services">Services</a></li>
          <li><a href="#works">How It Works</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>

        <div className="home-nav-buttons">
          <Link to="/login" className="home-login-btn">
            Login
          </Link>
          <Link to="/register" className="home-signup-btn">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
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

              <div className="home-hero-buttons">
                <button className="home-btn-primary">Start Your Journey</button>
                <button className="home-btn-secondary">Explore Features</button>
              </div>
            </div>

            {/* FLOATING FEATURE CARDS */}
            <div className="home-features-grid">
              <div className="home-feature-card">
                <span className="home-feature-icon">❤️</span>
                <h4>Health Assessment</h4>
                <p>AI health risk analysis and safety index</p>
              </div>

              <div className="home-feature-card">
                <span className="home-feature-icon">📅</span>
                <h4>Smart Planning</h4>
                <p>Weather, crowd and route predictions</p>
              </div>

              <div className="home-feature-card">
                <span className="home-feature-icon">🛡️</span>
                <h4>Safe & Secure</h4>
                <p>Real-time alerts and emergency support</p>
              </div>

              <div className="home-feature-card">
                <span className="home-feature-icon">🌍</span>
                <h4>All Pilgrimage Centers</h4>
                <p>Supports all pilgrimage destinations</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE PILGRIMIQ */}
      <section className="home-why-section" id="about">
        <div className="home-container">
          <div className="home-section-title">
            <h2>Why Choose PilgrimIQ?</h2>
            <p>
              Experience a smarter, safer, and more personalized pilgrimage with
              Artificial Intelligence, IoT, and real-time guidance.
            </p>
          </div>

          <div className="home-why-grid">
            <div className="home-why-card">
              <div className="home-icon-wrapper">🩺</div>
              <h3>AI Health Assessment</h3>
              <p>Analyze your health conditions and determine whether you are ready for your pilgrimage journey.</p>
            </div>

            <div className="home-why-card">
              <div className="home-icon-wrapper">📍</div>
              <h3>Smart Journey Planning</h3>
              <p>Get personalized travel plans based on your health, weather, distance, and crowd conditions.</p>
            </div>

            <div className="home-why-card">
              <div className="home-icon-wrapper">🛡️</div>
              <h3>Pilgrim Safety Index</h3>
              <p>Calculate a personalized safety score using AI and real-time health information.</p>
            </div>

            <div className="home-why-card">
              <div className="home-icon-wrapper">📡</div>
              <h3>IoT Monitoring</h3>
              <p>Monitor heart rate, oxygen level, and body temperature using wearable IoT devices.</p>
            </div>

            <div className="home-why-card">
              <div className="home-icon-wrapper">☁️</div>
              <h3>Weather Prediction</h3>
              <p>Receive accurate weather forecasts and alerts before and during your pilgrimage.</p>
            </div>

            <div className="home-why-card">
              <div className="home-icon-wrapper">🚨</div>
              <h3>Emergency Support</h3>
              <p>Find nearby hospitals, emergency contacts, and receive instant alerts whenever needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="home-stats-section">
        <div className="home-container">
          <div className="home-stat-card">
            <h2>10K+</h2>
            <p>Pilgrims Assisted</p>
          </div>
          <div className="home-stat-card">
            <h2>150+</h2>
            <p>Pilgrimage Centers</p>
          </div>
          <div className="home-stat-card">
            <h2>98%</h2>
            <p>Prediction Accuracy</p>
          </div>
          <div className="home-stat-card">
            <h2>24/7</h2>
            <p>Emergency Support</p>
          </div>
        </div>
      </section>

      {/* JOURNEY STEPS */}
      <section className="home-journey-section" id="works">
        <div className="home-container">
          <div className="home-section-title">
            <h2>Start Your Journey in 5 Simple Steps</h2>
            <p>PilgrimIQ guides you from health assessment to safe pilgrimage using intelligent recommendations.</p>
          </div>

          <div className="home-journey-grid">
            <div className="home-step-card">
              <div className="home-step-circle">1</div>
              <h3>Create Account</h3>
              <p>Register and create your personalized pilgrim profile.</p>
            </div>

            <div className="home-step-card">
              <div className="home-step-circle">2</div>
              <h3>Health Assessment</h3>
              <p>Enter your health details and upload medical reports.</p>
            </div>

            <div className="home-step-card">
              <div className="home-step-circle">3</div>
              <h3>AI Analysis</h3>
              <p>Our AI predicts health risks and calculates your safety index.</p>
            </div>

            <div className="home-step-card">
              <div className="home-step-circle">4</div>
              <h3>Plan Journey</h3>
              <p>Receive the best travel plan based on weather, crowd, and route.</p>
            </div>

            <div className="home-step-card">
              <div className="home-step-circle">5</div>
              <h3>Travel Safely</h3>
              <p>Monitor your health continuously with AI and IoT support.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="home-testimonials-section">
        <div className="home-container">
          <div className="home-section-title">
            <h2>What Pilgrims Say</h2>
            <p>Thousands of pilgrims trust PilgrimIQ to make their journey safer, healthier, and stress-free.</p>
          </div>

          <div className="home-testimonial-grid">
            <div className="home-testimonial-card">
              <div className="home-star-quote">★★★★★</div>
              <p>"PilgrimIQ analyzed my medical report and suggested the perfect time for my Sabarimala pilgrimage. It gave me confidence to travel safely."</p>
              <h4>Rahul Nair</h4>
              <span>Sabarimala Pilgrim</span>
            </div>

            <div className="home-testimonial-card">
              <div className="home-star-quote">★★★★★</div>
              <p>"The weather prediction and crowd analysis saved us from travelling during heavy rainfall. Amazing experience!"</p>
              <h4>Priya Thomas</h4>
              <span>Tirupati Pilgrim</span>
            </div>

            <div className="home-testimonial-card">
              <div className="home-star-quote">★★★★★</div>
              <p>"My parents are senior citizens. The health monitoring and emergency support features were extremely useful during our pilgrimage."</p>
              <h4>Joseph Mathew</h4>
              <span>Velankanni Pilgrim</span>
            </div>
          </div>
        </div>
      </section>

      {/* UPDATES */}
      <section className="home-updates-section" id="features">
        <div className="home-container">
          <div className="home-section-title">
            <h2>Latest Updates</h2>
            <p>Discover the newest features available in PilgrimIQ.</p>
          </div>

          <div className="home-update-grid">
            <div className="home-update-card">
              <div className="home-icon-wrapper">🤖</div>
              <h3>AI Medical Analysis</h3>
              <p>Upload your medical report and receive AI-powered health insights.</p>
            </div>

            <div className="home-update-card">
              <div className="home-icon-wrapper">📡</div>
              <h3>IoT Integration</h3>
              <p>Live monitoring of Heart Rate, SpO₂, and Body Temperature.</p>
            </div>

            <div className="home-update-card">
              <div className="home-icon-wrapper">☁️</div>
              <h3>Weather Intelligence</h3>
              <p>Real-time weather updates and heat risk prediction for pilgrims.</p>
            </div>

            <div className="home-update-card">
              <div className="home-icon-wrapper">🛕</div>
              <h3>More Pilgrimage Centers</h3>
              <p>Support added for Sabarimala, Tirupati, Guruvayur, Palani, and more.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta-section">
        <div className="home-container">
          <h2>Ready to Begin Your Pilgrimage?</h2>
          <p>Join thousands of pilgrims using AI-powered planning for a safer and smarter spiritual journey.</p>

          <div className="home-cta-buttons">
            <Link to="/register" className="home-cta-primary">Get Started</Link>
            <Link to="/features" className="home-cta-secondary">Explore Features</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-footer" id="contact">
        <div className="home-container home-footer-grid">
          <div>
            <h2>PilgrimIQ</h2>
            <p>AI-Powered Personalized Pilgrimage Decision Support System helping pilgrims travel safely through intelligent planning and health monitoring.</p>
          </div>

          <div>
            <h3>Quick Links</h3>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/features">Features</Link></li>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3>Services</h3>
            <ul>
              <li>Health Assessment</li>
              <li>Journey Planning</li>
              <li>Weather Prediction</li>
              <li>Pilgrim Safety Index</li>
              <li>Emergency Support</li>
            </ul>
          </div>

          <div>
            <h3>Contact</h3>
            <p>📍 Kerala, India</p>
            <p>📧 support@pilgrimiq.com</p>
            <p>📞 +91 98765 43210</p>
          </div>
        </div>

        <div className="home-footer-bottom">
          <p>© 2026 PilgrimIQ. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;