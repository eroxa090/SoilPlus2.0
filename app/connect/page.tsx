"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, ArrowRight, Check, Copy, Radio, Wifi } from "lucide-react";
import { useSensor } from "@/components/SensorProvider";
import { useLang } from "@/components/LanguageProvider";
import PageHeader from "@/components/PageHeader";
import { Reveal, SewLine, StaggerItem, StaggerList } from "@/components/motion/Motion";
import { CONNECT } from "@/lib/i18n/pages/connect";

// Must match SOILPLUS_WIFI_SSID in firmware/soilplus/secrets.h (gitignored)
const HOTSPOT_SSID = "iPhoneyers";

export default function ConnectPage() {
  const { ip, setIp, status, connect, close, error, latest } = useSensor();
  const { lang, t: tc } = useLang();
  const t = CONNECT[lang];
  const [draft, setDraft] = useState(ip);
  const [copied, setCopied] = useState(false);
  const [https, setHttps] = useState(false);

  useEffect(() => setDraft(ip), [ip]);
  useEffect(() => setHttps(window.location.protocol === "https:"), []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = draft.trim();
    if (!clean) return;
    setIp(clean);
    connect(clean);
  };

  const copySSID = async () => {
    try {
      await navigator.clipboard.writeText(HOTSPOT_SSID);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {/* ignore */}
  };

  const currentStep =
    status === "connected" ? 4
    : ip ? 3
    : 2;

  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-24 pt-10 sm:px-8">
      <PageHeader
        home={tc.common.home}
        crumb={t.crumb}
        eyebrow={t.eyebrow}
        title={t.title}
        lead={t.lead}
        aside={<StatusBadge status={status} ip={ip} label={t.status[status]} />}
      />

      {https && (
        <Reveal className="mt-8 flex gap-4 rounded-md border-2 border-stamp-500 bg-white p-5 shadow-card">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-stamp-500" />
          <div>
            <p className="font-display text-lg uppercase tracking-wide text-stamp-600">{t.httpsTitle}</p>
            <p className="mt-1 text-sm text-ink-700">
              {t.httpsBody}{" "}
              <code className="rounded bg-paper-alt px-1.5 py-0.5 font-mono text-[13px] text-ink-900">http://localhost:3000/connect</code>
            </p>
          </div>
        </Reveal>
      )}

      {/* Progress — four stamped steps sewn together */}
      <div className="relative mt-10">
        <SewLine className="absolute left-6 right-6 top-6 hidden border-t-[3px] border-dashed border-ink-900/25 md:block" />
        <StaggerList ordered className="relative grid grid-cols-2 gap-6 md:grid-cols-4">
          {t.steps.map((s, i) => {
            const n = i + 1;
            const done = currentStep > n;
            const active = currentStep === n;
            return (
              <StaggerItem key={s.title}>
                <span
                  className={`grid h-12 w-12 place-items-center rounded-full border-[3px] font-stamp text-xl transition-colors ${
                    done
                      ? "border-leaf-700 bg-leaf-600 text-paper"
                      : active
                        ? "border-stamp-500 bg-white text-stamp-500"
                        : "border-ink-900/30 bg-paper text-ink-400"
                  }`}
                >
                  {done ? <Check className="h-5 w-5" strokeWidth={3} /> : n}
                </span>
                <p className={`mt-3 font-display text-lg uppercase tracking-wide ${active ? "text-ink-900" : "text-ink-700"}`}>{s.title}</p>
                <p className="mt-1 text-[13px] leading-snug text-ink-500">{s.sub}</p>
              </StaggerItem>
            );
          })}
        </StaggerList>
      </div>

      {/* Main grid */}
      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Form + help + pinout */}
        <Reveal className="stitch rounded-md bg-white p-7 shadow-soft sm:p-9">
          <form onSubmit={onSubmit}>
            <label htmlFor="ip" className="label-eyebrow">{t.ipLabel}</label>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                id="ip"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="172.20.10.2"
                inputMode="decimal"
                autoComplete="off"
                className="input border-2 font-mono text-lg"
              />
              <button type="submit" className="btn btn-primary">
                <Radio className="h-4 w-4" strokeWidth={2.5} />
                {t.connect}
              </button>
              {ip && status !== "closed" && (
                <button type="button" onClick={close} className="btn btn-ghost">
                  {t.disconnect}
                </button>
              )}
            </div>
            {error && (
              <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-stamp-600">
                <AlertCircle className="h-4 w-4" /> {error}
              </p>
            )}
          </form>

          <div className="my-8 border-t-2 border-dashed border-ink-900/15" />

          <div className="grid gap-7 sm:grid-cols-2">
            <div>
              <h2 className="text-xl uppercase tracking-wide text-ink-900">{t.hotspotTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                {t.hotspotBody}{" "}
                <code className="rounded bg-paper-alt px-1.5 py-0.5 font-mono text-[13px] text-ink-900">{HOTSPOT_SSID}</code>.{" "}
                {t.hotspotPass}
              </p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-ink-700">{t.hotspotLaptop}</p>
              <button onClick={copySSID} className="btn btn-ghost mt-4 px-3 py-1.5 text-xs">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? t.copied : t.copy}
              </button>
            </div>
            <div>
              <h2 className="text-xl uppercase tracking-wide text-ink-900">{t.ipTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                {t.ipBody}{" "}
                <code className="rounded bg-paper-alt px-1.5 py-0.5 font-mono text-[13px] text-ink-900">115200</code>.{" "}
                {t.ipBody2}
              </p>
            </div>
          </div>

          <div className="my-8 border-t-2 border-dashed border-ink-900/15" />

          {/* Pinout, printed like a wiring label */}
          <h2 id="firmware" className="scroll-mt-28 text-xl uppercase tracking-wide text-ink-900">{t.pinoutTitle}</h2>
          <table className="mt-4 w-full border-collapse text-left text-sm">
            <tbody>
              {t.pins.map(([l, p]) => (
                <tr key={p} className="border-b-2 border-ink-900/10 last:border-ink-900/60">
                  <td className="py-2.5 pr-4 text-ink-700">{l}</td>
                  <td className="whitespace-nowrap py-2.5 text-right font-mono text-ink-900">{p}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 flex gap-2 rounded-md bg-amber-50 p-3 text-[13px] leading-snug text-ink-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            {t.pinoutNote}
          </p>
        </Reveal>

        {/* Live preview — dark instrument panel */}
        <Reveal delay={0.1} className="flex flex-col overflow-hidden rounded-md bg-ink-900 text-paper shadow-soft">
          <div className="flex items-center justify-between border-b border-dashed border-paper/20 px-6 py-4">
            <span className="font-display text-sm uppercase tracking-[0.18em] text-amber-100/80">{t.preview}</span>
            <StatusBadge status={status} ip={ip} label={t.status[status]} compact />
          </div>
          <div className="flex-1 p-6">
            {latest ? (
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md bg-paper/10">
                {[
                  { label: t.readings.temp,  v: latest.temp.toFixed(1), u: "°C" },
                  { label: t.readings.ph,    v: latest.ph.toFixed(2),   u: "" },
                  { label: t.readings.tds,   v: String(latest.tds),     u: "ppm" },
                  { label: t.readings.moist, v: String(latest.moist),   u: "%" },
                ].map((m) => (
                  <div key={m.label} className="bg-ink-900 p-5">
                    <dt className="font-display text-xs uppercase tracking-[0.14em] text-paper/60">{m.label}</dt>
                    <dd className="mt-1 font-mono text-amber-100">
                      <span className="text-4xl">{m.v}</span>
                      {m.u && <span className="ml-1 text-sm text-paper/60">{m.u}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-14 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-paper/30 text-paper/60">
                  <Wifi className="h-6 w-6 animate-breath" strokeWidth={1.8} />
                </div>
                <p className="mt-5 font-display text-xl uppercase tracking-wide">{t.waiting}</p>
                <p className="mt-2 max-w-xs text-sm text-paper/60">{t.waitingSub}</p>
              </div>
            )}
          </div>
          {latest && (
            <div className="border-t border-dashed border-paper/20 px-6 py-4">
              <Link href="/dashboard" className="btn btn-stamp group w-full">
                {t.openDashboard}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
              </Link>
            </div>
          )}
        </Reveal>
      </div>

      {/* Calibration — serial commands */}
      <Reveal className="mt-12">
        <section id="calibration" className="kraft stitch scroll-mt-28 rounded-md p-7 shadow-soft sm:p-9">
          <p className="label-eyebrow">cal</p>
          <h2 className="mt-3 text-3xl uppercase text-ink-900 sm:text-4xl">{t.calTitle}</h2>
          <p className="mt-3 max-w-[70ch] text-ink-900">{t.calLead}</p>
          <dl className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {t.cal.map(([cmd, what]) => (
              <div key={cmd} className="flex items-baseline gap-3 border-b border-dashed border-ink-900/25 py-2">
                <dt>
                  <code className="rounded bg-ink-900 px-2 py-0.5 font-mono text-[13px] text-amber-100">{cmd}</code>
                </dt>
                <dd className="text-sm text-ink-900">{what}</dd>
              </div>
            ))}
          </dl>
        </section>
      </Reveal>
    </main>
  );
}

/* ================================================================ */
function StatusBadge({
  status,
  ip,
  label,
  compact = false,
}: {
  status: ReturnType<typeof useSensor>["status"];
  ip: string;
  label: string;
  compact?: boolean;
}) {
  const COLOR = {
    idle:         "chip-ghost",
    connecting:   "chip-aqua",
    connected:    "chip-leaf",
    reconnecting: "chip-amber",
    error:        "chip-amber",
    closed:       "chip-ghost",
  } as const;
  return (
    <div className="flex items-center gap-2">
      <span className={`chip ${COLOR[status]}`}>
        {status === "connected" && (
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-leaf-500/70" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-leaf-500" />
          </span>
        )}
        {label}
      </span>
      {!compact && ip && <span className="font-mono text-xs text-ink-500">{ip}</span>}
    </div>
  );
}
