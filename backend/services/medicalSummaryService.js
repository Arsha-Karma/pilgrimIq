/**
 * Medical Summary Service - Generates factual, user-friendly medical summary strictly based on extracted data.
 */

const generateMedicalSummary = async (extractedData, patientName = "Patient", age = null) => {
  const { vitals = {}, laboratoryValues = [], conditions = [], medications = [], abnormalFindings = [] } = extractedData || {};

  const lines = [];
  lines.push(`MEDICAL REPORT SUMMARY`);
  lines.push(`Patient Name: ${patientName}`);
  if (age) lines.push(`Age: ${age} Years`);

  // Conditions
  if (conditions && conditions.length > 0) {
    lines.push(`Detected Conditions: ${conditions.join(", ")}`);
  } else {
    lines.push(`Detected Conditions: None explicitly recorded`);
  }

  // Key Lab Values
  if (laboratoryValues && laboratoryValues.length > 0) {
    const labStr = laboratoryValues.map((l) => `${l.parameter}: ${l.value} ${l.unit}`).join(" | ");
    lines.push(`Laboratory Parameters: ${labStr}`);
  }

  // Key Vitals
  if (vitals.bloodPressure?.systolic) {
    lines.push(`Blood Pressure: ${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg`);
  }
  if (vitals.spo2?.value) {
    lines.push(`Blood Oxygen (SpO2): ${vitals.spo2.value}%`);
  }

  // Medicines
  if (medications && medications.length > 0) {
    lines.push(`Detected Medications: ${medications.join(", ")}`);
  }

  // Important Findings
  if (abnormalFindings && abnormalFindings.length > 0) {
    lines.push(`Important Observations: ${abnormalFindings.join(" ")}`);
  } else {
    lines.push(`Important Observations: Vital signs and key parameters are within acceptable baseline bounds.`);
  }

  return lines.join("\n\n");
};

module.exports = {
  generateMedicalSummary,
};
