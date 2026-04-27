"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CircuitBoard,
  Copy,
  Cpu,
  Radio,
  Terminal,
  Wifi,
} from "lucide-react";
import { useSensor } from "@/components/SensorProvider";

const STEPS = [
  { n: 1, title: "Flash firmware",  subtitle: "Upload soilplus.ino to your ESP32" },
  { n: 2, title: "Join hotspot",    subtitle: "Connect the device to your phone's Wi-Fi" },
  { n: 3, title: "Paste IP",        subtitle: "Read the IP from Serial Monitor and paste it below" },
  { n: 4, title: "Go live",         subtitle: "Open the dashboard — all pages will see your soil" },
];

export default function ConnectPage() {
  const { ip, setIp, status, connect, close, error, latest } = useSensor();
  const [draft, setDraft] = useState(ip);
  const [copied, setCopied] = useState(false);

  useEffect(() => setDraft(ip), [ip]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = draft.trim();
    if (!clean) return;
    setIp(clean);
    connect(clean);
  };

  const copySSID = async () => {
    try {
      await navigator.clipboard.writeText("SoilPlus_Hotspot");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {/* ignore */}
  };

  const currentStep =
    status === "connected" ? 4
    : ip ? 3
    : 1;

  return (
    <main className="mx-auto max-w-[1100px] px-5 pb-24 pt-10 sm:px-8">
      {/* Header */}
      <div className="flex items-center gap-2 text-ink-500">
        <Link href="/" className="text-sm text-ink-400 hover:text-leaf-700">Home</Link>
        <span className="text-ink-300">/</span>
        <span className="text-sm text-ink-700">Connect</span>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="label-eyebrow">Device Setup</span>
          <h1 className="mt-2 font-display text-4xl tracking-tightx text-ink-900 sm:text-5xl">
            Bring your ESP32 online.
          </h1>
          <p className="mt-3 max-w-xl text-ink-500">
            Four small steps. Once the probe is broadcasting, every page of
            SoilPlus reads the same live stream — no extra setup.
          </p>
        </div>
        <StatusBadge status={status} ip={ip} />
      </div>

      {/* Progress */}
      <ol className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {STEPS.map((s) => {
          const done = currentStep > s.n;
          const active = currentStep === s.n;
          return (
            <li key={s.n} className="card p-5">
              <div className="flex items-center gap-3">
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                    done
                      ? "bg-leaf-600 text-white"
                      : active
                        ? "bg-leaf-50 text-leaf-700 ring-2 ring-leaf-300"
                        : "bg-ink-100 text-ink-500"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : s.n}
                </span>
                <p className="font-display text-base font-semibold text-ink-900">
                  {s.title}
                </p>
              </div>
              <p className="mt-2 text-xs text-ink-500">{s.subtitle}</p>
            </li>
          );
        })}
      </ol>

      {/* Main grid */}
      <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
        {/* Form + pinout */}
        <div className="card p-7 sm:p-8">
          <form onSubmit={onSubmit}>
            <label htmlFor="ip" className="label-eyebrow">
              ESP32 IP address
            </label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                id="ip"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="192.168.43.27"
                className="input font-mono text-base"
              />
              <button type="submit" className="btn btn-primary">
                <Radio className="h-4 w-4" strokeWidth={2} />
                Connect
              </button>
              {ip && status !== "closed" && (
                <button
                  type="button"
                  onClick={close}
                  className="btn btn-ghost"
                >
                  Disconnect
                </button>
              )}
            </div>
            {error && (
              <p className="mt-3 flex items-center gap-2 text-sm text-rose-600">
                <AlertCircle className="h-4 w-4" /> {error}
              </p>
            )}
          </form>

          <hr className="my-7 border-ink-100" />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="font-display text-lg font-semibold text-ink-900">
                Phone hotspot settings
              </h3>
              <p className="mt-1 text-sm text-ink-500">
                In the firmware the SSID defaults to{" "}
                <code className="rounded bg-ink-100/80 px-1 py-0.5 font-mono text-[12px]">
                  SoilPlus_Hotspot
                </code>
                . Match both on your phone.
              </p>
              <button
                onClick={copySSID}
                className="btn btn-ghost mt-3 text-xs"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy SSID"}
              </button>
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-ink-900">
                Where to find the IP
              </h3>
              <p className="mt-1 text-sm text-ink-500">
                Open Arduino Serial Monitor at{" "}
                <code className="rounded bg-ink-100/80 px-1 py-0.5 font-mono text-[12px]">115200 baud</code>.
                After the &ldquo;WiFi Connected!&rdquo; banner the IP will be printed.
              </p>
            </div>
          </div>

          <hr className="my-7 border-ink-100" />

          {/* Pinout */}
          <h3 id="firmware" className="font-display text-lg font-semibold text-ink-900">
            Wiring · pinout
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              ["pH analog out",    "GPIO 35"],
              ["TDS analog out",   "GPIO 32"],
              ["DS18B20 (1-Wire)", "GPIO 4"],
              ["Soil moisture",    "GPIO 33"],
            ].map(([l, p]) => (
              <div
                key={p}
                className="flex items-center justify-between rounded-lg border border-ink-100 bg-paper-alt px-3 py-2.5"
              >
                <span className="flex items-center gap-2 text-sm text-ink-700">
                  <CircuitBoard className="h-3.5 w-3.5 text-leaf-600" />
                  {l}
                </span>
                <span className="font-mono text-xs text-ink-500">{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live preview */}
        <div className="card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-ink-100 bg-white px-5 py-3">
            <span className="flex items-center gap-2 text-xs uppercase tracking-widex text-ink-500">
              <Terminal className="h-3.5 w-3.5" /> Live preview
            </span>
            <StatusBadge status={status} ip={ip} compact />
          </div>
          <div className="bg-paper-alt p-5">
            {latest ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Temp",     v: `${latest.temp.toFixed(1)} °C`, },
                  { label: "pH",       v: latest.ph.toFixed(2), },
                  { label: "TDS",      v: `${latest.tds} ppm`, },
                  { label: "Moisture", v: `${latest.moist} %`, },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl border border-ink-100 bg-white p-4"
                  >
                    <p className="text-[10px] uppercase tracking-widex text-ink-400">
                      {m.label}
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold text-ink-900">
                      {m.v}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-ink-100 text-ink-400">
                  <Wifi className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <p className="mt-4 font-display text-lg text-ink-900">
                  Waiting for the first packet…
                </p>
                <p className="mt-1 max-w-xs text-sm text-ink-500">
                  Once connected, readings will appear here within 200 ms.
                </p>
              </div>
            )}
          </div>
          {latest && (
            <div className="border-t border-ink-100 bg-white px-5 py-4">
              <Link
                href="/dashboard"
                className="btn btn-primary w-full justify-center"
              >
                Open live dashboard
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Calibration note */}
      <div id="calibration" className="card mt-10 p-7 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <Cpu className="h-4 w-4" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-900">
              Calibration before first field use
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-ink-500">
              pH with buffer solutions at 4.0, 7.0 and 10.0 (GOST 8.135-2004).
              TDS with a standard KCl solution. Moisture with gravimetric soil
              samples dried at 105 °C. The firmware constants
              <code className="mx-1 rounded bg-ink-100 px-1 py-0.5 font-mono text-[12px]">PH_SLOPE</code>,
              <code className="mx-1 rounded bg-ink-100 px-1 py-0.5 font-mono text-[12px]">MOIST_DRY</code>,
              and <code className="mx-1 rounded bg-ink-100 px-1 py-0.5 font-mono text-[12px]">MOIST_WET</code>
              should be tuned to your soil before running the calculator.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ================================================================ */
function StatusBadge({
  status,
  ip,
  compact = false,
}: {
  status: ReturnType<typeof useSensor>["status"];
  ip: string;
  compact?: boolean;
}) {
  const MAP = {
    idle:         { label: "Standby",      color: "chip-ghost" },
    connecting:   { label: "Connecting",   color: "chip-aqua"  },
    connected:    { label: "Online",       color: "chip-leaf"  },
    reconnecting: { label: "Reconnecting", color: "chip-amber" },
    error:        { label: "Fault",        color: "chip-amber" },
    closed:       { label: "Offline",      color: "chip-ghost" },
  } as const;
  const s = MAP[status];
  return (
    <div className={`flex items-center gap-2 ${compact ? "" : ""}`}>
      <span className={`chip ${s.color}`}>
        {status === "connected" && (
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-leaf-500/70" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-leaf-500" />
          </span>
        )}
        {s.label}
      </span>
      {!compact && ip && (
        <span className="font-mono text-[11px] text-ink-400">{ip}</span>
      )}
    </div>
  );
}
