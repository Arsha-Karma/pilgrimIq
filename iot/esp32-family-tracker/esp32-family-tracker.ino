/**
 * PilgrimIQ IoT Family Tracking & Separation Alert Firmware
 * Board: ESP32 DevKit V1 (DOIT ESP32 DEVKIT V1)
 * Hardware: Active Buzzer module connected to GPIO 23
 * 
 * Required Libraries (Install via Arduino Library Manager):
 * - ArduinoJson by Benoit Blanchon (v6 or v7 supported)
 * - Built-in: WiFi.h, HTTPClient.h, WiFiClientSecure.h
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// Include local configuration (or fallback to defaults if config.h is not yet generated)
#if __has_include("config.h")
  #include "config.h"
#else
  #include "config.example.h"
  #warning "Using config.example.h. Please create config.h with your actual Wi-Fi and device credentials."
#endif

#ifndef BUZZER_PIN
  #define BUZZER_PIN 23
#endif
#ifndef BUZZER_ACTIVE_HIGH
  #define BUZZER_ACTIVE_HIGH 1
#endif
#ifndef STATUS_LED_PIN
  #define STATUS_LED_PIN 2
#endif
#ifndef COMMAND_POLL_INTERVAL_MS
  #define COMMAND_POLL_INTERVAL_MS 3000
#endif
#ifndef HEARTBEAT_INTERVAL_MS
  #define HEARTBEAT_INTERVAL_MS 15000
#endif

// Electrical logic levels based on configured active-high vs active-low polarity
#if (BUZZER_ACTIVE_HIGH == 1)
  #define BUZZER_ON_LEVEL   HIGH
  #define BUZZER_OFF_LEVEL  LOW
#else
  #define BUZZER_ON_LEVEL   LOW
  #define BUZZER_OFF_LEVEL  HIGH
#endif

// Firmware Version
const char* FIRMWARE_VERSION = "1.0.3";

// Forward declarations
void acknowledgeAlertDelivery(const char* alertId);
void sendHeartbeat();

// State Timing Trackers
unsigned long lastCommandPollTime = 0;
unsigned long lastHeartbeatTime = 0;
unsigned long wifiReconnectPreviousMillis = 0;
const unsigned long wifiReconnectInterval = 10000; // 10s reconnection check

bool isDeviceRegistered = false;

// ==========================================
// NON-BLOCKING BUZZER STATE MACHINE
// ==========================================
bool buzzerActive = false;
unsigned long buzzerStartTime = 0;
unsigned long buzzerLastToggleTime = 0;
bool buzzerPinState = false;
int buzzerPulseCount = 0;
int buzzerMaxPulses = 0;
unsigned long buzzerPulseOnMs = 0;
unsigned long buzzerPulseOffMs = 0;

// Maximum buzzer safety duration (2 seconds maximum)
const unsigned long BUZZER_SAFETY_MAX_MS = 2000;

// Track the last alert ID processed to prevent duplicate alerts
String lastProcessedAlertId = "";
// Track pending alert ID awaiting acknowledgment once buzzer pattern finishes
String pendingAckAlertId = "";

void setBuzzerState(bool active) {
  digitalWrite(BUZZER_PIN, active ? BUZZER_ON_LEVEL : BUZZER_OFF_LEVEL);
}

/**
 * Stop buzzer immediately and ensure GPIO pin and LED are driven to strictly OFF level.
 * When alert buzzer pattern completes, dispatches acknowledgment to server.
 */
void stopBuzzer() {
  bool wasActive = buzzerActive;
  buzzerActive = false;
  buzzerPinState = false;
  digitalWrite(BUZZER_PIN, BUZZER_OFF_LEVEL);
  digitalWrite(STATUS_LED_PIN, LOW);
  if (wasActive) {
    Serial.println("[BUZZER] Buzzer pattern complete. Pin silenced.");
    if (pendingAckAlertId.length() > 0) {
      String idToAck = pendingAckAlertId;
      pendingAckAlertId = "";
      Serial.print("[ACK] Physical buzzer pattern finished. Sending delivery acknowledgment: ");
      Serial.println(idToAck);
      acknowledgeAlertDelivery(idToAck.c_str());
    }
  }
}

/**
 * Triggers non-blocking buzzer pattern (max duration bounded to ~0.8-1.0s, max 2.0s safety cutoff)
 */
void triggerBuzzerPattern(const char* pattern) {
  buzzerActive = true;
  buzzerStartTime = millis();
  buzzerLastToggleTime = millis();
  buzzerPulseCount = 0;

  if (strcmp(pattern, "critical_urgent") == 0) {
    // Critical separation: 4 rapid pulses (150ms ON, 100ms OFF = ~900ms total)
    buzzerMaxPulses = 4;
    buzzerPulseOnMs = 150;
    buzzerPulseOffMs = 100;
  } else {
    // Early warning / dashboard test: 2 distinct notification beeps (300ms ON, 200ms OFF = ~800ms total)
    buzzerMaxPulses = 2;
    buzzerPulseOnMs = 300;
    buzzerPulseOffMs = 200;
  }

  // Activate first pulse immediately
  buzzerPinState = true;
  digitalWrite(BUZZER_PIN, BUZZER_ON_LEVEL);
  digitalWrite(STATUS_LED_PIN, HIGH);
  Serial.print("[BUZZER] Non-blocking pattern started: ");
  Serial.println(pattern);
}

/**
 * Non-blocking routine called on every Arduino loop() cycle to drive buzzer pulses
 */
void updateBuzzer() {
  if (!buzzerActive) {
    // Keep buzzer pin strictly OFF whenever idle
    digitalWrite(BUZZER_PIN, BUZZER_OFF_LEVEL);
    return;
  }

  unsigned long currentMillis = millis();

  // Hard safety timeout: Automatically turn off buzzer after 2000ms maximum
  if (currentMillis - buzzerStartTime >= BUZZER_SAFETY_MAX_MS) {
    Serial.println("[BUZZER] Safety timeout reached (2s).");
    stopBuzzer();
    return;
  }

  if (buzzerPinState) {
    // Currently buzzing (pulse ON) -> check if pulse ON duration has elapsed
    if (currentMillis - buzzerLastToggleTime >= buzzerPulseOnMs) {
      digitalWrite(BUZZER_PIN, BUZZER_OFF_LEVEL);
      digitalWrite(STATUS_LED_PIN, LOW);
      buzzerPinState = false;
      buzzerLastToggleTime = currentMillis;
      buzzerPulseCount++;

      // If all pulses completed, stop buzzer
      if (buzzerPulseCount >= buzzerMaxPulses) {
        stopBuzzer();
      }
    }
  } else {
    // Currently in pause between pulses (pulse OFF) -> check if pause duration has elapsed
    if (buzzerPulseCount < buzzerMaxPulses) {
      if (currentMillis - buzzerLastToggleTime >= buzzerPulseOffMs) {
        digitalWrite(BUZZER_PIN, BUZZER_ON_LEVEL);
        digitalWrite(STATUS_LED_PIN, HIGH);
        buzzerPinState = true;
        buzzerLastToggleTime = currentMillis;
      }
    }
  }
}

// ==========================================
// WI-FI CONNECTION MANAGEMENT
// ==========================================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println();
  Serial.println("[WIFI] Wi-Fi connecting...");
  Serial.print("[WIFI] Connecting to SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("[WIFI] Wi-Fi connected!");
    Serial.print("[WIFI] Assigned IP: ");
    Serial.println(WiFi.localIP());
    // NOTE: Startup and Wi-Fi connection buzzer chirps have been removed.
    // Buzzer remains strictly OFF during startup and connection.
    sendHeartbeat();
  } else {
    Serial.println();
    Serial.println("[WIFI] Connection failed. Will retry in background...");
  }
}

// ==========================================
// HTTP API REQUEST HELPER
// ==========================================
// Automatically selects WiFiClient or WiFiClientSecure based on URL protocol
void setupHttpHeaders(HTTPClient &http) {
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-id", DEVICE_ID);
  http.addHeader("x-device-token", DEVICE_TOKEN);
}

// ==========================================
// 1. POLL PENDING BUZZER COMMANDS
// ==========================================
void pollPendingCommands() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(BACKEND_BASE_URL) + "/commands";

  WiFiClientSecure secureClient;
  WiFiClient plainClient;

  // Use WiFiClientSecure if HTTPS, standard WiFiClient if HTTP
  if (url.startsWith("https://")) {
    secureClient.setInsecure(); // For prototype demo; in high-security production, load root CA certificate
    secureClient.setHandshakeTimeout(20);
    http.begin(secureClient, url);
  } else {
    http.begin(plainClient, url);
  }

  http.setTimeout(15000);
  setupHttpHeaders(http);

  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();

    #if defined(ARDUINOJSON_VERSION_MAJOR) && (ARDUINOJSON_VERSION_MAJOR >= 7)
      JsonDocument doc;
    #else
      StaticJsonDocument<1024> doc;
    #endif

    DeserializationError err = deserializeJson(doc, payload);

    if (!err) {
      bool hasCommand = doc["hasCommand"] | false;

      if (hasCommand) {
        const char* command = doc["command"] | "NONE";
        const char* alertId = doc["alertId"] | "";
        const char* memberId = doc["memberId"] | "";
        const char* memberName = doc["memberName"] | "Family Member";
        float distance = doc["distanceMeters"] | 0.0;
        float threshold = doc["thresholdMeters"] | 50.0;
        const char* severity = doc["severity"] | "warning";
        const char* buzzerPattern = doc["buzzerPattern"] | "warning_short";

        // De-duplicate: If this alertId was already received and processed, do NOT trigger buzzer again!
        if (strlen(alertId) > 0 && lastProcessedAlertId.equals(alertId)) {
          Serial.print("[COMMAND] Alert ID ");
          Serial.print(alertId);
          Serial.println(" was already processed. Duplicate buzzer suppressed. Re-acknowledging to server...");
          acknowledgeAlertDelivery(alertId);
          http.end();
          return;
        }

        // Record genuinely new alert ID
        if (strlen(alertId) > 0) {
          lastProcessedAlertId = String(alertId);
          pendingAckAlertId = String(alertId);
        }

        Serial.println("==================================================");
        Serial.println("[ALERT TRIGGERED] NEW SEPARATION WARNING DETECTED!");
        Serial.print("  Alert ID: "); Serial.println(alertId);
        Serial.print("  Member ID: "); Serial.println(memberId);
        Serial.print("  Member Name: "); Serial.println(memberName);
        Serial.print("  Distance: "); Serial.print(distance); Serial.println(" meters");
        Serial.print("  Threshold: "); Serial.print(threshold); Serial.println(" meters");
        Serial.print("  Severity: "); Serial.println(severity);
        Serial.print("  Buzzer Pattern: "); Serial.println(buzzerPattern);
        Serial.println("==================================================");

        Serial.println("[BUZZER] Triggering non-blocking buzzer pattern on GPIO 23...");
        // Sound the active buzzer non-blockingly (~0.8 to 1.0 seconds max, auto turns OFF)
        triggerBuzzerPattern(buzzerPattern);
        // Delivery acknowledgment will be dispatched by stopBuzzer() once physical pattern completes
      } else {
        const char* statusMsg = doc["status"] | "SAFE";
        int activeAlertsCount = doc["activeAlertsCount"] | 0;
        const char* infoMsg = doc["message"] | "";

        if (strcmp(statusMsg, "SAFE") == 0 || activeAlertsCount == 0) {
          // Backend reports SAFE / no active alerts -> keep buzzer strictly OFF
          stopBuzzer();
        } else {
          // Backend reports SEPARATED with remaining active alerts -> do not prematurely silence buzzer
          Serial.print("[ALERT] Active separation continues for ");
          Serial.print(activeAlertsCount);
          Serial.println(" family member(s). Alert state preserved.");
        }

        Serial.print("[COMMAND] Polled OK (HTTP 200) - Status: ");
        Serial.print(statusMsg);
        if (strlen(infoMsg) > 0) {
          Serial.print(" (");
          Serial.print(infoMsg);
          Serial.print(")");
        }
        Serial.println();
      }
    } else {
      Serial.print("[JSON ERROR] Failed to parse command response: ");
      Serial.println(err.c_str());
    }
  } else if (httpCode == 401) {
    stopBuzzer();
    Serial.println("[AUTH ERROR] ESP32 not authorized (HTTP 401). Verify DEVICE_ID and DEVICE_TOKEN in config.h.");
  } else if (httpCode > 0) {
    stopBuzzer();
    Serial.print("[COMMAND] Server returned HTTP error: ");
    Serial.println(httpCode);
  } else {
    stopBuzzer();
    Serial.print("[HTTP ERROR] Failed to connect: ");
    Serial.print(http.errorToString(httpCode).c_str());
    Serial.print(" (Code: ");
    Serial.print(httpCode);
    Serial.println(")");
  }

  http.end();
}

// ==========================================
// 2. ACKNOWLEDGE COMMAND DELIVERY
// ==========================================
void acknowledgeAlertDelivery(const char* alertId) {
  if (WiFi.status() != WL_CONNECTED || strlen(alertId) == 0) return;

  HTTPClient http;
  String url = String(BACKEND_BASE_URL) + "/acknowledge";

  WiFiClientSecure secureClient;
  WiFiClient plainClient;

  if (url.startsWith("https://")) {
    secureClient.setInsecure();
    secureClient.setHandshakeTimeout(20);
    http.begin(secureClient, url);
  } else {
    http.begin(plainClient, url);
  }

  http.setTimeout(15000);
  setupHttpHeaders(http);

  #if defined(ARDUINOJSON_VERSION_MAJOR) && (ARDUINOJSON_VERSION_MAJOR >= 7)
    JsonDocument doc;
  #else
    StaticJsonDocument<256> doc;
  #endif

  doc["alertId"] = alertId;
  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);

  if (httpCode == HTTP_CODE_OK) {
    Serial.print("[ACK SUCCESS] Alert ");
    Serial.print(alertId);
    Serial.println(" delivery acknowledged to server (HTTP 200).");
  } else if (httpCode == 401) {
    Serial.println("[ACK FAILED] Auth Failed (HTTP 401). Check DEVICE_ID and DEVICE_TOKEN.");
  } else if (httpCode > 0) {
    Serial.print("[ACK FAILED] Server returned HTTP: ");
    Serial.println(httpCode);
  } else {
    Serial.print("[ACK FAILED] Connection failed: ");
    Serial.print(http.errorToString(httpCode).c_str());
    Serial.print(" (Code: ");
    Serial.print(httpCode);
    Serial.println(")");
  }

  http.end();
}

// ==========================================
// 3. HEARTBEAT REPORT
// ==========================================
void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(BACKEND_BASE_URL) + "/heartbeat";

  WiFiClientSecure secureClient;
  WiFiClient plainClient;

  if (url.startsWith("https://")) {
    secureClient.setInsecure();
    secureClient.setHandshakeTimeout(20);
    http.begin(secureClient, url);
  } else {
    http.begin(plainClient, url);
  }

  http.setTimeout(15000);
  setupHttpHeaders(http);

  #if defined(ARDUINOJSON_VERSION_MAJOR) && (ARDUINOJSON_VERSION_MAJOR >= 7)
    JsonDocument doc;
  #else
    StaticJsonDocument<256> doc;
  #endif

  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["ipAddress"] = WiFi.localIP().toString();
  doc["batteryLevel"] = 100; // Simulated battery / USB powered

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);

  if (httpCode == HTTP_CODE_OK) {
    String responseBody = http.getString();
    #if defined(ARDUINOJSON_VERSION_MAJOR) && (ARDUINOJSON_VERSION_MAJOR >= 7)
      JsonDocument resDoc;
    #else
      StaticJsonDocument<256> resDoc;
    #endif
    DeserializationError jsonErr = deserializeJson(resDoc, responseBody);
    if (!jsonErr && resDoc["success"] == true) {
      Serial.print("[HEARTBEAT] OK (HTTP 200) - Server acknowledged at ");
      Serial.println(resDoc["serverTime"] | "now");
    } else {
      Serial.print("[HEARTBEAT] Warning (HTTP 200) - Server response: ");
      Serial.println(responseBody);
    }
  } else if (httpCode == 401) {
    Serial.println("[HEARTBEAT] Auth Failed (HTTP 401) - Unauthorized. Check DEVICE_ID & DEVICE_TOKEN.");
  } else if (httpCode > 0) {
    Serial.print("[HEARTBEAT] Ping failed. Status code: ");
    Serial.println(httpCode);
  } else {
    Serial.print("[HEARTBEAT] Connection failed: ");
    Serial.print(http.errorToString(httpCode).c_str());
    Serial.print(" (Code: ");
    Serial.print(httpCode);
    Serial.println(")");
  }

  http.end();
}

// ==========================================
// ARDUINO SETUP
// ==========================================
void setup() {
  // CRITICAL: Initialize GPIO 23 to strictly OFF on line 1 before any delay or boot sequence
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, BUZZER_OFF_LEVEL);
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, LOW);

  Serial.begin(115200);
  delay(500);

  Serial.println();
  Serial.println("[BOOT] ESP32 booted.");
  Serial.println("[BUZZER] Buzzer initialized OFF.");
  Serial.println("==================================================");
  Serial.println("PilgrimIQ IoT Family Tracker DevKit V1 Starting...");
  Serial.print("Firmware Version: "); Serial.println(FIRMWARE_VERSION);
  Serial.print("Configured Device ID: "); Serial.println(DEVICE_ID);
  Serial.print("Buzzer GPIO: "); Serial.println(BUZZER_PIN);
#if (BUZZER_ACTIVE_HIGH == 1)
  Serial.println("Buzzer Polarity: ACTIVE-HIGH (Pin HIGH = Sound, Pin LOW = Silent)");
#else
  Serial.println("Buzzer Polarity: ACTIVE-LOW (Pin LOW = Sound, Pin HIGH = Silent)");
#endif
  Serial.println("==================================================");

  // Connect to Local Wi-Fi (no Wi-Fi chirp)
  connectWiFi();
}

// ==========================================
// ARDUINO MAIN LOOP
// ==========================================
void loop() {
  // 1. Service non-blocking buzzer state machine (1-2s bounded, auto-off)
  updateBuzzer();

  unsigned long currentMillis = millis();

  // 2. Maintain Wi-Fi Connection
  if (WiFi.status() != WL_CONNECTED) {
    stopBuzzer(); // Guarantee buzzer is immediately OFF when disconnected
    if (currentMillis - wifiReconnectPreviousMillis >= wifiReconnectInterval) {
      wifiReconnectPreviousMillis = currentMillis;
      Serial.println("[WIFI] Connection lost. Attempting reconnection...");
      connectWiFi();
    }
    return; // Don't attempt HTTP operations without active connection
  }

  // 3. Poll Pending Separation Commands (Every 3 seconds)
  if (currentMillis - lastCommandPollTime >= COMMAND_POLL_INTERVAL_MS) {
    lastCommandPollTime = currentMillis;
    pollPendingCommands();
  }

  // 4. Send Periodic Connectivity Heartbeat (Every 15 seconds)
  if (currentMillis - lastHeartbeatTime >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatTime = currentMillis;
    sendHeartbeat();
  }
}
