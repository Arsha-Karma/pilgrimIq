import { useState } from "react";
import "../styles/Contact.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/pilgrim-logo.png";

function Contact() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : "U");

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="contact-page">
      <nav className="contact-navbar">
        <div className="contact-logo">
          <img src={logo} alt="PilgrimIQ Logo" />
          <div className="contact-logo-text">
            <h2>PilgrimIQ</h2>
            <p>Plan Smart. Travel Safe. Stay Blessed.</p>
          </div>
        </div>

        <ul className="contact-nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About Us</Link></li>
          <li><Link to="/features">Features</Link></li>
          <li><Link to="/centers">Pilgrimage Centers</Link></li>
          <li><Link to="/services">Services</Link></li>
          <li><Link to="/how-it-works">How It Works</Link></li>
          <li><Link to="/contact" className="active-nav">Contact</Link></li>
        </ul>

        <div className="contact-nav-buttons">
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
              <Link to="/login" className="contact-login-btn">Login</Link>
              <Link to="/register" className="contact-signup-btn">Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      <header className="contact-hero">
        <div className="contact-hero-container">
          <span className="contact-badge">24/7 SUPPORT & HELP</span>
          <h1>Contact Us</h1>
          <p>
            Have questions or need emergency assistance? Reach out to our 24/7 support team.
          </p>
        </div>
      </header>

      <section className="contact-content-section">
        <div className="contact-main-container">
          <div className="contact-grid-2">
            <div className="contact-info-card">
              <h2>Get in Touch</h2>
              <p className="info-intro">
                Our support team and emergency dispatch network operate round the clock to ensure pilgrim safety across all sacred destinations.
              </p>

              <div className="contact-detail-items">
                <div className="detail-item">
                  <span className="detail-icon">📍</span>
                  <div>
                    <h4>Location</h4>
                    <p>PilgrimIQ ,India</p>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-icon">📧</span>
                  <div>
                    <h4>Email Support</h4>
                    <p>support@pilgrim-iq.com</p>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-icon">📞</span>
                  <div>
                    <h4>Emergency SOS Helpline</h4>
                    <p>+91 9874561232-PILGRIM (24/7)</p>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-icon">🕒</span>
                  <div>
                    <h4>Operating Hours</h4>
                    <p>24/7 Real-Time Support & Rescue Dispatch</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-form-card">
              <h2>Send a Message</h2>
              {submitted ? (
                <div className="form-success-alert">
                  ✅ Thank you! Your message has been sent successfully. Our team will get back to you shortly.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="actual-form">
                  <div className="form-group">
                    <label>Your Full Name</label>
                    <input type="text" placeholder="John Doe" required />
                  </div>

                  <div className="form-group">
                    <label>Your Email Address</label>
                    <input type="email" placeholder="john@example.com" required />
                  </div>

                  <div className="form-group">
                    <label>Pilgrimage Center / Subject</label>
                    <input type="text" placeholder="e.g. Kedarnath Trek Inquiry" required />
                  </div>

                  <div className="form-group">
                    <label>Your Message</label>
                    <textarea placeholder="Type your inquiry or message here..." rows="4" required></textarea>
                  </div>

                  <button type="submit" className="submit-btn">Submit Inquiry →</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="contact-footer">
        <p>© 2026 PilgrimIQ Inc. All rights reserved. Designed for Safe Pilgrimages.</p>
      </footer>
    </div>
  );
}

export default Contact;