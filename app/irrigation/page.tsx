"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Droplets,
  Gauge,
  Leaf,
  Radio,
  Ruler,
  Sprout,
  Waves,
} from "lucide-react";
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
import { CROPS, type Crop } from "@/lib/crops";
import { computeIrrigation, URGENCY_STYLE } from "@/lib/irrigation";

type AreaUnit = "m2" | "ha" | "sot";

const UNIT_LABEL: Record<AreaUnit, string> = {
  m2: "m²",
  sot: "сотка",
  ha: "ha",
};

const UNIT_TO_M2: Record<AreaUnit, number> = {
  m2: 1,
  sot: 100,
  ha: 10_000,
};

export default function IrrigationPage() {
  const { latest, status } = useSensor();

  const [cropId, setCropId] = useState<string>("wheat");
  const [area, setArea] = useState<number>(100);
  const [unit, setUnit] = useState<AreaUnit>("sot");

  // Persist choices
  useEffect(() => {
    const saved = window.localStorage.getItem("soilplus.irrigation");
    if (saved) {
      try {
        const o = JSON.parse(saved) as { cropId?: string; area?: number; unit?: AreaUnit };
        if (o.cropId) setCropId(o.cropId);
        if (o.area)   setArea(o.area);
        if (o.unit)   setUnit(o.unit);
      } catch {}
    }
  }, []);
  useEffect(() => {
    window.localStorage.setItem(
      "soilplus.irrigation",
      JSON.stringify({ cropId, area, unit }),
    );
  }, [cropId, area, unit]);

  const crop = useMemo<Crop>(
    () => CROPS.find((c) => c.id === cropId) ?? CROPS[0],
    [cropId],
  );

  const areaM2 = area * UNIT_TO_M2[unit];

  /** Mock reading used when not connected — lets farmer preview the math. */
  const fallbackReading = { temp: 18, ph: 6.6, tds: 480, moist: 42 };
  const reading = latest ?? fallbackReading;
  const isLive = Boolean(latest) && status === "connected";

  const result = useMemo(
    () =>
      computeIrrigation({
        crop,
        reading,
        areaM2: Math.max(areaM2, 1),
      }),
    [crop, reading, areaM2],
  );

  const urgency = URGENCY_STYLE[result.urgency];

  // Bar chart — 4 metrics vs. their crop bands
  const chartData = [
    { metric: "Moisture", value: reading.moist, min: crop.wOptMin, max: crop.wOptMax, unit: "%" },
    { metric: "pH",       value: reading.ph,    min: crop.phMin,   max: crop.phMax,  unit: "" },
    { metric: "TDS",      value: reading.tds,   min: 0,            max: crop.ecMax,  unit: "ppm" },
    { metric: "Temp",     value: reading.temp,  min: crop.tOptMin, max: crop.tOptMax, unit: "°C" },
  ];

  return (
    <main className="mx-auto max-w-[1280px] px-5 pb-24 pt-10 sm:px-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="label-eyebrow">Irrigation planner</span>
          <h1 className="mt-2 font-display text-4xl tracking-tightx text-ink-900 sm:text-5xl">
            Exact litres.<br />Nothing wasted.
          </h1>
          <p className="mt-3 max-w-xl text-ink-500">
            Pick your crop and plot. We fuse live soil chemistry with KazNIIZ /
            FAO-56 norms and return the volume your field actually needs.
          </p>
        </div>
        {!isLive && (
          <Link href="/connect" className="btn btn-ghost">
            <Radio className="h-4 w-4" strokeWidth={2} />
            Connect for live values
          </Link>
        )}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
        {/* =================================== Left column — inputs + chart */}
        <div className="space-y-5">
          {/* Crop picker */}
          <div className="card p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <span className="label-eyebrow">Step 1 · Crop</span>
                <h3 className="mt-1 font-display text-xl text-ink-900">
                  What are you irrigating?
                </h3>
              </div>
              <span className="chip chip-ghost hidden sm:inline-flex">
                {CROPS.length} crops
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {CROPS.map((c) => {
                const active = c.id === cropId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCropId(c.id)}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                      active
                        ? "border-leaf-500 bg-leaf-50 shadow-ring"
                        : "border-ink-100 bg-white hover:border-leaf-300 hover:bg-leaf-50/40"
                    }`}
                  >
                    <span className="text-xl">{c.emoji}</span>
                    <div className="min-w-0">
                      <p
                        className={`truncate text-sm font-semibold ${
                          active ? "text-leaf-700" : "text-ink-900"
                        }`}
                      >
                        {c.name}
                      </p>
                      <p className="truncate text-[10px] text-ink-400">{c.nameRu}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="mt-4 rounded-xl border border-ink-100 bg-paper-alt p-3 text-sm text-ink-600">
              <span className="font-semibold text-leaf-700">{crop.name}:</span>{" "}
              {crop.note}
            </p>
          </div>

          {/* Area */}
          <div className="card p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <span className="label-eyebrow">Step 2 · Plot size</span>
                <h3 className="mt-1 font-display text-xl text-ink-900">
                  How much land?
                </h3>
              </div>
              <Ruler className="h-5 w-5 text-ink-300" />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={area}
                  min={1}
                  onChange={(e) => setArea(Math.max(0, Number(e.target.value)))}
                  className="input pr-16 font-mono text-xl font-semibold"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-xs text-ink-400">
                  {UNIT_LABEL[unit]}
                </span>
              </div>
              <div className="inline-flex rounded-xl border border-ink-100 bg-white p-1">
                {(["m2", "sot", "ha"] as AreaUnit[]).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-widex transition ${
                      u === unit
                        ? "bg-leaf-600 text-white"
                        : "text-ink-500 hover:text-ink-900"
                    }`}
                  >
                    {UNIT_LABEL[u]}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-3 text-xs text-ink-400">
              Equivalent to {(areaM2).toLocaleString()} m² ·{" "}
              {(areaM2 / 10_000).toFixed(3)} ha
            </p>
          </div>

          {/* Live vs. crop band */}
          <div className="card p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <span className="label-eyebrow">Step 3 · Live soil fit</span>
                <h3 className="mt-1 font-display text-xl text-ink-900">
                  How close are we to {crop.name}&rsquo;s band?
                </h3>
              </div>
              {!isLive && (
                <span className="chip chip-amber">Preview · no device</span>
              )}
            </div>

            <div className="mt-5 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 8, right: 20, bottom: 8, left: 10 }}
                >
                  <XAxis type="number" hide domain={[0, "dataMax"]} />
                  <YAxis
                    type="category"
                    dataKey="metric"
                    axisLine={false}
                    tickLine={false}
                    width={70}
                    tick={{ fill: "#6C7A72", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(63,145,84,0.06)" }}
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #E5E9E3",
                      borderRadius: 10,
                      fontSize: 12,
                      boxShadow: "0 10px 30px -10px rgba(11,20,16,0.18)",
                    }}
                  />
                  {chartData.map((_, i) => (
                    <ReferenceArea
                      key={i}
                      y1={chartData[i].metric}
                      y2={chartData[i].metric}
                      x1={chartData[i].min}
                      x2={chartData[i].max}
                      fill="#3F9154"
                      fillOpacity={0.12}
                      stroke="#2B7440"
                      strokeOpacity={0.2}
                    />
                  ))}
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                    {chartData.map((row, idx) => {
                      const within = row.value >= row.min && row.value <= row.max;
                      return (
                        <Cell
                          key={idx}
                          fill={within ? "#2B7440" : "#C88A1B"}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {chartData.map((m) => {
                const within = m.value >= m.min && m.value <= m.max;
                return (
                  <div
                    key={m.metric}
                    className="rounded-lg border border-ink-100 bg-paper-alt px-3 py-2"
                  >
                    <p className="text-[10px] uppercase tracking-widex text-ink-400">
                      {m.metric}
                    </p>
                    <p
                      className={`mt-1 font-mono text-sm font-semibold ${
                        within ? "text-leaf-700" : "text-amber-600"
                      }`}
                    >
                      {m.value}
                      {m.unit && <span className="ml-1 text-ink-400">{m.unit}</span>}
                    </p>
                    <p className="text-[10px] text-ink-400">
                      band {m.min}–{m.max}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* =================================== Right column — result card */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden p-0">
            {/* Urgency header */}
            <div
              className={`flex items-start justify-between gap-3 px-6 pt-6 pb-5 ${
                urgency.tone === "leaf"
                  ? "bg-leaf-50"
                  : urgency.tone === "aqua"
                    ? "bg-aqua-50"
                    : urgency.tone === "amber"
                      ? "bg-amber-50"
                      : urgency.tone === "red"
                        ? "bg-rose-50"
                        : "bg-paper-alt"
              }`}
            >
              <div>
                <span
                  className={`chip ${
                    urgency.tone === "leaf"
                      ? "chip-leaf"
                      : urgency.tone === "aqua"
                        ? "chip-aqua"
                        : urgency.tone === "amber"
                          ? "chip-amber"
                          : "chip-amber"
                  }`}
                >
                  {urgency.label}
                </span>
                <h3 className="mt-3 font-display text-3xl text-ink-900">
                  Water Requirement
                </h3>
                <p className="mt-1 text-sm text-ink-500">
                  For {crop.name.toLowerCase()} · {area} {UNIT_LABEL[unit]}
                </p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-card">
                <Droplets className="h-5 w-5 text-aqua-500" strokeWidth={1.8} />
              </div>
            </div>

            {/* Big number — litres for ONE watering event right now */}
            <div className="px-6 py-7 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widex text-ink-400">
                {result.eventsNeeded === 0
                  ? "no watering needed"
                  : "this watering"}
              </p>
              <p className="mt-2 font-display text-[64px] font-semibold leading-none tracking-tightx text-ink-900">
                {(result.eventsNeeded === 0
                  ? 0
                  : result.litresPerEvent
                ).toLocaleString()}
              </p>
              <p className="mt-1 font-display text-sm font-semibold uppercase tracking-widex text-leaf-700">
                litres
              </p>
              {result.eventsNeeded > 0 && (
                <p className="mt-1 text-xs text-ink-500">
                  ≈ {result.litresPerM2PerEvent} л/м² за один полив
                </p>
              )}

              <div className="mt-5 grid grid-cols-2 gap-2 text-left">
                <Metric
                  icon={Droplets}
                  label="За один полив"
                  value={
                    result.eventsNeeded === 0
                      ? "0 L"
                      : `${result.litresPerEvent.toLocaleString()} L`
                  }
                />
                <Metric
                  icon={Gauge}
                  label="Поливов всего"
                  value={
                    result.eventsNeeded === 0
                      ? "—"
                      : `${result.eventsNeeded}×`
                  }
                />
                <Metric
                  icon={Clock}
                  label="Между поливами"
                  value={
                    result.hoursBetweenEvents > 0
                      ? `${result.hoursBetweenEvents} ч`
                      : "—"
                  }
                />
                <Metric
                  icon={Sprout}
                  label="Проверка датчика"
                  value={`${result.nextCheckHours} ч`}
                />
                <Metric
                  icon={Waves}
                  label="Дефицит влаги"
                  value={`${result.deficitPct.toFixed(1)} п.п.`}
                />
                <Metric
                  icon={Ruler}
                  label="Сезонная норма"
                  value={`${result.litres.toLocaleString()} L`}
                />
              </div>

              {result.eventsNeeded > 1 && (
                <div className="mt-5 rounded-xl border border-aqua-200 bg-aqua-50/60 px-4 py-3 text-left text-xs text-ink-700">
                  <p className="mb-1 font-display text-sm font-semibold text-ink-900">
                    План полива
                  </p>
                  <p>
                    Сейчас: <strong>{result.litresPerEvent.toLocaleString()} л</strong>{" "}
                    ({result.litresPerM2PerEvent} л/м²). Подождите{" "}
                    <strong>{result.hoursBetweenEvents} ч</strong>, чтобы вода
                    впиталась — затем повторите ещё{" "}
                    <strong>{result.eventsNeeded - 1}</strong>{" "}
                    {pluralPolivov(result.eventsNeeded - 1)}. После каждого
                    полива проверяйте датчик через{" "}
                    <strong>{result.nextCheckHours} ч</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Reasons */}
            <div className="border-t border-ink-100 bg-paper-alt/60 px-6 py-5">
              <p className="label-eyebrow">Agronomic notes</p>
              <ul className="mt-3 space-y-2.5">
                {result.reasons.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink-700">
                    {i === 0 && result.urgency === "none" ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-leaf-600" strokeWidth={2} />
                    ) : i === 0 ? (
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" strokeWidth={2} />
                    ) : (
                      <Leaf className="mt-0.5 h-4 w-4 flex-shrink-0 text-leaf-600" strokeWidth={2} />
                    )}
                    <span>{r}</span>
                  </li>
                ))}
              </ul>

              {(result.kPh !== 1 || result.kEc !== 1) && (
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono text-ink-500">
                  <div className="rounded-md border border-ink-100 bg-white px-2 py-1.5">
                    K<sub>pH</sub> = {result.kPh.toFixed(2)}
                  </div>
                  <div className="rounded-md border border-ink-100 bg-white px-2 py-1.5">
                    K<sub>EC</sub> = {result.kEc.toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-ink-100 bg-white px-6 py-4 sm:flex-row">
              <Link href="/chat" className="btn btn-primary flex-1 justify-center">
                Ask the agronomist
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
              <Link href="/dashboard" className="btn btn-ghost flex-1 justify-center">
                View live telemetry
              </Link>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-ink-400">
            Формула V = ΔW × D × ρ × S × K<sub>pH</sub> × K<sub>EC</sub> ·
            один полив ≤ 35 л/м² (FAO-56). Калибровка — 3 типа почв, 0.5 га,
            120 дней.
          </p>
        </div>
      </div>
    </main>
  );
}

function pluralPolivov(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "полив";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "полива";
  return "поливов";
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Droplets;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-3">
      <div className="flex items-center gap-1.5 text-ink-400">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
        <span className="text-[10px] uppercase tracking-widex">{label}</span>
      </div>
      <p className="mt-1 font-mono text-sm font-semibold text-ink-900">{value}</p>
    </div>
  );
}
