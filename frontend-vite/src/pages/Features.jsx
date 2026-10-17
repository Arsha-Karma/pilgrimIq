import "../styles/Features.css";
import Navbar from "../components/Navbar";

function Features() {
  const capabilities = [
    {
      icon: "📄",
      title: "AI Medical Report Analysis",
      desc: "Extract lab values, blood pressure, and cardiac conditions from scans."
    },
    {
      icon: "⏲️",
      title: "Pilgrim Safety Index",
      desc: "Real-time updated safety score calculated from 20+ environmental & personal parameters."
    },
    {
      icon: "🌤️",
      title: "Weather Prediction",
      desc: "7-day micro-weather forecasting customized for high-altitude pilgrimage routes."
    },
    {
      icon: "👥",
      title: "Crowd Prediction",
      desc: "AI crowd density heatmaps to avoid peak choke points and long waiting queues."
    },
    {
      icon: "🕒",
      title: "Waiting Time Prediction",
      desc: "Live queue monitoring and estimated darshan / entrance wait time calculations."
    },
    {
      icon: "🏨",
      title: "Accommodation Recommendation",
      desc: "Rest-stop and stay recommendations filtered for medical accessibility and comfort."
    },
    {
      icon: "🍴",
      title: "Food Recommendation",
      desc: "Tailored dietary plans matching medical needs, altitude energy demands, and sacred traditions."
    },
    {
      icon: "📍",
      title: "Journey Timeline",
      desc: "Step-by-step interactive travel timeline with checkpoints and rest milestones."
    },
    {
      icon: "💊",
      title: "Medicine Reminder",
      desc: "Time-zone aware pill alerts synced with trek schedules and meals."
    },
    {
      icon: "💧",
      title: "Hydration Reminder",
      desc: "Dynamic hydration intake notifications adjusted for elevation and ambient heat."
    },
    {
      icon: "⚠️",
      title: "Emergency Support",
      desc: "24/7 dedicated dispatch helpline, GPS broadcast, and rescue team coordination."
    },
    {
      icon: "🏥",
      title: "Nearby Hospitals",
      desc: "Instant directions and emergency contact channels for nearest specialized clinics."
    }
  ];

  return (
    <div className="features-page">
      <Navbar />

      <header className="features-hero">
        <div className="features-hero-container">
          <span className="features-badge">COMPREHENSIVE PLATFORM CAPABILITIES</span>
          <h1>
            Next-Gen AI Decision Support <span className="gold-text">Features</span>
          </h1>
          <p>
            Discover all 12 intelligent modules engineered to transform pre-journey preparation, live route monitoring, and emergency response for pilgrims worldwide.
          </p>

          <div className="features-hero-actions">
            <button className="gold-action-btn">✨ Try PSI Score Calculator</button>
            <button className="outline-action-btn">Test Medical Report OCR</button>
          </div>
        </div>
      </header>

      <section className="features-grid-section">
        <div className="features-main-container">
          <div className="capabilities-3col-grid">
            {capabilities.map((item, index) => (
              <div className="capability-card" key={index}>
                <div className="cap-icon-circle">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="features-cta-banner">
            <div className="cta-left-content">
              <h2>Ready to Experience AI Decision Support Live?</h2>
              <p>
                Try our interactive live dashboard simulator to monitor weather, hydration alerts, and crowd forecasts in real-time.
              </p>
            </div>
            <button className="cta-gold-btn">Launch Live Dashboard Demo →</button>
          </div>
        </div>
      </section>

      <footer className="centers-footer">
        <p>© 2026 PilgrimIQ Inc. All rights reserved. Designed for Safe Pilgrimages.</p>
      </footer>
    </div>
  );
}

export default Features;
