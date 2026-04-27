"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LogIn,
  LogOut,
  Lock,
  Menu,
  Sprout,
  User as UserIcon,
  X,
} from "lucide-react";
import { useSensor } from "@/components/SensorProvider";
import { useUser } from "@/components/UserProvider";
import SensorPulse from "./SensorPulse";

type LinkDef = { href: string; label: string; owner?: boolean };

const PUBLIC_LINKS: LinkDef[] = [
  { href: "/diagnose", label: "Diagnose" },
  { href: "/forecast", label: "Forecast" },
  { href: "/weather",  label: "Weather"  },
  { href: "/heritage", label: "Heritage" },
  { href: "/shop",     label: "Shop"     },
];

const OWNER_LINKS: LinkDef[] = [
  { href: "/dashboard",  label: "Dashboard",   owner: true },
  { href: "/irrigation", label: "Irrigation",  owner: true },
  { href: "/chat",       label: "AI Agronomist", owner: true },
  { href: "/connect",    label: "Connect",     owner: true },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { status } = useSensor();
  const { user, logout } = useUser();

  const isOwner = !!user?.deviceOwner;
  const visibleLinks: LinkDef[] = [
    ...PUBLIC_LINKS,
    ...OWNER_LINKS, // always show; lock icon indicates gated
  ];

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-ink-100 bg-paper/85 backdrop-blur-xl"
          : "border-b border-transparent bg-paper/70 backdrop-blur"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 text-ink-900">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-leaf-600 shadow-[0_4px_12px_-4px_rgba(43,116,64,0.55)]">
            <Sprout className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <span className="font-display text-[17px] font-semibold tracking-tightx">
            SoilPlus
          </span>
          <span className="hidden rounded-full border border-ink-100 bg-white px-2 py-0.5 font-mono text-[10px] font-medium text-ink-500 sm:inline-block">
            v2.0
          </span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {visibleLinks.map((l) => {
            const active =
              pathname === l.href ||
              (l.href !== "/" && pathname.startsWith(l.href));
            const gated = l.owner && !isOwner;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? "bg-leaf-50 text-leaf-700"
                      : "text-ink-500 hover:text-ink-900"
                  }`}
                >
                  {gated && <Lock className="h-3 w-3 text-ink-400" />}
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          {isOwner && <SensorPulse status={status} />}
          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/profile" className="btn btn-ghost">
                <UserIcon className="h-4 w-4" />
                {user.name.split(" ")[0]}
              </Link>
              <button onClick={logout} className="btn btn-ghost" title="Выйти">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className="btn btn-ghost">
                <LogIn className="h-4 w-4" />
                Войти
              </Link>
              <Link href="/signup" className="btn btn-primary">
                Регистрация
              </Link>
            </div>
          )}
          <button
            className="rounded-lg p-2 text-ink-700 lg:hidden"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile sheet */}
      {open && (
        <div className="border-t border-ink-100 bg-white lg:hidden">
          <ul className="mx-auto max-w-[1280px] px-5 py-3 sm:px-8">
            {visibleLinks.map((l) => {
              const active = pathname === l.href;
              const gated = l.owner && !isOwner;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                      active
                        ? "bg-leaf-50 text-leaf-700"
                        : "text-ink-700 hover:bg-ink-100/50"
                    }`}
                  >
                    {gated && <Lock className="h-3.5 w-3.5 text-ink-400" />}
                    {l.label}
                  </Link>
                </li>
              );
            })}
            <li className="mt-2 border-t border-ink-100 pt-2">
              {user ? (
                <div className="flex items-center justify-between px-3 py-2 text-sm">
                  <Link href="/profile" className="flex items-center gap-2 text-ink-700">
                    <UserIcon className="h-4 w-4" />
                    {user.name}
                  </Link>
                  <button onClick={logout} className="text-ink-500">
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 px-3 py-2">
                  <Link href="/login" className="btn btn-ghost flex-1">
                    Войти
                  </Link>
                  <Link href="/signup" className="btn btn-primary flex-1">
                    Регистрация
                  </Link>
                </div>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
