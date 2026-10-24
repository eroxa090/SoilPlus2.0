"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Cloud, CloudRain, MapPin, Search, Sun } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";
import PageHeader from "@/components/PageHeader";
import { Reveal, Seeds, StaggerItem, StaggerList } from "@/components/motion/Motion";
import { WEATHER } from "@/lib/i18n/pages/weather";
import { apiErrorText } from "@/lib/i18n/errors";

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
  tips: string[];
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

export default function WeatherPage() {
  const { lang, t: tc } = useLang();
  const t = WEATHER[lang];
  const [city, setCity] = useState("");
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Last location query, so switching language refetches the same place.
  const lastQuery = useRef("");

  async function load(query = lastQuery.current) {
    lastQuery.current = query;
    setBusy(true);
    setError(null);
    try {
      const qs = new URLSearchParams(query);
      qs.set("lang", lang);
      const res = await fetch(`/api/weather?${qs}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(apiErrorText(lang, json, t.failed));
        return;
      }
      setData(json as WeatherResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.network);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const c = city.trim();
    if (!c) return;
    load(`city=${encodeURIComponent(c)}`);
  }

  function locate() {
    if (!navigator.geolocation) {
      setError(t.noGeo);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => load(`lat=${p.coords.latitude}&lon=${p.coords.longitude}`),
      () => setError(t.geoFailed),
    );
  }

  const fmtDay = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return `${t.dow[d.getDay()]} ${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-24 pt-10 sm:px-8">
      <PageHeader photo="steppe" home={tc.common.home} crumb={t.crumb} eyebrow={t.eyebrow} title={t.title} lead={t.lead} />

      <Reveal className="mt-8">
        <form onSubmit={onSearch} className="flex flex-wrap items-center gap-2 rounded-md border-2 border-ink-900/80 bg-white p-2 shadow-card">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 px-2">
            <Search className="h-4 w-4 text-ink-400" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t.placeholder}
              aria-label={t.placeholder}
              className="w-full bg-transparent py-2 text-ink-900 placeholder:text-ink-400 focus:outline-none"
            />
          </div>
          <button type="submit" disabled={busy} className="btn btn-primary">
            {t.search}
          </button>
          <button type="button" onClick={locate} className="btn btn-ghost">
            <MapPin className="h-4 w-4" strokeWidth={2.5} />
            {t.geo}
          </button>
        </form>
      </Reveal>

      {error && (
        <div role="alert" className="mt-4 flex items-start gap-2 rounded-md border-2 border-stamp-500/40 bg-rose-50 p-3 text-sm text-stamp-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {busy && !data && (
        <div className="mt-6 flex min-h-[240px] items-center justify-center rounded-md border-2 border-dashed border-ink-900/15">
          <Seeds className="scale-125 text-leaf-600" />
        </div>
      )}

      {data && (
        <div className={`mt-6 space-y-8 transition-opacity ${busy ? "opacity-60" : ""}`}>
          <Reveal className="stitch rounded-md bg-white p-7 shadow-soft sm:p-9">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <span className="chip chip-ghost">
                  <MapPin className="h-3 w-3" />
                  {data.place}
                  {data.country ? `, ${data.country}` : ""}
                  {data.source === "demo" && <span className="text-amber-600">· {t.demo}</span>}
                </span>
                <h2 className="mt-3 text-3xl uppercase text-ink-900">
                  {t.today}: {data.today.summary}
                </h2>
                <p className="mt-1 font-mono text-sm text-ink-500">{fmtDay(data.today.date)}</p>
              </div>
              <div className="flex items-center gap-4">
                {(() => {
                  const Icon = iconFor(data.today.summary, data.today.rainMm);
                  return <Icon className="h-14 w-14 text-amber-500" strokeWidth={1.75} />;
                })()}
                <div>
                  <p className="font-display text-6xl font-semibold leading-none text-ink-900">{data.today.tMax.toFixed(0)}°</p>
                  <p className="mt-1 font-mono text-xs text-ink-500">
                    {t.min} {data.today.tMin.toFixed(0)}°
                  </p>
                </div>
              </div>
            </div>

            <dl className="mt-7 grid gap-px overflow-hidden rounded-md border-2 border-ink-900/10 bg-ink-900/10 sm:grid-cols-3">
              {[
                [t.rain, `${data.today.rainMm.toFixed(1)} ${t.mm}`],
                [t.wind, `${data.today.wind.toFixed(1)} ${t.ms}`],
                [t.humidity, `${data.today.humidity}%`],
              ].map(([k, v]) => (
                <div key={k} className="bg-paper p-4">
                  <dt className="font-display text-xs uppercase tracking-[0.12em] text-ink-500">{k}</dt>
                  <dd className="mt-1 font-mono text-xl text-ink-900">{v}</dd>
                </div>
              ))}
            </dl>

            <div
              className={`mt-6 rounded-md border-l-4 p-5 ${
                data.advice.shouldIrrigateToday ? "border-leaf-600 bg-leaf-50" : "border-aqua-500 bg-aqua-50"
              }`}
            >
              <p
                className={`inline-block -rotate-2 rounded-sm border-[3px] border-double px-2.5 py-1 font-stamp text-sm uppercase ${
                  data.advice.shouldIrrigateToday ? "border-leaf-600 text-leaf-700" : "border-aqua-500 text-aqua-600"
                }`}
              >
                {data.advice.shouldIrrigateToday ? t.water : t.noWater}
              </p>
              <p className="mt-3 text-ink-900">{data.advice.reason}</p>
              {data.advice.tips.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
                  {data.advice.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-500" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {data.warning && (
              <p className="mt-4 flex items-start gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-600">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{data.warning}</span>
              </p>
            )}
          </Reveal>

          <section>
            <h2 className="label-eyebrow mb-4">{t.nextDays}</h2>
            <StaggerList className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {data.week.map((d) => {
                const Icon = iconFor(d.summary, d.rainMm);
                return (
                  <StaggerItem key={d.date} className="card card-hover p-4 text-center">
                    <p className="font-display text-sm uppercase tracking-wide text-ink-500">{fmtDay(d.date)}</p>
                    <Icon className="mx-auto mt-3 h-8 w-8 text-amber-500" strokeWidth={1.75} />
                    <p className="mt-2 font-display text-2xl font-semibold text-ink-900">{d.tMax.toFixed(0)}°</p>
                    <p className="font-mono text-xs text-ink-500">{d.tMin.toFixed(0)}°</p>
                    <p className="mt-2 flex items-center justify-center gap-1 font-mono text-xs text-aqua-600">
                      <CloudRain className="h-3 w-3" />
                      {d.rainMm.toFixed(1)} {t.mm}
                    </p>
                  </StaggerItem>
                );
              })}
            </StaggerList>
          </section>

          <div className="flex flex-wrap gap-3">
            <Link href="/irrigation" className="btn btn-primary group">
              {t.calc}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
            </Link>
            <Link href="/forecast" className="btn btn-ghost">
              {t.forecast}
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
