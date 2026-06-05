import { Close } from '../icons/Icons.jsx'

// Slide-over panel listing the batches behind a calendar day or KPI.
export default function DetailsDrawer({ open, title, subtitle, batches, onClose }) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[460px] flex-col bg-white shadow-pop transition-transform duration-300 ${
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

        <div className="flex-1 overflow-auto px-6 py-4">
          {(!batches || batches.length === 0) && (
            <p className="py-10 text-center text-sm text-muted">No batches for this selection.</p>
          )}
          <div className="space-y-3">
            {batches?.map((b) => (
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
        </div>
      </aside>
    </>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-0.5 font-medium text-ink">{value}</p>
    </div>
  )
}

function StatusPill({ status }) {
  const tone =
    status === 'Cancelled'
      ? 'bg-red-50 text-down'
      : status.startsWith('Completed')
      ? 'bg-primary-soft text-primary-700'
      : 'bg-page text-muted'
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${tone}`}>{status}</span>
}
