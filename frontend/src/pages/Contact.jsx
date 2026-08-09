import { useState } from "react";
import "../styles/Contact.css";
import Navbar from "../components/Navbar";

function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="contact-page">
      <Navbar />

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
                    <p>pilgrimlq03@gmail.com</p>
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