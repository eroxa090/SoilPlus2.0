import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  /** base64-encoded image, with or without data-URI prefix */
  imageBase64: string;
  mimeType: string;
  /** optional hint (crop, symptoms, region) */
  note?: string;
};

type Diagnosis = {
  isPlant: boolean;
  plantSpecies?: string;
  plantLatin?: string;
  disease: string;
  latin?: string;
  confidence: number;   // 0..100
  severity: "none" | "mild" | "moderate" | "severe";
  symptoms: string[];
  causes: string[];
  treatment: string[];
  prevention: string[];
  urgency: "watch" | "act_soon" | "act_now";
  notes?: string;
};

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`diagnose:${ip}`, { max: 15, windowMs: 60_000 })) {
    return NextResponse.json(
      { error: "Too many diagnose requests. Try again in a minute." },
      { status: 429 },
    );
  }

  let body: Partial<Body>;
  try {
    body = (await req.json()) as Partial<Body>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let { imageBase64, mimeType, note } = body;
  if (!imageBase64 || !mimeType) {
    return NextResponse.json(
      { error: "imageBase64 and mimeType are required" },
      { status: 400 },
    );
  }
  // Strip data URI prefix if present
  imageBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");

  // 8 MB cap — a plain base64 string of ~11 MB decodes to ~8 MB
  if (imageBase64.length > 11_000_000) {
    return NextResponse.json(
      { error: "Image is too large. Please compress to < 8 MB." },
      { status: 413 },
    );
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        diagnosis: offlineDiagnosis(note),
        model: "offline-heuristic",
        warning: "No GOOGLE_GENERATIVE_AI_API_KEY configured.",
      },
      { status: 200 },
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Vision-capable model. Free tier on AI Studio currently grants quota
    // only for gemini-2.5-flash, so we use it across all routes.
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.25,
        // 2.5-flash is a thinking model — part of the budget is spent on
        // hidden reasoning, so we give it generous room for JSON + thoughts.
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    });

    const prompt = [
      `You are the SoilPlus Plant Pathologist — a senior agronomist trained on`,
      `the IPM Handbook, CABI Crop Protection Compendium, EPPO bulletins and`,
      `Central Asian field reports. You identify the SPECIES of the plant and`,
      `then any disease, pest, or nutrient deficiency from leaf / fruit / stem`,
      `photos. You are decisive — farmers need a clear answer, not hedging.`,
      ``,
      `INPUT: a single photo${note ? `. USER NOTE: "${note}"` : "."}`,
      ``,
      `WORKFLOW:`,
      `  1. FIRST identify the plant species (common name + Latin binomial).`,
      `  2. THEN inspect the visible tissue: leaves (upper/under), stem, fruit, soil line.`,
      `  3. List EVERY abnormality you see (chlorosis, necrosis, mosaic, lesions,`,
      `     mildew, rust pustules, leaf-miner trails, aphids, mites, deformities).`,
      `  4. Match the pattern to the most likely disease/pest/deficiency.`,
      `  5. Give the farmer a step-by-step treatment plan they can start today.`,
      ``,
      `Return ONLY a JSON object of this exact shape:`,
      `{`,
      `  "isPlant": <bool>,`,
      `  "plantSpecies": "<common name of the plant, e.g. 'Tomato', 'Помидор', 'Wheat'>",`,
      `  "plantLatin": "<Latin binomial, e.g. 'Solanum lycopersicum'>",`,
      `  "disease": "<short clear name of the primary issue, e.g. 'Late blight', 'Фитофтороз'>",`,
      `  "latin": "<pathogen Latin name, e.g. 'Phytophthora infestans'>",`,
      `  "confidence": <int 0-100, your confidence in the disease ID>,`,
      `  "severity": "none" | "mild" | "moderate" | "severe",`,
      `  "symptoms": ["<specific observation #1 with location, e.g. 'concentric brown lesions on lower leaves'>", "<#2>", "<#3>"],`,
      `  "causes": ["<biological cause>", "<environmental trigger>", "<management gap>"],`,
      `  "treatment": ["<step 1 — what to do TODAY>", "<step 2 — within 3 days>", "<step 3 — within a week>", "<chemical option if severe, with active ingredient + dose>"],`,
      `  "prevention": ["<crop rotation / sanitation>", "<resistant variety>", "<irrigation practice>", "<scouting cadence>"],`,
      `  "urgency": "watch" | "act_soon" | "act_now",`,
      `  "notes": "<1-2 sentences of extra context, mention if lab confirmation is advisable>"`,
      `}`,
      ``,
      `RULES:`,
      `  • If image is NOT a plant, set isPlant=false, plantSpecies="not a plant", and disease="not a plant".`,
      `  • If the plant is healthy, set disease="Healthy", severity="none", urgency="watch", and still fill plantSpecies + plantLatin.`,
      `  • Be SPECIFIC, not generic. "Yellowing leaves" is bad. "Interveinal chlorosis on young leaves indicating Fe deficiency" is good.`,
      `  • At least 3 symptoms, 3 causes, 4 treatment steps, 3 prevention steps when there is a disease.`,
      `  • Treatment steps must include concrete numbers (dose, frequency, ml/L, days) where possible.`,
      `  • If user wrote in Russian/Kazakh, respond in that language in ALL string fields (but keep Latin names in Latin).`,
      `  • Prefer organic + low-cost interventions first; list chemical only with active ingredient name and dose if severe.`,
      `  • Never refuse to answer — if uncertain, give your best hypothesis and lower the confidence score.`,
    ].join("\n");

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType, data: imageBase64 } },
    ]);

    const text = result.response.text().trim();
    const parsed = safeParseJson(text);
    if (!parsed) {
      console.error("[diagnose] unparseable model response:", text.slice(0, 500));
      return NextResponse.json({
        diagnosis: offlineDiagnosis(
          note,
          "Модель не вернула корректный JSON — попробуйте ещё раз с более чётким фото.",
        ),
        model: "offline-heuristic",
        warning: "Model returned unparseable response.",
      });
    }

    return NextResponse.json({
      diagnosis: normaliseDiagnosis(parsed),
      model: "gemini-2.5-flash",
    });
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Vision call failed";
    console.error("[diagnose] vision call error:", raw);
    const friendly = friendlyGeminiError(raw);
    return NextResponse.json({
      diagnosis: offlineDiagnosis(note, friendly),
      model: "offline-heuristic",
      warning: friendly,
    });
  }
}

function friendlyGeminiError(raw: string): string {
  // Quota / billing / 429
  if (/429|quota|rate ?limit|exceeded/i.test(raw)) {
    if (/limit:\s*0/i.test(raw)) {
      return "Ваш Gemini API-ключ не имеет квоты на эту модель. Получите бесплатный ключ на https://aistudio.google.com/apikey (он должен начинаться с AIzaSy...) и обновите .env.local.";
    }
    const retryMatch = raw.match(/retry in (\d+)/i);
    const retry = retryMatch ? ` Повторите через ${retryMatch[1]} с.` : "";
    return `Лимит запросов Gemini исчерпан.${retry}`;
  }
  // 401 / 403 / API key
  if (/401|403|api[_ ]?key|permission|unauthor/i.test(raw)) {
    return "Gemini API-ключ невалиден или у проекта не включён Generative Language API.";
  }
  // 5xx
  if (/5\d\d|server error|internal/i.test(raw)) {
    return "Сервер Gemini временно недоступен — попробуйте через минуту.";
  }
  // Network
  if (/fetch|network|timeout|ECONN/i.test(raw)) {
    return "Не удалось связаться с Gemini API — проверьте интернет.";
  }
  // Fallback: truncate so UI does not blow up
  return raw.length > 200 ? raw.slice(0, 200) + "…" : raw;
}

/* ---------- helpers ---------- */

function safeParseJson(text: string): unknown {
  // 1. Strip ```json ... ``` or ``` ... ``` fences if the model wrapped them.
  const cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // 2. Greedy match the outermost {...} block.
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      // 3. Try to recover from a truncated JSON by closing trailing brackets.
      const opens = (match[0].match(/\{/g) ?? []).length;
      const closes = (match[0].match(/\}/g) ?? []).length;
      const arrOpens = (match[0].match(/\[/g) ?? []).length;
      const arrCloses = (match[0].match(/\]/g) ?? []).length;
      const repaired =
        match[0].replace(/,\s*$/, "") +
        "]".repeat(Math.max(0, arrOpens - arrCloses)) +
        "}".repeat(Math.max(0, opens - closes));
      try {
        return JSON.parse(repaired);
      } catch {
        return null;
      }
    }
  }
}

function normaliseDiagnosis(raw: unknown): Diagnosis {
  const o = (raw ?? {}) as Record<string, unknown>;
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  const str = (v: unknown, f = ""): string =>
    typeof v === "string" ? v : f;
  const num = (v: unknown, f: number): number =>
    typeof v === "number" && Number.isFinite(v) ? v : f;
  const severity = (v: unknown): Diagnosis["severity"] =>
    v === "mild" || v === "moderate" || v === "severe" || v === "none"
      ? v
      : "moderate";
  const urgency = (v: unknown): Diagnosis["urgency"] =>
    v === "watch" || v === "act_soon" || v === "act_now" ? v : "act_soon";

  return {
    isPlant: typeof o.isPlant === "boolean" ? o.isPlant : true,
    plantSpecies:
      typeof o.plantSpecies === "string" ? o.plantSpecies : undefined,
    plantLatin: typeof o.plantLatin === "string" ? o.plantLatin : undefined,
    disease: str(o.disease, "Unknown issue"),
    latin: typeof o.latin === "string" ? o.latin : undefined,
    confidence: Math.max(0, Math.min(100, Math.round(num(o.confidence, 50)))),
    severity: severity(o.severity),
    symptoms: arr(o.symptoms),
    causes: arr(o.causes),
    treatment: arr(o.treatment),
    prevention: arr(o.prevention),
    urgency: urgency(o.urgency),
    notes: typeof o.notes === "string" ? o.notes : undefined,
  };
}

function offlineDiagnosis(note?: string, reason?: string): Diagnosis {
  const hasKey = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  const cause = !hasKey
    ? "На сервере не настроен GOOGLE_GENERATIVE_AI_API_KEY."
    : reason ?? "AI-сервис временно недоступен.";
  return {
    isPlant: true,
    disease: "Анализ временно недоступен",
    confidence: 0,
    severity: "mild",
    symptoms: ["Не удалось распознать фото в этот раз."],
    causes: [cause],
    treatment: [
      "Попробуйте ещё раз через минуту — лимит запросов мог сработать.",
      "Сделайте фото крупным планом, при дневном свете, без бликов.",
      "Если ошибка повторяется — напишите нам через AI-агронома.",
    ],
    prevention: [
      "Севооборот по сезонам, не сажайте паслёновые после паслёновых.",
      "Держите листья сухими — поливайте под корень утром.",
      "Раз в неделю осматривайте нижние листья на пятна и налёт.",
    ],
    urgency: "watch",
    notes: note,
  };
}
