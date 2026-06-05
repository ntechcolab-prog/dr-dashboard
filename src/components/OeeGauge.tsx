// Concentric OEE gauge — three rings (Availability / Performance / Quality),
// each a partial arc starting at 12 o'clock.
interface OeeGaugeProps {
  availability: number
  performance: number
  quality: number
}

const RINGS = [
  { key: 'availability', color: '#6c3fb5', r: 80 },
  { key: 'performance', color: '#f19909', r: 60 },
  { key: 'quality', color: '#2f9be0', r: 40 },
] as const

export default function OeeGauge({ availability, performance, quality }: OeeGaugeProps) {
  const values: Record<string, number> = { availability, performance, quality }
  const stroke = 12
  const oee = Math.round((availability * performance * quality) / 10000)

  return (
    <svg viewBox="0 0 200 200" className="mx-auto block" style={{ width: 200, height: 200 }}>
      <g transform="rotate(-90 100 100)">
        {RINGS.map(({ key, color, r }) => {
          const c = 2 * Math.PI * r
          const pct = Math.max(0, Math.min(100, values[key])) / 100
          return (
            <g key={key}>
              <circle cx="100" cy="100" r={r} fill="none" stroke="var(--color-page)" strokeWidth={stroke} />
              <circle
                cx="100"
                cy="100"
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${c * pct} ${c}`}
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
              />
            </g>
          )
        })}
      </g>
      <text x="100" y="98" textAnchor="middle" className="fill-ink" style={{ fontSize: 30, fontWeight: 700 }}>
        {oee}%
      </text>
      <text x="100" y="116" textAnchor="middle" className="fill-muted" style={{ fontSize: 11, letterSpacing: 1 }}>
        OEE
      </text>
    </svg>
  )
}
