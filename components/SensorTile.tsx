"use client";

import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";
import type { LucideIcon } from "lucide-react";
import BentoCard, { staggerItem } from "./BentoCard";

export type SensorSeriesPoint = { t: number; value: number };

type Props = {
  label: string;
  unit: string;
  value: number | null;
  icon: LucideIcon;
  data: SensorSeriesPoint[];
  idealMin?: number;
  idealMax?: number;
  precision?: number;
  /** `lg` sensor tiles are used as hero anchors of the bento grid. */
  size?: "sm" | "lg";
};

function verdict(
  value: number | null,
  min?: number,
  max?: number,
): "ideal" | "marginal" | "critical" | "idle" {
  if (value === null || min === undefined || max === undefined) return "idle";
  if (value >= min && value <= max) return "ideal";
  const span = Math.max(max - min, 0.0001);
  const dist = value < min ? min - value : value - max;
  return dist < span * 0.25 ? "marginal" : "critical";
}

const VERDICT_STYLE: Record<string, string> = {
  ideal:    "text-gold border-gold/40 bg-gold/5",
  marginal: "text-gold-cream border-gold-cream/30 bg-gold-cream/5",
  critical: "text-red-300 border-red-400/30 bg-red-500/5",
  idle:     "text-gold/40 border-gold/15 bg-gold/5",
};

export default function SensorTile({
  label,
  unit,
  value,
  icon: Icon,
  data,
  idealMin,
  idealMax,
  precision = 1,
  size = "sm",
}: Props) {
  const state = verdict(value, idealMin, idealMax);
  const gradientId = `g-${label.replace(/\s+/g, "-").toLowerCase()}`;
  const chartHeight = size === "lg" ? 140 : 96;

  return (
    <BentoCard
      variants={staggerItem}
      eyebrow={label}
      meta={
        <span
          className={`rounded-full border px-2 py-0.5 font-sans text-[9px] font-medium uppercase tracking-ultra ${VERDICT_STYLE[state]}`}
        >
          {state}
        </span>
      }
    >
      {/* Top row — icon + ideal range */}
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/15 bg-gold/5">
          <Icon className="h-4 w-4 text-gold" strokeWidth={1.4} />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-gold/40">
          {idealMin !== undefined && idealMax !== undefined
            ? `ideal ${idealMin}–${idealMax} ${unit}`
            : "—"}
        </p>
      </div>

      {/* Big value */}
      <div className="mt-6 flex items-baseline gap-2">
        <motion.span
          key={value ?? "na"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          className="font-serif text-5xl font-medium tabular-nums text-gold-cream neon-gold"
        >
          {value === null ? "—" : value.toFixed(precision)}
        </motion.span>
        <span className="font-sans text-xs uppercase tracking-ultra text-gold/50">
          {unit}
        </span>
      </div>

      {/* Chart — clean-tech: no axes, gold gradient */}
      <div className="mt-5" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%"   stopColor="#d4af37" stopOpacity={0.7} />
                <stop offset="50%"  stopColor="#d4af37" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={["auto", "auto"]} hide />
            <Tooltip
              cursor={{ stroke: "#d4af37", strokeOpacity: 0.25, strokeDasharray: "3 3" }}
              contentStyle={{
                background: "rgba(15,13,11,0.95)",
                border: "1px solid rgba(212,175,55,0.25)",
                borderRadius: 12,
                fontSize: 11,
                color: "#f5e6ca",
                fontFamily: "var(--font-inter)",
                padding: "6px 10px",
              }}
              labelFormatter={() => ""}
              formatter={(v: number) => [`${v.toFixed(precision)} ${unit}`, label]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#d4af37"
              strokeWidth={1.6}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
              dot={false}
              activeDot={{ r: 3, fill: "#f5e6ca", stroke: "#d4af37" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </BentoCard>
  );
}
