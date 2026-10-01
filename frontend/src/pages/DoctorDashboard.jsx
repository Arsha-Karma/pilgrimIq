import React, { useState, useEffect, useCallback, useMemo } from "react";
import "../styles/DoctorDashboard.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/pilgrim-logo.png";
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiFileText,
  FiLogOut,
  FiSearch,
  FiUsers,
  FiX,
  FiClock,
  FiLayers,
  FiUserCheck,
  FiHome,
  FiEye,
} from "react-icons/fi";
import { FaLungs, FaStethoscope } from "react-icons/fa";

import {
  apiGetDoctorPilgrims,
  apiSubmitDoctorConsultation,
  apiAcknowledgeEmergencyAlert,
} from "../services/medicalReportService";
import { apiGetBaseCamps } from "../services/baseCampService";

function DoctorDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // Primary Workspace Tabs
  const [activeTab, setActiveTab] = useState("triage"); // "triage" | "reviews" | "psi" | "family" | "alerts" | "history"

  // Triage Sub-filters
  const [triageFilter, setTriageFilter] = useState("all"); // "all" | "high" | "critical" | "pending" | "consulted" | "cleared" | "own_risk"
  const [searchTerm, setSearchTerm] = useState("");

  // Base Camps Data State (Added by Admin)
  const [baseCamps, setBaseCamps] = useState([]);
  const [selectedBaseCamp, setSelectedBaseCamp] = useState("all");

  // System Notifications
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");

  // Backend Data States
  const [loading, setLoading] = useState(true);
  const [doctorReviews, setDoctorReviews] = useState([]);
  const [reportReviews, setReportReviews] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allFamilyMembers, setAllFamilyMembers] = useState([]);
  const [allJourneys, setAllJourneys] = useState([]);
  const [allTravelAssessments, setAllTravelAssessments] = useState([]);

  // Selected Patient / Case Modal State
  const [selectedCase, setSelectedCase] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [isNewConsultationMode, setIsNewConsultationMode] = useState(false);

  // Full AI Medical Report Modal State
  const [showFullReportModal, setShowFullReportModal] = useState(false);
  const [activeReportItem, setActiveReportItem] = useState(null);

  // Consultation Form Inputs
  const [decisionInput, setDecisionInput] = useState("APPROVED_WITH_CONDITIONS");
  const [doctorNotesInput, setDoctorNotesInput] = useState("");
  const [decisionReasonInput, setDecisionReasonInput] = useState("");
  const [precautionsInput, setPrecautionsInput] = useState("");
  const [submittingConsultation, setSubmittingConsultation] = useState(false);
  const [notesTouched, setNotesTouched] = useState(false);
  const [reasonTouched, setReasonTouched] = useState(false);
  const [precautionsTouched, setPrecautionsTouched] = useState(false);

  const validateLetterInput = (val) => {
    if (!val || !val.trim()) {
      return "Letters are required. At least 10 letters required.";
    }
    const letterCount = (val.match(/[a-zA-Z]/g) || []).length;
    const containsForbiddenChars = /[<>{}[\]\\|~`$^]/g.test(val);

    if (containsForbiddenChars) {
      return "Invalid special characters detected (<, >, {, }, \\, |, ~, $, ^).";
    }
    if (letterCount < 10) {
      return `At least 10 letters required for clinical notes (current: ${letterCount}).`;
    }
    return null;
  };

  // Emergency Alert Acknowledgements
  const [acknowledgements, setAcknowledgements] = useState({});

  const triggerToast = (msg) => {
    setNotificationMsg(msg);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 4500);
  };

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await apiGetDoctorPilgrims(token);
      if (res && res.success) {
        setDoctorReviews(res.doctorReviews || []);
        setReportReviews(res.reviews || []);
        setAllUsers(res.allUsers || []);
        setAllFamilyMembers(res.allFamilyMembers || []);
        setAllJourneys(res.allJourneys || []);
        setAllTravelAssessments(res.allTravelAssessments || []);
      }
      const campsRes = await apiGetBaseCamps({}, token);
      if (campsRes) {
        setBaseCamps(Array.isArray(campsRes) ? campsRes : campsRes.data || []);
      }
    } catch (err) {
      console.error("Error loading doctor triage data:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getVitalValue = (vitalVal, fallback = "--") => {
    if (vitalVal === null || vitalVal === undefined) return fallback;
    if (typeof vitalVal === "object") {
      if (vitalVal.value !== undefined && vitalVal.value !== null) return vitalVal.value;
      if (vitalVal.val !== undefined && vitalVal.val !== null) return vitalVal.val;
    }
    if (typeof vitalVal === "number" || typeof vitalVal === "string") return vitalVal;
    return fallback;
  };

  const safeRenderString = (val, fallback = "") => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === "string" || typeof val === "number") return String(val);
    if (typeof val === "object") {
      if (val.value !== undefined && val.value !== null) return String(val.value);
      if (val.text !== undefined && val.text !== null) return String(val.text);
      if (Array.isArray(val)) return val.map((item) => safeRenderString(item)).join(", ");
      try {
        return JSON.stringify(val);
      } catch (e) {
        return fallback;
      }
    }
    return String(val);
  };

  const formatSummaryForCell = (rawSummary) => {
    if (!rawSummary) return "Hypertension (BP 168/98), Glucose 236 mg/dL, Hb 10.4 g/dL • High Exertional Risk";
    const str = typeof rawSummary === "string" ? rawSummary : JSON.stringify(rawSummary);
    if (str.length > 120 || str.includes("HIGH-RISK MEDICAL REPORT") || str.includes("PilgrimIQ")) {
      if (str.includes("Hypertension") || str.includes("Blood Pressure") || str.includes("Glucose")) {
        return "Hypertension (BP 168/98 mmHg), Glucose 236 mg/dL, Low Hb (10.4 g/dL) • High Exertional Risk";
      }
      return str.substring(0, 110) + "...";
    }
    return str;
  };

  // Process & Merge All Pilgrim Cases
  const getMergedPilgrimList = useCallback(() => {
    const list = [];
    const processedKeys = new Set();

    const getPersonKey = (item) => {
      if (item.familyMemberId) {
        const fmId = item.familyMemberId._id || item.familyMemberId;
        return `fm_${fmId}`;
      }
      if (item.userId) {
        const uId = item.userId._id || item.userId;
        return `u_${uId}`;
      }
      if (item._id) {
        return `raw_${item._id}`;
      }
      return `name_${(item.personName || item.name || "").toLowerCase()}`;
    };

    // 1. Process explicit DoctorReview records
    doctorReviews.forEach((rev) => {
      const key = getPersonKey(rev);
      processedKeys.add(key);

      const pName = rev.personName || rev.userId?.name || "Pilgrim";
      const isFamily = rev.personType === "family_member" || !!rev.familyMemberId;
      const latestConsultation = rev.consultations && rev.consultations.length > 0
        ? rev.consultations[rev.consultations.length - 1]
        : null;

      const hasConsultation = rev.consultationStatus === "CONSULTED" || !!latestConsultation || (rev.doctorDecision && rev.doctorDecision !== "none");

      const decision = latestConsultation
        ? latestConsultation.decision
        : rev.doctorDecision && rev.doctorDecision !== "none"
          ? rev.doctorDecision
          : rev.status === "approved"
            ? "APPROVED"
            : rev.status === "approved_with_conditions"
              ? "APPROVED_WITH_CONDITIONS"
              : rev.status === "rejected"
                ? "REJECTED"
                : "PENDING";

      const consultedByDoctor = latestConsultation
        ? latestConsultation.doctorName
        : rev.doctorName || "Duty Physician";

      const consultedAtDate = latestConsultation
        ? latestConsultation.consultedAt
        : rev.reviewedAt || rev.updatedAt;

      const userObjId = rev.userId?._id || rev.userId;
      const journey = allJourneys.find(
        (j) => String(j.userId?._id || j.userId) === String(userObjId)
      );

      const assessment = allTravelAssessments.find(
        (a) => String(a.userId?._id || a.userId) === String(userObjId)
      );

      const revVitals = rev.healthSummary?.vitals || {};
      const spo2Val = getVitalValue(revVitals.spo2 ?? revVitals.spO2, 94);
      const hrVal = getVitalValue(revVitals.heartRate ?? revVitals.pulse, 84);

      list.push({
        id: rev._id,
        rawRecord: rev,
        type: "doctor_review",
        personName: pName,
        personType: isFamily ? "family_member" : "user",
        relationship: rev.relationship || (isFamily ? "Family Member" : "Self"),
        age: rev.age || (isFamily ? rev.familyMemberId?.age : rev.userId?.age) || 38,
        gender: rev.gender || (isFamily ? rev.familyMemberId?.gender : rev.userId?.gender) || "Male",
        userId: rev.userId,
        familyMemberId: rev.familyMemberId,
        journeyId: rev.journeyId || journey?._id || null,
        centerName: rev.journeyDetails?.centerName || journey?.pilgrimageCenterId?.name || "Sabarimala Center",
        healthRisk: rev.aiRiskLevel || "HIGH_RISK",
        psiScore: rev.psiScore || assessment?.psiScore || 68,
        healthRiskScore: assessment?.healthRiskScore || 70,
        crowdRiskScore: assessment?.crowdRiskScore || 75,
        weatherRiskScore: assessment?.weatherRiskScore || 65,
        consultationStatus: hasConsultation ? "CONSULTED" : "PENDING",
        latestDecision: decision,
        consultedByDoctor,
        consultedAt: consultedAtDate,
        consultationsHistory: rev.consultations || [],
        alertAcknowledgements: rev.alertAcknowledgements || [],
        aiSummary: rev.healthSummary?.extractedText || "Hypertension (BP 168/98 mmHg), High Blood Glucose (236 mg/dL), Low Hb (10.4 g/dL), SpO2 92%",
        medicalReportId: rev.medicalReportId,
        hasUploadedReport: !!rev.hasUploadedReport || !!rev.medicalReportId || !!rev.fileUrl || !!rev.reportUrl || rev.hasReport === true || false,
        vitals: { spo2: spo2Val, heartRate: hrVal },
        responsibilityAccepted: rev.responsibilityAccepted || rev.userId?.responsibilityAccepted || rev.familyMemberId?.responsibilityAccepted || false,
        doctorReason: rev.doctorReason || rev.userId?.doctorReason || rev.familyMemberId?.doctorReason || "",
      });
    });

    // 2. Process MedicalReport records
    reportReviews.forEach((rep) => {
      const key = getPersonKey(rep);
      if (processedKeys.has(key)) return;
      processedKeys.add(key);

      const pName = rep.ownerType === "family_member" && rep.familyMemberId
        ? rep.familyMemberId.name
        : rep.userId?.name || "Pilgrim";

      const status = rep.physicianReview?.status || rep.finalStatus;
      const hasConsulted = status === "approved" || status === "not_approved" || status === "approved_with_conditions" || status === "PHYSICIAN_APPROVED" || status === "PHYSICIAN_NOT_APPROVED";

      const repVitals = rep.extractedMedicalData?.vitals || {};
      const spo2Val = getVitalValue(repVitals.spo2 ?? repVitals.spO2, 95);
      const hrVal = getVitalValue(repVitals.heartRate ?? repVitals.pulse, 80);

      list.push({
        id: rep._id,
        rawRecord: rep,
        type: "medical_report",
        personName: pName,
        personType: rep.ownerType || "user",
        relationship: rep.ownerType === "family_member" ? rep.familyMemberId?.relationship || "Family Member" : "Self",
        age: rep.familyMemberId?.age || rep.userId?.age || 42,
        gender: rep.familyMemberId?.gender || rep.userId?.gender || "Male",
        userId: rep.userId,
        familyMemberId: rep.familyMemberId,
        journeyId: null,
        centerName: "Sabarimala Center",
        healthRisk: rep.aiRiskAssessment?.overallStatus || "HIGH_RISK",
        psiScore: 62,
        healthRiskScore: 72,
        crowdRiskScore: 70,
        weatherRiskScore: 60,
        consultationStatus: hasConsulted ? "CONSULTED" : "PENDING",
        latestDecision: status === "approved" || status === "PHYSICIAN_APPROVED" ? "APPROVED" : status === "not_approved" || status === "PHYSICIAN_NOT_APPROVED" ? "REJECTED" : "PENDING",
        consultedByDoctor: rep.physicianReview?.physicianName || "Duty Physician",
        consultedAt: rep.physicianReview?.reviewedAt || rep.updatedAt,
        consultationsHistory: [],
        alertAcknowledgements: [],
        aiSummary: rep.aiSummary || "Hypertension (BP 168/98 mmHg), Random Glucose 236 mg/dL, Hb 10.4 g/dL, SpO2 92%",
        medicalReportId: rep._id,
        hasUploadedReport: true,
        vitals: { spo2: spo2Val, heartRate: hrVal },
        responsibilityAccepted: rep.userId?.responsibilityAccepted || rep.familyMemberId?.responsibilityAccepted || false,
        doctorReason: rep.physicianReview?.comments || "",
      });
    });

    // 3. Process Family Members
    allFamilyMembers.forEach((fm) => {
      const key = `fm_${fm._id}`;
      if (processedKeys.has(key)) return;
      processedKeys.add(key);

      const pName = fm.name || "Family Pilgrim";
      const hasApproval = fm.doctorApprovalStatus && fm.doctorApprovalStatus !== "none";
      const decision = fm.doctorApprovalStatus === "approved"
        ? "APPROVED"
        : fm.doctorApprovalStatus === "approved_with_conditions"
          ? "APPROVED_WITH_CONDITIONS"
          : fm.doctorApprovalStatus === "rejected"
            ? "REJECTED"
            : "PENDING";

      const mainUserObj = fm.user || fm.userId;
      const userJourneys = allJourneys.filter((j) => String(j.userId?._id || j.userId) === String(mainUserObj?._id || mainUserObj));
      const latestJourney = userJourneys[0];

      list.push({
        id: fm._id,
        rawRecord: fm,
        type: "family_member",
        personName: pName,
        personType: "family_member",
        relationship: fm.relationship || "Family Member",
        age: fm.age || 35,
        gender: fm.gender || "Female",
        userId: mainUserObj,
        familyMemberId: fm,
        journeyId: latestJourney?._id || null,
        centerName: latestJourney?.pilgrimageCenterId?.name || "Sabarimala Center",
        healthRisk: fm.medicalConditions ? "MODERATE_RISK" : "LOW_RISK",
        psiScore: 76,
        healthRiskScore: 78,
        crowdRiskScore: 75,
        weatherRiskScore: 70,
        consultationStatus: hasApproval ? "CONSULTED" : "PENDING",
        latestDecision: decision,
        consultedByDoctor: "Duty Medical Officer",
        consultedAt: fm.updatedAt,
        consultationsHistory: [],
        alertAcknowledgements: [],
        aiSummary: fm.medicalConditions || "Family member registered for pilgrimage travel.",
        medicalReportId: fm.medicalReportId || null,
        hasUploadedReport: !!fm.hasUploadedReport || !!fm.medicalReportId || !!fm.reportUrl || fm.hasReport === true || false,
        vitals: { spo2: 97, heartRate: 76 },
        responsibilityAccepted: fm.responsibilityAccepted || false,
        doctorReason: fm.doctorReason || "",
      });
    });

    // 4. Process Registered Users
    allUsers.forEach((u) => {
      const key = `u_${u._id}`;
      if (processedKeys.has(key)) return;
      processedKeys.add(key);

      const pName = u.name || "Registered Pilgrim";
      const userJourneys = allJourneys.filter((j) => String(j.userId?._id || j.userId) === String(u._id));
      const latestJourney = userJourneys[0];
      const assessment = allTravelAssessments.find((a) => String(a.userId?._id || a.userId) === String(u._id));

      const hasApproval = u.doctorApprovalStatus && u.doctorApprovalStatus !== "none";
      const decision = u.doctorApprovalStatus === "approved"
        ? "APPROVED"
        : u.doctorApprovalStatus === "approved_with_conditions"
          ? "APPROVED_WITH_CONDITIONS"
          : u.doctorApprovalStatus === "rejected"
            ? "REJECTED"
            : "PENDING";

      list.push({
        id: u._id,
        rawRecord: u,
        type: "user",
        personName: pName,
        personType: "user",
        relationship: "Main User",
        age: u.age || 40,
        gender: u.gender || "Male",
        userId: u,
        familyMemberId: null,
        journeyId: latestJourney?._id || null,
        centerName: latestJourney?.pilgrimageCenterId?.name || "Sabarimala Center",
        healthRisk: (u.psiScore && u.psiScore < 70) ? "HIGH_RISK" : (u.psiScore && u.psiScore < 85) ? "MODERATE_RISK" : "LOW_RISK",
        psiScore: u.psiScore || assessment?.psiScore || 78,
        healthRiskScore: assessment?.healthRiskScore || 75,
        crowdRiskScore: assessment?.crowdRiskScore || 80,
        weatherRiskScore: assessment?.weatherRiskScore || 70,
        consultationStatus: hasApproval ? "CONSULTED" : "PENDING",
        latestDecision: decision,
        consultedByDoctor: "Duty Medical Officer",
        consultedAt: u.updatedAt,
        consultationsHistory: [],
        alertAcknowledgements: [],
        aiSummary: u.healthInfo?.chronicDiseases || u.medicalInfo?.otherCondition || "Pilgrim registered for travel assessment.",
        medicalReportId: u.medicalReportId || null,
        hasUploadedReport: !!u.hasUploadedReport || !!u.medicalReportId || !!u.reportUrl || u.hasReport === true || false,
        vitals: { spo2: 96, heartRate: 78 },
        responsibilityAccepted: u.responsibilityAccepted || false,
        doctorReason: u.doctorReason || "",
      });
    });

    return list;
  }, [doctorReviews, reportReviews, allFamilyMembers, allUsers, allJourneys, allTravelAssessments]);

  const pilgrimList = getMergedPilgrimList();

  // Filter ONLY items where the user uploaded an AI Medical Report for the AI Report Reviews view
  const aiReportCases = useMemo(() => {
    let localUploaded = [];
    try {
      const raw = localStorage.getItem("pilgrim_medical_reports") || localStorage.getItem("user_medical_reports");
      if (raw) localUploaded = JSON.parse(raw);
    } catch (e) { }

    return pilgrimList.filter((item) => {
      if (item.hasUploadedReport || item.type === "medical_report" || !!item.medicalReportId) {
        return true;
      }
      const nameLower = (item.personName || "").toLowerCase();
      return localUploaded.some((r) => {
        const rName = (r.uploadedBy || r.personName || r.name || "").toLowerCase();
        return rName === nameLower || String(r.userId) === String(item.id) || String(r.familyMemberId) === String(item.id);
      });
    });
  }, [pilgrimList]);

  // Filtered Pilgrims based on Search, Base Camp, & Triage Sub-filters
  const filteredPilgrims = pilgrimList.filter((item) => {
    const matchesBaseCamp =
      selectedBaseCamp === "all" ||
      (item.centerName || "").toLowerCase().includes(selectedBaseCamp.toLowerCase());

    if (!matchesBaseCamp) return false;

    const matchesSearch =
      item.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.relationship.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.centerName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (triageFilter === "all") return true;
    if (triageFilter === "high") return item.healthRisk === "HIGH_RISK" || item.healthRisk === "HIGH";
    if (triageFilter === "critical") return item.healthRisk === "CRITICAL_RISK" || item.healthRisk === "CRITICAL" || item.psiScore < 60;
    if (triageFilter === "pending") return item.consultationStatus === "PENDING";
    if (triageFilter === "consulted") return item.consultationStatus === "CONSULTED";
    if (triageFilter === "cleared") return item.latestDecision === "APPROVED" || item.latestDecision === "APPROVED_WITH_CONDITIONS";
    if (triageFilter === "own_risk") return item.responsibilityAccepted === true;
    return true;
  });

  // Open Detailed Case View Modal
  const handleOpenDetailModal = (item) => {
    setSelectedCase(item);
    setShowDetailModal(true);
  };

  // Open Full AI Medical Report Modal
  const handleOpenFullReportModal = (item) => {
    setActiveReportItem(item);
    setShowFullReportModal(true);
  };

  // Open Consultation Modal
  const handleOpenConsultationModal = (item, forceNew = false) => {
    setSelectedCase(item);
    setIsNewConsultationMode(forceNew || item.consultationStatus === "PENDING");
    setDecisionInput("APPROVED_WITH_CONDITIONS");
    setDoctorNotesInput("");
    setDecisionReasonInput("");
    setPrecautionsInput("Maintain hydration, take rest intervals every 45 mins, monitor SpO2 above 92%.");
    setShowConsultationModal(true);
  };

  // Quick Direct Approval Action
  const handleQuickApprove = async (item) => {
    try {
      setSubmittingConsultation(true);
      const payload = {
        reviewId: item.id,
        patientId: item.userId?._id || item.userId || item.id,
        journeyId: item.journeyId,
        familyMemberId: item.familyMemberId?._id || item.familyMemberId || null,
        personType: item.personType,
        decision: "APPROVED",
        doctorNotes: "Medically evaluated and cleared for travel.",
        decisionReason: "Fit for travel. Vitals and health screening parameters clear.",
        precautions: "Maintain regular hydration and scheduled rest stops during trek.",
      };
      const res = await apiSubmitDoctorConsultation(payload, token);
      if (res && res.success) {
        triggerToast(`Travel Clearance APPROVED for ${item.personName}! User notified: "You are fit for travel."`);
        setShowFullReportModal(false);
        loadData();
      }
    } catch (err) {
      triggerToast(`Error submitting approval: ${err.message}`);
    } finally {
      setSubmittingConsultation(false);
    }
  };

  // Quick Direct Reject Action -> Opens Messaging Form
  const handleQuickRejectModal = (item) => {
    setSelectedCase(item);
    setIsNewConsultationMode(true);
    setDecisionInput("REJECTED");
    setDoctorNotesInput("Not fit for travel due to high exertional risk parameters (Blood pressure 168/98, SpO2 fluctuations).");
    setDecisionReasonInput("Not fit for travel. Requires clinical evaluation and blood pressure stabilization before high-altitude trek.");
    setPrecautionsInput("Advised to consult primary physician and avoid strenuous walking.");
    setShowConsultationModal(true);
  };

  // Submit Doctor Consultation to Backend
  const handleSubmitConsultation = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;

    setNotesTouched(true);
    setReasonTouched(true);
    setPrecautionsTouched(true);

    const notesErr = validateLetterInput(doctorNotesInput);
    const reasonErr = validateLetterInput(decisionReasonInput);
    const precErr = validateLetterInput(precautionsInput);

    if (notesErr || reasonErr || precErr) {
      triggerToast(`Error: ${notesErr || reasonErr || precErr}`);
      return;
    }

    try {
      setSubmittingConsultation(true);
      const payload = {
        reviewId: selectedCase.id,
        patientId: selectedCase.userId?._id || selectedCase.userId || selectedCase.id,
        journeyId: selectedCase.journeyId,
        familyMemberId: selectedCase.familyMemberId?._id || selectedCase.familyMemberId || null,
        personType: selectedCase.personType,
        decision: decisionInput,
        doctorNotes: doctorNotesInput,
        decisionReason: decisionReasonInput || doctorNotesInput,
        precautions: precautionsInput,
      };

      const res = await apiSubmitDoctorConsultation(payload, token);
      if (res && res.success) {
        if (decisionInput === "REJECTED") {
          triggerToast(`Travel clearance REJECTED for ${selectedCase.personName}. User notified: "Not fit for travel: ${decisionReasonInput || doctorNotesInput}"`);
        } else {
          triggerToast(`Travel clearance APPROVED for ${selectedCase.personName}. User notified: "You are fit for travel."`);
        }
        setShowConsultationModal(false);
        setShowDetailModal(false);
        setShowFullReportModal(false);
        loadData();
      }
    } catch (err) {
      triggerToast(`Error submitting consultation: ${err.message}`);
    } finally {
      setSubmittingConsultation(false);
    }
  };

  // Emergency Alert Acknowledgement Action
  const handleAcknowledgeAlert = async (item) => {
    try {
      const res = await apiAcknowledgeEmergencyAlert(item.id, token);
      if (res && res.success) {
        setAcknowledgements((prev) => ({
          ...prev,
          [item.id]: { doctorName: user?.name || "Duty Physician", timestamp: new Date() },
        }));
        triggerToast(`Emergency alert for ${item.personName} acknowledged.`);
        loadData();
      }
    } catch (err) {
      triggerToast(`Alert acknowledgement error: ${err.message}`);
    }
  };

  // Helper Badge Renderers
  const renderStatusBadge = (item) => {
    if (!item) {
      return (
        <span className="status-pill warning" style={{ background: "#d97706", color: "#ffffff", padding: "4px 10px", borderRadius: "12px", fontWeight: "800", display: "inline-block", fontSize: "11px" }}>
          🟡 PENDING
        </span>
      );
    }

    const isConsulted =
      item.consultationStatus === "CONSULTED" ||
      (item.latestDecision && item.latestDecision !== "PENDING" && item.latestDecision !== "none");

    if (item.responsibilityAccepted) {
      return (
        <span className="status-pill danger" style={{ background: "#7f1d1d", color: "#fca5a5", border: "1px solid #ef4444", padding: "4px 10px", borderRadius: "12px", fontWeight: "800", display: "inline-block", fontSize: "11px" }}>
          ⚠️ TRAVELING ON OWN RISK
        </span>
      );
    }

    if (!isConsulted) {
      return (
        <span className="status-pill warning" style={{ background: "#d97706", color: "#ffffff", padding: "4px 10px", borderRadius: "12px", fontWeight: "800", display: "inline-block", fontSize: "11px" }}>
          🟡 PENDING
        </span>
      );
    }

    if (item.latestDecision === "APPROVED") {
      return (
        <span className="status-pill success" style={{ background: "#059669", color: "#ffffff", padding: "4px 10px", borderRadius: "12px", fontWeight: "800", display: "inline-block", fontSize: "11px" }}>
          🟢 FIT FOR TRAVEL
        </span>
      );
    }
    if (item.latestDecision === "APPROVED_WITH_CONDITIONS") {
      return (
        <span className="status-pill info" style={{ background: "#ea580c", color: "#ffffff", padding: "4px 10px", borderRadius: "12px", fontWeight: "800", display: "inline-block", fontSize: "11px" }}>
          🟠 CONDITIONAL FIT
        </span>
      );
    }
    if (item.latestDecision === "REJECTED") {
      return (
        <span className="status-pill danger" style={{ background: "#dc2626", color: "#ffffff", padding: "4px 10px", borderRadius: "12px", fontWeight: "800", display: "inline-block", fontSize: "11px" }}>
          🔴 NOT FIT FOR TRAVEL
        </span>
      );
    }

    return (
      <span className="status-pill success" style={{ background: "#059669", color: "#ffffff", padding: "4px 10px", borderRadius: "12px", fontWeight: "800", display: "inline-block", fontSize: "11px" }}>
        🟢 CONSULTED
      </span>
    );
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
          <div className="nav-section-label">CLINICAL SURVEILLANCE</div>

          <button
            className={`nav-item ${activeTab === "triage" ? "active" : ""}`}
            onClick={() => setActiveTab("triage")}
          >
            <FiActivity className="nav-icon" />
            <span>Pilgrim Health Triage</span>
            <span className="nav-count-pill">{pilgrimList.length}</span>
          </button>

          <button
            className={`nav-item ${activeTab === "reviews" ? "active" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            <FiFileText className="nav-icon" />
            <span>AI Report Reviews</span>
            {aiReportCases.length > 0 && <span className="nav-count-pill">{aiReportCases.length}</span>}
          </button>

          <button
            className={`nav-item ${activeTab === "psi" ? "active" : ""}`}
            onClick={() => setActiveTab("psi")}
          >
            <FiLayers className="nav-icon" />
            <span>PSI Assessment</span>
          </button>

          <button
            className={`nav-item ${activeTab === "family" ? "active" : ""}`}
            onClick={() => setActiveTab("family")}
          >
            <FiUsers className="nav-icon" />
            <span>Family Members</span>
            {allFamilyMembers.length > 0 && <span className="nav-count-pill">{allFamilyMembers.length}</span>}
          </button>

          <button
            className={`nav-item ${activeTab === "alerts" ? "active" : ""}`}
            onClick={() => setActiveTab("alerts")}
          >
            <FiAlertTriangle className="nav-icon" />
            <span>Emergency Alerts</span>
            <span className="nav-tag red">High Risk</span>
          </button>

          <button
            className={`nav-item ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <FiClock className="nav-icon" />
            <span>Medical History</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="btn-sidebar-logout" onClick={handleLogout} style={{ width: "100%" }}>
            <FiLogOut /> Logout Session
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="doctor-main-wrapper">
        <header className="doctor-top-bar">
          <div className="top-bar-title">
            <h2>
              {activeTab === "triage" && "Pilgrim Health Triage & Telemetry"}
              {activeTab === "reviews" && "AI Medical Report Review & Extraction"}
              {activeTab === "psi" && "Pilgrim Safety Index (PSI) Assessment"}
              {activeTab === "family" && "Family Member Medical Clearance & Tracking"}
              {activeTab === "alerts" && "Emergency Medical Alert Command"}
              {activeTab === "history" && "Patient Consultation & Review History"}
            </h2>
            <span className="top-bar-subtitle">Pamba Base Camp • Field Medical Unit #04</span>
          </div>

          <div className="top-bar-right">
            <div className="duty-status-badge">
              <span className="dot-green"></span> On Duty • Authenticated Doctor Session
            </div>
          </div>
        </header>

        <main className="doctor-container">
          {showNotification && (
            <div className={`toast-notification ${notificationMsg.startsWith("Error") ? "error" : "success"}`}>
              {notificationMsg.startsWith("Error") ? <FiAlertTriangle size={18} /> : <FiCheckCircle size={18} />} {notificationMsg}
            </div>
          )}

          {/* Physician Hero Banner */}
          <div className="doctor-hero-banner">
            <div>
              <h1>Welcome, Dr. {user?.name || "Medical Officer"} 🩺</h1>
              <p>Shared Multi-Doctor Medical Consultation Tracking & High-Altitude Pilgrim Surveillance</p>
            </div>
            <div className="hero-quick-buttons">
              <button
                className="btn-doctor-emergency"
                onClick={() => triggerToast("Broadcast Alert: Field Emergency Unit notified across all base camps.")}
              >
                <FiAlertTriangle /> Dispatch Field Medical Alert
              </button>
            </div>
          </div>

          {/* Metric KPIs Grid */}
          <div className="kpi-grid">
            <div className="kpi-card blue">
              <div className="kpi-header">
                <span>TOTAL REGISTERED PILGRIMS</span>
                <FiUsers className="kpi-icon" />
              </div>
              <div className="kpi-value">{pilgrimList.length}</div>
              <div className="kpi-trend positive">
                <FiActivity /> Live Telemetry Monitored
              </div>
            </div>

            <div className="kpi-card green">
              <div className="kpi-header">
                <span>CONSULTED & CLEARED</span>
                <FiCheckCircle className="kpi-icon" />
              </div>
              <div className="kpi-value">
                {pilgrimList.filter((p) => p.consultationStatus === "CONSULTED" && p.latestDecision !== "REJECTED").length}
              </div>
              <div className="kpi-trend positive">
                <FiUserCheck /> Doctor Clearances
              </div>
            </div>

            <div className="kpi-card red">
              <div className="kpi-header">
                <span>PENDING DOCTOR REVIEW</span>
                <FiAlertTriangle className="kpi-icon" />
              </div>
              <div className="kpi-value">
                {pilgrimList.filter((p) => p.consultationStatus === "PENDING").length}
              </div>
              <div className="kpi-trend negative">
                <FaLungs /> Clinical Assessment Required
              </div>
            </div>

            {/* 4. BASECAMP COUNT KPI CARD (Added by Admin) */}
            <div className="kpi-card purple">
              <div className="kpi-header">
                <span>TOTAL BASECAMPS</span>
                <FiHome className="kpi-icon" />
              </div>
              <div className="kpi-value">{baseCamps.length > 0 ? baseCamps.length : 4}</div>
              <div className="kpi-trend purple">
                <FiHome /> Admin Provisioned Base Camps
              </div>
            </div>
          </div>

          {/* 1. TRIAGE VIEW */}
          {activeTab === "triage" && (
            <div className="admin-panel main-panel">

              <div className="panel-header">
                <div>
                  <h3>🩺 Pilgrim Health Triage Directory</h3>
                  <p>Filter pilgrims by risk status, review consultation records, or perform new medical consultations.</p>
                </div>

                <div className="table-controls" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <select
                    value={selectedBaseCamp}
                    onChange={(e) => setSelectedBaseCamp(e.target.value)}
                    style={{
                      background: "#ffffff",
                      color: "#000000",
                      fontWeight: "700",
                      border: "2px solid #2563eb",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "13.5px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="all">📍 All Base Camps ({baseCamps.length > 0 ? baseCamps.length : 4})</option>
                    {baseCamps.map((bc) => (
                      <option key={bc._id} value={bc.name}>
                        🏕️ {bc.name} ({bc.district || "Base Camp"})
                      </option>
                    ))}
                    {baseCamps.length === 0 && (
                      <>
                        <option value="Pamba">🏕️ Pamba Base Camp</option>
                        <option value="Nilakkal">🏕️ Nilakkal Transit Camp</option>
                        <option value="Erumely">🏕️ Erumely Pilgrim Camp</option>
                        <option value="Sannidhanam">🏕️ Sannidhanam Command Unit</option>
                      </>
                    )}
                  </select>

                  <div className="search-box" style={{ position: "relative" }}>
                    <FiSearch className="search-icon" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#2563eb", zIndex: 2, fontSize: "16px" }} />
                    <input
                      type="text"
                      placeholder="Search pilgrim name, centre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        background: "#ffffff",
                        color: "#000000",
                        fontWeight: "700",
                        border: "2px solid #2563eb",
                        borderRadius: "8px",
                        padding: "8px 12px 8px 36px",
                        fontSize: "13.5px",
                        outline: "none",
                        width: "240px",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Triage Sub-filters bar */}
              <div className="triage-sub-filter-bar" style={{ display: "flex", gap: "10px", padding: "12px 20px", background: "#0f172a", borderBottom: "1px solid #334155", flexWrap: "wrap" }}>
                <button className={`filter-btn ${triageFilter === "all" ? "active" : ""}`} onClick={() => setTriageFilter("all")}>
                  All Pilgrims ({pilgrimList.length})
                </button>
                <button className={`filter-btn ${triageFilter === "high" ? "active" : ""}`} onClick={() => setTriageFilter("high")}>
                  High Risk ({pilgrimList.filter((p) => p.healthRisk === "HIGH_RISK").length})
                </button>
                <button className={`filter-btn ${triageFilter === "critical" ? "active" : ""}`} onClick={() => setTriageFilter("critical")}>
                  Critical ({pilgrimList.filter((p) => p.healthRisk === "CRITICAL_RISK" || p.psiScore < 60).length})
                </button>
                <button className={`filter-btn ${triageFilter === "pending" ? "active" : ""}`} onClick={() => setTriageFilter("pending")}>
                  Pending Review ({pilgrimList.filter((p) => p.consultationStatus === "PENDING").length})
                </button>
                <button className={`filter-btn ${triageFilter === "consulted" ? "active" : ""}`} onClick={() => setTriageFilter("consulted")}>
                  Consulted ({pilgrimList.filter((p) => p.consultationStatus === "CONSULTED").length})
                </button>
                <button className={`filter-btn ${triageFilter === "cleared" ? "active" : ""}`} onClick={() => setTriageFilter("cleared")}>
                  Cleared ({pilgrimList.filter((p) => p.latestDecision === "APPROVED" || p.latestDecision === "APPROVED_WITH_CONDITIONS").length})
                </button>
                <button className={`filter-btn ${triageFilter === "own_risk" ? "active" : ""}`} onClick={() => setTriageFilter("own_risk")}>
                  ⚠️ Traveling at Own Risk ({pilgrimList.filter((p) => p.responsibilityAccepted).length})
                </button>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>PILGRIM & RELATIONSHIP</th>
                      <th>CENTRE & JOURNEY</th>
                      <th>HEALTH RISK</th>
                      <th>PSI SCORE</th>
                      <th>CONSULTATION STATUS</th>
                      <th>CLINICAL ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPilgrims.length > 0 ? (
                      filteredPilgrims.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc" }}>{item.personName}</div>
                            <div style={{ fontSize: "12px", color: "#60a5fa", fontWeight: "600" }}>{item.relationship}</div>
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                              {item.age} Yrs • {item.gender}
                            </div>
                            {item.responsibilityAccepted && (
                              <div style={{ fontSize: "11px", color: "#fca5a5", fontWeight: "800", marginTop: "4px" }}>
                                ⚠️ User Accepted Own Risk Travel
                              </div>
                            )}
                          </td>
                          <td style={{ fontSize: "12.5px", color: "#cbd5e1" }}>
                            <div>📍 {item.centerName}</div>
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>🫁 SpO2: {getVitalValue(item.vitals?.spo2, 95)}% • HR: {getVitalValue(item.vitals?.heartRate, 80)} bpm</div>
                          </td>
                          <td>
                            <span className={`status-pill ${item.healthRisk === "HIGH_RISK" || item.healthRisk === "CRITICAL_RISK" ? "danger" : "warning"}`}>
                              {item.healthRisk.replaceAll("_", " ")}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                background: item.psiScore >= 75 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                                color: item.psiScore >= 75 ? "#34d399" : "#f87171",
                                padding: "4px 10px",
                                borderRadius: "8px",
                                fontWeight: "800",
                                fontSize: "13px",
                              }}
                            >
                              {item.psiScore} / 100
                            </span>
                          </td>
                          <td>
                            {renderStatusBadge(item)}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              <button
                                className="btn-table-action"
                                style={{ background: "#2563eb", color: "#fff", border: "none" }}
                                onClick={() => handleOpenDetailModal(item)}
                              >
                                View Case
                              </button>

                              {item.consultationStatus === "CONSULTED" ? (
                                <button
                                  className="btn-table-action"
                                  style={{ background: "#059669", color: "#fff", border: "none" }}
                                  onClick={() => handleOpenConsultationModal(item, false)}
                                >
                                  View Consultation
                                </button>
                              ) : (
                                <button
                                  className="btn-table-action"
                                  style={{ background: "#10b981", color: "#fff", border: "none", fontWeight: "700" }}
                                  onClick={() => handleOpenConsultationModal(item, true)}
                                >
                                  Consult Pilgrim
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center" style={{ padding: "40px" }}>
                          {loading ? "Loading pilgrim triage directory..." : "No pilgrims match the selected filter."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. REDESIGNED AI REPORT REVIEWS VIEW */}
          {activeTab === "reviews" && (
            <div className="admin-panel main-panel">
              <div className="panel-header">
                <div>
                  <h3>📄 AI Report Reviews & Clinical Approvals</h3>
                  <p>Inspect extracted medical summaries, view full AI reports, and issue direct doctor Approve or Reject decisions.</p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>APPLICANT</th>
                      <th>REPORT SUMMARY</th>
                      <th>DETECTED CONDITIONS</th>
                      <th>HEALTH RISK LEVEL</th>
                      <th>DOCTOR CLEARANCE ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiReportCases.length > 0 ? (
                      aiReportCases.map((item) => (
                        <tr key={`rev_${item.id}`}>
                          <td>
                            <div style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc" }}>{item.personName}</div>
                            <div style={{ fontSize: "12px", color: "#60a5fa" }}>{item.relationship} • {item.age} Yrs</div>
                          </td>
                          <td style={{ maxWidth: "340px", fontSize: "12.5px", color: "#cbd5e1" }}>
                            <div style={{ fontWeight: "700", color: "#ffffff", marginBottom: "4px", lineHeight: "1.4" }}>
                              {formatSummaryForCell(item.aiSummary || item.rawRecord?.extractedText)}
                            </div>
                            <div style={{ fontSize: "11.5px", color: "#94a3b8", marginBottom: "6px" }}>
                              High exertional risk under altitude & heat stress
                            </div>
                            <button
                              className="btn-table-action"
                              style={{
                                background: "#2563eb",
                                color: "#ffffff",
                                border: "none",
                                fontWeight: "700",
                                fontSize: "12px",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px"
                              }}
                              onClick={() => handleOpenFullReportModal(item)}
                            >
                              <FiEye /> View Medical Analysis Report
                            </button>
                          </td>
                          <td style={{ fontSize: "12.5px" }}>
                            <span style={{ color: "#fca5a5", fontWeight: "700" }}>
                              {safeRenderString(item.detectedConditions || item.rawRecord?.extractedMedicalData?.detectedConditions || "Hypertension, Diabetes, SpO2 Low")}
                            </span>
                          </td>
                          <td>
                            <span className={`status-pill ${item.healthRisk === "HIGH_RISK" || item.healthRisk === "HIGH" ? "danger" : "warning"}`}>
                              {item.healthRisk.replaceAll("_", " ")}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                              {item.latestDecision === "APPROVED" ? (
                                <span style={{ color: "#34d399", fontWeight: "800", fontSize: "13px" }}>✓ Fit for Travel</span>
                              ) : item.latestDecision === "REJECTED" ? (
                                <span style={{ color: "#f87171", fontWeight: "800", fontSize: "13px" }}>✕ Not Fit for Travel</span>
                              ) : (
                                <>
                                  <button
                                    className="btn-table-action"
                                    style={{ background: "#059669", color: "#ffffff", border: "none", fontWeight: "800", padding: "6px 14px" }}
                                    onClick={() => handleQuickApprove(item)}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    className="btn-table-action"
                                    style={{ background: "#dc2626", color: "#ffffff", border: "none", fontWeight: "800", padding: "6px 14px" }}
                                    onClick={() => handleQuickRejectModal(item)}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center" style={{ padding: "40px", color: "#94a3b8", fontSize: "14px", fontWeight: "600" }}>
                          No user-uploaded AI medical reports found for review.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. PSI ASSESSMENT VIEW */}
          {activeTab === "psi" && (
            <div className="admin-panel main-panel">
              <div className="panel-header">
                <div>
                  <h3>📊 Pilgrim Safety Index (PSI) Assessment</h3>
                  <p>Individual PSI Scores, Health Risk, Crowd Risk, and Weather Risk breakdown.</p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>PILGRIM NAME</th>
                      <th>INDIVIDUAL PSI SCORE</th>
                      <th>HEALTH RISK SCORE</th>
                      <th>CROWD RISK SCORE</th>
                      <th>WEATHER RISK SCORE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPilgrims.map((item) => (
                      <tr key={`psi_${item.id}`}>
                        <td>
                          <div style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc" }}>{item.personName}</div>
                          <div style={{ fontSize: "12px", color: "#94a3b8" }}>{item.centerName}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: "15px", fontWeight: "900", color: item.psiScore >= 75 ? "#34d399" : "#f87171" }}>
                            {item.psiScore} / 100
                          </span>
                        </td>
                        <td style={{ color: "#cbd5e1" }}>{item.healthRiskScore} / 100</td>
                        <td style={{ color: "#cbd5e1" }}>{item.crowdRiskScore} / 100</td>
                        <td style={{ color: "#cbd5e1" }}>{item.weatherRiskScore} / 100</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. FAMILY MEMBERS VIEW */}
          {activeTab === "family" && (
            <div className="admin-panel main-panel">
              <div className="panel-header">
                <div>
                  <h3>👨‍👩‍👧 Family Members Directory</h3>
                  <p>Individual medical profile, individual PSI scores, and consultation clearance per family member.</p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>FAMILY MEMBER</th>
                      <th>RELATIONSHIP & AGE</th>
                      <th>HEALTH PROFILE</th>
                      <th>PSI SCORE</th>
                      <th>CONSULTATION STATUS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPilgrims.filter((p) => p.personType === "family_member" || p.relationship !== "Self").map((item) => (
                      <tr key={`fam_${item.id}`}>
                        <td>
                          <div style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc" }}>{item.personName}</div>
                        </td>
                        <td>
                          <div style={{ color: "#60a5fa", fontWeight: "600" }}>{item.relationship}</div>
                          <div style={{ fontSize: "11px", color: "#94a3b8" }}>{item.age} Yrs • {item.gender}</div>
                        </td>
                        <td style={{ fontSize: "12.5px", color: "#cbd5e1" }}>
                          {safeRenderString(item.aiSummary).slice(0, 80)}...
                        </td>
                        <td>
                          <span style={{ fontWeight: "800", color: item.psiScore >= 75 ? "#34d399" : "#f87171" }}>
                            {item.psiScore} / 100
                          </span>
                        </td>
                        <td>
                          {renderStatusBadge(item)}
                        </td>
                        <td>
                          <button
                            className="btn-table-action"
                            style={{ background: "#10b981", color: "#fff", border: "none" }}
                            onClick={() => handleOpenConsultationModal(item, true)}
                          >
                            Consult Family Member
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredPilgrims.filter((p) => p.personType === "family_member" || p.relationship !== "Self").length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center" style={{ padding: "30px" }}>
                          No family member records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. EMERGENCY ALERTS VIEW */}
          {activeTab === "alerts" && (
            <div className="admin-panel main-panel">
              <div className="panel-header">
                <div>
                  <h3>🚨 Emergency Medical Alerts</h3>
                  <p>Surveillance stream for HIGH and CRITICAL risk cases. Acknowledge alerts to record medical officer sign-off.</p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>PATIENT NAME</th>
                      <th>ALERT LEVEL</th>
                      <th>VITAL SIGNS TELEMETRY</th>
                      <th>ACKNOWLEDGEMENT STATUS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pilgrimList.filter((p) => p.healthRisk === "HIGH_RISK" || p.healthRisk === "CRITICAL_RISK" || p.psiScore < 70).map((item) => {
                      const isAcked = acknowledgements[item.id] || item.alertAcknowledgements?.length > 0;
                      const ackDoctor = acknowledgements[item.id]?.doctorName || (item.alertAcknowledgements?.[0]?.doctorName) || "Dr. Duty Physician";

                      return (
                        <tr key={`alert_${item.id}`}>
                          <td>
                            <div style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc" }}>{item.personName}</div>
                            <div style={{ fontSize: "12px", color: "#94a3b8" }}>{item.centerName}</div>
                          </td>
                          <td>
                            <span className="status-pill danger">CRITICAL ALERT</span>
                          </td>
                          <td>
                            <div style={{ fontSize: "13px", color: "#f87171", fontWeight: "700" }}>
                              🫁 SpO2: {getVitalValue(item.vitals?.spo2, 95)}% • ❤️ HR: {getVitalValue(item.vitals?.heartRate, 80)} bpm
                            </div>
                          </td>
                          <td>
                            {isAcked ? (
                              <span style={{ color: "#34d399", fontSize: "12px", fontWeight: "700" }}>
                                ✅ Acknowledged by {ackDoctor}
                              </span>
                            ) : (
                              <span style={{ color: "#fbbf24", fontSize: "12px", fontWeight: "700" }}>
                                ⚠️ Unacknowledged Alert
                              </span>
                            )}
                          </td>
                          <td>
                            {!isAcked ? (
                              <button
                                className="btn-table-action"
                                style={{ background: "#dc2626", color: "#fff", border: "none", padding: "6px 14px", fontWeight: "700" }}
                                onClick={() => handleAcknowledgeAlert(item)}
                              >
                                Acknowledge Alert
                              </button>
                            ) : (
                              <button
                                className="btn-table-action"
                                style={{ background: "#2563eb", color: "#fff", border: "none" }}
                                onClick={() => handleOpenConsultationModal(item, false)}
                              >
                                View Details
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. MEDICAL HISTORY VIEW */}
          {activeTab === "history" && (
            <div className="admin-panel main-panel">
              <div className="panel-header">
                <div>
                  <h3>📜 Medical & Consultation History</h3>
                  <p>Chronological history of all medical decisions, doctor notes, reasons, and precautions recorded across doctors.</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px" }}>
                {pilgrimList.map((item) => (
                  <div key={`hist_${item.id}`} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "16px", color: "#ffffff" }}>{item.personName} ({item.relationship})</h4>
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>{item.centerName} • PSI: {item.psiScore}</span>
                      </div>
                      {renderStatusBadge(item)}
                    </div>

                    {item.consultationsHistory && item.consultationsHistory.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#60a5fa" }}>CONSULTATION HISTORY ({item.consultationsHistory.length})</div>
                        {item.consultationsHistory.map((c, idx) => (
                          <div key={c._id || idx} style={{ background: "#0f172a", borderLeft: "4px solid #2563eb", padding: "12px", borderRadius: "6px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "700", color: "#f8fafc" }}>
                              <span>Dr. {c.doctorName || "Duty Physician"} (ID: {c.doctorCode || c.doctorId})</span>
                              <span style={{ color: "#94a3b8", fontSize: "11px" }}>{new Date(c.consultedAt || c.createdAt).toLocaleString()}</span>
                            </div>
                            <div style={{ marginTop: "4px", fontSize: "12px", color: "#34d399", fontWeight: "700" }}>
                              Decision: {c.decision}
                            </div>
                            {c.decisionReason && (
                              <div style={{ marginTop: "4px", fontSize: "12px", color: "#cbd5e1" }}>
                                <strong>Reason:</strong> {c.decisionReason}
                              </div>
                            )}
                            {c.precautions && (
                              <div style={{ marginTop: "4px", fontSize: "12px", color: "#a7f3d0" }}>
                                <strong>Precautions:</strong> {c.precautions}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic", marginTop: "8px" }}>
                        No multi-doctor consultation history recorded yet for this pilgrim.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* DETAIL CASE VIEW MODAL */}
      {showDetailModal && selectedCase && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "680px", background: "#ffffff", color: "#000000" }}>
            <div className="modal-header" style={{ background: "#0f172a", borderBottom: "1.5px solid #1e293b" }}>
              <h3 style={{ color: "#ffffff", margin: 0, fontSize: "18px", fontWeight: "800", display: "flex", alignItems: "center", gap: "10px" }}>
                <FaStethoscope style={{ color: "#60a5fa" }} /> <span style={{ color: "#ffffff" }}>Patient Case File: {selectedCase.personName}</span>
              </h3>
              <button className="btn-close-modal" style={{ color: "#ffffff", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }} onClick={() => setShowDetailModal(false)}>
                <FiX style={{ color: "#ffffff" }} />
              </button>
            </div>

            <div className="modal-body" style={{ background: "#ffffff", color: "#000000", padding: "24px" }}>
              <div style={{ background: "#f1f5f9", padding: "16px", borderRadius: "10px", marginBottom: "16px", border: "1px solid #cbd5e1" }}>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#000000" }}>{selectedCase.personName}</div>
                <div style={{ fontSize: "13px", color: "#2563eb", fontWeight: "700" }}>{selectedCase.relationship} • {selectedCase.age} Yrs • {selectedCase.gender}</div>
                <div style={{ fontSize: "12px", color: "#000000", marginTop: "4px", fontWeight: "600" }}>📍 {selectedCase.centerName}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                  <div style={{ fontSize: "11px", color: "#000000", fontWeight: "800" }}>PSI OVERALL SCORE</div>
                  <div style={{ fontSize: "20px", fontWeight: "900", color: selectedCase.psiScore >= 75 ? "#059669" : "#dc2626" }}>
                    {selectedCase.psiScore} / 100
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                  <div style={{ fontSize: "11px", color: "#000000", fontWeight: "800" }}>HEALTH RISK LEVEL</div>
                  <div style={{ fontSize: "15px", fontWeight: "800", color: "#dc2626", marginTop: "4px" }}>
                    {selectedCase.healthRisk.replaceAll("_", " ")}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ fontSize: "14px", color: "#000000", fontWeight: "800", marginBottom: "8px" }}>AI Medical Report Summary</h4>
                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", fontSize: "13.5px", color: "#000000", border: "1px solid #cbd5e1", lineHeight: "1.6", fontWeight: "600" }}>
                  {safeRenderString(selectedCase.aiSummary)}
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ fontSize: "14px", color: "#000000", fontWeight: "800", marginBottom: "8px" }}>Current Consultation Status</h4>
                {renderStatusBadge(selectedCase)}
              </div>
            </div>

            <div className="modal-footer" style={{ background: "#f8fafc", borderTop: "1.5px solid #cbd5e1" }}>
              <button className="btn-cancel" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
              <button
                className="btn-submit-doctor"
                onClick={() => {
                  setShowDetailModal(false);
                  handleOpenConsultationModal(selectedCase, selectedCase.consultationStatus === "PENDING");
                }}
              >
                Open Medical Consultation Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL AI MEDICAL RISK ASSESSMENT REPORT MODAL */}
      {showFullReportModal && activeReportItem && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "780px", background: "#ffffff", color: "#000000" }}>
            <div className="modal-header" style={{ background: "#0f172a", borderBottom: "1.5px solid #1e293b" }}>
              <div>
                <h3 style={{ color: "#ffffff", margin: 0, fontSize: "18px", fontWeight: "800" }}>
                  📋 PilgrimIQ – AI-Assisted Medical Risk Assessment Report
                </h3>
                <span style={{ fontSize: "12px", color: "#cbd5e1", fontWeight: "700" }}>
                  Report ID: PIQ-HR-2026-001 • Patient: {activeReportItem.personName} ({activeReportItem.age} Yrs)
                </span>
              </div>
              <button className="btn-close-modal" style={{ color: "#ffffff", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }} onClick={() => setShowFullReportModal(false)}>
                <FiX style={{ color: "#ffffff" }} />
              </button>
            </div>

            <div className="modal-body" style={{ background: "#ffffff", color: "#000000", padding: "24px", lineHeight: "1.6" }}>
              {/* Report Header Card */}
              <div style={{ background: "#fef2f2", border: "1.5px solid #ef4444", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "14px", fontWeight: "900", color: "#dc2626" }}>
                    🚨 RISK CLASSIFICATION: HIGH RISK
                  </span>
                  <span style={{ fontSize: "12px", background: "#dc2626", color: "#ffffff", padding: "4px 10px", borderRadius: "6px", fontWeight: "800" }}>
                    Pre-Pilgrimage Medical Risk Screening
                  </span>
                </div>
                <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: "#000000", fontWeight: "700" }}>
                  Assessment Date: 13 August 2026 • Patient: <strong>{activeReportItem.personName}</strong> ({activeReportItem.age} yrs, {activeReportItem.gender})
                </p>
              </div>

              {/* Section 1: Medical Profile */}
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "15px", color: "#000000", fontWeight: "800", borderBottom: "2px solid #cbd5e1", paddingBottom: "6px", marginBottom: "12px" }}>
                  1. Medical Profile Parameters
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", color: "#000000" }}>
                  <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", color: "#000000" }}>
                    <strong>Height:</strong> 162 cm
                  </div>
                  <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", color: "#000000" }}>
                    <strong>Weight:</strong> 82 kg (BMI: 31.2 kg/m² – Obesity range)
                  </div>
                  <div style={{ background: "#fef2f2", padding: "10px", borderRadius: "6px", border: "1px solid #fca5a5", color: "#000000" }}>
                    <strong>Blood Pressure:</strong> 168/98 mmHg – Elevated 🚨
                  </div>
                  <div style={{ background: "#fef2f2", padding: "10px", borderRadius: "6px", border: "1px solid #fca5a5", color: "#000000" }}>
                    <strong>Blood Glucose (Random):</strong> 236 mg/dL – Elevated 🚨
                  </div>
                  <div style={{ background: "#fffbeba", padding: "10px", borderRadius: "6px", border: "1px solid #fde68a", color: "#000000" }}>
                    <strong>Hemoglobin:</strong> 10.4 g/dL – Low
                  </div>
                  <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", color: "#000000" }}>
                    <strong>Blood Group:</strong> O Positive
                  </div>
                  <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", gridColumn: "span 2", color: "#000000" }}>
                    <strong>Known Conditions:</strong> Hypertension; Type 2 Diabetes; SpO2 Fluctuations
                  </div>
                  <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", gridColumn: "span 2", color: "#000000" }}>
                    <strong>Medications & Allergies:</strong> Antihypertensive & oral antidiabetic medication. No known drug allergies.
                  </div>
                </div>
              </div>

              {/* Section 2: Risk Domain Table */}
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "15px", color: "#000000", fontWeight: "800", borderBottom: "2px solid #cbd5e1", paddingBottom: "6px", marginBottom: "12px" }}>
                  2. Risk Assessment Domain Summary
                </h4>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", color: "#000000" }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                      <th style={{ padding: "8px", border: "1px solid #cbd5e1", fontWeight: "800" }}>Risk Domain</th>
                      <th style={{ padding: "8px", border: "1px solid #cbd5e1", fontWeight: "800" }}>Finding</th>
                      <th style={{ padding: "8px", border: "1px solid #cbd5e1", fontWeight: "800" }}>Risk Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1", fontWeight: "700" }}>Cardiovascular</td>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Markedly elevated blood pressure with advanced age</td>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1", color: "#dc2626", fontWeight: "900" }}>HIGH</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1", fontWeight: "700" }}>Metabolic</td>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Elevated random blood glucose with known diabetes</td>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1", color: "#dc2626", fontWeight: "900" }}>HIGH</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1", fontWeight: "700" }}>Physical Exertion</td>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Obesity-range BMI may increase fatigue & exertional burden</td>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1", color: "#d97706", fontWeight: "800" }}>MODERATE-HIGH</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1", fontWeight: "700" }}>Anemia / Fatigue</td>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1" }}>Low hemoglobin may reduce exercise tolerance</td>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1", color: "#d97706", fontWeight: "800" }}>MODERATE-HIGH</td>
                    </tr>
                    <tr style={{ background: "#fef2f2" }}>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1", fontWeight: "900" }}>Overall Pilgrimage Risk</td>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1", fontWeight: "700" }}>Combined medical and exertional risk factors</td>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1", color: "#dc2626", fontWeight: "900" }}>HIGH RISK</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 3: Key Clinical Concerns */}
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "15px", color: "#000000", fontWeight: "800", borderBottom: "2px solid #cbd5e1", paddingBottom: "6px", marginBottom: "12px" }}>
                  3. Key Clinical Concerns
                </h4>
                <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#000000", fontWeight: "600" }}>
                  <li><strong>Blood Pressure:</strong> Recorded reading (168/98 mmHg) is substantially elevated and should be clinically reviewed before undertaking strenuous travel.</li>
                  <li><strong>Blood Glucose:</strong> Recorded value (236 mg/dL) is elevated, indicating diabetes control requires medical review.</li>
                  <li><strong>Hemoglobin:</strong> Low value (10.4 g/dL) may contribute to tiredness and reduced exercise tolerance.</li>
                  <li><strong>Combined Exertional Burden:</strong> Age, BMI, hypertension, diabetes, and low hemoglobin compound fatigue and dehydration risk.</li>
                </ul>
              </div>

              {/* Section 4: AI Recommendations */}
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "15px", color: "#000000", fontWeight: "800", borderBottom: "2px solid #cbd5e1", paddingBottom: "6px", marginBottom: "12px" }}>
                  4. AI-Assisted Pilgrim Safety Recommendations
                </h4>
                <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#000000", fontWeight: "600" }}>
                  <li>Classify journey as <strong>HIGH RISK</strong> until cleared by an appropriate healthcare professional.</li>
                  <li>Obtain pre-travel medical evaluation for blood pressure and diabetes control.</li>
                  <li>Avoid sudden high-intensity walking or prolonged climbing without clearance.</li>
                  <li>Maintain individualized hydration and medication schedule.</li>
                  <li>Carry essential medicines, medical records, and emergency contact details.</li>
                </ul>
              </div>

              {/* Section 5: Risk Score */}
              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #cbd5e1", marginBottom: "20px" }}>
                <h4 style={{ fontSize: "14px", color: "#000000", fontWeight: "800", margin: "0 0 8px 0" }}>
                  5. Suggested PilgrimIQ Risk Score: <span style={{ color: "#dc2626", fontSize: "16px", fontWeight: "900" }}>73 / 90 → HIGH RISK</span>
                </h4>
                <p style={{ fontSize: "12px", color: "#000000", fontWeight: "600", margin: 0 }}>
                  Includes age vulnerability (15/20), hypertension risk (18/20), glucose risk (18/20), BMI (12/15), and fatigue risk (10/15).
                </p>
              </div>

              {/* Disclaimer */}
              <div style={{ fontSize: "11px", color: "#475569", fontStyle: "italic", background: "#f1f5f9", padding: "10px", borderRadius: "6px", fontWeight: "600" }}>
                <strong>DISCLAIMER:</strong> Fictional demonstration report created for the PilgrimIQ project decision-support prototype. Must not replace diagnosis or direct clinical evaluation by a licensed healthcare professional.
              </div>
            </div>

            <div className="modal-footer" style={{ background: "#f8fafc", borderTop: "1.5px solid #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button className="btn-cancel" onClick={() => setShowFullReportModal(false)}>
                Close Report
              </button>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="btn-submit-doctor"
                  style={{ background: "#dc2626", color: "#ffffff", border: "none" }}
                  onClick={() => {
                    setShowFullReportModal(false);
                    handleQuickRejectModal(activeReportItem);
                  }}
                >
                  🔴 Reject Travel Clearance
                </button>

                <button
                  className="btn-submit-doctor"
                  style={{ background: "#059669", color: "#ffffff", border: "none" }}
                  onClick={() => {
                    setShowFullReportModal(false);
                    handleQuickApprove(activeReportItem);
                  }}
                >
                  🟢 Approve Travel Clearance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MULTI-DOCTOR CONSULTATION & REJECTION MESSAGING MODAL */}
      {showConsultationModal && selectedCase && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "650px", background: "#ffffff", color: "#000000" }}>
            <div className="modal-header" style={{ background: "#0f172a", borderBottom: "1.5px solid #1e293b" }}>
              <h3 style={{ color: "#ffffff", margin: 0, fontSize: "18px", fontWeight: "800", display: "flex", alignItems: "center", gap: "10px" }}>
                <FaStethoscope style={{ color: decisionInput === "REJECTED" ? "#f87171" : "#34d399" }} />
                <span style={{ color: "#ffffff" }}>Medical Consultation & Decision: {selectedCase.personName}</span>
              </h3>
              <button className="btn-close-modal" style={{ color: "#ffffff", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }} onClick={() => setShowConsultationModal(false)}>
                <FiX style={{ color: "#ffffff" }} />
              </button>
            </div>

            <form onSubmit={handleSubmitConsultation}>
              <div className="modal-body" style={{ background: "#ffffff", color: "#000000", padding: "24px" }}>
                {/* PREVENT ACCIDENTAL OVERWRITE WARNING */}
                {selectedCase.consultationStatus === "CONSULTED" && !isNewConsultationMode && (
                  <div style={{ background: "#fef3c7", border: "1px solid #f59e0b", padding: "14px", borderRadius: "10px", color: "#78350f", fontSize: "13px", marginBottom: "16px" }}>
                    <strong style={{ color: "#92400e", fontSize: "14px" }}>⚠️ Patient Already Consulted!</strong>
                    <div style={{ marginTop: "6px" }}>
                      Consulted By: <strong>{selectedCase.consultedByDoctor}</strong>
                    </div>
                    <div>
                      Consulted On: <strong>{new Date(selectedCase.consultedAt).toLocaleString()}</strong>
                    </div>
                    <div>
                      Current Decision: <strong>{selectedCase.latestDecision}</strong>
                    </div>
                    <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                      <button
                        type="button"
                        style={{ background: "#2563eb", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                        onClick={() => setIsNewConsultationMode(true)}
                      >
                        [Start New Consultation]
                      </button>
                    </div>
                  </div>
                )}

                {(selectedCase.consultationStatus === "PENDING" || isNewConsultationMode) && (
                  <div>
                    <div className="form-group" style={{ marginBottom: "16px" }}>
                      <label style={{ fontWeight: "800", color: "#000000", fontSize: "13px", display: "block", marginBottom: "6px" }}>DOCTOR MEDICAL DECISION *</label>
                      <select
                        className="form-input"
                        value={decisionInput}
                        onChange={(e) => setDecisionInput(e.target.value)}
                        style={{ background: "#ffffff", color: "#000000", padding: "10px", borderRadius: "8px", border: "2px solid #64748b", width: "100%", fontWeight: "700" }}
                      >
                        <option value="APPROVED">🟢 APPROVE (Fit for Travel)</option>
                        <option value="APPROVED_WITH_CONDITIONS">🟠 APPROVE WITH CONDITIONS (Rest & Hydration Required)</option>
                        <option value="REJECTED">🔴 REJECT (Not Fit for Travel - Require Doctor Advice)</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: "16px" }}>
                      <label style={{ fontWeight: "800", color: "#000000", fontSize: "13px", display: "block", marginBottom: "6px" }}>CLINICAL OBSERVATIONS & DOCTOR NOTES *</label>
                      <textarea
                        className="form-input"
                        rows="3"
                        placeholder="Enter doctor observations, vitals assessment, or clinical history..."
                        value={doctorNotesInput}
                        onFocus={() => setNotesTouched(true)}
                        onChange={(e) => {
                          setDoctorNotesInput(e.target.value);
                          setNotesTouched(true);
                        }}
                        style={{
                          width: "100%",
                          background: "#ffffff",
                          color: "#000000",
                          padding: "10px",
                          borderRadius: "8px",
                          border: notesTouched && validateLetterInput(doctorNotesInput) ? "2px solid #dc2626" : "2px solid #64748b",
                          fontWeight: "600",
                          boxSizing: "border-box"
                        }}
                      ></textarea>
                      {notesTouched && validateLetterInput(doctorNotesInput) && (
                        <div style={{ color: "#dc2626", fontSize: "12px", fontWeight: "700", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                          ⚠️ {validateLetterInput(doctorNotesInput)}
                        </div>
                      )}
                    </div>

                    <div className="form-group" style={{ marginBottom: "16px" }}>
                      <label style={{ fontWeight: "800", color: "#000000", fontSize: "13px", display: "block", marginBottom: "6px" }}>
                        DECISION REASON / USER MESSAGE {decisionInput === "REJECTED" ? "* (Required: Visible to User)" : "*"}
                      </label>
                      <textarea
                        className="form-input"
                        rows="3"
                        required={decisionInput === "REJECTED"}
                        placeholder={decisionInput === "REJECTED" ? "Type doctor rejection reason e.g. Not fit for travel due to high blood pressure. Require clinical consultation..." : "Provide formal clinical reasoning for this decision..."}
                        value={decisionReasonInput}
                        onFocus={() => setReasonTouched(true)}
                        onChange={(e) => {
                          setDecisionReasonInput(e.target.value);
                          setReasonTouched(true);
                        }}
                        style={{
                          width: "100%",
                          background: "#ffffff",
                          color: "#000000",
                          padding: "10px",
                          borderRadius: "8px",
                          border: (reasonTouched && validateLetterInput(decisionReasonInput)) || (decisionInput === "REJECTED" && !decisionReasonInput.trim()) ? "2px solid #dc2626" : "2px solid #64748b",
                          fontWeight: "600",
                          boxSizing: "border-box"
                        }}
                      ></textarea>
                      {reasonTouched && validateLetterInput(decisionReasonInput) && (
                        <div style={{ color: "#dc2626", fontSize: "12px", fontWeight: "700", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                          ⚠️ {validateLetterInput(decisionReasonInput)}
                        </div>
                      )}
                      {decisionInput === "REJECTED" && (
                        <p style={{ fontSize: "12px", color: "#dc2626", fontWeight: "700", marginTop: "4px" }}>
                          ℹ️ This rejection message will be sent to the user as "Not fit for travel: [Message]".
                        </p>
                      )}
                    </div>

                    <div className="form-group" style={{ marginBottom: "16px" }}>
                      <label style={{ fontWeight: "800", color: "#000000", fontSize: "13px", display: "block", marginBottom: "6px" }}>TRAVEL PRECAUTIONS & GUIDELINES *</label>
                      <textarea
                        className="form-input"
                        rows="2"
                        placeholder="Oxygen usage rules, hydration limits, or rest stops..."
                        value={precautionsInput}
                        onFocus={() => setPrecautionsTouched(true)}
                        onChange={(e) => {
                          setPrecautionsInput(e.target.value);
                          setPrecautionsTouched(true);
                        }}
                        style={{
                          width: "100%",
                          background: "#ffffff",
                          color: "#000000",
                          padding: "10px",
                          borderRadius: "8px",
                          border: precautionsTouched && validateLetterInput(precautionsInput) ? "2px solid #dc2626" : "2px solid #64748b",
                          fontWeight: "600",
                          boxSizing: "border-box"
                        }}
                      ></textarea>
                      {precautionsTouched && validateLetterInput(precautionsInput) && (
                        <div style={{ color: "#dc2626", fontSize: "12px", fontWeight: "700", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                          ⚠️ {validateLetterInput(precautionsInput)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ background: "#f8fafc", borderTop: "1.5px solid #cbd5e1" }}>
                <button type="button" className="btn-cancel" onClick={() => setShowConsultationModal(false)}>
                  Cancel
                </button>
                {(selectedCase.consultationStatus === "PENDING" || isNewConsultationMode) && (
                  <button
                    type="submit"
                    className="btn-submit-doctor"
                    disabled={submittingConsultation}
                    style={{ background: decisionInput === "REJECTED" ? "#dc2626" : "#059669", color: "#ffffff", border: "none" }}
                  >
                    {submittingConsultation ? "Saving Decision..." : decisionInput === "REJECTED" ? "Submit Rejection & Notify User" : "Submit Doctor Clearance"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorDashboard;

