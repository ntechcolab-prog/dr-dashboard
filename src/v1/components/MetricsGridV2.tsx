import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUp, ArrowDown, Sparkle, BarsGlyph, LineGlyph, AreaGlyph } from '../icons/Icons'
import { formatValue, type Kpi } from '../../shared/lib/compute'
import { CardViz, VIZ_CAPTION, metaFor, withAlpha, METRIC_STYLE_KEY, type MetricStyleMap } from '../../shared/viz/metricViz'
import { useLocalStorage } from '../../shared/lib/useLocalStorage'
import type { ChartType } from '../../shared/lib/availability'

const STYLE_OPTIONS: { key: ChartType | ''; Glyph: (p: { size?: number }) => React.ReactElement; label: string }[] = [
  { key: '', Glyph: Sparkle, label: 'Auto' },
  { key: 'bar', Glyph: BarsGlyph, label: 'Bars' },
  { key: 'line', Glyph: LineGlyph, label: 'Line' },
  { key: 'area', Glyph: AreaGlyph, label: 'Area' },
]

interface MetricsGridV2Props {
  kpis: Kpi[]
  // Per-metric daily series (keyed by kpi.key) for the card visualizations.
  series?: Record<string, number[]>
  onDetails?: (kpi: Kpi) => void
}

interface Snapshot {
  hidden: Set<string>
  order: string[]
}

// Metrics hidden by default — no real data source yet, but still re-addable via "+ Add".
const DEFAULT_HIDDEN = ['coolingEnergy']

export default function MetricsGridV2({ kpis, series, onDetails }: MetricsGridV2Props) {
  const [editing, setEditing] = useState(false)
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(DEFAULT_HIDDEN))
  const [order, setOrder] = useState<string[]>(() => kpis.map((k) => k.key))
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [styleMap, setStyleMap] = useLocalStorage<MetricStyleMap>(METRIC_STYLE_KEY, {})

  const setStyle = (key: string, style: ChartType | '') =>
    setStyleMap((m) => ({ ...m, [key]: style }))

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
            series={series?.[k.key] ?? []}
            editing={editing}
            jiggleAlt={i % 2 === 1}
            dragging={dragKey === k.key}
            style={styleMap[k.key] ?? ''}
            onStyle={(s) => setStyle(k.key, s)}
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
  series: number[]
  editing: boolean
  jiggleAlt: boolean
  dragging: boolean
  style: ChartType | ''
  onStyle: (s: ChartType | '') => void
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
  style,
  onStyle,
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
        className={`flex h-full flex-col rounded-2xl border bg-card p-4 shadow-card ${
          dragging ? 'border-primary' : 'border-line/70'
        }`}
      >
        {/* row 1 — icon + title, delta on the right */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
              style={{ background: withAlpha(accent, 0.12), color: accent }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                {icon}
              </svg>
            </span>
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted">{kpi.label}</p>
          </div>
          <span
            className="flex shrink-0 items-center gap-0.5 text-xs font-semibold"
            style={{ color: up ? '#1aa367' : '#c12907' }}
          >
            {up ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
            {up ? '+' : ''}
            {Math.round(kpi.delta)}%
          </span>
        </div>

        {/* row 2 — value on the left, the (bigger) viz on the right */}
        <div className="mt-4 grid grid-cols-5 items-center gap-3">
          <div className="col-span-2 min-w-0">
            <p className="flex flex-wrap items-baseline gap-x-1 leading-none">
              <span className="text-[1.75rem] font-bold leading-none text-ink">{formatValue(kpi.value, kpi.fmt)}</span>
              <span className="text-xs text-muted">{kpi.unit}</span>
            </p>
          </div>
          <div className="col-span-3 h-20 overflow-hidden">
            <CardViz kpi={kpi} series={series} color={accent} override={style || undefined} />
          </div>
        </div>

        {/* edit mode — chart-style picker (TASK: choose chart style on batches) */}
        {editing && (
          <div className="mt-3 flex items-center gap-1 rounded-lg bg-page p-1">
            {STYLE_OPTIONS.map(({ key, Glyph, label }) => {
              const active = (style || '') === key
              return (
                <button
                  key={label}
                  onClick={(e) => {
                    e.stopPropagation()
                    onStyle(key)
                  }}
                  title={label}
                  aria-label={label}
                  aria-pressed={active}
                  className={`flex h-6 flex-1 items-center justify-center rounded-md transition-colors ${
                    active ? 'bg-white text-primary shadow-card' : 'text-muted hover:text-ink'
                  }`}
                >
                  <Glyph size={14} />
                </button>
              )
            })}
          </div>
        )}

        {/* footer — caption + details */}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-[0.625rem] font-medium uppercase tracking-wide text-faint">
            {VIZ_CAPTION[kpi.key] ?? 'vs last month'}
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
