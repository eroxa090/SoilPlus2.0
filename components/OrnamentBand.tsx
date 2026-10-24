"use client";

import { useId } from "react";

/**
 * A printed border of koshkar-muiiz ("ram's horn"), the core motif of Kazakh
 * ornament, repeated across the width the way grain sacks carry a printed
 * band. Purely decorative. Colour comes from `currentColor`.
 */
export default function OrnamentBand({
  className = "",
  height = 28,
}: {
  className?: string;
  height?: number;
}) {
  const id = `koshkar-${useId().replace(/:/g, "")}`;
  return (
    <svg
      aria-hidden
      className={`block w-full ${className}`}
      height={height}
      preserveAspectRatio="none"
    >
      <defs>
        {/* One 56×28 tile: a pair of horns curling outward from a stem,
            the next pair upside down, so the band reads as a running scroll. */}
        <pattern id={id} width="56" height="28" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M14 22 C14 12 6 8 3 13 S4 21 9 19" />
            <path d="M14 22 C14 12 22 8 25 13 S24 21 19 19" />
            <path d="M14 22 V26" />
            <path d="M42 6 C42 16 34 20 31 15 S32 7 37 9" />
            <path d="M42 6 C42 16 50 20 53 15 S52 7 47 9" />
            <path d="M42 6 V2" />
          </g>
          <circle cx="28" cy="14" r="1.6" fill="currentColor" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="1.5" fill="currentColor" />
      <rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      <rect x="0" y={height - 1.5} width="100%" height="1.5" fill="currentColor" />
    </svg>
  );
}
