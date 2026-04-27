import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Beaker,
  Cpu,
  Droplets,
  FlaskConical,
  Leaf,
  MapPin,
  Microscope,
  Ruler,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

export const metadata = {
  title: "About — SoilPlus 2.0",
  description:
    "Исследовательский проект SoilPlus: портативная система анализа почвы для малых и средних хозяйств Казахстана.",
};

const STATS = [
  { value: "$43", label: "себестоимость прототипа", icon: Cpu },
  { value: "5–6×", label: "дешевле аналогов", icon: TrendingUp },
  { value: "35%", label: "экономия воды в полевых испытаниях", icon: Droplets },
  { value: "5.4%", label: "прирост урожая на пшенице", icon: Leaf },
];

const ACCURACY = [
  { metric: "Влажность", value: "±3.2%", limit: "ISEF ±5%" },
  { metric: "pH", value: "±0.15 ед.", limit: "ISEF ±0.2" },
  { metric: "EC", value: "±4.8%", limit: "ISEF ±5%" },
  { metric: "Температура", value: "±0.4 °C", limit: "ISEF ±0.5 °C" },
];

const HARDWARE = [
  { name: "ESP32-WROOM-32", role: "Двухъядерный 240 МГц + Wi-Fi/BLE" },
  { name: "Capacitive Moisture v1.2", role: "Объёмное влагосодержание 0–100%" },
  { name: "PH-4502C", role: "pH почвенного раствора 0–14" },
  { name: "TDS-метр (аналоговый)", role: "Электропроводность, мкСм/см" },
  { name: "DS18B20", role: "Температура почвы −55…+125 °C, 1-Wire" },
  { name: "Li-Ion 18650", role: "Автономная работа до 12 часов" },
];

const FIELD_TEST = [
  { label: "Регион", value: "Западно-Казахстанская обл." },
  { label: "Длительность", value: "120 дней (май–август 2025)" },
  { label: "Площадь участков", value: "0.5 га × 3" },
  { label: "Типы почв", value: "Чернозём, каштановая, солонцеватая" },
  { label: "Культуры", value: "Пшеница, подсолнечник, картофель" },
  { label: "Контроль", value: "Полив по расписанию" },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14">
      {/* HERO */}
      <section className="grid items-start gap-10 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-leaf-200 bg-leaf-50 px-3 py-1 text-xs font-medium text-leaf-700">
            <Leaf className="h-3.5 w-3.5" />
            Сделано в Уральске · 2026
          </div>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-ink-900 sm:text-5xl">
            SoilPlus 2.0
          </h1>
          <p className="mt-2 font-display text-xl text-ink-700 sm:text-2xl">
            Портативная интеллектуальная система анализа почвы и рекомендаций по
            орошению для малых и средних хозяйств.
          </p>
          <p className="mt-5 text-ink-600">
            Казахстан — аграрная страна, где около 70% сельского населения
            занимается сельским хозяйством, а до 40% оросительной воды
            расходуется впустую. SoilPlus — это устройство стоимостью менее
            50 долларов, которое одновременно измеряет четыре параметра почвы и
            переводит данные в конкретные действия: <em>сколько воды и когда</em>.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/shop" className="btn btn-primary">
              Купить устройство
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/chat" className="btn">
              Спросить AI-агронома
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-ink-100 bg-white p-4"
              >
                <s.icon className="h-4 w-4 text-leaf-600" />
                <div className="mt-2 font-display text-2xl font-semibold text-ink-900">
                  {s.value}
                </div>
                <div className="mt-0.5 text-xs leading-snug text-ink-500">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
          <Image
            src="/soilplus-device.jpg"
            alt="Прототип устройства SoilPlus"
            width={1200}
            height={1600}
            className="h-auto w-full object-cover"
            sizes="(max-width: 1024px) 100vw, 460px"
          />
        </div>
      </section>

      {/* PROBLEM + HYPOTHESIS */}
      <section className="mt-16 grid gap-6 lg:grid-cols-2">
        <Card title="Проблема" icon={Target}>
          <p>
            Традиционный подход «полив по расписанию» или «на глаз» приводит
            либо к переувлажнению, вымывающему питательные вещества, либо к
            водному стрессу растений. Агрохимические лаборатории дают точные
            данные, но дороги, медленны и недоступны малым фермерам.
          </p>
          <p className="mt-3">
            Существующие коммерческие решения (Trimble GreenSeeker, Agritech
            SoilSense Pro) стоят от $300 до $5000 — за пределами бюджета малых
            хозяйств. Бытовые сенсоры (Xiaomi Mi Flora) меряют только
            влажность.
          </p>
        </Card>

        <Card title="Гипотеза" icon={FlaskConical}>
          <p>
            Интеграция четырёх почвенных датчиков с алгоритмом, основанным на
            агрономических нормах КазНИИЗ и FAO-56, позволит рассчитывать объём
            орошения с погрешностью не более 10% по сравнению с рекомендациями
            специалистов-агрономов.
          </p>
          <p className="mt-3 rounded-lg bg-leaf-50 p-3 font-mono text-xs text-leaf-800">
            V = ΔW × D × ρ × S × K_pH × K_EC
          </p>
          <p className="mt-2 text-xs text-ink-500">
            где ΔW — дефицит влажности, D — глубина активного слоя, ρ —
            плотность почвы, S — площадь, K_pH и K_EC — поправочные
            коэффициенты.
          </p>
        </Card>
      </section>

      {/* HARDWARE */}
      <section className="mt-16">
        <SectionHeader
          eyebrow="Внутри устройства"
          title="Аппаратная платформа"
          icon={Cpu}
        />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HARDWARE.map((h) => (
            <div
              key={h.name}
              className="rounded-xl border border-ink-100 bg-white p-4"
            >
              <div className="font-display text-sm font-semibold text-ink-900">
                {h.name}
              </div>
              <div className="mt-1 text-xs text-ink-500">{h.role}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-ink-600">
          Микроконтроллер ESP32 (двухъядерный 240 МГц, 12-bit ADC, Wi-Fi + BLE)
          обрабатывает показания, усредняет 10 замеров с отбросом аномалий по
          правилу ±2σ и выводит результат на OLED-дисплей. Параллельно
          транслирует JSON по WebSocket на /dashboard сайта.
        </p>
      </section>

      {/* ALGORITHM */}
      <section className="mt-16">
        <SectionHeader
          eyebrow="Как это работает"
          title="От показаний к действию"
          icon={Activity}
        />
        <ol className="mt-6 space-y-3">
          {[
            "Измерение и усреднение 10 замеров с отбросом аномалий ±2σ.",
            "Определение дефицита влажности ΔW = W_opt − W_meas.",
            "Коррекция нормы по pH: при pH < 5.5 или > 7.5 — K_pH = 0.85.",
            "Коррекция по EC: при EC > 2000 мкСм/см — промывной режим, K_EC = 1.3.",
            "Расчёт объёма воды V = ΔW × D × ρ × S × K_pH × K_EC.",
            "Вывод рекомендации на OLED + JSON по Bluetooth/Wi-Fi.",
          ].map((step, i) => (
            <li
              key={i}
              className="flex gap-4 rounded-xl border border-ink-100 bg-white p-4"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-leaf-100 font-mono text-xs font-semibold text-leaf-800">
                {i + 1}
              </span>
              <span className="text-sm text-ink-700">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* RESULTS */}
      <section className="mt-16">
        <SectionHeader
          eyebrow="Точность"
          title="Лабораторные испытания"
          icon={Microscope}
        />
        <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
                <th className="px-4 py-3">Параметр</th>
                <th className="px-4 py-3">Погрешность SoilPlus</th>
                <th className="px-4 py-3">Допустимая (ISEF)</th>
              </tr>
            </thead>
            <tbody>
              {ACCURACY.map((row) => (
                <tr
                  key={row.metric}
                  className="border-b border-ink-100 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {row.metric}
                  </td>
                  <td className="px-4 py-3 font-mono text-ink-700">
                    {row.value}
                  </td>
                  <td className="px-4 py-3 font-mono text-ink-500">
                    {row.limit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-ink-500">
          150 измерений на трёх типах почв (чернозём, каштановая, солонцеватая)
          при пяти уровнях влажности. Калибровка pH — буферные растворы 4.0 /
          7.0 / 10.0 (ГОСТ 8.135-2004), R² = 0.998.
        </p>
      </section>

      {/* FIELD TEST */}
      <section className="mt-16">
        <SectionHeader
          eyebrow="Полевые испытания"
          title="120 дней в Западном Казахстане"
          icon={MapPin}
        />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FIELD_TEST.map((row) => (
            <div
              key={row.label}
              className="rounded-xl border border-ink-100 bg-white p-4"
            >
              <div className="text-xs uppercase tracking-wide text-ink-500">
                {row.label}
              </div>
              <div className="mt-1 font-display text-sm font-semibold text-ink-900">
                {row.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Outcome
            icon={Droplets}
            value="2 850 м³/га"
            label="расход воды на участке SoilPlus"
            sub="против 4 390 м³/га у контроля — экономия 35%"
          />
          <Outcome
            icon={Ruler}
            value="28 поливов"
            label="за сезон"
            sub="вместо 42 при поливе по расписанию"
          />
          <Outcome
            icon={TrendingUp}
            value="+5.4%"
            label="урожайность пшеницы"
            sub="31.4 ц/га против 29.8 ц/га"
          />
        </div>
      </section>

      {/* ECONOMY */}
      <section className="mt-16">
        <SectionHeader
          eyebrow="Экономика"
          title="Себестоимость и окупаемость"
          icon={Beaker}
        />
        <div className="mt-6 grid gap-6 rounded-2xl border border-ink-100 bg-white p-6 lg:grid-cols-2">
          <div>
            <div className="font-display text-sm font-semibold uppercase tracking-wide text-ink-700">
              Прототип
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
              <li>• ESP32 + датчики + корпус ≈ $35–40</li>
              <li>• Сборка вручную в Уральске</li>
              <li>• Розничная цена комплекта — $70</li>
              <li>• 5–6× дешевле ближайшего аналога</li>
            </ul>
          </div>
          <div>
            <div className="font-display text-sm font-semibold uppercase tracking-wide text-ink-700">
              Эффект для фермера (0.5 га, пшеница)
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
              <li>• Экономия воды ≈ 770 м³/сезон</li>
              <li>• Прирост урожая ≈ 80 кг/0.5 га</li>
              <li>• Окупаемость устройства — 1 сезон</li>
              <li>• ROI ≈ 395% за 3 сезона</li>
            </ul>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section id="team" className="mt-16 scroll-mt-24">
        <SectionHeader
          eyebrow="Команда"
          title="Кто стоит за SoilPlus"
          icon={Users}
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <PersonCard
            role="Со-основатель"
            name="Беккалиев Султан"
            note="Аппаратная часть, схемотехника, прошивка ESP32, полевые испытания."
          />
          <PersonCard
            role="Со-основатель"
            name="Мураткали Ерсултан"
            note="Алгоритм принятия решений, веб-платформа SoilPlus 2.0, AI-интеграция."
          />
        </div>
        <p className="mt-4 text-xs text-ink-500">Уральск, Казахстан · 2026.</p>
      </section>

      {/* CTA */}
      <section className="mt-16 rounded-2xl bg-gradient-to-br from-leaf-600 to-leaf-700 p-8 text-white sm:p-10">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">
          Хотите попробовать SoilPlus на своём поле?
        </h2>
        <p className="mt-2 max-w-2xl text-leaf-50">
          Устройство собирается ограниченными партиями вручную в Уральске.
          После заказа открывается доступ к закрытому Dashboard на сайте.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-leaf-700 transition hover:bg-leaf-50"
          >
            Купить за $70
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Спросить AI-агронома
          </Link>
        </div>
      </section>
    </main>
  );
}

/* ---------- helpers ---------- */

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Target;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-6">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-leaf-600" />
        <h2 className="font-display text-lg font-semibold text-ink-900">
          {title}
        </h2>
      </div>
      <div className="mt-3 text-sm text-ink-700">{children}</div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  icon: typeof Target;
}) {
  return (
    <div>
      <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-leaf-700">
        <Icon className="h-3.5 w-3.5" />
        {eyebrow}
      </div>
      <h2 className="mt-1 font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

function Outcome({
  icon: Icon,
  value,
  label,
  sub,
}: {
  icon: typeof Target;
  value: string;
  label: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-leaf-200 bg-leaf-50 p-5">
      <Icon className="h-5 w-5 text-leaf-700" />
      <div className="mt-3 font-display text-3xl font-semibold text-ink-900">
        {value}
      </div>
      <div className="mt-1 text-sm font-medium text-ink-800">{label}</div>
      <div className="mt-1 text-xs text-ink-600">{sub}</div>
    </div>
  );
}

function PersonCard({
  role,
  name,
  note,
  icon: Icon = Users,
}: {
  role: string;
  name: string;
  note: string;
  icon?: typeof Target;
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5">
      <div className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2 py-0.5 text-xs font-medium text-ink-600">
        <Icon className="h-3 w-3" />
        {role}
      </div>
      <div className="mt-3 font-display text-lg font-semibold text-ink-900">
        {name}
      </div>
      <p className="mt-1 text-sm text-ink-600">{note}</p>
    </div>
  );
}
