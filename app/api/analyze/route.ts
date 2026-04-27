import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ==================================================================== */
/*  Types                                                               */
/* ==================================================================== */

type Reading = {
  temp: number;
  ph: number;
  tds: number;
  moist: number;
};

type Plant = {
  id?: string;
  name: string;
  latin: string;
  story: string;
};

type Band = [number, number];
type PlantProfile = {
  bands:   { temp: Band; ph: Band; tds: Band; moist: Band };
  /** Weights sum ≈ 1. Some plants prize moisture, some prize salinity. */
  weights: { temp: number; ph: number; tds: number; moist: number };
  cultural_note: string;
};

/* ==================================================================== */
/*  Heritage reference profiles — calibrated from agronomic literature  */
/* ==================================================================== */

const PROFILES: Record<string, PlantProfile> = {
  "Almaty Aport Apple": {
    bands:   { temp: [12, 22], ph: [6.0, 7.0], tds: [300, 900],  moist: [40, 65] },
    weights: { temp: 0.2,      ph: 0.3,        tds: 0.2,         moist: 0.3 },
    cultural_note:
      "Aport orchards on the Trans-Ili slopes above Almaty require cool, slightly acidic loam with steady moisture.",
  },
  "Greig's Tulip": {
    bands:   { temp: [8, 18],  ph: [6.5, 7.5], tds: [150, 600],  moist: [25, 45] },
    weights: { temp: 0.2,      ph: 0.3,        tds: 0.25,        moist: 0.25 },
    cultural_note:
      "Greig's tulip is a limestone-steppe species of southern Kazakhstan — it rots in wet soil and tolerates mineral-rich ground.",
  },
  "Saxaul Tree": {
    bands:   { temp: [15, 35], ph: [7.5, 9.0], tds: [800, 2500], moist: [8, 25] },
    weights: { temp: 0.2,      ph: 0.25,       tds: 0.35,        moist: 0.2 },
    cultural_note:
      "Saxaul is a halophyte that stitches the Aral and Betpaq deserts together; alkaline, saline, and dry soil is its homeland.",
  },
};

/* ==================================================================== */
/*  Viability Index — proximity-weighted composite                      */
/* ==================================================================== */

function bandScore(value: number, [lo, hi]: Band): number {
  if (value >= lo && value <= hi) return 100;
  const span = Math.max(hi - lo, 1);
  const dist = value < lo ? lo - value : value - hi;
  // Exponential decay past the band — falls to ~37 at one full span away.
  const decayed = 100 * Math.exp(-dist / span);
  return Math.max(0, Math.min(100, decayed));
}

function viabilityIndex(reading: Reading, profile: PlantProfile) {
  const w = profile.weights;
  const parts = {
    temp:  bandScore(reading.temp,  profile.bands.temp),
    ph:    bandScore(reading.ph,    profile.bands.ph),
    tds:   bandScore(reading.tds,   profile.bands.tds),
    moist: bandScore(reading.moist, profile.bands.moist),
  };
  const score =
    parts.temp  * w.temp  +
    parts.ph    * w.ph    +
    parts.tds   * w.tds   +
    parts.moist * w.moist;
  return { score: Math.round(score), parts };
}

/* ==================================================================== */
/*  Handler                                                             */
/* ==================================================================== */

function isReading(v: unknown): v is Reading {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.temp === "number" &&
    typeof o.ph === "number" &&
    typeof o.tds === "number" &&
    typeof o.moist === "number"
  );
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { reading, plant } = (body ?? {}) as {
    reading?: unknown;
    plant?: Plant;
  };
  if (!isReading(reading) || !plant?.name) {
    return NextResponse.json(
      { error: "Body must be { reading, plant:{name,latin,story} }" },
      { status: 400 },
    );
  }

  const profile = PROFILES[plant.name] ?? PROFILES["Almaty Aport Apple"];
  const { score, parts } = viabilityIndex(reading, profile);

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  // Offline / no-key path — deterministic verdict so the demo never stalls.
  if (!apiKey) {
    return NextResponse.json({
      score,
      verdict: offlineVerdict(reading, plant, profile, score),
      model: "offline-heuristic",
      parts,
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.65,
        // 2.5-flash burns part of the budget on hidden thinking tokens.
        maxOutputTokens: 1500,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(
      buildPrompt(reading, plant, profile, score, parts),
    );
    const text = result.response.text().trim();
    const parsed = safeParseJson(text);

    const finalScore =
      typeof parsed?.score === "number"
        ? Math.max(0, Math.min(100, Math.round(parsed.score)))
        : score;

    const verdict =
      typeof parsed?.verdict === "string" && parsed.verdict.trim().length > 0
        ? parsed.verdict.trim()
        : offlineVerdict(reading, plant, profile, finalScore);

    return NextResponse.json({
      score: finalScore,
      verdict,
      model: "gemini-2.5-flash",
      parts,
    });
  } catch (e) {
    return NextResponse.json({
      score,
      verdict: offlineVerdict(reading, plant, profile, score),
      model: "offline-heuristic",
      parts,
      warning: e instanceof Error ? e.message : "Gemini call failed",
    });
  }
}

/* ==================================================================== */
/*  Prompt                                                              */
/* ==================================================================== */

function buildPrompt(
  reading: Reading,
  plant: Plant,
  profile: PlantProfile,
  baseline: number,
  parts: Record<string, number>,
) {
  return [
    `SYSTEM:`,
    `You are the SoilPlus Cultural Heritage Agronomist — a Kazakh agronomist-historian`,
    `who reads soil chemistry as a living record of the land's cultural memory.`,
    `You care about both the biochemistry of the rhizosphere AND the survival of`,
    `plants that define Kazakh identity. You never speak in generalities; you cite`,
    `the number in front of you and tie it to a specific cultural consequence.`,
    ``,
    `PLANT UNDER CARE:`,
    `  • Name           : ${plant.name}`,
    `  • Latin          : ${plant.latin}`,
    `  • Cultural story : ${plant.story}`,
    `  • Agronomy note  : ${profile.cultural_note}`,
    ``,
    `LIVE SENSOR READING (ESP32 node, 200 ms broadcast):`,
    `  • Temperature : ${reading.temp} °C`,
    `  • pH          : ${reading.ph}`,
    `  • TDS         : ${reading.tds} ppm`,
    `  • Moisture    : ${reading.moist} %`,
    ``,
    `IDEAL BANDS FOR THIS PLANT:`,
    `  • Temp  : ${profile.bands.temp[0]}–${profile.bands.temp[1]} °C`,
    `  • pH    : ${profile.bands.ph[0]}–${profile.bands.ph[1]}`,
    `  • TDS   : ${profile.bands.tds[0]}–${profile.bands.tds[1]} ppm`,
    `  • Moist : ${profile.bands.moist[0]}–${profile.bands.moist[1]} %`,
    ``,
    `PER-METRIC BASELINE PROXIMITY (0–100):`,
    `  temp=${Math.round(parts.temp)}  ph=${Math.round(parts.ph)}  tds=${Math.round(parts.tds)}  moist=${Math.round(parts.moist)}`,
    `Weighted Viability Index baseline → ${baseline}.`,
    `You may adjust ±12 based on agronomic reasoning; never fabricate beyond that.`,
    ``,
    `TASK — Return ONLY a JSON object of this exact shape:`,
    `{`,
    `  "score":   <integer 0-100>,`,
    `  "verdict": "<exactly three sentences, no line breaks, no markdown>"`,
    `}`,
    ``,
    `WRITING RULES for "verdict":`,
    `  Sentence 1 — State the soil's chemical state plainly, citing the single most`,
    `               decisive number (e.g. "pH 5.4 is sharply acidic").`,
    `  Sentence 2 — Explain what that does to ${plant.name} — roots, uptake, bloom,`,
    `               or survival. Be specific to this plant, not generic.`,
    `  Sentence 3 — Connect it to Kazakh cultural heritage — a place, a history,`,
    `               a people, or a consequence if this plant is lost.`,
    ``,
    `STYLE: measured, literary, quietly urgent. First-person plural ("we") is welcome.`,
    `Never use emojis, markdown, bullet points, or English filler like "indeed" or`,
    `"in conclusion". Output JSON only.`,
  ].join("\n");
}

/* ==================================================================== */
/*  Helpers                                                             */
/* ==================================================================== */

function safeParseJson(text: string): { score?: number; verdict?: string } | null {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function offlineVerdict(
  reading: Reading,
  plant: Plant,
  profile: PlantProfile,
  score: number,
): string {
  const issues: string[] = [];
  if (reading.ph < profile.bands.ph[0]) issues.push("acidity");
  if (reading.ph > profile.bands.ph[1]) issues.push("alkalinity");
  if (reading.moist < profile.bands.moist[0]) issues.push("drought stress");
  if (reading.moist > profile.bands.moist[1]) issues.push("waterlogging");
  if (reading.tds > profile.bands.tds[1]) issues.push("salt accumulation");
  if (reading.tds < profile.bands.tds[0]) issues.push("nutrient scarcity");
  if (reading.temp > profile.bands.temp[1]) issues.push("heat stress");
  if (reading.temp < profile.bands.temp[0]) issues.push("cold stress");

  const state =
    score >= 70
      ? "in quiet balance"
      : score >= 40
        ? "under measurable stress"
        : "in critical condition";

  const issueText =
    issues.length > 0 ? ` The land is showing ${issues.join(", ")}.` : "";

  return [
    `The soil reads ${state} for ${plant.name}.${issueText}`,
    `Left uncorrected, these numbers work directly against the root architecture ${plant.name} has relied on for generations.`,
    `To protect this chemistry is to protect a piece of Kazakh memory — ${plant.name} is not a crop, it is a witness.`,
  ].join(" ");
}
