"use client";

import { motion } from "framer-motion";
import type { SocketStatus } from "@/hooks/useSoilSocket";

const STATE_MAP: Record<
  SocketStatus,
  { label: string; dot: string; text: string; ring: string }
> = {
  idle:         { label: "Standby",      dot: "bg-gold/40",          text: "text-gold/60",        ring: "ring-gold/15" },
  connecting:   { label: "Connecting",   dot: "bg-gold-cream",       text: "text-gold-cream",     ring: "ring-gold/30" },
  connected:    { label: "Online",       dot: "bg-gold",             text: "text-gold",           ring: "ring-gold/40" },
  reconnecting: { label: "Reconnecting", dot: "bg-gold/70",          text: "text-gold-cream/80",  ring: "ring-gold/25" },
  error:        { label: "Fault",        dot: "bg-red-400",          text: "text-red-300",        ring: "ring-red-400/30" },
  closed:       { label: "Offline",      dot: "bg-gold/25",          text: "text-gold/50",        ring: "ring-gold/10" },
};

export default function ConnectionIndicator({
  status,
}: {
  status: SocketStatus;
}) {
  const s = STATE_MAP[status];
  const live = status === "connected";

  return (
    <div
      className={`inline-flex items-center gap-3 rounded-full border border-gold-line bg-obsidian/60 px-4 py-1.5 ring-1 ${s.ring} backdrop-blur-xl`}
    >
      <span className="relative flex h-2 w-2">
        {live && (
          <motion.span
            className="absolute inset-0 rounded-full bg-gold/70"
            animate={{ scale: [1, 2.2, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <span className={`relative h-2 w-2 rounded-full ${s.dot}`} />
      </span>
      <span
        className={`font-sans text-[10px] font-medium uppercase tracking-ultra ${s.text}`}
      >
        {s.label}
      </span>
    </div>
  );
}
