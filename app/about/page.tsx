import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { CountUp, Reveal, StaggerItem, StaggerList, StampIn } from "@/components/motion/Motion";
import { DICTS } from "@/lib/i18n/dict";
import { getLang } from "@/lib/i18n/server";
import { ABOUT } from "@/lib/i18n/pages/about";

export async function generateMetadata(): Promise<Metadata> {
  const t = ABOUT[await getLang()];
  return { title: t.metaTitle, description: t.metaDescription };
}

export default async function AboutPage() {
  const lang = await getLang();
  const t = ABOUT[lang];
  const tc = DICTS[lang];

  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-24 pt-10 sm:px-8">
      <PageHeader photo="wheat" home={tc.common.home} crumb={t.crumb} eyebrow={t.eyebrow} title={t.title} lead={t.subtitle} />

      {/* HERO */}
      <section className="mt-10 grid items-start gap-12 lg:grid-cols-[1.15fr_1fr]">
        <Reveal>
          <p className="text-lg leading-relaxed text-ink-700">{t.intro}</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/shop" className="btn btn-stamp group">
              {t.buy}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
            </Link>
            <Link href="/chat" className="link-quiet">
              {t.ask}
            </Link>
          </div>

          <dl className="mt-10 grid grid-cols-2 overflow-hidden rounded-md bg-ink-900 text-paper sm:grid-cols-4">
            {t.stats.map((s, i) => (
              <div key={s.l} className={`p-4 ${i ? "border-l border-dashed border-paper/20" : ""}`}>
                <dd className="font-display text-3xl font-semibold text-amber-100">
                  <CountUp value={s.v} />
                </dd>
                <dt className="mt-1 text-xs leading-snug text-paper/70">{s.l}</dt>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal x={40} rotate={4} className="relative">
          <figure className="rotate-2 bg-white p-3 pb-12 shadow-soft">
            <Image
              src="/soilplus-device.jpg"
              alt={t.photoAlt}
              width={1200}
              height={1600}
              className="h-auto w-full object-cover"
              sizes="(max-width: 1024px) 100vw, 460px"
            />
            <figcaption className="absolute bottom-3 left-4 font-hand text-2xl text-ink-700">{t.photoCaption}</figcaption>
          </figure>
          <span aria-hidden className="absolute -top-3 right-12 h-7 w-24 rotate-[8deg] bg-amber-100/80 shadow-sm" />
        </Reveal>
      </section>

      {/* PROBLEM + HYPOTHESIS */}
      <section className="mt-20 grid gap-6 lg:grid-cols-2">
        <Reveal className="card p-7">
          <h2 className="text-3xl uppercase text-ink-900">{t.problem}</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-700">{t.problemP1}</p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-700">{t.problemP2}</p>
        </Reveal>
        <Reveal delay={0.08} className="kraft stitch rounded-md p-7 shadow-card">
          <h2 className="text-3xl uppercase text-ink-900">{t.hypothesis}</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-900">{t.hypothesisP}</p>
          <p className="mt-5 rounded bg-ink-900 px-4 py-3 text-center font-mono text-sm text-amber-100">
            V = ΔW × НВ × D × ρ × S × K<sub>pH</sub> × K<sub>EC</sub>
          </p>
          <p className="mt-3 text-xs leading-snug text-ink-700">{t.formulaNote}</p>
        </Reveal>
      </section>

      {/* HARDWARE */}
      <section className="mt-20">
        <Reveal>
          <p className="label-eyebrow">{t.hwEyebrow}</p>
          <h2 className="mt-3 text-4xl uppercase text-ink-900">{t.hwTitle}</h2>
        </Reveal>
        <Reveal className="stitch mt-7 rounded-md bg-white p-6 shadow-card sm:p-8">
          <table className="w-full border-collapse text-left">
            <tbody>
              {t.hardware.map(([name, role]) => (
                <tr key={name} className="border-b-2 border-ink-900/10 last:border-ink-900/60">
                  <td className="py-3 pr-4 font-display text-lg uppercase tracking-wide text-ink-900">{name}</td>
                  <td className="py-3 text-right text-sm text-ink-500">{role}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-5 text-sm leading-relaxed text-ink-700">{t.hwNote}</p>
        </Reveal>
      </section>

      {/* ALGORITHM */}
      <section className="mt-20">
        <Reveal>
          <p className="label-eyebrow">{t.algoEyebrow}</p>
          <h2 className="mt-3 text-4xl uppercase text-ink-900">{t.algoTitle}</h2>
        </Reveal>
        <div className="relative mt-8">
          <div aria-hidden className="absolute bottom-6 left-[19px] top-6 border-l-[3px] border-dashed border-ink-900/20" />
          <StaggerList ordered className="relative space-y-4">
            {t.algo.map((step, i) => (
              <StaggerItem key={step} className="flex items-center gap-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-[3px] border-ink-900 bg-paper font-stamp text-lg text-ink-900">
                  {i + 1}
                </span>
                <span className="card flex-1 px-5 py-3 text-[15px] text-ink-700">{step}</span>
              </StaggerItem>
            ))}
          </StaggerList>
        </div>
      </section>

      {/* ACCURACY */}
      <section className="mt-20">
        <Reveal>
          <p className="label-eyebrow">{t.accEyebrow}</p>
          <h2 className="mt-3 text-4xl uppercase text-ink-900">{t.accTitle}</h2>
        </Reveal>
        <Reveal className="mt-7 overflow-x-auto rounded-md border-2 border-ink-900 bg-white shadow-card">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="bg-ink-900 text-left font-display text-xs uppercase tracking-[0.14em] text-paper">
                {t.accCols.map((c) => (
                  <th key={c} className="px-5 py-3 font-medium">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.accuracy.map(([metric, value, limit]) => (
                <tr key={metric} className="border-b-2 border-ink-900/10 last:border-0 hover:bg-amber-50">
                  <td className="px-5 py-3 font-display text-base uppercase tracking-wide text-ink-900">{metric}</td>
                  <td className="px-5 py-3 font-mono text-leaf-700">{value}</td>
                  <td className="px-5 py-3 font-mono text-ink-500">{limit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
        <p className="mt-3 text-xs leading-snug text-ink-500">{t.accNote}</p>
      </section>

      {/* FIELD TEST */}
      <section className="mt-20">
        <Reveal>
          <p className="label-eyebrow">{t.fieldEyebrow}</p>
          <h2 className="mt-3 text-4xl uppercase text-ink-900">{t.fieldTitle}</h2>
        </Reveal>
        <Reveal className="burlap mt-7 rounded-md p-1.5 shadow-card">
          <dl className="stitch grid gap-px overflow-hidden rounded bg-ink-900/10 sm:grid-cols-2 lg:grid-cols-3">
            {t.field.map(([k, v]) => (
              <div key={k} className="bg-white p-4">
                <dt className="font-display text-xs uppercase tracking-[0.14em] text-ink-500">{k}</dt>
                <dd className="mt-1 text-[15px] text-ink-900">{v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <StaggerList className="mt-6 grid gap-5 sm:grid-cols-3">
          {t.outcomes.map((o) => (
            <StaggerItem key={o.l} className="rounded-md border-l-4 border-leaf-600 bg-leaf-50 p-5">
              <p className="font-display text-4xl font-semibold text-ink-900">{o.v}</p>
              <p className="mt-1 font-display text-sm uppercase tracking-wide text-ink-700">{o.l}</p>
              <p className="mt-1 text-xs text-ink-500">{o.s}</p>
            </StaggerItem>
          ))}
        </StaggerList>
      </section>

      {/* ECONOMY */}
      <section className="mt-20">
        <Reveal>
          <p className="label-eyebrow">{t.econEyebrow}</p>
          <h2 className="mt-3 text-4xl uppercase text-ink-900">{t.econTitle}</h2>
        </Reveal>
        <Reveal className="mt-7 grid gap-8 rounded-md border-2 border-ink-900/15 bg-white p-7 shadow-card lg:grid-cols-2">
          {[
            [t.proto, t.protoList],
            [t.effect, t.effectList],
          ].map(([title, list]) => (
            <div key={title as string}>
              <p className="font-display text-lg uppercase tracking-wide text-ink-900">{title as string}</p>
              <ul className="mt-3 space-y-2 text-[15px] text-ink-700">
                {(list as string[]).map((x) => (
                  <li key={x} className="flex gap-2.5 border-b border-dashed border-ink-900/15 pb-2 last:border-0">
                    <span className="text-stamp-500">✦</span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Reveal>
      </section>

      {/* TEAM — signatures */}
      <section id="team" className="mt-20 scroll-mt-28">
        <Reveal>
          <p className="label-eyebrow">{t.teamEyebrow}</p>
          <h2 className="mt-3 text-4xl uppercase text-ink-900">{t.teamTitle}</h2>
        </Reveal>
        <StaggerList className="mt-7 grid gap-5 sm:grid-cols-2">
          {t.team.map((p) => (
            <StaggerItem key={p.name} className="card p-6">
              <span className="chip chip-ghost">{t.cofounder}</span>
              <p className="mt-4 font-hand text-4xl leading-none text-ink-900">{p.name}</p>
              <div className="mt-2 border-t-2 border-ink-900/60" />
              <p className="mt-3 text-sm text-ink-500">{p.note}</p>
            </StaggerItem>
          ))}
        </StaggerList>
        <p className="mt-4 font-mono text-xs text-ink-500">{t.teamFoot}</p>
      </section>

      {/* CTA */}
      <Reveal className="relative mt-20">
        <section className="relative overflow-hidden rounded-md bg-leaf-800 p-8 text-paper sm:p-12">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.08] [filter:invert(1)]" />
          <div className="relative max-w-2xl">
            <h2 className="text-3xl uppercase sm:text-4xl">{t.ctaTitle}</h2>
            <p className="mt-3 text-leaf-100">{t.ctaBody}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/shop" className="btn group bg-paper text-ink-900 hover:bg-white">
                {t.ctaBuy}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
              </Link>
              <Link href="/chat" className="btn border-2 border-paper/40 text-paper hover:bg-paper/10">
                {t.ask}
              </Link>
            </div>
          </div>
          <StampIn rotate={-14} delay={0.3} className="stamp absolute -right-4 -top-4 hidden h-32 w-32 border-amber-100 text-[14px] text-amber-100 mix-blend-normal sm:grid">
            <span>
              SoilPlus
              <br />
              2026
            </span>
          </StampIn>
        </section>
      </Reveal>
    </main>
  );
}
