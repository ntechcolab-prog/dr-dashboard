import { useEffect, useState } from 'react'

// Single-value circular gauge — reused for the Yesterday / Month / Year cards.
// Only value + label change; an optional goal renders a tick on the track and
// tints the arc (teal when on/above target, amber when below).
interface AvailabilityGaugeProps {
  value: number // 0–100
  label?: string
  goal?: number // 0–100, optional target marker
  size?: string // CSS size, e.g. '9rem'
}

export default function AvailabilityGauge({ value, label = 'Availability', goal, size = '9rem' }: AvailabilityGaugeProps) {
  const v = Math.max(0, Math.min(100, value))
  const stroke = 14
  const r = 78
  const c = 2 * Math.PI * r

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const belowGoal = goal != null && v < goal
  const arc = belowGoal ? '#f19909' : '#46aa9f'
  const pct = mounted ? v / 100 : 0

  // goal tick angle on the ring (track starts at 12 o'clock, clockwise)
  const goalAngle = goal != null ? (goal / 100) * 2 * Math.PI - Math.PI / 2 : 0
  const gx = 100 + r * Math.cos(goalAngle)
  const gy = 100 + r * Math.sin(goalAngle)

  return (
    <svg viewBox="0 0 200 200" className="mx-auto block" style={{ width: size, height: size }}>
      <g transform="rotate(-90 100 100)">
        <circle cx="100" cy="100" r={r} fill="none" stroke="var(--color-page)" strokeWidth={stroke} />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke={arc}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </g>
      {goal != null && (
        <circle cx={gx} cy={gy} r={3.5} fill="#fff" stroke="#5c5f62" strokeWidth={2} />
      )}
      <text x="100" y="98" textAnchor="middle" className="fill-ink" style={{ fontSize: 34, fontWeight: 700 }}>
        {Math.round(v)}%
      </text>
      <text x="100" y="118" textAnchor="middle" className="fill-muted" style={{ fontSize: 11, letterSpacing: 1 }}>
        {label.toUpperCase()}
      </text>
    </svg>
  )
}
