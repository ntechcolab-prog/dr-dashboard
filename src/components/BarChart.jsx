// Horizontal ranking bar chart (CSS-driven) with a numeric x-axis.
const PALETTE = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
]

function niceTicks(max, count = 5) {
  if (max <= 0) return [0]
  const rawStep = max / (count - 1)
  const mag = 10 ** Math.floor(Math.log10(rawStep))
  const norm = rawStep / mag
  const stepMul = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10
  const step = stepMul * mag
  const top = Math.ceil(max / step) * step
  const ticks = []
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v)
  return ticks
}

const fmtTick = (v) => (v >= 1000 ? `${Math.round(v / 1000)}K` : `${Math.round(v)}`)

export default function BarChart({ data, valueLabel }) {
  const ticks = niceTicks(Math.max(...data.map((d) => d.value), 0))
  const axisMax = ticks[ticks.length - 1] || 1

  return (
    <div>
      <div className="space-y-3">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-2">
            <span className="w-3 shrink-0 text-right text-[11px] tabular-nums text-muted">
              {i + 1}
            </span>
            <div className="relative h-6 flex-1 overflow-hidden rounded-[3px] bg-page">
              <div
                className="flex h-full items-center rounded-[3px] px-2 transition-[width] duration-500"
                style={{
                  width: `${Math.max((d.value / axisMax) * 100, d.value > 0 ? 8 : 0)}%`,
                  background: PALETTE[i % PALETTE.length],
                }}
                title={`${d.label}: ${d.value}`}
              >
                <span className="truncate text-[11px] font-medium text-white">{d.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* x-axis */}
      <div className="mt-2 flex justify-between pl-5 text-[10px] tabular-nums text-faint">
        {ticks.map((t) => (
          <span key={t}>{fmtTick(t)}</span>
        ))}
      </div>
      {valueLabel && (
        <p className="mt-1 pl-5 text-center text-[10px] uppercase tracking-wide text-faint">
          {valueLabel}
        </p>
      )}
    </div>
  )
}
