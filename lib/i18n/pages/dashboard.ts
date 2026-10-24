import type { Lang } from "../dict";

const ru = {
  crumb: "Панель",
  eyebrow: "Живая телеметрия",
  title: "Ваше поле, секунда за секундой",
  lead: "Каждая плитка получает данные прямо с зонда ESP32. Значения обновляются пять раз в секунду, под ними — последние 120 замеров.",
  samples: (n: string) => `${n} замеров`,
  offlineTitle: "Живых данных пока нет",
  offlineBody: "Подключите ESP32, и панель оживёт сама за доли секунды.",
  connect: "Подключить датчик",
  tiles: {
    temp: "Температура почвы",
    ph: "Кислотность · pH",
    tds: "Соли · TDS",
    moist: "Влажность",
  },
  ideal: "норма",
  state: { ideal: "в норме", marginal: "на грани", critical: "вне нормы", idle: "ожидание" },
  actions: [
    { title: "Рассчитать полив", desc: "Превратите эти цифры в литры для вашей культуры и участка.", href: "/irrigation", cta: "Открыть калькулятор" },
    { title: "Спросить агронома", desc: "Чат с ИИ, который уже видит то же, что и датчики.", href: "/chat", cta: "Начать чат" },
    { title: "Проверка наследия", desc: "Сравните участок с нормами апорта, тюльпана Грейга и саксаула.", href: "/heritage", cta: "Запустить анализ" },
  ],
  gate: {
    title: "Нужен датчик SoilPlus",
    body: "Эта страница доступна только владельцам прибора. Закажите портативный набор за $70, и мы откроем вашу личную панель, автополив и ИИ-агронома с живыми данными.",
    features: [
      ["Живая панель", "Показания 5 раз в секунду"],
      ["Точная норма полива", "Формула с K_pH и K_EC под вашу почву"],
      ["ИИ-агроном", "Gemini с контекстом вашего поля"],
      ["Быстрое подключение", "ESP32 к сайту за 30 секунд"],
    ] as [string, string][],
    buy: "Купить за $70",
    tryDiagnose: "Попробовать ИИ-диагностику",
    free: "Диагностика, прогноз, погода и наследие доступны и без прибора.",
  },
};

const en: typeof ru = {
  crumb: "Dashboard",
  eyebrow: "Live telemetry",
  title: "Your field, second by second",
  lead: "Each tile streams straight from the ESP32 probe. Values update five times a second, with the last 120 samples drawn beneath them.",
  samples: (n: string) => `${n} samples`,
  offlineTitle: "No live feed yet",
  offlineBody: "Connect your ESP32 and the dashboard lights up on its own within a fraction of a second.",
  connect: "Connect sensor",
  tiles: {
    temp: "Soil temperature",
    ph: "Acidity · pH",
    tds: "Salts · TDS",
    moist: "Moisture",
  },
  ideal: "norm",
  state: { ideal: "in range", marginal: "borderline", critical: "out of range", idle: "waiting" },
  actions: [
    { title: "Plan irrigation", desc: "Turn these numbers into litres for your crop and plot.", href: "/irrigation", cta: "Open calculator" },
    { title: "Ask the agronomist", desc: "Chat with an AI that already sees what the sensors see.", href: "/chat", cta: "Start chat" },
    { title: "Heritage check", desc: "Score the plot against Aport apple, Greig's tulip or saxaul.", href: "/heritage", cta: "Run analysis" },
  ],
  gate: {
    title: "A SoilPlus sensor is required",
    body: "This page is for device owners only. Order the portable kit for $70 and we'll unlock your personal dashboard, auto-irrigation and the AI agronomist with live data.",
    features: [
      ["Live dashboard", "Readings 5 times a second"],
      ["Exact irrigation norm", "Formula with K_pH and K_EC for your soil"],
      ["AI agronomist", "Gemini with your field's context"],
      ["Quick connect", "ESP32 to the site in 30 seconds"],
    ],
    buy: "Buy for $70",
    tryDiagnose: "Try AI diagnosis",
    free: "Diagnose, forecast, weather and heritage work without a device too.",
  },
};

export const DASHBOARD: Record<Lang, typeof ru> = { ru, en };
