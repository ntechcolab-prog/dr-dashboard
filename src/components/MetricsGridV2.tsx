import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { ArrowUp, ArrowDown } from '../icons/Icons'
import { formatValue, type Kpi } from '../lib/compute'

interface MetricsGridV2Props {
  kpis: Kpi[]
  // Per-metric daily series (keyed by kpi.key) for the card sparklines.
  series?: Record<string, number[]>
  onDetails?: (kpi: Kpi) => void
}

interface Snapshot {
  hidden: Set<string>
  order: string[]
}

// Per-metric accent color + glyph. Drives the icon chip, delta pill and
// sparkline so every card reads as its own thing at a glance.
const META: Record<string, { accent: string; icon: ReactNode }> = {
  production: { accent: '#46aa9f', icon: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></> },
  size: { accent: '#3b82f6', icon: <><path d="M12 3v18" /><path d="m7 7 5-4 5 4" /><path d="M4 21h16" /><path d="M6 11h12l-2 6H8z" /></> },
  totalEnergy: { accent: '#f19909', icon: <polygon points="13 2 4 14 11 14 10 22 20 9 13 9 13 2" /> },
  productionRate: { accent: '#1aa367', icon: <><path d="M3 12a9 9 0 0 1 18 0" /><path d="m12 12 4-3" /><circle cx="12" cy="12" r="1.6" /></> },
  coolingEnergy: { accent: '#06b6d4', icon: <path d="M12 2.5S6 9 6 14a6 6 0 0 0 12 0c0-5-6-11.5-6-11.5Z" /> },
  specificEnergy: { accent: '#8b5cf6', icon: <><path d="M3 17l5-5 4 3 6-7" /><path d="M17 5h4v4" /></> },
  carbon: { accent: '#16a34a', icon: <><path d="M11 20A7 7 0 0 1 4 13c0-5 5-9 12-9 0 7-3 12-9 12Z" /><path d="M5 19c4-1 7-4 9-9" /></> },
  ratio: { accent: '#6366f1', icon: <><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 1 0 18Z" /></> },
}
const FALLBACK = { accent: '#46aa9f', icon: <circle cx="12" cy="12" r="8" /> }

const metaFor = (key: string) => META[key] ?? FALLBACK

const withAlpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

export default function MetricsGridV2({ kpis, series, onDetails }: MetricsGridV2Props) {
  const [editing, setEditing] = useState(false)
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [order, setOrder] = useState<string[]>(() => kpis.map((k) => k.key))
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [confirming, setConfirming] = useState(false)

  const enterEdit = () => {
    setSnapshot({ hidden: new Set(hidden), order: [...order] })
    setEditing(true)
  }

  const done = () => {
    setEditing(false)
    setConfirming(false)
    setSnapshot(null)
  }

  const dirty =
    !!snapshot &&
    (snapshot.order.join() !== order.join() ||
      snapshot.hidden.size !== hidden.size ||
      [...hidden].some((k) => !snapshot.hidden.has(k)))

  const cancel = () => {
    if (dirty) {
      setConfirming(true)
      return
    }
    done()
  }

  const discard = () => {
    if (snapshot) {
      setHidden(new Set(snapshot.hidden))
      setOrder([...snapshot.order])
    }
    done()
  }

  // Keep the order list in sync if the set of metric keys ever changes.
  useEffect(() => {
    setOrder((prev) => {
      const known = new Set(prev)
      const extras = kpis.map((k) => k.key).filter((k) => !known.has(k))
      const pruned = prev.filter((k) => kpis.some((kp) => kp.key === k))
      return extras.length || pruned.length !== prev.length ? [...pruned, ...extras] : prev
    })
  }, [kpis])

  const byKey = useMemo(() => new Map(kpis.map((k) => [k.key, k])), [kpis])
  const orderedVisible = order
    .filter((key) => byKey.has(key) && !hidden.has(key))
    .map((key) => byKey.get(key)!)
  const hiddenKpis = kpis.filter((k) => hidden.has(k.key))

  const hide = (key: string) => setHidden((s) => new Set(s).add(key))
  const show = (key: string) =>
    setHidden((s) => {
      const n = new Set(s)
      n.delete(key)
      return n
    })

  const reorder = (targetKey: string) => {
    if (!dragKey || dragKey === targetKey) return
    setOrder((prev) => {
      const from = prev.indexOf(dragKey)
      const to = prev.indexOf(targetKey)
      if (from < 0 || to < 0) return prev
      const next = [...prev]
      next.splice(from, 1)
      next.splice(to, 0, dragKey)
      return next
    })
  }

  return (
    <section className="px-6 pb-2">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">Metrics</h3>
        {editing ? (
          <div className="relative flex items-center gap-3">
            <button
              onClick={cancel}
              className="text-xs font-semibold uppercase tracking-wide text-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              onClick={done}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-primary-700"
            >
              Done
            </button>

            {confirming && (
              <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-line bg-white p-4 text-left shadow-pop">
                <p className="text-sm font-semibold text-ink">Discard changes?</p>
                <p className="mt-1 text-xs text-muted">
                  Your layout changes (removed, added or reordered metrics) won't be saved.
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => setConfirming(false)}
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-muted hover:text-ink"
                  >
                    Keep editing
                  </button>
                  <button
                    onClick={discard}
                    className="rounded-md bg-down px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={enterEdit}
            className="text-xs font-semibold uppercase tracking-wide text-primary hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {editing && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-page px-3 py-2 text-xs text-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="5 9 2 12 5 15" />
            <polyline points="9 5 12 2 15 5" />
            <polyline points="15 19 12 22 9 19" />
            <polyline points="19 9 22 12 19 15" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="12" y1="2" x2="12" y2="22" />
          </svg>
          Drag cards to reorder · tap <span className="font-semibold text-down">−</span> to remove · use{' '}
          <span className="font-semibold text-primary">+ Add</span> to bring metrics back
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {orderedVisible.map((k, i) => (
          <KpiCardV2
            key={k.key}
            kpi={k}
            series={series?.[k.key]}
            editing={editing}
            jiggleAlt={i % 2 === 1}
            dragging={dragKey === k.key}
            onRemove={() => hide(k.key)}
            onDetails={() => onDetails?.(k)}
            onDragStart={() => setDragKey(k.key)}
            onDragEnter={() => reorder(k.key)}
            onDragEnd={() => setDragKey(null)}
          />
        ))}
        {editing && <AddCard hidden={hiddenKpis} onAdd={show} />}
      </div>
    </section>
  )
}

interface KpiCardV2Props {
  kpi: Kpi
  series?: number[]
  editing: boolean
  jiggleAlt: boolean
  dragging: boolean
  onRemove: () => void
  onDetails: () => void
  onDragStart: () => void
  onDragEnter: () => void
  onDragEnd: () => void
}

function KpiCardV2({
  kpi,
  series,
  editing,
  jiggleAlt,
  dragging,
  onRemove,
  onDetails,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: KpiCardV2Props) {
  const up = kpi.delta >= 0
  const { accent, icon } = metaFor(kpi.key)

  return (
    <div
      draggable={editing}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={(e) => editing && e.preventDefault()}
      onDragEnd={onDragEnd}
      onDrop={(e) => e.preventDefault()}
      className={`relative transition-opacity ${editing ? 'cursor-grab active:cursor-grabbing' : ''} ${
        dragging ? 'opacity-40' : editing ? (jiggleAlt ? 'jiggle-alt' : 'jiggle') : ''
      }`}
    >
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

      <div
        className={`relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-card ${
          dragging ? 'border-primary' : 'border-line/70'
        }`}
      >
        {/* accent rail */}
        <span className="absolute inset-y-0 left-0 w-1" style={{ background: accent }} />

        <div className="flex items-start justify-between gap-2 px-4 pt-4">
          <div className="flex items-center gap-2.5">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
              style={{ background: withAlpha(accent, 0.12), color: accent }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                {icon}
              </svg>
            </span>
            <p className="text-[0.6875rem] font-semibold uppercase leading-tight tracking-wide text-muted">
              {kpi.label}
            </p>
          </div>
          <span
            className="flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{
              background: withAlpha(up ? '#1aa367' : '#c12907', 0.12),
              color: up ? '#1aa367' : '#c12907',
            }}
          >
            {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {up ? '+' : ''}
            {Math.round(kpi.delta)}%
          </span>
        </div>

        <div className="px-4 pt-3">
          <p className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold leading-none text-ink">
              {formatValue(kpi.value, kpi.fmt)}
            </span>
            <span className="text-sm text-muted">{kpi.unit}</span>
          </p>
        </div>

        {/* sparkline — 30-day trend of this metric */}
        <div className="mt-3 px-1">
          <Sparkline data={series ?? []} color={accent} />
        </div>

        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          <span className="text-[0.625rem] font-medium uppercase tracking-wide text-faint">
            vs last month
          </span>
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

// Tiny area sparkline. Stretches to the card width (preserveAspectRatio none);
// the stroke stays crisp via non-scaling-stroke.
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const gid = useId().replace(/:/g, '')
  if (data.length < 2) return <div className="h-10" />

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const n = data.length
  const x = (i: number) => (i / (n - 1)) * 100
  const y = (v: number) => 30 - ((v - min) / range) * 26 + 2
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join(' ')
  const area = `${line} L 100 32 L 0 32 Z`

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="block h-10 w-full">
      <defs>
        <linearGradient id={`spark-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
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
        className="flex h-full min-h-[6.5rem] w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-faint text-muted transition-colors hover:border-primary hover:text-primary"
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
