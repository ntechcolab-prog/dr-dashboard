import { useId, useState, type MouseEvent } from 'react'
import { useElementWidth } from '../lib/useElementWidth'

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
  maxLabels = 8,
}: LineChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const gid = useId().replace(/:/g, '')
  const [hover, setHover] = useState<number | null>(null)

  const W = width || 360
  const padL = 40
  const padR = 16
  const padT = 16
  const padB = 26
  const plotW = Math.max(1, W - padL - padR)
  const plotH = Math.max(1, height - padT - padB)

  const max = yMax ?? niceMax(Math.max(...data, 1))
  const x = (i: number) => padL + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW)
  const y = (v: number) => padT + plotH - (v / max) * plotH

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t))
  const labelStep = Math.max(1, Math.ceil(labels.length / maxLabels))

  const linePath = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ')
  const areaPath =
    `${linePath} L ${x(data.length - 1)} ${padT + plotH} L ${x(0)} ${padT + plotH} Z`

  const showDots = data.length <= 12

  const onMove = (e: MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const i = Math.round(((mx - padL) / plotW) * (data.length - 1))
    setHover(Math.max(0, Math.min(data.length - 1, i)))
  }

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={W} height={height} className="block">
          <defs>
            <linearGradient id={`area-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* unit */}
          {unit && (
            <text x={padL - 32} y={padT - 4} className="fill-faint" style={{ fontSize: 9 }}>
              {unit}
            </text>
          )}

          {/* gridlines + y labels */}
          {ticks.map((t, i) => (
            <g key={i}>
              <line
                x1={padL}
                x2={W - padR}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--color-line)"
                strokeWidth={1}
                strokeDasharray={i === 0 ? undefined : '3 4'}
              />
              <text x={padL - 8} y={y(t) + 3} textAnchor="end" className="fill-faint" style={{ fontSize: 9 }}>
                {t}
              </text>
            </g>
          ))}

          {/* area + line */}
          <path d={areaPath} fill={`url(#area-${gid})`} className="chart-area" />
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={1}
            className="chart-line"
          />

          {/* hover guide */}
          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + plotH} stroke={color} strokeWidth={1} strokeOpacity={0.35} />
          )}

          {/* dots */}
          {data.map((v, i) =>
            showDots || i === hover ? (
              <circle
                key={i}
                cx={x(i)}
                cy={y(v)}
                r={i === hover ? 5 : 3.5}
                fill="#fff"
                stroke={color}
                strokeWidth={2}
              />
            ) : null
          )}

          {/* x labels (thinned) */}
          {labels.map((lab, i) =>
            i % labelStep === 0 || i === labels.length - 1 ? (
              <text key={i} x={x(i)} y={height - 12} textAnchor="middle" className="fill-muted" style={{ fontSize: 9 }}>
                {lab}
              </text>
            ) : null
          )}
          {xLabel && (
            <text x={padL + plotW / 2} y={height - 1} textAnchor="middle" className="fill-faint" style={{ fontSize: 9 }}>
              {xLabel}
            </text>
          )}

          {/* hover capture */}
          <rect
            x={padL}
            y={padT}
            width={plotW}
            height={plotH}
            fill="transparent"
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
          />
        </svg>
      )}

      {/* tooltip */}
      {hover !== null && width > 0 && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-medium text-white shadow-pop"
          style={{ left: x(hover), top: y(data[hover]) - 10 }}
        >
          <span className="text-white/60">{labels[hover]}:</span>{' '}
          {fmtVal(data[hover])}
          {unit ? ` ${unit}` : ''}
        </div>
      )}
    </div>
  )
}

function fmtVal(v: number): string {
  if (Number.isInteger(v)) return v.toLocaleString('en-US')
  return v.toLocaleString('en-US', { maximumFractionDigits: 1 })
}

function niceMax(v: number): number {
  const mag = 10 ** Math.floor(Math.log10(v))
  const n = v / mag
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return step * mag
}
