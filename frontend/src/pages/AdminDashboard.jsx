import React, { useState, useEffect } from "react";
import "../styles/AdminDashboard.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiGetAllUsers } from "../services/api";
import logo from "../assets/pilgrim-logo.png";
import {
  FiGrid,
  FiUsers,
  FiActivity,
  FiShield,
  FiAlertTriangle,
  FiLogOut,
  FiTrendingUp,
  FiMapPin,
  FiSearch,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiSettings,
  FiUserCheck,
  FiHome,
  FiBell
} from "react-icons/fi";

function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");
  const [dbUsers, setDbUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Fetch real registered users from MongoDB Atlas backend
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const data = await apiGetAllUsers(token);
        if (data && data.users) {
          setDbUsers(data.users);
        }
      } catch (err) {
        console.error("Failed to load registered users:", err.message);
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

  const triggerAction = (actionName) => {
    setNotificationMsg(`Admin Action: ${actionName}`);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 4000);
  };

  // Filter out admin users so only regular registered users are listed & counted
  const registeredUserAccounts = dbUsers.filter(
    (u) => u.role !== "admin" && u.email !== "pilgrimlq03@gmail.com"
  );

  // Convert real registered users into pilgrim table format
  const pilgrimsList = registeredUserAccounts.map((u, index) => ({
    id: `REG-${u._id ? u._id.substring(u._id.length - 6).toUpperCase() : `00${index + 1}`}`,
    name: u.name || "Registered Pilgrim",
    email: u.email,
    phone: u.phone || "Not provided",
    riskScore: "Low (14%)",
    status: "Cleared",
    location: "Pamba Base Camp",
    lastCheckin: u.createdAt
      ? new Date(u.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Just registered",
  }));

  const filteredPilgrims = pilgrimsList.filter((pilgrim) => {
    const matchesSearch =
      pilgrim.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pilgrim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pilgrim.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "cleared") return matchesSearch && pilgrim.status === "Cleared";
    if (statusFilter === "alert") return matchesSearch && pilgrim.status === "Medical Alert";
    if (statusFilter === "review") return matchesSearch && pilgrim.status === "Under Review";
    return matchesSearch;
  });

  return (
    <div className="admin-app-layout">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <img src={logo} alt="PilgrimIQ Logo" className="sidebar-logo" />
          <div className="brand-text">
            <h3>PilgrimIQ</h3>
            <span className="brand-badge">ADMIN CONTROL</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">MAIN NAVIGATION</div>
          
          <button
            className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <FiGrid className="nav-icon" />
            <span>Dashboard Overview</span>
          </button>

          <button
            className={`nav-item ${activeTab === "pilgrims" ? "active" : ""}`}
            onClick={() => setActiveTab("pilgrims")}
          >
            <FiUsers className="nav-icon" />
            <span>Registered Pilgrims</span>
            <span className="nav-count-pill">{registeredUserAccounts.length}</span>
          </button>

          <button
            className={`nav-item ${activeTab === "camps" ? "active" : ""}`}
            onClick={() => setActiveTab("camps")}
          >
            <FiMapPin className="nav-icon" />
            <span>Base Camp Operations</span>
            <span className="nav-tag green">48 Camps</span>
          </button>

          <button
            className={`nav-item ${activeTab === "alerts" ? "active" : ""}`}
            onClick={() => setActiveTab("alerts")}
          >
            <FiAlertTriangle className="nav-icon" />
            <span>Emergency Health Alerts</span>
            <span className="nav-tag neutral">Live Monitor</span>
          </button>

          <div className="nav-section-label" style={{ marginTop: "20px" }}>MANAGEMENT</div>

          <button
            className={`nav-item ${activeTab === "doctors" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("doctors");
              triggerAction("Navigated to Physicians & Medics Management");
            }}
          >
            <FiUserCheck className="nav-icon" />
            <span>Physicians & Medics</span>
          </button>

          <button
            className={`nav-item ${activeTab === "reports" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("reports");
              triggerAction("Generated AI Health Audit Log");
            }}
          >
            <FiFileText className="nav-icon" />
            <span>AI Health Reports</span>
          </button>

          <button
            className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("settings");
              triggerAction("Opened Admin Settings");
            }}
          >
            <FiSettings className="nav-icon" />
            <span>System Settings</span>
          </button>
        </nav>

        {/* Sidebar Footer User Info & Actions */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name || "System Admin"}</span>
              <span className="sidebar-user-email">{user?.email || "pilgrimlq03@gmail.com"}</span>
            </div>
          </div>

          <div className="sidebar-actions-row">
            <button
              className="btn-sidebar-user-view"
              onClick={() => navigate("/")}
              title="Go to User View"
            >
              <FiHome /> User View
            </button>
            <button className="btn-sidebar-logout" onClick={handleLogout} title="Logout">
              <FiLogOut /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Right Content Area */}
      <div className="admin-main-wrapper">
        {/* Top Minimal Bar */}
        <header className="admin-top-bar">
          <div className="top-bar-title">
            <h2>
              {activeTab === "overview" && "Dashboard Overview"}
              {activeTab === "pilgrims" && "Registered Pilgrims Directory"}
              {activeTab === "camps" && "Base Camp Operations Center"}
              {activeTab === "alerts" && "Emergency Health Monitoring"}
              {activeTab === "doctors" && "Physicians & Medical Staff"}
              {activeTab === "reports" && "AI Health Audit & Reports"}
              {activeTab === "settings" && "System Configuration & Settings"}
            </h2>
            <span className="top-bar-subtitle">PilgrimIQ Command Center • Live Monitoring</span>
          </div>

          <div className="top-bar-right">
            <button className="btn-icon-notify" onClick={() => triggerAction("System Notifications Cleared")}>
              <FiBell size={18} />
              <span className="notify-dot"></span>
            </button>
            <div className="admin-chip">
              <span className="chip-status"></span> Active Session
            </div>
          </div>
        </header>

        <main className="admin-container">
          {showNotification && (
            <div className="toast-notification">
              <FiCheckCircle size={18} /> {notificationMsg}
            </div>
          )}

          {/* Hero Banner */}
          <div className="admin-hero">
            <div>
              <h1>Welcome back, {user?.name || "Administrator"} 👋</h1>
              <p>Real-time Pilgrimage Health Surveillance, Safety Monitoring & Medical Control</p>
            </div>
            <div className="admin-quick-actions-bar">
              <button className="btn-alert" onClick={() => triggerAction("Broadcast Emergency Alert")}>
                <FiAlertTriangle /> Broadcast Alert
              </button>
              <button className="btn-primary" onClick={() => triggerAction("Generate Daily Operations Report")}>
                <FiFileText /> Daily Report
              </button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="kpi-grid">
            <div className="kpi-card blue">
              <div className="kpi-header">
                <span>TOTAL REGISTERED PILGRIMS</span>
                <FiUsers className="kpi-icon" />
              </div>
              <div className="kpi-value">{registeredUserAccounts.length}</div>
              <div className="kpi-trend positive">
                <FiTrendingUp /> {registeredUserAccounts.length} Registered User Account{registeredUserAccounts.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="kpi-card green">
              <div className="kpi-header">
                <span>MEDICAL BASE CAMPS</span>
                <FiMapPin className="kpi-icon" />
              </div>
              <div className="kpi-value">48 Camps</div>
              <div className="kpi-trend positive">
                <FiCheckCircle /> 100% Operational
              </div>
            </div>

            <div className="kpi-card red">
              <div className="kpi-header">
                <span>ACTIVE HEALTH ALERTS</span>
                <FiAlertTriangle className="kpi-icon" />
              </div>
              <div className="kpi-value">0 Patients</div>
              <div className="kpi-trend positive">
                <FiActivity /> All registered pilgrims monitored
              </div>
            </div>

            <div className="kpi-card purple">
              <div className="kpi-header">
                <span>EMERGENCY DISPATCH UNITS</span>
                <FiShield className="kpi-icon" />
              </div>
              <div className="kpi-value">64 Units</div>
              <div className="kpi-trend neutral">
                <FiClock /> Avg Response: 4.2 mins
              </div>
            </div>
          </div>

          {/* Content Panels Grid */}
          <div className="admin-content-grid">
            {/* Registered Pilgrims Register Table */}
            <div className="admin-panel main-panel">
              <div className="panel-header">
                <div>
                  <h3>Pilgrim Health & Risk Register</h3>
                  <p>
                    Live status of registered pilgrims ({registeredUserAccounts.length} registered user{registeredUserAccounts.length === 1 ? "" : "s"})
                  </p>
                </div>

                <div className="table-controls">
                  <div className="search-box">
                    <FiSearch className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search by ID, name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <select
                    className="filter-dropdown"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="cleared">Cleared</option>
                    <option value="review">Under Review</option>
                    <option value="alert">Medical Alert</option>
                  </select>
                </div>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>PILGRIM ID</th>
                      <th>NAME & CONTACT</th>
                      <th>LOCATION</th>
                      <th>RISK INDEX</th>
                      <th>STATUS</th>
                      <th>REGISTERED / CHECK-IN</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPilgrims.length > 0 ? (
                      filteredPilgrims.map((pilgrim) => (
                        <tr key={pilgrim.id}>
                          <td className="font-mono">{pilgrim.id}</td>
                          <td>
                            <div className="user-name">
                              {pilgrim.name}{" "}
                              <span style={{ fontSize: "10px", background: "#2563eb", color: "#fff", padding: "1px 5px", borderRadius: "4px", marginLeft: "4px" }}>
                                Registered User
                              </span>
                            </div>
                            <div className="user-contact">{pilgrim.email}</div>
                            {pilgrim.phone && pilgrim.phone !== "Not provided" && (
                              <div className="user-contact" style={{ color: "#94a3b8" }}>{pilgrim.phone}</div>
                            )}
                          </td>
                          <td>{pilgrim.location}</td>
                          <td>
                            <span className="risk-badge low">
                              {pilgrim.riskScore}
                            </span>
                          </td>
                          <td>
                            <span className="status-pill success">
                              {pilgrim.status}
                            </span>
                          </td>
                          <td className="text-muted">{pilgrim.lastCheckin}</td>
                          <td>
                            <button
                              className="btn-table-action"
                              onClick={() => triggerAction(`Inspected Pilgrim ${pilgrim.id} (${pilgrim.email})`)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          {loadingUsers ? "Loading registered users from database..." : "No registered user accounts found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Side Panels: Base Camp Operations & Admin Quick Tools */}
            <div className="admin-sidebar-panels">
              {/* Medical Stations Summary */}
              <div className="admin-panel">
                <div className="panel-header-simple">
                  <FiMapPin /> <h4>Base Camp Operations</h4>
                </div>
                <ul className="station-list">
                  <li>
                    <div className="station-info">
                      <span className="station-name">Pamba Central Medical Unit</span>
                      <span className="station-meta">Capacity: 84% • 12 Doctors</span>
                    </div>
                    <span className="badge-online">Active</span>
                  </li>
                  <li>
                    <div className="station-info">
                      <span className="station-name">Neelimala Oxygen Station</span>
                      <span className="station-meta">Capacity: 62% • 6 Medics</span>
                    </div>
                    <span className="badge-online">Active</span>
                  </li>
                  <li>
                    <div className="station-info">
                      <span className="station-name">Appachimedu Cardiac Response</span>
                      <span className="station-meta">Capacity: 91% • High Priority</span>
                    </div>
                    <span className="badge-busy">Busy</span>
                  </li>
                  <li>
                    <div className="station-info">
                      <span className="station-name">Sannidhanam Multi-Specialty</span>
                      <span className="station-meta">Capacity: 45% • 18 Doctors</span>
                    </div>
                    <span className="badge-online">Active</span>
                  </li>
                </ul>
              </div>

              {/* Quick Admin Tools */}
              <div className="admin-panel">
                <div className="panel-header-simple">
                  <FiSettings /> <h4>Quick Management Tools</h4>
                </div>
                <div className="admin-tools-grid">
                  <button className="tool-btn" onClick={() => triggerAction("Registered New Physician Account")}>
                    <FiUserCheck /> Register Doctor
                  </button>
                  <button className="tool-btn" onClick={() => triggerAction("Ran AI Risk Assessment Sync")}>
                    <FiActivity /> Sync AI Model
                  </button>
                  <button className="tool-btn" onClick={() => triggerAction("Downloaded System Logs")}>
                    <FiFileText /> System Logs
                  </button>
                  <button className="tool-btn" onClick={() => triggerAction("Refreshed Emergency Grid")}>
                    <FiShield /> Reset Grid
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
