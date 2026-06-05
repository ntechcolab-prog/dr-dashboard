// Horizontal bars with a left-side label (rank or value) and optional
// per-bar colors. Used by the Machine tab (Downtime by group, Performance).
export interface HBarItem {
  label: string
  value: number
  color?: string
  leftLabel?: string
}

interface HBarsProps {
  items: HBarItem[]
  axisMax?: number
  axisTicks?: number[]
  labelInside?: boolean
}

const DEFAULT_COLOR = 'var(--color-chart-1)'

export default function HBars({ items, axisMax, axisTicks, labelInside = true }: HBarsProps) {
  const max = axisMax ?? Math.max(...items.map((i) => i.value), 1)

  return (
    <div>
      <div className="space-y-2.5">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-right text-[11px] tabular-nums text-muted">
              {it.leftLabel ?? i + 1}
            </span>
            <div className="relative h-6 flex-1 overflow-hidden rounded-[3px] bg-page">
              <div
                className="flex h-full items-center rounded-[3px] px-2"
                style={{
                  width: `${Math.max((it.value / max) * 100, it.value > 0 ? 6 : 0)}%`,
                  background: it.color ?? DEFAULT_COLOR,
                  transition: 'width 0.5s ease',
                }}
                title={`${it.label}: ${it.value}`}
              >
                {labelInside && (
                  <span className="truncate text-[11px] font-medium text-white">{it.label}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {axisTicks && (
        <div className="mt-2 flex justify-between pl-8 text-[10px] tabular-nums text-faint">
          {axisTicks.map((t) => (
            <span key={t}>{t >= 1000 ? `${Math.round(t / 1000)}K` : t}</span>
          ))}
        </div>
      )}
    </div>
  )
}
