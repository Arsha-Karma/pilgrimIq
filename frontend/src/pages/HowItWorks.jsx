import "../styles/HowItWorks.css";
import Navbar from "../components/Navbar";

function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Register Account",
      desc: "Create your secure profile in under 30 seconds for yourself or elderly family members."
    },
    {
      num: "02",
      title: "Create Health Profile",
      desc: "Input vital statistics, age, chronic medical conditions, and mobility levels."
    },
    {
      num: "03",
      title: "Upload Medical Reports",
      desc: "Upload diagnostic lab reports or prescriptions for automated AI OCR scanning."
    },
    {
      num: "04",
      title: "AI Safety Assessment",
      desc: "Our engine computes your Pilgrim Safety Index (PSI) and identifies health risk vectors."
    },
    {
      num: "05",
      title: "Receive Smart Journey Plan",
      desc: "Get custom route recommendations, altitude acclimatization schedules, and hydration alerts."
    },
    {
      num: "06",
      title: "Travel Safely",
      desc: "Embark with live weather monitoring, crowd density updates, and 24/7 SOS dispatch backup."
    }
  ];

  return (
    <div className="works-page">
      <Navbar />

      <header className="works-hero">
        <div className="works-hero-container">
          <span className="works-badge">SEAMLESS PROCESS</span>
          <h1>How PilgrimIQ Works</h1>
          <p>
            Six simple steps from registration to a safe, guided pilgrimage experience.
          </p>
        </div>
      </header>

      <section className="works-content-section">
        <div className="works-main-container">
          <div className="works-cards-grid">
            {steps.map((step, idx) => (
              <div className="works-step-card" key={idx}>
                <div className="works-step-circle">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="works-footer">
        <p>© 2026 PilgrimIQ Inc. All rights reserved. Designed for Safe Pilgrimages.</p>
      </footer>
    </div>
  );
}

export default HowItWorks;