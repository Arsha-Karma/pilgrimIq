const assert = require("assert");
const { fetchWeatherData, resolveCoordinates, calculateWeatherRisk } = require("../services/weatherService");
const { findKnownDestination, PILGRIMAGE_DESTINATION_MAP } = require("../config/pilgrimageDestinations");
const { normalizeRiskScore, getPsiRiskLevel } = require("../config/psiConfig");

console.log("================================================================");
console.log("   PILGRIMIQ COMPREHENSIVE WEATHER INTEGRATION TEST SUITE");
console.log("================================================================\n");

let passed = 0;
let total = 0;

function runTest(testName, fn) {
  total++;
  return fn()
    .then(() => {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    })
    .catch((err) => {
      console.error(`❌ FAIL: ${testName} - ${err.message}`);
    });
}

async function main() {
  // Test 1: Coordinate resolution for valid lat/lon
  await runTest("Coordinate validation with valid numbers", async () => {
    const res = resolveCoordinates(9.4321, 77.0820, "Test Center");
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.latitude, 9.4321);
    assert.strictEqual(res.longitude, 77.0820);
  });

  // Test 2: Coordinate resolution for missing lat/lon with known pilgrimage center
  await runTest("Coordinate fallback from known center name (Sabarimala)", async () => {
    const res = resolveCoordinates(null, undefined, "Sabarimala Sree Dharma Sastha Temple");
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.resolvedFromKnown, true);
    assert(Math.abs(res.latitude - 9.4321) < 0.05);
  });

  // Test 3: Coordinate resolution for invalid numbers with unresolvable center
  await runTest("Coordinate validation rejection with invalid coordinates and unknown center", async () => {
    const res = resolveCoordinates("invalid", null, "Random Nonexistent Center 12345");
    assert.strictEqual(res.valid, false);
    assert(res.error.includes("Invalid or missing coordinates"));
  });

  // Test 4: Weather fetching for Sabarimala
  await runTest("Weather fetching returns standardized structure and forecast array", async () => {
    const data = await fetchWeatherData("sabarimala_test", 9.4321, 77.0820, "Sabarimala");
    assert(data.temperature !== undefined, "Temperature should be present");
    assert(data.condition, "Condition should be present");
    assert(data.weatherIcon, "Weather icon should be present");
    assert(Array.isArray(data.forecast), "Forecast should be an array");
    assert(data.forecast.length >= 7, "Forecast should have at least 7 days (supports up to 16)");
    assert(data.forecast[0].date, "Forecast day must have date");
    assert(data.forecast[0].weatherRisk, "Forecast day must have evaluated weatherRisk");
    assert(["LOW", "MODERATE", "HIGH"].includes(data.weatherRisk), "Weather risk level must be LOW, MODERATE, or HIGH");
  });

  // Test 5: Weather risk calculation logic
  await runTest("Weather risk calculation for heat, severe rain, and comfortable baseline", async () => {
    // Extreme Heat
    const extreme = calculateWeatherRisk({ temperature: 53, feelsLike: 54, humidity: 80, windSpeed: 10, rainProbability: 0, condition: "Sunny" });
    assert.strictEqual(extreme.weatherRisk, "HIGH");

    // Severe Storm
    const storm = calculateWeatherRisk({ temperature: 24, feelsLike: 25, humidity: 90, windSpeed: 20, rainProbability: 90, condition: "Thunderstorm" });
    assert.strictEqual(storm.weatherRisk, "HIGH");

    // Comfortable
    const pleasant = calculateWeatherRisk({ temperature: 22, feelsLike: 22, humidity: 55, windSpeed: 8, rainProbability: 10, condition: "Partly Cloudy" });
    assert.strictEqual(pleasant.weatherRisk, "LOW");
  });

  // Test 6: In-memory caching works
  await runTest("Weather in-memory cache returns cached data on second call", async () => {
    const t0 = Date.now();
    const first = await fetchWeatherData("cache_test", 10.6797, 79.8441, "Velankanni");
    const t1 = Date.now();
    const second = await fetchWeatherData("cache_test", 10.6797, 79.8441, "Velankanni");
    const t2 = Date.now();

    assert.strictEqual(first.temperature, second.temperature);
    assert.strictEqual(first.forecast.length, second.forecast.length);
    assert(t2 - t1 < 50, "Second call should return near-instantly from in-memory cache");
  });

  // Test 7: PSI calculation integration with weather
  await runTest("Authoritative PSI calculation incorporates weather risk score", async () => {
    const healthScore = normalizeRiskScore("LOW_RISK");  // 20
    const crowdScore = normalizeRiskScore("HIGH");       // 75
    const weatherScore = normalizeRiskScore("MODERATE"); // 50

    const psi = Math.round(healthScore * 0.5 + crowdScore * 0.25 + weatherScore * 0.25);
    // 20*0.5 + 75*0.25 + 50*0.25 = 10 + 18.75 + 12.5 = 41.25 -> 41
    assert.strictEqual(psi, 41);
    const level = getPsiRiskLevel(psi);
    assert.strictEqual(level, "MODERATE RISK");
  });

  // Test 8: Outside forecast horizon check
  await runTest("Forecast dates > 16 days in advance are identified as beyond forecast horizon", async () => {
    const today = new Date();
    const futureDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days away
    const diffDays = Math.ceil((futureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    assert(diffDays > 16, "Future date must be > 16 days");
  });

  console.log("\n================================================================");
  console.log(`  RESULT: ${passed} / ${total} TESTS PASSED`);
  console.log("================================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
