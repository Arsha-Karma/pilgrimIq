import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  apiGetProfile,
  apiUpdateProfile,
  apiAddFamilyMember,
  apiUpdateFamilyMember,
  apiDeleteFamilyMember,
} from "../services/api";
import "../styles/Profile.css";
import logo from "../assets/pilgrim-logo.png";
import {
  FiUser,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiPhone,
  FiActivity,
  FiDroplet,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
} from "react-icons/fi";

const RELATIONSHIPS = ["Spouse", "Child", "Parent", "Sibling", "Grandparent", "Relative", "Friend", "Other"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown"];

function Profile() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Modal State for Family Member
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [memberForm, setMemberForm] = useState({
    name: "",
    relationship: "Spouse",
    age: "",
    gender: "Male",
    phone: "",
    bloodGroup: "O+",
    medicalConditions: "",
  });

  const [alert, setAlert] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await apiGetProfile(token);
        setProfileData(data);
        setFamilyMembers(data.familyMembers || []);
        setEditName(data.name || "");
        setEditPhone(data.phone || "");
      } catch (err) {
        setAlert({ type: "error", message: err.message || "Failed to load profile data." });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert({ type: "", message: "" });
    }, 4000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const updated = await apiUpdateProfile({ name: editName, phone: editPhone }, token);
      setProfileData(updated);
      setIsEditingProfile(false);
      showAlert("success", "Profile details updated successfully!");
    } catch (err) {
      showAlert("error", err.message || "Failed to update profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const openAddModal = () => {
    setEditingMemberId(null);
    setMemberForm({
      name: "",
      relationship: "Spouse",
      age: "",
      gender: "Male",
      phone: "",
      bloodGroup: "O+",
      medicalConditions: "",
    });
    setShowMemberModal(true);
  };

  const openEditModal = (member) => {
    setEditingMemberId(member._id);
    setMemberForm({
      name: member.name || "",
      relationship: member.relationship || "Spouse",
      age: member.age !== null && member.age !== undefined ? String(member.age) : "",
      gender: member.gender || "Male",
      phone: member.phone || "",
      bloodGroup: member.bloodGroup || "O+",
      medicalConditions: member.medicalConditions || "",
    });
    setShowMemberModal(true);
  };

  const handleMemberSubmit = async (e) => {
    e.preventDefault();
    if (!memberForm.name.trim()) {
      showAlert("error", "Member name is required.");
      return;
    }

    try {
      setSubmitting(true);
      let res;
      if (editingMemberId) {
        res = await apiUpdateFamilyMember(editingMemberId, memberForm, token);
        showAlert("success", "Family member updated successfully!");
      } else {
        res = await apiAddFamilyMember(memberForm, token);
        showAlert("success", "Family member added successfully!");
      }

      if (res && res.familyMembers) {
        setFamilyMembers(res.familyMembers);
      }
      setShowMemberModal(false);
    } catch (err) {
      showAlert("error", err.message || "Failed to save family member.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from your family members?`)) {
      return;
    }

    try {
      const res = await apiDeleteFamilyMember(memberId, token);
      showAlert("success", `${memberName} was removed.`);
      if (res && res.familyMembers) {
        setFamilyMembers(res.familyMembers);
      }
    } catch (err) {
      showAlert("error", err.message || "Failed to delete family member.");
    }
  };

  if (loading) {
    return (
      <div className="profile-page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <p style={{ fontSize: "18px", color: "#0b2d72", fontWeight: "700" }}>Loading Profile...</p>
      </div>
    );
  }

  const initialLetter = profileData?.name ? profileData.name.charAt(0).toUpperCase() : (profileData?.email ? profileData.email.charAt(0).toUpperCase() : "U");

  return (
    <div className="profile-page">
      {/* Standard PilgrimIQ Navigation Bar */}
      <nav className="profile-navbar">
        <Link to="/" className="profile-logo">
          <img src={logo} alt="PilgrimIQ Logo" />
          <div className="profile-logo-text">
            <h2>PilgrimIQ</h2>
            <p>Plan Smart. Travel Safe. Stay Blessed.</p>
          </div>
        </Link>

        <ul className="profile-nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About Us</Link></li>
          <li><Link to="/features">Features</Link></li>
          <li><Link to="/centers">Pilgrimage Centers</Link></li>
          <li><Link to="/services">Services</Link></li>
          <li><Link to="/how-it-works">How It Works</Link></li>
          <li><Link to="/contact">Contact</Link></li>
        </ul>

        <div className="profile-nav-buttons">
          {user ? (
            <div style={{ position: "relative", display: "inline-block" }}>
              <div
                onClick={() => setShowProfileMenu((prev) => !prev)}
                title="Click to view profile menu"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  backgroundColor: "#123A7A",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "19px",
                  boxShadow: "0 4px 12px rgba(18, 58, 122, 0.35)",
                  border: "2px solid #ffffff",
                  cursor: "pointer",
                  userSelect: "none",
                  transition: "transform 0.2s ease",
                }}
              >
                {initialLetter}
              </div>

              {showProfileMenu && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "54px",
                    backgroundColor: "#ffffff",
                    borderRadius: "14px",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.18)",
                    border: "1px solid #E5E7EB",
                    padding: "16px",
                    minWidth: "220px",
                    zIndex: 1000,
                  }}
                >
                  <div style={{ marginBottom: "12px", borderBottom: "1px solid #F3F4F6", paddingBottom: "10px" }}>
                    <p style={{ fontWeight: "700", color: "#123A7A", fontSize: "15px", margin: 0 }}>
                      {user.name || "Pilgrim User"}
                    </p>
                    <p style={{ color: "#6B7280", fontSize: "13px", margin: "4px 0 0 0", wordBreak: "break-all" }}>
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                      navigate("/");
                    }}
                    style={{
                      width: "100%",
                      backgroundColor: "#dc2626",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "background-color 0.2s ease",
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="about-login-btn">Login</Link>
              <Link to="/register" className="about-signup-btn">Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="profile-hero">
        <div className="profile-hero-container">
          <span className="profile-badge">👤 MY PROFILE & FAMILY</span>
          <div className="profile-user-card-hero">
            <div className="profile-avatar-circle-hero">{initialLetter}</div>
            <div className="profile-user-details-hero">
              <h1>{profileData?.name || "Pilgrim Profile"}</h1>
              <p>{profileData?.email}</p>
              <span className="profile-user-role-tag">{profileData?.role || "Pilgrim User"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Page Content */}
      <div className="profile-body-container">
        {/* Alert Notification */}
        {alert.message && (
          <div className={`profile-alert ${alert.type}`}>
            {alert.type === "success" ? <FiCheckCircle style={{ marginRight: 8 }} /> : <FiAlertCircle style={{ marginRight: 8 }} />}
            {alert.message}
          </div>
        )}

        {/* Account Information Card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h2 className="profile-card-title">
              <FiUser /> Account Information
            </h2>
            {!isEditingProfile && (
              <button className="btn-icon-action edit" onClick={() => setIsEditingProfile(true)} title="Edit Profile Details">
                <FiEdit2 size={18} />
              </button>
            )}
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleProfileUpdate}>
              <div className="form-grid" style={{ marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn-cancel" onClick={() => setIsEditingProfile(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Full Name</span>
                <span className="info-value">{profileData?.name || "N/A"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email Address</span>
                <span className="info-value">{profileData?.email || "N/A"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone Number</span>
                <span className="info-value">{profileData?.phone || "Not provided"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Auth Provider</span>
                <span className="info-value" style={{ textTransform: "capitalize" }}>
                  {profileData?.authProvider || "local"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Family Members Section */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h2 className="profile-card-title">
              <FiUsers /> Family Members ({familyMembers.length})
            </h2>
            <button className="btn-primary-action" onClick={openAddModal}>
              <FiPlus /> Add Member
            </button>
          </div>

          {familyMembers.length === 0 ? (
            <div className="family-empty-state">
              <div className="family-empty-icon">👨‍👩‍👧‍👦</div>
              <h3>No Family Members Added</h3>
              <p>Add your family members to manage their health safety profiles & pilgrim itineraries together.</p>
              <button className="btn-primary-action" onClick={openAddModal}>
                <FiPlus /> Add First Member
              </button>
            </div>
          ) : (
            <div className="family-grid">
              {familyMembers.map((member) => (
                <div key={member._id} className="family-card">
                  <div>
                    <div className="family-card-header">
                      <div className="member-identity">
                        <div className="member-avatar">
                          {member.name ? member.name.charAt(0).toUpperCase() : "M"}
                        </div>
                        <div className="member-name-group">
                          <h3>{member.name}</h3>
                          <span className="member-rel-badge">{member.relationship}</span>
                        </div>
                      </div>
                      <div className="family-actions">
                        <button className="btn-icon-action edit" onClick={() => openEditModal(member)} title="Edit Member">
                          <FiEdit2 size={16} />
                        </button>
                        <button className="btn-icon-action delete" onClick={() => handleDeleteMember(member._id, member.name)} title="Remove Member">
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="member-details-list">
                      <div className="detail-row">
                        <FiUser /> <span>{member.gender || "N/A"}{member.age ? `, ${member.age} yrs` : ""}</span>
                      </div>
                      {member.phone && (
                        <div className="detail-row">
                          <FiPhone /> <span>{member.phone}</span>
                        </div>
                      )}
                      {member.bloodGroup && (
                        <div className="detail-row">
                          <FiDroplet style={{ color: "#dc2626" }} />
                          <span>Blood Group: <strong className="blood-badge">{member.bloodGroup}</strong></span>
                        </div>
                      )}
                      {member.medicalConditions && (
                        <div className="medical-tag">
                          <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                            <FiActivity /> Medical Conditions:
                          </div>
                          <div>{member.medicalConditions}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Family Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                <FiUsers /> {editingMemberId ? "Edit Family Member" : "Add Family Member"}
              </h2>
              <button className="btn-close-modal" onClick={() => setShowMemberModal(false)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleMemberSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Ramesh Sharma"
                      value={memberForm.name}
                      onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Relationship *</label>
                    <select
                      className="form-select"
                      value={memberForm.relationship}
                      onChange={(e) => setMemberForm({ ...memberForm, relationship: e.target.value })}
                    >
                      {RELATIONSHIPS.map((rel) => (
                        <option key={rel} value={rel}>{rel}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select
                      className="form-select"
                      value={memberForm.gender}
                      onChange={(e) => setMemberForm({ ...memberForm, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Age (Years)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 45"
                      min="0"
                      max="120"
                      value={memberForm.age}
                      onChange={(e) => setMemberForm({ ...memberForm, age: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <select
                      className="form-select"
                      value={memberForm.bloodGroup}
                      onChange={(e) => setMemberForm({ ...memberForm, bloodGroup: e.target.value })}
                    >
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Emergency Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="10-digit phone number"
                      value={memberForm.phone}
                      onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Medical Conditions / Health Notes</label>
                    <textarea
                      className="form-textarea"
                      placeholder="e.g. Asthma, Diabetes, High Blood Pressure, Allergies (or None)"
                      value={memberForm.medicalConditions}
                      onChange={(e) => setMemberForm({ ...memberForm, medicalConditions: e.target.value })}
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowMemberModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? "Saving..." : editingMemberId ? "Update Member" : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
