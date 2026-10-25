/**
 * PilgrimIQ ESP32 Family Tracker Configuration Template
 * 
 * INSTRUCTIONS:
 * 1. Copy this file to 'config.h' in the same directory:
 *    cp config.example.h config.h
 * 2. Replace the placeholder values below with your local Wi-Fi SSID,
 *    password, PilgrimIQ backend URL, and registered Device ID / Token.
 * 3. Never commit 'config.h' to public Git repositories.
 */

#ifndef PILGRIMIQ_CONFIG_H
#define PILGRIMIQ_CONFIG_H

// ==========================================
// 1. Wi-Fi Credentials
// ==========================================
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ==========================================
// 2. PilgrimIQ Backend API Endpoint
// ==========================================
// For Local Testing (use your development PC's local LAN IP, e.g., http://192.168.1.15:5000/api):
// Note: Do NOT use 'localhost' or '127.0.0.1' because the ESP32 is a separate physical device on the Wi-Fi LAN.
const char* BACKEND_BASE_URL = "http://192.168.1.100:5000/api/family-tracking/iot";

// For Render Cloud Deployment (HTTPS):
// const char* BACKEND_BASE_URL = "https://pilgrimiq-backend.onrender.com/api/family-tracking/iot";

// ==========================================
// 3. IoT Hardware Device Identity & Token
// ==========================================
// Obtain these by registering your device via the PilgrimIQ Family Tracking Dashboard
const char* DEVICE_ID = "ESP32-TRACKER-01";
const char* DEVICE_TOKEN = "YOUR_COPIED_DEVICE_TOKEN_FROM_DASHBOARD";

// ==========================================
// 4. Hardware Pinout & Timing Configurations
// ==========================================
#define BUZZER_PIN 23          // GPIO 23 connects to Active Buzzer I/O (matches hardware setup)
#define BUZZER_ACTIVE_HIGH 1   // 1 if buzzer sounds on HIGH, 0 if buzzer sounds on LOW (Active-Low)
#define STATUS_LED_PIN 2       // Onboard blue LED on ESP32 DevKit V1

// Polling and Heartbeat Intervals (milliseconds)
#define COMMAND_POLL_INTERVAL_MS 3000   // Check pending alerts every 3 seconds
#define HEARTBEAT_INTERVAL_MS 15000     // Send connectivity heartbeat every 15 seconds

#endif // PILGRIMIQ_CONFIG_H
