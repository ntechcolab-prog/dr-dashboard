import { Close, ArrowUp, ArrowDown } from '../icons/Icons'
import LineChart from './LineChart'
import BarChart from './BarChart'
import type { Batch } from '../data/mockData'
import { formatValue, type Kpi, type RankItem } from '../lib/compute'

export interface DrawerData {
  open: boolean
  kind: 'kpi' | 'day'
  title: string
  subtitle: string
  // day mode
  batches: Batch[]
  // kpi mode
  kpi?: Kpi
  daily?: { labels: string[]; data: number[] }
  byMachine?: RankItem[]
  byRecipe?: RankItem[]
}

interface DetailsDrawerProps extends DrawerData {
  onClose: () => void
}

// Slide-over panel: charts for a KPI, or the batch list for a calendar day.
export default function DetailsDrawer({
  open,
  kind,
  title,
  subtitle,
  batches,
  kpi,
  daily,
  byMachine,
  byRecipe,
  onClose,
}: DetailsDrawerProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] flex-col bg-white shadow-pop transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-page"
            aria-label="Close"
          >
            <Close size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-5">
          {kind === 'kpi' ? (
            <KpiDetail kpi={kpi} daily={daily} byMachine={byMachine} byRecipe={byRecipe} />
          ) : (
            <BatchList batches={batches} />
          )}
        </div>
      </aside>
    </>
  )
}

function KpiDetail({
  kpi,
  daily,
  byMachine,
  byRecipe,
}: {
  kpi?: Kpi
  daily?: { labels: string[]; data: number[] }
  byMachine?: RankItem[]
  byRecipe?: RankItem[]
}) {
  if (!kpi) return null
  const up = kpi.delta >= 0
  return (
    <div className="space-y-6">
      {/* headline value */}
      <div className="flex items-end justify-between rounded-xl border border-line/70 bg-page/40 p-4">
        <p className="flex items-baseline gap-1.5">
          <span className="text-4xl font-bold text-ink">{formatValue(kpi.value, kpi.fmt)}</span>
          <span className="text-sm text-muted">{kpi.unit}</span>
        </p>
        <span className={`flex items-center gap-0.5 text-sm font-semibold ${up ? 'text-up' : 'text-down'}`}>
          {up ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          {up ? '+' : ''}
          {Math.round(kpi.delta)}% vs prev. month
        </span>
      </div>

      {daily && (
        <Section title="Daily trend">
          <LineChart data={daily.data} labels={daily.labels} unit={kpi.unit} height={220} maxLabels={8} />
        </Section>
      )}

      {byMachine && byMachine.length > 0 && (
        <Section title="By machine">
          <BarChart data={byMachine} />
        </Section>
      )}

      {byRecipe && byRecipe.length > 0 && (
        <Section title="By recipe">
          <BarChart data={byRecipe} />
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{title}</p>
      {children}
    </div>
  )
}

function BatchList({ batches }: { batches: Batch[] }) {
  if (batches.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">No batches for this selection.</p>
  }
  return (
    <div className="space-y-3">
      {batches.map((b) => (
        <div key={b.id} className="rounded-lg border border-line p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-ink">Batch {b.id}</p>
            <StatusPill status={b.status} />
          </div>
          <p className="mt-0.5 text-sm text-muted">
            {b.recipe} · {b.machine}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
            <Stat label="Mass" value={`${b.mass} ton`} />
            <Stat label="Energy" value={`${b.energy} kWh`} />
            <Stat label="Grinding" value={`${b.grindMin} min`} />
            <Stat label="Setup" value={`${b.setupMin} min`} />
            <Stat label="Idle" value={`${b.idleMin} min`} />
            <Stat label="CO₂" value={`${b.co2}`} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-0.5 font-medium text-ink">{value}</p>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'Cancelled'
      ? 'bg-red-50 text-down'
      : status.startsWith('Completed')
      ? 'bg-primary-soft text-primary-700'
      : 'bg-page text-muted'
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${tone}`}>{status}</span>
}
