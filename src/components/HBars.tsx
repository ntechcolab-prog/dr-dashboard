import { useEffect, useState } from 'react'

// Horizontal bars with a left-side label (rank or value) and optional
// per-bar colors. Used by the Machine tab (Downtime by group, Performance).
export interface HBarItem {
  label: string
  value: number
  color?: string
  leftLabel?: string
  // De-emphasize this bar (e.g. non-selected machines in the ranking).
  dim?: boolean
}

interface HBarsProps {
  items: HBarItem[]
  axisMax?: number
  axisTicks?: number[]
  labelInside?: boolean
}

const DEFAULT_COLOR = 'var(--color-chart-1)'

const barFill = (c: string) =>
  `linear-gradient(180deg, color-mix(in oklab, ${c} 84%, white) 0%, ${c} 100%)`

export default function HBars({ items, axisMax, axisTicks, labelInside = true }: HBarsProps) {
  const max = axisMax ?? Math.max(...items.map((i) => i.value), 1)
  const [mounted, setMounted] = useState(false)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div>
      <div className="space-y-2.5">
        {items.map((it, i) => {
          const w = Math.max((it.value / max) * 100, it.value > 0 ? 6 : 0)
          const active = hover === i
          return (
            <div
              key={i}
              className={`flex items-center gap-2 transition-opacity ${it.dim ? 'opacity-35' : ''}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <span
                className={`w-6 shrink-0 text-right text-[0.6875rem] tabular-nums ${
                  it.dim === false ? 'font-semibold text-ink' : 'text-muted'
                }`}
              >
                {it.leftLabel ?? i + 1}
              </span>
              <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-page">
                <div
                  className="flex h-full items-center rounded-md px-2.5"
                  style={{
                    width: mounted ? `${w}%` : '0%',
                    background: barFill(it.color ?? DEFAULT_COLOR),
                    transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)',
                    transitionDelay: `${i * 45}ms`,
                    filter: active ? 'saturate(1.15) brightness(1.04)' : undefined,
                  }}
                  title={`${it.label}: ${it.value}`}
                >
                  {labelInside && (
                    <span className="truncate text-[0.6875rem] font-medium text-white drop-shadow-sm">{it.label}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {axisTicks && (
        <div className="mt-2 flex justify-between pl-8 text-[0.625rem] tabular-nums text-faint">
          {axisTicks.map((t) => (
            <span key={t}>{t >= 1000 ? `${Math.round(t / 1000)}K` : t}</span>
          ))}
        </div>
      )}
    </div>
  )
}
