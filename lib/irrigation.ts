/**
 * Irrigation volume calculator.
 *
 * Formula from the SoilPlus research documentation (KazNIIZ methodology,
 * with FAO-56 evapotranspiration anchor):
 *
 *   V = ΔW × D × ρ × S × K_pH × K_EC
 *
 *     ΔW   — moisture deficit (fraction), max(W_opt_mid/100 - W_cur/100, 0)
 *     D    — active root-layer depth (m)
 *     ρ    — bulk soil density (kg/m³), default 1400 (loam)
 *     S    — area in m²
 *     K_pH — 0.85 when pH is outside the band, else 1.0
 *     K_EC — 1.30 when EC exceeds band (flushing mode), else 1.0
 *
 *   V is in kilograms of water ≈ litres (ρ_water ≈ 1000 kg/m³ → 1 kg ≈ 1 L).
 *
 * We return richer output than a single number so the UI can explain *why*.
 */

import { type Crop } from "./crops";

export type Reading = {
  temp: number;
  ph: number;
  tds: number;   // µS/cm ≈ ppm
  moist: number; // %
};

export type IrrigationInput = {
  crop: Crop;
  reading: Reading;
  /** Area in square metres. */
  areaM2: number;
  /** Optional override, kg/m³. Defaults to 1400. */
  soilDensity?: number;
};

export type IrrigationResult = {
  /** Total litres needed to fill the deficit across the whole root zone. */
  litres: number;
  /** Per-hectare litres for comparison. */
  litresPerHa: number;
  /** The moisture deficit as a percentage point gap. */
  deficitPct: number;
  /** pH & EC correction coefficients applied. */
  kPh:  number;
  kEc:  number;
  /** Urgency bucket for the UI. */
  urgency: "none" | "low" | "medium" | "high" | "critical";
  /** Human-readable status reasons, in Russian-friendly English. */
  reasons: string[];
  /** Hours until the next sensor check. */
  nextCheckHours: number;
  /* ---------- watering schedule (added) ---------- */
  /** How many separate waterings are needed to cover the deficit. */
  eventsNeeded: number;
  /** Litres to apply in a single watering event right now. */
  litresPerEvent: number;
  /** Same volume per m². */
  litresPerM2PerEvent: number;
  /** Hours to wait between successive waterings (water needs to soak in). */
  hoursBetweenEvents: number;
};

/**
 * Maximum sustainable single-irrigation depth (mm = L/m²).
 *
 * FAO-56 / KazNIIZ recommend keeping a single watering below ~30-40 mm to
 * avoid surface runoff and deep percolation past the root zone. We pick 35.
 */
const MAX_LITRES_PER_M2_PER_EVENT = 35;

export function computeIrrigation({
  crop,
  reading,
  areaM2,
  soilDensity = 1400,
}: IrrigationInput): IrrigationResult {
  const reasons: string[] = [];

  // 1) Moisture deficit (ΔW)
  const wOptMid = (crop.wOptMin + crop.wOptMax) / 2;
  const deficitPct = Math.max(wOptMid - reading.moist, 0);
  const deltaW = deficitPct / 100;

  // 2) pH correction
  let kPh = 1.0;
  if (reading.ph < crop.phMin) {
    kPh = 0.85;
    reasons.push(`Soil is too acidic for ${crop.name} (pH ${reading.ph.toFixed(2)}). Reduce volume by 15%; consider liming.`);
  } else if (reading.ph > crop.phMax) {
    kPh = 0.85;
    reasons.push(`Soil is too alkaline for ${crop.name} (pH ${reading.ph.toFixed(2)}). Reduce volume by 15%; consider sulfur amendment.`);
  }

  // 3) EC / salinity correction
  let kEc = 1.0;
  if (reading.tds > crop.ecMax) {
    kEc = 1.3;
    reasons.push(`Salinity high (${reading.tds} ppm vs. max ${crop.ecMax}). Apply 30% extra water to flush salts below the root zone.`);
  }

  // 4) Volume: V = ΔW × D × ρ × S × K_pH × K_EC  → kg ≈ L
  const litresRaw = deltaW * crop.rootDepth * soilDensity * areaM2 * kPh * kEc;
  const litres = Math.round(litresRaw / 5) * 5;
  const litresPerM2Total = areaM2 > 0 ? litresRaw / areaM2 : 0;

  // 5) Urgency
  let urgency: IrrigationResult["urgency"] = "none";
  if (deficitPct <= 1)       urgency = "none";
  else if (deficitPct <= 5)  urgency = "low";
  else if (deficitPct <= 15) urgency = "medium";
  else if (deficitPct <= 25) urgency = "high";
  else                        urgency = "critical";

  if (urgency === "none") {
    reasons.unshift(`Влажность в оптимуме (${crop.wOptMin}–${crop.wOptMax}%) — поливать не нужно.`);
  } else {
    reasons.unshift(`Дефицит влаги: ${deficitPct.toFixed(1)} п.п. от оптимума ${wOptMid}%.`);
  }

  // 6) Watering schedule. Cap a single event at 35 L/m² (FAO-56) — split into
  //    multiple events if the total deficit needs more.
  const eventsNeeded =
    urgency === "none"
      ? 0
      : Math.max(1, Math.ceil(litresPerM2Total / MAX_LITRES_PER_M2_PER_EVENT));
  const litresPerEvent =
    eventsNeeded > 0 ? Math.round(litres / eventsNeeded / 5) * 5 : 0;
  const litresPerM2PerEvent =
    eventsNeeded > 0 ? +(litresPerM2Total / eventsNeeded).toFixed(1) : 0;

  // Soak time between events: 24h normally, less when it's hot or critical.
  const hoursBetweenEvents =
    eventsNeeded <= 1
      ? 0
      : urgency === "critical"
        ? 12
        : urgency === "high"
          ? 18
          : 24;

  if (eventsNeeded > 1) {
    reasons.push(
      `Полная норма ${litresPerM2Total.toFixed(0)} л/м² слишком велика для одного полива — разбейте на ${eventsNeeded} приёма по ${litresPerM2PerEvent} л/м² с интервалом ${hoursBetweenEvents} ч (вода должна впитаться в корневую зону).`,
    );
  } else if (eventsNeeded === 1) {
    reasons.push(
      `Полейте один раз: ${litresPerEvent.toLocaleString()} л на ваш участок (${litresPerM2PerEvent} л/м²).`,
    );
  }

  // 7) Next sensor check — shrinks with urgency
  const nextCheckHours =
    urgency === "none"     ? 24 :
    urgency === "low"      ? 12 :
    urgency === "medium"   ? 6  :
    urgency === "high"     ? 3  : 1;

  return {
    litres,
    litresPerHa: Math.round((litres / Math.max(areaM2, 1)) * 10000),
    deficitPct,
    kPh,
    kEc,
    urgency,
    reasons,
    nextCheckHours,
    eventsNeeded,
    litresPerEvent,
    litresPerM2PerEvent,
    hoursBetweenEvents,
  };
}

export const URGENCY_STYLE: Record<IrrigationResult["urgency"], { label: string; tone: "leaf" | "aqua" | "amber" | "red" | "ghost" }> = {
  none:     { label: "No action needed", tone: "leaf"  },
  low:      { label: "Light top-up",     tone: "aqua"  },
  medium:   { label: "Schedule today",   tone: "amber" },
  high:     { label: "Irrigate now",     tone: "amber" },
  critical: { label: "Drought stress",   tone: "red"   },
};
