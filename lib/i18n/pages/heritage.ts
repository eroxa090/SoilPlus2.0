import type { Lang } from "../dict";

type PlantText = { name: string; story: string; place: string };

const ru = {
  crumb: "Наследие",
  eyebrow: "Культурное наследие",
  title: "Сохранит ли эта почва память?",
  lead: "Сравните участок с тремя растениями, которые определяют казахский ландшафт. ИИ читает живую химию почвы и отвечает тремя предложениями: диагноз, последствие, что стоит на кону.",
  live: "Живой поток",
  demo: "Демо-почва",
  plants: {
    aport: {
      name: "Алматинский апорт",
      story: "Праматерь яблок Центральной Азии — сорт, благодаря которому Алма-Ата стала «отцом яблок», пока советская эпоха едва не вырубила его сады.",
      place: "Предгорья Заилийского Алатау, 900–1400 м",
    },
    tulip: {
      name: "Тюльпан Грейга",
      story: "Дикий тюльпан известняковой степи — предок всех садовых тюльпанов мира и символ весны юга Казахстана.",
      place: "Хребты Каратау и Боролдай, Туркестанская область",
    },
    saxaul: {
      name: "Саксаул",
      story: "Галофит, который сшивает пустыни Приаралья и Бетпак-Далы. Без него степь дышит песком, с ним почва держится.",
      place: "Арало-Каспийская низменность и пустыня Бетпак-Дала",
    },
  } as Record<"aport" | "tulip" | "saxaul", PlantText>,
  proximity: "Близость к идеальным границам",
  metrics: { temp: "Температура", ph: "pH", tds: "Соли (TDS)", moist: "Влажность" },
  ideal: "норма",
  baseline: "Базовая жизнеспособность",
  baselineHint: "Средняя близость по всем четырём показателям.",
  analysing: "Анализируем…",
  run: "Запустить ИИ-анализ",
  failed: "Анализ не удался",
  verdict: "Вердикт ИИ",
  askNext: "Спросить агронома, что дальше",
  irrigation: "План полива",
  ready: "Готов, когда будете готовы вы.",
  readyBody: (reading: string, plant: string) =>
    `Gemini 2.5 Flash сравнит сегодняшние ${reading} с профилем растения «${plant}», поправит оценку в пределах ±12 баллов и даст вердикт из трёх предложений: диагноз, биологическое последствие, культурная ставка.`,
};

const en: typeof ru = {
  crumb: "Heritage",
  eyebrow: "Cultural heritage",
  title: "Can this soil hold a memory?",
  lead: "Score your plot against three plants that define the Kazakh landscape. The AI reads your live soil chemistry and answers in three sentences: diagnosis, consequence, and what's at stake.",
  live: "Live stream",
  demo: "Demo soil",
  plants: {
    aport: {
      name: "Almaty Aport Apple",
      story: "The mother apple of Central Asia — the variety that made Alma-Ata mean “father of apples” before the Soviet era nearly wiped its orchards out.",
      place: "Trans-Ili Alatau foothills, 900–1400 m",
    },
    tulip: {
      name: "Greig's Tulip",
      story: "A wild tulip of limestone steppe — the progenitor of every garden tulip on earth, and a symbol of southern Kazakhstan's spring.",
      place: "Karatau & Boroldai ridges, Turkistan region",
    },
    saxaul: {
      name: "Saxaul Tree",
      story: "The halophyte that stitches the Aral and Betpaq-Dala deserts together. Without it the steppe breathes sand; with it, the soil holds.",
      place: "Aral-Caspian lowland and Betpaq-Dala desert",
    },
  },
  proximity: "Proximity to ideal bands",
  metrics: { temp: "Temperature", ph: "pH", tds: "Salts (TDS)", moist: "Moisture" },
  ideal: "ideal",
  baseline: "Baseline viability",
  baselineHint: "Even-weighted proximity across all four metrics.",
  analysing: "Analysing…",
  run: "Run AI analysis",
  failed: "Analysis failed",
  verdict: "AI verdict",
  askNext: "Ask the agronomist what's next",
  irrigation: "Irrigation plan",
  ready: "Ready when you are.",
  readyBody: (reading: string, plant: string) =>
    `Gemini 2.5 Flash will compare today's ${reading} against the profile of ${plant}, adjust the score within ±12 points, and return a three-sentence verdict: diagnosis, biological consequence, cultural stake.`,
};

export const HERITAGE: Record<Lang, typeof ru> = { ru, en };
