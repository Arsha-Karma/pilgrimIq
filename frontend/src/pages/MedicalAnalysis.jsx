import React, { useState, useEffect } from "react";
import "../styles/MedicalAnalysis.css";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiGetMedicalReportById, apiSendReportForReview, apiAnalyzeMedicalReport } from "../services/medicalReportService";
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
  FiHeart
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

        <button className="btn-continue" onClick={() => navigate("/journey-planner")}>
          Continue to Journey Planner →
        </button>
      </div>
    </div>
  );
}

export default MedicalAnalysis;
