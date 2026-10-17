import { useMemo, useState } from 'react'
import { Check, CheckCircle2, Clock, Coins, Inbox, MapPin, Search, ShieldCheck, X, XCircle } from 'lucide-react'
import type { Collection, CollectionStatus } from '../types'
import { useStore } from '../state/AppStore'
import { useToast } from '../state/toast'
import { MAX_KG_PER_SUBMISSION, calculatePoints, categoryInfo, levelFor } from '../lib/scoring'
import { formatDate, formatNumber, timeAgo, todayISO } from '../lib/dates'
import { formatLocation } from '../data/locations'
import { Avatar, EmptyState, FieldError, PageHeader, Segmented, StatCard, StatusPill } from '../components/ui'
import { CATEGORY_ICONS } from '../components/icons'

type Tab = CollectionStatus | 'all'

const REJECT_PRESETS = [
  'Photo does not match the declared category.',
  'Weight looks overstated for the described load.',
  'Duplicate of an earlier submission.',
  'Waste was not sorted as declared.',
]

const PAGE = 24

export function Admin() {
  const { state, usersById } = useStore()
  const [tab, setTab] = useState<Tab>('pending')
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE)

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0 }
    for (const x of state.collections) c[x.status]++
    return c
  }, [state.collections])

  const today = todayISO()
  const reviewedToday = state.collections.filter((c) => c.reviewedAt && c.reviewedAt.slice(0, 10) === today).length
  const totalPoints = state.ledger.reduce((s, e) => s + e.points, 0)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.collections
      .filter((c) => tab === 'all' || c.status === tab)
      .filter((c) => {
        if (!q) return true
        const u = usersById.get(c.userId)
        return u?.name.toLowerCase().includes(q) || c.location.city.toLowerCase().includes(q) || categoryInfo(c.category).label.toLowerCase().includes(q)
      })
      .sort((a, b) =>
        tab === 'pending' ? a.submittedAt.localeCompare(b.submittedAt) : (b.reviewedAt ?? b.submittedAt).localeCompare(a.reviewedAt ?? a.submittedAt),
      )
  }, [state.collections, tab, query, usersById])

  return (
    <div>
      <PageHeader
        eyebrow="Moderation · demo mode"
        title="Admin Panel"
        description="Verify submissions before points are granted. Approving writes exactly one entry to the points ledger; rejected and pending submissions never earn points."
      />

      <section className="stagger mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Clock} label="Pending review" value={counts.pending} accent="sun" sub="oldest first" />
        <StatCard icon={ShieldCheck} label="Reviewed today" value={reviewedToday} accent="moss" />
        <StatCard icon={XCircle} label="Rejected (all time)" value={counts.rejected} accent="clay" />
        <StatCard icon={Coins} label="Points in ledger" value={formatNumber(totalPoints)} sub={`${formatNumber(state.ledger.length)} awards`} />
      </section>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Segmented
          value={tab}
          onChange={(t) => {
            setTab(t)
            setLimit(PAGE)
          }}
          options={[
            { id: 'pending', label: `Pending (${counts.pending})` },
            { id: 'approved', label: `Approved (${counts.approved})` },
            { id: 'rejected', label: `Rejected (${counts.rejected})` },
            { id: 'all', label: 'All' },
          ]}
        />
        <label className="relative md:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-forest-400" />
          <input className="field pl-10" placeholder="Search user, city, category" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search submissions" />
        </label>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Inbox} title={tab === 'pending' ? 'Queue is clear' : 'Nothing here'}>
          {tab === 'pending' ? 'All submissions have been reviewed. New ones appear here as soon as collectors submit them.' : 'No submissions match these filters.'}
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-2">
            {list.slice(0, limit).map((c) => (
              <ReviewCard key={c.id} c={c} />
            ))}
          </div>
          {list.length > limit && (
            <div className="mt-8 text-center">
              <button className="btn-ghost" onClick={() => setLimit((l) => l + PAGE)}>
                Show more ({list.length - limit} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ReviewCard({ c }: { c: Collection }) {
  const { state, usersById, approve, reject } = useStore()
  const toast = useToast()
  const user = usersById.get(c.userId)!
  const info = categoryInfo(c.category)
  const Icon = CATEGORY_ICONS[c.category]

  const [mode, setMode] = useState<'idle' | 'reject'>('idle')
  const [kg, setKg] = useState(String(c.claimedKg))
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string>()

  const kgNum = Number(kg)
  const kgValid = Number.isFinite(kgNum) && kgNum >= 0.1 && kgNum <= MAX_KG_PER_SUBMISSION
  const preview = kgValid ? calculatePoints(c.category, kgNum, !!c.photo) : 0

  function onApprove() {
    if (!kgValid) return setError(`Verified weight must be between 0.1 and ${MAX_KG_PER_SUBMISSION} kg.`)
    const before = state.ledger.filter((e) => e.userId === c.userId).reduce((s, e) => s + e.points, 0)
    const r = approve(c.id, kgNum, kgNum !== c.claimedKg ? note || `Weight adjusted from ${c.claimedKg} kg to ${kgNum} kg.` : note)
    if (!r.ok) return setError(r.error)
    toast({ tone: 'success', title: `Approved · +${formatNumber(r.entry.points)} pts`, description: `${user.name} · ${formatNumber(r.entry.kg, 1)} kg ${info.label.toLowerCase()}` })
    const lvBefore = levelFor(before).level
    const lvAfter = levelFor(before + r.entry.points).level
    if (lvAfter.index > lvBefore.index)
      toast({ tone: 'celebrate', title: `${user.name.split(' ')[0]} levelled up!`, description: `Now level ${lvAfter.index} · ${lvAfter.name}` })
    for (const a of r.unlocked) toast({ tone: 'celebrate', title: `Achievement unlocked: ${a.title}`, description: `${user.name} · ${a.description}` })
  }

  function onReject() {
    const r = reject(c.id, reason)
    if (!r.ok) return setError(r.error)
    toast({ tone: 'info', title: 'Submission rejected', description: `${user.name} was notified: “${reason.trim()}”` })
  }

  return (
    <article className="card flex animate-rise flex-col overflow-hidden sm:flex-row">
      <div className="relative sm:w-48 sm:shrink-0">
        {c.photo ? (
          <img src={c.photo} alt={`${info.label} collection`} className="h-48 w-full object-cover sm:h-full" />
        ) : (
          <div className="flex h-36 w-full flex-col items-center justify-center gap-2 sm:h-full" style={{ background: `linear-gradient(160deg, color-mix(in oklab, ${info.color} 25%, white), color-mix(in oklab, ${info.color} 8%, #fdfbf5))`, color: info.color }}>
            <Icon className="size-10" />
            <span className="text-xs font-medium text-forest-600/70">No photo</span>
          </div>
        )}
        <span className="absolute top-3 left-3">
          <StatusPill status={c.status} />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <Avatar user={user} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{user.name}</p>
            <p className="text-xs text-forest-600/70">Submitted {timeAgo(c.submittedAt)}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl leading-none font-semibold">{formatNumber(c.claimedKg, 1)} kg</p>
            <p className="text-xs text-forest-600/70">claimed · {info.label}</p>
          </div>
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-sm text-forest-700/80">
          <MapPin className="size-3.5" /> {formatLocation(c.location)} · {formatDate(c.date)}
        </p>
        {c.notes && <p className="mt-2 rounded-xl bg-forest-900/4 px-3 py-2 text-sm text-forest-700 italic">“{c.notes}”</p>}

        {c.status === 'pending' ? (
          mode === 'idle' ? (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs" htmlFor={`kg-${c.id}`}>
                    Verified weight (kg)
                  </label>
                  <input
                    id={`kg-${c.id}`}
                    type="number"
                    step="0.1"
                    min="0.1"
                    className={`field py-2 ${kgValid ? '' : 'field-error'}`}
                    value={kg}
                    onChange={(e) => {
                      setKg(e.target.value)
                      setError(undefined)
                    }}
                  />
                </div>
                <div className="rounded-2xl bg-moss-50 px-4 py-2 ring-1 ring-moss-200">
                  <p className="text-xs text-moss-700">Points on approval</p>
                  <p className="font-display text-2xl font-semibold text-forest-800">+{formatNumber(preview)}</p>
                </div>
              </div>
              <input className="field py-2 text-sm" placeholder="Note to collector (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
              <FieldError message={error} />
              <div className="flex gap-2">
                <button className="btn-primary flex-1" onClick={onApprove} disabled={!kgValid}>
                  <Check className="size-4" /> Approve
                </button>
                <button className="btn-ghost flex-1 text-clay-600" onClick={() => (setMode('reject'), setError(undefined))}>
                  <X className="size-4" /> Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-semibold text-clay-700">Reason for rejection</p>
              <div className="flex flex-wrap gap-1.5">
                {REJECT_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => (setReason(p), setError(undefined))}
                    className={`chip cursor-pointer text-left ${reason === p ? 'bg-clay-500 text-white' : 'bg-clay-50 text-clay-700 hover:bg-clay-100'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <textarea
                className={`field resize-none text-sm ${error ? 'field-error' : ''}`}
                rows={2}
                placeholder="Or write a reason…"
                value={reason}
                maxLength={240}
                onChange={(e) => (setReason(e.target.value), setError(undefined))}
              />
              <FieldError message={error} />
              <div className="flex gap-2">
                <button className="btn-danger flex-1" onClick={onReject} disabled={!reason.trim()}>
                  Confirm rejection
                </button>
                <button className="btn-ghost" onClick={() => (setMode('idle'), setReason(''), setError(undefined))}>
                  Cancel
                </button>
              </div>
            </div>
          )
        ) : (
          <div className={`mt-4 flex items-start gap-3 rounded-2xl p-3 text-sm ${c.status === 'approved' ? 'bg-moss-50 text-moss-700' : 'bg-clay-50 text-clay-700'}`}>
            {c.status === 'approved' ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <XCircle className="mt-0.5 size-4 shrink-0" />}
            <div>
              <p className="font-semibold">
                {c.status === 'approved' ? `Verified ${formatNumber(c.verifiedKg ?? 0, 1)} kg · +${formatNumber(c.pointsAwarded ?? 0)} pts` : 'Rejected · 0 pts'}
              </p>
              {c.reviewNote && <p className="mt-0.5 opacity-80">{c.reviewNote}</p>}
              {c.reviewedAt && <p className="mt-0.5 text-xs opacity-60">Reviewed {timeAgo(c.reviewedAt)}</p>}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
