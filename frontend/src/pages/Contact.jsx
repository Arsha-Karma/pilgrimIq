import { useState, useEffect } from "react";
import "../styles/Contact.css";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { apiSubmitEnquiry } from "../services/api";

function Contact() {
  const { user, token } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [subjectTouch, setSubjectTouch] = useState(false);
  const [messageTouch, setMessageTouch] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const countLetters = (str) => {
    return (str.match(/[a-zA-Z]/g) || []).length;
  };

  const subjectLetterCount = countLetters(subject);
  const messageLetterCount = countLetters(message);

  const subjectIsValid = subjectLetterCount >= 10;
  const messageIsValid = messageLetterCount >= 10;

  const handleSubjectChange = (e) => {
    // Only letters and spaces allowed (backspace supported)
    const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
    setSubject(val);
    setSubjectTouch(true);
  };

  const handleMessageChange = (e) => {
    // Only letters and spaces allowed (backspace supported)
    const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
    setMessage(val);
    setMessageTouch(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    setSubjectTouch(true);
    setMessageTouch(true);

    if (!subjectIsValid) {
      setErrorMessage("Pilgrimage Center / Subject must contain at least 10 letters.");
      return;
    }

    if (!messageIsValid) {
      setErrorMessage("Your Message must contain at least 10 letters.");
      return;
    }

    try {
      setSubmitting(true);
      await apiSubmitEnquiry(
        {
          name: name || user?.name || "Pilgrim User",
          email: email || user?.email || "user@example.com",
          subject,
          message,
        },
        token
      );

      setSubmitted(true);
      setSubject("");
      setMessage("");
      setSubjectTouch(false);
      setMessageTouch(false);
    } catch (err) {
      setErrorMessage(err.message || "Failed to submit inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
                <div className="form-success-alert" style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981", color: "#065f46", padding: "20px", borderRadius: "12px" }}>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>✅ Inquiry Sent Successfully!</h4>
                  <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.5" }}>
                    Thank you, <strong>{name || "Pilgrim"}</strong>. Your inquiry has been dispatched to our admin team and sent via email notification. We will respond to <strong>{email}</strong> shortly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    style={{ marginTop: "16px", background: "#2563eb", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="actual-form">
                  {errorMessage && (
                    <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", color: "#b91c1c", padding: "12px 16px", borderRadius: "10px", fontSize: "13.5px", fontWeight: "600" }}>
                      ⚠️ {errorMessage}
                    </div>
                  )}

                  <div className="form-group">
                    <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>YOUR FULL NAME</span>
                      <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: "bold" }}>🔒 Auto-fetched from Profile</span>
                    </label>
                    <input
                      type="text"
                      className="readonly-input"
                      value={name || user?.name || "Logged in User"}
                      readOnly
                      title="Name is auto-fetched from your registered profile and cannot be edited."
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>YOUR EMAIL ADDRESS</span>
                      <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: "bold" }}>🔒 Auto-fetched from Profile</span>
                    </label>
                    <input
                      type="email"
                      className="readonly-input"
                      value={email || user?.email || "user@example.com"}
                      readOnly
                      title="Email is auto-fetched from your registered profile and cannot be edited."
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>PILGRIMAGE CENTER / SUBJECT *</span>
                      <span style={{ fontSize: "12px", color: subjectIsValid ? "#059669" : (subjectTouch ? "#dc2626" : "#64748b"), fontWeight: "bold" }}>
                        {subjectLetterCount}/10 letters min
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kedarnath Trek Inquiry"
                      value={subject}
                      onFocus={() => setSubjectTouch(true)}
                      onChange={handleSubjectChange}
                      required
                      style={{
                        borderColor: subjectTouch && !subjectIsValid ? "#ef4444" : undefined
                      }}
                    />

                    {subjectTouch && !subjectIsValid && (
                      <span style={{ color: "#ef4444", fontSize: "12px", fontWeight: "600" }}>
                        ⚠️ Subject must contain at least 10 letters (only letters allowed).
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>YOUR MESSAGE *</span>
                      <span style={{ fontSize: "12px", color: messageIsValid ? "#059669" : (subjectTouch || messageTouch ? "#dc2626" : "#64748b"), fontWeight: "bold" }}>
                        {messageLetterCount}/10 letters min
                      </span>
                    </label>
                    <textarea
                      placeholder="Type your inquiry or message here..."
                      rows="4"
                      value={message}
                      onFocus={() => setMessageTouch(true)}
                      onChange={handleMessageChange}
                      required
                      style={{
                        borderColor: messageTouch && !messageIsValid ? "#ef4444" : undefined
                      }}
                    ></textarea>

                    {messageTouch && !messageIsValid && (
                      <span style={{ color: "#ef4444", fontSize: "12px", fontWeight: "600" }}>
                        ⚠️ Message must contain at least 10 letters (only letters allowed).
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={submitting}
                    style={{
                      opacity: submitting ? 0.7 : 1,
                      cursor: submitting ? "not-allowed" : "pointer"
                    }}
                  >
                    {submitting ? "Sending Inquiry & Email Notification..." : "Submit Inquiry →"}
                  </button>
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