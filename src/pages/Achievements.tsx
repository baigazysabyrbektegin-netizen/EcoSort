import { useState } from 'react'
import { Lock } from 'lucide-react'
import { useUserSummary } from '../state/selectors'
import { LEVELS } from '../lib/scoring'
import { formatDate, formatNumber } from '../lib/dates'
import type { AchievementTier } from '../lib/achievements'
import { PageHeader, ProgressBar, Segmented } from '../components/ui'
import { ACHIEVEMENT_ICONS } from '../components/icons'

type Filter = 'all' | 'unlocked' | 'locked'

const TIER: Record<AchievementTier, { ring: string; bg: string; label: string }> = {
  bronze: { ring: 'ring-clay-200', bg: 'from-clay-100 to-clay-200 text-clay-700', label: 'Bronze' },
  silver: { ring: 'ring-forest-200', bg: 'from-forest-50 to-forest-200 text-forest-700', label: 'Silver' },
  gold: { ring: 'ring-sun-300', bg: 'from-sun-100 to-sun-300 text-sun-700', label: 'Gold' },
}

export function Achievements() {
  const s = useUserSummary()
  const [filter, setFilter] = useState<Filter>('all')
  const list = s.achievements.filter((a) => (filter === 'all' ? true : filter === 'unlocked' ? !!a.unlockedAt : !a.unlockedAt))

  return (
    <div>
      <PageHeader
        eyebrow="Achievements & levels"
        title="Grow your grove"
        description="Achievements unlock automatically from verified collections — pending submissions don’t count until a moderator approves them."
      />

      {/* Level path */}
      <section className="card mb-8 overflow-x-auto p-6">
        <h2 className="text-2xl font-semibold">Level path</h2>
        <ol className="mt-6 flex min-w-[720px] items-start">
          {LEVELS.map((lv, i) => {
            const reached = s.stats.points >= lv.minPoints
            const current = lv.index === s.level.level.index
            return (
              <li key={lv.index} className="relative flex flex-1 flex-col items-center text-center">
                {i > 0 && <span className={`absolute top-5 right-1/2 h-1 w-full -translate-y-1/2 rounded ${reached ? 'bg-moss-400' : 'bg-forest-900/10'}`} />}
                <span
                  className={`relative z-10 inline-flex size-10 items-center justify-center rounded-full font-display font-semibold ${
                    current ? 'bg-sun-300 text-forest-900 ring-4 ring-sun-100' : reached ? 'bg-forest-700 text-cream-50' : 'bg-white text-forest-400 ring-1 ring-forest-900/10'
                  }`}
                >
                  {lv.index}
                </span>
                <span className={`mt-2 text-sm font-semibold ${reached ? '' : 'text-forest-400'}`}>{lv.name}</span>
                <span className="text-xs text-forest-600/70">{formatNumber(lv.minPoints)} pts</span>
              </li>
            )
          })}
        </ol>
        <p className="mt-6 text-sm text-forest-700/80">
          You have <strong>{formatNumber(s.stats.points)}</strong> points
          {s.level.next ? ` — ${formatNumber(s.level.pointsToNext)} to go until ${s.level.next.name}.` : ' — the top of the mountain!'}
        </p>
      </section>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: `All (${s.achievements.length})` },
            { id: 'unlocked', label: `Unlocked (${s.unlockedCount})` },
            { id: 'locked', label: `Locked (${s.achievements.length - s.unlockedCount})` },
          ]}
        />
      </div>

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((a) => {
          const Icon = ACHIEVEMENT_ICONS[a.def.icon]
          const tier = TIER[a.def.tier]
          const unlocked = !!a.unlockedAt
          return (
            <article key={a.def.id} className={`card relative overflow-hidden p-5 ${unlocked ? '' : 'opacity-90'}`}>
              <div className="flex items-start gap-4">
                <span
                  className={`relative inline-flex size-14 shrink-0 items-center justify-center rounded-2xl ring-2 ${
                    unlocked ? `bg-gradient-to-br ${tier.bg} ${tier.ring}` : 'bg-forest-900/5 text-forest-400 ring-transparent'
                  }`}
                >
                  <Icon className="size-6" />
                  {!unlocked && <Lock className="absolute -right-1 -bottom-1 size-5 rounded-full bg-cream-50 p-1 text-forest-500" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold">{a.def.title}</h3>
                    <span className="text-[11px] font-semibold tracking-wider text-forest-500 uppercase">{tier.label}</span>
                  </div>
                  <p className="text-sm text-forest-700/80">{a.def.description}</p>
                </div>
              </div>
              {unlocked ? (
                <p className="mt-4 text-sm font-medium text-moss-700">Unlocked {formatDate(a.unlockedAt!)}</p>
              ) : (
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-xs text-forest-600">
                    <span>Progress</span>
                    <span>
                      {formatNumber(Math.min(a.value, a.def.goal), 1)} / {formatNumber(a.def.goal)} {a.def.unit}
                    </span>
                  </div>
                  <ProgressBar value={a.progress} className="h-1.5" />
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
