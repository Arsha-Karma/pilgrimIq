import { fetchAPI, getHeaders } from "./api";

// Upload & Analyze Report
export const apiUploadMedicalReport = async (reportPayload, token) => {
  return fetchAPI("/medical-reports/upload", {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(reportPayload),
  });
};

// Get User's Own Reports
export const apiGetMyMedicalReports = async (token) => {
  return fetchAPI("/medical-reports/my-reports", {
    method: "GET",
    headers: getHeaders(token),
  });
};

// Get Single Report by ID
export const apiGetMedicalReportById = async (reportId, token) => {
  return fetchAPI(`/medical-reports/${reportId}`, {
    method: "GET",
    headers: getHeaders(token),
  });
};

// Delete Report by ID
export const apiDeleteMedicalReport = async (reportId, token) => {
  return fetchAPI(`/medical-reports/${reportId}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
};

// Update Report Details by ID
export const apiUpdateMedicalReport = async (reportId, updatePayload, token) => {
  return fetchAPI(`/medical-reports/${reportId}`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify(updatePayload),
  });
};

// Get Family Member Reports
export const apiGetFamilyMemberReports = async (familyMemberId, token) => {
  return fetchAPI(`/medical-reports/family/${familyMemberId}`, {
    method: "GET",
    headers: getHeaders(token),
  });
};

// Re-analyze Report
export const apiAnalyzeMedicalReport = async (reportId, token) => {
  return fetchAPI(`/medical-reports/${reportId}/analyze`, {
    method: "POST",
    headers: getHeaders(token),
  });
};

// Send Report for Physician Review
export const apiSendReportForReview = async (reportId, token) => {
  return fetchAPI(`/medical-reports/${reportId}/send-for-review`, {
    method: "POST",
    headers: getHeaders(token),
  });
};

// Physician: Get Review Queue
export const apiGetPhysicianReviews = async (token) => {
  return fetchAPI("/physician/medical-reviews", {
    method: "GET",
    headers: getHeaders(token),
  });
};

// Physician: Submit Review Decision
export const apiSubmitPhysicianReview = async (reportId, decisionData, token) => {
  return fetchAPI(`/physician/medical-reviews/${reportId}`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify(decisionData),
  });
};

// Doctor Dashboard APIs
export const apiGetDoctorPilgrims = async (token) => {
  return fetchAPI("/doctor/pilgrims", {
    method: "GET",
    headers: getHeaders(token),
  });
};

export const apiGetDoctorPilgrimById = async (id, token) => {
  return fetchAPI(`/doctor/pilgrims/${id}`, {
    method: "GET",
    headers: getHeaders(token),
  });
};

export const apiGetPilgrimConsultations = async (id, token) => {
  return fetchAPI(`/doctor/pilgrims/${id}/consultations`, {
    method: "GET",
    headers: getHeaders(token),
  });
};

export const apiSubmitDoctorConsultation = async (consultationData, token) => {
  return fetchAPI("/doctor/consultations", {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(consultationData),
  });
};

export const apiAcknowledgeEmergencyAlert = async (alertId, token) => {
  return fetchAPI(`/doctor/alerts/${alertId}/acknowledge`, {
    method: "POST",
    headers: getHeaders(token),
  });
};

// Physician / Admin: Get All Uploaded Medical Reports
export const apiGetAllMedicalReports = async (token) => {
  return fetchAPI("/medical-reports/all", {
    method: "GET",
    headers: getHeaders(token),
  });
};
