import { fetchAPI, getHeaders } from "./api";

// Create a new journey plan
export const apiCreateJourney = async (journeyData, token) => {
  return fetchAPI("/journeys", {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(journeyData),
  });
};

// Accept responsibility for travel under own risk
export const apiAcceptResponsibility = async (payload, token) => {
  return fetchAPI("/journeys/accept-responsibility", {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });
};

// Get current user's journeys
export const apiGetMyJourneys = async (token) => {
  return fetchAPI("/journeys/user/my-journeys", {
    method: "GET",
    headers: getHeaders(token),
  });
};

// Get single journey by ID
export const apiGetJourneyById = async (id, token) => {
  return fetchAPI(`/journeys/${id}`, {
    method: "GET",
    headers: getHeaders(token),
  });
};

// Update journey by ID
export const apiUpdateJourney = async (id, journeyData, token) => {
  return fetchAPI(`/journeys/${id}`, {
    method: "PUT",
    headers: getHeaders(token),
    body: JSON.stringify(journeyData),
  });
};

// Delete/Cancel journey by ID
export const apiDeleteJourney = async (id, token) => {
  return fetchAPI(`/journeys/${id}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
};

// Get nearby services (hotels, restaurants, hospitals, ATMs, etc.)
export const apiGetNearbyServices = async (latitude, longitude, radius = 5, category = "accommodation", token = null) => {
  const query = new URLSearchParams({
    latitude,
    longitude,
    radius,
    category,
  }).toString();

  return fetchAPI(`/nearby-services?${query}`, {
    method: "GET",
    headers: getHeaders(token),
  });
};

// Expand shortened Google Maps link and resolve coordinates (Latitude & Longitude)
export const apiExpandGoogleMapsUrl = async (url, token = null) => {
  const query = new URLSearchParams({ url }).toString();
  return fetchAPI(`/nearby-services/expand-url?${query}`, {
    method: "GET",
    headers: getHeaders(token),
  });
};
