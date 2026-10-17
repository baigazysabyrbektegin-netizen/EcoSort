import type { LocationRef } from '../types'
import { OBLASTS, getOblast, getRayon } from '../data/locations'

/** Cascading oblast → rayon → city picker. Changing a parent resets children to their first option. */
export function LocationSelect({
  value,
  onChange,
  idPrefix = 'loc',
  stacked = false,
}: {
  value: LocationRef
  onChange: (v: LocationRef) => void
  idPrefix?: string
  stacked?: boolean
}) {
  const oblast = getOblast(value.oblastId) ?? OBLASTS[0]
  const rayon = getRayon(value.rayonId) ?? oblast.rayons[0]

  return (
    <div className={`grid gap-3 ${stacked ? '' : 'sm:grid-cols-3'}`}>
      <div>
        <label className="label" htmlFor={`${idPrefix}-oblast`}>
          Oblast
        </label>
        <select
          id={`${idPrefix}-oblast`}
          className="field"
          value={oblast.id}
          onChange={(e) => {
            const o = getOblast(e.target.value)!
            onChange({ oblastId: o.id, rayonId: o.rayons[0].id, city: o.rayons[0].cities[0] })
          }}
        >
          {OBLASTS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor={`${idPrefix}-rayon`}>
          Rayon
        </label>
        <select
          id={`${idPrefix}-rayon`}
          className="field"
          value={rayon.id}
          onChange={(e) => {
            const r = getRayon(e.target.value)!
            onChange({ oblastId: oblast.id, rayonId: r.id, city: r.cities[0] })
          }}
        >
          {oblast.rayons.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor={`${idPrefix}-city`}>
          City / village
        </label>
        <select id={`${idPrefix}-city`} className="field" value={value.city} onChange={(e) => onChange({ ...value, city: e.target.value })}>
          {rayon.cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
