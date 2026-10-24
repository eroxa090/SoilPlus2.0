// Copy this file to secrets.h (same folder) and fill in your phone hotspots.
// secrets.h is in .gitignore — never commit real credentials.
//
// The board joins whichever listed hotspot is in range. Network 1 is
// required; networks 2 and 3 are optional — delete them if unused.
// ESP32 is 2.4 GHz only: on iPhone turn ON "Maximize Compatibility".
#pragma once

#define SOILPLUS_WIFI_SSID       "first-hotspot-name"
#define SOILPLUS_WIFI_PASSWORD   "first-hotspot-password"

#define SOILPLUS_WIFI_SSID_2     "second-hotspot-name"
#define SOILPLUS_WIFI_PASSWORD_2 "second-hotspot-password"
