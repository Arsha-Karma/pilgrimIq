import { fetchAPI, getHeaders } from "./api";

/**
 * Predict crowd density and metrics for a pilgrimage center and date
 * @param {Object} payload - { pilgrimage_center, prediction_date, festival_name, is_festival }
 * @param {string|null} token - Optional auth token
 */
export const apiPredictCrowd = async (payload, token = null) => {
  return fetchAPI("/crowd/predict", {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });
};
