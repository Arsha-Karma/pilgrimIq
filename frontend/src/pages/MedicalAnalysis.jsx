import React, { useState, useEffect } from "react";
import "../styles/MedicalAnalysis.css";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiGetMedicalReportById, apiSendReportForReview, apiAnalyzeMedicalReport } from "../services/medicalReportService";
import { apiAcceptResponsibility } from "../services/journeyService";
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiFileText,
  FiShield,
  FiUser,
  FiUsers,
  FiArrowLeft,
  FiRefreshCw,
  FiSend,
  FiCheck,
  FiHeart,
  FiX
} from "react-icons/fi";

function MedicalAnalysis() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [showRespModal, setShowRespModal] = useState(false);
  const [acceptingResp, setAcceptingResp] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await apiGetMedicalReportById(reportId, token);
        if (res && res.report) {
          setReport(res.report);
        } else {
          setError("Medical report not found.");
        }
      } catch (err) {
        console.error("Failed to load medical analysis:", err);
        setError(err.message || "Unable to load medical report analysis.");
      } finally {
        setLoading(false);
      }
    };

    if (reportId && token) {
      fetchReport();
    }
  }, [reportId, token]);

  const handleSendToPhysician = async () => {
    try {
      setSubmittingReview(true);
      const res = await apiSendReportForReview(reportId, token);
      if (res && res.report) {
        setReport(res.report);
        setSuccessMsg("Medical report has been submitted to on-duty physician for review.");
        setTimeout(() => setSuccessMsg(""), 5000);
      }
    } catch (err) {
      setError(err.message || "Failed to send report for physician review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleConfirmAcceptResponsibility = async () => {
    try {
      setAcceptingResp(true);
      const payload = report.ownerType === "family_member"
        ? { personType: "family_member", familyMemberId: report.familyMemberId?._id || report.familyMemberId }
        : { personType: "user" };

      await apiAcceptResponsibility(payload, token);
      setShowRespModal(false);
      navigate("/centers");
    } catch (err) {
      setError(err.message || "Failed to accept responsibility.");
    } finally {
      setAcceptingResp(false);
    }
  };

  const handleReanalyze = async () => {
    try {
      setLoading(true);
      const res = await apiAnalyzeMedicalReport(reportId, token);
      if (res && res.report) {
        setReport(res.report);
        setSuccessMsg("Report re-analyzed with updated AI rules.");
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (err) {
      setError(err.message || "Re-analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analysis-page-container">
        <div className="analysis-card loading-card">
          <FiRefreshCw className="spin-icon" />
          <h3>Analyzing Medical Report...</h3>
          <p>Extracting text, running pretrained biomedical NLP entity recognition & computing travel readiness risk indicators.</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="analysis-page-container">
        <div className="analysis-card error-card">
          <FiAlertTriangle className="error-icon" />
          <h3>Medical Analysis Notice</h3>
          <p>{error || "Unable to load medical analysis report."}</p>
          <button className="btn-primary" onClick={() => navigate("/profile")}>
            <FiArrowLeft /> Return to Profile
          </button>
        </div>
      </div>
    );
  }

  const patientName = report.ownerType === "family_member" && report.familyMemberId
    ? report.familyMemberId.name
    : report.userId?.name || user?.name || "Patient";

  const patientAge = report.ownerType === "family_member" && report.familyMemberId
    ? report.familyMemberId.age
    : report.userId?.age || user?.age || null;

  const relationship = report.ownerType === "family_member" && report.familyMemberId
    ? report.familyMemberId.relationship
    : "Self (Main User)";

  const vitals = report.extractedMedicalData?.vitals || {};
  const labValues = report.extractedMedicalData?.laboratoryValues || [];
  const conditions = report.extractedMedicalData?.conditions || [];
  const medications = report.extractedMedicalData?.medications || [];
  const allergies = report.extractedMedicalData?.allergies || [];
  const abnormalFindings = report.extractedMedicalData?.abnormalFindings || [];
  const riskAss = report.aiRiskAssessment || {};
  const physicianRev = report.physicianReview || {};
  const finalStatus = report.finalStatus || riskAss.overallStatus || "";

  const getStatusBadge = () => {
    const status = report.finalStatus || riskAss.overallStatus;
    if (status === "PHYSICIAN_APPROVED" || status === "LOW_RISK" || status === "AI_PRELIMINARY_LOW_RISK") {
      return {
        class: "status-low",
        icon: <FiCheckCircle />,
        title: "🟢 LOW RISK",
        desc: "No major travel-related risk indicators were identified from the available report information.",
      };
    }
    if (status === "AI_PRELIMINARY_CAUTION" || status === "CAUTION") {
      return {
        class: "status-caution",
        icon: <FiAlertTriangle />,
        title: "🟡 CAUTION",
        desc: "Potential travel-related risk indicators were identified. Additional precautions are recommended.",
      };
    }
    return {
      class: "status-review",
      icon: <FiAlertTriangle />,
      title: "🔴 MEDICAL REVIEW REQUIRED",
      desc: "Potential high-risk factors were identified. Physician review is recommended before final travel approval.",
    };
  };

  const statusInfo = getStatusBadge();

  return (
    <div className="analysis-page-container">
      <div className="analysis-header-nav">
        <button className="btn-back" onClick={() => navigate("/profile")}>
          <FiArrowLeft /> Back to Profile
        </button>
        <h2>AI Medical Report Analysis</h2>
      </div>

      {successMsg && <div className="alert-banner success-banner">{successMsg}</div>}

      {/* PATIENT & REPORT META CARD */}
      <div className="analysis-card patient-meta-card">
        <div className="meta-patient-info">
          <div className="patient-avatar">
            {report.ownerType === "family_member" ? <FiUsers /> : <FiUser />}
          </div>
          <div>
            <h3>{patientName} {patientAge ? `(${patientAge} Yrs)` : ""}</h3>
            <span className="relationship-tag">Medical Report For: {relationship}</span>
            <div className="document-filename">
              <FiFileText /> {report.fileName} ({report.fileType.toUpperCase()})
            </div>
          </div>
        </div>

        <div className="meta-actions">
          <button className="btn-secondary" onClick={handleReanalyze}>
            <FiRefreshCw /> Re-Analyze Report
          </button>
        </div>
      </div>

      {/* PIPELINE PROGRESS INDICATOR */}
      <div className="analysis-card pipeline-card">
        <h4>AI Analysis Pipeline Stages</h4>
        <div className="pipeline-steps">
          <div className="step-item completed">
            <FiCheck className="step-icon" />
            <span>Upload Completed</span>
          </div>
          <div className={`step-item ${report.extractionStatus === "completed" ? "completed" : "failed"}`}>
            <FiCheck className="step-icon" />
            <span>OCR Extraction</span>
          </div>
          <div className="step-item completed">
            <FiCheck className="step-icon" />
            <span>Pretrained Medical NLP</span>
          </div>
          <div className="step-item completed">
            <FiCheck className="step-icon" />
            <span>Travel Risk Indicator Assessment</span>
          </div>
        </div>
      </div>

      {/* TRAVEL READINESS STATUS BADGE */}
      <div className={`analysis-card readiness-card ${statusInfo.class}`}>
        <div className="readiness-header">
          <div className="status-badge-lg">{statusInfo.title}</div>
          <div className="confidence-pill">AI Confidence: {report.extractionConfidence?.toUpperCase() || "HIGH"}</div>
        </div>
        <p className="readiness-desc">{statusInfo.desc}</p>

        {riskAss.explanation && riskAss.explanation.length > 0 && (
          <div className="risk-factors-list">
            <h5>Travel Risk Factor Analysis:</h5>
            <ul>
              {riskAss.explanation.map((exp, i) => (
                <li key={i}>• {exp}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Physician Evaluation Notice if active */}
        {physicianRev.status !== "none" && (
          <div className="physician-status-box">
            <strong>Physician Evaluation Status:</strong> {physicianRev.status.toUpperCase()}
            {physicianRev.physicianName && <span> • Evaluated by Dr. {physicianRev.physicianName}</span>}
            {physicianRev.comments && <p>"{physicianRev.comments}"</p>}
          </div>
        )}
      </div>

      {/* EXTRACTED INFORMATION GRID */}
      <div className="analysis-card extracted-data-card">
        <h3>Structured Medical Information Extracted</h3>

        <div className="data-grid-two">
          {/* VITALS SECTION */}
          <div className="data-sub-card">
            <h4><FiHeart className="sec-icn" /> Extracted Vital Signs</h4>
            <div className="vitals-list">
              <div className="vital-item">
                <span className="lbl">Blood Pressure:</span>
                <span className="val">
                  {vitals.bloodPressure?.systolic ? `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg` : "Not detected"}
                </span>
              </div>
              <div className="vital-item">
                <span className="lbl">Heart Rate:</span>
                <span className="val">{vitals.heartRate?.value ? `${vitals.heartRate.value} bpm` : "Not detected"}</span>
              </div>
              <div className="vital-item">
                <span className="lbl">Blood Oxygen (SpO2):</span>
                <span className="val">{vitals.spo2?.value ? `${vitals.spo2.value}%` : "Not detected"}</span>
              </div>
              <div className="vital-item">
                <span className="lbl">Body Temp:</span>
                <span className="val">{vitals.temperature?.value ? `${vitals.temperature.value} °F` : "Not detected"}</span>
              </div>
            </div>
          </div>

          {/* CONDITIONS & MEDICATIONS */}
          <div className="data-sub-card">
            <h4><FiActivity className="sec-icn" /> Conditions & Medications</h4>
            <div className="vitals-list">
              <div className="vital-item">
                <span className="lbl">Detected Conditions:</span>
                <span className="val">{conditions.length > 0 ? conditions.join(", ") : "Not detected"}</span>
              </div>
              <div className="vital-item">
                <span className="lbl">Prescribed Medicines:</span>
                <span className="val">{medications.length > 0 ? medications.join(", ") : "Not detected"}</span>
              </div>
              <div className="vital-item">
                <span className="lbl">Known Allergies:</span>
                <span className="val">{allergies.length > 0 ? allergies.join(", ") : "Not detected"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* LABORATORY PARAMETERS TABLE */}
        <div className="lab-values-section">
          <h4>Laboratory Parameters Detected</h4>
          {labValues.length > 0 ? (
            <table className="analysis-table">
              <thead>
                <tr>
                  <th>PARAMETER</th>
                  <th>RESULT VALUE</th>
                  <th>REFERENCE RANGE</th>
                  <th>CONFIDENCE</th>
                </tr>
              </thead>
              <tbody>
                {labValues.map((lab, i) => (
                  <tr key={i}>
                    <td><strong>{lab.parameter}</strong></td>
                    <td className="font-mono">{lab.value} {lab.unit}</td>
                    <td>{lab.normalRange || "Standard Range"}</td>
                    <td>
                      <span className={`conf-tag ${lab.confidence < 0.7 ? "low" : "high"}`}>
                        {Math.round((lab.confidence || 0.9) * 100)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data-msg">No laboratory numerical values explicitly detected in this document.</p>
          )}
        </div>

        {/* ABNORMAL FINDINGS */}
        {abnormalFindings.length > 0 && (
          <div className="abnormal-box">
            <h5>⚠️ Observations & Abnormal Findings</h5>
            <ul>
              {abnormalFindings.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* AI SUMMARY BOX */}
      <div className="analysis-card summary-card">
        <h3>AI Factual Medical Summary</h3>
        <pre className="summary-text-block">{report.aiSummary || "Summary unavailable."}</pre>
      </div>

      {/* OFFICIAL AI DISCLAIMER */}
      <div className="analysis-card disclaimer-card">
        <FiShield className="shield-icon" />
        <div>
          <h4>Important Medical Disclaimer</h4>
          <p>
            "AI-generated preliminary assessment. This does not replace professional medical advice. Please consult an authorized healthcare provider for clinical evaluation."
          </p>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="analysis-footer-actions">
        <button
          className="btn-physician-review"
          onClick={handleSendToPhysician}
          disabled={submittingReview || physicianRev.status === "pending"}
        >
          <FiSend /> {physicianRev.status === "pending" ? "Submitted for Physician Review" : "Request Physician Review"}
        </button>

        {physicianRev.status === "pending" || finalStatus === "MEDICAL_REVIEW_REQUIRED" ? (
          <button className="btn-continue" disabled style={{ opacity: 0.6, cursor: "not-allowed", background: "#64748b" }}>
            Doctor Approval Required (Pending Review)
          </button>
        ) : physicianRev.status === "approved" || finalStatus === "PHYSICIAN_APPROVED" ? (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ color: "#34d399", fontWeight: "700", fontSize: "14px" }}>✓ Doctor Approved</span>
            <button className="btn-continue" onClick={() => setShowRespModal(true)}>
              Travel in Your Own Responsibility →
            </button>
          </div>
        ) : physicianRev.status === "not_approved" || finalStatus === "PHYSICIAN_NOT_APPROVED" ? (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ color: "#f87171", fontWeight: "700", fontSize: "14px" }}>✕ Doctor Rejected</span>
            <button className="btn-continue" style={{ background: "#dc2626" }} onClick={() => setShowRespModal(true)}>
              Travel in Your Own Responsibility →
            </button>
          </div>
        ) : (
          <button className="btn-continue" onClick={() => navigate("/centers")}>
            Continue to Journey Planner →
          </button>
        )}
      </div>

      {/* Responsibility Confirmation Modal */}
      {showRespModal && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div className="modal-card" style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "16px", padding: "24px", maxWidth: "520px", width: "90%", color: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: physicianRev.status === "not_approved" || finalStatus === "PHYSICIAN_NOT_APPROVED" ? "#ef4444" : "#3b82f6" }}>
                {physicianRev.status === "not_approved" || finalStatus === "PHYSICIAN_NOT_APPROVED" ? "⚠️ Travel Responsibility Warning" : "Travel Responsibility Confirmation"}
              </h3>
              <button onClick={() => setShowRespModal(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "18px" }}>
                <FiX />
              </button>
            </div>

            <div style={{ marginBottom: "20px", fontSize: "14px", lineHeight: "1.6", color: "#cbd5e1" }}>
              {physicianRev.status === "not_approved" || finalStatus === "PHYSICIAN_NOT_APPROVED" ? (
                <div style={{ background: "#450a0a", border: "1px solid #dc2626", padding: "14px", borderRadius: "10px", color: "#fca5a5" }}>
                  "The doctor has rejected travel for <strong>{report.familyMemberId?.name || user?.name}</strong> because of the identified medical risk ({physicianRev.comments || "Medical risk parameters"}). Continuing the journey despite the doctor's rejection is entirely at your own responsibility. Professional medical advice should be followed."
                </div>
              ) : (
                <div style={{ background: "#064e3b", border: "1px solid #059669", padding: "14px", borderRadius: "10px", color: "#a7f3d0" }}>
                  "The doctor has approved the travel. By continuing, you acknowledge the medical risk and agree to travel under your own responsibility."
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowRespModal(false)}
                style={{ padding: "10px 18px", borderRadius: "8px", background: "#334155", color: "#fff", border: "none", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAcceptResponsibility}
                disabled={acceptingResp}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  background: physicianRev.status === "not_approved" || finalStatus === "PHYSICIAN_NOT_APPROVED" ? "#dc2626" : "#2563eb",
                  color: "#fff",
                  border: "none",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                {acceptingResp
                  ? "Processing..."
                  : physicianRev.status === "not_approved" || finalStatus === "PHYSICIAN_NOT_APPROVED"
                  ? "I Understand – Travel in My Own Responsibility"
                  : "Confirm & Continue Journey"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MedicalAnalysis;
