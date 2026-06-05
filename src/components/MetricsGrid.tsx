import { ArrowUp, ArrowDown } from '../icons/Icons'
import { formatValue, type Kpi } from '../lib/compute'

interface MetricsGridProps {
  kpis: Kpi[]
  onDetails?: (kpi: Kpi) => void
}

export default function MetricsGrid({ kpis, onDetails }: MetricsGridProps) {
  return (
    <section className="px-6 pb-2">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">Metrics</h3>
        <button className="text-xs font-semibold uppercase tracking-wide text-primary hover:underline">
          Edit
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <KpiCard key={k.key} kpi={k} onDetails={() => onDetails?.(k)} />
        ))}
      </div>
    </section>
  )
}

interface KpiCardProps {
  kpi: Kpi
  onDetails: () => void
}

function KpiCard({ kpi, onDetails }: KpiCardProps) {
  const up = kpi.delta >= 0
  const deltaColor = up ? 'text-up' : 'text-down'
  return (
    <div className="rounded-xl border border-line/70 bg-card p-4 shadow-card">
      <div className="flex items-start justify-between">
        <p className="max-w-[70%] text-[11px] font-medium uppercase tracking-wide text-muted">
          {kpi.label}
        </p>
        <span className={`flex items-center gap-0.5 text-sm font-semibold ${deltaColor}`}>
          {up ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          {up ? '+' : ''}
          {Math.round(kpi.delta)}%
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <p className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold leading-none text-ink">
            {formatValue(kpi.value, kpi.fmt)}
          </span>
          <span className="text-sm text-muted">{kpi.unit}</span>
        </p>
        <button onClick={onDetails} className="text-xs font-medium text-primary hover:underline">
          Details
        </button>
      </div>
    </div>
  )
}
