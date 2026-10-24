import Link from "next/link";
import OrnamentBand from "@/components/OrnamentBand";
import { getDict } from "@/lib/i18n/server";

export default async function Footer() {
  const t = (await getDict()).footer;
  const columns = [
    {
      title: t.platform,
      items: [
        { label: t.links.dashboard,  href: "/dashboard" },
        { label: t.links.irrigation, href: "/irrigation" },
        { label: t.links.chat,       href: "/chat" },
        { label: t.links.heritage,   href: "/heritage" },
      ],
    },
    {
      title: t.device,
      items: [
        { label: t.links.connect,     href: "/connect" },
        { label: t.links.firmware,    href: "/connect#firmware" },
        { label: t.links.calibration, href: "/connect#calibration" },
      ],
    },
    {
      title: t.about,
      items: [
        { label: t.links.project, href: "/about" },
        { label: t.links.team,    href: "/about#team" },
        { label: t.links.shop,    href: "/shop" },
      ],
    },
  ];

  return (
    <footer className="mt-24 bg-paper-alt/60">
      <OrnamentBand className="text-ink-900/35" />
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-10 px-5 pb-12 pt-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="inline-flex items-center gap-2.5 text-ink-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-leaf-700 font-stamp text-[15px] text-paper shadow-[0_2px_0_0_#1F2A12]">
              S<span className="text-leaf-300">+</span>
            </span>
            <span className="font-display text-[19px] font-semibold uppercase tracking-wide">SoilPlus</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">{t.tagline}</p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="font-mono text-xs text-ink-500">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.items.map((i) => (
                <li key={i.href}>
                  <Link href={i.href} className="text-sm text-ink-700 transition-colors hover:text-leaf-700">
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-ink-100">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-2 px-5 py-5 text-xs text-ink-500 sm:flex-row sm:items-center sm:px-8">
          <p>{t.copyright}</p>
          <p className="font-mono">{t.motto}</p>
        </div>
      </div>
    </footer>
  );
}
