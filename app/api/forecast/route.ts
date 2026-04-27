import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { rateLimit } from "@/lib/rate-limit";
import { getCrop, type Crop } from "@/lib/crops";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Reading = {
  temp?: number;  // soil °C
  ph?: number;
  tds?: number;   // µS/cm ~ ppm
  moist?: number; // %
};

type Body = {
  cropId: string;
  areaM2: number;
  reading?: Reading;
  region?: string;
  sowingDate?: string; // YYYY-MM-DD
  note?: string;
};

type Forecast = {
  cropId: string;
  cropName: string;
  /** expected kilograms per hectare */
  yieldPerHa: number;
  /** expected kilograms for the supplied area */
  yieldTotalKg: number;
  /** 0..100 fitness vs optimum bands */
  fitness: number;
  /** 0..100 model confidence */
  confidence: number;
  /** ok | marginal | risky */
  outlook: "ok" | "marginal" | "risky";
  risks: string[];
  boosters: string[];
  notes?: string;
};

/** Literature-based reference yields, kg/ha — steppe / Central-Asia norms. */
const YIELD_REF: Record<string, number> = {
  wheat: 2500,
  barley: 2300,
  corn: 6000,
  sunflower: 1800,
  potato: 22000,
  tomato: 35000,
  alfalfa: 8000,
  cotton: 2800,
  soybean: 2200,
  "aport-apple": 15000,
  tulipa: 0,
  saxaul: 0,
};

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`forecast:${ip}`, { max: 20, windowMs: 60_000 })) {
    return NextResponse.json(
      { error: "Too many forecast requests. Try again in a minute." },
      { status: 429 },
    );
  }

  let body: Partial<Body>;
  try {
    body = (await req.json()) as Partial<Body>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const cropId = typeof body.cropId === "string" ? body.cropId : "";
  const areaM2 = Number(body.areaM2);
  if (!cropId) {
    return NextResponse.json({ error: "cropId is required" }, { status: 400 });
  }
  if (!Number.isFinite(areaM2) || areaM2 <= 0 || areaM2 > 10_000_000) {
    return NextResponse.json(
      { error: "areaM2 must be a positive number up to 10,000,000" },
      { status: 400 },
    );
  }

  const crop = getCrop(cropId);
  if (!crop) {
    return NextResponse.json({ error: "Unknown cropId" }, { status: 400 });
  }

  const reading = sanitiseReading(body.reading);
  const region = typeof body.region === "string" ? body.region.slice(0, 80) : "";
  const sowingDate =
    typeof body.sowingDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.sowingDate)
      ? body.sowingDate
      : undefined;
  const note =
    typeof body.note === "string" ? body.note.slice(0, 500) : undefined;

  const baseline = heuristicForecast(crop, areaM2, reading);

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      forecast: baseline,
      model: "offline-heuristic",
      warning: "No GOOGLE_GENERATIVE_AI_API_KEY configured — using heuristic.",
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2200,
        responseMimeType: "application/json",
      },
    });

    const prompt = [
      `You are the SoilPlus Yield Forecaster — senior agronomist trained on`,
      `KazNIIZ, FAO-56 and CIMMYT data for Kazakh / Central-Asian conditions.`,
      ``,
      `CROP: ${crop.name} (${crop.nameRu}), family ${crop.family}`,
      `OPTIMUM BANDS: moisture ${crop.wOptMin}-${crop.wOptMax}%,`,
      ` pH ${crop.phMin}-${crop.phMax}, EC<${crop.ecMax}, T_soil ${crop.tOptMin}-${crop.tOptMax}°C`,
      `REFERENCE YIELD: ${YIELD_REF[crop.id] ?? 0} kg/ha under best practice.`,
      `AREA: ${areaM2} m²`,
      region ? `REGION: ${region}` : "",
      sowingDate ? `SOWING DATE: ${sowingDate}` : "",
      note ? `USER NOTE: "${note}"` : "",
      `CURRENT READING: moisture=${reading.moist ?? "n/a"}%,` +
        ` pH=${reading.ph ?? "n/a"},` +
        ` EC=${reading.tds ?? "n/a"},` +
        ` T=${reading.temp ?? "n/a"}°C`,
      ``,
      `Return ONLY a JSON object:`,
      `{`,
      `  "yieldPerHa": <number, kg/ha for this plot given the reading>,`,
      `  "yieldTotalKg": <number for the supplied area>,`,
      `  "fitness": <0-100 how well the soil matches crop optimum>,`,
      `  "confidence": <0-100 model confidence>,`,
      `  "outlook": "ok" | "marginal" | "risky",`,
      `  "risks": ["specific agronomic risk #1", "#2", ...],`,
      `  "boosters": ["concrete action that would raise yield #1", "#2", ...],`,
      `  "notes": "<1-2 sentences of context>"`,
      `}`,
      ``,
      `RULES:`,
      ` • Never invent data you don't have — say so in notes.`,
      ` • Respond in Russian if USER NOTE is in Russian/Kazakh.`,
      ` • Prefer low-cost interventions first.`,
    ]
      .filter(Boolean)
      .join("\n");

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const parsed = safeParseJson(text);
    if (!parsed) {
      return NextResponse.json({
        forecast: baseline,
        model: "offline-heuristic",
        warning: "Model returned unparseable response.",
      });
    }

    const ai = parsed as Record<string, unknown>;
    const forecast: Forecast = {
      cropId: crop.id,
      cropName: crop.nameRu || crop.name,
      yieldPerHa: num(ai.yieldPerHa, baseline.yieldPerHa),
      yieldTotalKg: num(ai.yieldTotalKg, baseline.yieldTotalKg),
      fitness: clamp(num(ai.fitness, baseline.fitness), 0, 100),
      confidence: clamp(num(ai.confidence, baseline.confidence), 0, 100),
      outlook: outlookOf(ai.outlook) ?? baseline.outlook,
      risks: arr(ai.risks).slice(0, 6),
      boosters: arr(ai.boosters).slice(0, 6),
      notes: typeof ai.notes === "string" ? ai.notes : undefined,
    };

    return NextResponse.json({
      forecast,
      model: "gemini-2.5-flash",
    });
  } catch (e) {
    return NextResponse.json({
      forecast: baseline,
      model: "offline-heuristic",
      warning: e instanceof Error ? e.message : "Forecast call failed",
    });
  }
}

/* ---------- heuristic baseline ---------- */

function heuristicForecast(
  crop: Crop,
  areaM2: number,
  r: Reading,
): Forecast {
  const ref = YIELD_REF[crop.id] ?? 0;

  const moistFit = r.moist != null ? bandFit(r.moist, crop.wOptMin, crop.wOptMax) : 0.8;
  const phFit = r.ph != null ? bandFit(r.ph, crop.phMin, crop.phMax) : 0.8;
  const tFit = r.temp != null ? bandFit(r.temp, crop.tOptMin, crop.tOptMax) : 0.8;
  const ecFit =
    r.tds != null
      ? clamp01(1 - Math.max(0, (r.tds - crop.ecMax * 0.6) / (crop.ecMax * 0.8)))
      : 0.9;

  const fit = clamp01(moistFit * 0.35 + phFit * 0.25 + tFit * 0.2 + ecFit * 0.2);
  const yieldPerHa = Math.round(ref * fit);
  const yieldTotalKg = Math.round((yieldPerHa * areaM2) / 10_000);

  const risks: string[] = [];
  const boosters: string[] = [];

  if (r.moist != null) {
    if (r.moist < crop.wOptMin) {
      risks.push(`Влажность ${r.moist}% ниже нормы (${crop.wOptMin}-${crop.wOptMax}%) — дефицит полива`);
      boosters.push("Настройте капельный полив до выхода в оптимум");
    } else if (r.moist > crop.wOptMax) {
      risks.push(`Переувлажнение (${r.moist}%) — риск корневой гнили`);
      boosters.push("Уменьшите норму и улучшите дренаж");
    }
  }
  if (r.ph != null) {
    if (r.ph < crop.phMin) boosters.push("Внесите известь для подъёма pH");
    else if (r.ph > crop.phMax) boosters.push("Внесите серу / гипс для снижения pH");
  }
  if (r.tds != null && r.tds > crop.ecMax) {
    risks.push(`Засоление: EC ${r.tds} > ${crop.ecMax} — промывной полив`);
    boosters.push("Промывной полив пресной водой 1.5× нормы");
  }
  if (risks.length === 0) boosters.push("Почва в норме — поддерживайте режим");

  const outlook: Forecast["outlook"] =
    fit >= 0.75 ? "ok" : fit >= 0.5 ? "marginal" : "risky";

  return {
    cropId: crop.id,
    cropName: crop.nameRu || crop.name,
    yieldPerHa,
    yieldTotalKg,
    fitness: Math.round(fit * 100),
    confidence: r.moist != null && r.ph != null ? 65 : 40,
    outlook,
    risks,
    boosters,
    notes:
      ref === 0
        ? "Это декоративное / дикорастущее растение — товарного урожая не даёт."
        : undefined,
  };
}

/* ---------- helpers ---------- */

function sanitiseReading(r: unknown): Reading {
  const o = (r ?? {}) as Record<string, unknown>;
  const n = (v: unknown): number | undefined =>
    typeof v === "number" && Number.isFinite(v) ? v : undefined;
  return {
    temp: n(o.temp),
    ph: n(o.ph),
    tds: n(o.tds),
    moist: n(o.moist),
  };
}

function bandFit(v: number, lo: number, hi: number): number {
  if (v >= lo && v <= hi) return 1;
  const span = hi - lo;
  const dist = v < lo ? lo - v : v - hi;
  return clamp01(1 - dist / (span * 1.2));
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}
function num(v: unknown, f: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : f;
}
function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}
function outlookOf(v: unknown): Forecast["outlook"] | null {
  return v === "ok" || v === "marginal" || v === "risky" ? v : null;
}
function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}
