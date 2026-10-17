import type { LedgerEntry, User } from '../types'
import { toISODate } from './dates'
import { oblastName, rayonName, getRayon, OBLASTS } from '../data/locations'

export type Scope =
  | { kind: 'country' }
  | { kind: 'oblast'; oblastId: string }
  | { kind: 'rayon'; rayonId: string }
  | { kind: 'city'; city: string }

export type Period = 'all' | 'year' | 'month' | 'week' | '30d'

export const PERIODS: { id: Period; label: string }[] = [
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'year', label: 'This year' },
  { id: 'all', label: 'All time' },
]

export interface DateRange {
  start?: string // inclusive YYYY-MM-DD
  end?: string // inclusive YYYY-MM-DD
}

export function periodRange(period: Period, now = new Date()): DateRange {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  switch (period) {
    case 'all':
      return {}
    case 'year':
      return { start: `${today.getFullYear()}-01-01`, end: toISODate(today) }
    case 'month':
      return { start: toISODate(new Date(today.getFullYear(), today.getMonth(), 1)), end: toISODate(today) }
    case 'week': {
      const monday = new Date(today)
      monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
      return { start: toISODate(monday), end: toISODate(today) }
    }
    case '30d': {
      const start = new Date(today)
      start.setDate(today.getDate() - 29)
      return { start: toISODate(start), end: toISODate(today) }
    }
  }
}

export function inRange(date: string, range: DateRange): boolean {
  return (!range.start || date >= range.start) && (!range.end || date <= range.end)
}

export function inScope(entry: LedgerEntry, scope: Scope): boolean {
  switch (scope.kind) {
    case 'country':
      return true
    case 'oblast':
      return entry.location.oblastId === scope.oblastId
    case 'rayon':
      return entry.location.rayonId === scope.rayonId
    case 'city':
      return entry.location.city === scope.city
  }
}

export function scopeLabel(scope: Scope): string {
  switch (scope.kind) {
    case 'country':
      return 'Kyrgyzstan'
    case 'oblast':
      return oblastName(scope.oblastId)
    case 'rayon':
      return `${rayonName(scope.rayonId)} rayon`
    case 'city':
      return scope.city
  }
}

export function filterLedger(ledger: LedgerEntry[], scope: Scope, range: DateRange): LedgerEntry[] {
  return ledger.filter((e) => inScope(e, scope) && inRange(e.date, range))
}

export interface UserRow {
  rank: number
  user: User
  points: number
  kg: number
  collections: number
}

/** Standard competition ranking: ties share a rank (1, 2, 2, 4). */
function assignRanks<T extends { rank: number }>(rows: T[], score: (r: T) => number): T[] {
  rows.forEach((row, i) => {
    row.rank = i > 0 && score(rows[i - 1]) === score(row) ? rows[i - 1].rank : i + 1
  })
  return rows
}

export function rankUsers(entries: LedgerEntry[], users: User[]): UserRow[] {
  const byUser = new Map<string, { points: number; kg: number; collections: number }>()
  for (const e of entries) {
    const agg = byUser.get(e.userId) ?? { points: 0, kg: 0, collections: 0 }
    agg.points += e.points
    agg.kg += e.kg
    agg.collections += 1
    byUser.set(e.userId, agg)
  }
  const userMap = new Map(users.map((u) => [u.id, u]))
  const rows: UserRow[] = []
  for (const [userId, agg] of byUser) {
    const user = userMap.get(userId)
    if (user) rows.push({ rank: 0, user, ...agg })
  }
  rows.sort((a, b) => b.points - a.points || b.kg - a.kg || a.user.name.localeCompare(b.user.name))
  return assignRanks(rows, (r) => r.points)
}

export interface RegionRow {
  rank: number
  id: string
  name: string
  subtitle: string
  points: number
  kg: number
  collectors: number
}

export function rankRegions(entries: LedgerEntry[], level: 'oblast' | 'rayon', score: (e: LedgerEntry) => number = (e) => e.points): RegionRow[] {
  const map = new Map<string, { points: number; kg: number; users: Set<string> }>()
  for (const e of entries) {
    const key = level === 'oblast' ? e.location.oblastId : e.location.rayonId
    const agg = map.get(key) ?? { points: 0, kg: 0, users: new Set<string>() }
    agg.points += score(e)
    agg.kg += e.kg
    agg.users.add(e.userId)
    map.set(key, agg)
  }
  const rows: RegionRow[] = [...map].map(([id, agg]) => ({
    rank: 0,
    id,
    name: level === 'oblast' ? oblastName(id) : rayonName(id),
    subtitle: level === 'oblast' ? `${OBLASTS.find((o) => o.id === id)?.rayons.length ?? 0} rayons` : regionParent(id),
    points: Math.round(agg.points),
    kg: agg.kg,
    collectors: agg.users.size,
  }))
  rows.sort((a, b) => b.points - a.points || b.kg - a.kg)
  return assignRanks(rows, (r) => r.points)
}

function regionParent(rayonId: string): string {
  const oblast = OBLASTS.find((o) => o.rayons.some((r) => r.id === rayonId))
  return oblast ? oblastName(oblast.id) : getRayon(rayonId)?.name ?? ''
}

export function userRank(ledger: LedgerEntry[], users: User[], userId: string, scope: Scope = { kind: 'country' }, range: DateRange = {}) {
  const rows = rankUsers(filterLedger(ledger, scope, range), users)
  const row = rows.find((r) => r.user.id === userId)
  return { rank: row?.rank, total: rows.length, row }
}
