import { useState, type ReactNode } from 'react'
import { Award, LayoutDashboard, Menu, PackagePlus, ShieldCheck, Trophy, UserRound, Flag, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { navigate, type Route } from '../state/router'
import { useStore } from '../state/AppStore'
import { useUserSummary } from '../state/selectors'
import { formatNumber } from '../lib/dates'
import { Avatar, ProgressBar } from './ui'
import { FernCorner, Logo } from './Botanical'

const NAV: { route: Route; label: string; icon: LucideIcon }[] = [
  { route: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { route: 'collect', label: 'Collect Waste', icon: PackagePlus },
  { route: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { route: 'competitions', label: 'Competitions', icon: Flag },
  { route: 'achievements', label: 'Achievements', icon: Award },
  { route: 'profile', label: 'Profile', icon: UserRound },
]

function NavLinks({ route, pendingCount, onPick }: { route: Route; pendingCount: number; onPick?: () => void }) {
  const item = (r: Route, label: string, Icon: LucideIcon, badge?: number) => (
    <a
      key={r}
      href={`#/${r}`}
      onClick={onPick}
      aria-current={route === r ? 'page' : undefined}
      className={`group flex items-center gap-3 rounded-2xl px-4 py-2.5 text-[15px] font-medium transition ${
        route === r ? 'bg-cream-50 text-forest-900 shadow-lg shadow-black/10' : 'text-cream-100/80 hover:bg-white/8 hover:text-cream-50'
      }`}
    >
      <Icon className={`size-[18px] ${route === r ? 'text-moss-600' : 'text-moss-300/80 group-hover:text-moss-200'}`} />
      <span className="flex-1">{label}</span>
      {!!badge && <span className="rounded-full bg-sun-300 px-2 py-0.5 text-xs font-bold text-forest-900">{badge}</span>}
    </a>
  )
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((n) => item(n.route, n.label, n.icon))}
      <p className="mt-6 mb-2 px-4 text-[11px] font-semibold tracking-[0.2em] text-moss-300/60 uppercase">Moderation</p>
      {item('admin', 'Admin Panel', ShieldCheck, pendingCount)}
    </nav>
  )
}

function UserCard({ onPick }: { onPick?: () => void }) {
  const { user, level, stats } = useUserSummary()
  return (
    <a href="#/profile" onClick={onPick} className="block rounded-3xl bg-white/6 p-4 ring-1 ring-white/10 transition hover:bg-white/10">
      <div className="flex items-center gap-3">
        <Avatar user={user} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-cream-50">{user.name}</p>
          <p className="text-xs text-moss-200/80">
            Lv {level.level.index} · {level.level.name}
          </p>
        </div>
      </div>
      <ProgressBar value={level.progress} tone="cream" className="mt-3 bg-white/10" />
      <p className="mt-2 text-xs text-cream-100/60">
        {formatNumber(stats.points)} pts{level.next ? ` · ${formatNumber(level.pointsToNext)} to ${level.next.name}` : ' · max level'}
      </p>
    </a>
  )
}

export function Layout({ route, children }: { route: Route; children: ReactNode }) {
  const { state } = useStore()
  const [open, setOpen] = useState(false)
  const pendingCount = state.collections.filter((c) => c.status === 'pending').length

  const sidebar = (onPick?: () => void) => (
    <div className="relative flex h-full flex-col overflow-hidden bg-forest-900 px-4 py-6 text-cream-50">
      <FernCorner className="pointer-events-none absolute -right-16 -bottom-10 size-72 text-moss-400/15" />
      <button onClick={() => (navigate('dashboard'), onPick?.())} className="mb-8 flex cursor-pointer items-center gap-3 px-3 text-left">
        <Logo className="size-10" />
        <span>
          <span className="block font-display text-2xl leading-none font-semibold">TazaQuest</span>
          <span className="text-xs tracking-wide text-moss-200/70">Taza Kyrgyzstan · таза жер</span>
        </span>
      </button>
      <NavLinks route={route} pendingCount={pendingCount} onPick={onPick} />
      <div className="relative mt-auto pt-6">
        <UserCard onPick={onPick} />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:pl-72">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 lg:block">{sidebar()}</aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-forest-900/10 bg-cream-100/85 px-4 py-3 backdrop-blur lg:hidden">
        <a href="#/dashboard" className="flex items-center gap-2">
          <span className="inline-flex rounded-xl bg-forest-900 p-1">
            <Logo className="size-7" />
          </span>
          <span className="font-display text-xl font-semibold">TazaQuest</span>
        </a>
        <button onClick={() => setOpen(true)} className="btn-ghost px-3 py-2" aria-label="Open menu">
          <Menu className="size-5" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-forest-950/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-rise">
            {sidebar(() => setOpen(false))}
            <button onClick={() => setOpen(false)} className="absolute top-5 right-3 rounded-full p-2 text-cream-100 hover:bg-white/10" aria-label="Close menu">
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl overflow-x-clip px-4 py-8 sm:px-6 lg:px-10 lg:py-12">{children}</main>
    </div>
  )
}
