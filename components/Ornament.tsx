/**
 * Koshkar-Muiiz ornament divider — inline SVG so it can inherit currentColor.
 * Used as a chapter marker between sections of the dashboard.
 */
export function OrnamentDivider({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center gap-4 text-gold/40 ${className}`}
      aria-hidden
    >
      <span className="hairline flex-1 max-w-[18ch]" />
      <svg
        viewBox="0 0 120 24"
        width="120"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      >
        {/* left ram's-horn */}
        <path d="M14 12 C 22 4, 34 6, 34 14 S 22 22, 20 14" />
        {/* center tulip (Greig) */}
        <path d="M60 4 V 20 M54 16 L60 20 L66 16" />
        <circle cx="60" cy="3.5" r="1" fill="currentColor" />
        {/* right ram's-horn (mirror) */}
        <path d="M106 12 C 98 4, 86 6, 86 14 S 98 22, 100 14" />
        {/* dots */}
        <circle cx="38" cy="12" r="1" fill="currentColor" />
        <circle cx="82" cy="12" r="1" fill="currentColor" />
      </svg>
      <span className="hairline flex-1 max-w-[18ch]" />
    </div>
  );
}

/** Small corner flourish, anchors a card to its culture. */
export function CornerFlourish({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 48 48"
      className={`h-12 w-12 text-gold/35 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
    >
      <path d="M4 4 H 18 M4 4 V 18" />
      <path d="M8 12 C 14 8, 20 10, 20 16 S 14 22, 12 16" />
      <circle cx="22" cy="22" r="1.2" fill="currentColor" />
    </svg>
  );
}
