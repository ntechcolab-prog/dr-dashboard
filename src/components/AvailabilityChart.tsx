import { useId, useState, type MouseEvent } from 'react'
import { useElementWidth } from '../lib/useElementWidth'
import { useRootScale } from '../lib/useRootScale'
import type { ChartType } from '../lib/availability'

// Parametrized availability chart, reused by the Month (daily) and Year
// (monthly) cards. Primary series is availability % (0–100); `type` switches
// bar / line / area (TASK-19); `goal` draws a dashed target line (TASK-18); the
// hover tooltip surfaces planned vs executed hours when provided (TASK-20).
interface AvailabilityChartProps {
  labels: string[]
  values: number[] // availability % per point
  planned?: number[] // hours, for the tooltip
  executed?: number[] // hours, for the tooltip
  type: ChartType
  goal?: number // 0–100 dashed target line
  height?: number
  maxLabels?: number
}

const GRAD = ['#7ad6cb', '#46aa9f', '#2d8a80']

export default function AvailabilityChart({
  labels,
  values,
  planned,
  executed,
  type,
  goal,
  height = 220,
  maxLabels = 12,
}: AvailabilityChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const gid = useId().replace(/:/g, '')
  const [hover, setHover] = useState<number | null>(null)

  const s = useRootScale()
  const H = height * s
  const fs = 9 * s
  const W = width || 360
  const padL = 36 * s
  const padR = 14 * s
  const padT = 16 * s
  const padB = 24 * s
  const plotW = Math.max(1, W - padL - padR)
  const plotH = Math.max(1, H - padT - padB)

  const max = 100
  const n = values.length
  const x = (i: number) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW)
  const y = (v: number) => padT + plotH - (v / max) * plotH
  const ticks = [0, 25, 50, 75, 100]
  const labelStep = Math.max(1, Math.ceil(labels.length / maxLabels))

  const linePath = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ')
  const areaPath = `${linePath} L ${x(n - 1)} ${padT + plotH} L ${x(0)} ${padT + plotH} Z`
  const showDots = n <= 14

  // bar geometry
  const slot = plotW / n
  const barW = Math.min(slot * 0.62, 28 * s)

  const onMove = (e: MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const i = type === 'bar' ? Math.floor((mx / rect.width) * n) : Math.round((mx / rect.width) * (n - 1))
    setHover(Math.max(0, Math.min(n - 1, i)))
  }

  const barX = (i: number) => padL + slot * i + (slot - barW) / 2

  return (
    <div ref={ref} className="relative w-full" style={{ height: H }}>
      {width > 0 && (
        <svg width={W} height={H} className="block overflow-visible">
          <defs>
            <linearGradient id={`av-stroke-${gid}`} gradientUnits="userSpaceOnUse" x1="0" y1={padT} x2="0" y2={padT + plotH}>
              <stop offset="0%" stopColor={GRAD[0]} />
              <stop offset="55%" stopColor={GRAD[1]} />
              <stop offset="100%" stopColor={GRAD[2]} />
            </linearGradient>
            <linearGradient id={`av-fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GRAD[1]} stopOpacity={0.18} />
              <stop offset="100%" stopColor={GRAD[1]} stopOpacity={0} />
            </linearGradient>
          </defs>

          <text x={padL - 30 * s} y={padT - 5 * s} className="fill-faint" style={{ fontSize: fs }}>
            %
          </text>

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

          {type === 'bar' ? (
            values.map((v, i) => {
              const below = goal != null && v < goal
              return (
                <rect
                  key={i}
                  x={barX(i)}
                  y={y(v)}
                  width={barW}
                  height={Math.max(0, padT + plotH - y(v))}
                  rx={2 * s}
                  fill={below ? '#f0b54d' : `url(#av-stroke-${gid})`}
                  opacity={hover === null || hover === i ? 1 : 0.55}
                  style={{ transition: 'opacity 0.15s' }}
                />
              )
            })
          ) : (
            <>
              {type === 'area' && <path d={areaPath} fill={`url(#av-fill-${gid})`} className="chart-area" />}
              <path
                d={linePath}
                fill="none"
                stroke={`url(#av-stroke-${gid})`}
                strokeWidth={2.75 * s}
                strokeLinejoin="round"
                strokeLinecap="round"
                pathLength={1}
                className="chart-line"
              />
              {values.map((v, i) =>
                showDots || i === hover ? (
                  <circle key={i} cx={x(i)} cy={y(v)} r={(i === hover ? 5 : 3.2) * s} fill="#fff" stroke="#39998f" strokeWidth={2 * s} />
                ) : null
              )}
            </>
          )}

          {/* goal line (TASK-18) */}
          {goal != null && (
            <g>
              <line
                x1={padL}
                x2={W - padR}
                y1={y(goal)}
                y2={y(goal)}
                stroke="#5c5f62"
                strokeWidth={1.4 * s}
                strokeDasharray="5 4"
                opacity={0.8}
              />
              <text x={W - padR} y={y(goal) - 4 * s} textAnchor="end" className="fill-muted" style={{ fontSize: fs }}>
                Goal {goal}%
              </text>
            </g>
          )}

          {/* hover crosshair (line/area only) */}
          {hover !== null && type !== 'bar' && (
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + plotH} stroke="#39998f" strokeWidth={s} strokeOpacity={0.3} />
          )}

          {/* x labels (thinned) */}
          {labels.map((lab, i) =>
            i % labelStep === 0 || i === labels.length - 1 ? (
              <text
                key={i}
                x={type === 'bar' ? padL + slot * i + slot / 2 : x(i)}
                y={H - 10 * s}
                textAnchor="middle"
                className="fill-muted"
                style={{ fontSize: fs }}
              >
                {lab}
              </text>
            ) : null
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
          style={{
            left: type === 'bar' ? barX(hover) + barW / 2 : x(hover),
            top: (type === 'bar' ? y(values[hover]) : y(values[hover])) - 10 * s,
          }}
        >
          <div className="text-white/60">{labels[hover]}</div>
          <div>
            Availability <span className="font-semibold">{values[hover]}%</span>
          </div>
          {planned && executed && (
            <div className="text-white/70">
              {executed[hover]}h / {planned[hover]}h
            </div>
          )}
        </div>
      )}
    </div>
  )
}
