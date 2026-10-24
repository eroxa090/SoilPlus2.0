"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, LogOut, Menu, User as UserIcon, X } from "lucide-react";
import { useSensor } from "@/components/SensorProvider";
import { useUser } from "@/components/UserProvider";
import { LangSwitch, useLang } from "@/components/LanguageProvider";
import { ScrollThread } from "@/components/motion/Motion";
import type { Dict } from "@/lib/i18n/dict";
import type { SocketStatus } from "@/hooks/useSoilSocket";

/**
 * Two-tier header, like a farm-store sign: a thin dark strip for language
 * and account (collapses on scroll), and the kraft main bar for navigation.
 * Total height at the top of the page is 96px — see the padding in layout.
 */

type NavKey = Exclude<keyof Dict["nav"], "connect" | "ownerOnly" | "strip">;
type LinkDef = { href: string; key: NavKey; owner?: boolean };

// Only the dashboard still needs a device owner — it renders that owner's
// own plots. Everything else works for an anonymous visitor.
const LINKS: LinkDef[] = [
  { href: "/chat",       key: "chat" },
  { href: "/irrigation", key: "irrigation" },
  { href: "/diagnose",   key: "diagnose" },
  { href: "/forecast",   key: "forecast" },
  { href: "/weather",    key: "weather" },
  { href: "/heritage",   key: "heritage" },
  { href: "/shop",       key: "shop" },
  { href: "/dashboard",  key: "dashboard", owner: true },
];

const DOT: Record<SocketStatus, string> = {
  idle:         "bg-ink-300",
  connecting:   "bg-aqua-400 animate-breath",
  connected:    "bg-leaf-500",
  reconnecting: "bg-amber-500 animate-breath",
  error:        "bg-rose-500",
  closed:       "bg-ink-300",
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { status } = useSensor();
  const { user, logout } = useUser();
  const { t } = useLang();

  const isOwner = !!user?.deviceOwner;
  const live = status === "connected";
  const idle = status === "idle" || status === "closed";

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const connectButton = (
    <Link
      href="/connect"
      className={`btn ${live ? "btn-ghost" : "btn-primary"} px-3.5 py-2 text-[14px]`}
      aria-current={isActive(pathname, "/connect") ? "page" : undefined}
    >
      <span className="relative flex h-2 w-2">
        {live && <span className="absolute inset-0 animate-ping rounded-full bg-leaf-400/60" />}
        <span className={`relative h-2 w-2 rounded-full ${DOT[status]}`} />
      </span>
      {idle ? t.nav.connect : t.status[status]}
    </Link>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* ---------------------------------------------- strip ---- */}
      <div
        className={`overflow-hidden bg-ink-900 text-paper/80 transition-[height] duration-300 ${
          scrolled && !open ? "h-0" : "h-8"
        }`}
      >
        <div className="mx-auto flex h-8 max-w-[1280px] items-center justify-between gap-4 px-5 font-mono text-[11px] sm:px-8">
          <p className="hidden truncate tracking-wide sm:block">{t.nav.strip}</p>
          <div className="ml-auto flex items-center gap-4">
            <LangSwitch tone="dark" />
            {user ? (
              <>
                <Link href="/profile" className="flex items-center gap-1.5 hover:text-paper">
                  <UserIcon className="h-3.5 w-3.5" />
                  {user.name.split(" ")[0]}
                </Link>
                <button onClick={logout} className="flex items-center gap-1.5 hover:text-paper" title={t.common.logout}>
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t.common.logout}</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-paper">{t.common.login}</Link>
                <Link href="/signup" className="hidden text-amber-100 hover:text-paper sm:inline">{t.common.signup}</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------- main bar ---- */}
      <div
        className={`kraft relative border-b-2 border-ink-900/80 transition-shadow duration-300 ${
          scrolled ? "shadow-[0_4px_0_0_rgba(42,31,20,0.12)]" : ""
        }`}
      >
        {/* stitched seam along the bottom edge */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-1.5 border-t-2 border-dashed border-ink-900/25" />
        {/* red thread sewn along that seam as you read down the page */}
        <ScrollThread className="pointer-events-none absolute inset-x-0 bottom-1.5 h-0.5 bg-stamp-500" />

        <nav className="relative mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-6 px-5 sm:px-8">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5 text-ink-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-leaf-700 font-stamp text-[16px] text-paper shadow-[0_2px_0_0_#1F2A12] transition-transform duration-300 group-hover:-rotate-6">
              S<span className="text-leaf-300">+</span>
            </span>
            <span className="font-display text-[21px] font-semibold uppercase leading-none tracking-wide">SoilPlus</span>
          </Link>

          <ul className="hidden items-center xl:flex">
            {LINKS.map((l) => {
              const active = isActive(pathname, l.href);
              const gated = l.owner && !isOwner;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    title={gated ? t.nav.ownerOnly : undefined}
                    className={`group relative flex items-center gap-1 whitespace-nowrap px-3 py-2 font-display text-[15px] uppercase tracking-[0.05em] transition-colors ${
                      active ? "text-ink-900" : "text-ink-700 hover:text-ink-900"
                    }`}
                  >
                    {gated && <Lock className="h-3 w-3 text-ink-500" />}
                    {t.nav[l.key]}
                    {/* hover underline */}
                    <span className="absolute inset-x-3 bottom-0.5 h-[2px] origin-left scale-x-0 bg-ink-900/40 transition-transform duration-300 group-hover:scale-x-100" />
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-stamp-500"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex">{connectButton}</span>
            <button
              className="rounded-md border-2 border-ink-900/70 p-1.5 text-ink-900 transition-colors hover:bg-ink-900 hover:text-paper xl:hidden"
              aria-label={t.common.menu}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </div>

      {/* --------------------------------- mobile / tablet sheet ---- */}
      <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="sheet"
          initial={{ height: 0 }}
          animate={{ height: "auto" }}
          exit={{ height: 0 }}
          transition={{ type: "spring", bounce: 0.15, visualDuration: 0.32 }}
          style={{ overflow: "hidden" }}
          className="border-b-2 border-ink-900/80 bg-paper shadow-soft xl:hidden"
        >
          <motion.ul
            initial="hidden"
            animate="shown"
            variants={{ shown: { transition: { staggerChildren: 0.035, delayChildren: 0.05 } } }}
            className="mx-auto grid max-w-[1280px] gap-0.5 px-5 py-3 sm:grid-cols-2 sm:px-8"
          >
            {LINKS.map((l) => {
              const active = isActive(pathname, l.href);
              const gated = l.owner && !isOwner;
              return (
                <motion.li
                  key={l.href}
                  variants={{ hidden: { opacity: 0, x: -14 }, shown: { opacity: 1, x: 0 } }}
                  transition={{ type: "spring", bounce: 0.2, visualDuration: 0.3 }}
                >
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-md px-3 py-2.5 font-display text-[17px] uppercase tracking-wide ${
                      active ? "bg-ink-900 text-paper" : "text-ink-700 hover:bg-paper-alt"
                    }`}
                  >
                    {gated && <Lock className="h-3.5 w-3.5 opacity-60" />}
                    {t.nav[l.key]}
                  </Link>
                </motion.li>
              );
            })}
          </motion.ul>
          <div className="mx-auto max-w-[1280px] border-t border-dashed border-ink-900/25 px-5 py-3 sm:px-8 md:hidden">
            {connectButton}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </header>
  );
}
