import Image from "next/image";
import Link from "next/link";
import OrnamentBand from "@/components/OrnamentBand";
import { Parallax, Reveal } from "@/components/motion/Motion";

// Same Unsplash photography as the landing page (see app/page.tsx).
const PHOTOS = {
  steppe: "/images/steppe.jpg",
  soil:   "/images/soil.jpg",
  wheat:  "/images/wheat.jpg",
} as const;

/**
 * Banner header shared by the inner pages: a full-width field photograph
 * under a dark wash, with breadcrumb, eyebrow, title and lead set on it, an
 * optional slot on the right (status chips, buttons) on a paper tag, and a
 * syrmak border sewn along the bottom edge.
 */
export default function PageHeader({
  home,
  crumb,
  eyebrow,
  title,
  lead,
  aside,
  photo = "soil",
}: {
  home: string;
  crumb: string;
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  aside?: React.ReactNode;
  photo?: keyof typeof PHOTOS;
}) {
  return (
    <header className="relative isolate -mt-10 pb-20 pt-12 sm:pb-24 sm:pt-16">
      {/* full-bleed backdrop, while the text stays on the page's own grid */}
      <div aria-hidden className="absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 overflow-hidden">
        <Parallax distance={90}>
          <Image src={PHOTOS[photo]} alt="" fill priority sizes="100vw" className="object-cover object-[50%_60%]" />
        </Parallax>
        <div className="absolute inset-0 bg-gradient-to-r from-ink-900/90 via-ink-900/70 to-ink-900/35" />
        <div className="kraft absolute inset-x-0 bottom-0 border-t-2 border-ink-900/80 py-2">
          <OrnamentBand height={30} className="text-ink-900/85" />
        </div>
      </div>

      <Reveal y={20} className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-mono text-xs text-paper/70">
            <Link href="/" className="hover:text-paper">{home}</Link>
            <span>/</span>
            <span className="text-paper">{crumb}</span>
          </nav>
          <p className="label-eyebrow mt-5 text-amber-100">{eyebrow}</p>
          <h1 className="mt-3 text-4xl uppercase leading-[1.05] text-paper [text-shadow:0_2px_0_rgba(42,31,20,0.5)] sm:text-[56px]">
            {title}
          </h1>
          {lead && <p className="mt-4 max-w-[60ch] text-[17px] leading-relaxed text-paper/85">{lead}</p>}
        </div>
        {aside && <div className="shrink-0 self-start rounded-md bg-paper p-3 shadow-card sm:self-end">{aside}</div>}
      </Reveal>
    </header>
  );
}
