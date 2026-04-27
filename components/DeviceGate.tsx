import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Cpu, Lock, ShoppingBag } from "lucide-react";

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

function UpsellLockout() {
  return (
    <main className="mx-auto max-w-[720px] px-5 py-16 sm:px-8">
      <div className="rounded-2xl border border-ink-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-leaf-50 text-leaf-600">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold text-ink-900">
          Нужен SoilPlus-сенсор
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          Эта страница доступна только владельцам устройства. Закажите
          портативный набор за $70, и мы откроем ваш личный Dashboard,
          автополив и AI-агроном с живыми данными.
        </p>

        <div className="mt-6 grid gap-2 text-left text-sm text-ink-700 sm:grid-cols-2">
          <Feature icon={Cpu} title="Живой Dashboard">
            График показаний 5 раз в секунду
          </Feature>
          <Feature icon={Cpu} title="Точная норма полива">
            Формула с K_pH и K_EC под вашу почву
          </Feature>
          <Feature icon={Cpu} title="AI-агроном">
            Gemini с контекстом вашего поля
          </Feature>
          <Feature icon={Cpu} title="Быстрый Connect">
            Подключение к ESP32 за 30 секунд
          </Feature>
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link href="/shop" className="btn btn-primary">
            <ShoppingBag className="h-4 w-4" />
            Купить за $70
          </Link>
          <Link href="/diagnose" className="btn btn-ghost">
            Попробовать AI-диагностику
          </Link>
        </div>
        <p className="mt-5 text-xs text-ink-500">
          А бесплатные модули — Diagnose, Forecast, Weather, Heritage —
          доступны вам и без устройства.
        </p>
      </div>
    </main>
  );
}

function Feature({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Cpu;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-leaf-600" />
        <span className="font-display text-xs font-semibold uppercase tracking-wide text-ink-700">
          {title}
        </span>
      </div>
      <p className="mt-1 text-xs text-ink-500">{children}</p>
    </div>
  );
}
