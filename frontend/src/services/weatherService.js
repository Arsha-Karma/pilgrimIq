import { fetchAPI, getHeaders } from "./api";

/**
 * Fetch weather details and risk evaluation for a pilgrimage center by ID
 * @param {string} centerId - Pilgrimage Center ID
 * @param {string|null} date - Optional ISO date string (YYYY-MM-DD)
 * @param {string|null} token - Optional auth token
 */
export const apiGetWeatherByCenterId = async (centerId, date = null, token = null) => {
  if (!centerId) {
    throw new Error("Pilgrimage center ID is required to fetch weather information.");
  }
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return fetchAPI(`/weather/${centerId}${query}`, {
    method: "GET",
    headers: getHeaders(token),
  });
};
