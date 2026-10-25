import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import UserSidebar from "../components/UserSidebar";
import { useAuth } from "../context/AuthContext";
import { apiGetMyJourneys, apiCancelJourney, apiStartJourney } from "../services/journeyService";
import "../styles/MyJourneys.css";
import {
  FiCalendar,
  FiUsers,
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiEye,
  FiAlertCircle,
  FiPlay,
  FiRefreshCw
} from "react-icons/fi";

function MyJourneys() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

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

  const handleStart = async (id, e) => {
    e.stopPropagation();
    try {
      await apiStartJourney(id, token);
      navigate("/journey-assistance");
    } catch (err) {
      console.error("Failed to start journey:", err);
      navigate("/journey-assistance");
    }
  };

  const handleCancel = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to cancel this pilgrimage journey booking? Your dates will be released and you can book again anytime.")) {
      return;
    }
    try {
      const res = await apiCancelJourney(id, token);
      setActionMessage(res.message || "Journey booking cancelled successfully.");
      setTimeout(() => setActionMessage(""), 5000);
      fetchJourneys();
    } catch (err) {
      alert("Failed to cancel journey: " + (err.message || "Server error"));
    }
  };

  const handleReschedule = (centerId, journeyId, e) => {
    e.stopPropagation();
    navigate(`/journey-planner/${centerId}?rescheduleJourneyId=${journeyId}`);
  };

  return (
    <div className="my-journeys-page pilgrim-dashboard-wrapper">
      <Navbar />

      <div className="pilgrim-dashboard-container">
        <UserSidebar activeTab="journey-planner" />

        <div className="pilgrim-main-content" style={{ padding: 0 }}>
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
            {actionMessage && (
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #86efac",
                  color: "#166534",
                  padding: "12px 18px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                ✓ {actionMessage}
              </div>
            )}

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
                  const isExpired = j.status === "EXPIRED" || j.status === "expired";
                  const isCancelled = j.status === "CANCELLED" || j.status === "cancelled";
                  const isCompleted = j.status === "COMPLETED" || j.status === "completed";
                  const isInProgress = j.status === "IN_PROGRESS" || j.status === "active";
                  const isScheduled = j.status === "SCHEDULED" || j.status === "scheduled";
                  const isConfirmed = j.status === "CONFIRMED" || j.status === "confirmed";
                  const isPlanned = !isExpired && !isCancelled && !isCompleted && !isInProgress && !isScheduled && !isConfirmed;

                  let statusBg = "#2563eb";
                  if (isExpired) statusBg = "#d97706";
                  else if (isCancelled) statusBg = "#64748b";
                  else if (isCompleted) statusBg = "#059669";
                  else if (isInProgress) statusBg = "#10b981";
                  else if (isConfirmed) statusBg = "#0d9488";
                  else if (isScheduled) statusBg = "#4f46e5";

                  return (
                    <div
                      key={j._id}
                      className="journey-item-card"
                      onClick={() => navigate(`/journey/${j._id}`)}
                      style={isExpired ? { border: "1px solid #fde68a", background: "#fffbeb" } : {}}
                    >
                      <div className="card-thumb">
                        <img
                          src={
                            center.image ||
                            "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?q=80&w=800&auto=format&fit=crop"
                          }
                          alt={center.name || "Pilgrimage Center"}
                        />
                        <span className="status-pill" style={{ background: statusBg, color: "#ffffff" }}>
                          {j.status ? j.status.toUpperCase() : "PLANNED"}
                        </span>
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

                        {/* Expired Journey Notification (Rule 3) */}
                        {isExpired && (
                          <div
                            style={{
                              background: "#fef3c7",
                              border: "1px solid #f59e0b",
                              borderRadius: "8px",
                              padding: "10px 12px",
                              margin: "12px 0 6px 0",
                              fontSize: "12.5px",
                              color: "#92400e",
                              lineHeight: "1.5",
                            }}
                          >
                            ⚠️ Your planned journey to {center.name || "this centre"} has expired. Please plan a new journey if you still wish to visit this centre.
                          </div>
                        )}

                        <div className="card-footer-actions" style={{ flexWrap: "wrap", gap: "6px" }}>
                          {isExpired ? (
                            <button
                              type="button"
                              style={{
                                background: "#0f172a",
                                color: "#ffffff",
                                border: "none",
                                padding: "7px 14px",
                                borderRadius: "6px",
                                fontSize: "12.5px",
                                fontWeight: "700",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/journey-planner/${center._id}`);
                              }}
                            >
                              <FiPlus /> Plan New Journey
                            </button>
                          ) : (
                            <>
                              {isPlanned && (
                                <button
                                  type="button"
                                  style={{
                                    background: "#2563eb",
                                    color: "#ffffff",
                                    border: "none",
                                    padding: "6px 12px",
                                    borderRadius: "6px",
                                    fontSize: "12.5px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                  onClick={(e) => handleStart(j._id, e)}
                                >
                                  <FiPlay /> Start Journey
                                </button>
                              )}

                              {isPlanned && (
                                <button
                                  type="button"
                                  style={{
                                    background: "#f1f5f9",
                                    color: "#1e293b",
                                    border: "1px solid #cbd5e1",
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                  onClick={(e) => handleReschedule(center._id, j._id, e)}
                                  title="Reschedule Journey"
                                >
                                  <FiRefreshCw /> Reschedule
                                </button>
                              )}
                            </>
                          )}

                          <button
                            type="button"
                            className="btn-view-details"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/journey/${j._id}`);
                            }}
                          >
                            <FiEye /> Details
                          </button>

                          {isPlanned && (
                            <button
                              type="button"
                              className="btn-delete"
                              onClick={(e) => handleCancel(j._id, e)}
                              title="Cancel Booking"
                              style={{ color: "#ef4444" }}
                            >
                              <FiTrash2 />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyJourneys;
