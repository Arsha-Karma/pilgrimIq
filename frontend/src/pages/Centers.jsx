import { useState } from "react";
import "../styles/Centers.css";
import Navbar from "../components/Navbar";

function Centers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const centersData = [
    {
      id: 1,
      name: "Vaishno Devi Temple",
      category: "Temple",
      difficulty: "Moderate to High Trek",
      diffType: "warning",
      location: "Katra, Jammu & Kashmir, India",
      description: "A holy cave temple dedicated to Goddess Vaishno Devi located in the Trikuta Mountains. Involves a 13 km uphill trek.",
      climate: "Sub-tropical to Cold Alpine",
      season: "March to October",
      bgGradient: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(11,45,114,0.9) 100%), url('https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=800&auto=format&fit=crop')"
    },
    {
      id: 2,
      name: "Kedarnath Temple",
      category: "Temple",
      difficulty: "High Trek",
      diffType: "danger",
      location: "Rudraprayag, Uttarakhand, India",
      description: "One of the most sacred temples of Lord Shiva situated near the Mandakini river amidst snow-clad Himalayan peaks.",
      climate: "Cold Mountain Climate",
      season: "May to June & Sept to Oct",
      bgGradient: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(11,45,114,0.9) 100%), url('https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=800&auto=format&fit=crop')"
    },
    {
      id: 3,
      name: "Basilica of Our Lady of Good Health",
      category: "Church",
      difficulty: "Easy Trek",
      diffType: "success",
      location: "Velankanni, Tamil Nadu, India",
      description: "A world-famous Marian shrine often known as the 'Lourdes of the East', situated on the shores of the Bay of Bengal.",
      climate: "Tropical Warm & Humid",
      season: "August to March",
      bgGradient: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(11,45,114,0.9) 100%), url('https://images.unsplash.com/photo-1548625149-fc4a29cf7092?q=80&w=800&auto=format&fit=crop')"
    },
    {
      id: 4,
      name: "Al-Masjid an-Nabawi & Holy Shrines",
      category: "Mosque",
      difficulty: "Moderate Trek",
      diffType: "warning",
      location: "Madinah / Makkah, Saudi Arabia",
      description: "Sacred Islamic pilgrimage destination featuring expansive marble plazas, cooled walkways, and high crowd densities.",
      climate: "Hot Desert Climate",
      season: "November to February",
      bgGradient: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(11,45,114,0.9) 100%), url('https://images.unsplash.com/photo-1564769625905-50e93615e769?q=80&w=800&auto=format&fit=crop')"
    },
    {
      id: 5,
      name: "Tawang Monastery",
      category: "Monastery",
      difficulty: "Moderate Trek",
      diffType: "warning",
      location: "Tawang, Arunachal Pradesh, India",
      description: "The largest monastery in India and second largest in the world, nestled in breathtaking High Himalayan terrain.",
      climate: "Alpine Cold",
      season: "April to October",
      bgGradient: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(11,45,114,0.9) 100%), url('https://images.unsplash.com/photo-1609946782740-9a2c14041d8e?q=80&w=800&auto=format&fit=crop')"
    },
    {
      id: 6,
      name: "Sri Harmandir Sahib (Golden Temple)",
      category: "Shrines",
      difficulty: "Easy Trek",
      diffType: "success",
      location: "Amritsar, Punjab, India",
      description: "The central gurdwara for Sikhs around the world, renowned for its open doors, spiritual harmony, and free community kitchen (Langar).",
      climate: "Semi-Arid / Continental",
      season: "October to March",
      bgGradient: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(11,45,114,0.9) 100%), url('https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=800&auto=format&fit=crop')"
    }
  ];

  const categories = [
    { name: "All", count: centersData.length },
    { name: "Temple", count: 2 },
    { name: "Church", count: 1 },
    { name: "Mosque", count: 1 },
    { name: "Monastery", count: 1 },
    { name: "Shrines", count: 1 }
  ];

  const filteredCenters = centersData.filter((center) => {
    const matchesCategory = selectedCategory === "All" || center.category === selectedCategory;
    const matchesSearch = center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          center.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="centers-page">
      <Navbar />

      <header className="centers-hero">
        <div className="centers-hero-container">
          <span className="directory-badge">GLOBAL PILGRIMAGE DIRECTORY</span>
          <h1>Supported Pilgrimage Centers Across All Faiths</h1>
          <p>
            Explore comprehensive environmental difficulty ratings, best travel seasons, elevation challenges, and healthcare availability for world-renowned sacred destinations.
          </p>

          <div className="search-bar-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search center name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <section className="centers-content-section">
        <div className="centers-main-container">
          <div className="filter-tabs-bar">
            {categories.map((cat) => (
              <button
                key={cat.name}
                className={`filter-pill ${selectedCategory === cat.name ? "active-pill" : ""}`}
                onClick={() => setSelectedCategory(cat.name)}
              >
                {cat.name === "All" ? "All" : `${cat.name} (${cat.count})`}
              </button>
            ))}
          </div>

          <div className="centers-cards-grid">
            {filteredCenters.map((center) => (
              <div className="pilgrim-card" key={center.id}>
                <div
                  className="card-header-image"
                  style={{ backgroundImage: center.bgGradient }}
                >
                  <div className="card-top-badges">
                    <span className="badge-cat">{center.category}</span>
                    <span className={`badge-diff diff-${center.diffType}`}>
                      {center.difficulty}
                    </span>
                  </div>

                  <div className="card-image-title">
                    <h3>{center.name}</h3>
                    <p>📍 {center.location}</p>
                  </div>
                </div>

                <div className="card-body">
                  <p className="card-desc">{center.description}</p>

                  <div className="card-meta-row">
                    <span className="meta-item">☀️ {center.climate}</span>
                    <span className="meta-item">📅 {center.season}</span>
                  </div>

                  <button className="view-details-btn">View Details →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="centers-footer">
        <p>© 2026 PilgrimIQ Inc. All rights reserved. Designed for Safe Pilgrimages.</p>
      </footer>
    </div>
  );
}

export default Centers;