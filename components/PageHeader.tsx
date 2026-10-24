import Link from "next/link";
import { Reveal } from "@/components/motion/Motion";

/**
 * Sack-label page header shared by the inner pages: breadcrumb, red
 * eyebrow, stencilled title and a lead paragraph, with an optional slot on
 * the right (status chips, buttons).
 */
export default function PageHeader({
  home,
  crumb,
  eyebrow,
  title,
  lead,
  aside,
}: {
  home: string;
  crumb: string;
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <Reveal y={20} className="flex flex-col gap-5 border-b-2 border-dashed border-ink-900/20 pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-mono text-xs text-ink-400">
          <Link href="/" className="hover:text-leaf-700">{home}</Link>
          <span>/</span>
          <span className="text-ink-700">{crumb}</span>
        </nav>
        <p className="label-eyebrow mt-5">{eyebrow}</p>
        <h1 className="mt-3 text-4xl uppercase leading-[1.05] text-ink-900 sm:text-[56px]">{title}</h1>
        {lead && <p className="mt-4 max-w-[60ch] text-[17px] leading-relaxed text-ink-500">{lead}</p>}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </Reveal>
  );
}
