import { fetchAPI, getHeaders } from "./api";

/**
 * Fetch authoritative weather details and risk evaluation for a pilgrimage center by ID
 * @param {string} centerId - Pilgrimage Center ID
 * @param {string|null} date - Optional ISO date string (YYYY-MM-DD)
 * @param {string|null} token - Optional auth token
 * @param {boolean} refresh - Optional boolean to force cache refresh
 */
export const apiGetWeatherByCenterId = async (centerId, date = null, token = null, refresh = false) => {
  if (!centerId) {
    throw new Error("Pilgrimage center ID is required to fetch weather information.");
  }

  const queryParams = [];
  if (date && date !== "null" && date !== "undefined") {
    queryParams.push(`date=${encodeURIComponent(date)}`);
  }
  if (refresh) {
    queryParams.push("refresh=true");
  }

  const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

  return fetchAPI(`/weather/${centerId}${queryString}`, {
    method: "GET",
    headers: getHeaders(token),
  });
};
