import Link from "next/link";
import { Sprout } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-ink-100 bg-white">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5 text-ink-900">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-leaf-600">
              <Sprout className="h-4 w-4 text-white" strokeWidth={2} />
            </div>
            <span className="font-display text-[17px] font-semibold">SoilPlus</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-ink-500">
            Portable soil intelligence for small and medium-sized farms of
            Kazakhstan — a student research project from Uralsk.
          </p>
        </div>

        {[
          {
            title: "Platform",
            items: [
              { label: "Dashboard",   href: "/dashboard" },
              { label: "Irrigation",  href: "/irrigation" },
              { label: "AI Agronomist", href: "/chat" },
              { label: "Heritage",    href: "/heritage" },
            ],
          },
          {
            title: "Device",
            items: [
              { label: "Connect ESP32", href: "/connect" },
              { label: "Firmware",      href: "/connect#firmware" },
              { label: "Calibration",   href: "/connect#calibration" },
            ],
          },
          {
            title: "About",
            items: [
              { label: "Project", href: "/about" },
              { label: "Team",    href: "/about#team" },
              { label: "Shop",    href: "/shop" },
            ],
          },
        ].map((col) => (
          <div key={col.title}>
            <p className="label-eyebrow">{col.title}</p>
            <ul className="mt-4 space-y-2">
              {col.items.map((i) => (
                <li key={i.label}>
                  <Link
                    href={i.href}
                    className="text-sm text-ink-500 transition hover:text-leaf-700"
                  >
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-ink-100">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-2 px-5 py-5 text-xs text-ink-400 sm:flex-row sm:items-center sm:px-8">
          <p>© 2026 SoilPlus · Uralsk, Kazakhstan · Bekkaliev Sultan &amp; Muratkali Ersultan</p>
          <p className="font-mono tracking-widex uppercase text-ink-400">
            Precision agriculture for Central Asia
          </p>
        </div>
      </div>
    </footer>
  );
}
