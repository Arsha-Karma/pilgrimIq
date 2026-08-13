/**
 * Medical Risk Service - Assesses pilgrimage travel-related risk indicators and preliminary status.
 * Evaluates patient age, vitals, lab values, and conditions against trek exertion factors.
 */

const assessTravelRisk = async (medicalData, patientProfile = {}) => {
  const { vitals = {}, laboratoryValues = [], conditions = [], abnormalFindings = [] } = medicalData || {};
  const age = patientProfile.age || 40;
  const bmi = patientProfile.bmi || null;

  const explanation = [];
  let riskScore = 0;

  // 1. Evaluate Vitals
  const sysBp = vitals.bloodPressure?.systolic;
  const diaBp = vitals.bloodPressure?.diastolic;
  const hr = vitals.heartRate?.value;
  const spo2 = vitals.spo2?.value;

  let heatRisk = "Low Risk";
  let dehydrationRisk = "Low Risk";
  let exertionRisk = "Low Risk";
  let fatigueRisk = "Low Risk";
  let walkingRisk = "Low Risk";

  if (sysBp && sysBp >= 150) {
    riskScore += 3;
    exertionRisk = "High Risk";
    explanation.push(`Severe blood pressure elevation (${sysBp}/${diaBp} mmHg) detected in report.`);
  } else if (sysBp && sysBp >= 140) {
    riskScore += 2;
    exertionRisk = "Moderate Risk";
    explanation.push(`Elevated blood pressure (${sysBp}/${diaBp} mmHg) detected in report.`);
  }

  if (spo2 && spo2 < 93) {
    riskScore += 3;
    fatigueRisk = "High Risk";
    explanation.push(`Low blood oxygen saturation (SpO2 ${spo2}%) identified.`);
  } else if (spo2 && spo2 < 95) {
    riskScore += 1;
    fatigueRisk = "Moderate Risk";
    explanation.push(`Slightly reduced oxygen saturation (SpO2 ${spo2}%) noted.`);
  }

  // 2. Evaluate Laboratory Parameters
  for (const lab of laboratoryValues) {
    if (lab.parameter === "Blood Glucose" && typeof lab.value === "number") {
      if (lab.value >= 200) {
        riskScore += 3;
        dehydrationRisk = "High Risk";
        explanation.push(`Markedly elevated blood glucose (${lab.value} mg/dL) increases dehydration risk during trek.`);
      } else if (lab.value >= 140) {
        riskScore += 1;
        dehydrationRisk = "Moderate Risk";
        explanation.push(`Elevated blood glucose (${lab.value} mg/dL) requires regular hydration.`);
      }
    }

    if (lab.parameter === "Hemoglobin" && typeof lab.value === "number") {
      if (lab.value < 10.0) {
        riskScore += 3;
        fatigueRisk = "High Risk";
        walkingRisk = "High Risk";
        explanation.push(`Significant anemia (Hemoglobin ${lab.value} g/dL) increases high-altitude exertion fatigue.`);
      } else if (lab.value < 11.5) {
        riskScore += 1;
        fatigueRisk = "Moderate Risk";
        explanation.push(`Mild anemia (Hemoglobin ${lab.value} g/dL) detected.`);
      }
    }
  }

  // 3. Evaluate Conditions & Age
  if (conditions.some((c) => /heart|cardiac|coronary|arrhythmia/i.test(c))) {
    riskScore += 4;
    exertionRisk = "High Risk";
    explanation.push("History of cardiac or heart disease identified in uploaded report.");
  }

  if (conditions.some((c) => /kidney|renal/i.test(c))) {
    riskScore += 3;
    dehydrationRisk = "High Risk";
    explanation.push("Known renal/kidney condition detected; high risk of heat exhaustion and fluid imbalance.");
  }

  if (age >= 65) {
    riskScore += 2;
    heatRisk = "Moderate Risk";
    walkingRisk = "Moderate Risk";
    explanation.push(`Senior pilgrim age (${age} years) increases exertion fatigue during steep climbing.`);
  }

  // Determine Overall Status
  let overallStatus = "LOW_RISK";
  if (riskScore >= 4 || exertionRisk === "High Risk" || fatigueRisk === "High Risk") {
    overallStatus = "MEDICAL_REVIEW_REQUIRED";
  } else if (riskScore >= 2 || explanation.length > 0) {
    overallStatus = "CAUTION";
  }

  if (explanation.length === 0) {
    explanation.push("No major travel-related risk indicators were identified from the available report data.");
  }

  return {
    heatRisk,
    dehydrationRisk,
    exertionRisk,
    fatigueRisk,
    walkingRisk,
    overallStatus,
    explanation,
  };
};

module.exports = {
  assessTravelRisk,
};
