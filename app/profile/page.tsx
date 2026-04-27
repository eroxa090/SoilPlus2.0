"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Boxes,
  Calendar,
  Cpu,
  Loader2,
  LogOut,
  Mail,
  Package,
  Shield,
  ShoppingBag,
  User as UserIcon,
} from "lucide-react";
import { useUser } from "@/components/UserProvider";

type Order = {
  id: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  quantity: number;
  totalUsd: number;
  createdAt: number;
  city: string;
  country: string;
};

const STATUS: Record<
  Order["status"],
  { label: string; pill: string }
> = {
  pending:   { label: "Ожидает оплаты",    pill: "bg-amber-50 text-amber-700 border-amber-200" },
  paid:      { label: "Оплачен",           pill: "bg-leaf-50 text-leaf-700 border-leaf-200" },
  shipped:   { label: "Отправлен",         pill: "bg-sky-50 text-sky-700 border-sky-200" },
  delivered: { label: "Доставлен",         pill: "bg-leaf-50 text-leaf-700 border-leaf-200" },
  cancelled: { label: "Отменён",           pill: "bg-ink-100/60 text-ink-600 border-ink-200" },
};

export default function ProfilePage() {
  const { user, loading, logout } = useUser();
  const router = useRouter();
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
        <Loader2 className="h-6 w-6 animate-spin text-leaf-600" />
      </main>
    );
  }

  const created = new Date(user.createdAt).toLocaleDateString("ru-RU");

  async function onLogout() {
    await logout();
    router.replace("/");
  }

  return (
    <main className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-leaf-200 bg-leaf-50 px-3 py-1 text-xs font-medium text-leaf-700">
            <UserIcon className="h-3.5 w-3.5" />
            Личный кабинет
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
            Привет, {user.name}!
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            <Mail className="mr-1 inline-block h-3 w-3" />
            {user.email} · зарегистрирован {created}
          </p>
        </div>
        <button onClick={onLogout} className="btn btn-ghost">
          <LogOut className="h-4 w-4" />
          Выйти
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <InfoCard
          icon={Shield}
          title="Роль"
          value={user.role === "admin" ? "Администратор" : "Пользователь"}
          hint={user.role === "admin" ? "Доступ ко всем заказам" : "Базовый доступ"}
        />
        <InfoCard
          icon={Cpu}
          title="Устройство"
          value={user.deviceOwner ? "Активно" : "Нет"}
          hint={
            user.deviceOwner
              ? "Открыт закрытый Dashboard"
              : "Закажите, чтобы разблокировать Dashboard"
          }
        />
        <InfoCard
          icon={Boxes}
          title="Заказов"
          value={orders == null ? "…" : String(orders.length)}
          hint="История ниже"
        />
      </section>

      {user.deviceOwner ? (
        <div className="mt-6 rounded-2xl border border-leaf-200 bg-leaf-50 p-5">
          <div className="flex items-center gap-2 text-leaf-700">
            <BadgeCheck className="h-5 w-5" />
            <span className="font-display font-semibold">
              Закрытая зона разблокирована
            </span>
          </div>
          <p className="mt-2 text-sm text-ink-700">
            Вам открыты все модули ESP32 — живой Dashboard, расчёт полива,
            AI-агроном с вашим устройством и страница Connect.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/dashboard" className="btn btn-primary">
              Dashboard
            </Link>
            <Link href="/irrigation" className="btn btn-ghost">
              Irrigation
            </Link>
            <Link href="/chat" className="btn btn-ghost">
              AI Agronomist
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-5">
          <div className="flex items-center gap-2 text-ink-900">
            <Package className="h-5 w-5 text-leaf-600" />
            <span className="font-display font-semibold">
              Разблокируйте закрытый Dashboard
            </span>
          </div>
          <p className="mt-2 text-sm text-ink-600">
            Закажите портативное устройство SoilPlus ($70) — получите живой
            Dashboard, автокалькулятор полива и личного AI-агронома с вашей
            почвой.
          </p>
          <Link href="/shop" className="btn btn-primary mt-3">
            <ShoppingBag className="h-4 w-4" />
            Заказать устройство
          </Link>
        </div>
      )}

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
          <Boxes className="h-5 w-5 text-leaf-600" />
          Ваши заказы
        </h2>
        {orders == null ? (
          <div className="rounded-xl border border-ink-100 bg-white p-6 text-center text-sm text-ink-500">
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-200 bg-white/50 p-6 text-center text-sm text-ink-500">
            Заказов пока нет.{" "}
            <Link href="/shop" className="text-leaf-700 underline">
              Перейти в магазин
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => {
              const s = STATUS[o.status];
              return (
                <div
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 bg-white p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${s.pill}`}
                      >
                        {s.label}
                      </span>
                      <span className="font-mono text-xs text-ink-500">
                        #{o.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-ink-700">
                      {o.quantity} × SoilPlus Sensor Kit · ${o.totalUsd}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(o.createdAt).toLocaleDateString("ru-RU")} ·{" "}
                      {o.city}, {o.country}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function InfoCard({
  icon: Icon,
  title,
  value,
  hint,
}: {
  icon: typeof Shield;
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-ink-700">
        <Icon className="h-4 w-4 text-leaf-600" />
        <span className="text-xs uppercase tracking-wide">{title}</span>
      </div>
      <div className="mt-2 font-display text-2xl font-semibold text-ink-900">
        {value}
      </div>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}
