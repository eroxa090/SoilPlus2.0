"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Loader2, Radio, Sparkles, TrendingUp } from "lucide-react";
import { useSensor } from "@/components/SensorProvider";
import { useLang } from "@/components/LanguageProvider";
import PageHeader from "@/components/PageHeader";
import { CountUp, Reveal, StaggerItem, StaggerList } from "@/components/motion/Motion";
import { CROPS } from "@/lib/crops";
import { FORECAST } from "@/lib/i18n/pages/forecast";

type Forecast = {
  cropId: string;
  cropName: string;
  yieldPerHa: number;
  yieldTotalKg: number;
  fitness: number;
  confidence: number;
  outlook: "ok" | "marginal" | "risky";
  risks: string[];
  boosters: string[];
  notes?: string;
};

type AreaUnit = "m2" | "ha" | "sot";
const UNIT_TO_M2: Record<AreaUnit, number> = {
  m2: 1,
  sot: 100,
  ha: 10_000,
};

type T = (typeof FORECAST)["ru"];

export default function ForecastPage() {
  const { latest } = useSensor();
  const { lang, t: tc } = useLang();
  const t = FORECAST[lang];
  const [cropId, setCropId] = useState("wheat");
  const [area, setArea] = useState(100);
  const [unit, setUnit] = useState<AreaUnit>("sot");
  const [region, setRegion] = useState(t.regionDefault);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Forecast | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const crop = useMemo(() => CROPS.find((c) => c.id === cropId), [cropId]);
  const areaM2 = area * UNIT_TO_M2[unit];

  async function submit() {
    if (busy || !crop || areaM2 <= 0) return;
    setBusy(true);
    setError(null);
    setWarning(null);
    setResult(null);
    try {
      const res = await fetch("/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropId: crop.id,
          areaM2,
          region: region.trim() || undefined,
          note: note.trim() || undefined,
          lang,
          reading: latest
            ? { temp: latest.temp, ph: latest.ph, tds: latest.tds, moist: latest.moist }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? t.failed);
        return;
      }
      setResult(data.forecast as Forecast);
      setModel(data.model ?? null);
      if (data.warning) setWarning(data.warning);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.network);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-24 pt-10 sm:px-8">
      <PageHeader home={tc.common.home} crumb={t.crumb} eyebrow={t.eyebrow} title={t.title} lead={t.lead} />

      <div className="mt-10 grid gap-6 lg:grid-cols-5">
        {/* INPUT — field passport */}
        <Reveal className="lg:col-span-2">
          <div className="kraft stitch rounded-md p-6 shadow-soft">
            <h2 className="mb-5 text-2xl uppercase text-ink-900">{t.fieldTitle}</h2>

            <Field label={t.crop}>
              <select value={cropId} onChange={(e) => setCropId(e.target.value)} className="input border-2">
                {CROPS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === "ru" ? `${c.nameRu} — ${c.name}` : `${c.name} — ${c.nameRu}`}
                  </option>
                ))}
              </select>
              {crop && <p className="mt-2 text-xs leading-snug text-ink-900">{lang === "ru" ? crop.noteRu : crop.note}</p>}
            </Field>

            <div className="grid grid-cols-3 gap-2">
              <Field label={t.area} className="col-span-2">
                <input type="number" min={0} value={area} onChange={(e) => setArea(Number(e.target.value))} className="input border-2 font-mono" />
              </Field>
              <Field label={t.unit}>
                <select value={unit} onChange={(e) => setUnit(e.target.value as AreaUnit)} className="input border-2">
                  {(["m2", "sot", "ha"] as AreaUnit[]).map((u) => (
                    <option key={u} value={u}>{t.units[u]}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label={t.region}>
              <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} maxLength={80} className="input border-2" />
            </Field>

            <Field label={t.note}>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={t.notePh}
                className="input resize-none border-2"
              />
            </Field>

            {/* Sensor status */}
            <div
              className={`mb-4 flex items-start gap-2 rounded-md p-3 text-xs leading-snug ${
                latest ? "bg-leaf-50 text-leaf-800" : "bg-white/70 text-ink-700"
              }`}
            >
              <Radio className="mt-0.5 h-4 w-4 shrink-0" />
              {latest ? (
                <span>{t.liveReading(latest.moist, latest.ph.toFixed(2), latest.tds, latest.temp.toFixed(1))}</span>
              ) : (
                <span>
                  {t.noDevice[0]}
                  <Link href="/connect" className="font-medium underline underline-offset-2">{t.noDevice[1]}</Link>
                  {t.noDevice[2]}
                </span>
              )}
            </div>

            {error && (
              <div role="alert" className="mb-3 flex items-start gap-2 rounded-md border-2 border-stamp-500/40 bg-rose-50 p-3 text-sm text-stamp-600">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button onClick={submit} disabled={busy || !crop || areaM2 <= 0} className="btn btn-stamp w-full py-3.5 text-base disabled:opacity-50">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.counting}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" strokeWidth={2.5} />
                  {t.run}
                </>
              )}
            </button>
          </div>
        </Reveal>

        {/* OUTPUT */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <ResultView forecast={result} model={model} warning={warning} areaM2={areaM2} t={t} locale={lang === "ru" ? "ru-RU" : "en-US"} />
              </motion.div>
            ) : busy ? (
              <motion.div
                key="busy"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-md border-2 border-ink-900/10 bg-white p-8 text-center"
              >
                <Loader2 className="h-8 w-8 animate-spin text-leaf-600" />
                <p className="mt-4 font-display text-xl uppercase text-ink-900">{t.loading}</p>
                <p className="mt-1 text-sm text-ink-500">{t.loadingSub}</p>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-md border-2 border-dashed border-ink-900/20 p-8 text-center"
              >
                <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-ink-900/30 text-leaf-700">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <p className="mt-4 font-display text-2xl uppercase text-ink-900">{t.emptyTitle}</p>
                <p className="mt-2 max-w-sm text-sm text-ink-500">{t.emptyBody}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`mb-4 block ${className}`}>
      <span className="mb-1.5 block font-display text-sm uppercase tracking-wide text-ink-900">{label}</span>
      {children}
    </label>
  );
}

function ResultView({
  forecast,
  model,
  warning,
  areaM2,
  t,
  locale,
}: {
  forecast: Forecast;
  model: string | null;
  warning: string | null;
  areaM2: number;
  t: T;
  locale: string;
}) {
  const tonnes = forecast.yieldTotalKg / 1000;
  const tone =
    forecast.outlook === "ok" ? "border-leaf-600 text-leaf-700"
    : forecast.outlook === "marginal" ? "border-amber-500 text-amber-600"
    : "border-stamp-500 text-stamp-500";

  return (
    <div className="space-y-5">
      <div className="stitch rounded-md bg-white p-7 shadow-soft">
        <div className="flex flex-wrap items-center gap-3">
          <motion.span
            initial={{ opacity: 0, scale: 1.8, rotate: -14 }}
            animate={{ opacity: 1, scale: 1, rotate: -3 }}
            transition={{ type: "spring", stiffness: 480, damping: 22, delay: 0.15 }}
            className={`inline-block rounded-sm border-[3px] border-double px-2.5 py-1 font-stamp text-sm uppercase ${tone}`}
          >
            {t.outlook[forecast.outlook]}
          </motion.span>
          {model && <span className="chip chip-ghost">{model}</span>}
        </div>

        <h2 className="mt-4 text-4xl uppercase text-ink-900">{forecast.cropName}</h2>

        <dl className="mt-6 grid gap-px overflow-hidden rounded-md border-2 border-ink-900/10 bg-ink-900/10 sm:grid-cols-3">
          <Metric label={t.yield} value={forecast.yieldPerHa.toLocaleString(locale)} unit={t.kgHa} />
          <Metric
            label={t.onArea(areaM2.toLocaleString(locale))}
            value={tonnes >= 1 ? tonnes.toFixed(2) : forecast.yieldTotalKg.toLocaleString(locale)}
            unit={tonnes >= 1 ? t.tonnes : t.kg}
          />
          <Metric label={t.fitness} value={String(forecast.fitness)} unit="%" count />
        </dl>

        <div className="mt-5 flex items-center gap-3 text-xs text-ink-500">
          <span className="font-display uppercase tracking-wide">{t.confidence}</span>
          <div className="h-2.5 flex-1 border border-ink-900/30 bg-paper">
            <motion.div
              className="h-full bg-leaf-600"
              initial={{ width: 0 }}
              animate={{ width: `${forecast.confidence}%` }}
              transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1], delay: 0.2 }}
            />
          </div>
          <span className="font-mono text-ink-900">{forecast.confidence}%</span>
        </div>

        {forecast.notes && <p className="mt-5 rounded-md bg-paper p-3 text-sm text-ink-700">{forecast.notes}</p>}
        {warning && (
          <p className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-600">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{warning}</span>
          </p>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <ListCard title={t.risks} items={forecast.risks} emptyHint={t.noRisks} tone="warn" />
        <ListCard title={t.boosters} items={forecast.boosters} emptyHint={t.noBoosters} tone="leaf" />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/irrigation" className="btn btn-primary group">
          {t.toIrrigation}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
        </Link>
        <Link href="/chat" className="btn btn-ghost">
          {t.toChat}
        </Link>
      </div>
    </div>
  );
}

function Metric({ label, value, unit, count = false }: { label: string; value: string; unit: string; count?: boolean }) {
  return (
    <div className="bg-white p-4">
      <dt className="font-display text-xs uppercase tracking-[0.12em] text-ink-500">{label}</dt>
      <dd className="mt-1 flex items-baseline gap-1">
        <span className="font-display text-3xl font-semibold text-ink-900">
          {/* CountUp only for plain numbers — grouped ones like "4 200" would split */}
          {count ? <CountUp value={value} /> : value}
        </span>
        <span className="text-xs text-ink-500">{unit}</span>
      </dd>
    </div>
  );
}

function ListCard({ title, items, emptyHint, tone }: { title: string; items: string[]; emptyHint: string; tone: "warn" | "leaf" }) {
  return (
    <div className={`card border-t-4 p-5 ${tone === "warn" ? "border-t-amber-500" : "border-t-leaf-600"}`}>
      <h3 className="mb-3 font-display text-lg uppercase tracking-wide text-ink-900">{title}</h3>
      {items.length > 0 ? (
        <StaggerList className="space-y-2.5">
          {items.map((it, i) => (
            <StaggerItem key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-700">
              <span className={tone === "warn" ? "text-amber-500" : "text-leaf-600"}>✦</span>
              <span>{it}</span>
            </StaggerItem>
          ))}
        </StaggerList>
      ) : (
        <p className="text-sm text-ink-500">{emptyHint}</p>
      )}
    </div>
  );
}
