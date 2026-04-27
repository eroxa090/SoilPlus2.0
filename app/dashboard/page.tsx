"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Activity,
  ArrowRight,
  Beaker,
  Bot,
  Droplets,
  Leaf,
  Radio,
  Thermometer,
  WifiOff,
} from "lucide-react";
import { useSensor } from "@/components/SensorProvider";
import SensorTile from "@/components/ui/SensorTile";

export default function DashboardPage() {
  const { latest, history, status, ip } = useSensor();

  const series = useMemo(() => {
    const temp:  { t: number; value: number }[] = [];
    const ph:    { t: number; value: number }[] = [];
    const tds:   { t: number; value: number }[] = [];
    const moist: { t: number; value: number }[] = [];
    for (const s of history) {
      temp.push({ t: s.t, value: s.temp });
      ph.push({ t: s.t, value: s.ph });
      tds.push({ t: s.t, value: s.tds });
      moist.push({ t: s.t, value: s.moist });
    }
    return { temp, ph, tds, moist };
  }, [history]);

  return (
    <main className="mx-auto max-w-[1280px] px-5 pb-24 pt-10 sm:px-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="label-eyebrow">Live telemetry</span>
          <h1 className="mt-2 font-display text-4xl tracking-tightx text-ink-900 sm:text-5xl">
            Your field,<br />second by second.
          </h1>
          <p className="mt-3 max-w-xl text-ink-500">
            Each tile is streaming directly from the ESP32 probe. Values update
            five times per second with the last 120 samples drawn beneath them.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="card flex items-center gap-2 px-3.5 py-2">
            <Activity className="h-3.5 w-3.5 text-leaf-600" />
            <span className="font-mono text-xs text-ink-500">
              {history.length.toString().padStart(3, "0")} samples
            </span>
            {ip && (
              <>
                <span className="mx-1 text-ink-200">·</span>
                <span className="font-mono text-xs text-ink-500">{ip}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {status !== "connected" && (
        <OfflineBanner />
      )}

      {/* Sensors */}
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SensorTile
          label="Soil Temperature"
          unit="°C"
          value={latest?.temp ?? null}
          icon={Thermometer}
          tone="leaf"
          data={series.temp}
          idealMin={12}
          idealMax={24}
          precision={1}
        />
        <SensorTile
          label="pH · Acidity"
          unit="pH"
          value={latest?.ph ?? null}
          icon={Beaker}
          tone="leaf"
          data={series.ph}
          idealMin={6.0}
          idealMax={7.2}
          precision={2}
        />
        <SensorTile
          label="TDS · Salinity"
          unit="ppm"
          value={latest?.tds ?? null}
          icon={Droplets}
          tone="aqua"
          data={series.tds}
          idealMin={200}
          idealMax={800}
          precision={0}
        />
        <SensorTile
          label="Moisture"
          unit="%"
          value={latest?.moist ?? null}
          icon={Leaf}
          tone="leaf"
          data={series.moist}
          idealMin={35}
          idealMax={65}
          precision={0}
        />
      </div>

      {/* Next actions */}
      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        <ActionCard
          icon={Droplets}
          title="Plan irrigation"
          desc="Turn these numbers into litres for your crop and plot size."
          href="/irrigation"
          cta="Open calculator"
        />
        <ActionCard
          icon={Bot}
          title="Ask the agronomist"
          desc="Chat with the AI. It already sees what the sensors see."
          href="/chat"
          cta="Start chat"
        />
        <ActionCard
          icon={Leaf}
          title="Heritage check"
          desc="Score the plot against Almaty Aport, Greig's tulip or saxaul."
          href="/heritage"
          cta="Run analysis"
        />
      </div>
    </main>
  );
}

function OfflineBanner() {
  return (
    <div className="mt-8 rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-amber-500">
            <WifiOff className="h-4 w-4" strokeWidth={1.8} />
          </div>
          <div>
            <p className="font-display text-base font-semibold text-ink-900">
              No live feed yet
            </p>
            <p className="mt-0.5 text-sm text-ink-500">
              Connect your ESP32 to start streaming. The dashboard will light
              up automatically within 200 ms.
            </p>
          </div>
        </div>
        <Link href="/connect" className="btn btn-primary">
          <Radio className="h-4 w-4" strokeWidth={2} />
          Connect Device
        </Link>
      </div>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  desc,
  href,
  cta,
}: {
  icon: typeof Activity;
  title: string;
  desc: string;
  href: string;
  cta: string;
}) {
  return (
    <Link href={href} className="card card-hover group relative flex flex-col gap-3 p-6">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-leaf-50 text-leaf-700">
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </div>
      <h3 className="font-display text-xl text-ink-900">{title}</h3>
      <p className="text-sm text-ink-500">{desc}</p>
      <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-leaf-700">
        {cta}
        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
