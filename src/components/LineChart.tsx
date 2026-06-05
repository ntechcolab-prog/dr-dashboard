// Straight-line chart (no smoothing — discrete production data) rendered as SVG.
interface LineChartProps {
  data: number[]
  labels: string[]
  unit?: string
  xLabel?: string
  color?: string
  yMax?: number
  height?: number
  maxLabels?: number
}

export default function LineChart({
  data,
  labels,
  unit,
  xLabel,
  color = 'var(--color-primary)',
  yMax,
  height = 230,
  maxLabels = 12,
}: LineChartProps) {
  const labelStep = Math.max(1, Math.ceil(labels.length / maxLabels))
  const max = yMax ?? niceMax(Math.max(...data, 1))
  const padL = 38
  const padR = 12
  const padT = 16
  const padB = 28
  const W = 360
  const H = height
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const x = (i: number) => padL + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW)
  const y = (v: number) => padT + plotH - (v / max) * plotH

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t))
  const points = data.map((v, i) => `${x(i)},${y(v)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      {/* y unit */}
      {unit && (
        <text x={padL - 30} y={padT - 4} className="fill-faint" style={{ fontSize: 9 }}>
          {unit}
        </text>
      )}

      {/* gridlines + y labels */}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth={1} />
          <text x={padL - 6} y={y(t) + 3} textAnchor="end" className="fill-faint" style={{ fontSize: 9 }}>
            {t}
          </text>
        </g>
      ))}

      {/* line */}
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />

      {/* points */}
      {data.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={3.2} fill={color} />
      ))}

      {/* x labels (thinned to avoid crowding) */}
      {labels.map((lab, i) =>
        i % labelStep === 0 || i === labels.length - 1 ? (
          <text key={i} x={x(i)} y={H - 12} textAnchor="middle" className="fill-muted" style={{ fontSize: 9 }}>
            {lab}
          </text>
        ) : null
      )}
      {xLabel && (
        <text x={padL + plotW / 2} y={H - 1} textAnchor="middle" className="fill-faint" style={{ fontSize: 9 }}>
          {xLabel}
        </text>
      )}
    </svg>
  )
}

function niceMax(v: number): number {
  const mag = 10 ** Math.floor(Math.log10(v))
  const n = v / mag
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return step * mag
}
