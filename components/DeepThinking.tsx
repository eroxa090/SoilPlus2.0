"use client";

import { motion } from "framer-motion";

/**
 * "Deep Thinking" state — shown while the AI analyzes.
 * Animates soil data points drifting toward cultural heritage anchors,
 * visualising "sensor → cultural memory" mapping.
 */
export default function DeepThinking() {
  const dataPoints = [
    { label: "pH",    x: 8,  y: 30, delay: 0.0 },
    { label: "TDS",   x: 18, y: 70, delay: 0.15 },
    { label: "°C",    x: 4,  y: 55, delay: 0.3 },
    { label: "H₂O",   x: 14, y: 15, delay: 0.45 },
  ];

  const anchors = [
    { label: "Aport",  x: 70, y: 22 },
    { label: "Tulipa", x: 88, y: 50 },
    { label: "Saxaul", x: 72, y: 78 },
  ];

  return (
    <div className="relative h-[260px] w-full overflow-hidden rounded-2xl border border-gold/15 bg-obsidian/70">
      {/* grid + koshkar texture */}
      <div className="absolute inset-0 deep-grid opacity-60" />
      <div className="koshkar-pattern absolute inset-0 opacity-30" />

      {/* sweeping scan-bar */}
      <motion.div
        className="absolute inset-y-0 w-24"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.18) 50%, transparent 100%)",
          filter: "blur(6px)",
        }}
        initial={{ x: "-10%" }}
        animate={{ x: "110%" }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />

      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="thinkLine" x1="0" x2="1">
            <stop offset="0%"   stopColor="#d4af37" stopOpacity="0.05" />
            <stop offset="50%"  stopColor="#f5e6ca" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#d4af37" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* connective ley-lines data → anchor */}
        {dataPoints.map((d) =>
          anchors.map((a, j) => (
            <motion.line
              key={`${d.label}-${a.label}-${j}`}
              x1={d.x}
              y1={d.y}
              x2={a.x}
              y2={a.y}
              stroke="url(#thinkLine)"
              strokeWidth="0.15"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 0.9, 0.35] }}
              transition={{
                duration: 1.8,
                delay: d.delay + j * 0.1,
                repeat: Infinity,
                repeatDelay: 0.8,
                ease: "easeInOut",
              }}
            />
          )),
        )}
      </svg>

      {/* sensor data labels (left) */}
      {dataPoints.map((d) => (
        <motion.div
          key={d.label}
          className="absolute"
          style={{ left: `${d.x}%`, top: `${d.y}%` }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: d.delay, duration: 0.5 }}
        >
          <div className="relative -translate-x-1/2 -translate-y-1/2">
            <div className="absolute inset-0 animate-ping rounded-full bg-gold/30 blur" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 bg-obsidian font-mono text-[10px] text-gold">
              {d.label}
            </div>
          </div>
        </motion.div>
      ))}

      {/* heritage anchors (right) */}
      {anchors.map((a, i) => (
        <motion.div
          key={a.label}
          className="absolute"
          style={{ left: `${a.x}%`, top: `${a.y}%` }}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 + i * 0.1, duration: 0.6 }}
        >
          <div className="flex -translate-x-1/2 -translate-y-1/2 items-center gap-2">
            <div className="h-2.5 w-2.5 rotate-45 border border-gold bg-gold/30" />
            <span className="font-serif text-[11px] italic tracking-wide text-gold-cream/80">
              {a.label}
            </span>
          </div>
        </motion.div>
      ))}

      {/* caption */}
      <div className="absolute bottom-3 left-0 right-0 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity }}
          className="font-mono text-[10px] uppercase tracking-ultra text-gold/60"
        >
          mapping soil chemistry · to cultural memory
        </motion.p>
      </div>
    </div>
  );
}
