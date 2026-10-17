import type { LedgerEntry, WasteCategory } from '../types'
import { CATEGORIES } from '../lib/scoring'
import { addDays, formatNumber, formatShortDate, toISODate } from '../lib/dates'
import { CATEGORY_ICONS } from './icons'

export function LevelRing({ progress, label, size = 132 }: { progress: number; label: string; size?: number }) {
  const r = 52
  const circ = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#ring)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - Math.min(1, progress))}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.2,.7,.2,1)' }}
        />
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f0c457" />
            <stop offset="1" stopColor="#b5cc6c" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[11px] font-semibold tracking-[0.2em] text-moss-200/80 uppercase">Level</span>
        <span className="font-display text-4xl leading-none font-semibold text-cream-50">{label}</span>
      </div>
    </div>
  )
}

/** Verified kg per week for the last N weeks. */
export function WeeklyActivity({ entries, weeks = 12 }: { entries: LedgerEntry[]; weeks?: number }) {
  const today = new Date()
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7))
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const start = addDays(monday, -7 * (weeks - 1 - i))
    return { start: toISODate(start), end: toISODate(addDays(start, 6)), kg: 0 }
  })
  for (const e of entries) {
    const b = buckets.find((b) => e.date >= b.start && e.date <= b.end)
    if (b) b.kg += e.kg
  }
  const max = Math.max(1, ...buckets.map((b) => b.kg))
  const total = buckets.reduce((s, b) => s + b.kg, 0)

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-forest-600/80">Last {weeks} weeks</p>
        <p className="text-sm font-semibold text-forest-800">{formatNumber(total, 1)} kg verified</p>
      </div>
      <div className="mt-6 flex h-56 items-end gap-1.5 sm:gap-2">
        {buckets.map((b, i) => (
          <div key={b.start} className="group relative flex h-full flex-1 flex-col justify-end">
            <div
              className={`origin-bottom rounded-t-lg transition-all duration-700 group-hover:opacity-100 ${
                i === buckets.length - 1 ? 'bg-gradient-to-t from-sun-400 to-sun-200' : 'bg-gradient-to-t from-forest-500 to-moss-300 opacity-85'
              }`}
              style={{ height: `${Math.max(b.kg > 0 ? 6 : 2, (b.kg / max) * 100)}%` }}
            />
            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-forest-900 px-2 py-1 text-xs whitespace-nowrap text-cream-50 opacity-0 transition group-hover:opacity-100">
              {formatNumber(b.kg, 1)} kg · {formatShortDate(b.start)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-forest-500">
        <span>{formatShortDate(buckets[0].start)}</span>
        <span>This week</span>
      </div>
    </div>
  )
}

export function CategoryBreakdown({ kgByCategory }: { kgByCategory: Partial<Record<WasteCategory, number>> }) {
  const rows = CATEGORIES.map((c) => ({ ...c, kg: kgByCategory[c.id] ?? 0 }))
    .filter((r) => r.kg > 0)
    .sort((a, b) => b.kg - a.kg)
  const max = Math.max(1, ...rows.map((r) => r.kg))
  if (!rows.length) return <p className="text-sm text-forest-600/70">No verified collections yet.</p>
  return (
    <ul className="space-y-3">
      {rows.map((r) => {
        const Icon = CATEGORY_ICONS[r.id]
        return (
          <li key={r.id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium">
                <Icon className="size-4" style={{ color: r.color }} />
                {r.label}
              </span>
              <span className="text-forest-600">{formatNumber(r.kg, 1)} kg</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-forest-900/6">
              <div className="h-full origin-left animate-grow rounded-full" style={{ width: `${(r.kg / max) * 100}%`, background: r.color }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
