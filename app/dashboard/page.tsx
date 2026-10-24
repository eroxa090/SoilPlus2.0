"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Activity, ArrowRight, Beaker, Droplets, Leaf, Radio, Thermometer, WifiOff } from "lucide-react";
import { useSensor } from "@/components/SensorProvider";
import { useLang } from "@/components/LanguageProvider";
import PageHeader from "@/components/PageHeader";
import { Reveal, StaggerItem, StaggerList } from "@/components/motion/Motion";
import SensorTile from "@/components/ui/SensorTile";
import { DASHBOARD } from "@/lib/i18n/pages/dashboard";

export default function DashboardPage() {
  const { latest, history, status, ip } = useSensor();
  const { lang, t: tc } = useLang();
  const t = DASHBOARD[lang];

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
      <PageHeader
        home={tc.common.home}
        crumb={t.crumb}
        eyebrow={t.eyebrow}
        title={t.title}
        lead={t.lead}
        aside={
          <div className="flex items-center gap-2 rounded-md bg-ink-900 px-3.5 py-2 font-mono text-xs text-paper/80">
            <Activity className="h-3.5 w-3.5 text-leaf-300" />
            {t.samples(history.length.toString().padStart(3, "0"))}
            {ip && (
              <>
                <span className="text-paper/30">/</span>
                {ip}
              </>
            )}
          </div>
        }
      />

      {status !== "connected" && (
        <Reveal className="mt-8 flex flex-col items-start gap-4 rounded-md border-2 border-dashed border-amber-500/60 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <WifiOff className="mt-1 h-5 w-5 shrink-0 text-amber-600" strokeWidth={2} />
            <div>
              <p className="font-display text-lg uppercase tracking-wide text-ink-900">{t.offlineTitle}</p>
              <p className="mt-0.5 text-sm text-ink-700">{t.offlineBody}</p>
            </div>
          </div>
          <Link href="/connect" className="btn btn-stamp">
            <Radio className="h-4 w-4" strokeWidth={2.5} />
            {t.connect}
          </Link>
        </Reveal>
      )}

      {/* Sensors */}
      <StaggerList className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StaggerItem>
          <SensorTile label={t.tiles.temp} unit="°C" value={latest?.temp ?? null} icon={Thermometer} tone="leaf"
            data={series.temp} idealMin={12} idealMax={24} precision={1} />
        </StaggerItem>
        <StaggerItem>
          <SensorTile label={t.tiles.ph} unit="pH" value={latest?.ph ?? null} icon={Beaker} tone="leaf"
            data={series.ph} idealMin={6.0} idealMax={7.2} precision={2} />
        </StaggerItem>
        <StaggerItem>
          <SensorTile label={t.tiles.tds} unit="ppm" value={latest?.tds ?? null} icon={Droplets} tone="aqua"
            data={series.tds} idealMin={200} idealMax={800} precision={0} />
        </StaggerItem>
        <StaggerItem>
          <SensorTile label={t.tiles.moist} unit="%" value={latest?.moist ?? null} icon={Leaf} tone="leaf"
            data={series.moist} idealMin={35} idealMax={65} precision={0} />
        </StaggerItem>
      </StaggerList>

      {/* Next actions */}
      <StaggerList ordered className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
        {t.actions.map((a, i) => (
          <StaggerItem key={a.href}>
            <Link href={a.href} className="card card-hover group flex h-full flex-col gap-3 p-6">
              <span className="font-stamp text-3xl text-ink-300 transition-colors group-hover:text-stamp-500">{i + 1}</span>
              <h2 className="text-2xl uppercase text-ink-900">{a.title}</h2>
              <p className="text-sm text-ink-500">{a.desc}</p>
              <span className="link-quiet mt-auto pt-2 text-sm">
                {a.cta}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
              </span>
            </Link>
          </StaggerItem>
        ))}
      </StaggerList>
    </main>
  );
}
