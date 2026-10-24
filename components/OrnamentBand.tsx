"use client";

import { useId } from "react";

/**
 * A border cut the way a syrmak (quilted felt rug) border is: a row of
 * teeth (tіs) along each edge, closing in on a chain of diamonds, solid
 * and hollow in turn, with a small tumarsha diamond between them.
 * Main colour is `currentColor`; `accent` fills the solid diamonds.
 * Purely decorative.
 */
export default function OrnamentBand({
  className = "",
  height = 28,
  accent = "#B23A2A",
}: {
  className?: string;
  height?: number;
  accent?: string;
}) {
  const id = `syrmak-${useId().replace(/:/g, "")}`;
  const k = height / 32;
  return (
    <svg aria-hidden className={`block w-full ${className}`} height={height}>
      <defs>
        {/* One 64×32 tile, scaled to the band height. */}
        <pattern id={id} width="64" height="32" patternUnits="userSpaceOnUse" patternTransform={`scale(${k})`}>
          <g fill="currentColor">
            <rect x="0" y="0" width="64" height="2.5" />
            <rect x="0" y="29.5" width="64" height="2.5" />
            {/* teeth: down from the top edge, up from the bottom edge, offset */}
            <path d="M0 2.5 8 9 16 2.5ZM16 2.5 24 9 32 2.5ZM32 2.5 40 9 48 2.5ZM48 2.5 56 9 64 2.5Z" />
            <path d="M-8 29.5 0 23 8 29.5ZM8 29.5 16 23 24 29.5ZM24 29.5 32 23 40 29.5ZM40 29.5 48 23 56 29.5ZM56 29.5 64 23 72 29.5Z" />
            {/* tumarsha between the big diamonds */}
            <path d="M32 12 35 16 32 20 29 16ZM0 12 3 16 0 20-3 16ZM64 12 67 16 64 20 61 16Z" />
          </g>
          {/* solid diamond with a cut-out heart */}
          <path d="M16 9.5 23.5 16 16 22.5 8.5 16Z M16 13 19.5 16 16 19 12.5 16Z" fill={accent} fillRule="evenodd" />
          {/* hollow diamond with a solid heart */}
          <path d="M48 10 55 16 48 22 41 16Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="miter" />
          <path d="M48 13.5 51 16 48 18.5 45 16Z" fill={accent} />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
