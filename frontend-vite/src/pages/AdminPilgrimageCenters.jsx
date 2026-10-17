import React, { useState, useEffect, useCallback } from "react";
import "../styles/AdminPilgrimageCenters.css";
import {
  apiGetPilgrimageCenters,
  apiCreatePilgrimageCenter,
  apiUpdatePilgrimageCenter,
  apiDeletePilgrimageCenter,
  apiUpdatePilgrimageCenterStatus,
} from "../services/api";
import PilgrimageCenterForm from "../components/PilgrimageCenterForm";
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiMapPin,
  FiActivity,
  FiCalendar,
  FiX,
  FiAlertTriangle,
  FiClock,
  FiInfo
} from "react-icons/fi";

function AdminPilgrimageCenters({ token, showAlert }) {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [religionFilter, setReligionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [viewingCenter, setViewingCenter] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm Modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    centerId: null,
    centerName: "",
  });

  // Fetch centers on mount or filter change
  const fetchCenters = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = {
        search: searchTerm,
        religion: religionFilter !== "All" ? religionFilter : "",
        status: statusFilter !== "all" ? statusFilter : "",
      };
      const data = await apiGetPilgrimageCenters(queryParams, token);
      setCenters(data || []);
    } catch (err) {
      console.error("Failed to load centers:", err);
      if (showAlert) showAlert("error", err.message || "Failed to load pilgrimage centers.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, religionFilter, statusFilter, token, showAlert]);

  useEffect(() => {
    fetchCenters();
  }, [fetchCenters]);

  // Handle Create Center Submit
  const handleCreateSubmit = async (formData) => {
    try {
      setSubmitting(true);
      await apiCreatePilgrimageCenter(formData, token);
      if (showAlert) showAlert("success", `Pilgrimage center "${formData.name}" created successfully!`);
      setShowAddModal(false);
      fetchCenters();
    } catch (err) {
      if (showAlert) showAlert("error", err.message || "Failed to create pilgrimage center.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Center Submit
  const handleEditSubmit = async (formData) => {
    if (!editingCenter) return;
    try {
      setSubmitting(true);
      await apiUpdatePilgrimageCenter(editingCenter._id, formData, token);
      if (showAlert) showAlert("success", `Pilgrimage center "${formData.name}" updated successfully!`);
      setEditingCenter(null);
      fetchCenters();
    } catch (err) {
      if (showAlert) showAlert("error", err.message || "Failed to update pilgrimage center.");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active/Inactive Status
  const handleToggleStatus = async (center) => {
    try {
      const newStatus = !center.isActive;
      await apiUpdatePilgrimageCenterStatus(center._id, newStatus, token);
      if (showAlert) {
        showAlert(
          "success",
          `"${center.name}" status updated to ${newStatus ? "Active" : "Inactive"}.`
        );
      }
      fetchCenters();
    } catch (err) {
      if (showAlert) showAlert("error", err.message || "Failed to update status.");
    }
  };

  // Delete Center Confirm
  const handleDeleteConfirm = async () => {
    if (!deleteModal.centerId) return;
    try {
      setSubmitting(true);
      await apiDeletePilgrimageCenter(deleteModal.centerId, token);
      if (showAlert) showAlert("success", `"${deleteModal.centerName}" has been permanently deleted.`);
      setDeleteModal({ isOpen: false, centerId: null, centerName: "" });
      fetchCenters();
    } catch (err) {
      if (showAlert) showAlert("error", err.message || "Failed to delete center.");
    } finally {
      setSubmitting(false);
    }
  };

  // Compute stats
  const totalCount = centers.length;
  const activeCount = centers.filter((c) => c.isActive).length;
  const inactiveCount = centers.filter((c) => !c.isActive).length;

  return (
    <div className="admin-centers-container">
      {/* HEADER ROW */}
      <div className="admin-centers-header">
        <div className="title-group">
          <h1>Pilgrimage Center Management</h1>
          <p>Create, update, monitor, and manage official pilgrimage destinations and safety parameters</p>
        </div>
        <button className="btn-add-center-primary" onClick={() => setShowAddModal(true)}>
          <FiPlus size={18} /> Add Pilgrimage Center
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="centers-stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon"><FiMapPin /></div>
          <div className="stat-info">
            <span className="stat-val">{totalCount}</span>
            <span className="stat-lbl">Total Pilgrimage Centers</span>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon"><FiCheckCircle /></div>
          <div className="stat-info">
            <span className="stat-val">{activeCount}</span>
            <span className="stat-lbl">Active & Visible to Pilgrims</span>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon"><FiXCircle /></div>
          <div className="stat-info">
            <span className="stat-val">{inactiveCount}</span>
            <span className="stat-lbl">Inactive / Draft Centers</span>
          </div>
        </div>
      </div>

      {/* FILTERS & SEARCH ROW */}
      <div className="centers-filter-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search centers by name, city, state, or religion..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="btn-clear-search" onClick={() => setSearchTerm("")}>
              <FiX />
            </button>
          )}
        </div>

        <div className="filter-controls">
          <div className="filter-item">
            <label><FiFilter /> Religion:</label>
            <select value={religionFilter} onChange={(e) => setReligionFilter(e.target.value)}>
              <option value="All">All Religions</option>
              <option value="Hindu">Hindu</option>
              <option value="Christian">Christian</option>
              <option value="Muslim">Muslim</option>
              <option value="Buddhist">Buddhist</option>
              <option value="Jain">Jain</option>
              <option value="Sikh">Sikh</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Status:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* CENTERS TABLE */}
      <div className="centers-table-card">
        {loading ? (
          <div className="loading-state-box">
            <div className="spinner"></div>
            <p>Loading pilgrimage centers...</p>
          </div>
        ) : centers.length === 0 ? (
          <div className="empty-centers-state">
            <div className="empty-icon">⛩️</div>
            <h3>No pilgrimage centers found</h3>
            <p>No records match your search query or filter selection.</p>
            <button className="btn-add-center-primary" onClick={() => setShowAddModal(true)} style={{ marginTop: "12px" }}>
              <FiPlus /> Add New Center
            </button>
          </div>
        ) : (
          <table className="admin-centers-table">
            <thead>
              <tr>
                <th>Center Details</th>
                <th>Religion</th>
                <th>Location</th>
                <th>Walking Difficulty</th>
                <th>Status</th>
                <th>Created Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {centers.map((center) => (
                <tr key={center._id} className={!center.isActive ? "row-inactive" : ""}>
                  <td className="col-center-info">
                    <img
                      src={center.image || "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?q=80&w=300&auto=format&fit=crop"}
                      alt={center.name}
                      className="center-thumb-img"
                    />
                    <div>
                      <span className="center-name-text">{center.name}</span>
                      <span className="center-sub-text">{center.visitingInformation?.bestSeason || "All Year"}</span>
                    </div>
                  </td>

                  <td>
                    <span className="admin-religion-badge">{center.religion || "Hindu"}</span>
                  </td>

                  <td>
                    <div className="location-cell">
                      <FiMapPin size={13} style={{ color: "#2563eb" }} />
                      <span>{center.location?.city}, {center.location?.state}</span>
                    </div>
                  </td>

                  <td>
                    <span className={`diff-tag ${center.difficulty?.walking?.toLowerCase()}`}>
                      {center.difficulty?.walking || "Moderate"}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className={`status-toggle-btn ${center.isActive ? "active" : "inactive"}`}
                      onClick={() => handleToggleStatus(center)}
                      title={center.isActive ? "Click to Deactivate" : "Click to Activate"}
                    >
                      {center.isActive ? <FiCheckCircle /> : <FiXCircle />}
                      <span>{center.isActive ? "Active" : "Inactive"}</span>
                    </button>
                  </td>

                  <td className="col-date">
                    <FiCalendar size={13} style={{ color: "#64748b", marginRight: 4 }} />
                    {new Date(center.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>

                  <td style={{ textAlign: "right" }}>
                    <div className="action-buttons-group">
                      <button
                        className="btn-act view"
                        title="View Full Details"
                        onClick={() => setViewingCenter(center)}
                      >
                        <FiEye size={15} />
                      </button>
                      <button
                        className="btn-act edit"
                        title="Edit Center"
                        onClick={() => setEditingCenter(center)}
                      >
                        <FiEdit2 size={15} />
                      </button>
                      <button
                        className="btn-act delete"
                        title="Delete Center"
                        onClick={() =>
                          setDeleteModal({
                            isOpen: true,
                            centerId: center._id,
                            centerName: center.name,
                          })
                        }
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ADD CENTER MODAL */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-box extra-large-modal">
            <div className="modal-header blue-header">
              <h3><FiPlus /> Add New Pilgrimage Center</h3>
              <button className="close-modal-btn" onClick={() => setShowAddModal(false)}>
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-body scrollable">
              <PilgrimageCenterForm
                onSubmit={handleCreateSubmit}
                onCancel={() => setShowAddModal(false)}
                submitting={submitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* EDIT CENTER MODAL */}
      {editingCenter && (
        <div className="modal-backdrop">
          <div className="modal-box extra-large-modal">
            <div className="modal-header blue-header">
              <h3><FiEdit2 /> Edit Pilgrimage Center — {editingCenter.name}</h3>
              <button className="close-modal-btn" onClick={() => setEditingCenter(null)}>
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-body scrollable">
              <PilgrimageCenterForm
                initialData={editingCenter}
                onSubmit={handleEditSubmit}
                onCancel={() => setEditingCenter(null)}
                submitting={submitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewingCenter && (
        <div className="modal-backdrop">
          <div className="modal-box large-modal">
            <div className="modal-header blue-header">
              <h3><FiEye /> Pilgrimage Center Details — {viewingCenter.name}</h3>
              <button className="close-modal-btn" onClick={() => setViewingCenter(null)}>
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-body scrollable">
              <div className="view-center-detail-hero">
                <img
                  src={viewingCenter.image || "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?q=80&w=800&auto=format&fit=crop"}
                  alt={viewingCenter.name}
                  className="view-hero-img"
                />
                <div className="view-hero-info">
                  <h2>{viewingCenter.name}</h2>
                  <div className="view-tags">
                    <span className="admin-religion-badge">{viewingCenter.religion || "Hindu"}</span>
                    <span className={`diff-tag ${viewingCenter.difficulty?.walking?.toLowerCase()}`}>
                      Walking: {viewingCenter.difficulty?.walking}
                    </span>
                    <span className={`status-badge ${viewingCenter.isActive ? "active" : "inactive"}`}>
                      {viewingCenter.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="view-loc"><FiMapPin /> {viewingCenter.location?.address}, {viewingCenter.location?.city}, {viewingCenter.location?.state}, {viewingCenter.location?.country} - {viewingCenter.location?.postalCode}</p>
                </div>
              </div>

              <div className="view-detail-grid">
                <div className="detail-card">
                  <h4><FiInfo /> Description</h4>
                  <p>{viewingCenter.description}</p>
                </div>

                <div className="detail-card">
                  <h4><FiClock /> Operating Timings & Season</h4>
                  <p><strong>Hours:</strong> {viewingCenter.timings?.openingTime} – {viewingCenter.timings?.closingTime}</p>
                  <p><strong>Weekly Closed:</strong> {viewingCenter.timings?.weeklyClosingDay}</p>
                  <p><strong>Best Season:</strong> {viewingCenter.visitingInformation?.bestSeason}</p>
                  <p><strong>Climate:</strong> {viewingCenter.visitingInformation?.climate}</p>
                  <p><strong>Crowd Level:</strong> {viewingCenter.visitingInformation?.crowdLevel}</p>
                </div>

                <div className="detail-card">
                  <h4><FiActivity /> Terrain & Difficulty</h4>
                  <p><strong>Walking Difficulty:</strong> {viewingCenter.difficulty?.walking}</p>
                  <p><strong>Climbing Difficulty:</strong> {viewingCenter.difficulty?.climbing}</p>
                  <p><strong>Walking Distance:</strong> {viewingCenter.difficulty?.walkingDistance || "N/A"}</p>
                  <p><strong>Steps:</strong> {viewingCenter.difficulty?.numberOfSteps || "N/A"}</p>
                  <p><strong>Terrain:</strong> {viewingCenter.difficulty?.terrainType}</p>
                  <p><strong>Accessibility:</strong> {viewingCenter.difficulty?.accessibility || "Standard"}</p>
                </div>

                {viewingCenter.rules && viewingCenter.rules.length > 0 && (
                  <div className="detail-card">
                    <h4>📜 Rules & Guidelines</h4>
                    <ul>
                      {viewingCenter.rules.map((rule, i) => (
                        <li key={i}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setViewingCenter(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deleteModal.isOpen && (
        <div className="modal-backdrop">
          <div className="delete-confirm-modal-box">
            <div className="delete-icon-wrapper">
              <FiAlertTriangle size={32} />
            </div>
            <h3>Delete Pilgrimage Center</h3>
            <p style={{ textAlign: "center" }}>
              Are you sure you want to permanently delete <strong>"{deleteModal.centerName}"</strong>? This action cannot be undone.
            </p>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="btn-cancel-del"
                onClick={() => setDeleteModal({ isOpen: false, centerId: null, centerName: "" })}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-confirm-del"
                onClick={handleDeleteConfirm}
                disabled={submitting}
              >
                {submitting ? "Deleting..." : "Delete Center"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPilgrimageCenters;
