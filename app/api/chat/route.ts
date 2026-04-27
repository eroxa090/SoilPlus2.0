import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CROPS, getCrop, type Crop } from "@/lib/crops";
import { rateLimit } from "@/lib/rate-limit";

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

type Msg = { role: "user" | "assistant"; content: string };

type Body = {
  messages: Msg[];
  reading: Reading | null;
  cropId?: string;
  /** Optional plot area in m². */
  areaM2?: number;
};

/* ==================================================================== */
/*  Validators                                                          */
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

function isMsg(v: unknown): v is Msg {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    (o.role === "user" || o.role === "assistant") &&
    typeof o.content === "string"
  );
}

/* ==================================================================== */
/*  Soil diagnostics — deterministic, runs with or without Gemini       */
/* ==================================================================== */

function diagnose(reading: Reading, crop?: Crop) {
  const notes: string[] = [];
  const risks: string[] = [];
  const flags: { metric: string; state: "ok" | "low" | "high"; msg: string }[] = [];

  // pH
  if (crop) {
    if (reading.ph < crop.phMin) {
      flags.push({ metric: "pH", state: "low", msg: `pH ${reading.ph.toFixed(2)} below ${crop.phMin} — acidic for ${crop.name}.` });
      risks.push("Acidic soil limits phosphorus availability and can unlock aluminium toxicity.");
    } else if (reading.ph > crop.phMax) {
      flags.push({ metric: "pH", state: "high", msg: `pH ${reading.ph.toFixed(2)} above ${crop.phMax} — alkaline for ${crop.name}.` });
      risks.push("Alkaline soil immobilises iron, zinc and manganese — expect chlorosis.");
    } else {
      flags.push({ metric: "pH", state: "ok", msg: `pH ${reading.ph.toFixed(2)} is inside the optimum band ${crop.phMin}–${crop.phMax}.` });
    }
  }

  // Moisture
  if (crop) {
    if (reading.moist < crop.wOptMin) {
      const gap = crop.wOptMin - reading.moist;
      flags.push({ metric: "Moisture", state: "low", msg: `Moisture ${reading.moist}% is ${gap.toFixed(1)}pp below optimum.` });
      if (gap > 15) risks.push("Severe drought stress — turgor loss and stomatal closure imminent.");
      else if (gap > 5) risks.push("Growth slowing — irrigation is due within 24h.");
    } else if (reading.moist > crop.wOptMax) {
      flags.push({ metric: "Moisture", state: "high", msg: `Moisture ${reading.moist}% is above optimum — poor aeration.` });
      risks.push("Root suffocation and fungal-disease pressure rise in saturated soil.");
    } else {
      flags.push({ metric: "Moisture", state: "ok", msg: `Moisture ${reading.moist}% is within the optimum band.` });
    }
  }

  // TDS / salinity
  if (crop) {
    if (reading.tds > crop.ecMax) {
      flags.push({ metric: "TDS", state: "high", msg: `Salinity ${reading.tds} ppm exceeds ${crop.ecMax} ppm ceiling.` });
      risks.push("Osmotic stress reduces water uptake — yield loss accelerates at these salinity levels.");
    } else if (reading.tds < 150) {
      flags.push({ metric: "TDS", state: "low", msg: `TDS ${reading.tds} ppm is low — nutrient-poor leaching soil.` });
      notes.push("Consider an NPK top-dressing; ions are scarce.");
    } else {
      flags.push({ metric: "TDS", state: "ok", msg: `TDS ${reading.tds} ppm is within a workable range.` });
    }
  }

  // Temperature
  if (crop) {
    if (reading.temp < crop.tOptMin) {
      flags.push({ metric: "Temp", state: "low", msg: `Soil ${reading.temp.toFixed(1)} °C is cool for ${crop.name}.` });
      risks.push("Cold soil slows microbial nitrogen cycling and root elongation.");
    } else if (reading.temp > crop.tOptMax) {
      flags.push({ metric: "Temp", state: "high", msg: `Soil ${reading.temp.toFixed(1)} °C is warm for ${crop.name}.` });
      risks.push("Hot soil accelerates evapotranspiration and shortens the grain-fill window.");
    } else {
      flags.push({ metric: "Temp", state: "ok", msg: `Soil ${reading.temp.toFixed(1)} °C is inside the optimum band.` });
    }
  }

  // Which crops would thrive in this soil right now?
  const suitable = CROPS
    .map((c) => {
      let score = 100;
      if (reading.ph < c.phMin || reading.ph > c.phMax) score -= 25;
      if (reading.moist < c.wOptMin || reading.moist > c.wOptMax) score -= 25;
      if (reading.tds > c.ecMax) score -= 25;
      if (reading.temp < c.tOptMin || reading.temp > c.tOptMax) score -= 15;
      return { crop: c, score: Math.max(score, 0) };
    })
    .sort((a, b) => b.score - a.score);

  return { flags, risks, notes, suitable };
}

/* ==================================================================== */
/*  Handler                                                             */
/* ==================================================================== */

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`chat:${ip}`, { max: 30, windowMs: 60_000 })) {
    return NextResponse.json(
      { error: "Too many chat requests. Try again in a minute." },
      { status: 429 },
    );
  }

  let body: Partial<Body> = {};
  try {
    body = (await req.json()) as Partial<Body>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = Array.isArray(body.messages)
    ? body.messages
        .filter(isMsg)
        // Cap each message at 2 KB and keep only the last 20 turns to bound token use.
        .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))
        .slice(-20)
    : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "messages[] is required" }, { status: 400 });
  }

  const reading = isReading(body.reading) ? body.reading : null;
  const crop = body.cropId ? getCrop(body.cropId) : undefined;
  const diag = reading ? diagnose(reading, crop) : null;

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  // Offline path — still useful: hand-crafted response built from diagnostics.
  if (!apiKey) {
    return NextResponse.json({
      reply: offlineReply(messages[messages.length - 1].content, reading, crop, diag, body.areaM2),
      model: "offline-heuristic",
      diagnostics: diag,
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.55, maxOutputTokens: 2000 },
      systemInstruction: systemPrompt(reading, crop, diag, body.areaM2),
    });

    // Convert our messages[] into Gemini chat history (minus the last user msg).
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const chat = model.startChat({ history });
    const last = messages[messages.length - 1];
    const result = await chat.sendMessage(last.content);
    const text = result.response.text().trim();

    return NextResponse.json({
      reply: text || offlineReply(last.content, reading, crop, diag, body.areaM2),
      model: "gemini-2.5-flash",
      diagnostics: diag,
    });
  } catch (e) {
    return NextResponse.json({
      reply: offlineReply(messages[messages.length - 1].content, reading, crop, diag, body.areaM2),
      model: "offline-heuristic",
      diagnostics: diag,
      warning: e instanceof Error ? e.message : "Gemini call failed",
    });
  }
}

/* ==================================================================== */
/*  Prompt builder                                                      */
/* ==================================================================== */

function systemPrompt(
  reading: Reading | null,
  crop: Crop | undefined,
  diag: ReturnType<typeof diagnose> | null,
  areaM2: number | undefined,
): string {
  const lines: string[] = [
    `You are the SoilPlus Agronomist — a senior Kazakh agronomist advising a farmer in Uralsk.`,
    `You read live ESP32 soil telemetry and translate it into concrete, numeric, actionable guidance.`,
    `You never speak in generalities. Every claim cites a specific number, band, or coefficient.`,
    ``,
    `RESPONSE STYLE:`,
    `  • Short paragraphs (2–4 sentences each), no markdown headings.`,
    `  • If the user writes in Russian, reply in Russian; if English, reply in English.`,
    `  • Use bullet points only when listing 3+ discrete items (e.g. crop options).`,
    `  • Lead with the diagnosis, follow with the remediation, close with the risk if ignored.`,
    `  • Never invent numbers. If a value is not in the context, say you don't have it.`,
    ``,
  ];

  if (reading) {
    lines.push(
      `LIVE SOIL READING (ESP32, 200 ms broadcast):`,
      `  temp=${reading.temp.toFixed(1)} °C · pH=${reading.ph.toFixed(2)} · TDS=${reading.tds} ppm · moisture=${reading.moist}%`,
    );
  } else {
    lines.push(
      `LIVE SOIL READING: unavailable — no ESP32 connected. If the user asks for numeric advice,`,
      `tell them to connect the probe at /connect first.`,
    );
  }

  if (areaM2 && areaM2 > 0) {
    lines.push(`PLOT AREA: ${areaM2} m² (${(areaM2 / 10000).toFixed(3)} ha).`);
  }

  if (crop) {
    lines.push(
      ``,
      `SELECTED CROP: ${crop.name} (${crop.nameRu}).`,
      `  optimum pH ${crop.phMin}–${crop.phMax}, moisture ${crop.wOptMin}–${crop.wOptMax}%,`,
      `  EC ceiling ${crop.ecMax} ppm, soil temp ${crop.tOptMin}–${crop.tOptMax} °C, root depth ${crop.rootDepth} m.`,
      `  note: ${crop.note}`,
    );
  }

  if (diag) {
    lines.push(``, `DIAGNOSTIC FLAGS:`);
    for (const f of diag.flags) {
      lines.push(`  • [${f.state.toUpperCase()}] ${f.metric}: ${f.msg}`);
    }
    if (diag.risks.length) {
      lines.push(``, `RISK SIGNALS:`);
      for (const r of diag.risks) lines.push(`  • ${r}`);
    }
    const top3 = diag.suitable.slice(0, 3).map((s) => `${s.crop.name} (${s.score}/100)`);
    lines.push(``, `TOP SUITABILITY FOR CURRENT SOIL: ${top3.join(", ")}.`);
  }

  lines.push(
    ``,
    `IRRIGATION FORMULA (if asked for water volume):`,
    `  V (litres) = ΔW × D × ρ × S × K_pH × K_EC`,
    `  ΔW = max(optMid/100 − moist/100, 0); ρ = 1400 kg/m³; K_pH = 0.85 if pH out of band;`,
    `  K_EC = 1.3 if TDS > ceiling (flushing). Always cite the result in litres and litres/ha.`,
    ``,
    `CULTURAL CONTEXT: SoilPlus is a Kazakh agri-tech platform from Uralsk. When a heritage crop is chosen`,
    `(Almaty Aport, Greig's Tulip, Saxaul) — connect your advice to the Kazakh landscape it belongs to.`,
  );

  return lines.join("\n");
}

/* ==================================================================== */
/*  Offline fallback                                                    */
/* ==================================================================== */

function offlineReply(
  userMsg: string,
  reading: Reading | null,
  crop: Crop | undefined,
  diag: ReturnType<typeof diagnose> | null,
  areaM2: number | undefined,
): string {
  if (!reading) {
    return [
      "I don't see a live reading from the ESP32 yet. Open the Connect page, paste the probe's IP address,",
      "and once the dashboard lights up I'll be able to talk numbers — pH, moisture, salinity, temperature.",
    ].join(" ");
  }

  const parts: string[] = [];
  parts.push(
    `Live soil: ${reading.temp.toFixed(1)} °C · pH ${reading.ph.toFixed(2)} · ${reading.tds} ppm TDS · ${reading.moist}% moisture.`,
  );

  if (crop && diag) {
    const bad = diag.flags.filter((f) => f.state !== "ok");
    if (bad.length === 0) {
      parts.push(`All four metrics are inside the optimum band for ${crop.name}. Hold your current regime and re-check in 24 h.`);
    } else {
      parts.push(`For ${crop.name}, the soil has ${bad.length} flag${bad.length > 1 ? "s" : ""}: ${bad.map((f) => f.msg).join(" ")}`);
    }
    if (diag.risks.length) parts.push(`Risk: ${diag.risks[0]}`);
  } else if (diag) {
    const top3 = diag.suitable.slice(0, 3).map((s) => `${s.crop.name} (${s.score}/100)`);
    parts.push(`With no crop selected, the best fits for this soil right now are: ${top3.join(", ")}.`);
  }

  if (areaM2 && crop && diag) {
    parts.push(`On ${areaM2} m² you can use the Irrigation calculator for the exact litres — it applies K_pH and K_EC to this reading.`);
  }

  // Tiny keyword hooks for common questions.
  const q = userMsg.toLowerCase();
  if (/(посад|plant|grow|what can i)/.test(q)) {
    const top5 = diag?.suitable.slice(0, 5).map((s) => `• ${s.crop.name} — ${s.score}/100`).join("\n");
    if (top5) parts.push(`Top crops for this soil:\n${top5}`);
  }
  if (/(вод|water|irrig|полив|litre|liter|литр)/.test(q) && crop) {
    parts.push(`Water math uses V = ΔW × D × ρ × S × K_pH × K_EC. For a precise litre figure, set the area on the Irrigation page.`);
  }

  return parts.join("\n\n");
}
