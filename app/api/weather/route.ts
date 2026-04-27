import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Query = {
  lat?: number;
  lon?: number;
  city?: string;
};

type DayForecast = {
  date: string;        // YYYY-MM-DD
  tMin: number;        // °C
  tMax: number;        // °C
  rainMm: number;
  wind: number;        // m/s
  humidity: number;    // %
  summary: string;
};

type Advice = {
  shouldIrrigateToday: boolean;
  reason: string;
  tipsRu: string[];
};

type Response = {
  place: string;
  country?: string;
  coords: { lat: number; lon: number };
  today: DayForecast;
  week: DayForecast[];
  advice: Advice;
  source: "openweathermap" | "demo";
};

/* ---- OpenWeatherMap response shapes (partial) ---- */
type OwmGeo = {
  name: string;
  lat: number;
  lon: number;
  country?: string;
};

type OwmForecastItem = {
  dt: number;
  main: { temp: number; temp_min: number; temp_max: number; humidity: number };
  weather: { description: string }[];
  wind: { speed: number };
  rain?: { "3h"?: number };
  dt_txt: string;
};

type OwmForecast = {
  list: OwmForecastItem[];
  city: { name: string; country?: string };
};

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`weather:${ip}`, { max: 30, windowMs: 60_000 })) {
    return NextResponse.json(
      { error: "Too many weather requests. Try again in a minute." },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(req.url);
  const q: Query = {
    lat: num(searchParams.get("lat")),
    lon: num(searchParams.get("lon")),
    city: searchParams.get("city")?.trim() || undefined,
  };

  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    return NextResponse.json(demoPayload());
  }

  try {
    let lat = q.lat;
    let lon = q.lon;
    let place = q.city ?? "";
    let country: string | undefined;

    if ((lat == null || lon == null) && q.city) {
      const geoUrl =
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q.city)}` +
        `&limit=1&appid=${apiKey}`;
      const gr = await fetch(geoUrl, { next: { revalidate: 3600 } });
      if (!gr.ok) {
        return NextResponse.json(
          { error: `Geocoding failed: ${gr.status}` },
          { status: 502 },
        );
      }
      const g = (await gr.json()) as OwmGeo[];
      if (!g.length) {
        return NextResponse.json({ error: "City not found" }, { status: 404 });
      }
      lat = g[0].lat;
      lon = g[0].lon;
      place = g[0].name;
      country = g[0].country;
    }

    // Default: Uralsk, Kazakhstan — the user's home city.
    if (lat == null || lon == null) {
      lat = 51.2333;
      lon = 51.3667;
      place = place || "Oral (Uralsk)";
      country = country || "KZ";
    }

    const url =
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}` +
      `&units=metric&appid=${apiKey}`;
    const r = await fetch(url, { next: { revalidate: 600 } });
    if (!r.ok) {
      return NextResponse.json(
        { error: `Forecast failed: ${r.status}` },
        { status: 502 },
      );
    }
    const data = (await r.json()) as OwmForecast;

    const week = aggregateDaily(data.list);
    const today = week[0];
    const advice = adviceFor(today, week);

    const payload: Response = {
      place: place || data.city.name,
      country: country ?? data.city.country,
      coords: { lat, lon },
      today,
      week,
      advice,
      source: "openweathermap",
    };
    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Weather call failed" },
      { status: 500 },
    );
  }
}

/* ---------- aggregation ---------- */

function aggregateDaily(items: OwmForecastItem[]): DayForecast[] {
  const groups = new Map<string, OwmForecastItem[]>();
  for (const it of items) {
    const day = it.dt_txt.slice(0, 10);
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(it);
  }

  const out: DayForecast[] = [];
  for (const [date, arr] of groups) {
    const tMin = Math.min(...arr.map((x) => x.main.temp_min));
    const tMax = Math.max(...arr.map((x) => x.main.temp_max));
    const rainMm = arr.reduce((s, x) => s + (x.rain?.["3h"] ?? 0), 0);
    const wind = avg(arr.map((x) => x.wind.speed));
    const humidity = Math.round(avg(arr.map((x) => x.main.humidity)));
    const summary = dominantDescription(arr);
    out.push({
      date,
      tMin: round1(tMin),
      tMax: round1(tMax),
      rainMm: round1(rainMm),
      wind: round1(wind),
      humidity,
      summary,
    });
  }
  return out.slice(0, 5);
}

function dominantDescription(items: OwmForecastItem[]): string {
  const count = new Map<string, number>();
  for (const i of items) {
    const d = i.weather?.[0]?.description ?? "—";
    count.set(d, (count.get(d) ?? 0) + 1);
  }
  let best = "—";
  let max = -1;
  for (const [d, c] of count) if (c > max) { best = d; max = c; }
  return best;
}

function adviceFor(today: DayForecast, week: DayForecast[]): Advice {
  const next48Rain = (today.rainMm ?? 0) + (week[1]?.rainMm ?? 0);
  const hot = today.tMax >= 30;
  const windy = today.wind >= 8;
  const tips: string[] = [];

  let shouldIrrigate = true;
  let reason = "Сегодня сухо — полив по норме.";

  if (next48Rain >= 8) {
    shouldIrrigate = false;
    reason = `Ожидается ${next48Rain.toFixed(1)} мм осадков за 48 ч — отложите полив.`;
  } else if (today.rainMm >= 3) {
    shouldIrrigate = false;
    reason = `Сегодня идёт дождь (${today.rainMm.toFixed(1)} мм) — полив не нужен.`;
  }

  if (hot) tips.push("Поливайте ранним утром или после заката — днём высокие потери на испарение.");
  if (windy) tips.push("Сильный ветер — откажитесь от дождевания, используйте капельный полив.");
  if (!hot && !windy && shouldIrrigate)
    tips.push("Условия благоприятные — стандартная норма по культуре.");
  if (!shouldIrrigate) tips.push("Проверьте дренаж — избыток влаги провоцирует гнили.");

  return { shouldIrrigateToday: shouldIrrigate, reason, tipsRu: tips };
}

/* ---------- helpers ---------- */

function num(v: string | null): number | undefined {
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function avg(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

/* ---------- demo fallback ---------- */

function demoPayload(): Response & { warning: string } {
  const today: DayForecast = {
    date: new Date().toISOString().slice(0, 10),
    tMin: 14,
    tMax: 26,
    rainMm: 0,
    wind: 3.5,
    humidity: 48,
    summary: "ясно",
  };
  const week: DayForecast[] = [
    today,
    { ...today, date: plusDays(1), tMax: 28, rainMm: 1.2, summary: "малооблачно" },
    { ...today, date: plusDays(2), tMax: 31, rainMm: 0, summary: "солнечно" },
    { ...today, date: plusDays(3), tMax: 24, rainMm: 6.4, summary: "дождь" },
    { ...today, date: plusDays(4), tMax: 22, rainMm: 2.1, summary: "облачно с прояснениями" },
  ];
  return {
    place: "Oral (Uralsk)",
    country: "KZ",
    coords: { lat: 51.2333, lon: 51.3667 },
    today,
    week,
    advice: adviceFor(today, week),
    source: "demo",
    warning: "OPENWEATHERMAP_API_KEY not configured — showing demo forecast.",
  };
}
function plusDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
