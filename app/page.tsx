import Link from "next/link";
import {
  ArrowUpRight,
  Beaker,
  Bot,
  Cpu,
  Droplets,
  Leaf,
  LineChart,
  Radio,
  Sprout,
  Thermometer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

export default function LandingPage() {
  return (
    <main>
      {/* ===================================================== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-halo" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] dot-wash opacity-40" />

        <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 gap-14 px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.15fr_1fr] lg:pt-28">
          <div>
            <span className="chip chip-leaf">
              <Sprout className="h-3 w-3" strokeWidth={2.2} />
              Precision agriculture · Kazakhstan
            </span>
            <h1 className="mt-6 font-display text-[44px] leading-[1.02] tracking-tightx text-ink-900 sm:text-[56px] lg:text-[64px]">
              Soil intelligence
              <br />
              for <span className="text-leaf-600">every farmer.</span>
            </h1>
            <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-ink-500 sm:text-lg">
              A portable ESP32 device and an AI agronomist that translate soil
              chemistry into precise, field-ready decisions — how much to water,
              what to plant, what risks are waking up under the ground.
              Built for the farms of Kazakhstan.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/connect" className="btn btn-primary">
                <Radio className="h-4 w-4" strokeWidth={2} />
                Connect Device
              </Link>
              <Link href="/irrigation" className="btn btn-ghost">
                Open Irrigation Calculator
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>

            {/* Trust bar — hard numbers from the SoilPlus research */}
            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { v: "35%",  l: "less water", icon: TrendingDown },
                { v: "+5.4%",  l: "yield gain", icon: TrendingUp   },
                { v: "±8.3%",  l: "vs. agronomist", icon: LineChart  },
                { v: "< 1",    l: "season payback", icon: Sprout     },
              ].map((s) => (
                <div
                  key={s.l}
                  className="rounded-xl border border-ink-100 bg-white px-4 py-3"
                >
                  <div className="flex items-center gap-2 text-leaf-600">
                    <s.icon className="h-4 w-4" strokeWidth={2} />
                    <span className="font-display text-xl font-semibold text-ink-900 sm:text-2xl">
                      {s.v}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-500">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual — live device mock */}
          <HeroDeviceMock />
        </div>

        {/* Divider strip — farmer stats */}
        <div className="relative border-y border-ink-100 bg-white">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-y-3 px-5 py-4 text-xs uppercase tracking-widex text-ink-400 sm:px-8">
            <span>ESP32 · Wi-Fi Station Mode</span>
            <span>4 sensors · 5 Hz stream</span>
            <span>12+ crops · calibrated norms</span>
            <span>Gemini 1.5 Flash · multilingual</span>
            <span>Field-tested · West Kazakhstan</span>
          </div>
        </div>
      </section>

      {/* ============================================== THREE-STEP FLOW === */}
      <section className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8">
        <div className="grid items-end gap-6 sm:grid-cols-[1fr_auto]">
          <div>
            <span className="label-eyebrow">How it works</span>
            <h2 className="mt-3 font-display text-4xl leading-[1.1] tracking-tightx text-ink-900 sm:text-5xl">
              Three screens.<br />One decision.
            </h2>
          </div>
          <p className="max-w-md text-ink-500">
            You plug the probe into the soil, click once, and SoilPlus delivers
            a measured recommendation — not raw data.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Connect",
              href:  "/connect",
              desc:  "Flash the ESP32, point it at your phone's hotspot, and paste the IP. A WebSocket on port 81 streams your live soil reading to any screen on your network.",
              icon:  Radio,
            },
            {
              step: "02",
              title: "Decide",
              href:  "/irrigation",
              desc:  "Choose your crop and plot size. The calculator fuses live chemistry with KazNIIZ + FAO-56 norms and returns the exact litres of water your field needs now.",
              icon:  Droplets,
            },
            {
              step: "03",
              title: "Converse",
              href:  "/chat",
              desc:  "Chat with the SoilPlus AI agronomist — it reads your live sensors, answers in your language, flags risks, and suggests what to plant on this soil.",
              icon:  Bot,
            },
          ].map((s) => (
            <Link
              href={s.href}
              key={s.step}
              className="card card-hover group relative flex flex-col gap-4 p-6 sm:p-7"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs uppercase tracking-widex text-ink-300">
                  {s.step}
                </span>
                <ArrowUpRight className="h-5 w-5 text-ink-300 transition group-hover:text-leaf-600 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-leaf-50 text-leaf-700">
                <s.icon className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <h3 className="font-display text-2xl text-ink-900">{s.title}</h3>
              <p className="text-sm leading-relaxed text-ink-500">{s.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ===================================================== CAPABILITIES */}
      <section className="bg-paper-alt">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-col justify-center">
            <span className="label-eyebrow">What it measures</span>
            <h2 className="mt-3 font-display text-4xl leading-[1.1] tracking-tightx text-ink-900 sm:text-5xl">
              The four numbers<br />that keep a field alive.
            </h2>
            <p className="mt-4 max-w-[52ch] text-ink-500">
              Our probe streams moisture, pH, salinity, and soil temperature in
              real time. Each one fails a crop in a different way — SoilPlus
              catches all four before they can.
            </p>
            <Link href="/dashboard" className="btn btn-primary mt-8 self-start">
              Open Live Dashboard
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                icon: Leaf,
                title: "Moisture",
                range: "0–100 %",
                accuracy: "±3.2 pp",
                blurb: "Capacitive probe — stable even on saline ground.",
              },
              {
                icon: Beaker,
                title: "pH",
                range: "0–14",
                accuracy: "±0.15 units",
                blurb: "Glass electrode with temperature compensation.",
              },
              {
                icon: Droplets,
                title: "Salinity (TDS/EC)",
                range: "0–5 000 µS/cm",
                accuracy: "±4.8 %",
                blurb: "Detects salt creep before it burns the roots.",
              },
              {
                icon: Thermometer,
                title: "Soil Temperature",
                range: "−10…+60 °C",
                accuracy: "±0.4 °C",
                blurb: "DS18B20 on 1-Wire — anchors evapotranspiration math.",
              },
            ].map((s) => (
              <div
                key={s.title}
                className="card flex flex-col gap-3 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-leaf-50 text-leaf-700">
                    <s.icon className="h-4 w-4" strokeWidth={1.8} />
                  </div>
                  <span className="chip chip-ghost">{s.range}</span>
                </div>
                <h3 className="font-display text-lg text-ink-900">{s.title}</h3>
                <p className="text-sm text-ink-500">{s.blurb}</p>
                <span className="mt-auto font-mono text-xs text-ink-400">
                  accuracy {s.accuracy}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================== CROP BANNER */}
      <section className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8">
        <div className="card relative overflow-hidden border-ink-100 bg-gradient-to-br from-leaf-50 via-white to-white p-8 sm:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <span className="label-eyebrow">Calibrated crop library</span>
              <h2 className="mt-3 font-display text-3xl leading-[1.1] tracking-tightx text-ink-900 sm:text-4xl">
                Wheat, cotton, tomato, alfalfa, Aport apple —<br />
                twelve crops, each with its own soil grammar.
              </h2>
              <p className="mt-4 max-w-xl text-ink-500">
                Every crop in the catalog carries its own bands for moisture,
                pH, salinity, and temperature — sourced from KazNIIZ norms and
                validated against field data. Pick one and the calculator does
                the rest.
              </p>
              <Link
                href="/irrigation"
                className="btn btn-primary mt-6 self-start"
              >
                Open Calculator
              </Link>
            </div>
            <div className="flex max-w-lg flex-wrap gap-2">
              {[
                "🌾 Wheat","🌻 Sunflower","🥔 Potato","🍅 Tomato","🌽 Corn",
                "🌱 Alfalfa","🌿 Cotton","🌾 Barley","🫘 Soybean",
                "🍎 Aport apple","🌷 Greig's tulip","🌲 Saxaul",
              ].map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-ink-100 bg-white px-3.5 py-1.5 text-sm text-ink-700 shadow-card"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================== CTA */}
      <section className="mx-auto max-w-[1280px] px-5 pb-24 pt-4 sm:px-8">
        <div className="card relative overflow-hidden bg-gradient-to-br from-ink-900 to-leaf-900 p-10 text-white sm:p-14">
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-leaf-500/30 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-aqua-500/20 blur-3xl" />
          <div className="relative grid items-center gap-6 sm:grid-cols-[1fr_auto]">
            <div>
              <span className="chip chip-leaf border-white/10 bg-white/10 text-white">
                <Cpu className="h-3 w-3" strokeWidth={2.2} />
                Ready in 90 seconds
              </span>
              <h2 className="mt-4 font-display text-3xl leading-[1.1] tracking-tightx sm:text-4xl">
                Bring your ESP32 online.<br />
                Let your soil speak.
              </h2>
              <p className="mt-3 max-w-xl text-white/70">
                Flash the firmware, join your phone&rsquo;s hotspot, paste the
                IP. Every page of SoilPlus will start reading your soil live.
              </p>
            </div>
            <Link
              href="/connect"
              className="btn inline-flex bg-white px-6 py-4 text-ink-900 shadow-soft hover:bg-ink-100"
            >
              Start Setup
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* --------------------------------------------------- Hero mock device --- */
function HeroDeviceMock() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[36px] bg-gradient-to-br from-leaf-100 via-white to-aqua-50 blur-2xl opacity-60" />
      <div className="relative">
        <div className="card overflow-hidden">
          {/* header row */}
          <div className="flex items-center justify-between border-b border-ink-100 bg-white px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-leaf-500/50" />
                <span className="relative h-2 w-2 rounded-full bg-leaf-500" />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-widex text-ink-500">
                soilplus · live
              </span>
            </div>
            <span className="font-mono text-[11px] text-ink-300">192.168.43.27 · 5 Hz</span>
          </div>

          {/* sensors row */}
          <div className="grid grid-cols-2 gap-px bg-ink-100 sm:grid-cols-4">
            {[
              { icon: Thermometer, label: "Temp",  value: "18.4",  unit: "°C",  tone: "text-leaf-600" },
              { icon: Beaker,      label: "pH",    value: "6.52",  unit: "",    tone: "text-leaf-600" },
              { icon: Droplets,    label: "TDS",   value: "412",   unit: "ppm", tone: "text-aqua-500" },
              { icon: Leaf,        label: "Moist", value: "57",    unit: "%",   tone: "text-leaf-600" },
            ].map((m) => (
              <div key={m.label} className="bg-white px-5 py-4">
                <div className="flex items-center gap-2 text-ink-400">
                  <m.icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                  <span className="text-[10px] font-semibold uppercase tracking-widex">
                    {m.label}
                  </span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1">
                  <span className={`font-display text-3xl font-semibold ${m.tone}`}>
                    {m.value}
                  </span>
                  <span className="text-xs text-ink-400">{m.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* chart area */}
          <div className="relative h-40 overflow-hidden bg-gradient-to-b from-white to-leaf-50/30">
            <svg viewBox="0 0 400 160" className="h-full w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="heroGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%"   stopColor="#2B7440" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#2B7440" stopOpacity={0} />
                </linearGradient>
              </defs>
              <path
                d="M0 110 C 40 95, 80 60, 120 68 S 200 40, 240 55 S 320 25, 400 45 L 400 160 L 0 160 Z"
                fill="url(#heroGrad)"
              />
              <path
                d="M0 110 C 40 95, 80 60, 120 68 S 200 40, 240 55 S 320 25, 400 45"
                fill="none"
                stroke="#2B7440"
                strokeWidth={2}
              />
            </svg>
          </div>

          {/* verdict strip */}
          <div className="flex items-center justify-between border-t border-ink-100 px-5 py-4">
            <div>
              <span className="chip chip-leaf">Viability · 84 / 100</span>
              <p className="mt-2 max-w-md text-xs text-ink-500">
                Loam holds within band for Almaty Aport apple; no irrigation needed in the next 24 h.
              </p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widex text-ink-300">
              Gemini 1.5
            </span>
          </div>
        </div>

        {/* sensor wire icon floating card */}
        <div className="absolute -right-3 -bottom-4 rotate-2 rounded-2xl border border-ink-100 bg-white p-3 shadow-card">
          <div className="flex items-center gap-2 text-ink-700">
            <Cpu className="h-4 w-4 text-leaf-600" strokeWidth={1.8} />
            <span className="text-xs font-semibold">ESP32 · WROOM-32</span>
          </div>
          <p className="mt-1 font-mono text-[10px] text-ink-400">4 probes · 12 h autonomy</p>
        </div>
      </div>
    </div>
  );
}
