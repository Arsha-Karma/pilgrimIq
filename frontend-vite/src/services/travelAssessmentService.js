import { fetchAPI, getHeaders } from "./api";

/**
 * Fetch authoritative Pilgrim Safety Index (PSI) calculation for a journey
 * @param {string} journeyId
 * @param {boolean} forceRefresh
 * @param {string} token
 */
export const apiGetTravelAssessmentPsi = async (journeyId, forceRefresh = false, token = null) => {
  return fetchAPI("/travel-assessment/psi", {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ journeyId, forceRefresh }),
  });
};
