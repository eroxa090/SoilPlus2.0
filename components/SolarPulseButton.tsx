"use client";

import { Sparkles } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingLabel?: string;
  label: string;
};

/**
 * The dashboard's primary CTA.
 * The solar-pulse outer halo is a slow (4.8s) breath; the interior sheen is a
 * 6s shimmer. Both are driven entirely from globals.css so we don't pay a
 * per-frame React cost.
 */
export default function SolarPulseButton({
  loading = false,
  loadingLabel = "Analyzing…",
  label,
  disabled,
  className = "",
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`solar-btn group relative mx-auto flex w-full items-center justify-center gap-3 rounded-2xl px-7 py-5 font-serif text-sm sm:text-base ${className}`}
    >
      {loading ? (
        <>
          <span className="relative flex h-3 w-3">
            <span className="absolute inset-0 animate-ping rounded-full bg-obsidian/70" />
            <span className="relative h-3 w-3 rounded-full bg-obsidian/90" />
          </span>
          <span className="uppercase">{loadingLabel}</span>
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" strokeWidth={1.4} />
          <span className="uppercase">{label}</span>
        </>
      )}
    </button>
  );
}
