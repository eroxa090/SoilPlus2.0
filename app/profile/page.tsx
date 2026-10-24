"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BadgeCheck, Calendar, Loader2, LogOut, Mail, ShoppingBag } from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { useLang } from "@/components/LanguageProvider";
import PageHeader from "@/components/PageHeader";
import { Reveal, Seeds, StaggerItem, StaggerList } from "@/components/motion/Motion";
import { PROFILE } from "@/lib/i18n/pages/profile";

type Order = {
  id: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  quantity: number;
  totalUsd: number;
  createdAt: number;
  city: string;
  country: string;
};

const STATUS_CHIP: Record<Order["status"], string> = {
  pending:   "chip-amber",
  paid:      "chip-leaf",
  shipped:   "chip-aqua",
  delivered: "chip-leaf",
  cancelled: "chip-ghost",
};

export default function ProfilePage() {
  const { user, loading, logout } = useUser();
  const router = useRouter();
  const { lang, t: tc } = useLang();
  const t = PROFILE[lang];
  const locale = lang === "ru" ? "ru-RU" : "en-US";
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/profile");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/orders", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setOrders([]));
  }, [user]);

  if (loading || !user) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Seeds className="scale-125 text-leaf-600" />
      </main>
    );
  }

  const created = new Date(user.createdAt).toLocaleDateString(locale);

  async function onLogout() {
    await logout();
    router.replace("/");
  }

  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-24 pt-10 sm:px-8">
      <PageHeader
        photo="wheat"
        home={tc.common.home}
        crumb={t.crumb}
        eyebrow={t.eyebrow}
        title={t.hello(user.name)}
        lead={
          <span className="inline-flex flex-wrap items-center gap-x-2 font-mono text-sm">
            <Mail className="h-3.5 w-3.5" />
            {user.email} · {t.since(created)}
          </span>
        }
        aside={
          <button onClick={onLogout} className="btn btn-ghost">
            <LogOut className="h-4 w-4" strokeWidth={2.5} />
            {t.logout}
          </button>
        }
      />

      <StaggerList className="mt-10 grid gap-5 md:grid-cols-3">
        {[
          {
            title: t.role,
            value: user.role === "admin" ? t.admin : t.user,
            hint: user.role === "admin" ? t.adminHint : t.userHint,
          },
          {
            title: t.device,
            value: user.deviceOwner ? t.active : t.none,
            hint: user.deviceOwner ? t.deviceOn : t.deviceOff,
          },
          {
            title: t.ordersCount,
            value: orders == null ? "…" : String(orders.length),
            hint: t.ordersHint,
          },
        ].map((c) => (
          <StaggerItem key={c.title} className="card p-5">
            <p className="font-display text-xs uppercase tracking-[0.16em] text-ink-500">{c.title}</p>
            <p className="mt-2 font-display text-3xl uppercase text-ink-900">{c.value}</p>
            <p className="mt-1 text-xs text-ink-500">{c.hint}</p>
          </StaggerItem>
        ))}
      </StaggerList>

      {user.deviceOwner ? (
        <Reveal className="stitch mt-6 rounded-md bg-leaf-50 p-6">
          <div className="flex items-center gap-2 text-leaf-700">
            <BadgeCheck className="h-5 w-5" strokeWidth={2.5} />
            <span className="font-display text-lg uppercase tracking-wide">{t.unlockedTitle}</span>
          </div>
          <p className="mt-2 max-w-[70ch] text-sm text-ink-700">{t.unlockedBody}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/dashboard" className="btn btn-primary">{t.links.dashboard}</Link>
            <Link href="/irrigation" className="btn btn-ghost">{t.links.irrigation}</Link>
            <Link href="/chat" className="btn btn-ghost">{t.links.chat}</Link>
          </div>
        </Reveal>
      ) : (
        <Reveal className="kraft stitch mt-6 rounded-md p-6 shadow-card">
          <p className="font-display text-xl uppercase text-ink-900">{t.lockedTitle}</p>
          <p className="mt-2 max-w-[70ch] text-sm text-ink-900">{t.lockedBody}</p>
          <Link href="/shop" className="btn btn-stamp mt-4">
            <ShoppingBag className="h-4 w-4" strokeWidth={2.5} />
            {t.order}
          </Link>
        </Reveal>
      )}

      <section className="mt-10">
        <h2 className="mb-4 text-2xl uppercase text-ink-900">{t.orders}</h2>
        {orders == null ? (
          <div className="card p-6 text-center">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-ink-400" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-md border-2 border-dashed border-ink-900/20 p-6 text-center text-sm text-ink-500">
            {t.noOrders}{" "}
            <Link href="/shop" className="link-quiet text-sm">{t.toShop}</Link>
          </div>
        ) : (
          <StaggerList className="space-y-3">
            {orders.map((o) => (
              <StaggerItem key={o.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`chip ${STATUS_CHIP[o.status]}`}>{t.status[o.status]}</span>
                    <span className="font-mono text-xs text-ink-500">#{o.id.slice(0, 8)}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-ink-700">
                    {o.quantity} × {t.kit} · ${o.totalUsd}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-ink-500">
                    <Calendar className="h-3 w-3" />
                    {new Date(o.createdAt).toLocaleDateString(locale)} · {o.city}, {o.country}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </section>
    </main>
  );
}
