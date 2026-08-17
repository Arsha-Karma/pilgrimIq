import { fetchAPI, getHeaders } from "./api";

/**
 * Fetch weather details and risk evaluation for a pilgrimage center by ID
 * @param {string} centerId - Pilgrimage Center ID
 * @param {string|null} token - Optional auth token
 */
export const apiGetWeatherByCenterId = async (centerId, token = null) => {
  if (!centerId) {
    throw new Error("Pilgrimage center ID is required to fetch weather information.");
  }
  return fetchAPI(`/weather/${centerId}`, {
    method: "GET",
    headers: getHeaders(token),
  });
};
