# PilgrimIQ — ESP32 DevKit V1 Family Tracker & Buzzer Firmware

This directory contains the production-ready Arduino firmware for the PilgrimIQ IoT-based Family Tracking module. The main user carries this portable ESP32 hardware device, which receives separation alerts over Wi-Fi and triggers an active buzzer alarm when a family member strays beyond a configured distance threshold.

---

## 1. Hardware Requirements

| Component | Quantity | Specification / Notes |
| :--- | :--- | :--- |
| **ESP32 DevKit V1** | 1 | 30-pin or 36-pin DevKit board with CP2102 or CH340 USB-UART |
| **Active Buzzer Module** | 1 | 3.3V / 5V DC Active Buzzer (includes internal oscillator) |
| **Female-to-Female Jumpers** | 3 | Used to connect ESP32 pins to the buzzer module |
| **Micro-USB Cable** | 1 | Data + Power cable for flashing and powering the ESP32 |
| **Power Source** | 1 | USB Power Bank or 5V Phone Charger for mobile pilgrim use |

---

## 2. Wiring & Pinout Guide

### Active Buzzer Pin Connections

Most 3-pin active buzzer modules (such as the KY-012 or standard sensor modules) have three pins: **VCC**, **GND**, and **I/O (Signal)**.

```
+------------------------+                     +------------------------+
|    ESP32 DevKit V1     |                     |  Active Buzzer Module  |
|                        |                     |                        |
|  [ 3V3 ] (or VIN 5V)   +-------------------->+ [ VCC ]                |
|  [ GND ]               +-------------------->+ [ GND ]                |
|  [ GPIO 18 ]           +-------------------->+ [ I/O ] (Signal)       |
+------------------------+                     +------------------------+
```

| Buzzer Module Pin | ESP32 Pin | Function |
| :--- | :--- | :--- |
| **VCC** (or `+`) | **3V3** (or **VIN / 5V**) | Power supply (3.3V is optimal for direct GPIO control) |
| **GND** (or `-`) | **GND** | Common ground |
| **I/O** (or `S`) | **GPIO 18** | Digital trigger output from ESP32 |

> **Active Buzzer vs. Passive Buzzer Note:**
> An **Active Buzzer** has an integrated tone generator. When `GPIO 18` is set to `HIGH`, it automatically sounds a high-frequency beep (~2.4 kHz). If using a 2-pin buzzer without a transistor driver board, ensure current draw does not exceed 12mA; using a standard 3-pin transistor-buffered buzzer breakout module is strongly recommended.

---

## 3. Arduino IDE Setup Instructions

### Step 1: Install ESP32 Board Package
1. Open **Arduino IDE** (v2.x or v1.8.x).
2. Go to **File -> Preferences**.
3. In **Additional Board Manager URLs**, enter:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Open **Tools -> Board -> Boards Manager...**, search for `esp32`, and install **esp32 by Espressif Systems**.

### Step 2: Install Required Libraries
1. Open **Tools -> Manage Libraries...**
2. Search for `ArduinoJson` (by Benoit Blanchon).
3. Click **Install** (v6.x or v7.x supported).

### Step 3: Configure Device Credentials
1. Duplicate `config.example.h` and rename it to `config.h` in the same directory:
   ```bash
   cp config.example.h config.h
   ```
2. Open `config.h` and configure:
   - `WIFI_SSID`: Your local Wi-Fi router or smartphone hotspot name.
   - `WIFI_PASSWORD`: Your Wi-Fi password.
   - `BACKEND_BASE_URL`: The URL of your PilgrimIQ backend:
     - For Local testing: `http://<YOUR_PC_LAN_IP>:5000/api/family-tracking/iot`
     - For Render Cloud: `https://pilgrimiq-backend.onrender.com/api/family-tracking/iot`
   - `DEVICE_ID`: Matches the ID on your PilgrimIQ dashboard (e.g., `ESP32-TRACKER-01`).
   - `DEVICE_TOKEN`: Generated when you click **Pair Device** on the dashboard.

---

## 4. Flashing the Firmware

1. Connect the ESP32 to your PC using the Micro-USB cable.
2. Under **Tools -> Board**, select **DOIT ESP32 DEVKIT V1**.
3. Under **Tools -> Port**, select the COM port of your ESP32 (e.g., `COM3`, `COM5`).
4. Under **Tools -> Upload Speed**, select `921600` (or `115200` if upload fails).
5. Click the **Upload** button (Arrow icon).
   *(If the IDE displays `Connecting.......____`, press and hold the **BOOT** button on the ESP32 for 2 seconds until uploading begins).*

---

## 5. Serial Monitor Verification & Testing

1. Open **Tools -> Serial Monitor** and set baud rate to **115200**.
2. Press the **EN / RST** button on the ESP32.
3. You should observe:
   - Initial boot banner: `PilgrimIQ IoT Family Tracker DevKit V1 Starting...`
   - Short hardware test chirp from the active buzzer.
   - Wi-Fi connection with assigned local IP address.
   - Periodic heartbeat reports: `[HEARTBEAT] Sent successfully to PilgrimIQ server.`
   - Clean polling loop: `GET /api/family-tracking/iot/commands` every 3 seconds.
4. When a separation alert is triggered on the dashboard:
   ```
   ==================================================
   [ALERT TRIGGERED] SEPARATION WARNING DETECTED!
     Member: Arjun Sharma
     Distance: 16.4 meters
     Severity: warning
   ==================================================
   [BUZZER] Sounding pattern: warning_short
   [ACK SUCCESS] Alert delivery acknowledged to server.
   ```

---

## 6. Buzzer Alert Patterns

| State | Beep Pattern | Timing |
| :--- | :--- | :--- |
| **Boot Chirp** | 1 short beep | 80ms ON |
| **Early Warning** | 2 distinct pulses | 200ms ON, 150ms OFF, 200ms ON |
| **Critical Separation** | 4 rapid urgent pulses | 120ms ON, 100ms OFF (repeated 4x) |

---

## 7. Security & Limitations

1. **Token Protection:** Credentials are kept inside `config.h`, which is listed in `.gitignore` to prevent secret leakage in public git logs.
2. **Offline Detection:** If Wi-Fi is lost, the device enters automatic non-blocking reconnection mode. The dashboard flags the device as **Disconnected** if no heartbeat is received within 45 seconds.
3. **GPS Clarification:** The ESP32 does not contain an onboard GPS module; it pairs with the main user's smartphone, which provides coordinates to the backend server.
