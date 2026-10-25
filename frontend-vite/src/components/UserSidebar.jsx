import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Profile.css";
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
  FiHelpCircle,
  FiChevronLeft,
  FiChevronRight
} from "react-icons/fi";

function UserSidebar({ activeTab = "" }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <aside
      className={`pilgrim-sidebar ${sidebarOpen ? "open" : "collapsed"}`}
      onClick={(e) => {
        // Expand on mobile if user taps directly on the collapsed sidebar body (not on an action button)
        if (!sidebarOpen && typeof window !== "undefined" && window.innerWidth <= 768) {
          if (!e.target.closest(".sidebar-link") && !e.target.closest(".sidebar-collapse-toggle-btn")) {
            setSidebarOpen(true);
          }
        }
      }}
      aria-label="User navigation sidebar"
    >
      {/* Mobile Collapse / Expand Control */}
      <div className="sidebar-mobile-toggle-bar">
        <button
          type="button"
          className="sidebar-collapse-toggle-btn"
          onClick={(e) => {
            e.stopPropagation();
            setSidebarOpen((prev) => !prev);
          }}
          aria-label={sidebarOpen ? "Collapse sidebar menu" : "Expand sidebar menu"}
          title={sidebarOpen ? "Collapse sidebar menu" : "Expand sidebar menu"}
        >
          {sidebarOpen ? (
            <>
              <FiChevronLeft className="toggle-icon" />
              <span className="toggle-label">Collapse Menu</span>
            </>
          ) : (
            <FiChevronRight className="toggle-icon" />
          )}
        </button>
      </div>

      <nav className="sidebar-nav">
        <button
          type="button"
          className={`sidebar-link ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => {
            navigate("/profile");
            if (typeof window !== "undefined" && window.innerWidth <= 768) {
              setSidebarOpen(false);
            }
          }}
          title="My Profile"
          aria-label="My Profile"
        >
          <FiUser className="nav-icon" />
          <span>My Profile</span>
        </button>

        <button
          type="button"
          className={`sidebar-link ${activeTab === "family" ? "active" : ""}`}
          onClick={() => navigate("/profile?tab=family")}
          title="My Family"
          aria-label="My Family"
        >
          <FiUsers className="nav-icon" />
          <span>My Family</span>
        </button>

        <button
          type="button"
          className={`sidebar-link ${activeTab === "health" || activeTab === "medical-analysis" ? "active" : ""}`}
          onClick={() => navigate("/profile?tab=health")}
          title="Health Records"
          aria-label="Health Records"
        >
          <FiPlusSquare className="nav-icon" />
          <span>Health Records</span>
        </button>

        <button
          type="button"
          className={`sidebar-link ${activeTab === "journey" || activeTab === "journey-planner" ? "active" : ""}`}
          onClick={() => navigate("/my-journeys")}
          title="Journey Planner"
          aria-label="Journey Planner"
        >
          <FiCompass className="nav-icon" />
          <span>Journey Planner</span>
        </button>

        <button
          type="button"
          className={`sidebar-link ${activeTab === "bookings" ? "active" : ""}`}
          onClick={() => navigate("/bookings")}
          title="Bookings"
          aria-label="Bookings"
        >
          <FiCalendar className="nav-icon" />
          <span>Bookings</span>
        </button>

        <button
          type="button"
          className={`sidebar-link ${activeTab === "emergency" ? "active" : ""}`}
          onClick={() => navigate("/profile?tab=emergency")}
          title="Emergency Services"
          aria-label="Emergency Services"
        >
          <FiShield className="nav-icon" style={{ color: activeTab === "emergency" ? "#ef4444" : "inherit" }} />
          <span>Emergency Services</span>
        </button>

        <button
          type="button"
          className={`sidebar-link ${activeTab === "journey-assistance" ? "active" : ""}`}
          onClick={() => navigate("/journey-assistance")}
          title="Journey Assistance"
          aria-label="Journey Assistance"
        >
          <FiShield className="nav-icon" />
          <span>Journey Assistance</span>
        </button>

        <button
          type="button"
          className={`sidebar-link ${activeTab === "journey-assistant" || activeTab === "ai-journey-assistant" ? "active" : ""}`}
          onClick={() => navigate("/journey-assistant")}
          title="AI Journey Assistant"
          aria-label="AI Journey Assistant"
        >
          <FiCpu className="nav-icon" style={{ color: activeTab === "journey-assistant" || activeTab === "ai-journey-assistant" ? "#38bdf8" : "inherit" }} />
          <span>AI Journey Assistant</span>
        </button>

        <button
          type="button"
          className={`sidebar-link ${activeTab === "family-tracking" ? "active" : ""}`}
          onClick={() => navigate("/family-tracking")}
          title="Family Tracking"
          aria-label="Family Tracking"
        >
          <FiWifi className="nav-icon" />
          <span>Family Tracking</span>
        </button>

        <button
          type="button"
          className={`sidebar-link ${activeTab === "community" ? "active" : ""}`}
          onClick={() => navigate("/profile")}
          title="Community Help"
          aria-label="Community Help"
        >
          <FiUsers className="nav-icon" />
          <span>Community Help</span>
        </button>

        <button
          type="button"
          className={`sidebar-link ${activeTab === "feedback" ? "active" : ""}`}
          onClick={() => navigate("/profile")}
          title="My Feedback"
          aria-label="My Feedback"
        >
          <FiMessageSquare className="nav-icon" />
          <span>My Feedback</span>
        </button>

        <button
          type="button"
          className={`sidebar-link ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => navigate("/settings")}
          title="Settings"
          aria-label="Settings"
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
          title="Logout"
          aria-label="Logout"
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
