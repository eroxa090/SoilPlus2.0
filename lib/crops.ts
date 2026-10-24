/**
 * Crop reference database — agronomic norms used by the irrigation
 * calculator and the AI chat. Values are calibrated from the SoilPlus
 * research documentation (KazNIIZ + FAO-56 Table 3).
 *
 *   W_opt (%)  — optimal soil-moisture band in % of field capacity (% НВ).
 *                Not volumetric water content: no mineral soil holds 75–85 %
 *                water by volume, while 60–85 % НВ is the textbook range.
 *   pH_opt     — optimal pH band
 *   EC_max     — salinity threshold as TDS in ppm, the unit the probe reports
 *                (firmware converts ppm = 0.5 × µS/cm). Values come from the
 *                FAO salt-tolerance threshold ECe at 100 % yield, converted
 *                with 1 dS/m = 1000 µS/cm → 500 ppm. Sources: FAO Irrigation
 *                and Drainage Paper 29 Rev.1 (Ayers & Westcot), Table 4;
 *                FAO Paper 61, Annex 1 (crop salt tolerance data).
 *                Caveat: ECe is measured in a saturated-paste extract. A probe
 *                reading taken in a more diluted extract (e.g. 1:2.5) reads
 *                lower than ECe, so it compares conservatively — salinity
 *                is under-flagged, never over-flagged.
 *   T_opt      — optimal soil-temperature band (°C)
 *   rootDepth  — active water-uptake root layer (m), used in volume formula
 */

export type Crop = {
  id: string;
  name: string;
  nameRu: string;
  emoji: string;
  family: "grain" | "vegetable" | "oil" | "legume" | "forage" | "heritage";
  wOptMin: number;
  wOptMax: number;
  phMin:  number;
  phMax:  number;
  ecMax:  number;
  tOptMin: number;
  tOptMax: number;
  rootDepth: number; // m
  /** Short agronomic note for the UI. */
  note: string;
  noteRu: string;
};

export const CROPS: Crop[] = [
  {
    id: "wheat",
    name: "Wheat",
    nameRu: "Пшеница",
    emoji: "🌾",
    family: "grain",
    wOptMin: 60, wOptMax: 70,
    phMin:   6.0, phMax: 7.5,
    ecMax:  3000, // FAO: ECe 6.0 dS/m, moderately tolerant
    tOptMin: 12, tOptMax: 24,
    rootDepth: 0.6,
    note: "The strategic grain of the Kazakh steppe — stable yields require steady moisture in the tillering phase.",
    noteRu: "Стратегическое зерно казахской степи: для стабильного урожая нужна ровная влажность в фазе кущения.",
  },
  {
    id: "sunflower",
    name: "Sunflower",
    nameRu: "Подсолнух",
    emoji: "🌻",
    family: "oil",
    wOptMin: 65, wOptMax: 75,
    phMin:   6.0, phMax: 7.2,
    ecMax:  2400, // FAO: ECe 4.8 dS/m, moderately tolerant
    tOptMin: 16, tOptMax: 28,
    rootDepth: 0.8,
    note: "Deep-rooted, drought-tolerant — most sensitive to moisture during flowering.",
    noteRu: "Глубокие корни и засухоустойчивость; сильнее всего зависит от влаги во время цветения.",
  },
  {
    id: "potato",
    name: "Potato",
    nameRu: "Картофель",
    emoji: "🥔",
    family: "vegetable",
    wOptMin: 70, wOptMax: 80,
    phMin:   5.5, phMax: 6.5,
    ecMax:  850, // FAO: ECe 1.7 dS/m, moderately sensitive
    tOptMin: 14, tOptMax: 22,
    rootDepth: 0.4,
    note: "Prefers slightly acidic loam; over-irrigation causes rot, under-irrigation cracks tubers.",
    noteRu: "Любит слабокислый суглинок: перелив вызывает гниль, недолив — трещины на клубнях.",
  },
  {
    id: "tomato",
    name: "Tomato",
    nameRu: "Томат",
    emoji: "🍅",
    family: "vegetable",
    wOptMin: 75, wOptMax: 85,
    phMin:   6.0, phMax: 6.8,
    ecMax:  1250, // FAO: ECe 2.5 dS/m, moderately sensitive
    tOptMin: 18, tOptMax: 26,
    rootDepth: 0.5,
    note: "Narrow salinity tolerance — salt accumulation blossoms end-rot quickly.",
    noteRu: "Узкий допуск по солям: при засолении быстро появляется вершинная гниль.",
  },
  {
    id: "corn",
    name: "Corn",
    nameRu: "Кукуруза",
    emoji: "🌽",
    family: "grain",
    wOptMin: 65, wOptMax: 75,
    phMin:   6.0, phMax: 7.0,
    ecMax:  850, // FAO: ECe 1.7 dS/m, moderately sensitive
    tOptMin: 18, tOptMax: 30,
    rootDepth: 0.7,
    note: "Peak demand at tasseling; a 5-day deficit reduces yield dramatically.",
    noteRu: "Пик потребления воды — выбрасывание метёлки; пять дней дефицита резко снижают урожай.",
  },
  {
    id: "alfalfa",
    name: "Alfalfa",
    nameRu: "Люцерна",
    emoji: "🌱",
    family: "forage",
    wOptMin: 70, wOptMax: 80,
    phMin:   6.5, phMax: 7.5,
    ecMax:  1000, // FAO: ECe 2.0 dS/m, moderately sensitive
    tOptMin: 15, tOptMax: 28,
    rootDepth: 1.2,
    note: "Moderately sensitive to salinity (FAO ECe 2.0 dS/m); deep taproot reaching 1.2 m.",
    noteRu: "Умеренно чувствительна к засолению (FAO: ECe 2,0 dS/m); стержневой корень уходит на 1,2 м.",
  },
  {
    id: "cotton",
    name: "Cotton",
    nameRu: "Хлопок",
    emoji: "🌿",
    family: "oil",
    wOptMin: 60, wOptMax: 75,
    phMin:   6.5, phMax: 8.0,
    ecMax:  3850, // FAO: ECe 7.7 dS/m, tolerant
    tOptMin: 22, tOptMax: 32,
    rootDepth: 0.9,
    note: "Salt-tolerant fiber crop — common in southern Kazakhstan irrigation zones.",
    noteRu: "Солеустойчивая техническая культура, обычная для орошаемых зон юга Казахстана.",
  },
  {
    id: "barley",
    name: "Barley",
    nameRu: "Ячмень",
    emoji: "🌾",
    family: "grain",
    wOptMin: 55, wOptMax: 70,
    phMin:   6.0, phMax: 7.8,
    ecMax:  4000, // FAO: ECe 8.0 dS/m, tolerant
    tOptMin: 10, tOptMax: 22,
    rootDepth: 0.6,
    note: "More salt-tolerant than wheat; the pragmatic choice for marginal plots.",
    noteRu: "Солеустойчивее пшеницы; практичный выбор для бедных участков.",
  },
  {
    id: "soybean",
    name: "Soybean",
    nameRu: "Соя",
    emoji: "🫘",
    family: "legume",
    wOptMin: 65, wOptMax: 78,
    phMin:   6.0, phMax: 7.0,
    ecMax:  2500, // FAO: ECe 5.0 dS/m, moderately tolerant
    tOptMin: 18, tOptMax: 28,
    rootDepth: 0.6,
    note: "Fixes atmospheric nitrogen — good rotation partner for cereals.",
    noteRu: "Фиксирует азот из воздуха — хороший партнёр в севообороте с зерновыми.",
  },
  {
    id: "aport-apple",
    name: "Almaty Aport Apple",
    nameRu: "Алматинский Апорт",
    emoji: "🍎",
    family: "heritage",
    wOptMin: 55, wOptMax: 70,
    phMin:   6.0, phMax: 7.0,
    ecMax:   650, // FAO rates apple 'sensitive' with no measured threshold; 1.3 dS/m = upper bound of that class
    tOptMin: 12, tOptMax: 22,
    rootDepth: 1.5,
    note: "Heritage orchard — the mother apple of Central Asia. Cool, slightly acidic loam.",
    noteRu: "Садовое наследие — праматерь яблонь Центральной Азии. Прохладный слабокислый суглинок.",
  },
  {
    id: "tulipa",
    name: "Greig's Tulip",
    nameRu: "Тюльпан Грейга",
    emoji: "🌷",
    family: "heritage",
    wOptMin: 25, wOptMax: 45,
    phMin:   6.5, phMax: 7.5,
    ecMax:   600, // no FAO data — project estimate, needs a source
    tOptMin: 8, tOptMax: 18,
    rootDepth: 0.25,
    note: "Wild progenitor of garden tulips — demands drainage; rots in wet soil.",
    noteRu: "Дикий предок садовых тюльпанов: нужен дренаж, во влажной почве загнивает.",
  },
  {
    id: "saxaul",
    name: "Saxaul Tree",
    nameRu: "Саксаул",
    emoji: "🌲",
    family: "heritage",
    wOptMin: 8,  wOptMax: 25,
    phMin:   7.5, phMax: 9.0,
    ecMax:  2500, // no FAO data — halophyte, project estimate, needs a source
    tOptMin: 15, tOptMax: 35,
    rootDepth: 2.0,
    note: "Desert halophyte — the anchor of Betpaq-Dala and the Aral. Tolerates saline ground.",
    noteRu: "Пустынный галофит, опора Бетпак-Далы и Приаралья. Выносит засолённую землю.",
  },
];

export function getCrop(id: string): Crop | undefined {
  return CROPS.find((c) => c.id === id);
}
