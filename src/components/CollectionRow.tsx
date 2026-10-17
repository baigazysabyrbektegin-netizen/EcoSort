import { MapPin } from 'lucide-react'
import type { Collection } from '../types'
import { categoryInfo } from '../lib/scoring'
import { formatDate, formatNumber } from '../lib/dates'
import { formatLocation } from '../data/locations'
import { CategoryBadge } from './icons'
import { StatusPill } from './ui'

/** One line in a collection history list. */
export function CollectionRow({ c }: { c: Collection }) {
  const info = categoryInfo(c.category)
  const adjusted = c.status === 'approved' && c.verifiedKg !== undefined && c.verifiedKg !== c.claimedKg
  return (
    <li className="flex items-center gap-4 py-3.5">
      {c.photo ? (
        <img src={c.photo} alt="" className="size-11 shrink-0 rounded-2xl object-cover ring-1 ring-forest-900/10" />
      ) : (
        <CategoryBadge category={c.category} />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-medium">{info.label}</p>
          <span className="text-sm text-forest-600/80">
            {adjusted ? (
              <>
                <s className="opacity-60">{formatNumber(c.claimedKg, 1)}</s> {formatNumber(c.verifiedKg!, 1)} kg
              </>
            ) : (
              `${formatNumber(c.verifiedKg ?? c.claimedKg, 1)} kg`
            )}
          </span>
        </div>
        <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-forest-600/70">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">
            {formatLocation(c.location, true)} · {formatDate(c.date)}
          </span>
        </p>
        {c.status === 'rejected' && c.reviewNote && <p className="mt-1 text-sm text-clay-600">“{c.reviewNote}”</p>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <StatusPill status={c.status} />
        <span className={`text-sm font-semibold ${c.status === 'approved' ? 'text-moss-700' : 'text-forest-400'}`}>
          {c.status === 'approved' ? `+${formatNumber(c.pointsAwarded ?? 0)} pts` : c.status === 'pending' ? 'awaiting review' : '0 pts'}
        </span>
      </div>
    </li>
  )
}
