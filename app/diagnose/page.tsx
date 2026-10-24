"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Camera, Leaf, Loader2, Sparkles, Upload, X } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";
import PageHeader from "@/components/PageHeader";
import { Reveal, StaggerItem, StaggerList } from "@/components/motion/Motion";
import { DIAGNOSE } from "@/lib/i18n/pages/diagnose";

type Diagnosis = {
  isPlant: boolean;
  plantSpecies?: string;
  plantLatin?: string;
  disease: string;
  latin?: string;
  confidence: number;
  severity: "none" | "mild" | "moderate" | "severe";
  symptoms: string[];
  causes: string[];
  treatment: string[];
  prevention: string[];
  urgency: "watch" | "act_soon" | "act_now";
  notes?: string;
};

type ApiResponse =
  | { diagnosis: Diagnosis; model: string; warning?: string }
  | { error: string };

const SEVERITY_TONE: Record<Diagnosis["severity"], string> = {
  none:     "border-leaf-600 text-leaf-700",
  mild:     "border-amber-500 text-amber-600",
  moderate: "border-amber-600 text-amber-600",
  severe:   "border-stamp-500 text-stamp-500",
};

const URGENCY_TONE: Record<Diagnosis["urgency"], string> = {
  watch:    "chip-ghost",
  act_soon: "chip-amber",
  act_now:  "text-stamp-500",
};

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export default function DiagnosePage() {
  const { lang, t: tc } = useLang();
  const t = DIAGNOSE[lang];
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [result, setResult] = useState<Diagnosis | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback(
    (f: File | null) => {
      setError(null);
      setResult(null);
      setWarning(null);
      if (!f) {
        setFile(null);
        setPreview(null);
        return;
      }
      if (!f.type.startsWith("image/")) {
        setError(t.notImage);
        return;
      }
      if (f.size > MAX_BYTES) {
        setError(t.tooBig);
        return;
      }
      setFile(f);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    },
    [t],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0] ?? null;
      onFile(f);
    },
    [onFile],
  );

  async function submit() {
    if (!file || !preview || busy) return;
    setBusy(true);
    setError(null);
    setWarning(null);
    setResult(null);
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: preview,
          mimeType: file.type,
          note: note.trim() || undefined,
          lang,
        }),
      });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || "error" in data) {
        setError(("error" in data && data.error) || t.failed);
        return;
      }
      setResult(data.diagnosis);
      setModel(data.model);
      if (data.warning) setWarning(data.warning);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.network);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setWarning(null);
    setNote("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-24 pt-10 sm:px-8">
      <PageHeader home={tc.common.home} crumb={t.crumb} eyebrow={t.eyebrow} title={t.title} lead={t.lead} />

      <div className="mt-10 grid gap-6 lg:grid-cols-5">
        {/* Upload pane */}
        <Reveal className="lg:col-span-2">
          <div className="stitch rounded-md bg-white p-6 shadow-soft">
            <h2 className="mb-5 flex items-center gap-2 text-2xl uppercase text-ink-900">
              <Camera className="h-6 w-6 text-stamp-500" strokeWidth={2.25} />
              {t.step1}
            </h2>

            {!preview ? (
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-[3px] border-dashed p-8 text-center transition-colors ${
                  dragOver ? "border-leaf-600 bg-leaf-50" : "border-ink-900/25 hover:border-leaf-500 hover:bg-leaf-50/50"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                />
                <motion.span
                  animate={dragOver ? { y: -4, scale: 1.08 } : { y: 0, scale: 1 }}
                  className="grid h-14 w-14 place-items-center rounded-full bg-leaf-700 text-paper shadow-[0_3px_0_0_#1F2A12]"
                >
                  <Upload className="h-6 w-6" strokeWidth={2.25} />
                </motion.span>
                <span className="font-display text-lg uppercase tracking-wide text-ink-900">{t.drop}</span>
                <span className="font-mono text-xs text-ink-500">{t.formats}</span>
              </label>
            ) : (
              <motion.figure
                initial={{ opacity: 0, rotate: -4, scale: 0.95 }}
                animate={{ opacity: 1, rotate: -1.5, scale: 1 }}
                className="relative bg-white p-2.5 pb-8 shadow-soft"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt={t.previewAlt} className="max-h-72 w-full bg-paper object-contain" />
                <button
                  onClick={reset}
                  className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-ink-900 text-paper shadow-card transition-transform hover:scale-110"
                  aria-label={t.remove}
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </motion.figure>
            )}

            <div className="mt-5">
              <label htmlFor="note" className="mb-2 block font-display text-sm uppercase tracking-wide text-ink-700">
                {t.note}
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.notePh}
                rows={3}
                maxLength={500}
                className="input resize-none border-2"
              />
            </div>

            {error && (
              <div role="alert" className="mt-4 flex items-start gap-2 rounded-md border-2 border-stamp-500/40 bg-rose-50 p-3 text-sm text-stamp-600">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button onClick={submit} disabled={!file || busy} className="btn btn-stamp mt-5 w-full py-3.5 text-base disabled:opacity-50">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.analysing}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" strokeWidth={2.5} />
                  {t.run}
                </>
              )}
            </button>

            <p className="mt-3 text-[11px] leading-snug text-ink-500">{t.disclaimer}</p>
          </div>
        </Reveal>

        {/* Result pane */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-5"
              >
                {/* Summary — a lab report */}
                <div className="stitch rounded-md bg-white p-7 shadow-soft">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <motion.span
                          initial={{ opacity: 0, scale: 1.8, rotate: -14 }}
                          animate={{ opacity: 1, scale: 1, rotate: -3 }}
                          transition={{ type: "spring", stiffness: 480, damping: 22, delay: 0.15 }}
                          className={`inline-block rounded-sm border-[3px] border-double px-2.5 py-1 font-stamp text-sm uppercase ${SEVERITY_TONE[result.severity]}`}
                        >
                          {t.severity[result.severity]}
                        </motion.span>
                        <span className={`chip ${URGENCY_TONE[result.urgency]}`}>{t.urgency[result.urgency]}</span>
                        {model && <span className="chip chip-ghost">{model}</span>}
                      </div>
                      {result.plantSpecies && (
                        <p className="mt-4 flex flex-wrap items-center gap-1.5 text-sm text-ink-700">
                          <Leaf className="h-4 w-4 text-leaf-600" strokeWidth={2.5} />
                          {t.plant}: <span className="font-medium text-ink-900">{result.plantSpecies}</span>
                          {result.plantLatin && <span className="italic text-ink-500">· {result.plantLatin}</span>}
                        </p>
                      )}
                      <h2 className="mt-3 text-4xl uppercase leading-tight text-ink-900">{result.disease || "—"}</h2>
                      {result.latin && <p className="mt-1 text-sm italic text-ink-500">{result.latin}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xs uppercase tracking-[0.14em] text-ink-500">{t.confidence}</p>
                      <p className="font-mono text-4xl text-leaf-700">{result.confidence}%</p>
                    </div>
                  </div>

                  {result.notes && <p className="mt-5 rounded-md bg-paper p-3 text-sm text-ink-700">{result.notes}</p>}

                  {warning && (
                    <p className="mt-4 flex items-start gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-600">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{warning}</span>
                    </p>
                  )}
                </div>

                {/* Details grid */}
                <div className="grid gap-5 md:grid-cols-2">
                  <DetailCard title={t.symptoms} items={result.symptoms} tone="ink" />
                  <DetailCard title={t.causes} items={result.causes} tone="ink" />
                  <DetailCard title={t.treatment} items={result.treatment} tone="leaf" />
                  <DetailCard title={t.prevention} items={result.prevention} tone="leaf" />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button onClick={reset} className="btn btn-ghost">
                    <Upload className="h-4 w-4" strokeWidth={2.5} />
                    {t.another}
                  </button>
                  <Link href="/chat" className="btn btn-primary">
                    <Sparkles className="h-4 w-4" strokeWidth={2.5} />
                    {t.ask}
                  </Link>
                </div>
              </motion.div>
            ) : busy ? (
              <motion.div
                key="busy"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-md border-2 border-ink-900/10 bg-white p-8 text-center"
              >
                <Loader2 className="h-8 w-8 animate-spin text-leaf-600" />
                <p className="mt-4 font-display text-xl uppercase text-ink-900">{t.loading}</p>
                <p className="mt-1 text-sm text-ink-500">{t.loadingSub}</p>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-md border-2 border-dashed border-ink-900/20 p-8 text-center"
              >
                <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-ink-900/30 text-leaf-700">
                  <Leaf className="h-6 w-6" />
                </div>
                <p className="mt-4 font-display text-2xl uppercase text-ink-900">{t.readyTitle}</p>
                <p className="mt-2 max-w-sm text-sm text-ink-500">{t.readyBody}</p>
                <ul className="mt-6 grid gap-2 text-left text-sm text-ink-700">
                  {t.tips.map((tip, i) => (
                    <li key={tip} className="flex items-center gap-3">
                      <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-ink-900/60 font-mono text-xs">{i + 1}</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

function DetailCard({ title, items, tone }: { title: string; items: string[]; tone: "leaf" | "ink" }) {
  const hasItems = items && items.length > 0;
  return (
    <div className={`card border-t-4 p-5 ${tone === "leaf" ? "border-t-leaf-600" : "border-t-ink-900"}`}>
      <h3 className="mb-3 font-display text-lg uppercase tracking-wide text-ink-900">{title}</h3>
      {hasItems ? (
        <StaggerList className="space-y-2.5">
          {items.map((it, i) => (
            <StaggerItem key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-700">
              <span className={tone === "leaf" ? "text-leaf-600" : "text-ink-400"}>✦</span>
              <span>{it}</span>
            </StaggerItem>
          ))}
        </StaggerList>
      ) : (
        <p className="text-sm text-ink-400">—</p>
      )}
    </div>
  );
}
