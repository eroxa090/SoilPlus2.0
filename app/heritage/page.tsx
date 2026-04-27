"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Apple,
  CheckCircle2,
  Flower2,
  Loader2,
  Mountain,
  Sparkles,
  TreeDeciduous,
  WifiOff,
} from "lucide-react";
import { useSensor } from "@/components/SensorProvider";

type Plant = {
  id: "aport" | "tulip" | "saxaul";
  name: string;
  latin: string;
  nameRu: string;
  icon: typeof Apple;
  story: string;
  place: string;
  bands: {
    temp: [number, number];
    ph: [number, number];
    tds: [number, number];
    moist: [number, number];
  };
};

const PLANTS: Plant[] = [
  {
    id: "aport",
    name: "Almaty Aport Apple",
    latin: "Malus domestica 'Aport'",
    nameRu: "Алматинский Апорт",
    icon: Apple,
    story:
      "The mother apple of Central Asia — the variety that made Alma-Ata mean \"father of apples\" before the Soviet era nearly wiped its orchards out.",
    place: "Trans-Ili Alatau foothills, 900–1400 m",
    bands: { temp: [12, 22], ph: [6.0, 7.0], tds: [300, 900], moist: [40, 65] },
  },
  {
    id: "tulip",
    name: "Greig's Tulip",
    latin: "Tulipa greigii",
    nameRu: "Тюльпан Грейга",
    icon: Flower2,
    story:
      "A wild tulip of limestone steppe — the progenitor of every garden tulip on earth, and a symbol of southern Kazakhstan's spring.",
    place: "Karatau & Boroldai ridges, Turkistan region",
    bands: { temp: [8, 18], ph: [6.5, 7.5], tds: [150, 600], moist: [25, 45] },
  },
  {
    id: "saxaul",
    name: "Saxaul Tree",
    latin: "Haloxylon aphyllum",
    nameRu: "Саксаул",
    icon: TreeDeciduous,
    story:
      "The halophyte that stitches the Aral and Betpaq-Dala deserts together. Without it the steppe breathes sand; with it, the soil holds.",
    place: "Aral-Caspian lowland and Betpaq-Dala desert",
    bands: { temp: [15, 35], ph: [7.5, 9.0], tds: [800, 2500], moist: [8, 25] },
  },
];

const FALLBACK = { temp: 18, ph: 6.6, tds: 480, moist: 42 };

type AnalysisResult = {
  score: number;
  verdict: string;
  model: string;
  parts: { temp: number; ph: number; tds: number; moist: number };
};

export default function HeritagePage() {
  const { latest, status } = useSensor();
  const reading = latest ?? FALLBACK;

  const [selected, setSelected] = useState<Plant>(PLANTS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const quick = useMemo(() => quickScore(reading, selected), [reading, selected]);

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reading,
          plant: {
            id: selected.id,
            name: selected.name,
            latin: selected.latin,
            story: selected.story,
          },
        }),
      });
      const json = (await res.json()) as AnalysisResult & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Analysis failed");
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1280px] px-5 pb-24 pt-10 sm:px-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="label-eyebrow">Cultural Heritage</span>
          <h1 className="mt-2 font-display text-4xl tracking-tightx text-ink-900 sm:text-5xl">
            Can this soil hold a memory?
          </h1>
          <p className="mt-3 max-w-xl text-ink-500">
            Score your plot against three plants that define the Kazakh
            landscape. The AI reads your live chemistry and answers in three
            sentences — diagnosis, consequence, and cultural stake.
          </p>
        </div>
        <span
          className={`chip ${
            status === "connected" ? "chip-leaf" : "chip-ghost"
          }`}
        >
          {status === "connected" ? (
            <>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-leaf-500/70" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-leaf-500" />
              </span>
              Live stream
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" /> Demo soil
            </>
          )}
        </span>
      </div>

      {/* Plant selector */}
      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANTS.map((p) => {
          const active = selected.id === p.id;
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => {
                setSelected(p);
                setResult(null);
              }}
              className={`card text-left transition ${
                active
                  ? "ring-2 ring-leaf-500"
                  : "card-hover"
              } p-5`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`grid h-10 w-10 place-items-center rounded-xl ${
                    active ? "bg-leaf-600 text-white" : "bg-leaf-50 text-leaf-700"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="font-display text-base font-semibold text-ink-900">
                    {p.name}
                  </p>
                  <p className="text-[11px] text-ink-400">
                    {p.nameRu} · <em>{p.latin}</em>
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-ink-500">{p.story}</p>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-400">
                <Mountain className="h-3 w-3" /> {p.place}
              </p>
            </button>
          );
        })}
      </div>

      {/* Analysis */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_1fr]">
        {/* Left: bands vs reading */}
        <div className="card p-7 sm:p-8">
          <p className="label-eyebrow">Proximity to ideal bands</p>
          <div className="mt-4 space-y-4">
            <BandRow
              label="Temperature"
              unit="°C"
              value={reading.temp}
              band={selected.bands.temp}
              score={quick.parts.temp}
            />
            <BandRow
              label="pH"
              unit=""
              value={reading.ph}
              band={selected.bands.ph}
              score={quick.parts.ph}
            />
            <BandRow
              label="TDS"
              unit=" ppm"
              value={reading.tds}
              band={selected.bands.tds}
              score={quick.parts.tds}
            />
            <BandRow
              label="Moisture"
              unit="%"
              value={reading.moist}
              band={selected.bands.moist}
              score={quick.parts.moist}
            />
          </div>

          <hr className="my-6 border-ink-100" />

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="label-eyebrow">Baseline viability</p>
              <p className="mt-1 font-display text-3xl font-semibold text-ink-900">
                {quick.score}
                <span className="ml-1 text-base font-normal text-ink-400">/ 100</span>
              </p>
              <p className="mt-1 text-xs text-ink-500">
                Weighted proximity across all four metrics.
              </p>
            </div>
            <button
              onClick={analyze}
              disabled={loading}
              className="btn btn-primary disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Analysing…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Run AI analysis
                </>
              )}
            </button>
          </div>

          {error && (
            <p className="mt-3 flex items-center gap-2 text-sm text-rose-600">
              <AlertCircle className="h-4 w-4" /> {error}
            </p>
          )}
        </div>

        {/* Right: verdict */}
        <div className="card overflow-hidden p-0">
          <div className="border-b border-ink-100 bg-paper-alt px-5 py-3">
            <span className="label-eyebrow">AI verdict</span>
          </div>
          <div className="p-7 sm:p-8">
            {result ? (
              <>
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-5xl font-semibold text-ink-900 tabular-nums">
                    {result.score}
                  </span>
                  <span className="text-sm text-ink-400">
                    / 100 · {result.model}
                  </span>
                </div>
                <p className="mt-4 text-base leading-relaxed text-ink-700">
                  {result.verdict}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link href="/chat" className="btn btn-ghost">
                    Ask the agronomist for next steps
                  </Link>
                  <Link href="/irrigation" className="btn btn-ghost">
                    Irrigation plan
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-start gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-leaf-50 text-leaf-700">
                  <Sparkles className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <p className="font-display text-lg text-ink-900">
                  Ready when you are.
                </p>
                <p className="text-sm text-ink-500">
                  Gemini 1.5 Flash will compare today&apos;s {reading.temp.toFixed(1)}
                  °C / pH {reading.ph.toFixed(2)} / {reading.tds} ppm / {reading.moist}
                  % against the cultural profile of {selected.name}, adjust within ±12
                  points, and return a three-sentence verdict — diagnosis, biological
                  consequence, cultural stake.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/* =============================================================== */
/*  Quick local score — same shape as the API's, minus the LLM     */
/* =============================================================== */

function bandScore(value: number, [lo, hi]: [number, number]): number {
  if (value >= lo && value <= hi) return 100;
  const span = Math.max(hi - lo, 1);
  const dist = value < lo ? lo - value : value - hi;
  return Math.max(0, Math.min(100, 100 * Math.exp(-dist / span)));
}

function quickScore(
  reading: { temp: number; ph: number; tds: number; moist: number },
  plant: Plant,
) {
  const parts = {
    temp: bandScore(reading.temp, plant.bands.temp),
    ph: bandScore(reading.ph, plant.bands.ph),
    tds: bandScore(reading.tds, plant.bands.tds),
    moist: bandScore(reading.moist, plant.bands.moist),
  };
  // Even-weighted summary — the API uses plant-specific weights.
  const score = Math.round((parts.temp + parts.ph + parts.tds + parts.moist) / 4);
  return { score, parts };
}

/* =============================================================== */

function BandRow({
  label,
  unit,
  value,
  band,
  score,
}: {
  label: string;
  unit: string;
  value: number;
  band: [number, number];
  score: number;
}) {
  const ok = value >= band[0] && value <= band[1];
  // Visual range: pad 30% each side of the band for layout.
  const span = band[1] - band[0] || 1;
  const min = band[0] - span * 0.6;
  const max = band[1] + span * 0.6;
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const bandLeft = ((band[0] - min) / (max - min)) * 100;
  const bandWidth = ((band[1] - band[0]) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-ink-700">
          {ok ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-leaf-600" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
          )}
          {label}
        </span>
        <span className="font-mono text-xs text-ink-500">
          {value.toFixed(label === "pH" ? 2 : label === "TDS" ? 0 : 1)}
          {unit} · ideal {band[0]}–{band[1]}
          {unit} · {Math.round(score)}/100
        </span>
      </div>
      <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
        <div
          className="absolute inset-y-0 bg-leaf-100"
          style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
        />
        <div
          className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white ${
            ok ? "bg-leaf-600" : "bg-amber-500"
          }`}
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}
