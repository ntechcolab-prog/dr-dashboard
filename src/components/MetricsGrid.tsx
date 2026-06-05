import { useEffect, useRef, useState } from 'react'
import { ArrowUp, ArrowDown } from '../icons/Icons'
import { formatValue, type Kpi } from '../lib/compute'

interface MetricsGridProps {
  kpis: Kpi[]
  onDetails?: (kpi: Kpi) => void
}

export default function MetricsGrid({ kpis, onDetails }: MetricsGridProps) {
  const [editing, setEditing] = useState(false)
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const visible = kpis.filter((k) => !hidden.has(k.key))
  const hiddenKpis = kpis.filter((k) => hidden.has(k.key))

  const hide = (key: string) => setHidden((s) => new Set(s).add(key))
  const show = (key: string) =>
    setHidden((s) => {
      const n = new Set(s)
      n.delete(key)
      return n
    })

  return (
    <section className="px-6 pb-2">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">Metrics</h3>
        <button
          onClick={() => setEditing((v) => !v)}
          className="text-xs font-semibold uppercase tracking-wide text-primary hover:underline"
        >
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((k, i) => (
          <KpiCard
            key={k.key}
            kpi={k}
            editing={editing}
            jiggleAlt={i % 2 === 1}
            onRemove={() => hide(k.key)}
            onDetails={() => onDetails?.(k)}
          />
        ))}
        {editing && <AddCard hidden={hiddenKpis} onAdd={show} />}
      </div>
    </section>
  )
}

interface KpiCardProps {
  kpi: Kpi
  editing: boolean
  jiggleAlt: boolean
  onRemove: () => void
  onDetails: () => void
}

function KpiCard({ kpi, editing, jiggleAlt, onRemove, onDetails }: KpiCardProps) {
  const up = kpi.delta >= 0
  const deltaColor = up ? 'text-up' : 'text-down'
  return (
    <div className={`relative ${editing ? (jiggleAlt ? 'jiggle-alt' : 'jiggle') : ''}`}>
      {editing && (
        <button
          onClick={onRemove}
          className="absolute -left-2 -top-2 z-10 grid h-6 w-6 place-items-center rounded-full bg-down text-white shadow-md transition-transform hover:scale-110"
          aria-label={`Remove ${kpi.label}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}

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
          {!editing && (
            <button onClick={onDetails} className="text-xs font-medium text-primary hover:underline">
              Details
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function AddCard({ hidden, onAdd }: { hidden: Kpi[]; onAdd: (key: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-full min-h-[104px] w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-faint text-muted transition-colors hover:border-primary hover:text-primary"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span className="text-sm font-medium">Add</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-lg border border-line bg-white py-1 shadow-pop">
          {hidden.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted">All metrics are shown.</p>
          ) : (
            hidden.map((k) => (
              <button
                key={k.key}
                onClick={() => {
                  onAdd(k.key)
                  if (hidden.length === 1) setOpen(false)
                }}
                className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-page"
              >
                {k.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
