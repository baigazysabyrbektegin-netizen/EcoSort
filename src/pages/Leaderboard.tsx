import { useMemo, useState } from 'react'
import { Crown, MapPin, Trophy, Users } from 'lucide-react'
import { useStore } from '../state/AppStore'
import { OBLASTS, allCities, rayonName } from '../data/locations'
import { PERIODS, filterLedger, periodRange, rankRegions, rankUsers, scopeLabel, type Period, type Scope } from '../lib/leaderboard'
import { formatNumber } from '../lib/dates'
import { levelFor } from '../lib/scoring'
import { Avatar, EmptyState, PageHeader, RankBadge, Segmented } from '../components/ui'

type ScopeKind = Scope['kind']
type View = 'users' | 'oblast' | 'rayon'

export function Leaderboard() {
  const { state, currentUser } = useStore()
  const [view, setView] = useState<View>('users')
  const [kind, setKind] = useState<ScopeKind>('country')
  const [oblastId, setOblastId] = useState(currentUser.home.oblastId)
  const [rayonId, setRayonId] = useState(currentUser.home.rayonId)
  const [city, setCity] = useState(currentUser.home.city)
  const [period, setPeriod] = useState<Period>('all')

  const scope: Scope =
    kind === 'country' ? { kind } : kind === 'oblast' ? { kind, oblastId } : kind === 'rayon' ? { kind, rayonId } : { kind, city }

  const scopeKey = JSON.stringify(scope)
  const entries = useMemo(() => filterLedger(state.ledger, JSON.parse(scopeKey) as Scope, periodRange(period)), [state.ledger, scopeKey, period])
  const pointsByUser = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of state.ledger) m.set(e.userId, (m.get(e.userId) ?? 0) + e.points)
    return m
  }, [state.ledger])
  const userRows = useMemo(() => rankUsers(entries, state.users), [entries, state.users])
  const regionRows = useMemo(() => (view === 'users' ? [] : rankRegions(entries, view)), [entries, view])
  const me = userRows.find((r) => r.user.id === currentUser.id)

  const rayonOptions = OBLASTS.flatMap((o) => o.rayons.map((r) => ({ id: r.id, label: `${r.name} · ${o.name}` })))
  const periodLabel = PERIODS.find((p) => p.id === period)!.label

  return (
    <div>
      <PageHeader
        eyebrow="Leaderboard"
        title={
          <>
            Who keeps <em className="text-moss-600">{scopeLabel(scope)}</em> taza?
          </>
        }
        description="Rankings use verified points only, attributed to where the waste was collected."
      />

      {/* Filters */}
      <div className="card mb-8 space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="w-20 text-sm font-semibold text-forest-700">Show</span>
          <Segmented<View>
            value={view}
            onChange={setView}
            options={[
              { id: 'users', label: 'Collectors' },
              { id: 'oblast', label: 'Oblasts' },
              { id: 'rayon', label: 'Rayons' },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="w-20 text-sm font-semibold text-forest-700">Area</span>
          <Segmented<ScopeKind>
            value={kind}
            onChange={setKind}
            options={[
              { id: 'country', label: 'Country' },
              { id: 'oblast', label: 'Oblast' },
              { id: 'rayon', label: 'Rayon' },
              { id: 'city', label: 'City' },
            ]}
          />
          {kind === 'oblast' && (
            <select className="field w-auto py-2" value={oblastId} onChange={(e) => setOblastId(e.target.value)} aria-label="Oblast">
              {OBLASTS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          )}
          {kind === 'rayon' && (
            <select className="field w-auto py-2" value={rayonId} onChange={(e) => setRayonId(e.target.value)} aria-label="Rayon">
              {rayonOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          )}
          {kind === 'city' && (
            <select className="field w-auto py-2" value={city} onChange={(e) => setCity(e.target.value)} aria-label="City">
              {allCities().map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="w-20 text-sm font-semibold text-forest-700">Period</span>
          <Segmented<Period> value={period} onChange={setPeriod} options={PERIODS} />
        </div>
      </div>

      {view === 'users' ? (
        userRows.length === 0 ? (
          <EmptyState icon={Trophy} title="No verified collections here yet">
            No approved collections in {scopeLabel(scope)} for “{periodLabel.toLowerCase()}”. Be the first!
          </EmptyState>
        ) : (
          <>
            {me && (
              <div className="mb-6 flex animate-rise flex-wrap items-center gap-4 rounded-3xl bg-forest-900 px-6 py-4 text-cream-50">
                <Avatar user={me.user} />
                <p className="flex-1">
                  You are <strong className="font-display text-2xl text-sun-200">#{me.rank}</strong> of {userRows.length} in {scopeLabel(scope)} · {periodLabel.toLowerCase()}
                </p>
                <p className="font-display text-xl">{formatNumber(me.points)} pts</p>
              </div>
            )}
            <Podium rows={userRows.slice(0, 3)} currentUserId={currentUser.id} />
            <div className="card mt-6 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-forest-900/4 text-xs tracking-wider text-forest-600 uppercase">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Rank</th>
                    <th className="px-5 py-3 font-semibold">Collector</th>
                    <th className="hidden px-5 py-3 font-semibold md:table-cell">Home</th>
                    <th className="hidden px-5 py-3 text-right font-semibold sm:table-cell">Verified</th>
                    <th className="px-5 py-3 text-right font-semibold">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-900/6">
                  {userRows.map((r) => {
                    const mine = r.user.id === currentUser.id
                    return (
                      <tr key={r.user.id} className={mine ? 'bg-moss-100/60' : 'hover:bg-white/60'}>
                        <td className="px-5 py-3">
                          <RankBadge rank={r.rank} />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar user={r.user} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {r.user.name} {mine && <span className="chip ml-1 bg-forest-800 py-0.5 text-cream-50">You</span>}
                              </p>
                              <p className="text-xs text-forest-600/70">
                                {levelFor(pointsByUser.get(r.user.id) ?? 0).level.name} · {r.collections} collections
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-5 py-3 text-sm text-forest-700/80 md:table-cell">
                          {r.user.home.city}, {rayonName(r.user.home.rayonId)}
                        </td>
                        <td className="hidden px-5 py-3 text-right text-sm sm:table-cell">{formatNumber(r.kg, 1)} kg</td>
                        <td className="px-5 py-3 text-right font-display text-lg font-semibold">{formatNumber(r.points)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )
      ) : regionRows.length === 0 ? (
        <EmptyState icon={MapPin} title="No regional data for these filters" />
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-forest-900/6">
            {regionRows.map((r) => {
              const mine = view === 'oblast' ? r.id === currentUser.home.oblastId : r.id === currentUser.home.rayonId
              const max = regionRows[0].points || 1
              return (
                <li key={r.id} className={`flex items-center gap-4 px-5 py-4 ${mine ? 'bg-moss-100/60' : ''}`}>
                  <RankBadge rank={r.rank} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate font-semibold">
                        {r.name} {mine && <span className="chip ml-1 bg-forest-800 py-0.5 text-cream-50">Home</span>}
                      </p>
                      <p className="font-display text-lg font-semibold">{formatNumber(r.points)} pts</p>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-forest-900/6">
                      <div className="h-full origin-left animate-grow rounded-full bg-gradient-to-r from-moss-400 to-forest-500" style={{ width: `${(r.points / max) * 100}%` }} />
                    </div>
                    <p className="mt-1.5 flex flex-wrap gap-x-4 text-xs text-forest-600/80">
                      <span>{r.subtitle}</span>
                      <span>{formatNumber(r.kg, 1)} kg verified</span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3" /> {r.collectors} {r.collectors === 1 ? "collector" : "collectors"}
                      </span>
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

function Podium({ rows, currentUserId }: { rows: ReturnType<typeof rankUsers>; currentUserId: string }) {
  const order = [rows[1], rows[0], rows[2]].filter(Boolean)
  const heights = { 1: 'h-36', 2: 'h-28', 3: 'h-20' } as Record<number, string>
  return (
    <div className="flex items-end justify-center gap-3 sm:gap-6">
      {order.map((r) => (
        <div key={r.user.id} className="flex w-28 animate-rise flex-col items-center text-center sm:w-40">
          {r.rank === 1 && <Crown className="mb-1 size-6 text-sun-500" />}
          <Avatar user={r.user} size={r.rank === 1 ? 'lg' : 'md'} />
          <p className={`mt-2 w-full truncate text-sm font-semibold ${r.user.id === currentUserId ? 'text-moss-700' : ''}`}>{r.user.name}</p>
          <p className="text-xs text-forest-600/80">{formatNumber(r.points)} pts</p>
          <div
            className={`mt-3 flex w-full items-start justify-center rounded-t-2xl pt-3 font-display text-3xl font-semibold ${heights[r.rank] ?? 'h-16'} ${
              r.rank === 1 ? 'bg-gradient-to-b from-sun-300 to-sun-400 text-forest-900' : r.rank === 2 ? 'bg-gradient-to-b from-forest-200 to-forest-300 text-forest-800' : 'bg-gradient-to-b from-clay-200 to-clay-300 text-clay-700'
            }`}
          >
            {r.rank}
          </div>
        </div>
      ))}
    </div>
  )
}
