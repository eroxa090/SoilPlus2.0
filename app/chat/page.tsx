"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUp,
  Bot,
  Droplets,
  Leaf,
  Loader2,
  Radio,
  Sparkles,
  Thermometer,
  User,
  WifiOff,
} from "lucide-react";
import { useSensor } from "@/components/SensorProvider";
import { CROPS } from "@/lib/crops";

type Msg = { role: "user" | "assistant"; content: string; ts: number };

const SUGGESTIONS = [
  "Что я могу посадить на этой почве прямо сейчас?",
  "Какие у меня риски с текущими показателями?",
  "Сколько воды нужно для 0.5 га пшеницы?",
  "Is this soil too salty for tomatoes?",
];

const GREETING: Msg = {
  role: "assistant",
  content:
    "Здравствуйте. Я SoilPlus Agronomist — вижу ваш ESP32 поток в реальном времени. Спросите меня про риски, норму полива или какие культуры подойдут для текущей почвы. Можно писать на русском или английском.",
  ts: Date.now(),
};

export default function ChatPage() {
  const { latest, status, ip } = useSensor();
  const [cropId, setCropId] = useState<string>("");
  const [areaM2, setAreaM2] = useState<number>(0);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
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
      const reply: string = json.reply ?? "Пустой ответ от модели.";
      setMessages((m) => [...m, { role: "assistant", content: reply, ts: Date.now() }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            e instanceof Error ? `Ошибка: ${e.message}` : "Не удалось получить ответ.",
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

  return (
    <main className="mx-auto max-w-[1280px] px-5 pb-24 pt-10 sm:px-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="label-eyebrow">AI Agronomist</span>
          <h1 className="mt-2 font-display text-4xl tracking-tightx text-ink-900 sm:text-5xl">
            Talk to your field.
          </h1>
          <p className="mt-3 max-w-xl text-ink-500">
            Gemini 1.5 Flash reads the same ESP32 stream you see on the dashboard.
            Ask about risks, irrigation norms, or which crop fits today&apos;s soil.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`chip ${
              status === "connected" ? "chip-leaf" : "chip-ghost"
            }`}
          >
            {status === "connected" ? (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-leaf-500/70" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-leaf-500" />
                </span>
                Live stream
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Demo mode
              </>
            )}
          </span>
          {ip && <span className="font-mono text-[11px] text-ink-400">{ip}</span>}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        {/* Chat column */}
        <div className="card flex flex-col overflow-hidden p-0">
          {/* Context strip */}
          <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 bg-paper-alt px-5 py-3 text-xs text-ink-500">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-leaf-600" />
              <span className="font-medium text-ink-700">Context</span>
            </span>
            <span className="mx-1 text-ink-200">·</span>
            {latest ? (
              <span className="font-mono">
                {latest.temp.toFixed(1)}°C · pH {latest.ph.toFixed(2)} ·{" "}
                {latest.tds} ppm · {latest.moist}%
              </span>
            ) : (
              <span className="font-mono">preview · no device</span>
            )}
            {crop && (
              <>
                <span className="mx-1 text-ink-200">·</span>
                <span>
                  {crop.emoji} {crop.name}
                </span>
              </>
            )}
            {areaM2 > 0 && (
              <>
                <span className="mx-1 text-ink-200">·</span>
                <span>
                  {areaM2 >= 10000
                    ? `${(areaM2 / 10000).toFixed(2)} ha`
                    : `${areaM2.toFixed(0)} m²`}
                </span>
              </>
            )}
          </div>

          {/* Messages */}
          <div
            ref={scrollerRef}
            className="min-h-[420px] flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-7"
          >
            {messages.map((m) => (
              <Bubble key={m.ts} role={m.role} content={m.content} />
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-sm text-ink-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                thinking…
              </div>
            )}
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="border-t border-ink-100 bg-paper-alt px-5 py-3">
              <p className="mb-2 text-[10px] uppercase tracking-widex text-ink-400">
                Try
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="chip chip-ghost hover:bg-leaf-50 hover:text-leaf-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Composer */}
          <form
            onSubmit={onSubmit}
            className="flex items-end gap-3 border-t border-ink-100 bg-white px-5 py-4"
          >
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              placeholder="Ask about risks, irrigation, salinity… (Enter to send)"
              className="input flex-1 resize-none leading-snug"
            />
            <button
              type="submit"
              disabled={busy || draft.trim().length === 0}
              className="btn btn-primary h-11 w-11 justify-center p-0 disabled:opacity-40"
              aria-label="Send"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" strokeWidth={2.2} />
              )}
            </button>
          </form>
        </div>

        {/* Side context panel */}
        <aside className="flex flex-col gap-5">
          <div className="card p-5">
            <p className="label-eyebrow">Live reading</p>
            {latest ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Metric
                  label="Temp"
                  value={`${latest.temp.toFixed(1)}°C`}
                  icon={Thermometer}
                />
                <Metric
                  label="pH"
                  value={latest.ph.toFixed(2)}
                  icon={Leaf}
                />
                <Metric
                  label="TDS"
                  value={`${latest.tds} ppm`}
                  icon={Droplets}
                />
                <Metric
                  label="Moist"
                  value={`${latest.moist}%`}
                  icon={Leaf}
                />
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-ink-200 p-4 text-center">
                <p className="text-sm text-ink-500">
                  Connect the probe to ground my answers in real numbers.
                </p>
                <Link href="/connect" className="btn btn-primary mt-3 w-full justify-center">
                  <Radio className="h-4 w-4" />
                  Connect device
                </Link>
              </div>
            )}
          </div>

          <div className="card p-5">
            <p className="label-eyebrow">Crop context</p>
            <p className="mt-2 text-xs text-ink-500">
              Selecting a crop sharpens the agronomist&apos;s diagnosis and lets
              it cite exact optimum bands.
            </p>
            <select
              value={cropId}
              onChange={(e) => setCropId(e.target.value)}
              className="input mt-3 text-sm"
            >
              <option value="">— No crop selected —</option>
              {CROPS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name} · {c.nameRu}
                </option>
              ))}
            </select>
            {crop && (
              <div className="mt-3 space-y-1 rounded-lg bg-paper-alt p-3 text-[11px] text-ink-500">
                <p>
                  <span className="text-ink-400">pH</span>{" "}
                  <span className="font-mono text-ink-700">
                    {crop.phMin}–{crop.phMax}
                  </span>
                </p>
                <p>
                  <span className="text-ink-400">Moisture</span>{" "}
                  <span className="font-mono text-ink-700">
                    {crop.wOptMin}–{crop.wOptMax}%
                  </span>
                </p>
                <p>
                  <span className="text-ink-400">EC max</span>{" "}
                  <span className="font-mono text-ink-700">
                    {crop.ecMax} ppm
                  </span>
                </p>
                <p>
                  <span className="text-ink-400">Root depth</span>{" "}
                  <span className="font-mono text-ink-700">
                    {crop.rootDepth} m
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="card bg-leaf-50/60 p-5">
            <p className="font-display text-sm font-semibold text-leaf-900">
              Need exact litres?
            </p>
            <p className="mt-1 text-xs text-leaf-800/80">
              The Irrigation calculator applies the full V = ΔW × D × ρ × S × K_pH × K_EC
              formula to your live reading.
            </p>
            <Link
              href="/irrigation"
              className="btn btn-ghost mt-3 w-full justify-center text-leaf-700"
            >
              Open calculator →
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}

/* ================================================================ */

function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
          isUser
            ? "bg-ink-900 text-white"
            : "bg-leaf-50 text-leaf-700 ring-1 ring-leaf-100"
        }`}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-ink-900 text-white"
            : "bg-paper-alt text-ink-800 ring-1 ring-ink-100"
        }`}
      >
        {content}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Leaf;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-paper-alt p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widex text-ink-400">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-1 font-display text-lg font-semibold text-ink-900">
        {value}
      </p>
    </div>
  );
}
