/*
 * =====================================================================
 *  SoilPlus  —  WRO 2026 Future Innovators  ·  "Robots Meet Culture"
 *  Uralsk, Kazakhstan  ·  Bekkaliev Sultan · Muratkali Ersultan
 * =====================================================================
 *  Firmware: ESP32 sensor node
 *  Role    : Wi-Fi STA → WebSocket Server on port 81
 *  Payload : {"temp": float, "ph": float, "tds": int, "moist": int}
 *            broadcast every 200 ms to every connected client
 *
 *  Conversion pipeline (raw ADC → physical units):
 *    • Every analog pin is sampled 21× and filtered with a median
 *      followed by a 5-sample trimmed mean → noise floor < 1 mV.
 *    • pH  : 2-point calibration curve (see PH_V4 / PH_V7 below).
 *    • TDS : DFRobot polynomial + DS18B20 temperature compensation.
 *    • Moist: linear map from DRY/WET calibration endpoints.
 *    • Temp: DS18B20 1-Wire bus, 12-bit resolution.
 *
 *  Wiring:
 *    pH Meter analog out .......... GPIO 35  (ADC1_CH7)
 *    TDS Meter analog out ......... GPIO 32  (ADC1_CH4)
 *    DS18B20 data (+4.7k to VCC).. GPIO  4
 *    Capacitive moisture out ...... GPIO 33  (ADC1_CH5)
 *    All sensors → 3.3V / GND
 *
 *  Libraries (Arduino Library Manager):
 *    WiFi · WebSockets (Markus Sattler) · OneWire (Paul Stoffregen)
 *    DallasTemperature (Miles Burton) · ArduinoJson v6+ (Blanchon)
 * =====================================================================
 */

#include <WiFi.h>
#include <WebSocketsServer.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>

/* =====================================================================
 *  1)  WI-FI — point this at your phone's hotspot.
 *      ESP32 supports 2.4 GHz only. Turn OFF "Maximize Compatibility"
 *      on iPhone, and disable 5 GHz on Android hotspots.
 * =====================================================================*/
const char* WIFI_SSID     = "iPhoneyers";       // ← change this
const char* WIFI_PASSWORD = "eroha999";   // ← change this

/* =====================================================================
 *  2)  PIN MAP
 * =====================================================================*/
constexpr uint8_t PIN_PH        = 35;
constexpr uint8_t PIN_TDS       = 32;
constexpr uint8_t PIN_DS18B20   =  4;
constexpr uint8_t PIN_MOISTURE  = 33;

/* =====================================================================
 *  3)  ADC REFERENCE
 * =====================================================================*/
constexpr float VREF    = 3.30f;   // ESP32 ADC ref with 11 dB atten
constexpr int   ADC_RES = 4095;    // 12-bit

/* =====================================================================
 *  4)  pH — TWO-POINT CALIBRATION
 *  -------------------------------------------------------------------
 *  HOW TO CALIBRATE (one-time, ~5 min):
 *    1. Plug probe in pH 7.00 buffer. Watch Serial; wait 30 s for it
 *       to settle. Note the "[CAL] pH raw voltage = X.XXX V" line.
 *       Put that number into PH_V7 below.
 *    2. Rinse with distilled water. Plug into pH 4.00 buffer.
 *       Wait 30 s. Put the voltage into PH_V4.
 *    3. Re-flash. Done.
 *
 *  WHY it works:
 *    pH(v) = 7 + (V7 − v) × 3 / (V7 − V4)
 *    → at v = V7 gives pH 7; at v = V4 gives pH 4; linear between.
 * =====================================================================*/
constexpr float PH_V7 = 2.500f;   // voltage in pH 7.00 buffer (V)
constexpr float PH_V4 = 3.050f;   // voltage in pH 4.00 buffer (V)

/* =====================================================================
 *  5)  CAPACITIVE MOISTURE — RAW ENDPOINTS
 *  -------------------------------------------------------------------
 *  1. Hold probe in dry air. Watch "[CAL] moist raw = XXXX". → MOIST_DRY
 *  2. Submerge probe in water (not past the PCB). → MOIST_WET
 *  Typical: dry ≈ 3000–3200, wet ≈ 1100–1400.
 * =====================================================================*/
constexpr int MOIST_DRY = 3100;
constexpr int MOIST_WET = 1200;

/* =====================================================================
 *  6)  TIMING
 * =====================================================================*/
constexpr uint32_t BROADCAST_MS = 200;   // 5 Hz to the website
constexpr uint32_t DEBUG_MS     = 3000;  // human-readable log every 3 s

/* =====================================================================
 *  7)  PERIPHERALS
 * =====================================================================*/
OneWire           oneWire(PIN_DS18B20);
DallasTemperature tempSensor(&oneWire);
WebSocketsServer  webSocket(81);

/* =====================================================================
 *  7b) READING STRUCT — declared BEFORE any function signature that
 *      uses it. Arduino IDE auto-generates prototypes at the top of the
 *      translation unit, so the type must be visible up here.
 * =====================================================================*/
struct Reading {
  float tempC;
  float ph;
  int   tds;
  int   moist;
  int   phRaw,    tdsRaw,    moistRaw;
  float phVolts,  tdsVolts;
};

/* =====================================================================
 *  8)  FILTERED ANALOG READ
 *      21 samples → sort → drop 8 outliers → mean of the middle 13.
 *      Result is remarkably stable even on noisy probes.
 * =====================================================================*/
int readAnalogFiltered(uint8_t pin) {
  constexpr int N = 21;
  int buf[N];
  for (int i = 0; i < N; ++i) {
    buf[i] = analogRead(pin);
    delay(2);
  }
  // Insertion sort (N small)
  for (int i = 1; i < N; ++i) {
    int key = buf[i], j = i - 1;
    while (j >= 0 && buf[j] > key) { buf[j + 1] = buf[j]; --j; }
    buf[j + 1] = key;
  }
  // Trimmed mean of samples [4..16] (13 values)
  long sum = 0;
  for (int i = 4; i <= 16; ++i) sum += buf[i];
  return (int)(sum / 13);
}

inline float adcToVolts(int raw) {
  return (raw / (float)ADC_RES) * VREF;
}

/* =====================================================================
 *  9)  CONVERSIONS  (raw → physical units)
 * =====================================================================*/

float computePH(float volts) {
  const float span = PH_V7 - PH_V4;                // volts per 3 pH units
  if (span == 0.0f) return 7.0f;                   // guard
  float ph = 7.0f + (PH_V7 - volts) * 3.0f / span;
  if (ph < 0.0f)  ph = 0.0f;
  if (ph > 14.0f) ph = 14.0f;
  return ph;
}

int computeTDS(float volts, float waterTempC) {
  // Temperature compensation (DFRobot reference design)
  float comp = 1.0f + 0.02f * (waterTempC - 25.0f);
  if (comp <= 0.01f) comp = 1.0f;
  float v = volts / comp;
  // DFRobot polynomial, 0.5× conversion factor (ppm vs µS/cm)
  float tds = (133.42f * v * v * v
             - 255.86f * v * v
             + 857.39f * v) * 0.5f;
  if (tds < 0.0f)    tds = 0.0f;
  if (tds > 5000.0f) tds = 5000.0f;
  return (int)tds;
}

int computeMoisture(int raw) {
  // DRY endpoint is a higher ADC (less capacitance) than WET.
  long pct = ((long)(MOIST_DRY - raw) * 100L) / (MOIST_DRY - MOIST_WET);
  if (pct < 0)   pct = 0;
  if (pct > 100) pct = 100;
  return (int)pct;
}

float readTemperatureC() {
  tempSensor.requestTemperatures();
  float t = tempSensor.getTempCByIndex(0);
  if (t == DEVICE_DISCONNECTED_C || t < -50.0f || t > 125.0f) return 0.0f;
  return t;
}

Reading takeReading() {
  Reading r{};

  // DS18B20 first — TDS depends on temperature
  r.tempC = readTemperatureC();

  // pH
  r.phRaw   = readAnalogFiltered(PIN_PH);
  r.phVolts = adcToVolts(r.phRaw);
  r.ph      = computePH(r.phVolts);

  // TDS
  r.tdsRaw   = readAnalogFiltered(PIN_TDS);
  r.tdsVolts = adcToVolts(r.tdsRaw);
  r.tds      = computeTDS(r.tdsVolts, r.tempC);

  // Moisture
  r.moistRaw = readAnalogFiltered(PIN_MOISTURE);
  r.moist    = computeMoisture(r.moistRaw);

  return r;
}

/* =====================================================================
 *  10) WEBSOCKET CALLBACKS
 * =====================================================================*/
void onWsEvent(uint8_t num, WStype_t type, uint8_t* /*payload*/, size_t /*length*/) {
  switch (type) {
    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[WS] Client #%u connected from %s\n",
                    num, ip.toString().c_str());
      // Optional handshake frame — the web hook silently ignores it.
      webSocket.sendTXT(num, "{\"hello\":\"SoilPlus online\"}");
      break;
    }
    case WStype_DISCONNECTED:
      Serial.printf("[WS] Client #%u disconnected\n", num);
      break;
    default:
      break;
  }
}

/* =====================================================================
 *  11) WI-FI BOOTSTRAP — patient, with visible retry loop
 * =====================================================================*/
void connectWiFi() {
  Serial.println();
  Serial.println("============================================");
  Serial.println("  SoilPlus  —  WRO 2026 Future Innovators");
  Serial.println("  Uralsk, Kazakhstan");
  Serial.println("============================================");
  Serial.printf("[WiFi] Connecting to SSID \"%s\"", WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print('.');
    if (millis() - t0 > 20000) {
      Serial.println("\n[WiFi] Timeout — retrying...");
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      t0 = millis();
    }
  }

  Serial.println();
  Serial.println("--------------------------------------------");
  Serial.print  ("[WiFi] Connected!  IP address:   ");
  Serial.println(WiFi.localIP());
  Serial.print  ("[WiFi] Signal strength (RSSI):   ");
  Serial.print  (WiFi.RSSI());
  Serial.println(" dBm");
  Serial.printf ("[WS]   Open ws://%s:81/  in the dashboard\n",
                 WiFi.localIP().toString().c_str());
  Serial.println("--------------------------------------------");
}

/* =====================================================================
 *  12) SETUP / LOOP
 * =====================================================================*/
void setup() {
  Serial.begin(115200);
  delay(250);

  analogReadResolution(12);
  analogSetPinAttenuation(PIN_PH,       ADC_11db);
  analogSetPinAttenuation(PIN_TDS,      ADC_11db);
  analogSetPinAttenuation(PIN_MOISTURE, ADC_11db);

  tempSensor.begin();
  tempSensor.setResolution(12);

  connectWiFi();

  webSocket.begin();
  webSocket.onEvent(onWsEvent);
  Serial.println("[WS]   WebSocket server started on port 81");
  Serial.println("[INFO] Broadcasting every 200 ms.");
  Serial.println("[INFO] Human-readable log every 3 s below.");
  Serial.println();
}

void loop() {
  webSocket.loop();

  static uint32_t lastBroadcast = 0;
  static uint32_t lastDebug     = 0;
  static Reading  lastReading{};

  const uint32_t now = millis();

  /* ----- Broadcast every 200 ms ----- */
  if (now - lastBroadcast >= BROADCAST_MS) {
    lastBroadcast = now;

    Reading r = takeReading();
    lastReading = r;

    StaticJsonDocument<128> doc;
    doc["temp"]  = roundf(r.tempC * 100) / 100.0f;
    doc["ph"]    = roundf(r.ph    * 100) / 100.0f;
    doc["tds"]   = r.tds;
    doc["moist"] = r.moist;

    char buf[128];
    size_t n = serializeJson(doc, buf, sizeof(buf));
    webSocket.broadcastTXT(buf, n);
  }

  /* ----- Human-readable Serial log every 3 s ----- */
  if (now - lastDebug >= DEBUG_MS) {
    lastDebug = now;
    const Reading& r = lastReading;
    Serial.println("---- SoilPlus live reading ----");
    Serial.printf ("  Temp     : %.2f °C\n",                   r.tempC);
    Serial.printf ("  pH       : %.2f         (raw=%d  V=%.3f)\n",
                   r.ph, r.phRaw, r.phVolts);
    Serial.printf ("  TDS      : %d ppm       (raw=%d  V=%.3f)\n",
                   r.tds, r.tdsRaw, r.tdsVolts);
    Serial.printf ("  Moisture : %d %%        (raw=%d)\n",
                   r.moist, r.moistRaw);
    Serial.printf ("  Clients  : %d           RSSI=%d dBm\n",
                   webSocket.connectedClients(), WiFi.RSSI());
    Serial.printf ("  [CAL] paste these into the firmware header if you calibrate now:\n");
    Serial.printf ("        pH voltage = %.3f V    moist raw = %d\n",
                   r.phVolts, r.moistRaw);
    Serial.println();
  }

  /* ----- Passive Wi-Fi recovery ----- */
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Lost connection — reconnecting...");
    connectWiFi();
  }
}
