import type { Competition, LedgerEntry, User } from '../types'
import { inRange, rankRegions, type RegionRow } from './leaderboard'
import { daysBetween, todayISO } from './dates'
import { OBLASTS, getOblast } from '../data/locations'

export type CompetitionStatus = 'upcoming' | 'active' | 'completed'

export function competitionStatus(c: Competition, today = todayISO()): CompetitionStatus {
  if (today < c.startDate) return 'upcoming'
  if (today > c.endDate) return 'completed'
  return 'active'
}

export function competitionScore(c: Competition, e: LedgerEntry): number {
  return e.points * (c.multipliers[e.category] ?? 1)
}

export function competitionEntries(c: Competition, ledger: LedgerEntry[]): LedgerEntry[] {
  return ledger.filter(
    (e) => inRange(e.date, { start: c.startDate, end: c.endDate }) && (!c.oblastId || e.location.oblastId === c.oblastId),
  )
}

export function competitionRankings(c: Competition, ledger: LedgerEntry[]): RegionRow[] {
  const rows = rankRegions(competitionEntries(c, ledger), c.level, (e) => competitionScore(c, e))
  // Show participating regions that have not scored yet (oblast contests and single-oblast rayon contests).
  const pool =
    c.level === 'oblast'
      ? OBLASTS.map((o) => ({ id: o.id, name: o.name, subtitle: `${o.rayons.length} rayons` }))
      : c.oblastId
        ? (getOblast(c.oblastId)?.rayons ?? []).map((r) => ({ id: r.id, name: r.name, subtitle: getOblast(c.oblastId!)!.name }))
        : []
  const zeroRank = rows.length + 1
  for (const p of pool)
    if (!rows.some((row) => row.id === p.id)) rows.push({ rank: zeroRank, ...p, points: 0, kg: 0, collectors: 0 })
  return rows
}

export interface CompetitorRow {
  user: User
  score: number
  kg: number
}

export function topCompetitors(c: Competition, ledger: LedgerEntry[], users: User[], limit = 5): CompetitorRow[] {
  const map = new Map<string, { score: number; kg: number }>()
  for (const e of competitionEntries(c, ledger)) {
    const agg = map.get(e.userId) ?? { score: 0, kg: 0 }
    agg.score += competitionScore(c, e)
    agg.kg += e.kg
    map.set(e.userId, agg)
  }
  const userMap = new Map(users.map((u) => [u.id, u]))
  return [...map]
    .filter(([id]) => userMap.has(id))
    .map(([id, agg]) => ({ user: userMap.get(id)!, score: Math.round(agg.score), kg: agg.kg }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/** The region a user represents in a competition: their home rayon/oblast. */
export function userRegionId(c: Competition, user: User): string | undefined {
  if (c.oblastId && user.home.oblastId !== c.oblastId) return undefined
  return c.level === 'oblast' ? user.home.oblastId : user.home.rayonId
}

export function competitionProgress(c: Competition, today = todayISO()): { elapsed: number; total: number; ratio: number } {
  const total = daysBetween(c.startDate, c.endDate) + 1
  const elapsed = Math.min(total, Math.max(0, daysBetween(c.startDate, today) + 1))
  return { elapsed, total, ratio: elapsed / total }
}
