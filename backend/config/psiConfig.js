/**
 * Pilgrim Safety Index (PSI) Configuration
 * Centralized weights, score mappings, and risk thresholds.
 */

// Centralized PSI component weights (Must sum to 1.0)
const PSI_WEIGHTS = {
  health: 0.50,
  crowd: 0.25,
  weather: 0.25,
};

// Common 0–100 risk scale mappings (0 = lowest risk, 100 = highest risk)
const RISK_SCORE_MAPPINGS = {
  // Low Risk
  LOW: 20,
  LOW_RISK: 20,

  // Moderate Risk / Caution
  MODERATE: 50,
  CAUTION: 50,
  MODERATE_RISK: 50,

  // High Risk & Physician Rejection / Medical Review
  HIGH: 75,
  HIGH_RISK: 75,
  MEDICAL_REVIEW_REQUIRED: 85,
  PHYSICIAN_NOT_APPROVED: 90,
  NOT_APPROVED: 90,
  REJECTED: 90,
  PHYSICIAN_REJECTED: 90,

  // Very High / Severe / Critical Risk
  VERY_HIGH: 90,
  VERY_HIGH_RISK: 90,
  SEVERE: 90,
  CRITICAL: 95,
  CRITICAL_RISK: 95,
};

// PSI score thresholds to category mapping
// PSI 0–24   → LOW RISK
// PSI 25–49  → MODERATE RISK
// PSI 50–74  → HIGH RISK
// PSI 75–100 → CRITICAL RISK
const PSI_THRESHOLDS = {
  LOW: { min: 0, max: 24, level: "LOW RISK", color: "#10b981" },
  MODERATE: { min: 25, max: 49, level: "MODERATE RISK", color: "#f59e0b" },
  HIGH: { min: 50, max: 74, level: "HIGH RISK", color: "#f97316" },
  CRITICAL: { min: 75, max: 100, level: "CRITICAL RISK", color: "#ef4444" },
};

/**
 * Maps a numeric score (0-100) to a PSI Risk Level string
 */
const getPsiRiskLevel = (score) => {
  const rounded = Math.round(score);
  if (rounded >= 75) return "CRITICAL RISK";
  if (rounded >= 50) return "HIGH RISK";
  if (rounded >= 25) return "MODERATE RISK";
  return "LOW RISK";
};

/**
 * Helper to normalize any input (number or category string) to a 0–100 scale.
 */
const normalizeRiskScore = (input, fallback = 20) => {
  if (typeof input === "number" && !isNaN(input)) {
    return Math.max(0, Math.min(100, Math.round(input)));
  }

  if (typeof input === "string" && input.trim()) {
    const cleanKey = input.trim().toUpperCase().replace(/[\s-]/g, "_");
    if (RISK_SCORE_MAPPINGS[cleanKey] !== undefined) {
      return RISK_SCORE_MAPPINGS[cleanKey];
    }
  }

  return fallback;
};

module.exports = {
  PSI_WEIGHTS,
  RISK_SCORE_MAPPINGS,
  PSI_THRESHOLDS,
  getPsiRiskLevel,
  normalizeRiskScore,
};
