import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import ReadingSheet from "@/components/home/ReadingSheet";
import OrnamentBand from "@/components/OrnamentBand";
import {
  CountUp,
  Magnetic,
  Parallax,
  Reveal,
  SewLine,
  StaggerItem,
  StaggerList,
  StampIn,
  StampLetters,
  Tilt,
} from "@/components/motion/Motion";
import { CROPS } from "@/lib/crops";
import { getDict, getLang } from "@/lib/i18n/server";

// Unsplash photography (free licence), stored in public/images so the demo
// works offline. Originals: images.unsplash.com/photo-1595024600400-2a49b9fce270,
// photo-1642952273588-ed6fa28870ac, photo-1594842059196-5b6b8fa73187.
const PHOTO = {
  steppe: "/images/steppe.jpg",
  soil:   "/images/soil.jpg",
  wheat:  "/images/wheat.jpg",
};

// Botanical names for the crop catalogue, keyed by crop id.
const LATIN: Record<string, string> = {
  wheat:         "Triticum aestivum",
  sunflower:     "Helianthus annuus",
  potato:        "Solanum tuberosum",
  tomato:        "Solanum lycopersicum",
  corn:          "Zea mays",
  alfalfa:       "Medicago sativa",
  cotton:        "Gossypium hirsutum",
  barley:        "Hordeum vulgare",
  soybean:       "Glycine max",
  "aport-apple": "Malus domestica ‘Aport’",
  tulipa:        "Tulipa greigii",
  saxaul:        "Haloxylon ammodendron",
};

export default async function LandingPage() {
  const lang = await getLang();
  const t = (await getDict()).home;

  return (
    <main className="overflow-x-clip">
      {/* ===================================================== HERO ===== */}
      <section className="relative isolate overflow-hidden">
        <Parallax distance={160}>
          <Image
            src={PHOTO.steppe}
            alt={t.photoAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_85%]"
          />
        </Parallax>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-900/10 to-ink-900/45" />

        <div className="mx-auto grid max-w-[1280px] items-start gap-12 px-5 pb-20 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[1.3fr_1fr] lg:pb-28 short:pt-8">
          {/* The sack label */}
          <Reveal y={40} className="kraft stitch relative rounded-md px-7 py-9 shadow-soft sm:px-12 sm:py-12 short:py-9">
            <p className="label-eyebrow pr-16 sm:pr-24">{t.batch}</p>

            <p className="mt-5 font-stamp text-[64px] leading-[0.9] text-ink-900 sm:text-[104px] short:mt-3 short:text-[84px]">
              <StampLetters text="SoilPlus" />
            </p>
            <p className="mt-2 font-display text-sm uppercase tracking-[0.22em] text-ink-700 sm:text-base">{t.kind}</p>

            <SewLine className="my-7 border-y-[3px] border-double border-ink-900 py-[3px] short:my-5" />

            <h1 className="font-display text-[40px] uppercase leading-[0.98] text-ink-900 sm:text-[58px] short:text-[50px]">
              {t.titleA}
              <br />
              <span className="text-leaf-700">{t.titleB}</span>
            </h1>
            <p className="mt-5 max-w-[50ch] text-[17px] leading-relaxed text-ink-900 short:mt-4">{t.lead}</p>

            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4 short:mt-6">
              <Magnetic>
                <Link href="/connect" className="btn btn-stamp group px-6 py-3.5 text-base">
                  {t.ctaConnect}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.5} />
                </Link>
              </Magnetic>
              <Link href="/irrigation" className="link-quiet">
                {t.ctaIrrigation}
                <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
            </div>

            {/* Inspection stamp */}
            <StampIn className="stamp absolute -right-2 -top-7 h-24 w-24 p-2 text-[12px] sm:-right-8 sm:-top-8 sm:h-36 sm:w-36 sm:text-[17px]">
              <span>
                {t.stamp[0]}
                <br />
                {t.stamp[1]}
                <br />
                <span className="text-[9px] sm:text-[12px]">{t.stamp[2]}</span>
              </span>
            </StampIn>
          </Reveal>

          <Reveal y={-60} delay={0.25}>
            <ReadingSheet />
          </Reveal>
        </div>
      </section>

      {/* ============================================ FIELD TRIAL BAND ===== */}
      <section className="bg-ink-900 text-paper">
        <div className="mx-auto max-w-[1280px] px-5 pt-10 sm:px-8">
          <p className="font-display text-xs uppercase tracking-[0.22em] text-amber-100/70">{t.statsLabel}</p>
          <dl className="mt-5 grid grid-cols-2 gap-y-6 sm:grid-cols-4">
            {t.stats.map((s, i) => (
              <div key={s.l} className={`${i ? "sm:border-l-2 sm:border-dashed sm:border-paper/20 sm:pl-6" : ""}`}>
                <dd className="font-display text-5xl font-semibold text-amber-100 sm:text-6xl">
                  <CountUp value={s.v} />
                </dd>
                <dt className="mt-1 font-display text-sm uppercase tracking-wider text-paper/70">{s.l}</dt>
              </div>
            ))}
          </dl>
        </div>
        {/* printed tape of specs */}
        <div className="ticker mt-8 overflow-hidden border-t border-dashed border-paper/20 py-3.5">
          <ul className="ticker-track font-mono text-[12px] text-paper/60">
            {[...t.specs, ...t.specs].map((s, i) => (
              <li key={i} aria-hidden={i >= t.specs.length} className="flex items-center gap-6 whitespace-nowrap pr-6">
                {s}
                <span className="text-amber-100/50">✦</span>
              </li>
            ))}
          </ul>
        </div>
        <OrnamentBand className="text-amber-100/25" />
      </section>

      {/* ========================================== DIRECTIONS FOR USE ===== */}
      <section className="mx-auto max-w-[1280px] px-5 py-24 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="label-eyebrow">{t.how.eyebrow}</p>
          <h2 className="mt-4 text-4xl uppercase leading-[1.08] text-ink-900 sm:text-[52px]">{t.how.title}</h2>
          <p className="mt-4 max-w-[50ch] text-lg text-ink-500">{t.how.lead}</p>
        </Reveal>

        <div className="relative mt-14">
          {/* dashed seam linking the steps, sewn as you scroll */}
          <SewLine className="absolute left-10 right-10 top-10 hidden border-t-[3px] border-dashed border-ink-900/25 md:block" />
          <StaggerList ordered className="relative grid gap-12 md:grid-cols-3 md:gap-8">
            {t.how.steps.map((s, i) => (
              <StaggerItem key={s.href}>
                <Link href={s.href} className="group block">
                  <span className="relative grid h-20 w-20 place-items-center rounded-full border-[3px] border-ink-900 bg-paper font-stamp text-4xl text-ink-900 transition-all duration-300 group-hover:-rotate-12 group-hover:bg-leaf-600 group-hover:text-paper">
                    {i + 1}
                  </span>
                  <h3 className="mt-6 flex items-center gap-2 text-2xl uppercase text-ink-900 sm:text-3xl">
                    {s.title}
                    <ArrowUpRight className="h-6 w-6 text-ink-300 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-leaf-600" />
                  </h3>
                  <p className="mt-3 max-w-[38ch] text-[15px] leading-relaxed text-ink-500">{s.desc}</p>
                </Link>
              </StaggerItem>
            ))}
          </StaggerList>
        </div>
      </section>

      {/* ===================================================== CONTENTS === */}
      <section className="burlap">
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Photo pinned with tape */}
          <Reveal x={-50} rotate={-6}>
            <figure className="relative mx-auto w-full max-w-[460px] -rotate-2 bg-white p-3 pb-12 shadow-soft transition-transform duration-500 hover:rotate-0">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image src={PHOTO.soil} alt={t.measures.photoAlt} fill sizes="(min-width: 1024px) 460px, 90vw" className="object-cover" />
              </div>
              <figcaption className="absolute bottom-3 left-4 font-hand text-2xl text-ink-700">{t.measures.photoAlt}</figcaption>
              <span aria-hidden className="absolute -top-3 left-1/2 h-7 w-28 -translate-x-1/2 rotate-[-4deg] bg-amber-100/80 shadow-sm" />
            </figure>
          </Reveal>

          {/* Composition table, printed like the back of a sack */}
          <Reveal x={50} delay={0.1} className="stitch rounded-md bg-white p-7 shadow-soft sm:p-10">
            <p className="label-eyebrow">{t.measures.eyebrow}</p>
            <h2 className="mt-4 text-4xl uppercase leading-[1.08] text-ink-900 sm:text-5xl">{t.measures.title}</h2>
            <p className="mt-4 max-w-[52ch] text-ink-500">{t.measures.lead}</p>

            <table className="mt-8 w-full border-collapse text-left">
              <thead>
                <tr className="bg-ink-900 font-display text-xs uppercase tracking-[0.14em] text-paper">
                  <th className="px-3 py-2 font-medium">{t.measures.colParam}</th>
                  <th className="hidden px-3 py-2 font-medium sm:table-cell">{t.measures.colRange}</th>
                  <th className="px-3 py-2 text-right font-medium">{t.measures.colAcc}</th>
                </tr>
              </thead>
              <tbody>
                {t.measures.rows.map((r) => (
                  <tr key={r.title} className="border-b-2 border-ink-900/15 align-top transition-colors last:border-ink-900 hover:bg-amber-50">
                    <td className="px-3 py-4">
                      <p className="font-display text-xl tracking-wide text-ink-900">{r.title}</p>
                      <p className="mt-0.5 text-sm text-ink-500">{r.blurb}</p>
                      <p className="mt-1 font-mono text-xs text-ink-700 sm:hidden">{r.range}</p>
                    </td>
                    <td className="hidden whitespace-nowrap px-3 py-4 font-mono text-sm text-ink-700 sm:table-cell">{r.range}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-right font-mono text-sm text-leaf-700">{r.acc}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Link href="/dashboard" className="link-quiet mt-8">
              {t.measures.cta}
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ============================================== CROP CATALOGUE === */}
      <section className="mx-auto max-w-[1280px] px-5 py-24 sm:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="label-eyebrow">{t.crops.eyebrow}</p>
            <h2 className="mt-4 text-4xl uppercase leading-[1.08] text-ink-900 sm:text-[52px]">{t.crops.title}</h2>
            <p className="mt-4 max-w-[52ch] text-ink-500">{t.crops.lead}</p>
          </div>
          <Link href="/irrigation" className="btn btn-primary group">
            {t.crops.cta}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.5} />
          </Link>
        </Reveal>

        {/* Seed packets */}
        <StaggerList className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {CROPS.map((c, i) => (
            <StaggerItem key={c.id}>
              <Tilt className="rounded-md">
              <Link
                href="/irrigation"
                className="card group flex h-full flex-col overflow-hidden transition-shadow duration-200 hover:shadow-[4px_6px_0_0_rgba(42,31,20,0.14)]"
              >
                <div className="flex items-center justify-between bg-leaf-700 px-3 py-1.5 font-mono text-[11px] text-leaf-100 transition-colors group-hover:bg-stamp-500">
                  <span>№ {String(i + 1).padStart(2, "0")}</span>
                  <span>SoilPlus</span>
                </div>
                <div className="flex flex-1 flex-col px-3 pb-4 pt-3">
                  <p className="font-display text-lg uppercase leading-tight text-ink-900">
                    {lang === "ru" ? c.nameRu : c.name}
                  </p>
                  <p className="mt-1 text-[13px] italic leading-snug text-ink-500">{LATIN[c.id]}</p>
                </div>
              </Link>
              </Tilt>
            </StaggerItem>
          ))}
        </StaggerList>
      </section>

      {/* =========================================================== CTA */}
      <section className="relative isolate overflow-hidden">
        <Parallax distance={120}>
          <Image src={PHOTO.wheat} alt={t.final.photoAlt} fill sizes="100vw" className="object-cover" />
        </Parallax>
        <div className="absolute inset-0 -z-10 bg-ink-900/45" />
        <div className="mx-auto max-w-[1280px] px-5 py-24 sm:px-8">
          <Reveal y={50} className="stitch relative max-w-xl rounded-md bg-white p-8 shadow-soft sm:p-10">
            <p className="label-eyebrow">{t.final.eyebrow}</p>
            <h2 className="mt-4 text-4xl uppercase leading-[1.08] text-ink-900 sm:text-5xl">{t.final.title}</h2>
            <ol className="mt-6 space-y-2">
              {t.final.steps.map((s, i) => (
                <li key={s} className="flex items-center gap-3 font-display text-lg uppercase tracking-wide text-ink-700">
                  <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink-900 font-mono text-sm normal-case text-ink-900">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
            <Magnetic className="mt-8">
              <Link href="/connect" className="btn btn-stamp group px-6 py-3.5 text-base">
                {t.final.cta}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.5} />
              </Link>
            </Magnetic>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
