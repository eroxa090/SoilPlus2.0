/**
 * Crop reference database — agronomic norms used by the irrigation
 * calculator and the AI chat. Values are calibrated from the SoilPlus
 * research documentation (KazNIIZ + FAO-56 Table 3).
 *
 *   W_opt (%)  — optimal volumetric water content band
 *   pH_opt     — optimal pH band
 *   EC_max     — upper tolerable electrical-conductivity / TDS (µS/cm ≈ ppm)
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
    ecMax:  1500,
    tOptMin: 12, tOptMax: 24,
    rootDepth: 0.6,
    note: "The strategic grain of the Kazakh steppe — stable yields require steady moisture in the tillering phase.",
  },
  {
    id: "sunflower",
    name: "Sunflower",
    nameRu: "Подсолнух",
    emoji: "🌻",
    family: "oil",
    wOptMin: 65, wOptMax: 75,
    phMin:   6.0, phMax: 7.2,
    ecMax:  1800,
    tOptMin: 16, tOptMax: 28,
    rootDepth: 0.8,
    note: "Deep-rooted, drought-tolerant — most sensitive to moisture during flowering.",
  },
  {
    id: "potato",
    name: "Potato",
    nameRu: "Картофель",
    emoji: "🥔",
    family: "vegetable",
    wOptMin: 70, wOptMax: 80,
    phMin:   5.5, phMax: 6.5,
    ecMax:  1200,
    tOptMin: 14, tOptMax: 22,
    rootDepth: 0.4,
    note: "Prefers slightly acidic loam; over-irrigation causes rot, under-irrigation cracks tubers.",
  },
  {
    id: "tomato",
    name: "Tomato",
    nameRu: "Томат",
    emoji: "🍅",
    family: "vegetable",
    wOptMin: 75, wOptMax: 85,
    phMin:   6.0, phMax: 6.8,
    ecMax:  1000,
    tOptMin: 18, tOptMax: 26,
    rootDepth: 0.5,
    note: "Narrow salinity tolerance — salt accumulation blossoms end-rot quickly.",
  },
  {
    id: "corn",
    name: "Corn",
    nameRu: "Кукуруза",
    emoji: "🌽",
    family: "grain",
    wOptMin: 65, wOptMax: 75,
    phMin:   6.0, phMax: 7.0,
    ecMax:  1600,
    tOptMin: 18, tOptMax: 30,
    rootDepth: 0.7,
    note: "Peak demand at tasseling; a 5-day deficit reduces yield dramatically.",
  },
  {
    id: "alfalfa",
    name: "Alfalfa",
    nameRu: "Люцерна",
    emoji: "🌱",
    family: "forage",
    wOptMin: 70, wOptMax: 80,
    phMin:   6.5, phMax: 7.5,
    ecMax:  2000,
    tOptMin: 15, tOptMax: 28,
    rootDepth: 1.2,
    note: "Tolerant of moderate salinity; the deepest roots of our catalog.",
  },
  {
    id: "cotton",
    name: "Cotton",
    nameRu: "Хлопок",
    emoji: "🌿",
    family: "oil",
    wOptMin: 60, wOptMax: 75,
    phMin:   6.5, phMax: 8.0,
    ecMax:  2400,
    tOptMin: 22, tOptMax: 32,
    rootDepth: 0.9,
    note: "Salt-tolerant fiber crop — common in southern Kazakhstan irrigation zones.",
  },
  {
    id: "barley",
    name: "Barley",
    nameRu: "Ячмень",
    emoji: "🌾",
    family: "grain",
    wOptMin: 55, wOptMax: 70,
    phMin:   6.0, phMax: 7.8,
    ecMax:  2200,
    tOptMin: 10, tOptMax: 22,
    rootDepth: 0.6,
    note: "More salt-tolerant than wheat; the pragmatic choice for marginal plots.",
  },
  {
    id: "soybean",
    name: "Soybean",
    nameRu: "Соя",
    emoji: "🫘",
    family: "legume",
    wOptMin: 65, wOptMax: 78,
    phMin:   6.0, phMax: 7.0,
    ecMax:  1400,
    tOptMin: 18, tOptMax: 28,
    rootDepth: 0.6,
    note: "Fixes atmospheric nitrogen — good rotation partner for cereals.",
  },
  {
    id: "aport-apple",
    name: "Almaty Aport Apple",
    nameRu: "Алматинский Апорт",
    emoji: "🍎",
    family: "heritage",
    wOptMin: 55, wOptMax: 70,
    phMin:   6.0, phMax: 7.0,
    ecMax:   900,
    tOptMin: 12, tOptMax: 22,
    rootDepth: 1.5,
    note: "Heritage orchard — the mother apple of Central Asia. Cool, slightly acidic loam.",
  },
  {
    id: "tulipa",
    name: "Greig's Tulip",
    nameRu: "Тюльпан Грейга",
    emoji: "🌷",
    family: "heritage",
    wOptMin: 25, wOptMax: 45,
    phMin:   6.5, phMax: 7.5,
    ecMax:   600,
    tOptMin: 8, tOptMax: 18,
    rootDepth: 0.25,
    note: "Wild progenitor of garden tulips — demands drainage; rots in wet soil.",
  },
  {
    id: "saxaul",
    name: "Saxaul Tree",
    nameRu: "Саксаул",
    emoji: "🌲",
    family: "heritage",
    wOptMin: 8,  wOptMax: 25,
    phMin:   7.5, phMax: 9.0,
    ecMax:  2500,
    tOptMin: 15, tOptMax: 35,
    rootDepth: 2.0,
    note: "Desert halophyte — the anchor of Betpaq-Dala and the Aral. Tolerates saline ground.",
  },
];

export function getCrop(id: string): Crop | undefined {
  return CROPS.find((c) => c.id === id);
}
