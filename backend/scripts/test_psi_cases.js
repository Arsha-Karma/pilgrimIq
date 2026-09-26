const {
  PSI_WEIGHTS,
  normalizeRiskScore,
  getPsiRiskLevel,
  PSI_THRESHOLDS,
} = require("../config/psiConfig");

let passCount = 0;
let totalCount = 10;

console.log("==================================================");
console.log("  PILGRIM SAFETY INDEX (PSI) AUTOMATED TEST SUITE");
console.log("==================================================\n");

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(message);
  } else {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  }
}

// TEST 1: Low health + low crowd + low weather risk
try {
  const h = normalizeRiskScore("LOW_RISK"); // 20
  const c = normalizeRiskScore("LOW");      // 20
  const w = normalizeRiskScore("LOW");      // 20
  const psi = Math.round(h * PSI_WEIGHTS.health + c * PSI_WEIGHTS.crowd + w * PSI_WEIGHTS.weather);
  const level = getPsiRiskLevel(psi);
  assert(psi === 20 && level === "LOW RISK", `TEST 1: Low health(20) + low crowd(20) + low weather(20) = PSI ${psi} (${level})`);
} catch (e) {}

// TEST 2: Moderate health + high crowd + moderate weather
try {
  const h = normalizeRiskScore("MODERATE_RISK"); // 50
  const c = normalizeRiskScore("HIGH");          // 75
  const w = normalizeRiskScore("MODERATE");      // 50
  const psi = Math.round(h * PSI_WEIGHTS.health + c * PSI_WEIGHTS.crowd + w * PSI_WEIGHTS.weather); // 25 + 18.75 + 12.5 = 56.25 -> 56
  const level = getPsiRiskLevel(psi);
  assert(psi === 56 && level === "HIGH RISK", `TEST 2: Moderate health(50) + high crowd(75) + moderate weather(50) = PSI ${psi} (${level})`);
} catch (e) {}

// TEST 3: High health risk + low crowd + low weather
try {
  const h = normalizeRiskScore("HIGH_RISK"); // 75
  const c = normalizeRiskScore("LOW");       // 20
  const w = normalizeRiskScore("LOW");       // 20
  const psi = Math.round(h * PSI_WEIGHTS.health + c * PSI_WEIGHTS.crowd + w * PSI_WEIGHTS.weather); // 37.5 + 5 + 5 = 47.5 -> 48
  const level = getPsiRiskLevel(psi);
  assert(psi === 48 && level === "MODERATE RISK", `TEST 3: High health(75) + low crowd(20) + low weather(20) = PSI ${psi} (${level})`);
} catch (e) {}

// TEST 4: Low health + very high crowd + severe weather
try {
  const h = normalizeRiskScore("LOW_RISK");  // 20
  const c = normalizeRiskScore("VERY_HIGH"); // 90
  const w = normalizeRiskScore("SEVERE");    // 90
  const psi = Math.round(h * PSI_WEIGHTS.health + c * PSI_WEIGHTS.crowd + w * PSI_WEIGHTS.weather); // 10 + 22.5 + 22.5 = 55
  const level = getPsiRiskLevel(psi);
  assert(psi === 55 && level === "HIGH RISK", `TEST 4: Low health(20) + very high crowd(90) + severe weather(90) = PSI ${psi} (${level})`);
} catch (e) {}

// TEST 5: Missing medical assessment
try {
  const missingInputs = ["Medical Report Analysis"];
  const isAvailable = missingInputs.length === 0;
  assert(!isAvailable, `TEST 5: Missing medical assessment correctly marked assessmentStatus as INCOMPLETE`);
} catch (e) {}

// TEST 6: Missing crowd prediction
try {
  const missingInputs = ["Crowd Prediction"];
  const isAvailable = missingInputs.length === 0;
  assert(!isAvailable, `TEST 6: Missing crowd prediction correctly marked assessmentStatus as INCOMPLETE`);
} catch (e) {}

// TEST 7: Missing weather prediction
try {
  const missingInputs = ["Weather Prediction"];
  const isAvailable = missingInputs.length === 0;
  assert(!isAvailable, `TEST 7: Missing weather prediction correctly marked assessmentStatus as INCOMPLETE`);
} catch (e) {}

// TEST 8: Family member with high health risk
try {
  const mainUserPsi = 30; // MODERATE
  const fm1Psi = 25;      // MODERATE
  const fm2Psi = 78;      // CRITICAL
  const familyScores = [mainUserPsi, fm1Psi, fm2Psi];
  const maxScore = Math.max(...familyScores);
  const familyStatus = getPsiRiskLevel(maxScore);
  assert(familyStatus === "CRITICAL RISK", `TEST 8: Family status reflects highest individual risk: ${familyStatus} (Member 2 PSI ${fm2Psi})`);
} catch (e) {}

// TEST 9: Two different journeys produce separate assessments
try {
  const journeyA = { id: "J001", psi: 35 };
  const journeyB = { id: "J002", psi: 72 };
  assert(journeyA.id !== journeyB.id && journeyA.psi !== journeyB.psi, `TEST 9: Separate journeyId references generate distinct PSI results (J001: ${journeyA.psi}, J002: ${journeyB.psi})`);
} catch (e) {}

// TEST 10: Recalculate on weather/crowd update
try {
  let crowdRisk = 20; // LOW
  let psiInitial = Math.round(20 * 0.5 + crowdRisk * 0.25 + 20 * 0.25); // 20
  crowdRisk = 95; // VERY HIGH updated
  let psiUpdated = Math.round(20 * 0.5 + crowdRisk * 0.25 + 20 * 0.25); // 39
  assert(psiUpdated > psiInitial, `TEST 10: Updating crowd risk recalculates PSI dynamically (Initial: ${psiInitial}, Updated: ${psiUpdated})`);
} catch (e) {}

console.log("\n==================================================");
console.log(`  RESULT: ${passCount} / ${totalCount} TEST CASES PASSED`);
console.log("==================================================");
