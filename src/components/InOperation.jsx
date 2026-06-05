import { CheckCircle, PauseCircle } from '../icons/Icons.jsx'

export default function InOperation({ batches }) {
  return (
    <section className="rounded-xl bg-card p-6 shadow-card">
      <h3 className="mb-5 text-xs font-semibold uppercase tracking-wide text-ink">In Operation</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {batches.map((b, i) => (
          <BatchCard key={i} batch={b} />
        ))}
      </div>
    </section>
  )
}

function BatchCard({ batch }) {
  const running = batch.state === 'Running'
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-bold text-ink">BATCH {batch.id}</p>
          <p className="text-sm text-muted">{batch.recipe}</p>
        </div>
        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            running ? 'bg-primary-soft text-primary-700' : 'bg-page text-muted'
          }`}
        >
          {running ? <CheckCircle size={14} /> : <PauseCircle size={14} />}
          {batch.state}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-muted">
          <span>{batch.progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-page">
          <div
            className="h-full rounded-full bg-[#2f6df6] transition-[width] duration-500"
            style={{ width: `${batch.progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-xs">
        <Field label="Machine Name" value={batch.machine} />
        <Field label="Production Line" value={batch.productionLine} />
        <Field label="Energy" value={`${batch.energy} kWh`} />
      </div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-0.5 truncate font-medium text-ink" title={value}>
        {value}
      </p>
    </div>
  )
}
