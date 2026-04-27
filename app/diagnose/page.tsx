"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ImageIcon,
  Leaf,
  Loader2,
  ShieldAlert,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

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

const SEVERITY_STYLE: Record<
  Diagnosis["severity"],
  { label: string; dot: string; pill: string }
> = {
  none: {
    label: "Здорово",
    dot: "bg-leaf-500",
    pill: "bg-leaf-50 text-leaf-700 border-leaf-200",
  },
  mild: {
    label: "Лёгкая",
    dot: "bg-amber-400",
    pill: "bg-amber-50 text-amber-700 border-amber-200",
  },
  moderate: {
    label: "Средняя",
    dot: "bg-orange-500",
    pill: "bg-orange-50 text-orange-700 border-orange-200",
  },
  severe: {
    label: "Тяжёлая",
    dot: "bg-rose-500",
    pill: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

const URGENCY_STYLE: Record<
  Diagnosis["urgency"],
  { label: string; pill: string; icon: typeof Sparkles }
> = {
  watch: {
    label: "Наблюдать",
    pill: "bg-ink-100/60 text-ink-700 border-ink-200",
    icon: CheckCircle2,
  },
  act_soon: {
    label: "Действовать скоро",
    pill: "bg-amber-50 text-amber-700 border-amber-200",
    icon: AlertTriangle,
  },
  act_now: {
    label: "Срочно!",
    pill: "bg-rose-50 text-rose-700 border-rose-200",
    icon: ShieldAlert,
  },
};

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export default function DiagnosePage() {
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

  const onFile = useCallback((f: File | null) => {
    setError(null);
    setResult(null);
    setWarning(null);
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!f.type.startsWith("image/")) {
      setError("Нужен файл изображения (JPEG / PNG / WebP).");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("Файл больше 8 МБ. Пожалуйста, сожмите фото.");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }, []);

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
        }),
      });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || "error" in data) {
        setError(("error" in data && data.error) || "Не удалось получить диагноз.");
        return;
      }
      setResult(data.diagnosis);
      setModel(data.model);
      if (data.warning) setWarning(data.warning);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Сетевая ошибка.");
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

  const severity = useMemo(
    () => (result ? SEVERITY_STYLE[result.severity] : null),
    [result],
  );
  const urgency = useMemo(
    () => (result ? URGENCY_STYLE[result.urgency] : null),
    [result],
  );

  return (
    <main className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14">
      {/* Header */}
      <section className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-leaf-200 bg-leaf-50 px-3 py-1 text-xs font-medium text-leaf-700">
          <Sparkles className="h-3.5 w-3.5" />
          AI Photo Diagnosis
        </div>
        <h1 className="mt-4 font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
          Фото-диагностика болезней растений
        </h1>
        <p className="mt-3 max-w-2xl text-ink-600">
          Загрузите фото листа, плода или стебля — SoilPlus-агроном на базе
          Gemini Vision определит болезнь, вредителя или дефицит питания и даст
          конкретные шаги для защиты урожая.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Upload pane */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
              <Camera className="h-5 w-5 text-leaf-600" />
              1. Загрузите фото
            </h2>

            {!preview ? (
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition ${
                  dragOver
                    ? "border-leaf-500 bg-leaf-50/50"
                    : "border-ink-200 hover:border-leaf-400 hover:bg-leaf-50/30"
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
                <div className="grid h-12 w-12 place-items-center rounded-full bg-leaf-50 text-leaf-600">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-ink-900">
                    Нажмите или перетащите фото
                  </div>
                  <div className="mt-1 text-xs text-ink-500">
                    JPEG, PNG, WebP · до 8 МБ
                  </div>
                </div>
              </label>
            ) : (
              <div className="relative overflow-hidden rounded-xl border border-ink-100 bg-ink-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="preview"
                  className="max-h-72 w-full object-contain"
                />
                <button
                  onClick={reset}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink-700 shadow-sm backdrop-blur hover:bg-white"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="mt-5">
              <label
                htmlFor="note"
                className="mb-2 block text-sm font-medium text-ink-700"
              >
                Заметка (необязательно)
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Например: томаты, сорт Бычье Сердце, листья желтеют снизу"
                rows={3}
                maxLength={500}
                className="w-full resize-none rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-leaf-500 focus:outline-none focus:ring-2 focus:ring-leaf-200"
              />
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={submit}
              disabled={!file || busy}
              className="btn btn-primary mt-5 w-full"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Анализируем…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Диагностировать
                </>
              )}
            </button>

            <p className="mt-3 text-[11px] text-ink-500">
              Диагноз AI — это подсказка, а не окончательный вердикт. При
              серьёзных потерях урожая обратитесь к агроному / лаборатории.
            </p>
          </div>
        </div>

        {/* Result pane */}
        <div className="lg:col-span-3">
          {!result && !busy && (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white/50 p-8 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-leaf-50 text-leaf-600">
                <Leaf className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">
                Готов к работе
              </h3>
              <p className="mt-2 max-w-sm text-sm text-ink-500">
                Загрузите чёткое фото поражённой части растения — крупно, при
                дневном свете. Результат появится здесь.
              </p>
              <ul className="mt-5 grid gap-2 text-left text-xs text-ink-600">
                <li className="flex items-center gap-2">
                  <ImageIcon className="h-3.5 w-3.5 text-leaf-600" />
                  Снимайте близко к поражённому участку
                </li>
                <li className="flex items-center gap-2">
                  <ImageIcon className="h-3.5 w-3.5 text-leaf-600" />
                  Избегайте сильных теней и размытия
                </li>
                <li className="flex items-center gap-2">
                  <ImageIcon className="h-3.5 w-3.5 text-leaf-600" />
                  Лучше несколько фото: лист сверху + снизу
                </li>
              </ul>
            </div>
          )}

          {busy && (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-ink-100 bg-white p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-leaf-600" />
              <p className="mt-4 font-medium text-ink-900">
                Gemini Vision изучает фото…
              </p>
              <p className="mt-1 text-sm text-ink-500">Обычно 3–6 секунд.</p>
            </div>
          )}

          {result && severity && urgency && (
            <div className="space-y-4">
              {/* Summary card */}
              <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${severity.pill}`}
                      >
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${severity.dot}`}
                        />
                        {severity.label}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${urgency.pill}`}
                      >
                        <urgency.icon className="h-3 w-3" />
                        {urgency.label}
                      </span>
                      {model && (
                        <span className="rounded-full border border-ink-100 bg-white px-2 py-0.5 font-mono text-[10px] text-ink-500">
                          {model}
                        </span>
                      )}
                    </div>
                    {result.plantSpecies && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-leaf-200 bg-leaf-50 px-2.5 py-1 text-xs font-medium text-leaf-800">
                        <Leaf className="h-3.5 w-3.5" />
                        Растение:&nbsp;
                        <span className="text-ink-900">
                          {result.plantSpecies}
                        </span>
                        {result.plantLatin && (
                          <span className="italic text-ink-500">
                            · {result.plantLatin}
                          </span>
                        )}
                      </div>
                    )}
                    <h2 className="mt-3 font-display text-2xl font-semibold text-ink-900">
                      {result.disease || "—"}
                    </h2>
                    {result.latin && (
                      <p className="mt-0.5 text-sm italic text-ink-500">
                        {result.latin}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wide text-ink-500">
                      Уверенность
                    </div>
                    <div className="font-mono text-3xl font-semibold text-leaf-700">
                      {result.confidence}%
                    </div>
                  </div>
                </div>

                {result.notes && (
                  <p className="mt-4 rounded-lg bg-ink-50 p-3 text-sm text-ink-700">
                    {result.notes}
                  </p>
                )}

                {warning && (
                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{warning}</span>
                  </div>
                )}
              </div>

              {/* Details grid */}
              <div className="grid gap-4 md:grid-cols-2">
                <DetailCard title="Симптомы" items={result.symptoms} tone="ink" />
                <DetailCard title="Причины" items={result.causes} tone="ink" />
                <DetailCard
                  title="Лечение сейчас"
                  items={result.treatment}
                  tone="leaf"
                />
                <DetailCard
                  title="Профилактика"
                  items={result.prevention}
                  tone="leaf"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={reset} className="btn btn-ghost">
                  <Upload className="h-4 w-4" />
                  Проверить другое фото
                </button>
                <Link href="/chat" className="btn btn-primary">
                  <Sparkles className="h-4 w-4" />
                  Спросить AI-агронома
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function DetailCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "leaf" | "ink";
}) {
  const hasItems = items && items.length > 0;
  const dotColor = tone === "leaf" ? "bg-leaf-500" : "bg-ink-400";
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
      <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-ink-700">
        {title}
      </h3>
      {hasItems ? (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li
              key={i}
              className="flex gap-2.5 text-sm leading-relaxed text-ink-800"
            >
              <span
                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`}
              />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-400">—</p>
      )}
    </div>
  );
}
