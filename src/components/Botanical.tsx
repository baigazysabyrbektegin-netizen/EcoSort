/** Decorative botanical illustrations. All purely visual (aria-hidden). */

export function LeafSprig({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 160" className={className} aria-hidden fill="none">
      <path d="M60 158C60 110 58 60 66 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity=".7" />
      {[
        [62, 130, -1],
        [61, 104, 1],
        [62, 80, -1],
        [63, 56, 1],
        [65, 34, -1],
      ].map(([x, y, dir], i) => (
        <path
          key={i}
          d={`M${x} ${y} C ${x + dir * 18} ${y - 26}, ${x + dir * 44} ${y - 22}, ${x + dir * 50} ${y - 8} C ${x + dir * 36} ${y + 4}, ${x + dir * 14} ${y + 2}, ${x} ${y} Z`}
          fill="currentColor"
          opacity={0.35 + i * 0.1}
        />
      ))}
      <path d="M66 6c8 6 10 16 4 24-8-4-9-16-4-24Z" fill="currentColor" opacity=".9" />
    </svg>
  )
}

export function FernCorner({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 220" className={className} aria-hidden fill="none">
      <path d="M10 210C60 160 110 100 200 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".6" />
      {Array.from({ length: 11 }, (_, i) => {
        const t = i / 11
        const x = 10 + t * 190
        const y = 210 - t * 190 + Math.sin(t * 3) * 6
        const len = 46 - i * 3.2
        return (
          <g key={i} opacity={0.25 + t * 0.5}>
            <path d={`M${x} ${y} q ${-len * 0.2} ${-len * 0.9} ${-len * 0.9} ${-len}`} stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            <path d={`M${x} ${y} q ${len * 0.9} ${len * 0.2} ${len} ${len * 0.9}`} stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          </g>
        )
      })}
    </svg>
  )
}

export function MountainRidge({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 160" preserveAspectRatio="none" className={className} aria-hidden>
      <path d="M0 160V96l70-44 60 30 90-70 80 58 60-34 110 78 70-40 90 52 80-60 90 56v74Z" fill="currentColor" opacity=".18" />
      <path d="M0 160v-40l90-30 80 26 100-50 90 44 80-22 110 48 90-30 80 24 80-20v60Z" fill="currentColor" opacity=".28" />
    </svg>
  )
}

export function SunBadge({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <circle cx="50" cy="50" r="20" fill="currentColor" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x="48.5" y="8" width="3" height="14" rx="1.5" fill="currentColor" opacity=".7" transform={`rotate(${i * 30} 50 50)`} />
      ))}
    </svg>
  )
}

/** Mark used in the sidebar: a leaf inside a sun ring. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <circle cx="20" cy="20" r="18" fill="none" stroke="#f0c457" strokeWidth="2" strokeDasharray="3 3.3" />
      <path d="M11 29c0-10 6-17 19-18-1 12-8 18-18 19" fill="#b5cc6c" />
      <path d="m11.5 28.5 12-12" stroke="#152b1f" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
