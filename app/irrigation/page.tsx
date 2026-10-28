"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowRight, CheckCircle2, Leaf, Radio } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
} from "recharts";
import { useSensor } from "@/components/SensorProvider";
import { useLang } from "@/components/LanguageProvider";
import PageHeader from "@/components/PageHeader";
import { AnimatedNumber, Reveal, StaggerItem, StaggerList } from "@/components/motion/Motion";
import { CROPS, type Crop } from "@/lib/crops";
import { computeIrrigation, URGENCY_STYLE } from "@/lib/irrigation";
import { IRRIGATION } from "@/lib/i18n/pages/irrigation";

type AreaUnit = "m2" | "ha" | "sot";

const UNIT_TO_M2: Record<AreaUnit, number> = {
  m2: 1,
  sot: 100,
  ha: 10_000,
};

/**
 * Area as typed: farmers write "12,5" as often as "12.5". A number input
 * silently turns "12,5" into "" (then the result was for 1 m²), so the field
 * is text and we parse both separators. Anything unusable → 0 (no area).
 */
function parseArea(text: string): number {
  const v = text.trim().replace(",", ".");
  if (!/^\d*\.?\d*$/.test(v)) return 0;
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Mock reading used when not connected — lets the farmer preview the math.
 *  Module-level so the result memo below doesn't recompute every render. */
const FALLBACK_READING = { temp: 18, ph: 6.6, tds: 480, moist: 42 };

// Chart colours from the seed-sack palette
const C = {
  ok:   "#4A6128",
  off:  "#C38A1E",
  band: "#9AAD67",
  tick: "#6B5A45",
};

export default function IrrigationPage() {
  const { latest, status } = useSensor();
  const { lang, t: tc } = useLang();
  const t = IRRIGATION[lang];
  const locale = lang === "ru" ? "ru-RU" : "en-US";

  const [cropId, setCropId] = useState<string>("wheat");
  const [areaText, setAreaText] = useState("100");
  const area = parseArea(areaText);
  const hasArea = area > 0;
  const [unit, setUnit] = useState<AreaUnit>("sot");

  // Persist choices
  useEffect(() => {
    const saved = window.localStorage.getItem("soilplus.irrigation");
    if (saved) {
      try {
        const o = JSON.parse(saved) as { cropId?: string; area?: number; unit?: AreaUnit };
        if (o.cropId) setCropId(o.cropId);
        if (o.area)   setAreaText(String(o.area));
        if (o.unit)   setUnit(o.unit);
      } catch {}
    }
  }, []);
  useEffect(() => {
    // Keep the last usable area while the field is being retyped.
    if (!hasArea) return;
    window.localStorage.setItem(
      "soilplus.irrigation",
      JSON.stringify({ cropId, area, unit }),
    );
  }, [cropId, area, unit, hasArea]);

  const crop = useMemo<Crop>(
    () => CROPS.find((c) => c.id === cropId) ?? CROPS[0],
    [cropId],
  );
  const cropName = lang === "ru" ? crop.nameRu : crop.name;

  const areaM2 = area * UNIT_TO_M2[unit];

  const reading = latest ?? FALLBACK_READING;
  const isLive = Boolean(latest) && status === "connected";

  const result = useMemo(
    () =>
      computeIrrigation({
        crop,
        reading,
        areaM2: Math.max(areaM2, 1),
        lang,
      }),
    [crop, reading, areaM2, lang],
  );

  const tone = URGENCY_STYLE[result.urgency].tone;
  const fmt = (n: number) => n.toLocaleString(locale);
  // Litres to 3 significant figures: the sensors aren't good to the litre on a
  // hectare, and a live reading would otherwise keep the last digits spinning.
  const sig3 = (n: number) => {
    if (n < 1000) return Math.round(n);
    const step = 10 ** (Math.floor(Math.log10(n)) - 2);
    return Math.round(n / step) * step;
  };
  const fmtL = (n: number) => fmt(sig3(n));

  // Bar chart — 4 metrics vs. their crop bands
  const chartData = [
    { metric: t.metrics.moist, value: reading.moist, min: crop.wOptMin, max: crop.wOptMax, unit: "%" },
    { metric: t.metrics.ph,    value: reading.ph,    min: crop.phMin,   max: crop.phMax,  unit: "" },
    { metric: t.metrics.tds,   value: reading.tds,   min: 0,            max: crop.ecMax,  unit: "ppm" },
    { metric: t.metrics.temp,  value: reading.temp,  min: crop.tOptMin, max: crop.tOptMax, unit: "°C" },
  ];

  const none = result.eventsNeeded === 0;

  return (
    <main className="mx-auto max-w-[1280px] px-5 pb-24 pt-10 sm:px-8">
      <PageHeader
        home={tc.common.home}
        crumb={t.crumb}
        eyebrow={t.eyebrow}
        title={t.title}
        lead={t.lead}
        aside={
          !isLive && (
            <Link href="/connect" className="btn btn-ghost">
              <Radio className="h-4 w-4" strokeWidth={2.5} />
              {t.connectLive}
            </Link>
          )
        }
      />

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* =================================== Left column — inputs + chart */}
        <div className="space-y-6">
          {/* Crop picker — seed packets */}
          <Reveal className="card p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="label-eyebrow">{t.step1}</p>
                <h2 className="mt-2 text-2xl uppercase text-ink-900">{t.step1Title}</h2>
              </div>
              <span className="chip chip-ghost hidden sm:inline-flex">{t.cropsCount(CROPS.length)}</span>
            </div>

            <StaggerList className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {CROPS.map((c, i) => {
                const active = c.id === cropId;
                return (
                  <StaggerItem key={c.id} className="relative">
                    {/* dashed "cut here" line that hops to the chosen packet */}
                    {active && (
                      <motion.span
                        layoutId="crop-pick"
                        aria-hidden
                        className="pointer-events-none absolute -inset-1.5 rounded-lg border-2 border-dashed border-stamp-500"
                        transition={{ type: "spring", bounce: 0.25, visualDuration: 0.35 }}
                      />
                    )}
                    <button
                      onClick={() => setCropId(c.id)}
                      aria-pressed={active}
                      className={`group flex h-full w-full flex-col overflow-hidden rounded-md border-2 text-left transition-all duration-200 ${
                        active
                          ? "-translate-y-0.5 border-ink-900 shadow-[3px_4px_0_0_rgba(42,31,20,0.25)]"
                          : "border-ink-900/15 hover:-translate-y-0.5 hover:border-ink-900/40"
                      }`}
                    >
                      <span
                        className={`flex justify-between px-2.5 py-1 font-mono text-[10px] transition-colors ${
                          active ? "bg-stamp-500 text-paper" : "bg-leaf-700 text-leaf-100"
                        }`}
                      >
                        <span>№ {String(i + 1).padStart(2, "0")}</span>
                        {active && <span>✓</span>}
                      </span>
                      <span className="block bg-white px-2.5 py-2">
                        <span className="block font-display text-[15px] uppercase leading-tight text-ink-900">
                          {lang === "ru" ? c.nameRu : c.name}
                        </span>
                        <span className="block truncate text-[11px] text-ink-400">
                          {lang === "ru" ? c.name : c.nameRu}
                        </span>
                      </span>
                    </button>
                  </StaggerItem>
                );
              })}
            </StaggerList>

            <AnimatePresence mode="wait">
              <motion.p
                key={crop.id + lang}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="mt-5 rounded-md border-l-4 border-leaf-600 bg-paper px-4 py-3 text-sm text-ink-700"
              >
                <span className="font-display uppercase tracking-wide text-leaf-700">{cropName}:</span>{" "}
                {lang === "ru" ? crop.noteRu : crop.note}
              </motion.p>
            </AnimatePresence>
          </Reveal>

          {/* Area */}
          <Reveal delay={0.05} className="card p-6 sm:p-7">
            <p className="label-eyebrow">{t.step2}</p>
            <h2 className="mt-2 text-2xl uppercase text-ink-900">{t.step2Title}</h2>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={areaText}
                  inputMode="decimal"
                  autoComplete="off"
                  aria-label={t.step2Title}
                  aria-invalid={!hasArea}
                  onChange={(e) => setAreaText(e.target.value.replace(/[^\d.,]/g, ""))}
                  className={`input border-2 pr-16 font-mono text-2xl ${hasArea ? "" : "border-amber-500"}`}
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-mono text-sm text-ink-400">
                  {t.units[unit]}
                </span>
              </div>
              <div className="inline-flex rounded-md border-2 border-ink-900/80 bg-white p-1">
                {(["m2", "sot", "ha"] as AreaUnit[]).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    aria-pressed={u === unit}
                    className={`relative rounded px-4 py-2 font-display text-sm uppercase tracking-wide transition-colors ${
                      u === unit ? "text-paper" : "text-ink-500 hover:text-ink-900"
                    }`}
                  >
                    {u === unit && (
                      <motion.span
                        layoutId="unit-pill"
                        className="absolute inset-0 rounded bg-leaf-600"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative">{t.units[u]}</span>
                  </button>
                ))}
              </div>
            </div>

            {hasArea ? (
              <p className="mt-3 font-mono text-xs text-ink-500">
                {t.equivalent(fmt(areaM2), (areaM2 / 10_000).toLocaleString(locale, { maximumFractionDigits: 3 }))}
              </p>
            ) : (
              <p className="mt-3 text-sm text-amber-600">{t.areaHint}</p>
            )}
          </Reveal>

          {/* Live vs. crop band */}
          <Reveal delay={0.1} className="card p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="label-eyebrow">{t.step3}</p>
                <h2 className="mt-2 text-2xl uppercase text-ink-900">{t.step3Title(cropName)}</h2>
              </div>
              {!isLive && <span className="chip chip-amber">{t.preview}</span>}
            </div>

            <div className="mt-5 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 20, bottom: 8, left: 10 }}>
                  <XAxis type="number" hide domain={[0, "dataMax"]} />
                  <YAxis
                    type="category"
                    dataKey="metric"
                    axisLine={false}
                    tickLine={false}
                    width={92}
                    tick={{ fill: C.tick, fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(92,118,51,0.08)" }}
                    contentStyle={{
                      background: "#FAF4E6",
                      border: "2px solid rgba(42,31,20,0.2)",
                      borderRadius: 6,
                      fontSize: 12,
                      boxShadow: "3px 4px 0 0 rgba(42,31,20,0.12)",
                    }}
                  />
                  {chartData.map((row, i) => (
                    <ReferenceArea
                      key={i}
                      y1={row.metric}
                      y2={row.metric}
                      x1={row.min}
                      x2={row.max}
                      fill={C.band}
                      fillOpacity={0.25}
                      stroke={C.ok}
                      strokeOpacity={0.3}
                      strokeDasharray="4 3"
                    />
                  ))}
                  <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={18}>
                    {chartData.map((row, idx) => {
                      const within = row.value >= row.min && row.value <= row.max;
                      return <Cell key={idx} fill={within ? C.ok : C.off} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {chartData.map((m) => {
                const within = m.value >= m.min && m.value <= m.max;
                return (
                  <div key={m.metric} className="rounded-md border-2 border-ink-900/10 bg-paper px-3 py-2">
                    <p className="font-display text-[11px] uppercase tracking-[0.1em] text-ink-500">{m.metric}</p>
                    <p className={`mt-0.5 font-mono text-lg ${within ? "text-leaf-700" : "text-amber-600"}`}>
                      {m.value}
                      {m.unit && <span className="ml-1 text-xs text-ink-400">{m.unit}</span>}
                    </p>
                    <p className="font-mono text-[11px] text-ink-400">
                      {t.band} {m.min}–{m.max}
                    </p>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>

        {/* =================================== Right column — the result ticket */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Reveal x={40} className="stitch overflow-hidden rounded-md bg-white shadow-soft">
            {/* Urgency header */}
            <div
              className={`flex items-start justify-between gap-3 px-7 pb-5 pt-7 ${
                tone === "leaf" ? "bg-leaf-50"
                : tone === "aqua" ? "bg-aqua-50"
                : tone === "amber" ? "bg-amber-50"
                : tone === "red" ? "bg-rose-50"
                : "bg-paper"
              }`}
            >
              <div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={result.urgency}
                    initial={{ opacity: 0, scale: 1.6, rotate: -12 }}
                    animate={{ opacity: 1, scale: 1, rotate: -3 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 24 }}
                    className={`inline-block rounded-sm border-[3px] border-double px-2.5 py-1 font-stamp text-sm uppercase ${
                      tone === "leaf" ? "border-leaf-600 text-leaf-700"
                      : tone === "aqua" ? "border-aqua-500 text-aqua-600"
                      : tone === "red" ? "border-stamp-500 text-stamp-500"
                      : "border-amber-500 text-amber-600"
                    }`}
                  >
                    {t.urgency[result.urgency]}
                  </motion.span>
                </AnimatePresence>
                <h2 className="mt-4 text-3xl uppercase text-ink-900">{t.resultTitle}</h2>
                <p className="mt-1 text-sm text-ink-500">{t.resultFor(cropName, hasArea ? `${fmt(area)} ${t.units[unit]}` : "—")}</p>
              </div>
            </div>

            {/* Big number — litres for ONE watering event right now */}
            <div className="border-y-2 border-dashed border-ink-900/15 px-7 py-8 text-center">
              {!hasArea ? (
                <p className="py-10 font-hand text-2xl leading-snug text-ink-700">{t.areaHint}</p>
              ) : (
              <>
              <p className="font-display text-xs uppercase tracking-[0.18em] text-ink-500">
                {none ? t.noWatering : t.thisWatering}
              </p>
              <p className="mt-2 font-display text-[68px] font-semibold leading-none text-ink-900">
                <AnimatedNumber value={none ? 0 : sig3(result.litresPerEvent)} locale={locale} />
              </p>
              <p className="mt-1 font-display text-base uppercase tracking-[0.2em] text-leaf-700">{t.litres}</p>
              {!none && <p className="mt-1 text-xs text-ink-500">{t.perM2(result.litresPerM2PerEvent)}</p>}

              {/* Water gauge: soil moisture now against the crop's norm */}
              <div className="mt-6 text-left">
                <div className="flex justify-between font-mono text-[11px] text-ink-500">
                  <span>{t.metrics.moist} {reading.moist}%</span>
                  <span>{t.band} {crop.wOptMin}–{crop.wOptMax}%</span>
                </div>
                <div className="relative mt-1.5 h-3 overflow-hidden rounded-sm border-2 border-ink-900/15 bg-paper">
                  <motion.div
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-full bg-aqua-500/75"
                    style={{ originX: 0 }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: Math.min(Math.max(reading.moist, 0), 100) / 100 }}
                    transition={{ type: "spring", bounce: 0.2, visualDuration: 0.8, delay: 0.3 }}
                  />
                  <motion.div
                    aria-hidden
                    className="absolute inset-0 bg-leaf-600/40"
                    initial={false}
                    animate={{ clipPath: `inset(0 ${100 - crop.wOptMax}% 0 ${crop.wOptMin}%)` }}
                    transition={{ type: "spring", bounce: 0.15, visualDuration: 0.5 }}
                  />
                </div>
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-md border-2 border-ink-900/10 bg-ink-900/10 text-left">
                {[
                  [t.m.perEvent, none ? `0 ${t.l}` : `${fmtL(result.litresPerEvent)} ${t.l}`],
                  [t.m.events, none ? "—" : `${result.eventsNeeded}×`],
                  [t.m.between, result.hoursBetweenEvents > 0 ? `${result.hoursBetweenEvents} ${t.h}` : "—"],
                  [t.m.check, `${result.nextCheckHours} ${t.h}`],
                  [t.m.deficit, `${result.deficitPct.toFixed(1)} ${t.pp}`],
                  [t.m.season, `${fmtL(result.litres)} ${t.l}`],
                ].map(([k, v]) => (
                  <div key={k} className="bg-white p-3">
                    <dt className="font-display text-[11px] uppercase tracking-[0.1em] text-ink-500">{k}</dt>
                    <dd className="mt-0.5 font-mono text-[15px] text-ink-900">{v}</dd>
                  </div>
                ))}
              </dl>

              {result.eventsNeeded > 1 && (
                <div className="mt-5 rounded-md border-l-4 border-aqua-500 bg-aqua-50 px-4 py-3 text-left text-[13px] leading-relaxed text-ink-700">
                  <p className="mb-1 font-display text-sm uppercase tracking-wide text-ink-900">{t.planTitle}</p>
                  <p>
                    {t.plan(
                      fmtL(result.litresPerEvent),
                      result.litresPerM2PerEvent,
                      result.hoursBetweenEvents,
                      result.eventsNeeded - 1,
                      result.nextCheckHours,
                    )}
                  </p>
                </div>
              )}
              </>
              )}
            </div>

            {/* Reasons */}
            <div className="bg-paper px-7 py-6">
              <p className="label-eyebrow">{t.notes}</p>
              <ul className="mt-4 space-y-3">
                {result.reasons.map((r, i) => (
                  <li key={r} className="flex gap-2.5 text-sm leading-snug text-ink-700">
                    {i === 0 && result.urgency === "none" ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-leaf-600" strokeWidth={2.5} />
                    ) : i === 0 ? (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" strokeWidth={2.5} />
                    ) : (
                      <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-leaf-600" strokeWidth={2.5} />
                    )}
                    <span>{r}</span>
                  </li>
                ))}
              </ul>

              {(result.kPh !== 1 || result.kEc !== 1) && (
                <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-xs text-ink-500">
                  <div className="rounded border border-ink-900/15 bg-white px-2 py-1.5">
                    K<sub>pH</sub> = {result.kPh.toFixed(2)}
                  </div>
                  <div className="rounded border border-ink-900/15 bg-white px-2 py-1.5">
                    K<sub>EC</sub> = {result.kEc.toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t-2 border-dashed border-ink-900/15 bg-white px-7 py-5 sm:flex-row">
              <Link href="/chat" className="btn btn-primary group flex-1">
                {t.ask}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
              </Link>
              <Link href="/dashboard" className="btn btn-ghost flex-1">
                {t.telemetry}
              </Link>
            </div>
          </Reveal>

          <p className="mt-4 text-center font-mono text-[11px] leading-relaxed text-ink-500">{t.formula}</p>
        </div>
      </div>
    </main>
  );
}
