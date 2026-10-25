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

// 0–100 safety scale mappings (100 = best/safest, 0 = highest risk)
const RISK_SCORE_MAPPINGS = {
  // Low Risk (Safe) -> Above 80
  LOW: 92,
  LOW_RISK: 92,
  FIT_FOR_TRAVEL: 95,
  APPROVED: 95,
  PHYSICIAN_APPROVED: 95,
  SAFE: 92,

  // Moderate Risk / Caution -> 50 - 79
  MODERATE: 68,
  CAUTION: 68,
  MODERATE_RISK: 68,
  APPROVED_WITH_CONDITIONS: 72,
  CONDITIONAL: 72,

  // High Risk & Critical Risk -> Below 50
  HIGH: 42,
  HIGH_RISK: 42,
  MEDICAL_REVIEW_REQUIRED: 40,
  PHYSICIAN_NOT_APPROVED: 35,
  NOT_APPROVED: 35,
  REJECTED: 30,
  PHYSICIAN_REJECTED: 30,
  VERY_HIGH: 30,
  VERY_HIGH_RISK: 30,
  SEVERE: 30,
  CRITICAL: 25,
  CRITICAL_RISK: 25,
};

// PSI score thresholds to category mapping (Safety Index scale out of 100)
// PSI >= 80 → Low Risk (Safe to Travel)
// PSI 50–79 → Moderate Risk (Caution Recommended)
// PSI < 50  → Critical Risk (Doctor Advice / Review Required)
const PSI_THRESHOLDS = {
  LOW: { min: 80, max: 100, level: "Low Risk", color: "#10b981" },
  MODERATE: { min: 50, max: 79, level: "Moderate Risk", color: "#f59e0b" },
  CRITICAL: { min: 0, max: 49, level: "Critical Risk", color: "#ef4444" },
};

/**
 * Maps a numeric safety score (0-100) to a PSI Risk Level string
 */
const getPsiRiskLevel = (score) => {
  const rounded = Math.round(score);
  if (rounded >= 80) return "Low Risk";
  if (rounded >= 50) return "Moderate Risk";
  return "Critical Risk";
};

/**
 * Helper to normalize any input (number or category string) to a 0–100 scale.
 */
const normalizeRiskScore = (input, fallback = 90) => {
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
