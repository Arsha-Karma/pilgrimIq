import React, { useState, useEffect, useCallback } from "react";
import "../styles/AdminDashboard.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiGetAllUsers, apiRegisterDoctor, apiGetEnquiries, apiUpdateEnquiryStatus, apiReplyEnquiry, apiGetPilgrimageCenters, apiGetAllMedicalReports, apiGetBaseCamps } from "../services/api";
import logo from "../assets/pilgrim-logo.png";
import {
  FiGrid,
  FiUsers,
  FiActivity,
  FiAlertTriangle,
  FiLogOut,
  FiTrendingUp,
  FiMapPin,
  FiSearch,
  FiCheckCircle,
  FiFileText,
  FiSettings,
  FiUserCheck,
  FiHome,
  FiBell,
  FiX,
  FiPlusCircle,
  FiEye,
  FiEyeOff,
  FiCompass,
  FiChevronDown,
  FiChevronUp,
  FiMail,
  FiSend
} from "react-icons/fi";
import AdminPilgrimageCenters from "./AdminPilgrimageCenters";
import AdminBaseCamps from "./AdminBaseCamps";

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
  const [dbCenters, setDbCenters] = useState([]);

  // Expandable family member rows state & Pilgrim Modal state
  const [expandedUserIds, setExpandedUserIds] = useState(new Set());
  const [viewingPilgrimModal, setViewingPilgrimModal] = useState(null);

  // User Enquiries state
  const [dbEnquiries, setDbEnquiries] = useState([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);
  const [viewingEnquiryModal, setViewingEnquiryModal] = useState(null);
  const [viewingReplyModal, setViewingReplyModal] = useState(null);
  const [enquirySearchTerm, setEnquirySearchTerm] = useState("");
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState("all");

  // Direct Reply Modal state
  const [showReplyFormModal, setShowReplyFormModal] = useState(false);
  const [replyingEnquiry, setReplyingEnquiry] = useState(null);
  const [replyMessageText, setReplyMessageText] = useState("");
  const [replySubjectText, setReplySubjectText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // AI Health Reports State
  const [dbReports, setDbReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportSearchTerm, setReportSearchTerm] = useState("");
  const [reportRiskFilter, setReportRiskFilter] = useState("all");
  const [viewingReportModal, setViewingReportModal] = useState(null);

  const fetchEnquiries = useCallback(async () => {
    try {
      setLoadingEnquiries(true);
      const data = await apiGetEnquiries(token);
      if (data && data.enquiries) {
        setDbEnquiries(data.enquiries);
      }
    } catch (err) {
      console.error("Failed to load enquiries:", err);
    } finally {
      setLoadingEnquiries(false);
    }
  }, [token]);

  const fetchReports = useCallback(async () => {
    try {
      setLoadingReports(true);
      const data = await apiGetAllMedicalReports(token);
      if (data && data.reports) {
        setDbReports(data.reports);
      }
    } catch (err) {
      console.error("Failed to load medical reports:", err);
    } finally {
      setLoadingReports(false);
    }
  }, [token]);

  // Base Camps State
  const [dbBaseCamps, setDbBaseCamps] = useState([]);

  const fetchBaseCampsData = useCallback(async () => {
    try {
      const data = await apiGetBaseCamps({}, token);
      if (Array.isArray(data)) {
        setDbBaseCamps(data);
      }
    } catch (err) {
      console.error("Failed to load base camps:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchEnquiries();
    fetchReports();
    fetchBaseCampsData();
  }, [fetchEnquiries, fetchReports, fetchBaseCampsData]);

  const handleUpdateEnquiryStatus = async (id, status) => {
    try {
      await apiUpdateEnquiryStatus(id, status, token);
      triggerAction(`Enquiry status updated to ${status}`);
      fetchEnquiries();
      if (viewingEnquiryModal && viewingEnquiryModal._id === id) {
        setViewingEnquiryModal((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (err) {
      console.error("Failed to update enquiry status:", err);
    }
  };

  const handleOpenReplyFormModal = (enquiry) => {
    setReplyingEnquiry(enquiry);
    setReplySubjectText(`Re: ${enquiry.subject || "PilgrimIQ Inquiry"}`);
    setReplyMessageText(
      `Hello ${enquiry.name || "Pilgrim"},\n\nThank you for reaching out to PilgrimIQ Support.\n\n[ Type your reply here ]\n\n--------------------------\nOriginal Inquiry:\n"${enquiry.message}"`
    );
    setShowReplyFormModal(true);
  };

  const handleSendDirectEmailReply = async (e) => {
    e.preventDefault();
    if (!replyingEnquiry || !replyMessageText.trim()) return;

    try {
      setSendingReply(true);
      const res = await apiReplyEnquiry(
        replyingEnquiry._id,
        {
          replyMessage: replyMessageText,
          replySubject: replySubjectText,
        },
        token
      );

      triggerAction(res.message || `Reply email dispatched to ${replyingEnquiry.email}!`);
      setShowReplyFormModal(false);
      setReplyingEnquiry(null);
      setReplyMessageText("");
      fetchEnquiries();
      if (viewingEnquiryModal && viewingEnquiryModal._id === replyingEnquiry._id) {
        setViewingEnquiryModal((prev) => (prev ? { ...prev, status: "Replied" } : null));
      }
    } catch (err) {
      alert("Failed to send reply email: " + (err.message || "Server error"));
    } finally {
      setSendingReply(false);
    }
  };

  const handleOpenGmailWeb = (enquiry) => {
    if (!enquiry || !enquiry.email) return;

    const email = enquiry.email;
    const subject = encodeURIComponent(`Re: ${enquiry.subject || "PilgrimIQ Inquiry"}`);
    const body = encodeURIComponent(
      `Hello ${enquiry.name || "Pilgrim"},\n\nThank you for reaching out to PilgrimIQ Support regarding "${enquiry.subject || "your inquiry"}".\n\n\n\n--------------------------\nOriginal Inquiry from ${enquiry.name} (${enquiry.email}):\n"${enquiry.message}"\n\nBest regards,\nPilgrimIQ Admin & Support Team`
    );

    // Open Gmail compose in a new browser tab without OS popup!
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;
    window.open(gmailUrl, "_blank");

    if (enquiry._id) {
      handleUpdateEnquiryStatus(enquiry._id, "Replied");
    }
  };

  const filteredEnquiries = dbEnquiries.filter((enq) => {
    const term = enquirySearchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (enq.name || "").toLowerCase().includes(term) ||
      (enq.email || "").toLowerCase().includes(term) ||
      (enq.subject || "").toLowerCase().includes(term) ||
      (enq.message || "").toLowerCase().includes(term);

    const isUnreplied = enq.status !== "Replied";

    if (enquiryStatusFilter === "all") return matchesSearch && isUnreplied;
    return matchesSearch && isUnreplied && enq.status === enquiryStatusFilter;
  });

  const repliedEnquiriesList = dbEnquiries.filter((enq) => {
    const term = enquirySearchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (enq.name || "").toLowerCase().includes(term) ||
      (enq.email || "").toLowerCase().includes(term) ||
      (enq.subject || "").toLowerCase().includes(term) ||
      (enq.message || "").toLowerCase().includes(term) ||
      (enq.adminReply || "").toLowerCase().includes(term);

    return enq.status === "Replied" && matchesSearch;
  });

  const filteredReports = dbReports.filter((report) => {
    const term = reportSearchTerm.toLowerCase().trim();
    const isFamily = report.ownerType === "family_member" && report.familyMemberId;
    const patientName = (isFamily ? report.familyMemberId.name : report.userId?.name || "Pilgrim").toLowerCase();
    const patientEmail = (report.userId?.email || "").toLowerCase();
    const fileName = (report.fileName || "").toLowerCase();

    const matchesSearch =
      !term ||
      patientName.includes(term) ||
      patientEmail.includes(term) ||
      fileName.includes(term);

    const overallStatus = report.aiRiskAssessment?.overallStatus || report.finalStatus || "LOW_RISK";

    if (reportRiskFilter === "all") return matchesSearch;
    if (reportRiskFilter === "high") return matchesSearch && (overallStatus === "MEDICAL_REVIEW_REQUIRED" || overallStatus === "HIGH_RISK");
    if (reportRiskFilter === "caution") return matchesSearch && overallStatus === "CAUTION";
    if (reportRiskFilter === "low") return matchesSearch && overallStatus === "LOW_RISK";
    return matchesSearch;
  });

  const toggleExpandUser = (userId) => {
    setExpandedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

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
          error = "Phone number can only contain digits (letters and symbols are not allowed)";
        } else if (/^[0-5]/.test(value)) {
          error = "Phone number must start with a digit between 6 and 9";
        } else if (value.length !== 10) {
          error = "Phone number must be exactly 10 digits";
        } else if (/^(\d)\1{9}$/.test(value) || /^[6-9]0{8,9}$/.test(value) || /^[6-9](\d)\1{8}$/.test(value)) {
          error = "Invalid phone number format (repetitive numbers like 7000000000 are not allowed)";
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

    const loadCenters = async () => {
      try {
        const data = await apiGetPilgrimageCenters();
        if (data && data.centers) {
          setDbCenters(data.centers);
        }
      } catch (err) {
        console.error("Failed to load centers:", err.message);
      }
    };
    loadCenters();
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

  // Convert real registered users & family members into pilgrim table format
  const pilgrimsList = registeredUserAccounts.map((u, index) => ({
    _id: u._id,
    id: `REG-${u._id ? u._id.substring(u._id.length - 6).toUpperCase() : `00${index + 1}`}`,
    name: u.name || "Registered Pilgrim",
    email: u.email,
    phone: u.phone || "Not provided",
    familyMembers: u.familyMembers || [],
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
    rawUser: u,
  }));

  const totalFamilyMembersCount = pilgrimsList.reduce((acc, p) => acc + p.familyMembers.length, 0);

  const filteredPilgrims = pilgrimsList.filter((pilgrim) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesUser =
      pilgrim.name.toLowerCase().includes(term) ||
      pilgrim.id.toLowerCase().includes(term) ||
      pilgrim.email.toLowerCase().includes(term) ||
      pilgrim.phone.toLowerCase().includes(term);

    const matchesFamily = pilgrim.familyMembers.some((fm) =>
      (fm.name || "").toLowerCase().includes(term) ||
      (fm.relationship || "").toLowerCase().includes(term) ||
      (fm.phone || "").toLowerCase().includes(term) ||
      (fm.bloodGroup || "").toLowerCase().includes(term) ||
      (fm.chronicConditions || "").toLowerCase().includes(term)
    );

    const matchesSearch = !term || matchesUser || matchesFamily;

    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "cleared") return matchesSearch && pilgrim.status === "Cleared";
    if (statusFilter === "alert") return matchesSearch && pilgrim.status === "Medical Alert";
    if (statusFilter === "review") return matchesSearch && pilgrim.status === "Under Review";
    if (statusFilter === "has_family") return matchesSearch && pilgrim.familyMembers.length > 0;
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
            <span className="nav-tag green">{dbBaseCamps.length || dbCenters.length} Camps</span>
          </button>

          <button
            className={`nav-item ${activeTab === "alerts" ? "active" : ""}`}
            onClick={() => setActiveTab("alerts")}
          >
            <FiAlertTriangle className="nav-icon" />
            <span>Emergency Health Alerts</span>
            <span className="nav-tag neutral">Live Monitor</span>
          </button>

          <button
            className={`nav-item ${activeTab === "centers" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("centers");
              triggerAction("Opened Pilgrimage Centers Management");
            }}
          >
            <FiCompass className="nav-icon" />
            <span>Pilgrimage Centers</span>
          </button>

          <div className="nav-section-label" style={{ marginTop: "20px" }}>MANAGEMENT</div>

          <button
            className={`nav-item ${activeTab === "enquiries" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("enquiries");
              triggerAction("Opened User Enquiries Management");
            }}
          >
            <FiMail className="nav-icon" />
            <span>User Enquiries</span>
            {dbEnquiries.filter((e) => e.status === "New").length > 0 && (
              <span className="nav-tag green">
                {dbEnquiries.filter((e) => e.status === "New").length} New
              </span>
            )}
          </button>

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
              {activeTab === "centers" && "Pilgrimage Center Management"}
              {activeTab === "enquiries" && "User Enquiries & Helpdesk Messages"}
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

          {/* Hero Banner & Key Metrics Cards (Shown only on Overview tab) */}
          {activeTab === "overview" && (
            <>
              <div className="admin-hero">
                <div>
                  <h1>Welcome back, {user?.name || "Administrator"} 👋</h1>
                  <p>Real-time Pilgrimage Health Surveillance, Safety Monitoring & Medical Control</p>
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
                  <div className="kpi-value">{dbBaseCamps.length || dbCenters.length} Base Camps</div>
                  <div className="kpi-trend positive">
                    <FiCheckCircle /> 100% Operational
                  </div>
                </div>

                <div className="kpi-card red">
                  <div className="kpi-header">
                    <span>ACTIVE HEALTH ALERTS</span>
                    <FiAlertTriangle className="kpi-icon" />
                  </div>
                  <div className="kpi-value">{registeredUserAccounts.length + totalFamilyMembersCount} Patients</div>
                  <div className="kpi-trend positive">
                    <FiActivity /> All registered pilgrims monitored
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Content Panels Grid */}
          {activeTab === "camps" ? (
            <AdminBaseCamps token={token} showAlert={(type, msg) => triggerAction(msg)} />
          ) : activeTab === "centers" ? (
            <AdminPilgrimageCenters token={token} showAlert={(type, msg) => triggerAction(msg)} />
          ) : (
            <div className="admin-content-grid" style={activeTab === "enquiries" ? { display: "block" } : {}}>
              {activeTab === "enquiries" ? (
                <>
                  <div className="admin-panel main-panel">
                    <div className="panel-header">
                      <div>
                        <h3>User Enquiries & Support Messages</h3>
                        <p>
                          Inquiries submitted by users via Contact Us page ({filteredEnquiries.length} pending • {filteredEnquiries.filter((e) => e.status === "New").length} unread)
                        </p>
                      </div>

                      <div className="table-controls">
                        <div className="search-box">
                          <FiSearch className="search-icon" />
                          <input
                            type="text"
                            placeholder="Search by name, email, subject, or message..."
                            value={enquirySearchTerm}
                            onChange={(e) => setEnquirySearchTerm(e.target.value)}
                          />
                        </div>

                        <select
                          className="filter-dropdown"
                          value={enquiryStatusFilter}
                          onChange={(e) => setEnquiryStatusFilter(e.target.value)}
                        >
                          <option value="all">All Pending Enquiries</option>
                          <option value="New">New / Unread</option>
                          <option value="Read">Read</option>
                        </select>
                      </div>
                    </div>

                    <div className="table-responsive">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>SENDER NAME & EMAIL</th>
                            <th>PILGRIMAGE CENTER / SUBJECT</th>
                            <th>MESSAGE PREVIEW</th>
                            <th>RECEIVED DATE</th>
                            <th>ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEnquiries.length > 0 ? (
                            filteredEnquiries.map((enq) => (
                              <tr key={enq._id}>
                                <td>
                                  <div className="user-name" style={{ fontWeight: "700", color: "#f8fafc" }}>
                                    {enq.name}
                                  </div>
                                  <div className="user-contact" style={{ fontFamily: "monospace", color: "#60a5fa" }}>
                                    {enq.email}
                                  </div>
                                </td>
                                <td>
                                  <div style={{ fontWeight: "600", color: "#38bdf8", fontSize: "13.5px" }}>
                                    {enq.subject}
                                  </div>
                                </td>
                                <td>
                                  <div style={{ color: "#cbd5e1", fontSize: "12.5px", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {enq.message}
                                  </div>
                                </td>
                                <td className="text-muted">
                                  {new Date(enq.createdAt).toLocaleString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </td>
                                <td style={{ whiteSpace: "nowrap" }}>
                                  <button
                                    className="btn-table-action"
                                    onClick={() => {
                                      setViewingEnquiryModal(enq);
                                      if (enq.status === "New") {
                                        handleUpdateEnquiryStatus(enq._id, "Read");
                                      }
                                    }}
                                    style={{ marginRight: "6px" }}
                                  >
                                    View
                                  </button>
                                  {enq.status === "Replied" ? (
                                    <button
                                      className="btn-table-action"
                                      onClick={() => setViewingReplyModal(enq)}
                                      style={{ background: "rgba(16, 185, 129, 0.2)", color: "#34d399", border: "1px solid #10b981" }}
                                      title="View sent reply response message"
                                    >
                                      💬 View Reply
                                    </button>
                                  ) : (
                                    <button
                                      className="btn-table-action"
                                      onClick={() => handleOpenReplyFormModal(enq)}
                                      style={{ background: "#2563eb", color: "#ffffff" }}
                                      title={`Compose direct email reply to ${enq.email}`}
                                    >
                                      ✉️ Reply
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="text-center" style={{ padding: "40px 20px" }}>
                                <FiMail size={32} style={{ color: "#64748b", marginBottom: "10px" }} />
                                <p style={{ color: "#cbd5e1", fontSize: "15px", margin: 0 }}>
                                  {loadingEnquiries ? "Loading user enquiries..." : "No user enquiries found."}
                                </p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* DEDICATED REPLIED ENQUIRIES & RESPONSE HISTORY SECTION */}
                  <div className="admin-panel main-panel" style={{ marginTop: "24px" }}>
                    <div className="panel-header" style={{ borderBottom: "1px solid #1e293b", paddingBottom: "12px" }}>
                      <div>
                        <h3 style={{ color: "#34d399", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                          💬 Replied Enquiries & Admin Response History
                        </h3>
                        <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
                          All user inquiries that have received official admin replies ({repliedEnquiriesList.length} total)
                        </p>
                      </div>
                    </div>

                    <div className="table-responsive">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>RECIPIENT NAME & EMAIL</th>
                            <th>PILGRIMAGE CENTER / SUBJECT</th>
                            <th>ORIGINAL INQUIRY</th>
                            <th>ADMIN RESPONSE CONTENT</th>
                            <th>REPLIED DATE</th>
                            <th>ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {repliedEnquiriesList.length > 0 ? (
                            repliedEnquiriesList.map((enq) => (
                              <tr key={`replied-${enq._id}`}>
                                <td>
                                  <div className="user-name" style={{ fontWeight: "700", color: "#f8fafc" }}>
                                    {enq.name}
                                  </div>
                                  <div className="user-contact" style={{ fontFamily: "monospace", color: "#60a5fa" }}>
                                    {enq.email}
                                  </div>
                                </td>
                                <td>
                                  <div style={{ fontWeight: "600", color: "#38bdf8", fontSize: "13.5px" }}>
                                    {enq.subject}
                                  </div>
                                </td>
                                <td>
                                  <div style={{ color: "#94a3b8", fontSize: "12.5px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {enq.message}
                                  </div>
                                </td>
                                <td>
                                  <div style={{ color: "#34d399", fontSize: "12.5px", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: "600" }}>
                                    {enq.adminReply || "Replied via Admin Email"}
                                  </div>
                                </td>
                                <td className="text-muted">
                                  {enq.repliedAt
                                    ? new Date(enq.repliedAt).toLocaleString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                    : new Date(enq.updatedAt || enq.createdAt).toLocaleString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                </td>
                                <td>
                                  <button
                                    className="btn-table-action"
                                    onClick={() => setViewingReplyModal(enq)}
                                    style={{ background: "rgba(16, 185, 129, 0.2)", color: "#34d399", border: "1px solid #10b981" }}
                                  >
                                    💬 View Reply
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="text-center" style={{ padding: "30px 20px" }}>
                                <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
                                  No replied enquiries found. When an admin replies to an inquiry, its status becomes Replied and details will appear here.
                                </p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : activeTab === "doctors" ? (
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
                              <p style={{ color: "#cbd5e1", fontSize: "15px", margin: 0 }}>No registered doctors found.</p>
                              <p style={{ color: "#94a3b8", fontSize: "13px" }}>Click "+ Register New Doctor" to add a physician and email them credentials.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : activeTab === "reports" ? (
                /* AI Health Reports Table Panel */
                <div className="admin-panel main-panel">
                  <div className="panel-header">
                    <div>
                      <h3>AI Health Audit & Medical Reports Directory</h3>
                      <p>
                        All uploaded pilgrim medical reports, OCR extracted vitals, AI risk level assessments & physician authorizations ({filteredReports.length} total report{filteredReports.length === 1 ? "" : "s"})
                      </p>
                    </div>

                    <div className="table-controls">
                      <div className="search-box">
                        <FiSearch className="search-icon" />
                        <input
                          type="text"
                          placeholder="Search patient name, email, report, or condition..."
                          value={reportSearchTerm}
                          onChange={(e) => setReportSearchTerm(e.target.value)}
                        />
                      </div>

                      <select
                        className="filter-dropdown"
                        value={reportRiskFilter}
                        onChange={(e) => setReportRiskFilter(e.target.value)}
                      >
                        <option value="all">All Risk Levels</option>
                        <option value="high">High Risk / Medical Review Required</option>
                        <option value="caution">Caution / Moderate Risk</option>
                        <option value="low">Low Risk / Cleared</option>
                      </select>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>REPORT & FILE</th>
                          <th>PATIENT / APPLICANT</th>
                          <th>OCR EXTRACTED VITALS</th>
                          <th>PSI & AI RISK</th>
                          <th>PHYSICIAN REVIEW</th>
                          <th>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReports.length > 0 ? (
                          filteredReports.map((report) => {
                            const isFamily = report.ownerType === "family_member" && report.familyMemberId;
                            const patientName = isFamily ? report.familyMemberId.name : report.userId?.name || "Patient";
                            const relationship = isFamily ? report.familyMemberId.relationship || "Family Member" : "Main User";
                            const email = report.userId?.email || "N/A";
                            const overallStatus = report.aiRiskAssessment?.overallStatus || report.finalStatus || "LOW_RISK";
                            const psi = report.psiScore || (overallStatus === "MEDICAL_REVIEW_REQUIRED" ? 45 : overallStatus === "CAUTION" ? 70 : 95);
                            const doctorStatus = report.physicianReview?.status || report.doctorDecision || "Not Required";

                            const vitals = report.extractedEntities?.vitals || {};
                            const hemoglobin = vitals.hemoglobin ? `Hb: ${vitals.hemoglobin} g/dL` : null;
                            const bloodSugar = vitals.bloodSugar ? `Glucose: ${vitals.bloodSugar} mg/dL` : null;
                            const spo2 = vitals.spo2 ? `SpO2: ${vitals.spo2}%` : null;

                            return (
                              <tr key={report._id}>
                                <td>
                                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#60a5fa" }}>
                                    📄 {report.fileName || "Medical Report"}
                                  </div>
                                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                                    {new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                  </div>
                                </td>
                                <td>
                                  <div style={{ fontSize: "14.5px", fontWeight: "700", color: "#f8fafc" }}>{patientName}</div>
                                  <div style={{ fontSize: "12px", color: "#38bdf8", fontWeight: "600" }}>{relationship}</div>
                                  <div style={{ fontSize: "11.5px", color: "#94a3b8" }}>{email}</div>
                                </td>
                                <td style={{ fontSize: "12.5px" }}>
                                  {spo2 || hemoglobin || bloodSugar ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                      {spo2 && <span style={{ color: "#34d399", fontWeight: "700" }}>🫁 {spo2}</span>}
                                      {hemoglobin && <span style={{ color: "#f43f5e", fontWeight: "600" }}>🩸 {hemoglobin}</span>}
                                      {bloodSugar && <span style={{ color: "#fbbf24", fontWeight: "600" }}>🧪 {bloodSugar}</span>}
                                    </div>
                                  ) : (
                                    <span style={{ color: "#94a3b8", fontStyle: "italic" }}>
                                      {report.extractedEntities?.conditions?.length > 0
                                        ? `Detected: ${report.extractedEntities.conditions.join(", ")}`
                                        : "Report processed by AI"}
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <div style={{ marginBottom: "4px" }}>
                                    <span
                                      style={{
                                        background: psi >= 80 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                                        color: psi >= 80 ? "#34d399" : "#f87171",
                                        padding: "3px 8px",
                                        borderRadius: "6px",
                                        fontWeight: "800",
                                        fontSize: "12px",
                                      }}
                                    >
                                      PSI: {psi} / 100
                                    </span>
                                  </div>
                                  <span
                                    className={`status-pill ${
                                      overallStatus === "MEDICAL_REVIEW_REQUIRED" || overallStatus === "HIGH_RISK"
                                        ? "danger"
                                        : overallStatus === "CAUTION"
                                        ? "warning"
                                        : "success"
                                    }`}
                                  >
                                    {overallStatus}
                                  </span>
                                </td>
                                <td>
                                  <span
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: "800",
                                      color:
                                        doctorStatus === "approved"
                                          ? "#34d399"
                                          : doctorStatus === "rejected"
                                          ? "#f87171"
                                          : doctorStatus === "pending"
                                          ? "#fbbf24"
                                          : "#94a3b8",
                                    }}
                                  >
                                    {doctorStatus.toUpperCase()}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    className="btn-table-action"
                                    onClick={() => setViewingReportModal(report)}
                                    style={{ background: "#2563eb", color: "#fff", border: "none", display: "flex", alignItems: "center", gap: "4px" }}
                                  >
                                    <FiEye size={14} /> View Report
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center" style={{ padding: "40px 20px" }}>
                              <FiFileText size={32} style={{ color: "#64748b", marginBottom: "10px" }} />
                              <p style={{ color: "#cbd5e1", fontSize: "15px", margin: 0 }}>
                                {loadingReports ? "Loading AI medical reports..." : "No medical reports match the selected criteria."}
                              </p>
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
                        Live status of registered pilgrims ({registeredUserAccounts.length} user account{registeredUserAccounts.length === 1 ? "" : "s"} • {totalFamilyMembersCount} registered family member{totalFamilyMembersCount === 1 ? "" : "s"})
                      </p>
                    </div>

                    <div className="table-controls">
                      <div className="search-box">
                        <FiSearch className="search-icon" />
                        <input
                          type="text"
                          placeholder="Search by user name, email, ID, or family member name..."
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
                        <option value="has_family">With Family Members</option>
                      </select>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>PILGRIM ID</th>
                          <th>NAME & CONTACT</th>
                          <th>FAMILY MEMBERS</th>
                          <th>LOCATION</th>
                          <th>RISK INDEX</th>
                          <th>STATUS</th>
                          <th>REGISTERED / CHECK-IN</th>
                          <th>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPilgrims.length > 0 ? (
                          filteredPilgrims.map((pilgrim) => {
                            const isExpanded = expandedUserIds.has(pilgrim._id);
                            return (
                              <React.Fragment key={pilgrim.id}>
                                <tr>
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
                                  <td>
                                    {pilgrim.familyMembers && pilgrim.familyMembers.length > 0 ? (
                                      <button
                                        className="family-count-pill"
                                        onClick={() => toggleExpandUser(pilgrim._id)}
                                        title="Click to view family members list"
                                      >
                                        👨‍👩‍👧‍👦 {pilgrim.familyMembers.length} Member{pilgrim.familyMembers.length === 1 ? "" : "s"}{" "}
                                        {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                                      </button>
                                    ) : (
                                      <span className="no-family-badge">No family added</span>
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
                                      onClick={() => setViewingPilgrimModal(pilgrim)}
                                    >
                                      View
                                    </button>
                                  </td>
                                </tr>

                                {/* Expanded Family Sub-Table Row */}
                                {isExpanded && pilgrim.familyMembers && pilgrim.familyMembers.length > 0 && (
                                  <tr className="expanded-family-row">
                                    <td colSpan="8">
                                      <div className="family-subtable-box">
                                        <div className="family-subtable-header">
                                          <h4>
                                            👨‍👩‍👧‍👦 Family Members Registered by {pilgrim.name} ({pilgrim.familyMembers.length})
                                          </h4>
                                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                                            User Email: {pilgrim.email}
                                          </span>
                                        </div>
                                        <div className="family-cards-grid">
                                          {pilgrim.familyMembers.map((fm, idx) => (
                                            <div key={fm._id || idx} className="admin-family-card">
                                              <div className="family-card-head">
                                                <span className="family-card-name">{fm.name}</span>
                                                <span className="family-relation-tag">{fm.relationship || "Family Member"}</span>
                                              </div>
                                              <div className="family-card-detail">
                                                <strong>Age / Gender:</strong> {fm.age ? `${fm.age} Yrs` : "N/A"} {fm.gender ? `• ${fm.gender}` : ""}
                                              </div>
                                              <div className="family-card-detail">
                                                <strong>Blood Group:</strong> <span style={{ color: "#f43f5e", fontWeight: "bold" }}>{fm.bloodGroup || "Not specified"}</span>
                                              </div>
                                              {fm.phone && (
                                                <div className="family-card-detail">
                                                  <strong>Phone:</strong> {fm.phone}
                                                </div>
                                              )}
                                              {fm.emergencyContactName && (
                                                <div className="family-card-detail">
                                                  <strong>Emergency Contact:</strong> {fm.emergencyContactName} ({fm.emergencyContactPhone || "No phone"})
                                                </div>
                                              )}
                                              {(fm.chronicConditions || (fm.existingConditions && fm.existingConditions.length > 0)) && (
                                                <div className="family-card-detail">
                                                  <strong>Medical Notes:</strong>{" "}
                                                  <span style={{ color: "#fbbf24" }}>
                                                    {fm.chronicConditions || fm.existingConditions.join(", ")}
                                                  </span>
                                                </div>
                                              )}
                                              <div className="family-vitals-row">
                                                <span>BP: {fm.bloodPressure || "120/80"}</span>
                                                <span>SpO2: {fm.spo2 || "98%"}</span>
                                                <span>Pulse: {fm.heartRate || "72 bpm"}</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center">
                              {loadingUsers ? "Loading registered users..." : "No registered user accounts found."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Right Side Panels: Base Camp Operations & Admin Quick Tools (Hidden in User Enquiries tab) */}
              {activeTab !== "enquiries" && (
                <div className="admin-sidebar-panels">
                  {/* Medical Stations Summary */}
                  <div className="admin-panel">
                    <div className="panel-header-simple">
                      <FiMapPin /> <h4>Base Camp Operations</h4>
                    </div>
                    <ul className="station-list">
                      {dbBaseCamps.length > 0 ? (
                        dbBaseCamps.slice(0, 5).map((camp) => (
                          <li key={camp._id}>
                            <div className="station-info">
                              <span className="station-name">{camp.name}</span>
                              <span className="station-meta">{camp.locality}, {camp.district} • Cap: {camp.maximumCapacity?.toLocaleString()}</span>
                            </div>
                            <span className={camp.status === "Operational" ? "badge-online" : "badge-offline"}>
                              {camp.status}
                            </span>
                          </li>
                        ))
                      ) : dbCenters.length > 0 ? (
                        dbCenters.slice(0, 5).map((center) => (
                          <li key={center._id}>
                            <div className="station-info">
                              <span className="station-name">{center.name}</span>
                              <span className="station-meta">{center.location?.city || "Base Camp"}, {center.location?.state || "India"}</span>
                            </div>
                            <span className="badge-online">Active</span>
                          </li>
                        ))
                      ) : (
                        <li>
                          <div className="station-info">
                            <span className="station-name">No Pilgrimage Base Camps registered</span>
                          </div>
                        </li>
                      )}
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
                        style={{ border: "1px solid #2563eb", background: "rgba(37, 99, 235, 0.15)", width: "100%" }}
                      >
                        <FiUserCheck style={{ color: "#60a5fa" }} />
                        <span style={{ color: "#ffffff", fontWeight: 700 }}>+ Register Doctor</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Pilgrim & Family Details Modal */}
        {viewingPilgrimModal && (
          <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: "750px", width: "92%" }}>
              <div className="modal-header">
                <h3>
                  👤 Pilgrim & Family Profile Details
                </h3>
                <button className="btn-close-modal" onClick={() => setViewingPilgrimModal(null)}>
                  <FiX />
                </button>
              </div>

              <div className="modal-body" style={{ maxHeight: "75vh", overflowY: "auto", padding: "20px" }}>
                {/* Registered Account Info */}
                <div style={{ background: "#1e293b", padding: "18px", borderRadius: "12px", border: "1px solid #334155", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h4 style={{ margin: 0, color: "#60a5fa", fontSize: "16px" }}>
                      {viewingPilgrimModal.name} ({viewingPilgrimModal.id})
                    </h4>
                    <span className="status-pill success">Registered Account</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", color: "#cbd5e1" }}>
                    <div><strong>Email:</strong> {viewingPilgrimModal.email}</div>
                    <div><strong>Phone:</strong> {viewingPilgrimModal.phone}</div>
                    <div><strong>Location:</strong> {viewingPilgrimModal.location}</div>
                    <div><strong>Risk Index:</strong> <span style={{ color: "#34d399", fontWeight: "bold" }}>{viewingPilgrimModal.riskScore}</span></div>
                    <div><strong>Check-in:</strong> {viewingPilgrimModal.lastCheckin}</div>
                    <div><strong>Family Members Registered:</strong> {viewingPilgrimModal.familyMembers.length}</div>
                  </div>
                </div>

                {/* Family Members List */}
                <div>
                  <h4 style={{ color: "#38bdf8", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    👨‍👩‍👧‍👦 Registered Family Members ({viewingPilgrimModal.familyMembers.length})
                  </h4>

                  {viewingPilgrimModal.familyMembers.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      {viewingPilgrimModal.familyMembers.map((fm, idx) => (
                        <div key={fm._id || idx} style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "10px", padding: "16px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "15px", fontWeight: "bold", color: "#ffffff" }}>{fm.name}</span>
                            <span className="family-relation-tag">{fm.relationship || "Family Member"}</span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12.5px", color: "#94a3b8" }}>
                            <div><strong style={{ color: "#cbd5e1" }}>Age / Gender:</strong> {fm.age ? `${fm.age} Yrs` : "N/A"} {fm.gender ? `• ${fm.gender}` : ""}</div>
                            <div><strong style={{ color: "#cbd5e1" }}>Blood Group:</strong> <span style={{ color: "#f43f5e", fontWeight: "bold" }}>{fm.bloodGroup || "Not specified"}</span></div>
                            <div><strong style={{ color: "#cbd5e1" }}>Phone:</strong> {fm.phone || "Not provided"}</div>
                            <div><strong style={{ color: "#cbd5e1" }}>Emergency Contact:</strong> {fm.emergencyContactName ? `${fm.emergencyContactName} (${fm.emergencyContactPhone || ""})` : "Not specified"}</div>
                          </div>
                          {(fm.chronicConditions || (fm.existingConditions && fm.existingConditions.length > 0)) && (
                            <div style={{ marginTop: "10px", fontSize: "12.5px", color: "#fbbf24", background: "rgba(251, 191, 36, 0.1)", padding: "8px 12px", borderRadius: "6px" }}>
                              <strong>Medical History / Chronic Conditions:</strong> {fm.chronicConditions || fm.existingConditions.join(", ")}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "24px", color: "#64748b", background: "#0f172a", borderRadius: "10px", border: "1px dashed #334155" }}>
                      No family members added yet by this registered user.
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setViewingPilgrimModal(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enquiry Detail Modal */}
        {viewingEnquiryModal && (
          <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: "650px", width: "92%" }}>
              <div className="modal-header">
                <h3>📩 User Inquiry Details</h3>
                <button className="btn-close-modal" onClick={() => setViewingEnquiryModal(null)}>
                  <FiX />
                </button>
              </div>

              <div className="modal-body" style={{ padding: "20px" }}>
                <div style={{ background: "#1e293b", padding: "16px", borderRadius: "10px", border: "1px solid #334155", marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div>
                      <h4 style={{ margin: 0, color: "#f8fafc", fontSize: "16px" }}>{viewingEnquiryModal.name}</h4>
                      <a href={`mailto:${viewingEnquiryModal.email}`} style={{ color: "#60a5fa", fontSize: "13px", fontFamily: "monospace" }}>
                        {viewingEnquiryModal.email}
                      </a>
                    </div>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                      {new Date(viewingEnquiryModal.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ marginTop: "12px", borderTop: "1px solid #334155", paddingTop: "12px" }}>
                    <span style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "bold" }}>Pilgrimage Center / Subject</span>
                    <h4 style={{ margin: "4px 0 0 0", color: "#38bdf8", fontSize: "15px" }}>{viewingEnquiryModal.subject}</h4>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "bold" }}>Inquiry Message</span>
                  <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "10px", padding: "16px", marginTop: "6px", color: "#f1f5f9", fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                    {viewingEnquiryModal.message}
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => handleUpdateEnquiryStatus(viewingEnquiryModal._id, "Read")}
                    style={{ background: "#334155", color: "#fff" }}
                  >
                    Mark as Read
                  </button>
                  <button
                    type="button"
                    className="btn-submit-doctor"
                    onClick={() => handleUpdateEnquiryStatus(viewingEnquiryModal._id, "Replied")}
                    style={{ background: "#10b981" }}
                  >
                    Mark as Replied
                  </button>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="btn-submit-doctor"
                    onClick={() => handleOpenReplyFormModal(viewingEnquiryModal)}
                    style={{ background: "#2563eb", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <FiSend size={15} /> Compose Email Reply
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => handleOpenGmailWeb(viewingEnquiryModal)}
                    style={{ background: "rgba(16, 185, 129, 0.2)", color: "#34d399", border: "1px solid #10b981", cursor: "pointer" }}
                    title="Opens Gmail web compose directly in browser"
                  >
                    🌐 Open Web Gmail
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Direct Email Reply Modal */}
        {showReplyFormModal && replyingEnquiry && (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal-card" style={{ maxWidth: "680px", width: "92%" }}>
              <div className="modal-header">
                <h3>✉️ Compose Email Reply</h3>
                <button className="btn-close-modal" onClick={() => setShowReplyFormModal(false)}>
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSendDirectEmailReply}>
                <div className="modal-body" style={{ padding: "20px" }}>
                  <div style={{ background: "#1e293b", padding: "14px", borderRadius: "10px", border: "1px solid #334155", marginBottom: "16px" }}>
                    <div style={{ fontSize: "13px", color: "#cbd5e1", marginBottom: "6px" }}>
                      <strong>To:</strong> <span style={{ color: "#60a5fa", fontFamily: "monospace", fontSize: "14px" }}>{replyingEnquiry.email}</span> ({replyingEnquiry.name})
                    </div>
                    <div style={{ fontSize: "13px", color: "#cbd5e1" }}>
                      <strong>Subject:</strong> {replySubjectText}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: "14px" }}>
                    <label style={{ color: "#f8fafc", fontWeight: "700", marginBottom: "6px", display: "block" }}>
                      Email Subject
                    </label>
                    <input
                      type="text"
                      value={replySubjectText}
                      onChange={(e) => setReplySubjectText(e.target.value)}
                      required
                      style={{ background: "#0f172a", border: "1px solid #334155", color: "#ffffff", padding: "10px 14px", borderRadius: "8px", width: "100%" }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ color: "#f8fafc", fontWeight: "700", marginBottom: "6px", display: "block" }}>
                      Your Reply Message
                    </label>
                    <textarea
                      rows="8"
                      value={replyMessageText}
                      onChange={(e) => setReplyMessageText(e.target.value)}
                      required
                      placeholder="Type your response here..."
                      style={{ background: "#0f172a", border: "1px solid #334155", color: "#ffffff", padding: "12px 14px", borderRadius: "8px", width: "100%", fontFamily: "inherit", fontSize: "14px", lineHeight: "1.6" }}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer" style={{ justifyContent: "space-between" }}>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowReplyFormModal(false)}
                    disabled={sendingReply}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit-doctor"
                    disabled={sendingReply}
                    style={{ background: "#2563eb", display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    {sendingReply ? "Dispatching Email..." : "📨 Send Reply Email"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Sent Reply Modal */}
        {viewingReplyModal && (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal-card" style={{ maxWidth: "680px", width: "92%", background: "#0f172a", color: "#f8fafc", border: "1px solid #1e293b", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)" }}>
              <div className="modal-header" style={{ borderBottom: "1px solid #1e293b", padding: "16px 20px" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "#34d399", margin: 0 }}>
                  💬 Sent Admin Response Details
                </h3>
                <button className="btn-close-modal" onClick={() => setViewingReplyModal(null)} style={{ color: "#94a3b8" }}>
                  <FiX />
                </button>
              </div>

              <div className="modal-body" style={{ padding: "20px", background: "#0f172a" }}>
                <div style={{ background: "#1e293b", padding: "14px 18px", borderRadius: "10px", border: "1px solid #334155", marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <span style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "bold" }}>Recipient</span>
                      <div style={{ color: "#ffffff", fontWeight: "700", fontSize: "15px" }}>{viewingReplyModal.name}</div>
                      <div style={{ color: "#60a5fa", fontFamily: "monospace", fontSize: "13.5px" }}>{viewingReplyModal.email}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className="status-pill success" style={{ background: "rgba(16, 185, 129, 0.2)", color: "#34d399", border: "1px solid #10b981", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700 }}>
                        ✅ Status: Replied
                      </span>
                      <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px" }}>
                        Sent: {viewingReplyModal.repliedAt ? new Date(viewingReplyModal.repliedAt).toLocaleString() : new Date(viewingReplyModal.updatedAt || viewingReplyModal.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: "10px", borderTop: "1px solid #334155", paddingTop: "10px" }}>
                    <span style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "bold" }}>Subject</span>
                    <div style={{ color: "#38bdf8", fontWeight: "600", fontSize: "14px" }}>{viewingReplyModal.subject}</div>
                  </div>
                </div>

                <div style={{ marginBottom: "18px" }}>
                  <span style={{ fontSize: "12px", color: "#34d399", textTransform: "uppercase", fontWeight: "bold", display: "block", marginBottom: "6px" }}>
                    📨 Admin Response Message Sent To User
                  </span>
                  <div style={{ background: "#1e293b", borderLeft: "4px solid #10b981", border: "1px solid #334155", borderLeftWidth: "4px", borderRadius: "8px", padding: "16px", color: "#ffffff", fontSize: "14.5px", lineHeight: "1.6", whiteSpace: "pre-wrap", fontWeight: "500" }}>
                    {viewingReplyModal.adminReply || `Hello ${viewingReplyModal.name},\n\nThank you for contacting PilgrimIQ Support. Your inquiry has been reviewed and responded to by our administration team.`}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "bold", display: "block", marginBottom: "6px" }}>
                    📩 Original User Inquiry
                  </span>
                  <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "14px", color: "#cbd5e1", fontSize: "13.5px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                    "{viewingReplyModal.message}"
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ justifyContent: "space-between", background: "#0f172a", borderTop: "1px solid #1e293b", padding: "16px 20px" }}>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setViewingReplyModal(null)}
                  style={{ background: "#334155", color: "#ffffff", border: "none", padding: "9px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
                >
                  Close
                </button>

                <button
                  type="button"
                  className="btn-submit-doctor"
                  onClick={() => {
                    setViewingReplyModal(null);
                    handleOpenReplyFormModal(viewingReplyModal);
                  }}
                  style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "9px 18px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontWeight: "700" }}
                >
                  ✉️ Send Follow-Up Reply
                </button>
              </div>
            </div>
          </div>
        )}

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
                      <label style={{ color: "#000000", fontWeight: "800" }}>Email Address *</label>
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

        {/* Admin AI Medical Report Detail Modal */}
        {viewingReportModal && (
          <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: "700px", width: "90%" }}>
              <div className="modal-header">
                <h3 style={{ color: "#38bdf8", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FiFileText /> AI Medical Report Analysis Audit
                </h3>
                <button className="btn-close-modal" onClick={() => setViewingReportModal(null)}>
                  <FiX />
                </button>
              </div>

              <div className="modal-body" style={{ maxHeight: "75vh", overflowY: "auto" }}>
                <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                  <div style={{ fontSize: "16px", fontWeight: "800", color: "#f8fafc" }}>
                    {viewingReportModal.ownerType === "family_member" && viewingReportModal.familyMemberId
                      ? viewingReportModal.familyMemberId.name
                      : viewingReportModal.userId?.name || "Pilgrim Patient"}
                  </div>
                  <div style={{ fontSize: "13px", color: "#60a5fa", marginTop: "2px" }}>
                    {viewingReportModal.ownerType === "family_member" && viewingReportModal.familyMemberId
                      ? `Family Member (${viewingReportModal.familyMemberId.relationship || "Relative"})`
                      : "Main Registered User"} • User Account: {viewingReportModal.userId?.email || "N/A"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                    File: <strong>{viewingReportModal.fileName}</strong> • Uploaded: {new Date(viewingReportModal.createdAt).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ background: "rgba(30, 58, 138, 0.2)", border: "1px solid #1e40af", padding: "12px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "11px", color: "#93c5fd", textTransform: "uppercase", fontWeight: "700" }}>PSI Score & Risk Assessment</div>
                    <div style={{ fontSize: "20px", fontWeight: "900", color: "#38bdf8", marginTop: "4px" }}>
                      PSI: {viewingReportModal.psiScore || 75} / 100
                    </div>
                    <div style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "4px", fontWeight: "700" }}>
                      Status: {viewingReportModal.aiRiskAssessment?.overallStatus || viewingReportModal.finalStatus || "LOW_RISK"}
                    </div>
                  </div>

                  <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid #334155", padding: "12px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "700" }}>Doctor Clearance Status</div>
                    <div style={{ fontSize: "16px", fontWeight: "800", color: viewingReportModal.physicianReview?.status === "approved" ? "#34d399" : viewingReportModal.physicianReview?.status === "rejected" ? "#f87171" : "#fbbf24", marginTop: "6px" }}>
                      {(viewingReportModal.physicianReview?.status || viewingReportModal.doctorDecision || "Not Required").toUpperCase()}
                    </div>
                    {viewingReportModal.physicianReview?.comments && (
                      <div style={{ fontSize: "11.5px", color: "#cbd5e1", marginTop: "4px" }}>
                        Note: "{viewingReportModal.physicianReview.comments}"
                      </div>
                    )}
                  </div>
                </div>

                {viewingReportModal.aiSummary && (
                  <div style={{ marginBottom: "16px" }}>
                    <h4 style={{ color: "#f8fafc", fontSize: "14px", marginBottom: "6px" }}>AI Report Executive Summary</h4>
                    <div style={{ background: "#0f172a", padding: "12px", borderRadius: "8px", border: "1px solid #1e293b", fontSize: "13px", color: "#cbd5e1" }}>
                      {viewingReportModal.aiSummary}
                    </div>
                  </div>
                )}

                {viewingReportModal.extractedEntities?.conditions?.length > 0 && (
                  <div style={{ marginBottom: "16px" }}>
                    <h4 style={{ color: "#f8fafc", fontSize: "14px", marginBottom: "6px" }}>Detected Clinical Conditions (OCR Extracted)</h4>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {viewingReportModal.extractedEntities.conditions.map((c, i) => (
                        <span key={i} style={{ background: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "1px solid #dc2626", padding: "3px 10px", borderRadius: "15px", fontSize: "12px", fontWeight: "700" }}>
                          ⚠️ {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setViewingReportModal(null)}>
                  Close Audit View
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
