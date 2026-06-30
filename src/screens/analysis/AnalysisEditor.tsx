import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, Search, Save, Close, BarsGlyph, ChevronDown } from '../../icons/Icons'
import HBars from '../../components/HBars'
import AnalysisExport from '../../components/analysis/AnalysisExport'
import { ALL_BATCHES, type Batch } from '../../data/mockData'
import { BATCH_METRICS, DEFAULT_METRIC_KEYS, formatMetric, extremesFor, type BatchMetricDef } from '../../lib/batchMetrics'

const MAX = 8
// Stable per-batch colors so a batch keeps its color across every mini-chart.
const BATCH_COLORS = ['#46aa9f', '#3b82f6', '#f19909', '#8b5cf6', '#16a34a', '#ef4444', '#06b6d4', '#ec4899']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const PRINT_ID = 'analysis-comparison-print'
const dateLabel = (b: Batch) => `${MONTH_SHORT[b.month]} ${b.day}, ${b.year}`
// Metric value formatted without its unit (the unit is shown once in the header).
const fmtNum = (m: BatchMetricDef, v: number) => formatMetric(m, v).replace(` ${m.unit}`, '')

export interface DraftAnalysis {
  id?: string
  name: string
  batchIds: string[]
}

interface Props {
  initial: DraftAnalysis
  onBack: () => void
  onSave: (a: DraftAnalysis) => void
}

export default function AnalysisEditor({ initial, onBack, onSave }: Props) {
  const [name, setName] = useState(initial.name)
  const [selectedIds, setSelectedIds] = useState<string[]>(initial.batchIds)
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'table' | 'chart'>('table')
  const [metricKeys, setMetricKeys] = useState<Set<string>>(new Set(DEFAULT_METRIC_KEYS))
  const [hoverBatch, setHoverBatch] = useState<string | null>(null)

  const visibleMetrics = useMemo(() => BATCH_METRICS.filter((m) => metricKeys.has(m.key)), [metricKeys])

  const selected = useMemo(
    () => selectedIds.map((id) => ALL_BATCHES.find((b) => b.id === id)).filter(Boolean) as Batch[],
    [selectedIds]
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = q
      ? ALL_BATCHES.filter((b) =>
          [b.id, b.machine, b.recipe, b.productionLine].some((v) => v.toLowerCase().includes(q))
        )
      : ALL_BATCHES
    return base.slice(0, 50)
  }, [query])

  const atMax = selectedIds.length >= MAX
  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= MAX) return prev
      return [...prev, id]
    })

  const save = () => onSave({ id: initial.id, name: name.trim() || 'Untitled analysis', batchIds: selectedIds })

  return (
    <div className="mx-auto flex max-w-[80rem] flex-col gap-4 p-5">
      {/* editor header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted hover:text-ink" aria-label="Back">
            <ChevronLeft size={18} />
          </button>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Analysis name"
            className="rounded-lg border border-line bg-card px-3 py-2 text-sm font-medium text-ink outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <AnalysisExport batches={selected} printId={PRINT_ID} filenameBase={`analysis-${(name || 'comparison').toLowerCase().replace(/\s+/g, '-')}`} />
          <button
            onClick={save}
            disabled={selectedIds.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors enabled:hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save size={15} />
            Save
          </button>
        </div>
      </div>

      {/* batch picker */}
      <section className="rounded-xl bg-card p-5 shadow-card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">
            Select batches <span className="ml-1 font-normal text-muted">({selectedIds.length}/{MAX})</span>
          </h2>
          <div className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">
            <Search size={16} className="text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search id, machine, recipe …"
              className="w-56 bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>
        </div>

        {/* selected chips */}
        {selected.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selected.map((b) => (
              <span key={b.id} className="flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
                {b.id} · {b.machine}
                <button onClick={() => toggle(b.id)} className="text-primary/70 hover:text-primary" aria-label={`Remove ${b.id}`}>
                  <Close size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* results */}
        <div className="max-h-56 overflow-auto rounded-lg border border-line">
          <table className="w-full text-sm">
            <tbody>
              {results.map((b) => {
                const on = selectedIds.includes(b.id)
                const disabled = !on && atMax
                return (
                  <tr
                    key={b.id}
                    onClick={() => !disabled && toggle(b.id)}
                    className={`border-b border-line last:border-0 ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:bg-page/60'} ${on ? 'bg-primary/5' : ''}`}
                  >
                    <td className="w-9 px-3 py-2">
                      <input type="checkbox" checked={on} disabled={disabled} onChange={() => toggle(b.id)} onClick={(e) => e.stopPropagation()} className="h-4 w-4 accent-primary" />
                    </td>
                    <td className="px-2 py-2 font-medium text-ink">{b.id}</td>
                    <td className="px-2 py-2 text-ink">{b.machine}</td>
                    <td className="px-2 py-2 text-muted">{b.recipe}</td>
                    <td className="px-2 py-2 text-muted">{dateLabel(b)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {atMax && <p className="mt-2 text-xs text-warning">Maximum of {MAX} batches reached — remove one to add another.</p>}
      </section>

      {/* comparison */}
      {selected.length < 2 ? (
        <section className="rounded-xl border border-dashed border-line bg-card/50 p-10 text-center">
          <BarsGlyph size={28} />
          <p className="mt-2 text-sm text-muted">Select at least 2 batches to compare.</p>
        </section>
      ) : (
        <section className="rounded-xl bg-card p-5 shadow-card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">Comparison</h2>
            <div className="flex items-center gap-2">
              <MetricPicker selected={metricKeys} onChange={setMetricKeys} />
              <div className="flex rounded-lg border border-line p-0.5">
                {(['table', 'chart'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${view === v ? 'bg-primary text-white' : 'text-muted hover:text-ink'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {visibleMetrics.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No metrics selected — pick metrics to compare.</p>
          ) : (
            <div id={PRINT_ID}>
              {view === 'table' ? (
                <ComparisonTable batches={selected} metrics={visibleMetrics} hoverBatch={hoverBatch} onHoverBatch={setHoverBatch} />
              ) : (
                <ChartGrid batches={selected} metrics={visibleMetrics} hoverBatch={hoverBatch} onHoverBatch={setHoverBatch} />
              )}
            </div>
          )}

          <Insights batches={selected} metrics={visibleMetrics} onHoverBatch={setHoverBatch} />
        </section>
      )}
    </div>
  )
}

function ComparisonTable({
  batches,
  metrics,
  hoverBatch,
  onHoverBatch,
}: {
  batches: Batch[]
  metrics: BatchMetricDef[]
  hoverBatch: string | null
  onHoverBatch: (id: string | null) => void
}) {
  const colCls = (id: string) => (hoverBatch === id ? 'bg-primary/10' : '')
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-page/60 text-left text-xs text-muted">
            <th className="rounded-l-lg px-4 py-3 font-medium">Metric</th>
            {batches.map((b) => (
              <th
                key={b.id}
                onMouseEnter={() => onHoverBatch(b.id)}
                onMouseLeave={() => onHoverBatch(null)}
                className={`cursor-default px-4 py-3 text-right font-medium last:rounded-r-lg ${colCls(b.id)}`}
              >
                {b.id}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => {
            const vals = batches.map((b) => m.value(b))
            const max = Math.max(...vals)
            const min = Math.min(...vals)
            const spread = max !== min
            return (
              <tr key={m.key} className="border-b border-line last:border-0">
                <td className="px-4 py-3 text-ink">
                  {m.label} <span className="text-faint">({m.unit})</span>
                </td>
                {batches.map((b, i) => {
                  const isMax = spread && vals[i] === max
                  const isMin = spread && vals[i] === min
                  const st = m.stats ? m.stats(b) : null
                  return (
                    <td
                      key={b.id}
                      onMouseEnter={() => onHoverBatch(b.id)}
                      onMouseLeave={() => onHoverBatch(null)}
                      className={`px-4 py-3 text-right tabular-nums text-ink ${colCls(b.id)}`}
                    >
                      {st ? (
                        <div className="flex flex-col items-end gap-0.5 leading-tight">
                          {([
                            ['Max', st.max, false] as const,
                            ['Avg', st.avg, true] as const,
                            ['Min', st.min, false] as const,
                          ]).map(([lbl, val, isAvg]) => (
                            <span key={lbl} className={isAvg && isMax ? 'font-semibold text-up' : isAvg && isMin ? 'font-semibold text-down' : ''}>
                              <span className="mr-1 text-[0.625rem] uppercase tracking-wide text-faint">{lbl}</span>
                              {fmtNum(m, val)}
                              {isAvg && isMax && <span className="ml-1 text-[0.625rem]">▲</span>}
                              {isAvg && isMin && <span className="ml-1 text-[0.625rem]">▼</span>}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className={isMax ? 'font-semibold text-up' : isMin ? 'font-semibold text-down' : ''}>
                          {fmtNum(m, vals[i])}
                          {isMax && <span className="ml-1 text-[0.625rem]">▲</span>}
                          {isMin && <span className="ml-1 text-[0.625rem]">▼</span>}
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-2 text-[0.6875rem] text-faint">
        <span className="text-up">▲</span> highest · <span className="text-down">▼</span> lowest per metric across the selected batches. Sensor parameters report max / min / avg per batch (compared by average).
      </p>
    </div>
  )
}

function Insights({
  batches,
  metrics,
  onHoverBatch,
}: {
  batches: Batch[]
  metrics: BatchMetricDef[]
  onHoverBatch: (id: string | null) => void
}) {
  const BatchTag = ({ id }: { id: string }) => (
    <span
      onMouseEnter={() => onHoverBatch(id)}
      onMouseLeave={() => onHoverBatch(null)}
      className="cursor-default rounded px-1 hover:bg-primary/10"
    >
      {id}
    </span>
  )
  return (
    <div className="mt-5 border-t border-line pt-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink">Highlights</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => {
          const ext = extremesFor(m, batches)
          if (!ext) return null
          return (
            <div key={m.key} className="rounded-lg border border-line/70 bg-page/40 p-3">
              <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-muted">{m.label}</p>
              <p className="mt-1.5 text-xs text-ink">
                <span className="text-up">High</span> <BatchTag id={ext.maxId} /> · <span className="font-semibold">{formatMetric(m, ext.maxValue)}</span>
              </p>
              <p className="mt-0.5 text-xs text-ink">
                <span className="text-down">Low</span> <BatchTag id={ext.minId} /> · <span className="font-semibold">{formatMetric(m, ext.minValue)}</span>
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Small-multiples: one mini bar chart per metric, all batches compared at once.
function ChartGrid({
  batches,
  metrics,
  hoverBatch,
  onHoverBatch,
}: {
  batches: Batch[]
  metrics: BatchMetricDef[]
  hoverBatch: string | null
  onHoverBatch: (id: string | null) => void
}) {
  const colorOf = (i: number) => BATCH_COLORS[i % BATCH_COLORS.length]
  return (
    <div className="py-1">
      {/* batch color legend */}
      <div className="mb-4 flex flex-wrap gap-3">
        {batches.map((b, i) => (
          <span
            key={b.id}
            onMouseEnter={() => onHoverBatch(b.id)}
            onMouseLeave={() => onHoverBatch(null)}
            className={`flex cursor-default items-center gap-1.5 text-xs transition-opacity ${hoverBatch && hoverBatch !== b.id ? 'opacity-40' : ''}`}
          >
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colorOf(i) }} />
            <span className="font-medium text-ink">{b.id}</span>
            <span className="text-muted">{b.machine}</span>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.key} className="rounded-lg border border-line/70 bg-page/30 p-3">
            <p className="mb-2 text-xs font-medium text-ink">
              {m.label} <span className="text-faint">({m.unit})</span>
            </p>
            <HBars
              items={batches.map((b, i) => {
                const v = m.value(b)
                const st = m.stats ? m.stats(b) : null
                // Sensor params bar by their average, but spell out max / min / avg.
                const label = st
                  ? `${b.id}  avg ${fmtNum(m, st.avg)} · min ${fmtNum(m, st.min)} · max ${fmtNum(m, st.max)}`
                  : `${b.id}  ${fmtNum(m, v)}`
                return {
                  label,
                  value: Math.round(v * 100) / 100,
                  leftLabel: '',
                  color: colorOf(i),
                  dim: hoverBatch ? b.id !== hoverBatch : undefined,
                }
              })}
              onHover={(i) => onHoverBatch(i == null ? null : batches[i].id)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Grouped checkbox dropdown to choose which metrics appear in the comparison.
function MetricPicker({ selected, onChange }: { selected: Set<string>; onChange: (s: Set<string>) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const groups = useMemo(() => {
    const map = new Map<string, BatchMetricDef[]>()
    for (const m of BATCH_METRICS) {
      const arr = map.get(m.group) ?? []
      arr.push(m)
      map.set(m.group, arr)
    }
    return [...map.entries()]
  }, [])

  const toggle = (key: string) => {
    const next = new Set(selected)
    next.has(key) ? next.delete(key) : next.add(key)
    onChange(next)
  }
  const toggleGroup = (metrics: BatchMetricDef[]) => {
    const allOn = metrics.every((m) => selected.has(m.key))
    const next = new Set(selected)
    metrics.forEach((m) => (allOn ? next.delete(m.key) : next.add(m.key)))
    onChange(next)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-ink"
      >
        Metrics ({selected.size})
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 max-h-[26rem] w-72 overflow-auto rounded-lg border border-line bg-white p-3 shadow-pop">
          {groups.map(([group, metrics]) => {
            const allOn = metrics.every((m) => selected.has(m.key))
            return (
              <div key={group} className="mb-2">
                <button
                  onClick={() => toggleGroup(metrics)}
                  className="mb-1 flex w-full items-center justify-between text-[0.625rem] font-semibold uppercase tracking-wide text-faint hover:text-ink"
                >
                  {group}
                  <span className="text-primary">{allOn ? 'Clear' : 'All'}</span>
                </button>
                <div className="space-y-0.5">
                  {metrics.map((m) => (
                    <label key={m.key} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm text-ink hover:bg-page">
                      <input type="checkbox" checked={selected.has(m.key)} onChange={() => toggle(m.key)} className="h-3.5 w-3.5 accent-primary" />
                      <span className="truncate">
                        {m.label} <span className="text-faint">({m.unit})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
