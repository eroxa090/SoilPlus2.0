"use client";

import { useSensor } from "@/components/SensorProvider";
import { useLang } from "@/components/LanguageProvider";
import { AnimatedNumber } from "@/components/motion/Motion";
import type { SoilReading } from "@/hooks/useSoilSocket";

/**
 * Hero "reading tag" on the landing page — a manila tag tied to the sack.
 * Shows the live ESP32 reading when a board is connected, otherwise a
 * labelled sample.
 */

const SAMPLE: SoilReading = { moist: 57, ph: 6.52, tds: 412, temp: 18.4 };

// Generic loam reference bands — only used to draw the ruler.
const ROWS: {
  key: keyof SoilReading;
  label: "moist" | "ph" | "tds" | "temp";
  unit: string;
  digits: number;
  scale: [number, number];
  band: [number, number];
}[] = [
  { key: "moist", label: "moist", unit: "%",   digits: 0, scale: [0, 100],  band: [40, 70] },
  { key: "ph",    label: "ph",    unit: "",    digits: 2, scale: [4, 9],    band: [6, 7.5] },
  { key: "tds",   label: "tds",   unit: "ppm", digits: 0, scale: [0, 1500], band: [200, 800] },
  { key: "temp",  label: "temp",  unit: "°C",  digits: 1, scale: [-5, 40],  band: [10, 25] },
];

const pct = (v: number, [lo, hi]: [number, number]) =>
  Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100));

// Tag silhouette: top corners clipped
const TAG_SHAPE = "polygon(18% 0, 82% 0, 100% 9%, 100% 100%, 0 100%, 0 9%)";

export default function ReadingSheet() {
  const { status, latest, ip } = useSensor();
  const { t, lang } = useLang();
  const s = t.home.sheet;

  const live = status === "connected" && !!latest;
  const reading = live ? latest! : SAMPLE;
  const locale = lang === "ru" ? "ru-RU" : "en-US";

  return (
    <div className="relative mx-auto w-full max-w-[400px] pt-14 lg:mx-0 lg:justify-self-end">
      {/* twine the tag hangs from */}
      <svg className="absolute left-1/2 top-0 h-[84px] w-40 -translate-x-1/2" viewBox="0 0 160 84" aria-hidden>
        <path d="M30 0 C 60 30, 70 60, 80 78 M130 0 C 100 30, 90 60, 80 78" fill="none" stroke="#2A1F14" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" />
        <path d="M30 0 C 60 30, 70 60, 80 78 M130 0 C 100 30, 90 60, 80 78" fill="none" stroke="#E9D3A0" strokeWidth="2.25" strokeLinecap="round" />
      </svg>

      <div className="animate-swing drop-shadow-[6px_8px_0_rgba(42,31,20,0.22)]">
        <article
          className="tag-hole relative bg-[#E9D3A0] px-7 pb-7 pt-14 text-ink-900"
          style={{ clipPath: TAG_SHAPE, backgroundImage: "var(--grain-soft)", backgroundBlendMode: "multiply" }}
        >
          <header className="flex items-end justify-between gap-3 border-b-2 border-ink-900 pb-2">
            <div>
              <h2 className="text-2xl uppercase tracking-wide">{s.title}</h2>
              <p className="font-mono text-[11px] text-ink-500">{live ? `${ip} · ${s.device}` : s.device}</p>
            </div>
            <span className={`chip ${live ? "chip-leaf" : "text-stamp-500"}`}>
              {live && <span className="h-1.5 w-1.5 animate-breath rounded-full bg-leaf-500" />}
              {live ? s.live : s.sample}
            </span>
          </header>

          <dl className="mt-1">
            {ROWS.map((r) => {
              const v = reading[r.key];
              const lo = pct(r.band[0], r.scale);
              const hi = pct(r.band[1], r.scale);
              const at = pct(v, r.scale);
              const inBand = v >= r.band[0] && v <= r.band[1];
              return (
                <div key={r.key} className="border-b border-dashed border-ink-900/25 py-3">
                  <div className="flex items-baseline justify-between">
                    <dt className="font-display text-base tracking-wide text-ink-700">{s[r.label]}</dt>
                    <dd className="font-mono text-ink-900">
                      <AnimatedNumber value={v} locale={locale} decimals={r.digits} className="text-[26px] leading-none" />
                      {r.unit && <span className="ml-1 text-xs text-ink-500">{r.unit}</span>}
                    </dd>
                  </div>
                  <div className="relative mt-2 h-2 border border-ink-900/40 bg-[#F3E4BE]" aria-hidden>
                    <div className="absolute inset-y-0 bg-leaf-300/70" style={{ left: `${lo}%`, width: `${hi - lo}%` }} />
                    <div
                      className={`absolute -top-1 h-4 w-[3px] -translate-x-1/2 transition-[left] duration-500 ${
                        inBand ? "bg-leaf-800" : "bg-stamp-500"
                      }`}
                      style={{ left: `${at}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </dl>

          {/* The agronomist's note is sample copy — hide it over live data */}
          {!live && (
            <footer className="mt-4">
              <p className="font-hand text-[22px] font-medium leading-tight text-leaf-800">{s.note}</p>
              <p className="mt-1 font-mono text-[11px] text-ink-500">— {s.signed}</p>
            </footer>
          )}
        </article>
      </div>
    </div>
  );
}
