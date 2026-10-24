"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, ShoppingBag } from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { useLang } from "@/components/LanguageProvider";
import PageHeader from "@/components/PageHeader";
import { AnimatedNumber, Reveal, StaggerItem, StaggerList, StampIn, Tilt } from "@/components/motion/Motion";
import { SHOP } from "@/lib/i18n/pages/shop";
import { apiErrorText } from "@/lib/i18n/errors";

const UNIT_PRICE = 70;

export default function ShopPage() {
  const { user, loading, refresh } = useUser();
  const { lang, t: tc } = useLang();
  const t = SHOP[lang];
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Kazakhstan");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<{ id: string; totalUsd: number } | null>(null);

  const total = UNIT_PRICE * Math.max(1, Math.min(100, quantity || 1));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (!user) {
      setError(t.loginFirst);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, country, city, address, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(apiErrorText(lang, data, t.failed));
        return;
      }
      setPlaced({ id: data.order.id, totalUsd: data.order.totalUsd });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.network);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-24 pt-10 sm:px-8">
      <PageHeader home={tc.common.home} crumb={t.crumb} eyebrow={t.eyebrow} title={t.title} lead={t.lead} />

      <section className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div>
          {/* Device photo, pinned like a snapshot, with a price stamp */}
          <Reveal x={-30} rotate={-3} className="relative">
            <Tilt max={5}>
            <figure className="relative -rotate-1 bg-white p-3 pb-12 shadow-soft">
              <div className="relative overflow-hidden">
                <Image
                  src="/soilplus-device.jpg"
                  alt={t.photoAlt}
                  width={1200}
                  height={1600}
                  priority
                  className="h-auto w-full object-cover"
                  sizes="(max-width: 1024px) 100vw, 600px"
                />
              </div>
              <span aria-hidden className="absolute -top-3 left-10 h-7 w-24 rotate-[-6deg] bg-amber-100/80 shadow-sm" />
            </figure>
            </Tilt>
            <StampIn
              rotate={-12}
              delay={0.5}
              className="stamp absolute -right-3 top-8 h-32 w-32 bg-white/70 text-[13px] sm:-right-6 sm:h-36 sm:w-36"
            >
              <span>
                <span className="block text-[34px] leading-none sm:text-[40px]">${UNIT_PRICE}</span>
                SoilPlus
              </span>
            </StampIn>
          </Reveal>

          <p className="mt-8 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-6xl font-semibold text-ink-900">${UNIT_PRICE}</span>
            <span className="text-sm text-ink-500">{t.perKit}</span>
          </p>

          <StaggerList className="mt-8 grid gap-3 sm:grid-cols-2">
            {t.features.map(([title, body]) => (
              <StaggerItem key={title} className="card p-4">
                <h3 className="font-display text-base uppercase tracking-wide text-ink-900">{title}</h3>
                <p className="mt-1.5 text-[13px] text-ink-500">{body}</p>
              </StaggerItem>
            ))}
          </StaggerList>

          <Reveal className="burlap mt-8 rounded-md p-1.5 shadow-card">
            <div className="stitch rounded bg-white p-6">
              <h3 className="label-eyebrow">{t.inBox}</h3>
              <ul className="mt-4 space-y-2 text-sm text-ink-700">
                {t.included.map((x) => (
                  <li key={x} className="flex items-start gap-2.5 border-b border-dashed border-ink-900/15 pb-2 last:border-0">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-leaf-600" strokeWidth={2.5} />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* ORDER FORM — a shipping label */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Reveal x={30} className="stitch rounded-md bg-white p-7 shadow-soft sm:p-8">
            <h2 className="flex items-center gap-2 text-3xl uppercase text-ink-900">
              <ShoppingBag className="h-6 w-6 text-stamp-500" strokeWidth={2.5} />
              {t.orderTitle}
            </h2>

            {placed ? (
              <OrderSuccess order={placed} t={t} />
            ) : (
              <>
                {!user && !loading && (
                  <p className="mt-4 rounded-md border-l-4 border-amber-500 bg-amber-50 p-3 text-sm text-ink-700">
                    {t.needLogin(
                      <Link key="l" href="/login?next=/shop" className="link-quiet text-sm normal-case">{t.login}</Link>,
                      <Link key="s" href="/signup?next=/shop" className="link-quiet text-sm normal-case">{t.signup}</Link>,
                    )}
                  </p>
                )}

                <form className="mt-5 space-y-4" onSubmit={submit}>
                  <Field label={t.quantity}>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="input border-2 font-mono"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t.country}>
                      <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} required className="input border-2" autoComplete="country-name" />
                    </Field>
                    <Field label={t.city}>
                      <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required className="input border-2" autoComplete="address-level2" />
                    </Field>
                  </div>
                  <Field label={t.address}>
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required className="input border-2" autoComplete="street-address" />
                  </Field>
                  <Field label={t.phone}>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+7 …" className="input border-2 font-mono" autoComplete="tel" />
                  </Field>

                  <div className="flex items-center justify-between border-y-2 border-double border-ink-900 py-3">
                    <span className="font-display uppercase tracking-wide text-ink-700">{t.total}</span>
                    <span className="font-display text-3xl font-semibold text-ink-900">
                      $<AnimatedNumber value={total} locale="en-US" />
                    </span>
                  </div>

                  {error && (
                    <div role="alert" className="flex items-start gap-2 rounded-md border-2 border-stamp-500/40 bg-rose-50 p-3 text-sm text-stamp-600">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button type="submit" disabled={busy || !user} className="btn btn-stamp w-full py-3.5 text-base disabled:opacity-50">
                    {busy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t.placing}
                      </>
                    ) : (
                      t.order(total)
                    )}
                  </button>

                  <p className="text-[11px] leading-snug text-ink-500">{t.payNote}</p>
                </form>
              </>
            )}
          </Reveal>

          <p className="mt-4 font-hand text-xl leading-snug text-ink-700">{t.handmade}</p>
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-display text-sm uppercase tracking-wide text-ink-700">{label}</span>
      {children}
    </label>
  );
}

function OrderSuccess({
  order,
  t,
}: {
  order: { id: string; totalUsd: number };
  t: (typeof SHOP)["ru"];
}) {
  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-md border-l-4 border-leaf-600 bg-leaf-50 p-5">
        <p className="inline-block -rotate-2 rounded-sm border-[3px] border-double border-leaf-600 px-2.5 py-1 font-stamp text-sm uppercase text-leaf-700">
          {t.successTitle}
        </p>
        <p className="mt-3 text-sm text-ink-700">{t.successBody}</p>
        <dl className="mt-3 grid gap-1 font-mono text-xs text-ink-500">
          <div>
            {t.orderNo}: <span className="text-ink-900">{order.id.slice(0, 8)}</span>
          </div>
          <div>
            {t.sum}: <span className="text-ink-900">${order.totalUsd}</span>
          </div>
        </dl>
      </div>
      <Link href="/profile" className="btn btn-primary group w-full">
        {t.toProfile}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
      </Link>
    </div>
  );
}
