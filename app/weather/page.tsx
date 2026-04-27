"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CloudRain,
  Cloud,
  Droplets,
  Loader2,
  MapPin,
  Search,
  Sun,
  Wind,
} from "lucide-react";

type DayForecast = {
  date: string;
  tMin: number;
  tMax: number;
  rainMm: number;
  wind: number;
  humidity: number;
  summary: string;
};

type Advice = {
  shouldIrrigateToday: boolean;
  reason: string;
  tipsRu: string[];
};

type WeatherResponse = {
  place: string;
  country?: string;
  coords: { lat: number; lon: number };
  today: DayForecast;
  week: DayForecast[];
  advice: Advice;
  source: "openweathermap" | "demo";
  warning?: string;
};

function iconFor(summary: string, rain: number): typeof Sun {
  const s = summary.toLowerCase();
  if (rain >= 1 || s.includes("дожд") || s.includes("rain")) return CloudRain;
  if (s.includes("облач") || s.includes("cloud")) return Cloud;
  return Sun;
}

const DOW = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
function fmtDay(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${DOW[d.getDay()]} ${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function WeatherPage() {
  const [city, setCity] = useState("");
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(qs = "") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather${qs}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "Не удалось получить погоду.");
        return;
      }
      setData(json as WeatherResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Сетевая ошибка");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const c = city.trim();
    if (!c) return;
    load(`?city=${encodeURIComponent(c)}`);
  }

  function useGeo() {
    if (!navigator.geolocation) {
      setError("Геолокация недоступна в этом браузере.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => load(`?lat=${p.coords.latitude}&lon=${p.coords.longitude}`),
      () => setError("Не удалось получить геолокацию."),
    );
  }

  return (
    <main className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14">
      <section className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-leaf-200 bg-leaf-50 px-3 py-1 text-xs font-medium text-leaf-700">
          <CloudRain className="h-3.5 w-3.5" />
          Weather-aware Irrigation
        </div>
        <h1 className="mt-4 font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
          Умный график полива
        </h1>
        <p className="mt-3 max-w-2xl text-ink-600">
          Прогноз на 5 дней и рекомендация — поливать сегодня или отложить.
          Считаем осадки, температуру, ветер и влажность воздуха.
        </p>
      </section>

      <form
        onSubmit={onSearch}
        className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-ink-100 bg-white p-3 shadow-sm"
      >
        <div className="flex flex-1 items-center gap-2 px-2">
          <Search className="h-4 w-4 text-ink-400" />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Город (например, Алматы, Атырау, Уральск)"
            className="w-full bg-transparent py-1.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
          />
        </div>
        <button type="submit" disabled={busy} className="btn btn-primary">
          Поиск
        </button>
        <button type="button" onClick={useGeo} className="btn btn-ghost">
          <MapPin className="h-4 w-4" />
          Моя геолокация
        </button>
      </form>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {busy && !data && (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-ink-100 bg-white">
          <Loader2 className="h-6 w-6 animate-spin text-leaf-600" />
        </div>
      )}

      {data && <WeatherView data={data} />}
    </main>
  );
}

function WeatherView({ data }: { data: WeatherResponse }) {
  const TodayIcon = iconFor(data.today.summary, data.today.rainMm);
  const adv = data.advice;
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-white px-2.5 py-0.5 text-xs text-ink-500">
              <MapPin className="h-3 w-3" />
              {data.place}
              {data.country ? `, ${data.country}` : ""}
              {data.source === "demo" && (
                <span className="ml-1 font-mono text-[10px] text-amber-600">
                  demo
                </span>
              )}
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink-900">
              Сегодня: {data.today.summary}
            </h2>
            <div className="mt-1 text-sm text-ink-500">
              {fmtDay(data.today.date)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TodayIcon className="h-12 w-12 text-leaf-600" />
            <div>
              <div className="font-display text-3xl font-semibold text-ink-900">
                {data.today.tMax.toFixed(0)}°
              </div>
              <div className="text-xs text-ink-500">
                мин {data.today.tMin.toFixed(0)}°
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Stat icon={CloudRain} label="Осадки" value={`${data.today.rainMm.toFixed(1)} мм`} />
          <Stat icon={Wind} label="Ветер" value={`${data.today.wind.toFixed(1)} м/с`} />
          <Stat icon={Droplets} label="Влажность воздуха" value={`${data.today.humidity}%`} />
        </div>

        <div
          className={`mt-5 rounded-xl border p-4 ${
            adv.shouldIrrigateToday
              ? "border-leaf-200 bg-leaf-50"
              : "border-sky-200 bg-sky-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                adv.shouldIrrigateToday ? "bg-leaf-500" : "bg-sky-500"
              }`}
            />
            <span className="font-display text-sm font-semibold uppercase tracking-wide text-ink-800">
              {adv.shouldIrrigateToday ? "Поливать сегодня" : "Полив не нужен"}
            </span>
          </div>
          <p className="mt-2 text-sm text-ink-800">{adv.reason}</p>
          {adv.tipsRu.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-ink-700">
              {adv.tipsRu.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-400" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {data.warning && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{data.warning}</span>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-ink-700">
          Ближайшие 5 дней
        </h3>
        <div className="grid gap-3 sm:grid-cols-5">
          {data.week.map((d) => {
            const Icon = iconFor(d.summary, d.rainMm);
            return (
              <div
                key={d.date}
                className="rounded-xl border border-ink-100 bg-white p-4 text-center shadow-sm"
              >
                <div className="text-xs text-ink-500">{fmtDay(d.date)}</div>
                <Icon className="mx-auto mt-2 h-7 w-7 text-leaf-600" />
                <div className="mt-2 font-display text-lg font-semibold text-ink-900">
                  {d.tMax.toFixed(0)}°
                </div>
                <div className="text-xs text-ink-500">{d.tMin.toFixed(0)}°</div>
                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-ink-500">
                  <CloudRain className="h-3 w-3" />
                  {d.rainMm.toFixed(1)} мм
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/irrigation" className="btn btn-primary">
          Рассчитать норму полива
        </Link>
        <Link href="/forecast" className="btn btn-ghost">
          Прогноз урожая
        </Link>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Sun;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-3">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-leaf-50 text-leaf-600">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-xs text-ink-500">{label}</div>
        <div className="font-display text-sm font-semibold text-ink-900">
          {value}
        </div>
      </div>
    </div>
  );
}
