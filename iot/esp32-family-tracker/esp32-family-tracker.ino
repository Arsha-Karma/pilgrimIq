/**
 * PilgrimIQ IoT Family Tracking & Separation Alert Firmware
 * Board: ESP32 DevKit V1 (DOIT ESP32 DEVKIT V1)
 * Hardware: Active Buzzer module connected to GPIO 18
 * 
 * Required Libraries (Install via Arduino Library Manager):
 * - ArduinoJson by Benoit Blanchon (v6 or v7)
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

// Firmware Version
const char* FIRMWARE_VERSION = "1.0.0";

// State Timing Trackers
unsigned long lastCommandPollTime = 0;
unsigned long lastHeartbeatTime = 0;
unsigned long wifiReconnectPreviousMillis = 0;
const unsigned long wifiReconnectInterval = 10000; // 10s reconnection check

bool isDeviceRegistered = false;

// ==========================================
// BUZZER CONTROL UTILITIES
// ==========================================
void setBuzzerState(bool active) {
  if (BUZZER_ACTIVE_HIGH) {
    digitalWrite(BUZZER_PIN, active ? HIGH : LOW);
  } else {
    digitalWrite(BUZZER_PIN, active ? LOW : HIGH);
  }
}

/**
 * Sounds the physical active buzzer based on alert severity
 */
void soundBuzzer(const char* pattern) {
  Serial.print("[BUZZER] Sounding pattern: ");
  Serial.println(pattern);

  if (strcmp(pattern, "critical_urgent") == 0) {
    // Critical separation: 4 rapid high-urgency pulses
    for (int i = 0; i < 4; i++) {
      setBuzzerState(true);
      digitalWrite(STATUS_LED_PIN, HIGH);
      delay(120);
      setBuzzerState(false);
      digitalWrite(STATUS_LED_PIN, LOW);
      delay(100);
    }
  } else {
    // Early warning: 2 distinct notification beeps
    for (int i = 0; i < 2; i++) {
      setBuzzerState(true);
      digitalWrite(STATUS_LED_PIN, HIGH);
      delay(200);
      setBuzzerState(false);
      digitalWrite(STATUS_LED_PIN, LOW);
      delay(150);
    }
  }
}

// Quick chirp on boot to verify buzzer circuit integrity
void testBuzzerChirp() {
  setBuzzerState(true);
  delay(80);
  setBuzzerState(false);
}

// ==========================================
// WI-FI CONNECTION MANAGEMENT
// ==========================================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println();
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
    Serial.print("[WIFI] Connected! Assigned IP: ");
    Serial.println(WiFi.localIP());
    testBuzzerChirp(); // Audio chirp on successful network connect
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

  // Use WiFiClientSecure if HTTPS, standard WiFiClient if HTTP
  if (url.startsWith("https://")) {
    WiFiClientSecure client;
    client.setInsecure(); // For college prototype demo; in high-security production, load root CA certificate
    http.begin(client, url);
  } else {
    WiFiClient client;
    http.begin(client, url);
  }

  http.setTimeout(4000);
  setupHttpHeaders(http);

  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();

    StaticJsonDocument<1024> doc;
    DeserializationError err = deserializeJson(doc, payload);

    if (!err) {
      bool hasCommand = doc["hasCommand"] | false;

      if (hasCommand) {
        const char* command = doc["command"] | "NONE";
        const char* alertId = doc["alertId"] | "";
        const char* severity = doc["severity"] | "warning";
        const char* buzzerPattern = doc["buzzerPattern"] | "warning_short";
        float distance = doc["distanceMeters"] | 0.0;
        const char* memberName = doc["memberName"] | "Family Member";

        Serial.println("==================================================");
        Serial.println("[ALERT TRIGGERED] SEPARATION WARNING DETECTED!");
        Serial.print("  Member: "); Serial.println(memberName);
        Serial.print("  Distance: "); Serial.print(distance); Serial.println(" meters");
        Serial.print("  Severity: "); Serial.println(severity);
        Serial.println("==================================================");

        // Sound the active buzzer
        soundBuzzer(buzzerPattern);

        // Send delivery acknowledgement back to PilgrimIQ backend
        if (strlen(alertId) > 0) {
          acknowledgeAlertDelivery(alertId);
        }
      }
    } else {
      Serial.print("[JSON ERROR] Failed to parse command response: ");
      Serial.println(err.c_str());
    }
  } else if (httpCode == 401) {
    Serial.println("[AUTH ERROR] ESP32 not authorized. Verify DEVICE_ID and DEVICE_TOKEN in config.h.");
  } else {
    Serial.print("[HTTP POLL] Status code: ");
    Serial.println(httpCode);
  }

  http.end();
}

// ==========================================
// 2. ACKNOWLEDGE COMMAND DELIVERY
// ==========================================
void acknowledgeAlertDelivery(const char* alertId) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(BACKEND_BASE_URL) + "/acknowledge";

  if (url.startsWith("https://")) {
    WiFiClientSecure client;
    client.setInsecure();
    http.begin(client, url);
  } else {
    WiFiClient client;
    http.begin(client, url);
  }

  http.setTimeout(4000);
  setupHttpHeaders(http);

  StaticJsonDocument<256> doc;
  doc["alertId"] = alertId;
  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);

  if (httpCode == HTTP_CODE_OK) {
    Serial.println("[ACK SUCCESS] Alert delivery acknowledged to server.");
  } else {
    Serial.print("[ACK FAILED] Response code: ");
    Serial.println(httpCode);
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

  if (url.startsWith("https://")) {
    WiFiClientSecure client;
    client.setInsecure();
    http.begin(client, url);
  } else {
    WiFiClient client;
    http.begin(client, url);
  }

  http.setTimeout(4000);
  setupHttpHeaders(http);

  StaticJsonDocument<256> doc;
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["ipAddress"] = WiFi.localIP().toString();
  doc["batteryLevel"] = 100; // Simulated battery / USB powered

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);

  if (httpCode == HTTP_CODE_OK) {
    Serial.println("[HEARTBEAT] Sent successfully to PilgrimIQ server.");
  } else {
    Serial.print("[HEARTBEAT] Ping failed. Status code: ");
    Serial.println(httpCode);
  }

  http.end();
}

// ==========================================
// ARDUINO SETUP
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("==================================================");
  Serial.println("PilgrimIQ IoT Family Tracker DevKit V1 Starting...");
  Serial.print("Firmware Version: "); Serial.println(FIRMWARE_VERSION);
  Serial.print("Configured Device ID: "); Serial.println(DEVICE_ID);
  Serial.print("Buzzer GPIO: "); Serial.println(BUZZER_PIN);
  Serial.println("==================================================");

  // Configure GPIO Pins
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(STATUS_LED_PIN, OUTPUT);

  setBuzzerState(false);
  digitalWrite(STATUS_LED_PIN, LOW);

  // Initial Buzzer Test (Short Chirp)
  testBuzzerChirp();

  // Connect to Local Wi-Fi
  connectWiFi();
}

// ==========================================
// ARDUINO MAIN LOOP
// ==========================================
void loop() {
  unsigned long currentMillis = millis();

  // 1. Maintain Wi-Fi Connection
  if (WiFi.status() != WL_CONNECTED) {
    if (currentMillis - wifiReconnectPreviousMillis >= wifiReconnectInterval) {
      wifiReconnectPreviousMillis = currentMillis;
      Serial.println("[WIFI] Connection lost. Attempting reconnection...");
      connectWiFi();
    }
    return; // Don't attempt HTTP operations without active connection
  }

  // 2. Poll Pending Separation Commands (Every 3 seconds)
  if (currentMillis - lastCommandPollTime >= COMMAND_POLL_INTERVAL_MS) {
    lastCommandPollTime = currentMillis;
    pollPendingCommands();
  }

  // 3. Send Periodic Connectivity Heartbeat (Every 15 seconds)
  if (currentMillis - lastHeartbeatTime >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatTime = currentMillis;
    sendHeartbeat();
  }
}
