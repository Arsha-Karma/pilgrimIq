import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { apiGetMyJourneys, apiDeleteJourney } from "../services/journeyService";
import "../styles/MyJourneys.css";
import {
  FiCalendar,
  FiUsers,
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiEye,
  FiAlertCircle
} from "react-icons/fi";

function MyJourneys() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchJourneys = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGetMyJourneys(token);
      if (data && Array.isArray(data.journeys)) {
        setJourneys(data.journeys);
      }
    } catch (err) {
      console.error("Failed to load user journeys:", err);
      setError(err.message || "Failed to load your planned journeys.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchJourneys();
    }
  }, [token, fetchJourneys]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to cancel and delete this journey plan?")) {
      return;
    }
    try {
      await apiDeleteJourney(id, token);
      fetchJourneys();
    } catch (err) {
      alert("Failed to delete journey: " + (err.message || "Server error"));
    }
  };

  return (
    <div className="my-journeys-page">
      <Navbar />

      <div className="my-journeys-header">
        <div className="header-container">
          <div>
            <h1>My Planned Pilgrimage Journeys</h1>
            <p>Manage your saved trip itineraries, registered pilgrims, and nearby support preferences.</p>
          </div>

          <Link to="/centers" className="btn-plan-new">
            <FiPlus /> Plan New Journey
          </Link>
        </div>
      </div>

      <div className="my-journeys-container">
        {loading ? (
          <div className="loading-card" style={{ padding: "40px", textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto" }}></div>
          </div>
        ) : error ? (
          <div className="error-card">
            <FiAlertCircle size={40} className="err-icon" />
            <h3>Unable to load journeys</h3>
            <p>{error}</p>
          </div>
        ) : journeys.length === 0 ? (
          <div className="empty-journeys-card">
            <div className="empty-icon">🏛️</div>
            <h3 style={{ color: "#0f172a", fontSize: "22px", fontWeight: "800", margin: "10px 0 6px 0" }}>
              No Pilgrimage Journeys Planned Yet
            </h3>
            <p style={{ color: "#475569", fontSize: "15px", margin: 0 }}>
              Select a pilgrimage center from our directory and start planning your blessed trip.
            </p>
            <Link
              to="/centers"
              style={{
                marginTop: "20px",
                display: "inline-block",
                padding: "12px 28px",
                borderRadius: "10px",
                background: "#0f172a",
                color: "#ffffff",
                fontWeight: "800",
                fontSize: "15px",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(15, 23, 42, 0.25)",
              }}
            >
              Browse Pilgrimage Centers →
            </Link>
          </div>
        ) : (
          <div className="journeys-grid">
            {journeys.map((j) => {
              const center = j.pilgrimageCenterId || {};
              return (
                <div
                  key={j._id}
                  className="journey-item-card"
                  onClick={() => navigate(`/journey/${j._id}`)}
                >
                  <div className="card-thumb">
                    <img
                      src={
                        center.image ||
                        "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?q=80&w=800&auto=format&fit=crop"
                      }
                      alt={center.name || "Pilgrimage Center"}
                    />
                    <span className="status-pill">{j.status ? j.status.toUpperCase() : "PLANNED"}</span>
                  </div>

                  <div className="card-info-body">
                    <h3>{center.name || "Pilgrimage Center"}</h3>
                    <p className="loc">
                      <FiMapPin /> {center.location?.city}, {center.location?.state}
                    </p>

                    <div className="meta-row">
                      <span>
                        <FiCalendar /> {new Date(j.journeyDate).toLocaleDateString()}
                      </span>
                      <span>
                        <FiUsers /> {j.totalPilgrims} Pilgrim(s)
                      </span>
                    </div>

                    <div className="card-footer-actions">
                      <button
                        type="button"
                        className="btn-view-details"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/journey/${j._id}`);
                        }}
                      >
                        <FiEye /> View Details
                      </button>

                      <button
                        type="button"
                        className="btn-delete"
                        onClick={(e) => handleDelete(j._id, e)}
                        title="Cancel Journey"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyJourneys;
