const DEFAULT_API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000/api";

const getHeaders = (token) => {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const fetchAPI = async (endpoint, options = {}) => {
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


