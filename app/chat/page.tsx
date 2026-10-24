"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUp, Loader2, Radio, WifiOff } from "lucide-react";
import { useSensor } from "@/components/SensorProvider";
import { useLang } from "@/components/LanguageProvider";
import PageHeader from "@/components/PageHeader";
import { Reveal } from "@/components/motion/Motion";
import { CROPS } from "@/lib/crops";
import { CHAT } from "@/lib/i18n/pages/chat";

type Msg = { role: "user" | "assistant"; content: string; ts: number };

export default function ChatPage() {
  const { latest, status, ip } = useSensor();
  const { lang, t: tc } = useLang();
  const t = CHAT[lang];
  const [cropId, setCropId] = useState<string>("");
  const [areaM2, setAreaM2] = useState<number>(0);
  // The greeting is rendered from the dictionary so it follows the language
  // switch. It is UI-only: Gemini rejects a history that opens with a model turn.
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Persist crop + area choice so /chat and /irrigation share the same context.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("soilplus.irrigation");
      if (raw) {
        const v = JSON.parse(raw) as { cropId?: string; area?: number; unit?: "m2" | "ha" | "sot" };
        if (v.cropId) setCropId(v.cropId);
        if (typeof v.area === "number" && v.unit) {
          const k = v.unit === "ha" ? 10000 : v.unit === "sot" ? 100 : 1;
          setAreaM2(v.area * k);
        }
      }
    } catch {/* ignore */}
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const crop = useMemo(() => CROPS.find((c) => c.id === cropId), [cropId]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;

    const userMsg: Msg = { role: "user", content: clean, ts: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    setDraft("");
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          reading: latest
            ? { temp: latest.temp, ph: latest.ph, tds: latest.tds, moist: latest.moist }
            : null,
          cropId: cropId || undefined,
          areaM2: areaM2 > 0 ? areaM2 : undefined,
        }),
      });
      const json = await res.json();
      const reply: string = json.reply ?? t.emptyReply;
      setMessages((m) => [...m, { role: "assistant", content: reply, ts: Date.now() }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: e instanceof Error ? `${t.errorPrefix}: ${e.message}` : t.failed,
          ts: Date.now(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(draft);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(draft);
    }
  };

  const live = status === "connected";

  return (
    <main className="mx-auto max-w-[1280px] px-5 pb-24 pt-10 sm:px-8">
      <PageHeader
        home={tc.common.home}
        crumb={t.crumb}
        eyebrow={t.eyebrow}
        title={t.title}
        lead={t.lead}
        aside={
          <div className="flex items-center gap-2">
            <span className={`chip ${live ? "chip-leaf" : "chip-ghost"}`}>
              {live ? (
                <>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inset-0 animate-ping rounded-full bg-leaf-500/70" />
                    <span className="relative h-1.5 w-1.5 rounded-full bg-leaf-500" />
                  </span>
                  {t.live}
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  {t.demo}
                </>
              )}
            </span>
            {ip && <span className="font-mono text-xs text-ink-500">{ip}</span>}
          </div>
        }
      />

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Chat column — a field notebook */}
        <Reveal className="stitch flex flex-col overflow-hidden rounded-md bg-white shadow-soft">
          {/* Context strip */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-ink-900 px-6 py-3 font-mono text-xs text-paper/70">
            <span className="font-display text-xs uppercase tracking-[0.16em] text-amber-100">{t.context}</span>
            <span className="text-paper/30">/</span>
            {latest ? (
              <span>
                {latest.temp.toFixed(1)}°C · pH {latest.ph.toFixed(2)} · {latest.tds} ppm · {latest.moist}%
              </span>
            ) : (
              <span>{t.noDevice}</span>
            )}
            {crop && (
              <>
                <span className="text-paper/30">/</span>
                <span>{lang === "ru" ? crop.nameRu : crop.name}</span>
              </>
            )}
            {areaM2 > 0 && (
              <>
                <span className="text-paper/30">/</span>
                <span>
                  {areaM2 >= 10000 ? `${(areaM2 / 10000).toFixed(2)} ${t.ha}` : `${areaM2.toFixed(0)} ${t.m2}`}
                </span>
              </>
            )}
          </div>

          {/* Messages — ruled notebook paper */}
          <div
            ref={scrollerRef}
            className="min-h-[440px] flex-1 space-y-5 overflow-y-auto px-5 py-7 sm:px-8"
            style={{
              backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 31px, rgba(61,107,110,0.12) 31px 32px)",
            }}
          >
            <Bubble role="assistant" content={t.greeting} name={t.agronomist} />
            {messages.map((m) => (
              <Bubble key={m.ts} role={m.role} content={m.content} name={m.role === "user" ? t.you : t.agronomist} />
            ))}
            {busy && (
              <div className="flex items-center gap-2 pl-12 font-hand text-xl text-ink-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.thinking}
              </div>
            )}
          </div>

          {/* Suggestions */}
          {messages.length === 0 && (
            <div className="border-t-2 border-dashed border-ink-900/15 bg-paper px-6 py-4">
              <p className="mb-3 font-display text-xs uppercase tracking-[0.16em] text-ink-500">{t.try}</p>
              <div className="flex flex-wrap gap-2">
                {t.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-md border-2 border-ink-900/20 bg-white px-3 py-1.5 text-left text-sm text-ink-700 transition-all hover:-translate-y-0.5 hover:border-leaf-600 hover:text-leaf-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Composer */}
          <form onSubmit={onSubmit} className="flex items-end gap-3 border-t-2 border-ink-900/80 bg-paper px-5 py-4">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              placeholder={t.placeholder}
              className="input flex-1 resize-none border-2 leading-snug"
            />
            <button
              type="submit"
              disabled={busy || draft.trim().length === 0}
              className="btn btn-stamp h-12 w-12 p-0 disabled:opacity-40"
              aria-label={t.send}
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" strokeWidth={2.5} />}
            </button>
          </form>
        </Reveal>

        {/* Side context panel */}
        <aside className="flex flex-col gap-6">
          <Reveal delay={0.08} className="rounded-md bg-ink-900 p-5 text-paper shadow-soft">
            <p className="font-display text-sm uppercase tracking-[0.18em] text-amber-100/80">{t.liveReading}</p>
            {latest ? (
              <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-md bg-paper/10">
                {[
                  { label: t.readings.temp,  v: `${latest.temp.toFixed(1)}°C` },
                  { label: t.readings.ph,    v: latest.ph.toFixed(2) },
                  { label: t.readings.tds,   v: `${latest.tds} ppm` },
                  { label: t.readings.moist, v: `${latest.moist}%` },
                ].map((m) => (
                  <div key={m.label} className="bg-ink-900 p-3">
                    <dt className="font-display text-[11px] uppercase tracking-[0.12em] text-paper/60">{m.label}</dt>
                    <dd className="mt-0.5 font-mono text-xl text-amber-100">{m.v}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="mt-4 rounded-md border-2 border-dashed border-paper/25 p-4 text-center">
                <p className="text-sm text-paper/70">{t.connectHint}</p>
                <Link href="/connect" className="btn btn-primary mt-4 w-full">
                  <Radio className="h-4 w-4" />
                  {t.connect}
                </Link>
              </div>
            )}
          </Reveal>

          <Reveal delay={0.14} className="card p-5">
            <label htmlFor="crop" className="label-eyebrow">{t.cropContext}</label>
            <p className="mt-3 text-[13px] leading-snug text-ink-500">{t.cropHint}</p>
            <select
              id="crop"
              value={cropId}
              onChange={(e) => setCropId(e.target.value)}
              className="input mt-3 border-2 text-sm"
            >
              <option value="">{t.noCrop}</option>
              {CROPS.map((c) => (
                <option key={c.id} value={c.id}>
                  {lang === "ru" ? `${c.nameRu} · ${c.name}` : `${c.name} · ${c.nameRu}`}
                </option>
              ))}
            </select>
            {crop && (
              <motion.dl
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 divide-y divide-dashed divide-ink-900/15 rounded-md bg-paper p-3 text-[13px]"
              >
                {[
                  [t.crop.ph, `${crop.phMin}–${crop.phMax}`],
                  [t.crop.moist, `${crop.wOptMin}–${crop.wOptMax}%`],
                  [t.crop.ec, `${crop.ecMax} ppm`],
                  [t.crop.root, `${crop.rootDepth} ${t.crop.m}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1.5">
                    <dt className="text-ink-500">{k}</dt>
                    <dd className="font-mono text-ink-900">{v}</dd>
                  </div>
                ))}
              </motion.dl>
            )}
          </Reveal>

          <Reveal delay={0.2} className="kraft stitch rounded-md p-5 shadow-card">
            <p className="font-display text-xl uppercase text-ink-900">{t.calcTitle}</p>
            <p className="mt-2 text-[13px] leading-snug text-ink-900">{t.calcBody}</p>
            <Link href="/irrigation" className="btn btn-primary group mt-4 w-full">
              {t.calcCta}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
            </Link>
          </Reveal>
        </aside>
      </div>
    </main>
  );
}

/* ================================================================ */

function Bubble({ role, content, name }: { role: "user" | "assistant"; content: string; name: string }) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        aria-hidden
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md font-stamp text-[13px] ${
          isUser ? "bg-ink-900 text-paper" : "bg-leaf-700 text-paper shadow-[0_2px_0_0_#1F2A12]"
        }`}
      >
        {isUser ? name.slice(0, 1) : <>S<span className="text-leaf-300">+</span></>}
      </div>
      <div className={`max-w-[82%] ${isUser ? "text-right" : ""}`}>
        <p className="mb-1 font-display text-[11px] uppercase tracking-[0.14em] text-ink-400">{name}</p>
        <div
          className={`whitespace-pre-wrap rounded-md px-4 py-3 text-left text-[15px] leading-relaxed ${
            isUser
              ? "bg-ink-900 text-paper"
              : "border-2 border-ink-900/10 bg-[#F6E9C8] text-ink-900 shadow-[2px_3px_0_0_rgba(42,31,20,0.08)]"
          }`}
        >
          {content}
        </div>
      </div>
    </motion.div>
  );
}
