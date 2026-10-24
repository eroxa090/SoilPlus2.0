"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";
import { useId } from "react";
import type { LucideIcon } from "lucide-react";
import { useLang } from "@/components/LanguageProvider";
import { AnimatedNumber } from "@/components/motion/Motion";
import { DASHBOARD } from "@/lib/i18n/pages/dashboard";

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

// Seed-sack palette
const TONE: Record<Tone, { text: string; stroke: string }> = {
  leaf:  { text: "text-leaf-700",  stroke: "#4A6128" },
  aqua:  { text: "text-aqua-500",  stroke: "#3D6B6E" },
  amber: { text: "text-amber-600", stroke: "#C38A1E" },
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
  const { lang } = useLang();
  const t = DASHBOARD[lang];
  const c = TONE[tone];
  const state = verdict(value, idealMin, idealMax);
  // useId, not the label: labels hold spaces, Cyrillic and "·", which make
  // fragile SVG url(#…) references.
  const gid = `grad-${useId().replace(/:/g, "")}`;

  return (
    <div className="card card-hover flex h-full flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`grid h-10 w-10 place-items-center rounded-md border-2 border-ink-900/15 bg-paper ${c.text}`}>
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
          <div>
            <p className="font-display text-sm uppercase tracking-wide text-ink-900">{label}</p>
            <p className="mt-0.5 font-mono text-[11px] text-ink-400">
              {idealMin !== undefined && idealMax !== undefined
                ? `${t.ideal} ${idealMin}–${idealMax} ${unit}`
                : "—"}
            </p>
          </div>
        </div>
        <span
          className={`chip shrink-0 ${
            state === "ideal" ? "chip-leaf"
            : state === "marginal" ? "chip-amber"
            : state === "critical" ? "text-stamp-500"
            : "chip-ghost"
          }`}
        >
          {t.state[state]}
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[44px] leading-none text-ink-900">
          {value === null ? "—" : <AnimatedNumber value={value} locale="en-US" decimals={precision} grouping={false} />}
        </span>
        <span className="text-sm text-ink-400">{unit}</span>
      </div>

      <div className="h-24 border-t-2 border-dashed border-ink-900/10 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%"   stopColor={c.stroke} stopOpacity={0.3} />
                <stop offset="100%" stopColor={c.stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={["auto", "auto"]} hide />
            <Tooltip
              cursor={{ stroke: c.stroke, strokeOpacity: 0.3, strokeDasharray: "3 3" }}
              contentStyle={{
                background: "#FAF4E6",
                border: "2px solid rgba(42,31,20,0.2)",
                borderRadius: 6,
                fontSize: 11,
                color: "#2A1F14",
                padding: "6px 10px",
                boxShadow: "3px 4px 0 0 rgba(42,31,20,0.12)",
              }}
              labelFormatter={() => ""}
              formatter={(v: number) => [`${v.toFixed(precision)} ${unit}`, label]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={c.stroke}
              strokeWidth={2}
              fill={`url(#${gid})`}
              isAnimationActive={false}
              dot={false}
              activeDot={{ r: 3, fill: "#FAF4E6", stroke: c.stroke, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
