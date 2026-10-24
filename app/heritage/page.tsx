"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Apple, CheckCircle2, Flower2, Loader2, Mountain, Sparkles, TreeDeciduous, WifiOff } from "lucide-react";
import { useSensor } from "@/components/SensorProvider";
import { useLang } from "@/components/LanguageProvider";
import PageHeader from "@/components/PageHeader";
import OrnamentBand from "@/components/OrnamentBand";
import { CountUp, Reveal, StaggerItem, StaggerList } from "@/components/motion/Motion";
import { HERITAGE } from "@/lib/i18n/pages/heritage";

type PlantId = "aport" | "tulip" | "saxaul";

type Plant = {
  id: PlantId;
  /** English name — the analyze API keys its plant profiles by it. */
  name: string;
  latin: string;
  icon: typeof Apple;
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
    icon: Apple,
    bands: { temp: [12, 22], ph: [6.0, 7.0], tds: [300, 900], moist: [40, 65] },
  },
  {
    id: "tulip",
    name: "Greig's Tulip",
    latin: "Tulipa greigii",
    icon: Flower2,
    bands: { temp: [8, 18], ph: [6.5, 7.5], tds: [150, 600], moist: [25, 45] },
  },
  {
    id: "saxaul",
    name: "Saxaul Tree",
    latin: "Haloxylon aphyllum",
    icon: TreeDeciduous,
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
  const { lang, t: tc } = useLang();
  const t = HERITAGE[lang];
  const reading = latest ?? FALLBACK;

  const [selected, setSelected] = useState<Plant>(PLANTS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const quick = useMemo(() => quickScore(reading, selected), [reading, selected]);
  const sel = t.plants[selected.id];

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
            nameRu: HERITAGE.ru.plants[selected.id].name,
            latin: selected.latin,
            story: sel.story,
          },
          lang,
        }),
      });
      const json = (await res.json()) as AnalysisResult & { error?: string };
      if (!res.ok) throw new Error(json.error ?? t.failed);
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.failed);
    } finally {
      setLoading(false);
    }
  }

  const live = status === "connected";

  return (
    <main className="mx-auto max-w-[1280px] px-5 pb-24 pt-10 sm:px-8">
      <PageHeader
        home={tc.common.home}
        crumb={t.crumb}
        eyebrow={t.eyebrow}
        title={t.title}
        lead={t.lead}
        aside={
          <span className={`chip ${live ? "chip-leaf" : "chip-ghost"}`}>
            {live ? (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-leaf-500/70" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-leaf-500" />
                </span>
                {t.live}
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" /> {t.demo}
              </>
            )}
          </span>
        }
      />

      <OrnamentBand className="mt-8 text-amber-600/70" height={32} />

      {/* Plant selector — three heritage specimens */}
      <StaggerList className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        {PLANTS.map((p, i) => {
          const active = selected.id === p.id;
          const Icon = p.icon;
          const pt = t.plants[p.id];
          return (
            <StaggerItem key={p.id}>
              <button
                onClick={() => {
                  setSelected(p);
                  setResult(null);
                }}
                aria-pressed={active}
                className={`relative flex h-full w-full flex-col overflow-hidden rounded-md border-2 bg-white text-left transition-all duration-300 ${
                  active
                    ? "-translate-y-1 border-ink-900 shadow-soft"
                    : "border-ink-900/15 shadow-card hover:-translate-y-0.5 hover:border-ink-900/40"
                }`}
              >
                <span
                  className={`flex items-center justify-between px-4 py-2 font-mono text-[11px] transition-colors ${
                    active ? "bg-stamp-500 text-paper" : "bg-leaf-700 text-leaf-100"
                  }`}
                >
                  <span>№ 0{i + 1}</span>
                  <em className="not-italic">{p.latin}</em>
                </span>
                <span className="flex flex-1 flex-col p-5">
                  <span className="flex items-center gap-3">
                    <span
                      className={`grid h-11 w-11 place-items-center rounded-full border-2 transition-colors ${
                        active ? "border-stamp-500 text-stamp-500" : "border-ink-900/20 text-leaf-700"
                      }`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <span className="font-display text-xl uppercase leading-tight text-ink-900">{pt.name}</span>
                  </span>
                  <span className="mt-4 block text-sm leading-relaxed text-ink-500">{pt.story}</span>
                  <span className="mt-auto flex items-center gap-1.5 pt-4 font-mono text-[11px] text-ink-400">
                    <Mountain className="h-3 w-3" /> {pt.place}
                  </span>
                </span>
              </button>
            </StaggerItem>
          );
        })}
      </StaggerList>

      {/* Analysis */}
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Left: bands vs reading */}
        <Reveal className="card p-7 sm:p-8">
          <p className="label-eyebrow">{t.proximity}</p>
          <div className="mt-5 space-y-5">
            {(["temp", "ph", "tds", "moist"] as const).map((k) => (
              <BandRow
                key={k}
                label={t.metrics[k]}
                ideal={t.ideal}
                unit={k === "temp" ? "°C" : k === "tds" ? " ppm" : k === "moist" ? "%" : ""}
                digits={k === "ph" ? 2 : k === "tds" ? 0 : 1}
                value={reading[k]}
                band={selected.bands[k]}
                score={quick.parts[k]}
              />
            ))}
          </div>

          <div className="my-7 border-t-2 border-dashed border-ink-900/15" />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="label-eyebrow">{t.baseline}</p>
              <p className="mt-2 font-display text-5xl font-semibold text-ink-900">
                {quick.score}
                <span className="ml-1 text-lg font-normal text-ink-400">/ 100</span>
              </p>
              <p className="mt-1 text-xs text-ink-500">{t.baselineHint}</p>
            </div>
            <button onClick={analyze} disabled={loading} className="btn btn-stamp px-5 py-3 disabled:opacity-50">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {t.analysing}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" strokeWidth={2.5} /> {t.run}
                </>
              )}
            </button>
          </div>

          {error && (
            <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-stamp-600">
              <AlertCircle className="h-4 w-4" /> {error}
            </p>
          )}
        </Reveal>

        {/* Right: verdict — a parchment certificate */}
        <Reveal delay={0.1} className="stitch flex flex-col overflow-hidden rounded-md bg-[#F6E9C8] shadow-soft">
          <div className="bg-ink-900 px-6 py-3">
            <span className="font-display text-sm uppercase tracking-[0.18em] text-amber-100">{t.verdict}</span>
          </div>
          <div className="flex-1 p-7 sm:p-8">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex items-center gap-4">
                    <span className="stamp h-24 w-24 -rotate-6 text-4xl">
                      <CountUp value={String(result.score)} />
                    </span>
                    <span className="font-mono text-sm text-ink-500">/ 100 · {result.model}</span>
                  </div>
                  <p className="mt-6 font-display text-xl leading-relaxed text-ink-900">{result.verdict}</p>
                  <div className="mt-7 flex flex-wrap gap-2">
                    <Link href="/chat" className="btn btn-primary">{t.askNext}</Link>
                    <Link href="/irrigation" className="btn btn-ghost">{t.irrigation}</Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="idle" exit={{ opacity: 0 }} className="flex flex-col items-start gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-ink-900/30 text-leaf-700">
                    <Sparkles className="h-6 w-6" strokeWidth={1.8} />
                  </div>
                  <p className="font-hand text-3xl text-ink-900">{t.ready}</p>
                  <p className="text-sm leading-relaxed text-ink-700">
                    {t.readyBody(
                      `${reading.temp.toFixed(1)} °C / pH ${reading.ph.toFixed(2)} / ${reading.tds} ppm / ${reading.moist}%`,
                      sel.name,
                    )}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
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
  ideal,
  unit,
  digits,
  value,
  band,
  score,
}: {
  label: string;
  ideal: string;
  unit: string;
  digits: number;
  value: number;
  band: [number, number];
  score: number;
}) {
  const ok = value >= band[0] && value <= band[1];
  // Visual range: pad 60% of the band width on each side.
  const span = band[1] - band[0] || 1;
  const min = band[0] - span * 0.6;
  const max = band[1] + span * 0.6;
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const bandLeft = ((band[0] - min) / (max - min)) * 100;
  const bandWidth = ((band[1] - band[0]) / (max - min)) * 100;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="flex items-center gap-2 font-display text-base uppercase tracking-wide text-ink-900">
          {ok ? (
            <CheckCircle2 className="h-4 w-4 text-leaf-600" strokeWidth={2.5} />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-500" strokeWidth={2.5} />
          )}
          {label}
        </span>
        <span className="font-mono text-xs text-ink-500">
          {value.toFixed(digits)}
          {unit} · {ideal} {band[0]}–{band[1]}
          {unit} · {Math.round(score)}/100
        </span>
      </div>
      <div className="relative mt-2 h-2.5 border border-ink-900/30 bg-paper">
        <div className="absolute inset-y-0 bg-leaf-300/60" style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }} />
        <motion.div
          className={`absolute -top-1 h-4 w-[4px] -translate-x-1/2 ${ok ? "bg-leaf-800" : "bg-stamp-500"}`}
          initial={false}
          animate={{ left: `${pct}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 24 }}
        />
      </div>
    </div>
  );
}
