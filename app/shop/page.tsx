"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Box,
  CheckCircle2,
  Cpu,
  Droplets,
  Leaf,
  Loader2,
  Package,
  Shield,
  ShoppingBag,
  Sparkles,
  Thermometer,
  Wifi,
} from "lucide-react";
import { useUser } from "@/components/UserProvider";

const UNIT_PRICE = 70;

const FEATURES = [
  { icon: Thermometer, title: "Температура, pH, EC, влажность",  body: "Четыре показателя почвы 5 раз в секунду." },
  { icon: Wifi,        title: "ESP32 + Wi-Fi Hotspot",            body: "Работает без интернета — через ваш телефон." },
  { icon: Droplets,    title: "Точный расчёт полива",             body: "Формула V = ΔW × D × ρ × S × K_pH × K_EC." },
  { icon: Leaf,        title: "AI-агроном внутри",                body: "Gemini видит ваши данные и подсказывает действия." },
  { icon: Shield,      title: "Защита IP54",                      body: "Корпус устойчив к пыли и брызгам поля." },
  { icon: Activity,    title: "Пожизненные обновления",            body: "Прошивка и ИИ-функции обновляются бесплатно." },
];

const INCLUDED = [
  "ESP32 контроллер с прошивкой SoilPlus",
  "Термодатчик DS18B20 (водозащищённый зонд)",
  "pH-электрод + сигнальная плата",
  "TDS / EC сенсор",
  "Ёмкостной датчик влажности",
  "USB-C кабель 2 м + крепёжный колышек",
  "Доступ к закрытому Dashboard на сайте",
];

export default function ShopPage() {
  const { user, loading, refresh } = useUser();
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Kazakhstan");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<{ id: string; totalUsd: number } | null>(
    null,
  );

  const total = UNIT_PRICE * Math.max(1, Math.min(100, quantity || 1));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (!user) {
      setError("Сначала войдите или зарегистрируйтесь.");
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
        setError(data?.error ?? "Не удалось оформить заказ.");
        return;
      }
      setPlaced({ id: data.order.id, totalUsd: data.order.totalUsd });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Сетевая ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14">
      <section className="mb-10 grid gap-8 lg:grid-cols-2">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-leaf-200 bg-leaf-50 px-3 py-1 text-xs font-medium text-leaf-700">
            <ShoppingBag className="h-3.5 w-3.5" />
            Купить устройство
          </div>
          <h1 className="mt-4 font-display text-4xl font-semibold text-ink-900 sm:text-5xl">
            SoilPlus Sensor Kit
          </h1>
          <p className="mt-4 text-ink-600">
            Портативный агро-ассистент для фермеров Казахстана. Меряет почву в
            реальном времени, считает точную норму полива и видит болезни на
            фото — всё в одном устройстве.
          </p>

          <div className="relative mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-gradient-to-br from-leaf-50 to-white">
            <Image
              src="/soilplus-device.jpg"
              alt="Устройство SoilPlus в сборе — ESP32 с датчиками влажности, pH, EC и температуры"
              width={1200}
              height={1600}
              priority
              className="h-auto w-full object-cover"
              sizes="(max-width: 1024px) 100vw, 560px"
            />
            <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-ink-700 shadow-sm backdrop-blur">
              Прототип, собран в Уральске
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-5xl font-semibold text-ink-900">
              ${UNIT_PRICE}
            </span>
            <span className="text-sm text-ink-500">за комплект · доставка по РК ≈ 3-5 дней</span>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-ink-100 bg-white p-4"
              >
                <div className="flex items-center gap-2">
                  <f.icon className="h-4 w-4 text-leaf-600" />
                  <h3 className="font-display text-sm font-semibold text-ink-900">
                    {f.title}
                  </h3>
                </div>
                <p className="mt-1.5 text-xs text-ink-500">{f.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-ink-100 bg-white p-5">
            <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-ink-700">
              <Box className="h-4 w-4" />
              Что в коробке
            </h3>
            <ul className="space-y-1.5 text-sm text-ink-800">
              {INCLUDED.map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-leaf-600" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ORDER FORM */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-ink-900">
              <Package className="h-5 w-5 text-leaf-600" />
              Оформить заказ
            </h2>

            {placed ? (
              <OrderSuccess order={placed} />
            ) : (
              <>
                {!user && !loading && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Чтобы оформить заказ, нужно{" "}
                    <Link href="/login" className="font-medium underline">
                      войти
                    </Link>{" "}
                    или{" "}
                    <Link href="/signup" className="font-medium underline">
                      зарегистрироваться
                    </Link>
                    .
                  </div>
                )}

                <form className="mt-4 space-y-4" onSubmit={submit}>
                  <Field label="Количество">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="input"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Страна">
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        required
                        className="input"
                      />
                    </Field>
                    <Field label="Город">
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                        className="input"
                      />
                    </Field>
                  </div>
                  <Field label="Адрес">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      className="input"
                    />
                  </Field>
                  <Field label="Телефон">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="+7 ..."
                      className="input"
                    />
                  </Field>

                  <div className="flex items-center justify-between rounded-lg bg-ink-50 p-3 text-sm">
                    <span className="text-ink-600">Итого</span>
                    <span className="font-display text-lg font-semibold text-ink-900">
                      ${total}
                    </span>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={busy || !user}
                    className="btn btn-primary w-full"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Оформляем…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Заказать за ${total}
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-ink-500">
                    Оплата выставляется после подтверждения менеджером. После
                    статуса «paid» открывается закрытый Dashboard устройства.
                  </p>
                </form>
              </>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-ink-100 bg-white p-4 text-xs text-ink-500">
            <Cpu className="mb-1 h-4 w-4 text-leaf-600" />
            Устройства собираются вручную в Уральске. Мы производим ограниченными
            партиями — присоединяйтесь раньше.
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function OrderSuccess({
  order,
}: {
  order: { id: string; totalUsd: number };
}) {
  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-xl border border-leaf-200 bg-leaf-50 p-4">
        <div className="flex items-center gap-2 text-leaf-700">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-display font-semibold">Заказ принят</span>
        </div>
        <p className="mt-2 text-sm text-ink-700">
          Спасибо! Мы свяжемся с вами в течение 24 часов для подтверждения
          оплаты и доставки.
        </p>
        <div className="mt-3 grid gap-1 text-xs text-ink-600">
          <div>
            Номер заказа:{" "}
            <span className="font-mono text-ink-900">{order.id.slice(0, 8)}</span>
          </div>
          <div>
            Сумма:{" "}
            <span className="font-mono text-ink-900">${order.totalUsd}</span>
          </div>
        </div>
      </div>
      <Link href="/profile" className="btn btn-primary w-full">
        Перейти в профиль
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
