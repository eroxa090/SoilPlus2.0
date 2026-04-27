"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";
import type { LucideIcon } from "lucide-react";

type Point = { t: number; value: number };
type Tone = "leaf" | "aqua" | "amber";

type Props = {
  label: string;
  unit: string;
  value: number | null;
  icon: LucideIcon;
  tone?: Tone;
  data: Point[];
  idealMin?: number;
  idealMax?: number;
  precision?: number;
};

const TONE: Record<
  Tone,
  { ring: string; text: string; fill: string; chip: string; stroke: string }
> = {
  leaf:  { ring: "ring-leaf-100",  text: "text-leaf-700",  fill: "#2B7440",  chip: "chip-leaf",  stroke: "#2B7440" },
  aqua:  { ring: "ring-aqua-100",  text: "text-aqua-500",  fill: "#1E7F99",  chip: "chip-aqua",  stroke: "#1E7F99" },
  amber: { ring: "ring-amber-100", text: "text-amber-500", fill: "#C88A1B",  chip: "chip-amber", stroke: "#C88A1B" },
};

function verdict(v: number | null, min?: number, max?: number): "ideal" | "marginal" | "critical" | "idle" {
  if (v === null || min === undefined || max === undefined) return "idle";
  if (v >= min && v <= max) return "ideal";
  const span = Math.max(max - min, 0.0001);
  const d = v < min ? min - v : v - max;
  return d < span * 0.25 ? "marginal" : "critical";
}

export default function SensorTile({
  label,
  unit,
  value,
  icon: Icon,
  tone = "leaf",
  data,
  idealMin,
  idealMax,
  precision = 1,
}: Props) {
  const t = TONE[tone];
  const state = verdict(value, idealMin, idealMax);
  const gid = `grad-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="card card-hover flex flex-col gap-4 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`grid h-10 w-10 place-items-center rounded-xl bg-leaf-50 ${t.text}`}>
            <Icon className="h-4 w-4" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widex text-ink-400">
              {label}
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-ink-300">
              {idealMin !== undefined && idealMax !== undefined
                ? `ideal ${idealMin}–${idealMax} ${unit}`
                : "—"}
            </p>
          </div>
        </div>
        <span
          className={`chip ${
            state === "ideal"
              ? "chip-leaf"
              : state === "marginal"
                ? "chip-amber"
                : state === "critical"
                  ? "chip-amber"
                  : "chip-ghost"
          }`}
        >
          {state === "idle" ? "awaiting" : state}
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="font-display text-[44px] font-semibold leading-none text-ink-900 tabular-nums">
          {value === null ? "—" : value.toFixed(precision)}
        </span>
        <span className="text-sm font-medium text-ink-400">{unit}</span>
      </div>

      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%"   stopColor={t.fill} stopOpacity={0.32} />
                <stop offset="100%" stopColor={t.fill} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={["auto", "auto"]} hide />
            <Tooltip
              cursor={{ stroke: t.stroke, strokeOpacity: 0.25, strokeDasharray: "3 3" }}
              contentStyle={{
                background: "#fff",
                border: "1px solid #E5E9E3",
                borderRadius: 10,
                fontSize: 11,
                color: "#0B1410",
                padding: "6px 10px",
                boxShadow: "0 10px 30px -10px rgba(11,20,16,0.18)",
              }}
              labelFormatter={() => ""}
              formatter={(v: number) => [`${v.toFixed(precision)} ${unit}`, label]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={t.stroke}
              strokeWidth={1.8}
              fill={`url(#${gid})`}
              isAnimationActive={false}
              dot={false}
              activeDot={{ r: 3, fill: "#fff", stroke: t.stroke, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
