"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Radio,
  Sparkles,
  TrendingUp,
  Wheat,
} from "lucide-react";
import { useSensor } from "@/components/SensorProvider";
import { CROPS } from "@/lib/crops";

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
const UNIT_LABEL: Record<AreaUnit, string> = {
  m2: "m²",
  sot: "сот.",
  ha: "га",
};

const OUTLOOK: Record<
  Forecast["outlook"],
  { label: string; pill: string }
> = {
  ok: {
    label: "Благоприятный прогноз",
    pill: "bg-leaf-50 text-leaf-700 border-leaf-200",
  },
  marginal: {
    label: "На грани — есть риски",
    pill: "bg-amber-50 text-amber-700 border-amber-200",
  },
  risky: {
    label: "Высокий риск потерь",
    pill: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export default function ForecastPage() {
  const { latest, status } = useSensor();
  const [cropId, setCropId] = useState("wheat");
  const [area, setArea] = useState(100);
  const [unit, setUnit] = useState<AreaUnit>("sot");
  const [region, setRegion] = useState("Западно-Казахстанская обл., Уральск");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Forecast | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const crop = useMemo(() => CROPS.find((c) => c.id === cropId), [cropId]);
  const areaM2 = area * UNIT_TO_M2[unit];
  const hasReading = Boolean(latest);

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
          reading: latest
            ? {
                temp: latest.temp,
                ph: latest.ph,
                tds: latest.tds,
                moist: latest.moist,
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Не удалось рассчитать прогноз.");
        return;
      }
      setResult(data.forecast as Forecast);
      setModel(data.model ?? null);
      if (data.warning) setWarning(data.warning);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Сетевая ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14">
      <section className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-leaf-200 bg-leaf-50 px-3 py-1 text-xs font-medium text-leaf-700">
          <TrendingUp className="h-3.5 w-3.5" />
          AI Yield Forecast
        </div>
        <h1 className="mt-4 font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
          Прогноз урожая
        </h1>
        <p className="mt-3 max-w-2xl text-ink-600">
          Выберите культуру, площадь и регион — SoilPlus рассчитает ожидаемый
          урожай, покажет риски и конкретные действия, которые поднимут выход.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* INPUT */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
              <Wheat className="h-5 w-5 text-leaf-600" />
              Параметры поля
            </h2>

            <label className="mb-4 block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">
                Культура
              </span>
              <select
                value={cropId}
                onChange={(e) => setCropId(e.target.value)}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-leaf-500 focus:outline-none focus:ring-2 focus:ring-leaf-200"
              >
                {CROPS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.nameRu} — {c.name}
                  </option>
                ))}
              </select>
              {crop && (
                <p className="mt-2 text-xs text-ink-500">{crop.note}</p>
              )}
            </label>

            <div className="mb-4 grid grid-cols-3 gap-2">
              <label className="col-span-2 block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">
                  Площадь
                </span>
                <input
                  type="number"
                  min={0}
                  value={area}
                  onChange={(e) => setArea(Number(e.target.value))}
                  className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-leaf-500 focus:outline-none focus:ring-2 focus:ring-leaf-200"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">
                  Ед.
                </span>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as AreaUnit)}
                  className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-leaf-500 focus:outline-none focus:ring-2 focus:ring-leaf-200"
                >
                  {(Object.keys(UNIT_LABEL) as AreaUnit[]).map((u) => (
                    <option key={u} value={u}>
                      {UNIT_LABEL[u]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mb-4 block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">
                Регион
              </span>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                maxLength={80}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-leaf-500 focus:outline-none focus:ring-2 focus:ring-leaf-200"
              />
            </label>

            <label className="mb-4 block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">
                Заметка (необязательно)
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Сорт, предшественник, болезни в прошлом сезоне…"
                className="w-full resize-none rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-leaf-500 focus:outline-none focus:ring-2 focus:ring-leaf-200"
              />
            </label>

            {/* Sensor status */}
            <div
              className={`mb-4 flex items-start gap-2 rounded-lg border p-3 text-xs ${
                hasReading
                  ? "border-leaf-200 bg-leaf-50 text-leaf-800"
                  : "border-ink-100 bg-ink-50 text-ink-600"
              }`}
            >
              <Radio className="mt-0.5 h-4 w-4 shrink-0" />
              {hasReading ? (
                <span>
                  Используем живое показание ESP32: влажность {latest!.moist}%,
                  pH {latest!.ph.toFixed(2)}, EC {latest!.tds}, T{" "}
                  {latest!.temp.toFixed(1)}°C
                </span>
              ) : (
                <span>
                  Датчик не подключён — прогноз будет по нормативам культуры.
                  Подключите{" "}
                  <Link href="/connect" className="underline">
                    ESP32
                  </Link>{" "}
                  для точности.
                </span>
              )}
            </div>

            {error && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={submit}
              disabled={busy || !crop || areaM2 <= 0}
              className="btn btn-primary w-full"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Считаем…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Рассчитать прогноз
                </>
              )}
            </button>
          </div>
        </div>

        {/* OUTPUT */}
        <div className="lg:col-span-3">
          {!result && !busy && (
            <EmptyState />
          )}
          {busy && <Loading />}
          {result && (
            <ResultView
              forecast={result}
              model={model}
              warning={warning}
              areaM2={areaM2}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white/50 p-8 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-leaf-50 text-leaf-600">
        <TrendingUp className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">
        Готов к расчёту
      </h3>
      <p className="mt-2 max-w-sm text-sm text-ink-500">
        Заполните форму слева. Если есть подключённый ESP32, текущие показатели
        почвы учтутся автоматически.
      </p>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-ink-100 bg-white p-8 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-leaf-600" />
      <p className="mt-4 font-medium text-ink-900">Модель считает урожай…</p>
      <p className="mt-1 text-sm text-ink-500">3–6 секунд.</p>
    </div>
  );
}

function ResultView({
  forecast,
  model,
  warning,
  areaM2,
}: {
  forecast: Forecast;
  model: string | null;
  warning: string | null;
  areaM2: number;
}) {
  const o = OUTLOOK[forecast.outlook];
  const tonnes = forecast.yieldTotalKg / 1000;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${o.pill}`}
          >
            {forecast.outlook === "ok" ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <AlertTriangle className="h-3 w-3" />
            )}
            {o.label}
          </span>
          {model && (
            <span className="rounded-full border border-ink-100 bg-white px-2 py-0.5 font-mono text-[10px] text-ink-500">
              {model}
            </span>
          )}
        </div>

        <h2 className="mt-3 font-display text-2xl font-semibold text-ink-900">
          {forecast.cropName}
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Metric
            label="Урожайность"
            value={forecast.yieldPerHa.toLocaleString("ru-RU")}
            unit="кг/га"
          />
          <Metric
            label={`На ${areaM2.toLocaleString("ru-RU")} м²`}
            value={
              tonnes >= 1
                ? tonnes.toFixed(2)
                : forecast.yieldTotalKg.toLocaleString("ru-RU")
            }
            unit={tonnes >= 1 ? "тонн" : "кг"}
          />
          <Metric
            label="Соответствие"
            value={String(forecast.fitness)}
            unit="%"
          />
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-ink-500">
          <span>Уверенность модели:</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-leaf-500"
              style={{ width: `${forecast.confidence}%` }}
            />
          </div>
          <span className="font-mono text-ink-700">{forecast.confidence}%</span>
        </div>

        {forecast.notes && (
          <p className="mt-4 rounded-lg bg-ink-50 p-3 text-sm text-ink-700">
            {forecast.notes}
          </p>
        )}
        {warning && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{warning}</span>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ListCard
          title="Риски"
          items={forecast.risks}
          emptyHint="Критичных рисков не обнаружено"
          tone="warn"
        />
        <ListCard
          title="Как поднять урожай"
          items={forecast.boosters}
          emptyHint="Поддерживайте текущий режим"
          tone="leaf"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/irrigation" className="btn btn-primary">
          <ArrowRight className="h-4 w-4" />
          Рассчитать полив
        </Link>
        <Link href="/chat" className="btn btn-ghost">
          <Sparkles className="h-4 w-4" />
          Спросить AI-агронома
        </Link>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-display text-2xl font-semibold text-ink-900">
          {value}
        </span>
        <span className="text-xs text-ink-500">{unit}</span>
      </div>
    </div>
  );
}

function ListCard({
  title,
  items,
  emptyHint,
  tone,
}: {
  title: string;
  items: string[];
  emptyHint: string;
  tone: "warn" | "leaf";
}) {
  const dot = tone === "warn" ? "bg-amber-500" : "bg-leaf-500";
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
      <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-ink-700">
        {title}
      </h3>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-800">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-500">{emptyHint}</p>
      )}
    </div>
  );
}
