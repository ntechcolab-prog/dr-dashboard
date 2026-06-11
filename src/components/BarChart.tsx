import { useEffect, useState } from 'react'
import type { RankItem } from '../lib/compute'

// Horizontal ranking bar chart (CSS-driven) with a numeric axis and value labels.
const PALETTE = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
]

const barFill = (c: string) =>
  `linear-gradient(180deg, color-mix(in oklab, ${c} 84%, white) 0%, ${c} 100%)`

function niceTicks(max: number, count = 5): number[] {
  if (max <= 0) return [0]
  const rawStep = max / (count - 1)
  const mag = 10 ** Math.floor(Math.log10(rawStep))
  const norm = rawStep / mag
  const stepMul = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10
  const step = stepMul * mag
  const top = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v)
  return ticks
}

const fmt = (v: number) =>
  v >= 1000 ? `${(Math.round(v / 100) / 10).toLocaleString('en-US')}K` : `${Math.round(v * 10) / 10}`

interface BarChartProps {
  data: RankItem[]
  valueLabel?: string
  showAxis?: boolean
}

export default function BarChart({ data, valueLabel, showAxis = true }: BarChartProps) {
  const [mounted, setMounted] = useState(false)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const ticks = niceTicks(Math.max(...data.map((d) => d.value), 0))
  const axisMax = ticks[ticks.length - 1] || 1

  return (
    <div>
      <div className="space-y-2">
        {data.map((d, i) => {
          const w = Math.max((d.value / axisMax) * 100, d.value > 0 ? 7 : 0)
          const active = hover === i
          return (
            <div
              key={d.label}
              className="relative flex items-center gap-2.5"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {/* rich hover tooltip (when the item carries extra rows) */}
              {active && d.extra && d.extra.length > 0 && (
                <div
                  className={`pointer-events-none absolute left-6 z-20 w-52 rounded-lg border border-line bg-white p-3 shadow-pop ${
                    i === 0 ? 'top-full mt-1.5' : 'bottom-full mb-1.5'
                  }`}
                >
                  <p className="mb-1.5 truncate text-xs font-semibold text-ink">{d.label}</p>
                  <dl className="space-y-1">
                    {d.extra.map((row) => (
                      <div key={row.label} className="flex items-baseline justify-between gap-3 text-[0.6875rem]">
                        <dt className="text-muted">{row.label}</dt>
                        <dd className="shrink-0 font-medium tabular-nums text-ink">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
              <span className="w-3 shrink-0 text-right text-[0.6875rem] tabular-nums text-muted">{i + 1}</span>
              <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-page">
                <div
                  className="flex h-full items-center rounded-md px-2.5"
                  style={{
                    width: mounted ? `${w}%` : '0%',
                    background: barFill(PALETTE[i % PALETTE.length]),
                    transition: 'width 0.55s cubic-bezier(0.22,1,0.36,1)',
                    transitionDelay: `${i * 40}ms`,
                    filter: active ? 'saturate(1.18) brightness(1.05)' : undefined,
                  }}
                >
                  <span className="truncate text-[0.6875rem] font-medium text-white drop-shadow-sm">{d.label}</span>
                </div>
              </div>
              <span
                className={`w-10 shrink-0 text-right text-[0.6875rem] tabular-nums ${
                  active ? 'text-ink' : 'text-muted'
                }`}
              >
                {fmt(d.value)}
              </span>
            </div>
          )
        })}
      </div>

      {showAxis && (
        <div className="mt-2 flex justify-between pl-5 pr-12 text-[0.625rem] tabular-nums text-faint">
          {ticks.map((t) => (
            <span key={t}>{fmt(t)}</span>
          ))}
        </div>
      )}
      {valueLabel && (
        <p className="mt-1.5 pl-5 pr-12 text-center text-[0.625rem] uppercase tracking-wide text-faint">{valueLabel}</p>
      )}
    </div>
  )
}
