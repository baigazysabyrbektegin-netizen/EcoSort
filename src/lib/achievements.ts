import type { LedgerEntry, WasteCategory } from '../types'

export interface UserStats {
  points: number
  kg: number
  count: number
  kgByCategory: Partial<Record<WasteCategory, number>>
  categories: Set<WasteCategory>
  rayons: Set<string>
  oblasts: Set<string>
  months: Set<string>
}

export type AchievementTier = 'bronze' | 'silver' | 'gold'

export interface AchievementDef {
  id: string
  title: string
  description: string
  icon: string // key into the UI icon map
  tier: AchievementTier
  goal: number
  unit: string
  metric: (s: UserStats) => number
}

const catKg = (c: WasteCategory) => (s: UserStats) => s.kgByCategory[c] ?? 0

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-steps', title: 'First Sprout', description: 'Get your first collection verified.', icon: 'sprout', tier: 'bronze', goal: 1, unit: 'collection', metric: (s) => s.count },
  { id: 'ten-kilos', title: 'Ten Kilo Trail', description: 'Collect 10 kg of verified waste.', icon: 'footprints', tier: 'bronze', goal: 10, unit: 'kg', metric: (s) => s.kg },
  { id: 'century', title: 'Century Collector', description: 'Reach 100 kg verified.', icon: 'mountain', tier: 'silver', goal: 100, unit: 'kg', metric: (s) => s.kg },
  { id: 'half-tonne', title: 'Half-Tonne Hero', description: 'Reach 500 kg verified.', icon: 'trees', tier: 'gold', goal: 500, unit: 'kg', metric: (s) => s.kg },
  { id: 'regular', title: 'Steady Hands', description: 'Have 25 collections approved.', icon: 'repeat', tier: 'silver', goal: 25, unit: 'collections', metric: (s) => s.count },
  { id: 'plastic', title: 'Plastic Hunter', description: 'Recover 50 kg of plastic.', icon: 'bottle', tier: 'silver', goal: 50, unit: 'kg plastic', metric: catKg('plastic') },
  { id: 'glass', title: 'Clear as Issyk-Kul', description: 'Recover 30 kg of glass.', icon: 'gem', tier: 'silver', goal: 30, unit: 'kg glass', metric: catKg('glass') },
  { id: 'paper', title: 'Paper Trail', description: 'Recover 50 kg of paper & card.', icon: 'scroll', tier: 'bronze', goal: 50, unit: 'kg paper', metric: catKg('paper') },
  { id: 'metal', title: 'Iron Will', description: 'Recover 25 kg of metal.', icon: 'anvil', tier: 'silver', goal: 25, unit: 'kg metal', metric: catKg('metal') },
  { id: 'ewaste', title: 'Circuit Saver', description: 'Safely hand in 5 kg of e-waste.', icon: 'battery', tier: 'gold', goal: 5, unit: 'kg e-waste', metric: catKg('ewaste') },
  { id: 'organic', title: 'Compost Keeper', description: 'Compost 40 kg of organic waste.', icon: 'leaf', tier: 'bronze', goal: 40, unit: 'kg organic', metric: catKg('organic') },
  { id: 'spectrum', title: 'Full Spectrum Sorter', description: 'Get collections approved in 6 different categories.', icon: 'palette', tier: 'gold', goal: 6, unit: 'categories', metric: (s) => s.categories.size },
  { id: 'nomad', title: 'Nomad Cleaner', description: 'Collect in 3 different rayons.', icon: 'tent', tier: 'silver', goal: 3, unit: 'rayons', metric: (s) => s.rayons.size },
  { id: 'ala-too', title: 'Across the Ala-Too', description: 'Collect in 3 different oblasts.', icon: 'map', tier: 'gold', goal: 3, unit: 'oblasts', metric: (s) => s.oblasts.size },
  { id: 'seasons', title: 'Four Seasons', description: 'Be active in 6 different months.', icon: 'sun', tier: 'silver', goal: 6, unit: 'months', metric: (s) => s.months.size },
  { id: 'juniper', title: 'Juniper Rising', description: 'Earn 1,500 points.', icon: 'award', tier: 'silver', goal: 1500, unit: 'points', metric: (s) => s.points },
  { id: 'forest-keeper', title: 'Forest Keeper', description: 'Earn 6,000 points.', icon: 'crown', tier: 'gold', goal: 6000, unit: 'points', metric: (s) => s.points },
]

export function emptyStats(): UserStats {
  return { points: 0, kg: 0, count: 0, kgByCategory: {}, categories: new Set(), rayons: new Set(), oblasts: new Set(), months: new Set() }
}

function addEntry(s: UserStats, e: LedgerEntry) {
  s.points += e.points
  s.kg += e.kg
  s.count += 1
  s.kgByCategory[e.category] = (s.kgByCategory[e.category] ?? 0) + e.kg
  s.categories.add(e.category)
  s.rayons.add(e.location.rayonId)
  s.oblasts.add(e.location.oblastId)
  s.months.add(e.date.slice(0, 7))
}

export interface AchievementStatus {
  def: AchievementDef
  value: number
  progress: number // 0..1
  unlockedAt?: string // ISO timestamp of the approval that unlocked it
}

/**
 * Achievements are derived from the points ledger, so they update the moment
 * an approval lands and can never be unlocked by pending submissions.
 */
export function evaluateAchievements(ledger: LedgerEntry[], userId: string): AchievementStatus[] {
  const entries = ledger.filter((e) => e.userId === userId).sort((a, b) => a.awardedAt.localeCompare(b.awardedAt))
  const stats = emptyStats()
  const unlocked = new Map<string, string>()
  for (const e of entries) {
    addEntry(stats, e)
    for (const def of ACHIEVEMENTS) if (!unlocked.has(def.id) && def.metric(stats) >= def.goal) unlocked.set(def.id, e.awardedAt)
  }
  return ACHIEVEMENTS.map((def) => {
    const value = def.metric(stats)
    return { def, value, progress: Math.min(1, value / def.goal), unlockedAt: unlocked.get(def.id) }
  })
}

export function statsFor(ledger: LedgerEntry[], userId: string): UserStats {
  const s = emptyStats()
  for (const e of ledger) if (e.userId === userId) addEntry(s, e)
  return s
}

/** Achievement ids newly unlocked between two ledger states, for celebration toasts. */
export function newlyUnlocked(before: LedgerEntry[], after: LedgerEntry[], userId: string): AchievementDef[] {
  const had = new Set(evaluateAchievements(before, userId).filter((a) => a.unlockedAt).map((a) => a.def.id))
  return evaluateAchievements(after, userId)
    .filter((a) => a.unlockedAt && !had.has(a.def.id))
    .map((a) => a.def)
}
