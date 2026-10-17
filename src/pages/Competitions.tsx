import { useMemo, useState } from 'react'
import { CalendarDays, Crown, Flag, Gift, MapPin, Sparkles, Timer, Users } from 'lucide-react'
import type { Competition, WasteCategory } from '../types'
import { useStore } from '../state/AppStore'
import { competitionProgress, competitionRankings, competitionStatus, topCompetitors, userRegionId, type CompetitionStatus } from '../lib/competitions'
import { categoryInfo } from '../lib/scoring'
import { daysBetween, formatDate, formatNumber, todayISO } from '../lib/dates'
import { oblastName } from '../data/locations'
import { Avatar, PageHeader, ProgressBar, RankBadge, Segmented } from '../components/ui'
import { CATEGORY_ICONS } from '../components/icons'
import { FernCorner } from '../components/Botanical'

type Filter = CompetitionStatus | 'all'

const STATUS_STYLE: Record<CompetitionStatus, string> = {
  active: 'bg-moss-100 text-moss-700',
  upcoming: 'bg-sun-100 text-sun-700',
  completed: 'bg-forest-100 text-forest-700',
}

const STATUS_ORDER: Record<CompetitionStatus, number> = { active: 0, upcoming: 1, completed: 2 }

export function Competitions() {
  const { state } = useStore()
  const [filter, setFilter] = useState<Filter>('all')
  const sorted = useMemo(
    () =>
      [...state.competitions].sort(
        (a, b) => STATUS_ORDER[competitionStatus(a)] - STATUS_ORDER[competitionStatus(b)] || b.endDate.localeCompare(a.endDate),
      ),
    [state.competitions],
  )
  const visible = sorted.filter((c) => filter === 'all' || competitionStatus(c) === filter)
  const [selectedId, setSelectedId] = useState(sorted[0]?.id)
  const selected = visible.find((c) => c.id === selectedId) ?? visible[0]

  return (
    <div>
      <PageHeader
        eyebrow="Annual competitions"
        title="Rayon & oblast contests"
        description="Your verified points also count for your region. Each contest has its own scoring — multipliers boost the waste streams that matter most for that campaign."
      />

      <div className="mb-6">
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'completed', label: 'Completed' },
          ]}
        />
      </div>

      <div className="stagger grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((c) => (
          <CompetitionCard key={c.id} c={c} active={selected?.id === c.id} onSelect={() => setSelectedId(c.id)} />
        ))}
      </div>

      {selected && <CompetitionDetail key={selected.id} c={selected} />}
    </div>
  )
}

function CompetitionCard({ c, active, onSelect }: { c: Competition; active: boolean; onSelect: () => void }) {
  const { state } = useStore()
  const status = competitionStatus(c)
  const leader = competitionRankings(c, state.ledger)[0]
  const prog = competitionProgress(c)
  return (
    <button
      onClick={onSelect}
      aria-pressed={active}
      className={`card cursor-pointer p-5 text-left transition hover:-translate-y-0.5 ${active ? 'ring-2 ring-forest-700' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className={`chip capitalize ${STATUS_STYLE[status]}`}>{status}</span>
        <span className="text-xs font-medium text-forest-600/80 capitalize">
          {c.level} level · {c.oblastId ? oblastName(c.oblastId) : 'Nationwide'}
        </span>
      </div>
      <h3 className="mt-3 text-xl font-semibold">{c.name}</h3>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-forest-600/80">
        <CalendarDays className="size-3.5" /> {formatDate(c.startDate)} – {formatDate(c.endDate)}
      </p>
      {status === 'active' && <ProgressBar value={prog.ratio} className="mt-4 h-1.5" tone="sun" />}
      <p className="mt-3 text-sm">
        {status === 'upcoming' ? (
          <span className="text-forest-600/80">Starts in {daysBetween(todayISO(), c.startDate)} days</span>
        ) : leader?.points ? (
          <span className="inline-flex items-center gap-1.5">
            <Crown className="size-4 text-sun-500" />
            {status === 'completed' ? 'Winner' : 'Leading'}: <strong>{leader.name}</strong>
          </span>
        ) : (
          <span className="text-forest-600/80">No scores yet</span>
        )}
      </p>
    </button>
  )
}

function CompetitionDetail({ c }: { c: Competition }) {
  const { state, currentUser } = useStore()
  const status = competitionStatus(c)
  const rows = useMemo(() => competitionRankings(c, state.ledger), [c, state.ledger])
  const competitors = useMemo(() => topCompetitors(c, state.ledger, state.users), [c, state.ledger, state.users])
  const myRegionId = userRegionId(c, currentUser)
  const myRow = rows.find((r) => r.id === myRegionId)
  const prog = competitionProgress(c)
  const max = rows[0]?.points || 1
  const multipliers = Object.entries(c.multipliers) as [WasteCategory, number][]

  return (
    <section className="mt-10 animate-rise">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-forest-800 to-forest-950 p-6 text-cream-50 sm:p-10">
        <FernCorner className="pointer-events-none absolute -top-6 -right-6 size-64 rotate-90 text-moss-300/20" />
        <div className="relative grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <span className={`chip capitalize ${STATUS_STYLE[status]}`}>{status}</span>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{c.name}</h2>
            <p className="mt-3 max-w-2xl text-cream-100/75">{c.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {multipliers.map(([cat, m]) => {
                const Icon = CATEGORY_ICONS[cat]
                return (
                  <span key={cat} className="chip bg-white/10 py-1.5 text-cream-50">
                    <Icon className="size-3.5 text-sun-200" /> {categoryInfo(cat).label} ×{m}
                  </span>
                )
              })}
              <span className="chip bg-white/5 py-1.5 text-cream-100/70">Other categories ×1</span>
            </div>
          </div>
          <dl className="space-y-4 rounded-3xl bg-white/6 p-5 ring-1 ring-white/10">
            <Info icon={CalendarDays} label="Dates" value={`${formatDate(c.startDate)} – ${formatDate(c.endDate)}`} />
            <Info icon={MapPin} label="Competing" value={`${c.level === 'oblast' ? 'Oblasts' : 'Rayons'} · ${c.oblastId ? oblastName(c.oblastId) : 'all of Kyrgyzstan'}`} />
            <Info icon={Gift} label="Prize" value={c.prize} />
            {status === 'active' && (
              <div>
                <Info icon={Timer} label="Time elapsed" value={`Day ${prog.elapsed} of ${prog.total} · ${prog.total - prog.elapsed} days left`} />
                <ProgressBar value={prog.ratio} tone="sun" className="mt-2 bg-white/10" />
              </div>
            )}
          </dl>
        </div>
      </div>

      {status === 'completed' && rows[0]?.points > 0 && (
        <div className="mt-6 flex items-center gap-4 rounded-3xl bg-gradient-to-r from-sun-200 to-sun-100 p-5">
          <Crown className="size-8 text-sun-600" />
          <p className="text-lg">
            <strong className="font-display text-2xl">{rows[0].name}</strong> won with {formatNumber(rows[0].points)} competition points.
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-2xl font-semibold">{c.level === 'oblast' ? 'Oblast' : 'Rayon'} standings</h3>
            {myRow ? (
              <span className="chip bg-moss-100 text-moss-700">
                Your {c.level}: #{myRow.rank} {myRow.name}
              </span>
            ) : (
              <span className="chip bg-forest-900/5 text-forest-600">Your home region is not part of this contest</span>
            )}
          </div>
          {status === 'upcoming' ? (
            <p className="mt-6 flex items-center gap-2 text-forest-600/80">
              <Sparkles className="size-4 text-sun-500" /> Rankings open on {formatDate(c.startDate)}. Collections dated from that day will count.
            </p>
          ) : (
            <ol className="mt-5 space-y-3">
              {rows.slice(0, 12).map((r) => (
                <li key={r.id} className={`flex items-center gap-4 rounded-2xl p-2 ${r.id === myRegionId ? 'bg-moss-100/70 ring-1 ring-moss-200' : ''}`}>
                  <RankBadge rank={r.rank} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-semibold">
                        {r.name} <span className="text-xs font-normal text-forest-600/70">{r.subtitle}</span>
                      </p>
                      <p className="font-display font-semibold whitespace-nowrap">{formatNumber(r.points)}</p>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-forest-900/6">
                      <div className="h-full origin-left animate-grow rounded-full bg-gradient-to-r from-sun-300 to-moss-400" style={{ width: `${(r.points / max) * 100}%` }} />
                    </div>
                    <p className="mt-1 flex gap-3 text-xs text-forest-600/70">
                      <span>{formatNumber(r.kg, 1)} kg</span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3" />
                        {r.collectors}
                      </span>
                    </p>
                  </div>
                </li>
              ))}
              {rows.length > 12 && myRow && myRow.rank > 12 && <li className="px-2 text-sm text-forest-600">… your {c.level} {myRow.name} is #{myRow.rank}</li>}
            </ol>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-2xl font-semibold">Top contributors</h3>
          <p className="mt-1 text-sm text-forest-600/80">Competition score = points × multiplier</p>
          {competitors.length ? (
            <ol className="mt-5 space-y-3">
              {competitors.map((p, i) => (
                <li key={p.user.id} className={`flex items-center gap-3 rounded-2xl p-1.5 ${p.user.id === currentUser.id ? 'bg-moss-100/70' : ''}`}>
                  <RankBadge rank={i + 1} />
                  <Avatar user={p.user} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.user.name}</p>
                    <p className="text-xs text-forest-600/70">{formatNumber(p.kg, 1)} kg</p>
                  </div>
                  <span className="font-display font-semibold">{formatNumber(p.score)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-6 flex items-center gap-2 text-sm text-forest-600/80">
              <Flag className="size-4" /> No contributions yet.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function Info({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-sun-200" />
      <div>
        <dt className="text-xs tracking-wider text-cream-100/60 uppercase">{label}</dt>
        <dd className="text-sm font-medium">{value}</dd>
      </div>
    </div>
  )
}
