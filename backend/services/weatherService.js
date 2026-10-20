const http = require("http");
const https = require("https");
const { URL } = require("url");
const { findKnownDestination } = require("../config/pilgrimageDestinations");

// In-memory cache for weather data: key -> { timestamp, data }
const weatherCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

/**
 * Robust JSON fetcher using native Node HTTP/HTTPS with redirect-following,
 * custom User-Agent, and configurable timeout.
 */
const fetchJson = (targetUrl, options = {}, timeoutMs = 12000, redirectCount = 0) => {
  return new Promise((resolve, reject) => {
    if (redirectCount > 3) {
      return reject(new Error("Too many HTTP redirects from weather provider"));
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl);
    } catch (e) {
      return reject(new Error(`Invalid weather URL: ${targetUrl}`));
    }

    const client = parsedUrl.protocol === "https:" ? https : http;
    const requestOptions = {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
      path: `${parsedUrl.pathname}${parsedUrl.search}`,
      method: "GET",
      headers: {
        "User-Agent": "PilgrimIQ/1.0 (https://pilgrimiq.com; support@pilgrimiq.com)",
        Accept: "application/json",
        ...(options.headers || {}),
      },
    };

    const req = client.request(requestOptions, (res) => {
      // Handle HTTP redirects (301, 302, 307, 308)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextUrl = new URL(res.headers.location, targetUrl).toString();
        return resolve(fetchJson(nextUrl, options, timeoutMs, redirectCount + 1));
      }

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
            else if (parsed.reason) msg = parsed.reason;
          } catch (_) {}
          reject(new Error(msg));
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Weather API request timed out after ${timeoutMs}ms`));
    });

    req.end();
  });
};

/**
 * Format UNIX timestamp (seconds) into local 12-hour time string (e.g., 06:10 AM)
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
 * Calculate Weather Risk (LOW, MODERATE, HIGH) using Heat Index Risk Scale (°C)
 */
const calculateWeatherRisk = ({ temperature, feelsLike, humidity, windSpeed, rainProbability, condition }) => {
  let score = 0;
  const reasons = [];
  const cond = (condition || "").toLowerCase();

  const effectiveTemp = feelsLike !== undefined && feelsLike !== null ? feelsLike : temperature;

  // 1. Heat Index Risk Scale (°C)
  if (effectiveTemp >= 52) {
    score += 4;
    reasons.push(`🔴 Extreme Heat Danger (${Math.round(effectiveTemp)}°C Heat Index): Heat stroke imminent with continued outdoor exposure.`);
  } else if (effectiveTemp >= 40) {
    score += 3;
    reasons.push(`🟠 High Heat Danger (${Math.round(effectiveTemp)}°C Heat Index): Severe exhaustion and heat stroke threat.`);
  } else if (effectiveTemp >= 33) {
    score += 2;
    reasons.push(`🟡 Moderate Heat Caution (${Math.round(effectiveTemp)}°C Heat Index): Risk of dehydration and heat cramps during heavy activity.`);
  } else if (effectiveTemp >= 27) {
    score += 1;
    reasons.push(`🟢 Low Heat Caution (${Math.round(effectiveTemp)}°C Heat Index): Fatigue and sluggishness possible with prolonged exposure.`);
  } else if (effectiveTemp < 5) {
    score += 2;
    reasons.push(`Freezing cold temperature (${Math.round(effectiveTemp)}°C).`);
  }

  // 2. Rain & Severe weather checks
  const isSevereRain = cond.includes("heavy rain") || cond.includes("thunderstorm") || cond.includes("storm") || cond.includes("snow");
  if (isSevereRain) {
    score += 3;
    reasons.push(`Severe Weather Warning: ${condition || "Storm/Heavy Rain"}`);
  } else if (rainProbability >= 65 || cond.includes("rain") || cond.includes("drizzle") || cond.includes("shower")) {
    score += 1.5;
    reasons.push(`${rainProbability}% rain probability (${condition || "Rain"})`);
  } else if (rainProbability >= 30) {
    score += 0.5;
    reasons.push(`${rainProbability}% chance of light precipitation`);
  }

  // 3. Humidity checks
  if (humidity > 80 && effectiveTemp >= 33) {
    score += 1;
    reasons.push(`High humidity level (${humidity}%) elevating heat stress.`);
  } else if (humidity > 85) {
    score += 0.5;
    reasons.push(`High relative humidity (${humidity}%)`);
  }

  // 4. Wind speed checks
  if (windSpeed >= 40) {
    score += 3;
    reasons.push(`Dangerous wind conditions (${windSpeed} km/h)`);
  } else if (windSpeed >= 25) {
    score += 1;
    reasons.push(`Strong wind speeds (${windSpeed} km/h)`);
  }

  // 5. Final Weather Risk Determination
  let weatherRisk = "LOW";
  if (score >= 3.5 || isSevereRain || effectiveTemp >= 40) {
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
 * Open-Meteo WMO weather code mapping
 */
const weatherCodeMap = (code) => {
  if (code === 0) return { text: "Clear Sky", icon: "01d" };
  if (code === 1) return { text: "Mainly Clear", icon: "01d" };
  if (code === 2) return { text: "Partly Cloudy", icon: "02d" };
  if (code === 3) return { text: "Overcast", icon: "04d" };
  if (code <= 48) return { text: "Foggy / Overcast", icon: "50d" };
  if (code <= 55) return { text: "Light Drizzle", icon: "09d" };
  if (code <= 67) return { text: "Light Rain", icon: "10d" };
  if (code <= 77) return { text: "Snow / Sleet", icon: "13d" };
  if (code <= 82) return { text: "Heavy Rain Showers", icon: "09d" };
  if (code <= 99) return { text: "Thunderstorm", icon: "11d" };
  return { text: "Clear Sky", icon: "01d" };
};

/**
 * Provider 1: OpenWeatherMap (5-Day / 3-Hour Forecast + Current Weather)
 */
const fetchOpenWeatherMap = async (lat, lon, apiKey, centerName) => {
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

  // Extract rain probability from next 24h
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
      const dateStr = item.dt_txt
        ? item.dt_txt.split(" ")[0]
        : new Date(item.dt * 1000).toISOString().split("T")[0];
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
    if (forecast.length >= 16) break;
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

  const { weatherRisk, riskReasons } = calculateWeatherRisk({
    temperature: temp,
    feelsLike,
    humidity,
    windSpeed,
    rainProbability,
    condition,
  });

  return {
    centerName: centerName || "Pilgrimage Center",
    coordinates: { latitude: Number(lat), longitude: Number(lon) },
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
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Provider 2: Open-Meteo 16-Day Forecast API
 */
const fetchOpenMeteo = async (lat, lon, centerName) => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&forecast_days=16&timezone=auto`;
  const raw = await fetchJson(url);

  const current = raw.current || {};
  const daily = raw.daily || {};

  const temp = Math.round(current.temperature_2m !== undefined ? current.temperature_2m : 25);
  const feelsLike = Math.round(current.apparent_temperature !== undefined ? current.apparent_temperature : temp);
  const humidity = Math.round(current.relative_humidity_2m !== undefined ? current.relative_humidity_2m : 60);
  const windSpeed = Math.round(current.wind_speed_10m !== undefined ? current.wind_speed_10m : 10);
  const rainProb = Math.round((daily.precipitation_probability_max && daily.precipitation_probability_max[0]) || 20);

  const currentCond = weatherCodeMap(current.weather_code || 0);

  // Format 16-day forecast
  const forecast = [];
  if (daily.time && Array.isArray(daily.time)) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 0; i < daily.time.length; i++) {
      const dateStr = daily.time[i];
      const d = new Date(dateStr + "T00:00:00");
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
        date: dateStr,
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
    coordinates: { latitude: Number(lat), longitude: Number(lon) },
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
    source: "Open-Meteo Live API",
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Provider 3: wttr.in Live Meteorological Backup
 */
const fetchWttrFallback = async (lat, lon, centerName) => {
  const url = `https://wttr.in/${lat},${lon}?format=j1`;
  const raw = await fetchJson(url, { headers: { "User-Agent": "curl/7.88.1" } });

  const current = raw.current_condition?.[0] || {};
  const temp = Math.round(Number(current.temp_C) || 26);
  const feelsLike = Math.round(Number(current.FeelsLikeC) || temp);
  const humidity = Math.round(Number(current.humidity) || 65);
  const windSpeed = Math.round(Number(current.windspeedKmph) || 10);
  const condition = current.weatherDesc?.[0]?.value || "Partly Cloudy";

  // Wttr icon mapping approximation
  let weatherIcon = "02d";
  const lowerCond = condition.toLowerCase();
  if (lowerCond.includes("thunder")) weatherIcon = "11d";
  else if (lowerCond.includes("rain") || lowerCond.includes("shower")) weatherIcon = "10d";
  else if (lowerCond.includes("snow")) weatherIcon = "13d";
  else if (lowerCond.includes("fog") || lowerCond.includes("mist")) weatherIcon = "50d";
  else if (lowerCond.includes("clear") || lowerCond.includes("sunny")) weatherIcon = "01d";

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const forecast = [];
  const rawWeather = raw.weather || [];

  for (let i = 0; i < rawWeather.length; i++) {
    const item = rawWeather[i];
    const dateStr = item.date;
    const d = new Date(dateStr + "T00:00:00");
    const avgTemp = Math.round(Number(item.avgtempC) || temp);
    const minTemp = Math.round(Number(item.mintempC) || avgTemp - 4);
    const maxTemp = Math.round(Number(item.maxtempC) || avgTemp + 4);
    const rainChance = Math.round(Number(item.hourly?.[0]?.chanceofrain) || 20);
    const dayCond = item.hourly?.[0]?.weatherDesc?.[0]?.value || condition;

    const dayRiskEval = calculateWeatherRisk({
      temperature: avgTemp,
      feelsLike: avgTemp + 2,
      humidity,
      windSpeed,
      rainProbability: rainChance,
      condition: dayCond,
    });

    forecast.push({
      date: dateStr,
      day: daysOfWeek[d.getDay()],
      temp: avgTemp,
      tempMin: minTemp,
      tempMax: maxTemp,
      feelsLike: avgTemp + 2,
      humidity,
      windSpeed,
      condition: dayCond,
      icon: weatherIcon,
      rainProbability: rainChance,
      weatherRisk: dayRiskEval.weatherRisk,
      riskReasons: dayRiskEval.riskReasons,
      sunrise: item.astronomy?.[0]?.sunrise || "06:15 AM",
      sunset: item.astronomy?.[0]?.sunset || "06:45 PM",
    });
  }

  const { weatherRisk, riskReasons } = calculateWeatherRisk({
    temperature: temp,
    feelsLike,
    humidity,
    windSpeed,
    rainProbability: forecast[0]?.rainProbability || 20,
    condition,
  });

  return {
    centerName: centerName || "Pilgrimage Center",
    coordinates: { latitude: Number(lat), longitude: Number(lon) },
    temperature: temp,
    feelsLike,
    humidity,
    windSpeed,
    condition,
    weatherIcon,
    rainProbability: forecast[0]?.rainProbability || 20,
    sunrise: rawWeather[0]?.astronomy?.[0]?.sunrise || "06:15 AM",
    sunset: rawWeather[0]?.astronomy?.[0]?.sunset || "06:45 PM",
    weatherRisk,
    riskReasons,
    forecast,
    source: "wttr.in Meteorological API",
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Validate and resolve latitude and longitude coordinates.
 * If missing, falls back to pilgrimage destination lookup registry.
 */
const resolveCoordinates = (lat, lon, centerName) => {
  const numLat = Number(lat);
  const numLon = Number(lon);

  if (
    lat !== undefined &&
    lat !== null &&
    lon !== undefined &&
    lon !== null &&
    !isNaN(numLat) &&
    !isNaN(numLon) &&
    numLat >= -90 &&
    numLat <= 90 &&
    numLon >= -180 &&
    numLon <= 180
  ) {
    return { valid: true, latitude: numLat, longitude: numLon };
  }

  // Attempt resolution from known destinations registry
  if (centerName) {
    const known = findKnownDestination(centerName);
    if (known && typeof known.latitude === "number" && typeof known.longitude === "number") {
      return {
        valid: true,
        latitude: known.latitude,
        longitude: known.longitude,
        resolvedFromKnown: true,
      };
    }
  }

  return {
    valid: false,
    error: `Invalid or missing coordinates for pilgrimage center "${centerName || "Unknown"}".`,
  };
};

/**
 * Main Service Method: Fetches weather data for pilgrimage center coordinates.
 * Implements in-memory caching and cascading fallback through 3 live meteorological providers.
 */
const fetchWeatherData = async (centerId, lat, lon, centerName, forceRefresh = false) => {
  const coordCheck = resolveCoordinates(lat, lon, centerName);
  if (!coordCheck.valid) {
    throw new Error(coordCheck.error);
  }

  const finalLat = coordCheck.latitude;
  const finalLon = coordCheck.longitude;

  const cacheKey = centerId
    ? `weather_${centerId}`
    : `weather_${finalLat.toFixed(3)}_${finalLon.toFixed(3)}`;
  const now = Date.now();

  // Return cached result if valid and not force-refreshing
  if (!forceRefresh && weatherCache.has(cacheKey)) {
    const cached = weatherCache.get(cacheKey);
    if (now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    weatherCache.delete(cacheKey);
  }

  const apiKey = process.env.WEATHER_API_KEY;
  const hasValidApiKey =
    apiKey &&
    apiKey.trim() &&
    apiKey !== "your_api_key" &&
    apiKey !== "your_openweathermap_api_key_here";

  // Provider 1: OpenWeatherMap (if valid API key is present)
  if (hasValidApiKey) {
    try {
      const owmResult = await fetchOpenWeatherMap(finalLat, finalLon, apiKey, centerName);
      weatherCache.set(cacheKey, { timestamp: now, data: owmResult });
      return owmResult;
    } catch (err) {
      console.warn("OpenWeatherMap provider notice (falling back to Open-Meteo):", err.message);
    }
  }

  // Provider 2: Open-Meteo 16-Day Forecast API
  try {
    const openMeteoResult = await fetchOpenMeteo(finalLat, finalLon, centerName);
    weatherCache.set(cacheKey, { timestamp: now, data: openMeteoResult });
    return openMeteoResult;
  } catch (omErr) {
    console.warn("Open-Meteo provider notice (falling back to wttr.in):", omErr.message);
  }

  // Provider 3: wttr.in Meteorological Live Backup
  try {
    const wttrResult = await fetchWttrFallback(finalLat, finalLon, centerName);
    weatherCache.set(cacheKey, { timestamp: now, data: wttrResult });
    return wttrResult;
  } catch (wttrErr) {
    console.error("All weather telemetry providers failed:", wttrErr.message);
    throw new Error("Weather information is temporarily unavailable from all meteorological providers.");
  }
};

module.exports = {
  fetchWeatherData,
  calculateWeatherRisk,
  resolveCoordinates,
};
