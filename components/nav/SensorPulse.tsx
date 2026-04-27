"use client";

import type { SocketStatus } from "@/hooks/useSoilSocket";

const MAP: Record<
  SocketStatus,
  { label: string; dot: string; text: string; ring: string }
> = {
  idle:         { label: "Offline",      dot: "bg-ink-300",   text: "text-ink-500",  ring: "ring-ink-100" },
  connecting:   { label: "Connecting",   dot: "bg-aqua-500",  text: "text-aqua-500", ring: "ring-aqua-100" },
  connected:    { label: "Live",         dot: "bg-leaf-500",  text: "text-leaf-700", ring: "ring-leaf-100" },
  reconnecting: { label: "Reconnecting", dot: "bg-amber-500", text: "text-amber-500", ring: "ring-amber-100" },
  error:        { label: "Fault",        dot: "bg-rose-500",  text: "text-rose-500", ring: "ring-rose-100" },
  closed:       { label: "Offline",      dot: "bg-ink-300",   text: "text-ink-500",  ring: "ring-ink-100" },
};

export default function SensorPulse({ status }: { status: SocketStatus }) {
  const s = MAP[status];
  const live = status === "connected";
  return (
    <span
      className={`hidden items-center gap-2 rounded-full border border-ink-100 bg-white px-3 py-1.5 ring-1 ${s.ring} sm:inline-flex`}
    >
      <span className="relative flex h-2 w-2">
        {live && (
          <span className="absolute inset-0 animate-ping rounded-full bg-leaf-500/50" />
        )}
        <span className={`relative h-2 w-2 rounded-full ${s.dot}`} />
      </span>
      <span className={`text-[10px] font-semibold uppercase tracking-widex ${s.text}`}>
        {s.label}
      </span>
    </span>
  );
}
