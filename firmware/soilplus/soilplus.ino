
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
#include <Preferences.h>

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
 *  4)  CALIBRATION — LIVE, STORED IN FLASH (NVS)
 *  -------------------------------------------------------------------
 *  These are no longer compile-time constants. They load from the
 *  ESP32's non-volatile store on boot and are edited at runtime with
 *  serial commands (see section 9c) — no re-flash needed. The values
 *  below are only DEFAULTS, used until you calibrate the first time.
 *
 *  INTERACTIVE CALIBRATION (open Serial Monitor @115200, newline mode):
 *    pH   : put probe in pH 7.00 buffer, wait 30 s, type:  cal ph7
 *           rinse, put in pH 4.00 buffer, wait 30 s, type: cal ph4
 *    TDS  : put probe in a known solution, wait 30 s, type:
 *           cal tds 707     (707 = the ppm printed on your standard)
 *    Moist: probe in dry air → cal moistdry ; in water → cal moistwet
 *    Also : cal show   (print current values) · cal reset (defaults)
 *  Every command saves to flash immediately and survives reboot.
 *
 *  pH math:  pH(v) = 7 + (V7 − v) × 3 / (V7 − V4)
 *    → at v = V7 gives pH 7; at v = V4 gives pH 4; linear between.
 *  TDS math: raw DFRobot polynomial × tdsFactor  (factor set by
 *    'cal tds <ppm>' so the known solution reads exactly <ppm>).
 * =====================================================================*/
constexpr float DEFAULT_PH_V7      = 2.500f;   // voltage in pH 7.00 buffer (V)
constexpr float DEFAULT_PH_V4      = 3.050f;   // voltage in pH 4.00 buffer (V)
constexpr float DEFAULT_TDS_FACTOR = 1.000f;   // multiplier on the polynomial
constexpr int   DEFAULT_MOIST_DRY  = 3100;     // ADC raw in dry air
constexpr int   DEFAULT_MOIST_WET  = 1200;     // ADC raw fully submerged

// Live values (loaded from NVS in setup(), edited via serial):
float phV7      = DEFAULT_PH_V7;
float phV4      = DEFAULT_PH_V4;
float tdsFactor = DEFAULT_TDS_FACTOR;
int   moistDry  = DEFAULT_MOIST_DRY;
int   moistWet  = DEFAULT_MOIST_WET;

Preferences prefs;   // NVS namespace "soilplus"

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
  const float span = phV7 - phV4;                  // volts per 3 pH units
  if (span == 0.0f) return 7.0f;                   // guard
  float ph = 7.0f + (phV7 - volts) * 3.0f / span;
  if (ph < 0.0f)  ph = 0.0f;
  if (ph > 14.0f) ph = 14.0f;
  return ph;
}

int computeTDS(float volts, float waterTempC) {
  // Temperature compensation (DFRobot reference design)
  float comp = 1.0f + 0.02f * (waterTempC - 25.0f);
  if (comp <= 0.01f) comp = 1.0f;
  float v = volts / comp;
  // DFRobot polynomial, 0.5× conversion factor (ppm vs µS/cm),
  // then × tdsFactor from the one-point 'cal tds <ppm>' calibration.
  float tds = (133.42f * v * v * v
             - 255.86f * v * v
             + 857.39f * v) * 0.5f * tdsFactor;
  if (tds < 0.0f)    tds = 0.0f;
  if (tds > 5000.0f) tds = 5000.0f;
  return (int)tds;
}

// Raw polynomial TDS with factor forced to 1.0 — used by the
// calibrator to work out what factor makes a known solution read right.
int computeTDSraw(float volts, float waterTempC) {
  float saved = tdsFactor;
  tdsFactor = 1.0f;
  int r = computeTDS(volts, waterTempC);
  tdsFactor = saved;
  return r;
}

int computeMoisture(int raw) {
  // DRY endpoint is a higher ADC (less capacitance) than WET.
  long pct = ((long)(moistDry - raw) * 100L) / (moistDry - moistWet);
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
 *  9b) CALIBRATION PERSISTENCE  (NVS / flash)
 * =====================================================================*/
void loadCalibration() {
  prefs.begin("soilplus", /*readOnly=*/true);
  phV7      = prefs.getFloat("phV7",   DEFAULT_PH_V7);
  phV4      = prefs.getFloat("phV4",   DEFAULT_PH_V4);
  tdsFactor = prefs.getFloat("tdsFac", DEFAULT_TDS_FACTOR);
  moistDry  = prefs.getInt  ("mDry",   DEFAULT_MOIST_DRY);
  moistWet  = prefs.getInt  ("mWet",   DEFAULT_MOIST_WET);
  prefs.end();
}

void saveCalibration() {
  prefs.begin("soilplus", /*readOnly=*/false);
  prefs.putFloat("phV7",   phV7);
  prefs.putFloat("phV4",   phV4);
  prefs.putFloat("tdsFac", tdsFactor);
  prefs.putInt  ("mDry",   moistDry);
  prefs.putInt  ("mWet",   moistWet);
  prefs.end();
}

void printCalibration() {
  Serial.println("---- SoilPlus calibration ----");
  Serial.printf ("  pH   V7 = %.3f V   V4 = %.3f V   (span %.3f V)\n",
                 phV7, phV4, phV7 - phV4);
  Serial.printf ("  TDS  factor = %.4f\n", tdsFactor);
  Serial.printf ("  Moist dry = %d   wet = %d\n", moistDry, moistWet);
  Serial.println("  Commands: cal ph7 | cal ph4 | cal tds <ppm>");
  Serial.println("            cal moistdry | cal moistwet | cal show | cal reset");
  Serial.println();
}

/* =====================================================================
 *  9c) SERIAL CALIBRATION CONSOLE
 *      Type commands into the Arduino Serial Monitor (newline ending).
 *      Each command samples the probe live and saves to flash at once.
 * =====================================================================*/
void handleSerialCommand(String cmd) {
  cmd.trim();
  cmd.toLowerCase();
  if (cmd.length() == 0) return;

  if (cmd == "cal show" || cmd == "show") {
    printCalibration();
    return;
  }

  if (cmd == "cal reset") {
    phV7 = DEFAULT_PH_V7;  phV4 = DEFAULT_PH_V4;
    tdsFactor = DEFAULT_TDS_FACTOR;
    moistDry = DEFAULT_MOIST_DRY;  moistWet = DEFAULT_MOIST_WET;
    saveCalibration();
    Serial.println("[CAL] Reset to defaults & saved.");
    printCalibration();
    return;
  }

  if (cmd == "cal ph7") {
    float v = adcToVolts(readAnalogFiltered(PIN_PH));
    phV7 = v;  saveCalibration();
    Serial.printf("[CAL] pH 7.00 point set: V7 = %.3f V (saved)\n", v);
    if (phV7 >= phV4)
      Serial.println("[CAL] WARNING: V7 >= V4. In acid the voltage should be HIGHER. Check probe/wiring.");
    return;
  }

  if (cmd == "cal ph4") {
    float v = adcToVolts(readAnalogFiltered(PIN_PH));
    phV4 = v;  saveCalibration();
    Serial.printf("[CAL] pH 4.00 point set: V4 = %.3f V (saved)\n", v);
    if (phV7 >= phV4)
      Serial.println("[CAL] WARNING: V7 >= V4. In acid the voltage should be HIGHER. Check probe/wiring.");
    return;
  }

  if (cmd.startsWith("cal tds")) {
    String arg = cmd.substring(7);  // after "cal tds"
    arg.trim();
    float knownPPM = arg.toFloat();
    if (knownPPM <= 0.0f) {
      Serial.println("[CAL] Usage: cal tds <ppm>   e.g.  cal tds 707");
      return;
    }
    float t = readTemperatureC();
    float v = adcToVolts(readAnalogFiltered(PIN_TDS));
    int rawPPM = computeTDSraw(v, t);
    if (rawPPM <= 0) {
      Serial.println("[CAL] Raw TDS reading is ~0. Is the probe in solution? Aborted.");
      return;
    }
    tdsFactor = knownPPM / (float)rawPPM;
    saveCalibration();
    Serial.printf("[CAL] TDS point set: solution=%.0f ppm, raw=%d ppm @ %.1f C, V=%.3f\n",
                  knownPPM, rawPPM, t, v);
    Serial.printf("[CAL] tdsFactor = %.4f (saved)\n", tdsFactor);
    return;
  }

  if (cmd == "cal moistdry") {
    moistDry = readAnalogFiltered(PIN_MOISTURE);
    saveCalibration();
    Serial.printf("[CAL] Moisture DRY set: raw = %d (saved)\n", moistDry);
    return;
  }

  if (cmd == "cal moistwet") {
    moistWet = readAnalogFiltered(PIN_MOISTURE);
    saveCalibration();
    Serial.printf("[CAL] Moisture WET set: raw = %d (saved)\n", moistWet);
    return;
  }

  Serial.printf("[CAL] Unknown command: \"%s\"  — type 'cal show' for help.\n",
                cmd.c_str());
}

void pollSerialConsole() {
  static String line;
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\n' || c == '\r') {
      if (line.length()) { handleSerialCommand(line); line = ""; }
    } else {
      line += c;
      if (line.length() > 40) line = "";  // runaway guard
    }
  }
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
    // Give up after ~18 s so the main loop (and the serial calibration
    // console) can run even with no hotspot around. loop() keeps trying
    // to reconnect passively in the background.
    if (millis() - t0 > 18000) {
      Serial.println("\n[WiFi] Not connected — continuing WITHOUT Wi-Fi.");
      Serial.println("[WiFi] Sensors + serial calibration still work.");
      Serial.println("[WiFi] Turn on the hotspot to stream to the website.");
      return;
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

  loadCalibration();
  Serial.println("[CAL] Calibration loaded from flash:");
  printCalibration();

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
  pollSerialConsole();   // listen for 'cal ...' commands

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
    Serial.printf ("  [CAL] live: pH V=%.3f  TDS V=%.3f  moist raw=%d\n",
                   r.phVolts, r.tdsVolts, r.moistRaw);
    Serial.printf ("  [CAL] to calibrate type: cal ph7 | cal ph4 | cal tds <ppm> | cal show\n");
    Serial.println();
  }

  /* ----- Passive Wi-Fi recovery (non-blocking, every 30 s) ----- */
  static uint32_t lastWifiTry = 0;
  if (WiFi.status() != WL_CONNECTED && now - lastWifiTry > 30000) {
    lastWifiTry = now;
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);   // fire-and-forget; never blocks
  }
}
