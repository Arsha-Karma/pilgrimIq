import React, { useState, useEffect } from "react";
import "../styles/AdminDashboard.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiGetAllUsers, apiRegisterDoctor } from "../services/api";
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
  FiBell,
  FiX,
  FiPlusCircle,
  FiEye,
  FiEyeOff
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

  // Doctor Registration Modal state & validation
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showDoctorPassword, setShowDoctorPassword] = useState(false);
  const [registeringDoctor, setRegisteringDoctor] = useState(false);
  const [doctorAlert, setDoctorAlert] = useState({ type: "", message: "" });
  const [doctorForm, setDoctorForm] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "General Physician",
    password: "",
  });
  const [doctorFieldErrors, setDoctorFieldErrors] = useState({});
  const [doctorDirty, setDoctorDirty] = useState({});
  const [doctorIsSubmitted, setDoctorIsSubmitted] = useState(false);

  const validateDoctorField = (fieldName, value, currentForm = doctorForm) => {
    let error = "";
    switch (fieldName) {
      case "name":
        if (!value || !value.trim()) {
          error = "Doctor Full Name is required";
        } else if (/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) {
          error = "Numbers and special symbols are not allowed in name";
        } else if (value.trim().length < 2) {
          error = "Full Name must be at least 2 letters";
        }
        break;

      case "email":
        if (!value || !value.trim()) {
          error = "Email Address is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please enter a valid email address with '@' (e.g., doctor@example.com)";
        }
        break;

      case "phone":
        if (!value || !value.trim()) {
          error = "Phone Number is required";
        } else if (/[^\d]/.test(value)) {
          error = "Phone number must contain digits only";
        } else if (/^[0-5]/.test(value)) {
          error = "Phone number cannot start with 0, 1, 2, 3, 4, or 5";
        } else if (value.length !== 10) {
          error = "Phone number must be exactly 10 digits";
        } else if (/^(\d)\1{9}$/.test(value)) {
          error = "Invalid phone number format (e.g., 1000000000 is not allowed)";
        }
        break;

      case "specialization":
        if (!value || !value.trim()) {
          error = "Specialization / Designation is required";
        }
        break;

      case "password":
        if (!value) {
          error = "Password is required";
        } else if (value.length < 6) {
          error = "Password must be at least 6 characters long";
        } else if (
          !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(value)
        ) {
          error = "Password must include uppercase, lowercase, number, and special character";
        }
        break;

      default:
        break;
    }
    return error;
  };

  const handleDoctorFieldFocus = (e) => {
    const { name, value } = e.target;
    setDoctorDirty((prev) => ({ ...prev, [name]: true }));
    const error = validateDoctorField(name, value, doctorForm);
    setDoctorFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleDoctorFieldBlur = (e) => {
    const { name, value } = e.target;
    setDoctorDirty((prev) => ({ ...prev, [name]: true }));
    const error = validateDoctorField(name, value, doctorForm);
    setDoctorFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleDoctorFieldChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...doctorForm, [name]: value };
    setDoctorForm(updatedForm);
    setDoctorDirty((prev) => ({ ...prev, [name]: true }));

    const error = validateDoctorField(name, value, updatedForm);
    setDoctorFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const shouldShowDoctorError = (fieldName) => {
    return (doctorDirty[fieldName] || doctorIsSubmitted) && doctorFieldErrors[fieldName];
  };

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

  const generateRandomPassword = () => {
    const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowers = "abcdefghijkmnpqrstuvwxyz";
    const numbers = "23456789";
    const specials = "!@#$%^&*";
    const all = uppers + lowers + numbers + specials;

    const passArr = [
      uppers.charAt(Math.floor(Math.random() * uppers.length)),
      lowers.charAt(Math.floor(Math.random() * lowers.length)),
      numbers.charAt(Math.floor(Math.random() * numbers.length)),
      specials.charAt(Math.floor(Math.random() * specials.length)),
    ];

    while (passArr.length < 10) {
      passArr.push(all.charAt(Math.floor(Math.random() * all.length)));
    }

    for (let i = passArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [passArr[i], passArr[j]] = [passArr[j], passArr[i]];
    }

    const pass = passArr.join("");
    setDoctorForm((prev) => ({ ...prev, password: pass }));
    setDoctorDirty((prev) => ({ ...prev, password: true }));
    const passErr = validateDoctorField("password", pass);
    setDoctorFieldErrors((prev) => ({ ...prev, password: passErr }));
  };

  const handleRegisterDoctorSubmit = async (e) => {
    e.preventDefault();
    setDoctorAlert({ type: "", message: "" });
    setDoctorIsSubmitted(true);

    const errors = {
      name: validateDoctorField("name", doctorForm.name),
      email: validateDoctorField("email", doctorForm.email),
      phone: validateDoctorField("phone", doctorForm.phone),
      specialization: validateDoctorField("specialization", doctorForm.specialization),
      password: validateDoctorField("password", doctorForm.password),
    };

    setDoctorFieldErrors(errors);

    const hasErrors = Object.values(errors).some((err) => err !== "");
    if (hasErrors) {
      setDoctorAlert({ type: "error", message: "Please enter all required doctor details correctly." });
      return;
    }

    try {
      setRegisteringDoctor(true);
      const data = await apiRegisterDoctor(doctorForm, token);
      setDoctorAlert({
        type: "success",
        message: data.message || "Doctor registered successfully! Credentials sent to email.",
      });

      // Refresh users list
      const updated = await apiGetAllUsers(token);
      if (updated && updated.users) {
        setDbUsers(updated.users);
      }

      setDoctorForm({
        name: "",
        email: "",
        phone: "",
        specialization: "General Physician",
        password: "",
      });
      setDoctorDirty({});
      setDoctorFieldErrors({});
      setDoctorIsSubmitted(false);

      triggerAction(`Registered Dr. ${doctorForm.name || "Physician"} & dispatched login credentials mail.`);
    } catch (err) {
      setDoctorAlert({
        type: "error",
        message: err.message || "Failed to register doctor. Please try again.",
      });
    } finally {
      setRegisteringDoctor(false);
    }
  };

  // Filter accounts: registered doctors vs regular registered pilgrims
  const registeredDoctors = dbUsers.filter((u) => u.role === "physician");
  const registeredUserAccounts = dbUsers.filter(
    (u) => u.role !== "admin" && u.role !== "physician" && u.email !== "pilgrimlq03@gmail.com"
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
            {activeTab === "doctors" ? (
              <div className="admin-panel main-panel">
                <div className="panel-header">
                  <div>
                    <h3>Physicians & Medical Officers Directory</h3>
                    <p>
                      Official medical staff registered for base camp surveillance ({registeredDoctors.length} Registered Doctor{registeredDoctors.length === 1 ? "" : "s"})
                    </p>
                  </div>

                  <div>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        setDoctorAlert({ type: "", message: "" });
                        setShowDoctorModal(true);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "#2563eb",
                        border: "none",
                        color: "#fff",
                        padding: "9px 18px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        fontWeight: 700,
                        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
                      }}
                    >
                      <FiPlusCircle size={18} /> Register New Doctor
                    </button>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>DOCTOR ID</th>
                        <th>NAME & SPECIALIZATION</th>
                        <th>LOGIN ID / EMAIL</th>
                        <th>STATUS</th>
                        <th>REGISTERED ON</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredDoctors.length > 0 ? (
                        registeredDoctors.map((doc) => (
                          <tr key={doc._id}>
                            <td className="font-mono" style={{ color: "#60a5fa", fontWeight: "bold" }}>
                              {doc.doctorCode || `DOC-${doc._id ? doc._id.substring(doc._id.length - 4).toUpperCase() : "101"}`}
                            </td>
                            <td>
                              <div className="user-name" style={{ fontSize: "14.5px", fontWeight: "700" }}>
                                Dr. {doc.name}
                              </div>
                              <div className="user-contact" style={{ color: "#38bdf8", fontWeight: "600" }}>
                                {doc.specialization || "General Physician"}
                              </div>
                            </td>
                            <td>
                              <div className="user-contact" style={{ fontFamily: "monospace", color: "#f8fafc", fontSize: "13px" }}>
                                {doc.email}
                              </div>
                              <div className="user-contact" style={{ color: "#94a3b8", fontSize: "12px" }}>
                                {doc.phone || "Phone not provided"}
                              </div>
                            </td>
                            <td>
                              <span className="status-pill success" style={{ background: "rgba(16, 185, 129, 0.2)", color: "#34d399", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>
                                Active Physician
                              </span>
                            </td>
                            <td className="text-muted">
                              {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Active"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center" style={{ padding: "40px 20px" }}>
                            <FiUserCheck size={32} style={{ color: "#64748b", marginBottom: "10px" }} />
                            <p style={{ color: "#cbd5e1", fontSize: "15px", margin: 0 }}>No registered doctors found in database.</p>
                            <p style={{ color: "#94a3b8", fontSize: "13px" }}>Click "+ Register New Doctor" to add a physician and email them credentials.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Registered Pilgrims Register Table */
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
            )}

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
                  <button
                    className="tool-btn"
                    onClick={() => {
                      setDoctorAlert({ type: "", message: "" });
                      setShowDoctorModal(true);
                    }}
                    style={{ border: "1px solid #2563eb", background: "rgba(37, 99, 235, 0.15)" }}
                  >
                    <FiUserCheck style={{ color: "#60a5fa" }} />
                    <span style={{ color: "#ffffff", fontWeight: 700 }}>+ Register Doctor</span>
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

        {/* Register Doctor Modal */}
        {showDoctorModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <h3>
                  <FiUserCheck size={22} style={{ color: "#3b82f6" }} /> Register New Physician / Doctor
                </h3>
                <button className="btn-close-modal" onClick={() => setShowDoctorModal(false)}>
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleRegisterDoctorSubmit} noValidate>
                <div className="modal-body">
                  {doctorAlert.message && (
                    <div className={`alert-box ${doctorAlert.type}`}>
                      {doctorAlert.message}
                    </div>
                  )}

                  <div className="form-group-grid">
                    <div className="form-group full-width">
                      <label style={{ color: "#000000", fontWeight: "800" }}>Doctor Full Name *</label>
                      <input
                        name="name"
                        type="text"
                        className={`form-input ${shouldShowDoctorError("name") ? "input-error" : ""}`}
                        placeholder="e.g. Dr. Rajesh Sharma"
                        value={doctorForm.name}
                        onFocus={handleDoctorFieldFocus}
                        onBlur={handleDoctorFieldBlur}
                        onChange={handleDoctorFieldChange}
                        style={{
                          color: "#000000",
                          backgroundColor: "#ffffff",
                          fontWeight: "600",
                          ...(shouldShowDoctorError("name") ? { borderColor: "#ef4444" } : {})
                        }}
                      />
                      {shouldShowDoctorError("name") && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block", fontWeight: "600" }}>
                          ⚠️ {doctorFieldErrors.name}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label style={{ color: "#000000", fontWeight: "800" }}>Email Address (Login ID) *</label>
                      <input
                        name="email"
                        type="email"
                        className={`form-input ${shouldShowDoctorError("email") ? "input-error" : ""}`}
                        placeholder="doctor@pilgrimiq.com"
                        value={doctorForm.email}
                        onFocus={handleDoctorFieldFocus}
                        onBlur={handleDoctorFieldBlur}
                        onChange={handleDoctorFieldChange}
                        style={{
                          color: "#000000",
                          backgroundColor: "#ffffff",
                          fontWeight: "600",
                          ...(shouldShowDoctorError("email") ? { borderColor: "#ef4444" } : {})
                        }}
                      />
                      {shouldShowDoctorError("email") && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block", fontWeight: "600" }}>
                          ⚠️ {doctorFieldErrors.email}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label style={{ color: "#000000", fontWeight: "800" }}>Contact Phone Number *</label>
                      <input
                        name="phone"
                        type="tel"
                        className={`form-input ${shouldShowDoctorError("phone") ? "input-error" : ""}`}
                        placeholder="9876543210"
                        value={doctorForm.phone}
                        onFocus={handleDoctorFieldFocus}
                        onBlur={handleDoctorFieldBlur}
                        onChange={handleDoctorFieldChange}
                        style={{
                          color: "#000000",
                          backgroundColor: "#ffffff",
                          fontWeight: "600",
                          ...(shouldShowDoctorError("phone") ? { borderColor: "#ef4444" } : {})
                        }}
                      />
                      {shouldShowDoctorError("phone") && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block", fontWeight: "600" }}>
                          ⚠️ {doctorFieldErrors.phone}
                        </span>
                      )}
                    </div>

                    <div className="form-group full-width">
                      <label style={{ color: "#000000", fontWeight: "800" }}>Specialization / Designation *</label>
                      <select
                        name="specialization"
                        className={`form-select ${shouldShowDoctorError("specialization") ? "input-error" : ""}`}
                        value={doctorForm.specialization}
                        onFocus={handleDoctorFieldFocus}
                        onBlur={handleDoctorFieldBlur}
                        onChange={handleDoctorFieldChange}
                        style={{
                          color: "#000000",
                          backgroundColor: "#ffffff",
                          fontWeight: "600",
                          ...(shouldShowDoctorError("specialization") ? { borderColor: "#ef4444" } : {})
                        }}
                      >
                        <option value="General Physician" style={{ color: "#000000", backgroundColor: "#ffffff" }}>General Physician</option>
                        <option value="Cardiology & Cardiac Response" style={{ color: "#000000", backgroundColor: "#ffffff" }}>Cardiology & Cardiac Response</option>
                        <option value="Emergency Medicine & Trauma" style={{ color: "#000000", backgroundColor: "#ffffff" }}>Emergency Medicine & Trauma</option>
                        <option value="Oxygen & High Altitude Medic" style={{ color: "#000000", backgroundColor: "#ffffff" }}>Oxygen & High Altitude Medic</option>
                        <option value="Orthopedics & Trek Injury Specialist" style={{ color: "#000000", backgroundColor: "#ffffff" }}>Orthopedics & Trek Injury Specialist</option>
                      </select>
                      {shouldShowDoctorError("specialization") && (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block", fontWeight: "600" }}>
                          ⚠️ {doctorFieldErrors.specialization}
                        </span>
                      )}
                    </div>

                    <div className="form-group full-width">
                      <label style={{ color: "#000000", fontWeight: "800" }}>Login Password *</label>
                      <div className="password-input-group">
                        <input
                          name="password"
                          type={showDoctorPassword ? "text" : "password"}
                          className={`form-input ${shouldShowDoctorError("password") ? "input-error" : ""}`}
                          placeholder="Set initial password for doctor"
                          value={doctorForm.password}
                          onFocus={handleDoctorFieldFocus}
                          onBlur={handleDoctorFieldBlur}
                          onChange={handleDoctorFieldChange}
                          style={{
                            color: "#000000",
                            backgroundColor: "#ffffff",
                            fontWeight: "600",
                            ...(shouldShowDoctorError("password") ? { borderColor: "#ef4444" } : {})
                          }}
                        />
                        <button
                          type="button"
                          className="btn-gen-pass"
                          onClick={() => setShowDoctorPassword((prev) => !prev)}
                          title={showDoctorPassword ? "Hide password" : "Show password"}
                          style={{ display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          {showDoctorPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                          {showDoctorPassword ? "Hide" : "Show"}
                        </button>
                        <button
                          type="button"
                          className="btn-gen-pass"
                          onClick={generateRandomPassword}
                        >
                          Auto Generate
                        </button>
                      </div>
                      {shouldShowDoctorError("password") ? (
                        <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block", fontWeight: "600" }}>
                          ⚠️ {doctorFieldErrors.password}
                        </span>
                      ) : (
                        <span style={{ fontSize: "11px", color: "#475569", marginTop: "4px", display: "block", fontWeight: "600" }}>
                          • Must contain upper & lowercase letters, number, and special character. Will be emailed to doctor.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowDoctorModal(false)}
                    disabled={registeringDoctor}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit-doctor"
                    disabled={registeringDoctor}
                  >
                    {registeringDoctor ? "Dispatching Email..." : "Register & Send Credentials Email"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
