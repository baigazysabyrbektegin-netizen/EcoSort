import { useState } from 'react'
import { CalendarDays, Coins, History, MapPin, Pencil, RotateCcw, ScrollText, Users } from 'lucide-react'
import type { CollectionStatus, LocationRef } from '../types'
import { useStore } from '../state/AppStore'
import { useUserSummary } from '../state/selectors'
import { useToast } from '../state/toast'
import { categoryInfo } from '../lib/scoring'
import { formatDate, formatNumber, timeAgo } from '../lib/dates'
import { formatLocation, isValidLocation } from '../data/locations'
import { Avatar, EmptyState, FieldError, PageHeader, ProgressBar, Segmented } from '../components/ui'
import { CollectionRow } from '../components/CollectionRow'
import { CategoryBadge } from '../components/icons'
import { LocationSelect } from '../components/LocationSelect'

type HistoryTab = CollectionStatus | 'all'

export function Profile() {
  const { state, switchUser, reset } = useStore()
  const toast = useToast()
  const s = useUserSummary()
  const [tab, setTab] = useState<HistoryTab>('all')
  const [view, setView] = useState<'history' | 'ledger'>('history')
  const [editing, setEditing] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const history = s.collections.filter((c) => tab === 'all' || c.status === tab)
  const shown = showAll ? history : history.slice(0, 15)

  return (
    <div>
      <PageHeader
        eyebrow="Profile"
        title={s.user.name}
        description={s.user.bio ?? 'Collector of waste, planter of hope.'}
        actions={
          <button className="btn-ghost" onClick={() => setEditing((e) => !e)}>
            <Pencil className="size-4" /> {editing ? 'Close editor' : 'Edit profile'}
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <section className="card p-6 text-center">
            <div className="flex justify-center">
              <Avatar user={s.user} size="xl" />
            </div>
            <p className="mt-4 font-display text-2xl font-semibold">{s.user.name}</p>
            <p className="text-sm text-forest-600/80">{s.user.handle}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
              <span className="chip bg-forest-100 text-forest-700">
                <MapPin className="size-3.5" /> {formatLocation(s.user.home, true)}
              </span>
              <span className="chip bg-forest-100 text-forest-700">
                <CalendarDays className="size-3.5" /> Joined {formatDate(s.user.joinedAt)}
              </span>
            </div>
            <div className="mt-6 text-left">
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="font-semibold">
                  Lv {s.level.level.index} · {s.level.level.name}
                </span>
                <span className="text-forest-600/80">{formatNumber(s.stats.points)} pts</span>
              </div>
              <ProgressBar value={s.level.progress} />
            </div>
            <dl className="mt-6 grid grid-cols-3 gap-2 text-center">
              <Stat label="Verified" value={`${formatNumber(s.stats.kg, 0)} kg`} />
              <Stat label="Approved" value={s.approved.length} />
              <Stat label="Badges" value={s.unlockedCount} />
            </dl>
          </section>

          {editing && <EditProfile onDone={() => setEditing(false)} />}

          <section className="card p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Users className="size-5 text-moss-600" /> Demo: switch collector
            </h2>
            <p className="mt-1 text-sm text-forest-600/80">See the app from another seeded user’s perspective.</p>
            <select className="field mt-4" value={state.currentUserId} onChange={(e) => switchUser(e.target.value)} aria-label="Switch user">
              {[...state.users]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.home.city}
                  </option>
                ))}
            </select>
            <button
              className="btn-ghost mt-4 w-full text-clay-600"
              onClick={() => {
                if (window.confirm('Reset all demo data? Your submissions and reviews will be replaced by the original seed.')) {
                  reset()
                  toast({ tone: 'info', title: 'Demo data reset', description: 'Seeded users, collections and competitions restored.' })
                }
              }}
            >
              <RotateCcw className="size-4" /> Reset demo data
            </button>
          </section>
        </div>

        <section className="card p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { id: 'history', label: 'Collection history' },
                { id: 'ledger', label: 'Points ledger' },
              ]}
            />
            {view === 'history' && (
              <Segmented<HistoryTab>
                size="sm"
                value={tab}
                onChange={(t) => (setTab(t), setShowAll(false))}
                options={[
                  { id: 'all', label: `All ${s.collections.length}` },
                  { id: 'pending', label: `Pending ${s.pending.length}` },
                  { id: 'approved', label: `Approved ${s.approved.length}` },
                  { id: 'rejected', label: `Rejected ${s.rejected.length}` },
                ]}
              />
            )}
          </div>

          {view === 'history' ? (
            history.length ? (
              <>
                <ul className="mt-4 divide-y divide-forest-900/8">
                  {shown.map((c) => (
                    <CollectionRow key={c.id} c={c} />
                  ))}
                </ul>
                {history.length > shown.length && (
                  <button className="btn-ghost mt-4 w-full" onClick={() => setShowAll(true)}>
                    Show all {history.length}
                  </button>
                )}
              </>
            ) : (
              <div className="mt-6">
                <EmptyState icon={History} title="Nothing here yet" />
              </div>
            )
          ) : s.ledger.length ? (
            <div className="mt-4 overflow-x-auto">
              <p className="mb-3 flex items-center gap-2 text-sm text-forest-600/80">
                <ScrollText className="size-4" /> One immutable entry per approved submission. Total: <strong className="text-forest-900">{formatNumber(s.stats.points)} pts</strong>
              </p>
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-xs tracking-wider text-forest-600 uppercase">
                  <tr className="border-b border-forest-900/10">
                    <th className="py-2 font-semibold">Awarded</th>
                    <th className="py-2 font-semibold">Collection</th>
                    <th className="py-2 font-semibold">Location</th>
                    <th className="py-2 text-right font-semibold">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-900/6">
                  {(showAll ? s.ledger : s.ledger.slice(0, 20)).map((e) => (
                    <tr key={e.id}>
                      <td className="py-2.5 whitespace-nowrap text-forest-600">{timeAgo(e.awardedAt)}</td>
                      <td className="py-2.5">
                        <span className="flex items-center gap-2">
                          <CategoryBadge category={e.category} size="sm" />
                          {formatNumber(e.kg, 1)} kg {categoryInfo(e.category).label.toLowerCase()}
                        </span>
                      </td>
                      <td className="py-2.5 text-forest-700/80">{formatLocation(e.location, true)}</td>
                      <td className="py-2.5 text-right font-semibold text-moss-700">
                        <span className="inline-flex items-center gap-1">
                          <Coins className="size-3.5" />+{formatNumber(e.points)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!showAll && s.ledger.length > 20 && (
                <button className="btn-ghost mt-4 w-full" onClick={() => setShowAll(true)}>
                  Show all {s.ledger.length} entries
                </button>
              )}
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState icon={Coins} title="No points yet">
                Points appear here once a moderator approves one of your submissions.
              </EmptyState>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-forest-900/4 py-3">
      <dd className="font-display text-xl font-semibold">{value}</dd>
      <dt className="text-xs text-forest-600/80">{label}</dt>
    </div>
  )
}

function EditProfile({ onDone }: { onDone: () => void }) {
  const { currentUser, updateProfile } = useStore()
  const toast = useToast()
  const [name, setName] = useState(currentUser.name)
  const [bio, setBio] = useState(currentUser.bio ?? '')
  const [home, setHome] = useState<LocationRef>(currentUser.home)
  const [error, setError] = useState<string>()

  return (
    <form
      className="card animate-rise space-y-4 p-6"
      onSubmit={(e) => {
        e.preventDefault()
        if (!isValidLocation(home)) return setError('Choose a valid home location.')
        if (bio.length > 160) return setError('Bio is limited to 160 characters.')
        const r = updateProfile({ name, bio, home })
        if (!r.ok) return setError(r.error)
        toast({ tone: 'success', title: 'Profile updated' })
        onDone()
      }}
    >
      <h2 className="text-xl font-semibold">Edit profile</h2>
      <div>
        <label className="label" htmlFor="pf-name">
          Name
        </label>
        <input id="pf-name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      </div>
      <div>
        <label className="label" htmlFor="pf-bio">
          Bio
        </label>
        <textarea id="pf-bio" className="field resize-none" rows={2} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} />
      </div>
      <div>
        <p className="label">Home location (used for competitions)</p>
        <LocationSelect value={home} onChange={setHome} idPrefix="pf" stacked />
      </div>
      <FieldError message={error} />
      <button type="submit" className="btn-primary w-full">
        Save changes
      </button>
    </form>
  )
}
