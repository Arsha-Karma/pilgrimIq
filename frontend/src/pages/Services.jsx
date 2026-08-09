import "../styles/Services.css";
import Navbar from "../components/Navbar";

function Services() {
  const servicesList = [
    {
      icon: "🩺",
      title: "AI Health Assessment & PSI Score",
      desc: "Calculate your Pilgrim Safety Index (PSI) using automated medical report OCR analysis and vital sign parameters before you travel."
    },
    {
      icon: "📍",
      title: "Smart Journey Planning",
      desc: "Get personalized travel plans and itineraries based on your health conditions, altitude acclimatization, distance, and crowd forecasts."
    },
    {
      icon: "☁️",
      title: "Weather Prediction & Microclimate",
      desc: "Receive accurate 7-day micro-weather forecasts, sudden rainfall alerts, temperature fluctuations, and altitude-specific climate modeling."
    },
    {
      icon: "🛡️",
      title: "Pilgrim Safety Index (PSI)",
      desc: "Calculate a personalized dynamic safety score combining medical fitness, weather forecasts, route difficulty, and real-time crowd metrics."
    },
    {
      icon: "👨‍👩‍👧‍👦",
      title: "Family Tracking",
      desc: "Track the real-time location, health status, and safety alerts of all your registered family members throughout the pilgrimage journey."
    },
    {
      icon: "🚨",
      title: "24/7 Emergency SOS & Rescue",
      desc: "One-tap emergency dispatch connecting you directly to local high-altitude rescue teams, nearby specialized clinics, and family contacts."
    }
  ];

  return (
    <div className="services-page">
      <Navbar />

      <header className="services-hero">
        <div className="services-hero-container">
          <span className="services-badge">INTELLIGENT SERVICES</span>
          <h1>Our Intelligent Services</h1>
          <p>
            Comprehensive health assessment, emergency assistance, weather forecasting, and personalized planning.
          </p>
        </div>
      </header>

      <section className="services-content-section">
        <div className="services-main-container">
          <div className="services-cards-grid">
            {servicesList.map((service, idx) => (
              <div className="service-item-card" key={idx}>
                <div className="service-icon-circle">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.desc}</p>
                <button className="service-btn">Explore Service →</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="services-footer">
        <p>© 2026 PilgrimIQ Inc. All rights reserved. Designed for Safe Pilgrimages.</p>
      </footer>
    </div>
  );
}

export default Services;