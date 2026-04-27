import { NextResponse } from "next/server";
import { computeIrrigation } from "@/lib/irrigation";
import { getCrop } from "@/lib/crops";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  cropId: string;
  reading: { temp: number; ph: number; tds: number; moist: number };
  /** Area units come from the UI; we normalise to m². */
  area: { value: number; unit: "m2" | "ha" | "sot" };
};

const AREA_TO_M2: Record<Body["area"]["unit"], number> = {
  m2:  1,
  ha:  10_000,
  sot: 100, // "сотка" — 100 m²
};

function isReading(v: unknown): v is Body["reading"] {
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
  let body: Partial<Body> = {};
  try {
    body = (await req.json()) as Partial<Body>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const crop = body.cropId ? getCrop(body.cropId) : undefined;
  if (!crop) {
    return NextResponse.json({ error: "Unknown cropId" }, { status: 400 });
  }
  if (!isReading(body.reading)) {
    return NextResponse.json({ error: "Bad reading payload" }, { status: 400 });
  }
  const area = body.area;
  if (!area || typeof area.value !== "number" || area.value <= 0 || !(area.unit in AREA_TO_M2)) {
    return NextResponse.json({ error: "Bad area payload" }, { status: 400 });
  }

  const areaM2 = area.value * AREA_TO_M2[area.unit];
  const result = computeIrrigation({
    crop,
    reading: body.reading,
    areaM2,
  });

  return NextResponse.json({
    crop: {
      id: crop.id,
      name: crop.name,
      wOptMin: crop.wOptMin,
      wOptMax: crop.wOptMax,
      phMin: crop.phMin,
      phMax: crop.phMax,
      ecMax: crop.ecMax,
      rootDepth: crop.rootDepth,
    },
    areaM2,
    ...result,
  });
}
