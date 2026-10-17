import type { WasteCategory } from '../types'

export interface CategoryInfo {
  id: WasteCategory
  label: string
  pointsPerKg: number
  color: string // hex, used for charts and chips
  hint: string
}

/** Points per kg reflect how valuable each stream is to sort out of landfill. */
export const CATEGORIES: CategoryInfo[] = [
  { id: 'plastic', label: 'Plastic', pointsPerKg: 10, color: '#4f8a5b', hint: 'PET bottles, packaging, bags' },
  { id: 'glass', label: 'Glass', pointsPerKg: 6, color: '#6aa6a1', hint: 'Jars and bottles, rinsed' },
  { id: 'paper', label: 'Paper & Card', pointsPerKg: 5, color: '#c9a05a', hint: 'Cardboard, newspaper, office paper' },
  { id: 'metal', label: 'Metal', pointsPerKg: 12, color: '#7c8a96', hint: 'Cans, foil, scrap' },
  { id: 'ewaste', label: 'E-waste', pointsPerKg: 20, color: '#b5674d', hint: 'Batteries, cables, small electronics' },
  { id: 'textile', label: 'Textile', pointsPerKg: 7, color: '#9a7bb0', hint: 'Clothes, fabric scraps' },
  { id: 'organic', label: 'Organic', pointsPerKg: 3, color: '#8a9a3c', hint: 'Compostable food & garden waste' },
  { id: 'mixed', label: 'Mixed / Unsorted', pointsPerKg: 2, color: '#a39a86', hint: 'Litter picked up on clean-ups' },
]

const categoryMap = new Map(CATEGORIES.map((c) => [c.id, c]))

export function categoryInfo(id: WasteCategory): CategoryInfo {
  return categoryMap.get(id)!
}

/** Flat bonus for submissions documented with a photo. */
export const PHOTO_BONUS = 5

export const MAX_KG_PER_SUBMISSION = 500

export function calculatePoints(category: WasteCategory, kg: number, hasPhoto: boolean): number {
  if (!(kg > 0)) return 0
  return Math.round(kg * categoryInfo(category).pointsPerKg) + (hasPhoto ? PHOTO_BONUS : 0)
}

export function roundKg(kg: number): number {
  return Math.round(kg * 10) / 10
}

export interface Level {
  index: number
  name: string
  minPoints: number
}

export const LEVELS: Level[] = [
  { index: 1, name: 'Seedling', minPoints: 0 },
  { index: 2, name: 'Sprout', minPoints: 250 },
  { index: 3, name: 'Sapling', minPoints: 750 },
  { index: 4, name: 'Juniper', minPoints: 1500 },
  { index: 5, name: 'Walnut Grove', minPoints: 3000 },
  { index: 6, name: 'Forest Keeper', minPoints: 6000 },
  { index: 7, name: 'Ala-Too Guardian', minPoints: 12000 },
]

export interface LevelProgress {
  level: Level
  next?: Level
  /** 0..1 progress toward next level (1 at max level). */
  progress: number
  pointsToNext: number
}

export function levelFor(points: number): LevelProgress {
  let idx = 0
  for (let i = 0; i < LEVELS.length; i++) if (points >= LEVELS[i].minPoints) idx = i
  const level = LEVELS[idx]
  const next = LEVELS[idx + 1]
  if (!next) return { level, progress: 1, pointsToNext: 0 }
  const span = next.minPoints - level.minPoints
  return { level, next, progress: (points - level.minPoints) / span, pointsToNext: next.minPoints - points }
}
