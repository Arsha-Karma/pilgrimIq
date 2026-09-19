import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiUser,
  FiUsers,
  FiPlusSquare,
  FiCompass,
  FiCalendar,
  FiShield,
  FiCpu,
  FiWifi,
  FiMessageSquare,
  FiSettings,
  FiLogOut,
  FiHelpCircle
} from "react-icons/fi";

function UserSidebar({ activeTab = "" }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <aside className="pilgrim-sidebar">
      <nav className="sidebar-nav">
        <button
          type="button"
          className={`sidebar-link ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => navigate("/profile")}
        >
          <FiUser className="nav-icon" />
          <span>My Profile</span>
        </button>

        <button
          type="button"
          className={`sidebar-link ${activeTab === "family" ? "active" : ""}`}
          onClick={() => navigate("/profile?tab=family")}
        >
          <FiUsers className="nav-icon" />
          <span>My Family</span>
        </button>

        <button
          type="button"
          className={`sidebar-link ${activeTab === "health" || activeTab === "medical-analysis" ? "active" : ""}`}
          onClick={() => navigate("/profile")}
        >
          <FiPlusSquare className="nav-icon" />
          <span>Health Records</span>
        </button>

        <button
          type="button"
          className={`sidebar-link ${activeTab === "journey" || activeTab === "journey-planner" ? "active" : ""}`}
          onClick={() => navigate("/my-journeys")}
        >
          <FiCompass className="nav-icon" />
          <span>Journey Planner</span>
        </button>

        <button
          type="button"
          className={`sidebar-link ${activeTab === "bookings" ? "active" : ""}`}
          onClick={() => navigate("/bookings")}
        >
          <FiCalendar className="nav-icon" />
          <span>Bookings</span>
        </button>

        <button
          type="button"
          className={`sidebar-link ${activeTab === "emergency" ? "active" : ""}`}
          onClick={() => navigate("/profile?tab=emergency")}
        >
          <FiShield className="nav-icon" style={{ color: activeTab === "emergency" ? "#ef4444" : "inherit" }} />
          <span>Emergency Services</span>
        </button>

        <button
          type="button"
          className={`sidebar-link ${activeTab === "journey-assistance" ? "active" : ""}`}
          onClick={() => navigate("/journey-assistance")}
        >
          <FiShield className="nav-icon" />
          <span>Journey Assistance</span>
        </button>

        <button
          type="button"
          className={`sidebar-link ${activeTab === "journey-assistant" || activeTab === "ai-journey-assistant" ? "active" : ""}`}
          onClick={() => navigate("/journey-assistant")}
        >
          <FiCpu className="nav-icon" style={{ color: activeTab === "journey-assistant" || activeTab === "ai-journey-assistant" ? "#38bdf8" : "inherit" }} />
          <span>AI Journey Assistant</span>
        </button>

        <button
          type="button"
          className={`sidebar-link ${activeTab === "family-tracking" ? "active" : ""}`}
          onClick={() => navigate("/profile")}
        >
          <FiWifi className="nav-icon" />
          <span>Family Tracking</span>
        </button>

        <button
          type="button"
          className={`sidebar-link ${activeTab === "community" ? "active" : ""}`}
          onClick={() => navigate("/profile")}
        >
          <FiUsers className="nav-icon" />
          <span>Community Help</span>
        </button>

        <button
          type="button"
          className={`sidebar-link ${activeTab === "feedback" ? "active" : ""}`}
          onClick={() => navigate("/profile")}
        >
          <FiMessageSquare className="nav-icon" />
          <span>My Feedback</span>
        </button>

        <button
          type="button"
          className={`sidebar-link ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => navigate("/settings")}
        >
          <FiSettings className="nav-icon" />
          <span>Settings</span>
        </button>

        <button
          type="button"
          className="sidebar-link logout-btn"
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          <FiLogOut className="nav-icon" />
          <span>Logout</span>
        </button>
      </nav>

      <div className="sidebar-help-card">
        <div className="help-icon-circle">
          <FiHelpCircle size={20} />
        </div>
        <h4>Need Support?</h4>
        <p>Our 24/7 Pilgrim Emergency Helpline is ready to assist you anytime.</p>
        <a href="tel:108" className="btn-contact-support">
          Call Helpline (108)
        </a>
      </div>
    </aside>
  );
}

export default UserSidebar;
