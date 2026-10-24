import type { Lang } from "../dict";

const ru = {
  crumb: "Полив",
  eyebrow: "Калькулятор полива",
  title: "Точные литры. Ни капли зря.",
  lead: "Выберите культуру и участок. Калькулятор сверит живые замеры почвы с нормами КазНИИЗ и FAO-56 и скажет, сколько воды полю нужно на самом деле.",
  connectLive: "Подключить для живых данных",
  units: { m2: "м²", sot: "сот.", ha: "га" },
  step1: "Шаг 1 · Культура",
  step1Title: "Что поливаем?",
  cropsCount: (n: number) => `${n} культур`,
  step2: "Шаг 2 · Участок",
  step2Title: "Сколько земли?",
  equivalent: (m2: string, ha: string) => `Это ${m2} м² · ${ha} га`,
  areaHint: "Введите площадь участка больше нуля, например 12,5",
  step3: "Шаг 3 · Почва сейчас",
  step3Title: (crop: string) => `Насколько почва подходит культуре «${crop}»?`,
  preview: "Пример · прибор не подключён",
  metrics: { moist: "Влажность", ph: "pH", tds: "Соли (TDS)", temp: "Т почвы" },
  band: "норма",
  urgency: {
    none: "Поливать не нужно",
    low: "Лёгкая подпитка",
    medium: "Полить сегодня",
    high: "Полить сейчас",
    critical: "Засуха",
  },
  resultTitle: "Норма полива",
  resultFor: (crop: string, area: string) => `${crop} · ${area}`,
  noWatering: "полив не нужен",
  thisWatering: "за этот полив",
  litres: "литров",
  perM2: (v: number) => `≈ ${v} л/м² за один полив`,
  l: "л",
  h: "ч",
  pp: "п.п.",
  m: {
    perEvent: "За один полив",
    events: "Поливов всего",
    between: "Между поливами",
    check: "Проверить датчик",
    deficit: "Дефицит влаги",
    season: "Вся норма",
  },
  planTitle: "План полива",
  plan: (now: string, perM2: number, wait: number, more: number, check: number) =>
    `Сейчас: ${now} л (${perM2} л/м²). Подождите ${wait} ч, чтобы вода впиталась, затем повторите ещё ${more} ${plural(more)}. После каждого полива проверяйте датчик через ${check} ч.`,
  notes: "Заметки агронома",
  ask: "Спросить агронома",
  telemetry: "Живая панель",
  formula: "Формула V = ΔW × НВ × D × ρ × S × K_pH × K_EC · один полив не больше 35 л/м² (FAO-56). Влажность в % от наименьшей влагоёмкости (НВ); по умолчанию НВ = 0,24, ρ = 1400 кг/м³ (суглинок).",
};

function plural(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "полив";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "полива";
  return "поливов";
}

const en: typeof ru = {
  crumb: "Irrigation",
  eyebrow: "Irrigation calculator",
  title: "Exact litres. Not a drop wasted.",
  lead: "Pick your crop and plot. The calculator checks live soil readings against KazNIIZ and FAO-56 norms and tells you how much water the field really needs.",
  connectLive: "Connect for live values",
  units: { m2: "m²", sot: "sot.", ha: "ha" },
  step1: "Step 1 · Crop",
  step1Title: "What are you watering?",
  cropsCount: (n: number) => `${n} crops`,
  step2: "Step 2 · Plot",
  step2Title: "How much land?",
  equivalent: (m2: string, ha: string) => `That is ${m2} m² · ${ha} ha`,
  areaHint: "Enter a plot area above zero, for example 12.5",
  step3: "Step 3 · Soil right now",
  step3Title: (crop: string) => `How well does the soil suit ${crop}?`,
  preview: "Sample · no device",
  metrics: { moist: "Moisture", ph: "pH", tds: "Salts (TDS)", temp: "Soil T" },
  band: "norm",
  urgency: {
    none: "No watering needed",
    low: "Light top-up",
    medium: "Water today",
    high: "Water now",
    critical: "Drought stress",
  },
  resultTitle: "Water requirement",
  resultFor: (crop: string, area: string) => `${crop} · ${area}`,
  noWatering: "no watering needed",
  thisWatering: "this watering",
  litres: "litres",
  perM2: (v: number) => `≈ ${v} L/m² per watering`,
  l: "L",
  h: "h",
  pp: "pp",
  m: {
    perEvent: "Per watering",
    events: "Waterings",
    between: "Between waterings",
    check: "Check sensor in",
    deficit: "Moisture deficit",
    season: "Total norm",
  },
  planTitle: "Watering plan",
  plan: (now: string, perM2: number, wait: number, more: number, check: number) =>
    `Now: ${now} L (${perM2} L/m²). Wait ${wait} h for the water to soak in, then repeat ${more} more time${more === 1 ? "" : "s"}. Check the sensor ${check} h after each watering.`,
  notes: "Agronomist's notes",
  ask: "Ask the agronomist",
  telemetry: "Live dashboard",
  formula: "Formula V = ΔW × FC × D × ρ × S × K_pH × K_EC · one watering at most 35 L/m² (FAO-56). Moisture is in % of field capacity (FC); defaults FC = 0.24, ρ = 1400 kg/m³ (loam).",
};

export const IRRIGATION: Record<Lang, typeof ru> = { ru, en };
