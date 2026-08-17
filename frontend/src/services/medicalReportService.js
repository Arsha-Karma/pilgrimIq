const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const getHeaders = (token) => {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `API request failed with status ${response.status}`);
  }
  return data;
};

// Upload & Analyze Report
export const apiUploadMedicalReport = async (reportPayload, token) => {
  const res = await fetch(`${API_BASE_URL}/medical-reports/upload`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(reportPayload),
  });
  return handleResponse(res);
};

// Get User's Own Reports
export const apiGetMyMedicalReports = async (token) => {
  const res = await fetch(`${API_BASE_URL}/medical-reports/my-reports`, {
    method: "GET",
    headers: getHeaders(token),
  });
  return handleResponse(res);
};

// Get Single Report by ID
export const apiGetMedicalReportById = async (reportId, token) => {
  const res = await fetch(`${API_BASE_URL}/medical-reports/${reportId}`, {
    method: "GET",
    headers: getHeaders(token),
  });
  return handleResponse(res);
};

// Delete Report by ID
export const apiDeleteMedicalReport = async (reportId, token) => {
  const res = await fetch(`${API_BASE_URL}/medical-reports/${reportId}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  return handleResponse(res);
};

// Update Report Details by ID
export const apiUpdateMedicalReport = async (reportId, updatePayload, token) => {
  const res = await fetch(`${API_BASE_URL}/medical-reports/${reportId}`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify(updatePayload),
  });
  return handleResponse(res);
};

// Get Family Member Reports
export const apiGetFamilyMemberReports = async (familyMemberId, token) => {
  const res = await fetch(`${API_BASE_URL}/medical-reports/family/${familyMemberId}`, {
    method: "GET",
    headers: getHeaders(token),
  });
  return handleResponse(res);
};

// Re-analyze Report
export const apiAnalyzeMedicalReport = async (reportId, token) => {
  const res = await fetch(`${API_BASE_URL}/medical-reports/${reportId}/analyze`, {
    method: "POST",
    headers: getHeaders(token),
  });
  return handleResponse(res);
};

// Send Report for Physician Review
export const apiSendReportForReview = async (reportId, token) => {
  const res = await fetch(`${API_BASE_URL}/medical-reports/${reportId}/send-for-review`, {
    method: "POST",
    headers: getHeaders(token),
  });
  return handleResponse(res);
};

// Physician: Get Review Queue
export const apiGetPhysicianReviews = async (token) => {
  const res = await fetch(`${API_BASE_URL}/physician/medical-reviews`, {
    method: "GET",
    headers: getHeaders(token),
  });
  return handleResponse(res);
};

// Physician: Submit Review Decision
export const apiSubmitPhysicianReview = async (reportId, decisionData, token) => {
  const res = await fetch(`${API_BASE_URL}/physician/medical-reviews/${reportId}`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify(decisionData),
  });
  return handleResponse(res);
};

// Physician / Admin: Get All Uploaded Medical Reports
export const apiGetAllMedicalReports = async (token) => {
  const res = await fetch(`${API_BASE_URL}/medical-reports/all`, {
    method: "GET",
    headers: getHeaders(token),
  });
  return handleResponse(res);
};
