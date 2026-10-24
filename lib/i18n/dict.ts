/**
 * UI strings for the RU/EN switch. Russian is the source of truth; the
 * English dictionary must have exactly the same shape (enforced by `Dict`).
 * Pages not yet migrated keep their inline strings.
 */

export type Lang = "ru" | "en";
export const LANGS: Lang[] = ["ru", "en"];
export const DEFAULT_LANG: Lang = "ru";
export const LANG_COOKIE = "sp_lang";

const ru = {
  meta: {
    title: "SoilPlus — датчик почвы и ИИ-агроном для фермеров",
    description:
      "Портативный датчик почвы на ESP32 и ИИ-агроном. Диагностика болезней по фото, прогноз урожая, полив с учётом погоды. Сделано для фермеров Казахстана.",
  },
  common: {
    login: "Войти",
    signup: "Регистрация",
    logout: "Выйти",
    menu: "Меню",
    language: "Язык интерфейса",
    home: "Главная",
  },
  nav: {
    chat: "ИИ-агроном",
    irrigation: "Полив",
    diagnose: "Диагностика",
    forecast: "Прогноз",
    weather: "Погода",
    heritage: "Наследие",
    shop: "Магазин",
    dashboard: "Панель",
    connect: "Подключить датчик",
    ownerOnly: "Только для владельцев датчика",
    strip: "Датчик почвы и ИИ-агроном · Уральск, ЗКО · сделано для фермеров Казахстана",
  },
  status: {
    idle: "Не подключён",
    connecting: "Подключение",
    connected: "В эфире",
    reconnecting: "Переподключение",
    error: "Ошибка",
    closed: "Не подключён",
  },
  footer: {
    tagline:
      "Портативный анализ почвы для малых и средних хозяйств Казахстана. Студенческий исследовательский проект из Уральска.",
    platform: "Платформа",
    device: "Прибор",
    about: "О проекте",
    links: {
      dashboard: "Панель",
      irrigation: "Полив",
      chat: "ИИ-агроном",
      heritage: "Наследие",
      connect: "Подключить ESP32",
      firmware: "Прошивка",
      calibration: "Калибровка",
      project: "Проект",
      team: "Команда",
      shop: "Магазин",
    },
    copyright: "© 2026 SoilPlus · Уральск, Казахстан · Беккалиев Султан и Мураткали Ерсултан",
    motto: "Точное земледелие для Центральной Азии",
  },
  home: {
    batch: "Партия № 2.0 · Уральск, ЗКО",
    kind: "Датчик почвы и ИИ-агроном",
    titleA: "Знай свою землю.",
    titleB: "Поливай точно.",
    lead:
      "Втыкаете зонд в почву, и SoilPlus говорит, сколько поливать, что сажать и какие беды зреют под землёй. Сделано для полей Казахстана.",
    ctaConnect: "Подключить датчик",
    ctaIrrigation: "Рассчитать полив",
    stamp: ["Проверено", "в поле", "ЗКО · 2026"],
    photoAlt: "Пшеничное поле в степи под облаками",
    statsLabel: "Результаты полевых испытаний",
    stats: [
      { v: "−35%", l: "расход воды" },
      { v: "+5,4%", l: "прирост урожая" },
      { v: "±8,3%", l: "расхождение с агрономом" },
      { v: "< 1", l: "сезон окупаемости" },
    ],
    sheet: {
      title: "Бирка замеров",
      sample: "пример",
      live: "в эфире",
      moist: "Влажность",
      ph: "pH",
      tds: "Соли (TDS)",
      temp: "Т почвы",
      norm: "норма",
      note: "Суглинок в норме для апорта. Полив 24 ч не нужен.",
      signed: "ИИ-агроном · Gemini 2.5",
      device: "ESP32 · 4 зонда · 5 Гц",
    },
    specs: [
      "ESP32 · Wi-Fi",
      "4 датчика · 5 замеров в секунду",
      "12 культур · нормы КазНИИЗ и FAO-56",
      "Gemini 2.5 Flash",
      "Проверено в поле · Западный Казахстан",
    ],
    how: {
      eyebrow: "Способ применения",
      title: "Три шага от зонда до решения",
      lead: "Никаких таблиц с сырыми цифрами. Только готовый ответ: что делать с полем сегодня.",
      open: "Открыть",
      steps: [
        {
          title: "Подключить",
          href: "/connect",
          desc: "Плата цепляется к хотспоту телефона, вы вводите её IP. Показания идут на любой экран в той же сети.",
        },
        {
          title: "Рассчитать",
          href: "/irrigation",
          desc: "Выберите культуру и площадь. Калькулятор сверит замеры с нормами КазНИИЗ и FAO-56 и скажет, сколько литров нужно полю.",
        },
        {
          title: "Спросить",
          href: "/chat",
          desc: "ИИ-агроном видит ваши датчики, отвечает на вашем языке и подсказывает, что сажать на этой земле.",
        },
      ],
    },
    measures: {
      eyebrow: "Состав",
      title: "Что зонд меряет в земле",
      lead: "Четыре числа, от которых зависит урожай. Каждое губит его по-своему, SoilPlus следит за всеми сразу.",
      cta: "Открыть живую панель",
      colParam: "Параметр",
      colRange: "Диапазон",
      colAcc: "Точность",
      photoAlt: "Горсть чернозёма в ладони",
      rows: [
        { title: "Влажность", blurb: "Ёмкостный зонд, стабилен даже на засолённой земле.", range: "0–100 %", acc: "±3,2 п.п." },
        { title: "Кислотность (pH)", blurb: "Стеклянный электрод с термокомпенсацией.", range: "0–14", acc: "±0,15" },
        { title: "Соли (TDS/EC)", blurb: "Замечает засоление раньше, чем оно сожжёт корни.", range: "0–5000 µS/см", acc: "±4,8 %" },
        { title: "Температура почвы", blurb: "Датчик DS18B20, основа расчёта испарения.", range: "−10…+60 °C", acc: "±0,4 °C" },
      ],
    },
    crops: {
      eyebrow: "Каталог культур",
      title: "12 культур с нормами КазНИИЗ",
      lead: "Для каждой культуры заданы свои границы влажности, pH, солей и температуры. Выберите культуру, остальное посчитает калькулятор.",
      cta: "Открыть калькулятор",
    },
    final: {
      eyebrow: "Готов к посеву",
      title: "90 секунд до первого замера",
      steps: ["Включите хотспот", "Вставьте IP платы", "Читайте почву"],
      cta: "Начать настройку",
      photoAlt: "Колосья пшеницы на закате",
    },
  },
};

export type Dict = typeof ru;

const en: Dict = {
  meta: {
    title: "SoilPlus — soil sensor and AI agronomist for farmers",
    description:
      "Portable ESP32 soil sensor and an AI agronomist. Photo disease diagnosis, yield forecast, weather-aware irrigation. Built for the farmers of Kazakhstan.",
  },
  common: {
    login: "Log in",
    signup: "Sign up",
    logout: "Log out",
    menu: "Menu",
    language: "Interface language",
    home: "Home",
  },
  nav: {
    chat: "AI agronomist",
    irrigation: "Irrigation",
    diagnose: "Diagnose",
    forecast: "Forecast",
    weather: "Weather",
    heritage: "Heritage",
    shop: "Shop",
    dashboard: "Dashboard",
    connect: "Connect sensor",
    ownerOnly: "Sensor owners only",
    strip: "Soil sensor and AI agronomist · Uralsk, West Kazakhstan · built for farmers",
  },
  status: {
    idle: "Offline",
    connecting: "Connecting",
    connected: "Live",
    reconnecting: "Reconnecting",
    error: "Fault",
    closed: "Offline",
  },
  footer: {
    tagline:
      "Portable soil intelligence for small and medium farms of Kazakhstan. A student research project from Uralsk.",
    platform: "Platform",
    device: "Device",
    about: "About",
    links: {
      dashboard: "Dashboard",
      irrigation: "Irrigation",
      chat: "AI agronomist",
      heritage: "Heritage",
      connect: "Connect ESP32",
      firmware: "Firmware",
      calibration: "Calibration",
      project: "Project",
      team: "Team",
      shop: "Shop",
    },
    copyright: "© 2026 SoilPlus · Uralsk, Kazakhstan · Sultan Bekkaliev & Ersultan Muratkali",
    motto: "Precision agriculture for Central Asia",
  },
  home: {
    batch: "Batch № 2.0 · Uralsk, West Kazakhstan",
    kind: "Soil sensor and AI agronomist",
    titleA: "Know your soil.",
    titleB: "Water it right.",
    lead:
      "Push the probe into the ground and SoilPlus tells you how much to water, what to plant and which troubles are brewing underground. Built for the fields of Kazakhstan.",
    ctaConnect: "Connect sensor",
    ctaIrrigation: "Plan irrigation",
    stamp: ["Field", "tested", "W. KZ · 2026"],
    photoAlt: "Wheat field on the steppe under clouds",
    statsLabel: "Field trial results",
    stats: [
      { v: "−35%", l: "water use" },
      { v: "+5.4%", l: "yield gain" },
      { v: "±8.3%", l: "gap vs. agronomist" },
      { v: "< 1", l: "season to pay back" },
    ],
    sheet: {
      title: "Reading tag",
      sample: "sample",
      live: "live",
      moist: "Moisture",
      ph: "pH",
      tds: "Salts (TDS)",
      temp: "Soil T",
      norm: "norm",
      note: "Loam is fine for Aport apple. No watering for 24 h.",
      signed: "AI agronomist · Gemini 2.5",
      device: "ESP32 · 4 probes · 5 Hz",
    },
    specs: [
      "ESP32 · Wi-Fi",
      "4 sensors · 5 readings a second",
      "12 crops · KazNIIZ and FAO-56 norms",
      "Gemini 2.5 Flash",
      "Field-tested · West Kazakhstan",
    ],
    how: {
      eyebrow: "Directions for use",
      title: "Three steps from probe to decision",
      lead: "No tables of raw numbers. Just the answer: what to do with the field today.",
      open: "Open",
      steps: [
        {
          title: "Connect",
          href: "/connect",
          desc: "The board joins your phone's hotspot and you enter its IP. Readings reach any screen on the same network.",
        },
        {
          title: "Calculate",
          href: "/irrigation",
          desc: "Pick a crop and plot size. The calculator checks readings against KazNIIZ and FAO-56 norms and tells you how many litres the field needs.",
        },
        {
          title: "Ask",
          href: "/chat",
          desc: "The AI agronomist reads your sensors, answers in your language and suggests what to plant on this ground.",
        },
      ],
    },
    measures: {
      eyebrow: "Contents",
      title: "What the probe measures",
      lead: "Four numbers a harvest depends on. Each ruins it in its own way; SoilPlus watches all four at once.",
      cta: "Open live dashboard",
      colParam: "Parameter",
      colRange: "Range",
      colAcc: "Accuracy",
      photoAlt: "A handful of black soil in a palm",
      rows: [
        { title: "Moisture", blurb: "Capacitive probe, stable even on saline ground.", range: "0–100 %", acc: "±3.2 pp" },
        { title: "Acidity (pH)", blurb: "Glass electrode with temperature compensation.", range: "0–14", acc: "±0.15" },
        { title: "Salts (TDS/EC)", blurb: "Catches salt build-up before it burns the roots.", range: "0–5000 µS/cm", acc: "±4.8 %" },
        { title: "Soil temperature", blurb: "DS18B20 sensor, the anchor for evaporation maths.", range: "−10…+60 °C", acc: "±0.4 °C" },
      ],
    },
    crops: {
      eyebrow: "Crop catalogue",
      title: "12 crops with KazNIIZ norms",
      lead: "Every crop has its own bands for moisture, pH, salts and temperature. Pick one and the calculator does the rest.",
      cta: "Open calculator",
    },
    final: {
      eyebrow: "Ready to sow",
      title: "90 seconds to the first reading",
      steps: ["Turn on the hotspot", "Paste the board's IP", "Read your soil"],
      cta: "Start setup",
      photoAlt: "Wheat ears at sunset",
    },
  },
};

export const DICTS: Record<Lang, Dict> = { ru, en };

export function isLang(v: unknown): v is Lang {
  return v === "ru" || v === "en";
}
