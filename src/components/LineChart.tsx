import { useId, useState, type MouseEvent } from 'react'
import { useElementWidth } from '../lib/useElementWidth'
import { useRootScale } from '../lib/useRootScale'

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

  // The container width (W) already grows with the rem-based layout; scale the
  // pixel-space geometry (height, paddings, fonts, strokes) by the same root
  // factor so the chart zooms uniformly on large monitors.
  const s = useRootScale()
  const H = height * s
  const fs = 9 * s
  const W = width || 360
  const padL = 40 * s
  const padR = 16 * s
  const padT = 18 * s
  const padB = 26 * s
  const plotW = Math.max(1, W - padL - padR)
  const plotH = Math.max(1, H - padT - padB)

  const max = yMax ?? niceMax(Math.max(...data, 1))
  const x = (i: number) => padL + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW)
  const y = (v: number) => padT + plotH - (v / max) * plotH

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t))
  const labelStep = Math.max(1, Math.ceil(labels.length / maxLabels))

  const linePath = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ')
  const areaPath = `${linePath} L ${x(data.length - 1)} ${padT + plotH} L ${x(0)} ${padT + plotH} Z`
  const showDots = data.length <= 12

  const onMove = (e: MouseEvent<SVGRectElement>) => {
    // rect.left already maps to plot x = padL, so mx is offset from the plot start.
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const i = Math.round((mx / rect.width) * (data.length - 1))
    setHover(Math.max(0, Math.min(data.length - 1, i)))
  }

  return (
    <div ref={ref} className="relative w-full" style={{ height: H }}>
      {width > 0 && (
        <svg width={W} height={H} className="block overflow-visible">
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
            <text x={padL - 32 * s} y={padT - 6 * s} className="fill-faint" style={{ fontSize: fs }}>
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
                strokeWidth={s}
                strokeDasharray={i === 0 ? undefined : '2 5'}
              />
              <text x={padL - 8 * s} y={y(t) + 3 * s} textAnchor="end" className="fill-faint" style={{ fontSize: fs }}>
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
            strokeWidth={6 * s}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.5}
            style={{ filter: `blur(${7 * s}px)` }}
          />

          {/* main line */}
          <path
            d={linePath}
            fill="none"
            stroke={`url(#stroke-${gid})`}
            strokeWidth={2.75 * s}
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={1}
            className="chart-line"
          />

          {/* hover crosshair */}
          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + plotH} stroke={color} strokeWidth={s} strokeOpacity={0.3} />
          )}

          {/* dots */}
          {data.map((v, i) =>
            showDots || i === hover ? (
              <circle key={i} cx={x(i)} cy={y(v)} r={(i === hover ? 5 : 3.4) * s} fill="#fff" stroke={color} strokeWidth={2 * s} />
            ) : null
          )}

          {/* x labels (thinned) */}
          {labels.map((lab, i) =>
            i % labelStep === 0 || i === labels.length - 1 ? (
              <text key={i} x={x(i)} y={H - 12 * s} textAnchor="middle" className="fill-muted" style={{ fontSize: fs }}>
                {lab}
              </text>
            ) : null
          )}
          {xLabel && (
            <text x={padL + plotW / 2} y={H - s} textAnchor="middle" className="fill-faint" style={{ fontSize: fs }}>
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
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[0.6875rem] font-medium text-white shadow-pop"
          style={{ left: x(hover), top: y(data[hover]) - 10 * s }}
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
