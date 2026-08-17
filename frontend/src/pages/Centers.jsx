import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import "../styles/Centers.css";
import Navbar from "../components/Navbar";
import { apiGetPilgrimageCenters } from "../services/api";

function Centers() {
  const navigate = useNavigate();
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReligion, setSelectedReligion] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedCrowd, setSelectedCrowd] = useState("All");
  const [selectedClimate, setSelectedClimate] = useState("All");

  const religions = ["All", "Hindu", "Christian", "Muslim", "Buddhist", "Jain", "Sikh", "Other"];
  const difficulties = ["All", "Low", "Moderate", "High", "Very High"];
  const crowdLevels = ["All", "Low", "Moderate", "High", "Very High"];
  const climates = ["All", "Hot", "Warm", "Cool", "Cold", "Humid", "Moderate"];

  // Fetch centers from backend API
  const fetchCenters = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const queryParams = {
        search: searchTerm,
        religion: selectedReligion !== "All" ? selectedReligion : "",
        walking: selectedDifficulty !== "All" ? selectedDifficulty : "",
        crowdLevel: selectedCrowd !== "All" ? selectedCrowd : "",
        climate: selectedClimate !== "All" ? selectedClimate : "",
      };

      const data = await apiGetPilgrimageCenters(queryParams);
      setCenters(data || []);
    } catch (err) {
      console.error("Failed to load centers:", err);
      setError("Unable to load pilgrimage centers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedReligion, selectedDifficulty, selectedCrowd, selectedClimate]);

  useEffect(() => {
    fetchCenters();
  }, [fetchCenters]);

  const getDifficultyBadgeClass = (diff) => {
    const d = (diff || "").toLowerCase();
    if (d === "low") return "diff-success";
    if (d === "high" || d === "very high") return "diff-danger";
    return "diff-warning";
  };

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
            <FiSearch className="centers-search-icon" />
            <input
              type="text"
              placeholder="Search center by name, city, state, or religion..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <section className="centers-content-section">
        <div className="centers-main-container">
          {/* RELIGION FILTER TABS */}
          <div className="filter-tabs-bar">
            {religions.map((rel) => (
              <button
                key={rel}
                className={`filter-pill ${selectedReligion === rel ? "active-pill" : ""}`}
                onClick={() => setSelectedReligion(rel)}
              >
                {rel}
              </button>
            ))}
          </div>

          {/* SECONDARY FILTER CONTROLS */}
          <div className="secondary-filters-row" style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap", background: "#ffffff", padding: "14px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div className="filter-select-group" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Walking Difficulty:</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              >
                {difficulties.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="filter-select-group" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Crowd Level:</label>
              <select
                value={selectedCrowd}
                onChange={(e) => setSelectedCrowd(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              >
                {crowdLevels.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="filter-select-group" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Climate:</label>
              <select
                value={selectedClimate}
                onChange={(e) => setSelectedClimate(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              >
                {climates.map((cl) => (
                  <option key={cl} value={cl}>{cl}</option>
                ))}
              </select>
            </div>
          </div>

          {/* CONTENT AREA */}
          {loading ? (
            <div className="loading-state-container" style={{ textAlign: "center", padding: "60px 20px" }}>
              <div className="spinner" style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#2563eb", borderRadius: "50%", margin: "0 auto 16px auto", animation: "spin 0.8s linear infinite" }}></div>
              <p style={{ color: "#64748b" }}>Loading pilgrimage centers...</p>
            </div>
          ) : error ? (
            <div className="error-state-container" style={{ textAlign: "center", padding: "60px 20px", background: "#ffffff", borderRadius: "16px", border: "1px solid #fee2e2" }}>
              <h3 style={{ color: "#dc2626" }}>⚠️ API Connection Error</h3>
              <p style={{ color: "#475569" }}>{error}</p>
              <button onClick={fetchCenters} className="view-details-btn" style={{ margin: "16px auto 0 auto", display: "inline-block" }}>
                Retry Fetching
              </button>
            </div>
          ) : centers.length === 0 ? (
            <div className="empty-centers-box" style={{ textAlign: "center", padding: "60px 20px", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>⛩️</div>
              <h3 style={{ color: "#0f172a", fontSize: "20px", margin: "0 0 8px 0" }}>No pilgrimage centers are currently available.</h3>
              <p style={{ color: "#64748b", margin: 0 }}>
                {searchTerm || selectedReligion !== "All" || selectedDifficulty !== "All"
                  ? "Try clearing your search terms or filters."
                  : "Check back later as new destinations are added by administrators."}
              </p>
            </div>
          ) : (
            <div className="centers-cards-grid">
              {centers.map((center) => {
                const imgUrl = center.image || "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?q=80&w=800&auto=format&fit=crop";
                const bgStyle = {
                  backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(11,45,114,0.9) 100%), url('${imgUrl}')`,
                };

                return (
                  <div className="pilgrim-card" key={center._id}>
                    <div className="card-header-image" style={bgStyle}>
                      <div className="card-top-badges">
                        <span className="badge-cat">{center.religion}</span>
                        <span className={`badge-diff ${getDifficultyBadgeClass(center.difficulty?.walking)}`}>
                          {center.difficulty?.walking ? `${center.difficulty.walking} Trek` : "Moderate Trek"}
                        </span>
                      </div>

                      <div className="card-image-title">
                        <h3>{center.name}</h3>
                        <p>📍 {center.location?.city}, {center.location?.state}, {center.location?.country}</p>
                      </div>
                    </div>

                    <div className="card-body">
                      <p className="card-desc">
                        {center.description && center.description.length > 120
                          ? `${center.description.substring(0, 120)}...`
                          : center.description}
                      </p>

                      <div className="card-meta-row">
                        <span className="meta-item">☀️ {center.visitingInformation?.climate || "Moderate"}</span>
                        <span className="meta-item">📅 {center.visitingInformation?.bestSeason || "All Year"}</span>
                      </div>

                      <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                        <button
                          className="view-details-btn"
                          onClick={() => navigate(`/pilgrimage-centers/${center._id}`)}
                          style={{ flex: 1 }}
                        >
                          View Details →
                        </button>
                        <button
                          className="view-details-btn"
                          onClick={() => navigate(`/journey-planner/${center._id}`)}
                          style={{ flex: 1, background: "#10b981", borderColor: "#10b981" }}
                        >
                          Plan Journey
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <footer className="centers-footer">
        <p>© 2026 PilgrimIQ Inc. All rights reserved. Designed for Safe Pilgrimages.</p>
      </footer>
    </div>
  );
}

export default Centers;