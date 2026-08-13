const DEFAULT_API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000/api";

export const getHeaders = (token) => {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const fetchAPI = async (endpoint, options = {}) => {
  const urls = [
    `${DEFAULT_API_URL}${endpoint}`,
    DEFAULT_API_URL.includes("127.0.0.1")
      ? `http://localhost:5000/api${endpoint}`
      : `http://127.0.0.1:5000/api${endpoint}`,
  ];

  let lastError = null;
  for (const url of urls) {
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }
      return data;
    } catch (error) {
      if (error.name === "TypeError" && (error.message.includes("Failed to fetch") || error.message.includes("fetch"))) {
        lastError = error;
        continue; // Try secondary host URL before throwing
      }
      throw error;
    }
  }

  throw lastError || new Error("Server connection failed. Please ensure backend server is running on port 5000.");
};


export const apiLogin = async (email, password) => {
  return fetchAPI("/auth/login", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ email, password }),
  });
};

export const apiRegister = async (userData) => {
  return fetchAPI("/auth/register", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(userData),
  });
};

export const apiGoogleLogin = async (googlePayload) => {
  return fetchAPI("/auth/google", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(googlePayload),
  });
};

export const apiGetProfile = async (token) => {
  return fetchAPI("/auth/profile", {
    method: "GET",
    headers: getHeaders(token),
  });
};

export const apiForgotPassword = async (email) => {
  return fetchAPI("/auth/forgot-password", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ email }),
  });
};

export const apiVerifyCode = async (email, otpCode) => {
  return fetchAPI("/auth/verify-code", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ email, otpCode }),
  });
};

export const apiResetPassword = async (resetToken, password, email = "") => {
  return fetchAPI("/auth/reset-password", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ resetToken, otpCode: resetToken, password, email }),
  });
};

export const apiGetAllUsers = async (token) => {
  return fetchAPI("/auth/users", {
    method: "GET",
    headers: getHeaders(token),
  });
};

export const apiRegisterDoctor = async (doctorData, token) => {
  return fetchAPI("/auth/register-doctor", {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(doctorData),
  });
};

export const apiUpdateProfile = async (profileData, token) => {
  return fetchAPI("/auth/profile", {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify(profileData),
  });
};

export const apiAddFamilyMember = async (memberData, token) => {
  return fetchAPI("/auth/family-members", {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(memberData),
  });
};

export const apiUpdateFamilyMember = async (memberId, memberData, token) => {
  return fetchAPI(`/auth/family-members/${memberId}`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify(memberData),
  });
};

export const apiDeleteFamilyMember = async (memberId, token) => {
  return fetchAPI(`/auth/family-members/${memberId}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
};

// PILGRIMAGE CENTER API ENDPOINTS
export const apiGetPilgrimageCenters = async (queryParams = {}, token = null) => {
  const params = new URLSearchParams();
  Object.keys(queryParams).forEach((key) => {
    if (queryParams[key] !== undefined && queryParams[key] !== null && queryParams[key] !== "") {
      params.append(key, queryParams[key]);
    }
  });
  const queryString = params.toString() ? `?${params.toString()}` : "";
  return fetchAPI(`/pilgrimage-centers${queryString}`, {
    method: "GET",
    headers: getHeaders(token),
  });
};

export const apiGetPilgrimageCenterById = async (id, token = null) => {
  return fetchAPI(`/pilgrimage-centers/${id}`, {
    method: "GET",
    headers: getHeaders(token),
  });
};

export const apiCreatePilgrimageCenter = async (centerData, token) => {
  return fetchAPI("/pilgrimage-centers", {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(centerData),
  });
};

export const apiUpdatePilgrimageCenter = async (id, centerData, token) => {
  return fetchAPI(`/pilgrimage-centers/${id}`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify(centerData),
  });
};

export const apiDeletePilgrimageCenter = async (id, token) => {
  return fetchAPI(`/pilgrimage-centers/${id}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
};

export const apiUpdatePilgrimageCenterStatus = async (id, isActive, token) => {
  return fetchAPI(`/pilgrimage-centers/${id}/status`, {
    method: "PATCH",
    headers: getHeaders(token),
    body: JSON.stringify({ isActive }),
  });
};

// Enquiry APIs
export const apiSubmitEnquiry = async (enquiryData, token = null) => {
  return fetchAPI("/enquiries", {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(enquiryData),
  });
};

export const apiGetEnquiries = async (token = null) => {
  return fetchAPI("/enquiries", {
    method: "GET",
    headers: getHeaders(token),
  });
};

export const apiUpdateEnquiryStatus = async (id, status, token = null) => {
  return fetchAPI(`/enquiries/${id}/status`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify({ status }),
  });
};

export const apiReplyEnquiry = async (id, replyData, token = null) => {
  return fetchAPI(`/enquiries/${id}/reply`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(replyData),
  });
};





