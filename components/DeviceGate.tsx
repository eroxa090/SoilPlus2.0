import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getLang } from "@/lib/i18n/server";
import { DASHBOARD } from "@/lib/i18n/pages/dashboard";
import { Lock, ShoppingBag } from "lucide-react";

/**
 * Server component that only renders its children when the current session
 * user is a device-owner. Anonymous users are redirected to /login;
 * authenticated users without a device see a friendly upsell.
 */
export default async function DeviceGate({
  children,
  pathname,
}: {
  children: React.ReactNode;
  /** Current pathname so /login can return the user here after signing in. */
  pathname: string;
}) {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(pathname)}`);
  if (!user.deviceOwner) return <UpsellLockout />;
  return <>{children}</>;
}

async function UpsellLockout() {
  const t = DASHBOARD[await getLang()].gate;
  return (
    <main className="mx-auto max-w-[760px] px-5 py-16 sm:px-8">
      <div className="stitch relative rounded-md bg-white p-8 text-center shadow-soft sm:p-10">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-[3px] border-double border-stamp-500 text-stamp-500">
          <Lock className="h-6 w-6" strokeWidth={2.5} />
        </div>
        <h1 className="mt-5 text-3xl uppercase text-ink-900">{t.title}</h1>
        <p className="mx-auto mt-3 max-w-[52ch] text-ink-500">{t.body}</p>

        <dl className="mt-7 grid gap-px overflow-hidden rounded-md border-2 border-ink-900/10 bg-ink-900/10 text-left sm:grid-cols-2">
          {t.features.map(([title, desc]) => (
            <div key={title} className="bg-paper p-4">
              <dt className="font-display text-sm uppercase tracking-wide text-ink-900">{title}</dt>
              <dd className="mt-1 text-[13px] text-ink-500">{desc}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn btn-stamp">
            <ShoppingBag className="h-4 w-4" strokeWidth={2.5} />
            {t.buy}
          </Link>
          <Link href="/diagnose" className="btn btn-ghost">
            {t.tryDiagnose}
          </Link>
        </div>
        <p className="mt-6 text-xs text-ink-500">{t.free}</p>
      </div>
    </main>
  );
}
