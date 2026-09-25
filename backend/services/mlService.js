/**
 * Service for communicating with the PilgrimIQ FastAPI Machine Learning Prediction API.
 */

const getMlApiBaseUrl = () => {
  let url = process.env.ML_API_URL || "https://pilgrimiq-ml-api-2.onrender.com";
  return url.replace(/\/+$/, "");
};

/**
 * Normalizes pilgrimage center names to match ML API dataset expectations.
 */
const normalizeCenterName = (name) => {
  if (!name) return "";
  const cleaned = name.trim();
  const lower = cleaned.toLowerCase();

  const ALIASES = {
    "sabarimala sree dharma sastha temple": "Sabarimala Temple",
    "sabarimala sree dharma sastha": "Sabarimala Temple",
    "sabarimala": "Sabarimala Temple",
    "sree padmanabhaswamy temple": "Sree Padmanabhaswamy Temple",
    "padmanabhaswamy temple": "Sree Padmanabhaswamy Temple",
    "velankanni shrine": "Basilica of Our Lady of Good Health",
    "arthunkal church": "St. Andrew's Basilica (Arthunkal Church)",
    "tirupati": "TTD, Tirupati",
    "tirumala": "TTD, Tirupati",
    "ram mandir ayodhya": "Ram Mandir",
    "kashi vishwanath": "Kashi Vishwanath Temple",
    "golden temple amritsar": "Golden Temple",
    "ajmer sharif": "Ajmer Sharif Dargah",
  };

  if (ALIASES[lower]) {
    return ALIASES[lower];
  }

  return cleaned;
};

/**
 * Predicts crowd level for a given pilgrimage center and date.
 *
 * @param {Object} params
 * @param {string} params.pilgrimage_center - Name of the pilgrimage center
 * @param {string} params.prediction_date - Date in YYYY-MM-DD format
 * @param {string} [params.festival_name=""] - Optional festival name
 * @param {number|boolean} [params.is_festival=0] - 1 if festival, 0 otherwise
 * @returns {Promise<Object>} ML prediction result object
 */
const predictCrowd = async ({
  pilgrimage_center,
  prediction_date,
  festival_name = "",
  is_festival = 0,
}) => {
  const baseUrl = getMlApiBaseUrl();
  const endpoint = `${baseUrl}/predict-crowd`;

  const targetCenter = normalizeCenterName(pilgrimage_center);

  const payload = {
    pilgrimage_center: targetCenter,
    prediction_date: String(prediction_date).trim(),
    festival_name: festival_name ? String(festival_name).trim() : "",
    is_festival: Number(is_festival) === 1 ? 1 : 0,
  };

  const executeFetch = async (targetPayload, timeoutMs = 2500) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(targetPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorDetail = "";
        try {
          const errorJson = await response.json();
          errorDetail = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
        } catch (_) {
          errorDetail = await response.text();
        }

        const error = new Error(`ML API returned status ${response.status}: ${errorDetail}`);
        error.statusCode = response.status;
        error.isMlApiError = true;
        throw error;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  try {
    return await executeFetch(payload, 2500);
  } catch (firstErr) {
    // If status 400, try retry with simplified name if different
    if (firstErr.statusCode === 400 && targetCenter.includes(" ")) {
      const simplified = targetCenter
        .replace(/(Sree|Dharma|Sastha|Temple|Dargah|Masjid|Basilica|Shrine)/gi, "")
        .trim();
      if (simplified && simplified !== targetCenter) {
        try {
          return await executeFetch({ ...payload, pilgrimage_center: simplified }, 1500);
        } catch (_) {
          // ignore second error, throw first
        }
      }
    }

    if (firstErr.name === "AbortError") {
      const timeoutError = new Error("ML Prediction Service timed out. The ML service may be experiencing high load or starting up.");
      timeoutError.statusCode = 504;
      timeoutError.isMlApiError = true;
      throw timeoutError;
    }

    if (!firstErr.isMlApiError) {
      const networkError = new Error(`Unable to reach ML Prediction Service: ${firstErr.message}`);
      networkError.statusCode = 502;
      networkError.isMlApiError = true;
      throw networkError;
    }

    throw firstErr;
  }
};

module.exports = {
  predictCrowd,
  normalizeCenterName,
};
