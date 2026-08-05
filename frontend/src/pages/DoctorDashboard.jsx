import React, { useState, useEffect } from "react";
import "../styles/DoctorDashboard.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiGetAllUsers } from "../services/api";
import logo from "../assets/pilgrim-logo.png";
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiHome,
  FiLogOut,
  FiMapPin,
  FiSearch,
  FiUsers,
  FiX
} from "react-icons/fi";
import { FaHeartbeat, FaLungs, FaStethoscope } from "react-icons/fa";

function DoctorDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("triage");
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");
  const [dbUsers, setDbUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Selected Pilgrim for Medical Action / Consultation Modal
  const [selectedPilgrim, setSelectedPilgrim] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(""); // "clearance" | "emergency" | "vitals"
  const [consultationNotes, setConsultationNotes] = useState("");
  const [spo2Input, setSpo2Input] = useState(97);
  const [heartRateInput, setHeartRateInput] = useState(78);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const data = await apiGetAllUsers(token);
        if (data && data.users) {
          setDbUsers(data.users);
        }
      } catch (err) {
        console.error("Failed to load registered pilgrims:", err.message);
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const triggerAction = (msg) => {
    setNotificationMsg(msg);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 4000);
  };

  // Filter out doctors and admins, list registered pilgrims with health vitals
  const registeredPilgrimList = dbUsers
    .filter((u) => u.role !== "admin" && u.role !== "physician" && u.email !== "pilgrimlq03@gmail.com")
    .map((u, index) => {
      // Mock deterministic vitals based on user id for realistic health telemetry
      const hash = u._id ? u._id.charCodeAt(u._id.length - 1) : index;
      const calculatedSpo2 = 93 + (hash % 7);
      const calculatedHr = 72 + (hash % 28);
      const calculatedPsi = calculatedSpo2 >= 96 && calculatedHr < 90 ? 94 : calculatedSpo2 >= 94 ? 78 : 58;
      const riskLevel = calculatedPsi >= 85 ? "Low Risk" : calculatedPsi >= 70 ? "Moderate" : "High Risk";

      return {
        id: `REG-${u._id ? u._id.substring(u._id.length - 6).toUpperCase() : `00${index + 1}`}`,
        name: u.name || "Registered Pilgrim",
        email: u.email,
        phone: u.phone || "Not provided",
        spo2: calculatedSpo2,
        heartRate: calculatedHr,
        psiScore: calculatedPsi,
        riskLevel: riskLevel,
        status: calculatedPsi >= 85 ? "Cleared" : calculatedPsi >= 70 ? "Under Review" : "Medical Alert",
        location: index % 2 === 0 ? "Pamba Base Camp" : "Neelimala Altitude Station",
        registeredOn: u.createdAt
          ? new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
          : "Active",
      };
    });

  const filteredPilgrims = registeredPilgrimList.filter((pilgrim) => {
    const matchesSearch =
      pilgrim.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pilgrim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pilgrim.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (riskFilter === "all") return matchesSearch;
    if (riskFilter === "high") return matchesSearch && pilgrim.riskLevel === "High Risk";
    if (riskFilter === "moderate") return matchesSearch && pilgrim.riskLevel === "Moderate";
    if (riskFilter === "cleared") return matchesSearch && pilgrim.status === "Cleared";
    return matchesSearch;
  });

  const handleOpenActionModal = (pilgrim, type) => {
    setSelectedPilgrim(pilgrim);
    setActionType(type);
    setSpo2Input(pilgrim.spo2);
    setHeartRateInput(pilgrim.heartRate);
    setConsultationNotes("");
    setShowActionModal(true);
  };

  const handleExecuteAction = (e) => {
    e.preventDefault();
    if (!selectedPilgrim) return;

    if (actionType === "clearance") {
      triggerAction(`Medical Clearance Granted for ${selectedPilgrim.name} (${selectedPilgrim.id})`);
    } else if (actionType === "emergency") {
      triggerAction(`EMERGENCY ALERT DISPATCHED for ${selectedPilgrim.name}! Mobile ICU notified.`);
    } else {
      triggerAction(`Recorded new vitals for ${selectedPilgrim.name}: SpO2 ${spo2Input}%, HR ${heartRateInput} bpm.`);
    }

    setShowActionModal(false);
  };

  return (
    <div className="doctor-app-layout">
      {/* Sidebar Navigation */}
      <aside className="doctor-sidebar">
        <div className="sidebar-brand">
          <img src={logo} alt="PilgrimIQ Logo" className="sidebar-logo" />
          <div className="brand-text">
            <h3>PilgrimIQ</h3>
            <span className="brand-badge doctor">DOCTOR PORTAL</span>
          </div>
        </div>

        <div className="doctor-profile-card">
          <div className="doctor-avatar">
            <FaStethoscope />
          </div>
          <div className="doctor-info">
            <h4>Dr. {user?.name || "Medical Officer"}</h4>
            <span className="doc-spec">{user?.specialization || "General Physician"}</span>
            <span className="doc-id-tag">ID: {user?.doctorCode || "DOC-8492"}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">SURVEILLANCE & TRIAGE</div>

          <button
            className={`nav-item ${activeTab === "triage" ? "active" : ""}`}
            onClick={() => setActiveTab("triage")}
          >
            <FiActivity className="nav-icon" />
            <span>Pilgrim Health Triage</span>
            <span className="nav-count-pill">{registeredPilgrimList.length}</span>
          </button>

          <button
            className={`nav-item ${activeTab === "alerts" ? "active" : ""}`}
            onClick={() => setActiveTab("alerts")}
          >
            <FiAlertTriangle className="nav-icon" />
            <span>Emergency Alerts</span>
            <span className="nav-tag red">1 Critical</span>
          </button>

          <button
            className={`nav-item ${activeTab === "consultations" ? "active" : ""}`}
            onClick={() => setActiveTab("consultations")}
          >
            <FiFileText className="nav-icon" />
            <span>Medical Prescriptions</span>
          </button>

          <button
            className={`nav-item ${activeTab === "stations" ? "active" : ""}`}
            onClick={() => setActiveTab("stations")}
          >
            <FiMapPin className="nav-icon" />
            <span>Oxygen & Medical Units</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="btn-sidebar-user-view" onClick={() => navigate("/")}>
            <FiHome /> User View
          </button>
          <button className="btn-sidebar-logout" onClick={handleLogout}>
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="doctor-main-wrapper">
        <header className="doctor-top-bar">
          <div className="top-bar-title">
            <h2>
              {activeTab === "triage" && "Pilgrim Health Triage & Telemetry"}
              {activeTab === "alerts" && "Emergency Medical Alert Command"}
              {activeTab === "consultations" && "Physician Consultations & Prescriptions"}
              {activeTab === "stations" && "Base Camp Oxygen & Trauma Units"}
            </h2>
            <span className="top-bar-subtitle">Pamba Base Camp • Field Medical Unit #04</span>
          </div>

          <div className="top-bar-right">
            <div className="duty-status-badge">
              <span className="dot-green"></span> On Duty • Active Doctor Session
            </div>
          </div>
        </header>

        <main className="doctor-container">
          {showNotification && (
            <div className="toast-notification success">
              <FiCheckCircle size={18} /> {notificationMsg}
            </div>
          )}

          {/* Physician Welcome Banner */}
          <div className="doctor-hero-banner">
            <div>
              <h1>Welcome, Dr. {user?.name || "Physician"} 🩺</h1>
              <p>Real-time Cardiac & High-Altitude Oxygen Surveillance for Registered Pilgrims</p>
            </div>
            <div className="hero-quick-buttons">
              <button className="btn-doctor-emergency" onClick={() => triggerAction("Broadcast Emergency Medical Alert dispatched to all base camps!")}>
                <FiAlertTriangle /> Dispatch Emergency Alert
              </button>
            </div>
          </div>

          {/* KPI Medical Metrics Grid */}
          <div className="kpi-grid">
            <div className="kpi-card blue">
              <div className="kpi-header">
                <span>TOTAL REGISTERED PILGRIMS</span>
                <FiUsers className="kpi-icon" />
              </div>
              <div className="kpi-value">{registeredPilgrimList.length}</div>
              <div className="kpi-trend positive">
                <FiActivity /> Live Telemetry Monitored
              </div>
            </div>

            <div className="kpi-card green">
              <div className="kpi-header">
                <span>CLEARANCES GRANTED TODAY</span>
                <FiCheckCircle className="kpi-icon" />
              </div>
              <div className="kpi-value">14 Pilgrims</div>
              <div className="kpi-trend positive">
                <FiCheckCircle /> Fit for High Altitude Trek
              </div>
            </div>

            <div className="kpi-card red">
              <div className="kpi-header">
                <span>CRITICAL / HIGH RISK</span>
                <FiAlertTriangle className="kpi-icon" />
              </div>
              <div className="kpi-value">1 Patient</div>
              <div className="kpi-trend negative">
                <FaLungs /> SpO2 Monitoring Required
              </div>
            </div>

            <div className="kpi-card purple">
              <div className="kpi-header">
                <span>OXYGEN STATION CAPACITY</span>
                <FaHeartbeat className="kpi-icon" />
              </div>
              <div className="kpi-value">84% Available</div>
              <div className="kpi-trend neutral">
                <FiClock /> Pamba Central Unit
              </div>
            </div>
          </div>

          {/* Content Views */}
          <div className="doctor-content-grid">
            <div className="admin-panel main-panel">
              <div className="panel-header">
                <div>
                  <h3>Registered Pilgrim Health Directory & Telemetry</h3>
                  <p>Real-time vital signs monitoring, risk index scoring & physician triage</p>
                </div>

                <div className="table-controls">
                  <div className="search-box">
                    <FiSearch className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search pilgrim by name, ID or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <select
                    className="filter-dropdown"
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                  >
                    <option value="all">All Risk Levels</option>
                    <option value="high">High Risk Only</option>
                    <option value="moderate">Moderate Risk</option>
                    <option value="cleared">Cleared</option>
                  </select>
                </div>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>PILGRIM ID</th>
                      <th>NAME & CONTACT</th>
                      <th>SPO2 & HEART RATE</th>
                      <th>PSI SCORE</th>
                      <th>RISK INDEX</th>
                      <th>MEDICAL ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPilgrims.length > 0 ? (
                      filteredPilgrims.map((pilgrim) => (
                        <tr key={pilgrim.id}>
                          <td className="font-mono" style={{ color: "#60a5fa", fontWeight: "bold" }}>
                            {pilgrim.id}
                          </td>
                          <td>
                            <div className="user-name" style={{ fontSize: "14px", fontWeight: "700" }}>
                              {pilgrim.name}
                            </div>
                            <div className="user-contact">{pilgrim.email}</div>
                            {pilgrim.phone && pilgrim.phone !== "Not provided" && (
                              <div className="user-contact" style={{ color: "#94a3b8" }}>
                                📞 {pilgrim.phone}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                              <span style={{ color: pilgrim.spo2 < 95 ? "#f87171" : "#34d399", fontWeight: "700", fontSize: "13px" }}>
                                🫁 SpO2: {pilgrim.spo2}%
                              </span>
                              <span style={{ color: pilgrim.heartRate > 90 ? "#fbbf24" : "#cbd5e1", fontSize: "13px" }}>
                                ❤️ {pilgrim.heartRate} bpm
                              </span>
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                background: pilgrim.psiScore >= 85 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                                color: pilgrim.psiScore >= 85 ? "#34d399" : "#f87171",
                                padding: "4px 10px",
                                borderRadius: "8px",
                                fontWeight: "800",
                                fontSize: "13px",
                              }}
                            >
                              {pilgrim.psiScore} / 100
                            </span>
                          </td>
                          <td>
                            <span
                              className={`status-pill ${
                                pilgrim.riskLevel === "High Risk"
                                  ? "danger"
                                  : pilgrim.riskLevel === "Moderate"
                                  ? "warning"
                                  : "success"
                              }`}
                            >
                              {pilgrim.riskLevel}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                className="btn-table-action"
                                style={{ background: "#2563eb", color: "#fff", border: "none" }}
                                onClick={() => handleOpenActionModal(pilgrim, "clearance")}
                              >
                                Issue Clearance
                              </button>
                              <button
                                className="btn-table-action"
                                style={{ background: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "1px solid #ef4444" }}
                                onClick={() => handleOpenActionModal(pilgrim, "emergency")}
                              >
                                Emergency
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center" style={{ padding: "40px" }}>
                          {loadingUsers ? "Loading registered pilgrims from database..." : "No registered pilgrims match the selected filter."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Doctor Action Modal */}
      {showActionModal && selectedPilgrim && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>
                <FaStethoscope style={{ color: "#3b82f6" }} /> Physician Action: {selectedPilgrim.name} ({selectedPilgrim.id})
              </h3>
              <button className="btn-close-modal" onClick={() => setShowActionModal(false)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleExecuteAction}>
              <div className="modal-body">
                <div style={{ background: "#0f172a", padding: "14px", borderRadius: "10px", marginBottom: "16px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "14px", color: "#f8fafc", fontWeight: "700" }}>{selectedPilgrim.name}</div>
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>{selectedPilgrim.email} • {selectedPilgrim.location}</div>
                  <div style={{ marginTop: "8px", display: "flex", gap: "15px", fontSize: "13px" }}>
                    <span>🫁 SpO2: <strong>{selectedPilgrim.spo2}%</strong></span>
                    <span>❤️ Heart Rate: <strong>{selectedPilgrim.heartRate} bpm</strong></span>
                    <span>PSI Score: <strong>{selectedPilgrim.psiScore}</strong></span>
                  </div>
                </div>

                {actionType === "clearance" && (
                  <div>
                    <h4 style={{ color: "#34d399", marginBottom: "8px" }}>Issue Official Medical Clearance</h4>
                    <p style={{ fontSize: "13px", color: "#cbd5e1" }}>
                      Confirming Dr. {user?.name || "Physician"} has evaluated {selectedPilgrim.name} and approved them fit for pilgrimage ascension.
                    </p>
                  </div>
                )}

                {actionType === "emergency" && (
                  <div>
                    <h4 style={{ color: "#f87171", marginBottom: "8px" }}>Dispatch Cardiac / High Altitude Emergency Team</h4>
                    <p style={{ fontSize: "13px", color: "#fca5a5" }}>
                      This will alert the nearest Oxygen Station and dispatch Mobile Emergency Responders to {selectedPilgrim.location}.
                    </p>
                  </div>
                )}

                <div className="form-group" style={{ marginTop: "16px" }}>
                  <label>Physician Clinical Notes & Prescription</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Enter diagnostic notes, oxygen requirements, or prescribed medications..."
                    value={consultationNotes}
                    onChange={(e) => setConsultationNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowActionModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit-doctor"
                  style={{ background: actionType === "emergency" ? "#dc2626" : "#2563eb" }}
                >
                  {actionType === "clearance" ? "Confirm & Issue Clearance" : actionType === "emergency" ? "Dispatch Emergency Alert" : "Save Vitals"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorDashboard;
