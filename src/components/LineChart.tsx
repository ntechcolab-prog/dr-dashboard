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

// Teal stroke gradient (top → bottom) shared by every line chart.
const GRAD = ['#7ad6cb', '#46aa9f', '#2d8a80']

export default function LineChart({
  data,
  labels,
  unit,
  xLabel,
  color = '#39998f',
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
  const padT = 18
  const padB = 26
  const plotW = Math.max(1, W - padL - padR)
  const plotH = Math.max(1, height - padT - padB)

  const max = yMax ?? niceMax(Math.max(...data, 1))
  const x = (i: number) => padL + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW)
  const y = (v: number) => padT + plotH - (v / max) * plotH

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t))
  const labelStep = Math.max(1, Math.ceil(labels.length / maxLabels))

  const linePath = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ')
  const areaPath = `${linePath} L ${x(data.length - 1)} ${padT + plotH} L ${x(0)} ${padT + plotH} Z`
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
        <svg width={W} height={height} className="block overflow-visible">
          <defs>
            <linearGradient id={`stroke-${gid}`} gradientUnits="userSpaceOnUse" x1="0" y1={padT} x2="0" y2={padT + plotH}>
              <stop offset="0%" stopColor={GRAD[0]} />
              <stop offset="55%" stopColor={GRAD[1]} />
              <stop offset="100%" stopColor={GRAD[2]} />
            </linearGradient>
            <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GRAD[1]} stopOpacity={0.16} />
              <stop offset="100%" stopColor={GRAD[1]} stopOpacity={0} />
            </linearGradient>
          </defs>

          {unit && (
            <text x={padL - 32} y={padT - 6} className="fill-faint" style={{ fontSize: 9 }}>
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
                strokeDasharray={i === 0 ? undefined : '2 5'}
              />
              <text x={padL - 8} y={y(t) + 3} textAnchor="end" className="fill-faint" style={{ fontSize: 9 }}>
                {t}
              </text>
            </g>
          ))}

          {/* subtle area for grounding */}
          <path d={areaPath} fill={`url(#fill-${gid})`} className="chart-area" />

          {/* glow: blurred copy of the line underneath */}
          <path
            d={linePath}
            fill="none"
            stroke={`url(#stroke-${gid})`}
            strokeWidth={6}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.5}
            style={{ filter: 'blur(7px)' }}
          />

          {/* main line */}
          <path
            d={linePath}
            fill="none"
            stroke={`url(#stroke-${gid})`}
            strokeWidth={2.75}
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={1}
            className="chart-line"
          />

          {/* hover crosshair */}
          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + plotH} stroke={color} strokeWidth={1} strokeOpacity={0.3} />
          )}

          {/* dots */}
          {data.map((v, i) =>
            showDots || i === hover ? (
              <circle key={i} cx={x(i)} cy={y(v)} r={i === hover ? 5 : 3.4} fill="#fff" stroke={color} strokeWidth={2} />
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

      {hover !== null && width > 0 && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-medium text-white shadow-pop"
          style={{ left: x(hover), top: y(data[hover]) - 10 }}
        >
          <span className="text-white/60">{labels[hover]}:</span> {fmtVal(data[hover])}
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
