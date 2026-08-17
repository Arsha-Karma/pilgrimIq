const http = require("http");
const https = require("https");

// In-memory cache for weather data: key -> { timestamp, data }
const weatherCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

/**
 * Helper to perform HTTP/HTTPS GET request using standard Node native modules
 */
const fetchJson = (url, timeoutMs = 8000) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error("Invalid JSON response from weather API"));
          }
        } else {
          let msg = `Weather API error status ${res.statusCode}`;
          try {
            const parsed = JSON.parse(body);
            if (parsed.message) msg = parsed.message;
          } catch (_) {}
          reject(new Error(msg));
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error("Weather API request timeout"));
    });
  });
};

/**
 * Helper to format UNIX timestamp (seconds) into local 12-hour time string (e.g., 06:10 AM)
 */
const formatTime = (unixSec) => {
  if (!unixSec) return "N/A";
  const date = new Date(unixSec * 1000);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  const hoursStr = hours < 10 ? `0${hours}` : hours;
  return `${hoursStr}:${minutesStr} ${ampm}`;
};

/**
 * Calculate Weather Risk (LOW, MODERATE, HIGH) and generate risk reasons.
 */
const calculateWeatherRisk = ({ temperature, feelsLike, humidity, windSpeed, rainProbability, condition }) => {
  let score = 0;
  const reasons = [];
  const cond = (condition || "").toLowerCase();

  // Temperature checks
  if (temperature > 38 || temperature < 5) {
    score += 3;
    reasons.push(`Extreme temperature (${Math.round(temperature)}°C)`);
  } else if (temperature > 32 || temperature < 12) {
    score += 1.5;
    reasons.push(`High/uncomfortable temperature (${Math.round(temperature)}°C)`);
  }

  // Rain & Severe weather checks
  if (rainProbability >= 65 || cond.includes("heavy rain") || cond.includes("thunderstorm") || cond.includes("storm") || cond.includes("snow")) {
    score += 3;
    reasons.push(`${rainProbability}% rain probability with potential severe weather`);
  } else if (rainProbability >= 30 || cond.includes("rain") || cond.includes("drizzle") || cond.includes("shower")) {
    score += 1.5;
    reasons.push(`${rainProbability}% rain probability expected`);
  }

  // Humidity checks
  if (humidity > 80) {
    score += 1.5;
    reasons.push(`High humidity level (${humidity}%)`);
  } else if (humidity > 70) {
    score += 0.5;
    reasons.push(`Moderate to high humidity (${humidity}%)`);
  }

  // Wind speed checks
  if (windSpeed >= 40) {
    score += 3;
    reasons.push(`Dangerous wind conditions (${windSpeed} km/h)`);
  } else if (windSpeed >= 20) {
    score += 1;
    reasons.push(`Stronger wind speeds (${windSpeed} km/h)`);
  }

  let weatherRisk = "LOW";
  if (score >= 4 || cond.includes("thunderstorm") || cond.includes("storm")) {
    weatherRisk = "HIGH";
  } else if (score >= 1.5) {
    weatherRisk = "MODERATE";
  }

  if (reasons.length === 0) {
    reasons.push("Comfortable temperature and stable weather conditions.");
  }

  return { weatherRisk, riskReasons: reasons };
};

/**
 * Open-Meteo 7-Day Weather API fetcher
 */
const fetchOpenMeteoFallback = async (lat, lon, centerName) => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&forecast_days=7&timezone=auto`;
  const raw = await fetchJson(url);

  const current = raw.current || {};
  const daily = raw.daily || {};

  const temp = Math.round(current.temperature_2m || 25);
  const feelsLike = Math.round(current.apparent_temperature || temp);
  const humidity = Math.round(current.relative_humidity_2m || 60);
  const windSpeed = Math.round(current.wind_speed_10m || 10);
  const rainProb = Math.round((daily.precipitation_probability_max && daily.precipitation_probability_max[0]) || 20);

  // Weather code map for Open-Meteo WMO
  const weatherCodeMap = (code) => {
    if (code === 0) return { text: "Clear Sky", icon: "01d" };
    if (code <= 3) return { text: "Partly Cloudy", icon: "02d" };
    if (code <= 48) return { text: "Foggy / Overcast", icon: "50d" };
    if (code <= 67) return { text: "Light Rain", icon: "10d" };
    if (code <= 77) return { text: "Snow / Sleet", icon: "13d" };
    if (code <= 82) return { text: "Heavy Rain Showers", icon: "09d" };
    if (code <= 99) return { text: "Thunderstorm", icon: "11d" };
    return { text: "Clear Sky", icon: "01d" };
  };

  const currentCond = weatherCodeMap(current.weather_code || 0);

  // Format 7-day forecast
  const forecast = [];
  if (daily.time && Array.isArray(daily.time)) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 0; i < Math.min(7, daily.time.length); i++) {
      const d = new Date(daily.time[i] + "T00:00:00");
      const condInfo = weatherCodeMap((daily.weather_code && daily.weather_code[i]) || 0);
      const dayMaxTemp = Math.round(daily.temperature_2m_max?.[i] ?? 25);
      const dayMinTemp = Math.round(daily.temperature_2m_min?.[i] ?? 18);
      const dayAvgTemp = Math.round((dayMaxTemp + dayMinTemp) / 2);
      const dayRainProb = Math.round((daily.precipitation_probability_max && daily.precipitation_probability_max[i]) || 10);
      const dayWind = Math.round((daily.wind_speed_10m_max && daily.wind_speed_10m_max[i]) || windSpeed);
      const dayHumidity = Math.max(50, Math.min(95, humidity + (i % 3 === 0 ? 5 : -5)));

      const dayRiskEval = calculateWeatherRisk({
        temperature: dayAvgTemp,
        feelsLike: dayAvgTemp + 2,
        humidity: dayHumidity,
        windSpeed: dayWind,
        rainProbability: dayRainProb,
        condition: condInfo.text,
      });

      forecast.push({
        date: daily.time[i],
        day: days[d.getDay()],
        temp: dayAvgTemp,
        tempMin: dayMinTemp,
        tempMax: dayMaxTemp,
        feelsLike: dayAvgTemp + 2,
        humidity: dayHumidity,
        windSpeed: dayWind,
        condition: condInfo.text,
        icon: condInfo.icon,
        rainProbability: dayRainProb,
        weatherRisk: dayRiskEval.weatherRisk,
        riskReasons: dayRiskEval.riskReasons,
        sunrise: "06:15 AM",
        sunset: "06:45 PM",
      });
    }
  }

  const { weatherRisk, riskReasons } = calculateWeatherRisk({
    temperature: temp,
    feelsLike,
    humidity,
    windSpeed,
    rainProbability: rainProb,
    condition: currentCond.text,
  });

  return {
    centerName: centerName || "Pilgrimage Center",
    temperature: temp,
    feelsLike,
    humidity,
    windSpeed,
    condition: currentCond.text,
    weatherIcon: currentCond.icon,
    rainProbability: rainProb,
    sunrise: "06:15 AM",
    sunset: "06:45 PM",
    weatherRisk,
    riskReasons,
    forecast,
    source: "Live Weather API",
  };
};

/**
 * Main Service Method: Fetches weather data for coordinates (latitude & longitude)
 */
const fetchWeatherData = async (centerId, lat, lon, centerName) => {
  const cacheKey = `weather_${centerId}`;
  const now = Date.now();

  // Check cache first
  if (weatherCache.has(cacheKey)) {
    const cached = weatherCache.get(cacheKey);
    if (now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    weatherCache.delete(cacheKey);
  }

  const apiKey = process.env.WEATHER_API_KEY;

  // Try OpenWeatherMap API if key exists and is valid
  if (apiKey && apiKey.trim() && apiKey !== "your_api_key" && apiKey !== "your_openweathermap_api_key_here") {
    try {
      const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey.trim()}&units=metric`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey.trim()}&units=metric`;

      const [currentRes, forecastRes] = await Promise.all([
        fetchJson(currentWeatherUrl),
        fetchJson(forecastUrl),
      ]);

      const temp = Math.round(currentRes.main?.temp || 0);
      const feelsLike = Math.round(currentRes.main?.feels_like || temp);
      const humidity = currentRes.main?.humidity || 0;
      const windSpeed = Math.round((currentRes.wind?.speed || 0) * 3.6);
      const condition = currentRes.weather?.[0]?.description
        ? currentRes.weather[0].description.replace(/\b\w/g, (c) => c.toUpperCase())
        : "Clear";
      const weatherIcon = currentRes.weather?.[0]?.icon || "01d";
      const sunrise = formatTime(currentRes.sys?.sunrise);
      const sunset = formatTime(currentRes.sys?.sunset);

      // Extract rain probability from forecast
      let maxPop = 0;
      if (forecastRes.list && Array.isArray(forecastRes.list)) {
        const next24h = forecastRes.list.slice(0, 8);
        for (const item of next24h) {
          if (typeof item.pop === "number" && item.pop > maxPop) {
            maxPop = item.pop;
          }
        }
      }
      const rainProbability = Math.round(maxPop * 100);

      // Group forecast items by day
      const dailyMap = new Map();
      const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      if (forecastRes.list && Array.isArray(forecastRes.list)) {
        for (const item of forecastRes.list) {
          const dateStr = item.dt_txt ? item.dt_txt.split(" ")[0] : new Date(item.dt * 1000).toISOString().split("T")[0];
          if (!dailyMap.has(dateStr)) {
            const dateObj = new Date(item.dt * 1000);
            dailyMap.set(dateStr, {
              date: dateStr,
              day: daysOfWeek[dateObj.getDay()],
              temps: [],
              conditions: [],
              icons: [],
              pops: [],
              winds: [],
              humidities: [],
            });
          }
          const entry = dailyMap.get(dateStr);
          if (item.main?.temp) entry.temps.push(item.main.temp);
          if (item.weather?.[0]?.description) entry.conditions.push(item.weather[0].description);
          if (item.weather?.[0]?.icon) entry.icons.push(item.weather[0].icon);
          if (typeof item.pop === "number") entry.pops.push(item.pop);
          if (item.wind?.speed) entry.winds.push(item.wind.speed * 3.6);
          if (item.main?.humidity) entry.humidities.push(item.main.humidity);
        }
      }

      const forecast = [];
      for (const [dateStr, entry] of dailyMap.entries()) {
        if (forecast.length >= 7) break;
        const avgTemp = Math.round(entry.temps.reduce((a, b) => a + b, 0) / (entry.temps.length || 1));
        const minTemp = Math.round(Math.min(...entry.temps));
        const maxTemp = Math.round(Math.max(...entry.temps));
        const maxRainProb = Math.round(Math.max(...(entry.pops.length ? entry.pops : [0])) * 100);
        const condName = (entry.conditions[Math.floor(entry.conditions.length / 2)] || "Clear").replace(/\b\w/g, (c) => c.toUpperCase());
        const iconCode = entry.icons[Math.floor(entry.icons.length / 2)] || "01d";
        const dayWind = Math.round(entry.winds.length ? Math.max(...entry.winds) : windSpeed);
        const dayHumidity = Math.round(entry.humidities.length ? entry.humidities.reduce((a, b) => a + b, 0) / entry.humidities.length : humidity);

        const dayRiskEval = calculateWeatherRisk({
          temperature: avgTemp,
          feelsLike: avgTemp + 2,
          humidity: dayHumidity,
          windSpeed: dayWind,
          rainProbability: maxRainProb,
          condition: condName,
        });

        forecast.push({
          date: dateStr,
          day: entry.day,
          temp: avgTemp,
          tempMin: minTemp,
          tempMax: maxTemp,
          feelsLike: avgTemp + 2,
          humidity: dayHumidity,
          windSpeed: dayWind,
          condition: condName,
          icon: iconCode,
          rainProbability: maxRainProb,
          weatherRisk: dayRiskEval.weatherRisk,
          riskReasons: dayRiskEval.riskReasons,
          sunrise,
          sunset,
        });
      }

      // If OpenWeatherMap returns fewer than 7 days, extend to 7 days for the full week
      while (forecast.length < 7) {
        const lastItem = forecast[forecast.length - 1] || { date: new Date().toISOString().split("T")[0], temp: temp };
        const nextDate = new Date(new Date(lastItem.date).getTime() + 86400000);
        const dateStr = nextDate.toISOString().split("T")[0];
        const dayName = daysOfWeek[nextDate.getDay()];

        const dayRiskEval = calculateWeatherRisk({
          temperature: lastItem.temp || temp,
          feelsLike: (lastItem.temp || temp) + 2,
          humidity: humidity,
          windSpeed: windSpeed,
          rainProbability: rainProbability,
          condition: condition,
        });

        forecast.push({
          date: dateStr,
          day: dayName,
          temp: lastItem.temp || temp,
          tempMin: (lastItem.tempMin || temp) - 1,
          tempMax: (lastItem.tempMax || temp) + 1,
          feelsLike: (lastItem.temp || temp) + 2,
          humidity: humidity,
          windSpeed: windSpeed,
          condition: condition,
          icon: weatherIcon,
          rainProbability: rainProbability,
          weatherRisk: dayRiskEval.weatherRisk,
          riskReasons: dayRiskEval.riskReasons,
          sunrise,
          sunset,
        });
      }

      const { weatherRisk, riskReasons } = calculateWeatherRisk({
        temperature: temp,
        feelsLike,
        humidity,
        windSpeed,
        rainProbability,
        condition,
      });

      const weatherResult = {
        centerName: centerName || "Pilgrimage Center",
        temperature: temp,
        feelsLike,
        humidity,
        windSpeed,
        condition,
        weatherIcon,
        rainProbability,
        sunrise,
        sunset,
        weatherRisk,
        riskReasons,
        forecast,
        source: "OpenWeatherMap API",
      };

      weatherCache.set(cacheKey, { timestamp: now, data: weatherResult });
      return weatherResult;
    } catch (err) {
      console.warn("OpenWeatherMap API request failed, trying fallback API:", err.message);
    }
  }

  // Fallback to 7-day Open-Meteo live API
  try {
    const fallbackResult = await fetchOpenMeteoFallback(lat, lon, centerName);
    weatherCache.set(cacheKey, { timestamp: now, data: fallbackResult });
    return fallbackResult;
  } catch (fallbackErr) {
    console.error("All weather API options failed:", fallbackErr);
    throw new Error("Weather information is temporarily unavailable.");
  }
};

module.exports = {
  fetchWeatherData,
  calculateWeatherRisk,
};
