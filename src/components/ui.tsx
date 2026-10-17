import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import type { CollectionStatus, User } from '../types'

export function Avatar({ user, size = 'md' }: { user: Pick<User, 'name' | 'avatarColor'>; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
  const sizes = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg', xl: 'size-24 text-3xl' }
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-cream-50 ring-2 ring-cream-50 ${sizes[size]}`}
      style={{ background: `linear-gradient(135deg, ${user.avatarColor}, color-mix(in oklab, ${user.avatarColor} 60%, #152b1f))` }}
      aria-hidden
    >
      {initials}
    </span>
  )
}

const STATUS: Record<CollectionStatus, { label: string; cls: string; Icon: LucideIcon }> = {
  pending: { label: 'Pending', cls: 'bg-sun-100 text-sun-700', Icon: Clock },
  approved: { label: 'Approved', cls: 'bg-moss-100 text-moss-700', Icon: CheckCircle2 },
  rejected: { label: 'Rejected', cls: 'bg-clay-100 text-clay-700', Icon: XCircle },
}

export function StatusPill({ status }: { status: CollectionStatus }) {
  const s = STATUS[status]
  return (
    <span className={`chip ${s.cls}`}>
      <s.Icon className="size-3.5" />
      {s.label}
    </span>
  )
}

export function ProgressBar({ value, className = '', tone = 'moss' }: { value: number; className?: string; tone?: 'moss' | 'sun' | 'cream' }) {
  const fills = {
    moss: 'bg-gradient-to-r from-moss-400 to-forest-500',
    sun: 'bg-gradient-to-r from-sun-300 to-sun-500',
    cream: 'bg-gradient-to-r from-sun-200 to-moss-300',
  }
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div className={`h-2.5 overflow-hidden rounded-full bg-forest-900/8 ${className}`} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full origin-left animate-grow rounded-full ${fills[tone]}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl animate-rise">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-4xl font-semibold text-forest-900 md:text-5xl">{title}</h1>
        {description && <p className="mt-3 text-lg text-forest-700/80">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  )
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = 'forest',
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  sub?: ReactNode
  accent?: 'forest' | 'moss' | 'sun' | 'clay'
}) {
  const accents = {
    forest: 'bg-forest-100 text-forest-700',
    moss: 'bg-moss-100 text-moss-700',
    sun: 'bg-sun-100 text-sun-700',
    clay: 'bg-clay-100 text-clay-600',
  }
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <span className={`inline-flex size-10 items-center justify-center rounded-2xl ${accents[accent]}`}>
          <Icon className="size-5" />
        </span>
        <span className="text-sm font-medium text-forest-700/80">{label}</span>
      </div>
      <p className="mt-4 font-display text-3xl font-semibold text-forest-900">{value}</p>
      {sub && <p className="mt-1 text-sm text-forest-600/80">{sub}</p>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-forest-900/15 px-6 py-12 text-center">
      <span className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-moss-100 text-moss-600">
        <Icon className="size-6" />
      </span>
      <p className="font-display text-xl font-semibold">{title}</p>
      {children && <div className="mt-2 max-w-sm text-forest-700/75">{children}</div>}
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
}: {
  value: T
  onChange: (v: T) => void
  options: { id: T; label: string }[]
  size?: 'sm' | 'md'
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full border border-forest-900/10 bg-white/60 p-1" role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={`cursor-pointer rounded-full font-medium transition ${size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm'} ${
            value === o.id ? 'bg-forest-800 text-cream-50 shadow' : 'text-forest-700 hover:bg-forest-900/5'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function RankBadge({ rank }: { rank: number }) {
  const medal =
    rank === 1
      ? 'bg-gradient-to-br from-sun-200 to-sun-400 text-sun-700 ring-sun-300'
      : rank === 2
        ? 'bg-gradient-to-br from-cream-100 to-[#cfd6d2] text-forest-700 ring-[#c2cbc6]'
        : rank === 3
          ? 'bg-gradient-to-br from-clay-100 to-clay-300 text-clay-700 ring-clay-200'
          : 'bg-forest-900/5 text-forest-700 ring-transparent'
  return <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold ring-1 ${medal}`}>{rank}</span>
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1.5 text-sm text-clay-600">{message}</p>
}
