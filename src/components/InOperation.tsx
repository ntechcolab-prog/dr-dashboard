import { useEffect, useRef, useState } from 'react'
import { CheckCircle, PauseCircle, ChevronLeft, ChevronRight, Close } from '../icons/Icons'
import type { LiveBatch } from '../data/mockData'

interface InOperationProps {
  batches: LiveBatch[]
}

// Live batches strip: fixed-size cards (3 per view) in a horizontal,
// snap-scrolling carousel. Clicking a card opens the detail modal.
export default function InOperation({ batches }: InOperationProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<LiveBatch | null>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const updateArrows = () => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    updateArrows()
    const el = trackRef.current
    if (!el) return
    const onResize = () => updateArrows()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [batches.length])

  const scrollByPage = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' })
  }

  const overflowing = canPrev || canNext

  return (
    <section className="rounded-xl bg-card p-6 shadow-card">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">
          In Operation
          <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-primary-700">
            {batches.length}
          </span>
        </h3>
        {overflowing && (
          <div className="flex items-center gap-1.5">
            <CarouselArrow dir={-1} disabled={!canPrev} onClick={() => scrollByPage(-1)} />
            <CarouselArrow dir={1} disabled={!canNext} onClick={() => scrollByPage(1)} />
          </div>
        )}
      </div>

      <div
        ref={trackRef}
        onScroll={updateArrows}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth"
      >
        {batches.map((b) => (
          <BatchCard key={b.id} batch={b} onOpen={() => setSelected(b)} />
        ))}
      </div>

      {selected && <BatchModal batch={selected} onClose={() => setSelected(null)} />}
    </section>
  )
}

function CarouselArrow({ dir, disabled, onClick }: { dir: 1 | -1; disabled: boolean; onClick: () => void }) {
  const Icon = dir === 1 ? ChevronRight : ChevronLeft
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 1 ? 'Next batches' : 'Previous batches'}
      className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-35 disabled:hover:border-line disabled:hover:text-muted"
    >
      <Icon size={16} />
    </button>
  )
}

function StatePill({ state }: { state: LiveBatch['state'] }) {
  const running = state === 'Running'
  return (
    <span
      className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium ${
        running ? 'bg-primary-soft text-primary-700' : 'bg-page text-muted'
      }`}
    >
      {running ? <CheckCircle size={13} /> : <PauseCircle size={13} />}
      {state}
    </span>
  )
}

// Compact card — fixed to a third of the track so exactly 3 fit per view.
function BatchCard({ batch, onOpen }: { batch: LiveBatch; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-[calc((100%-2rem)/3)] shrink-0 snap-start rounded-xl border border-line bg-white p-4 text-left transition-colors hover:border-primary"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">BATCH {batch.id}</p>
          <p className="truncate text-xs text-muted">{batch.recipe}</p>
        </div>
        <StatePill state={batch.state} />
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[0.6875rem] text-muted">
          <span>{batch.progress}%</span>
          <span>ETA {batch.eta}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-page">
          <div
            className="h-full rounded-full bg-[#2f6df6] transition-[width] duration-500"
            style={{ width: `${batch.progress}%` }}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-xs">
        <Field label="Machine" value={batch.machine} />
        <Field label="Energy" value={`${batch.energy} kWh`} />
      </div>

      <p className="mt-3 text-xs font-medium text-primary">Details</p>
    </button>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[0.6875rem] text-muted">{label}</p>
      <p className="mt-0.5 truncate font-medium text-ink" title={value}>
        {value}
      </p>
    </div>
  )
}

// Detail modal — everything we know about a live batch.
function BatchModal({ batch, onClose }: { batch: LiveBatch; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const massPct = batch.targetMass ? Math.round((batch.currentMass / batch.targetMass) * 100) : 0

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Batch ${batch.id} details`}
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-start justify-between border-b border-line px-6 py-5">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-ink">BATCH {batch.id}</h2>
              <StatePill state={batch.state} />
            </div>
            <p className="mt-0.5 text-sm text-muted">
              {batch.recipe} · {batch.machine} · {batch.productionLine}
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-page"
            aria-label="Close"
          >
            <Close size={20} />
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          {/* progress + phase */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-ink">{batch.phase}</span>
              <span className="text-muted">
                {batch.progress}% · ETA {batch.eta}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-page">
              <div
                className="h-full rounded-full bg-[#2f6df6] transition-[width] duration-500"
                style={{ width: `${batch.progress}%` }}
              />
            </div>
          </div>

          {/* live stats */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-line/70 bg-page/40 p-4 sm:grid-cols-3">
            <Stat label="Operator" value={batch.operator} />
            <Stat label="Started at" value={batch.startedAt} />
            <Stat label="ETA" value={batch.eta} />
            <Stat label="Mass" value={`${batch.currentMass} / ${batch.targetMass} ton (${massPct}%)`} />
            <Stat label="Energy" value={`${batch.energy} kWh`} />
            <Stat label="Mill speed" value={batch.millSpeed ? `${batch.millSpeed.toLocaleString('en-US')} rpm` : '—'} />
            <Stat label="Product temp." value={`${batch.productTemp} °C`} />
            <Stat label="Flow rate" value={batch.flowRate ? `${batch.flowRate} l/min` : '—'} />
            <Stat
              label="Alarms"
              value={String(batch.alarms)}
              tone={batch.alarms > 0 ? 'warn' : undefined}
            />
          </div>

          {/* event timeline */}
          <div>
            <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">Recent events</p>
            <ul className="space-y-2.5">
              {batch.events.map((ev, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="w-11 shrink-0 tabular-nums text-muted">{ev.time}</span>
                  <span className="relative pl-4 text-ink before:absolute before:left-0 before:top-[0.4375rem] before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary">
                    {ev.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'warn' }) {
  return (
    <div className="min-w-0">
      <p className="text-[0.6875rem] text-muted">{label}</p>
      <p className={`mt-0.5 truncate text-sm font-medium ${tone === 'warn' ? 'text-warning' : 'text-ink'}`} title={value}>
        {value}
      </p>
    </div>
  )
}
