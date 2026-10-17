import { useMemo } from 'react'
import { ArrowRight, Clock, Coins, Flag, Hourglass, Medal, PackagePlus, Scale, Sparkles, Trophy } from 'lucide-react'
import { useStore } from '../state/AppStore'
import { useUserSummary } from '../state/selectors'
import { formatNumber } from '../lib/dates'
import { filterLedger, periodRange, rankUsers } from '../lib/leaderboard'
import { competitionRankings, competitionStatus, userRegionId } from '../lib/competitions'
import { rayonName } from '../data/locations'
import { Avatar, EmptyState, ProgressBar, RankBadge, StatCard } from '../components/ui'
import { CategoryBreakdown, LevelRing, WeeklyActivity } from '../components/charts'
import { CollectionRow } from '../components/CollectionRow'
import { ACHIEVEMENT_ICONS } from '../components/icons'
import { LeafSprig, MountainRidge } from '../components/Botanical'

export function Dashboard() {
  const { state } = useStore()
  const s = useUserSummary()
  const firstName = s.user.name.split(' ')[0]
  const pendingKg = s.pending.reduce((sum, c) => sum + c.claimedKg, 0)

  const monthTop = useMemo(() => rankUsers(filterLedger(state.ledger, { kind: 'country' }, periodRange('month')), state.users), [state])
  const myMonth = monthTop.find((r) => r.user.id === s.user.id)

  const activeComps = state.competitions.filter((c) => competitionStatus(c) === 'active')
  const nextAchievements = s.achievements
    .filter((a) => !a.unlockedAt)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3)
  const latestUnlocked = s.achievements
    .filter((a) => a.unlockedAt)
    .sort((a, b) => b.unlockedAt!.localeCompare(a.unlockedAt!))
    .slice(0, 3)

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative animate-rise overflow-hidden rounded-[2rem] bg-gradient-to-br from-forest-800 via-forest-900 to-forest-950 p-6 text-cream-50 shadow-xl shadow-forest-900/25 sm:p-10">
        <MountainRidge className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full text-moss-300" />
        <LeafSprig className="pointer-events-none absolute -top-4 right-6 hidden h-52 origin-bottom animate-sway text-moss-300/40 md:block" />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-center">
          <LevelRing progress={s.level.progress} label={String(s.level.level.index)} />
          <div className="flex-1">
            <p className="text-sm font-semibold tracking-[0.2em] text-sun-200 uppercase">Salam, {firstName}</p>
            <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">
              You are a <em className="text-moss-200">{s.level.level.name}</em>
            </h1>
            <p className="mt-3 max-w-xl text-cream-100/75">
              {s.level.next
                ? `${formatNumber(s.level.pointsToNext)} more points to grow into ${s.level.next.name}. Every verified kilo keeps the valleys taza.`
                : 'You reached the highest level. The mountains thank you.'}
            </p>
            <div className="mt-4 max-w-md">
              <ProgressBar value={s.level.progress} tone="cream" className="bg-white/10" />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#/collect" className="btn-sun">
                <PackagePlus className="size-4" /> Log a collection
              </a>
              <a href="#/leaderboard" className="btn border border-white/20 text-cream-50 hover:bg-white/10">
                View leaderboard <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Coins} label="Total points" value={formatNumber(s.stats.points)} sub={`${s.stats.count} verified collections`} accent="sun" />
        <StatCard icon={Scale} label="Verified waste" value={`${formatNumber(s.stats.kg, 1)} kg`} sub={`${s.stats.categories.size} categories sorted`} accent="moss" />
        <StatCard
          icon={Trophy}
          label="National rank"
          value={s.national.rank ? `#${s.national.rank}` : '—'}
          sub={s.rayon.rank ? `#${s.rayon.rank} in ${rayonName(s.user.home.rayonId)} rayon` : `of ${s.national.total} collectors`}
        />
        <StatCard
          icon={Hourglass}
          label="Awaiting review"
          value={s.pending.length}
          sub={s.pending.length ? `${formatNumber(pendingKg, 1)} kg · no points until approved` : 'Nothing pending'}
          accent="clay"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="card p-6 lg:col-span-3">
          <h2 className="text-2xl font-semibold">Your growth</h2>
          <div className="mt-4">
            <WeeklyActivity entries={s.ledger} />
          </div>
        </div>
        <div className="card p-6 lg:col-span-2">
          <h2 className="mb-5 text-2xl font-semibold">What you sort</h2>
          <CategoryBreakdown kgByCategory={s.stats.kgByCategory} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="card p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Recent collections</h2>
            <a href="#/profile" className="text-sm font-semibold text-moss-700 hover:underline">
              Full history
            </a>
          </div>
          {s.collections.length ? (
            <ul className="mt-2 divide-y divide-forest-900/8">
              {s.collections.slice(0, 6).map((c) => (
                <CollectionRow key={c.id} c={c} />
              ))}
            </ul>
          ) : (
            <div className="mt-4">
              <EmptyState icon={PackagePlus} title="No collections yet">
                Log your first bag of sorted waste to start earning points.
              </EmptyState>
            </div>
          )}
        </div>

        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">This month</h2>
            <span className="chip bg-forest-100 text-forest-700">Kyrgyzstan</span>
          </div>
          <ol className="mt-4 space-y-2">
            {monthTop.slice(0, 5).map((r) => (
              <li key={r.user.id} className={`flex items-center gap-3 rounded-2xl p-2 ${r.user.id === s.user.id ? 'bg-moss-100/70' : ''}`}>
                <RankBadge rank={r.rank} />
                <Avatar user={r.user} size="sm" />
                <span className="flex-1 truncate font-medium">{r.user.name}</span>
                <span className="text-sm font-semibold">{formatNumber(r.points)}</span>
              </li>
            ))}
          </ol>
          {myMonth && myMonth.rank > 5 && (
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-dashed border-moss-300 bg-moss-50 p-2">
              <RankBadge rank={myMonth.rank} />
              <Avatar user={s.user} size="sm" />
              <span className="flex-1 truncate font-medium">You</span>
              <span className="text-sm font-semibold">{formatNumber(myMonth.points)}</span>
            </div>
          )}
          {!myMonth && <p className="mt-3 text-sm text-forest-600/80">You have no verified points this month yet.</p>}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Active competitions</h2>
            <a href="#/competitions" className="text-sm font-semibold text-moss-700 hover:underline">
              All
            </a>
          </div>
          <ul className="mt-4 space-y-3">
            {activeComps.map((c) => {
              const rows = competitionRankings(c, state.ledger)
              const myRegion = userRegionId(c, s.user)
              const mine = rows.find((r) => r.id === myRegion)
              return (
                <li key={c.id}>
                  <a href="#/competitions" className="flex items-center gap-4 rounded-2xl bg-white/60 p-4 ring-1 ring-forest-900/8 transition hover:bg-white">
                    <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-sun-100 text-sun-700">
                      <Flag className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{c.name}</p>
                      <p className="text-sm text-forest-600/80">
                        Leader: {rows[0]?.points ? rows[0].name : '—'}
                        {mine ? ` · Your ${c.level}: #${mine.rank}` : ''}
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-forest-400" />
                  </a>
                </li>
              )
            })}
            {!activeComps.length && <p className="text-sm text-forest-600/80">No competitions running right now.</p>}
          </ul>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Achievements</h2>
            <span className="text-sm text-forest-600">
              {s.unlockedCount}/{s.achievements.length} unlocked
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {latestUnlocked.map((a) => {
              const Icon = ACHIEVEMENT_ICONS[a.def.icon]
              return (
                <span key={a.def.id} className="chip bg-sun-100 py-1.5 text-sun-700">
                  <Icon className="size-3.5" /> {a.def.title}
                </span>
              )
            })}
          </div>
          <p className="mt-5 mb-3 flex items-center gap-2 text-sm font-semibold text-forest-700">
            <Sparkles className="size-4 text-sun-500" /> Closest to unlocking
          </p>
          <ul className="space-y-3">
            {nextAchievements.map((a) => {
              const Icon = ACHIEVEMENT_ICONS[a.def.icon]
              return (
                <li key={a.def.id} className="flex items-center gap-3">
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-forest-100 text-forest-600">
                    <Icon className="size-4" />
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{a.def.title}</span>
                      <span className="text-forest-600/80">
                        {formatNumber(a.value, 1)}/{formatNumber(a.def.goal)} {a.def.unit}
                      </span>
                    </div>
                    <ProgressBar value={a.progress} className="mt-1.5 h-1.5" />
                  </div>
                </li>
              )
            })}
            {!nextAchievements.length && (
              <li className="flex items-center gap-2 text-sm text-forest-600">
                <Medal className="size-4" /> Every achievement unlocked!
              </li>
            )}
          </ul>
        </div>
      </section>

      {s.pending.length > 0 && (
        <p className="text-center text-sm text-forest-600/80">
          <Clock className="mr-1.5 inline size-4 align-[-3px]" /> Pending submissions are reviewed in the{' '}
          <a href="#/admin" className="font-semibold text-moss-700 underline-offset-2 hover:underline">
            Admin Panel
          </a>{' '}
          — points arrive only after approval.
        </p>
      )}
    </div>
  )
}
