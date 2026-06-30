import { useEffect, useRef, useState } from 'react'
import { Download, FilePdf, ChevronDown } from '../../icons/Icons'
import { printElement } from '../../lib/exportPdf'
import { exportCsv, exportXlsx, type Sheet, type Cell } from '../../lib/exportData'
import { BATCH_METRICS, type MetricStats } from '../../lib/batchMetrics'
import type { Batch } from '../../data/mockData'

// Export with a per-metric / per-batch picker, then PDF / CSV / Excel.
// The sheet mirrors the comparison table: metrics as rows, batches as columns.
interface Props {
  batches: Batch[]
  printId: string
  filenameBase: string
}

export default function AnalysisExport({ batches, printId, filenameBase }: Props) {
  const [open, setOpen] = useState(false)
  const [metricKeys, setMetricKeys] = useState<Set<string>>(new Set(BATCH_METRICS.map((m) => m.key)))
  const [batchIds, setBatchIds] = useState<Set<string>>(new Set(batches.map((b) => b.id)))
  const ref = useRef<HTMLDivElement>(null)

  // Re-sync the batch selection to the current comparison set when it changes.
  const idsKey = batches.map((b) => b.id).join(',')
  useEffect(() => {
    setBatchIds(new Set(batches.map((b) => b.id)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const metrics = BATCH_METRICS.filter((m) => metricKeys.has(m.key))
  const picked = batches.filter((b) => batchIds.has(b.id))
  const ready = metrics.length > 0 && picked.length > 0

  const toggle = (set: Set<string>, key: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set)
    next.has(key) ? next.delete(key) : next.add(key)
    setter(next)
  }

  const buildSheets = (): Sheet[] => {
    const header: Cell[] = ['Metric', 'Unit', ...picked.map((b) => b.id)]
    const rows: Cell[][] = metrics.flatMap((m) => {
      // Sensor parameters export one row each for max / avg / min.
      if (m.stats) {
        const statRow = (suffix: string, sel: (s: MetricStats) => number): Cell[] => [
          `${m.label} (${suffix})`,
          m.unit,
          ...picked.map((b) => Number(sel(m.stats!(b)).toFixed(3))),
        ]
        return [
          statRow('max', (s) => s.max),
          statRow('avg', (s) => s.avg),
          statRow('min', (s) => s.min),
        ]
      }
      return [[m.label, m.unit, ...picked.map((b) => Number(m.value(b).toFixed(3)))]]
    })
    return [{ name: 'Comparison', rows: [header, ...rows] }]
  }

  const run = (fn: () => void | Promise<void>) => {
    Promise.resolve(fn()).catch(() => {})
    setOpen(false)
  }

  return (
    <div className="relative no-print" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-primary bg-transparent px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary-soft"
      >
        <Download size={16} />
        Export
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-72 rounded-lg border border-line bg-white p-3 shadow-pop">
          <Group title="Metrics">
            {BATCH_METRICS.map((m) => (
              <CheckRow
                key={m.key}
                label={`${m.label} (${m.unit})`}
                checked={metricKeys.has(m.key)}
                onChange={() => toggle(metricKeys, m.key, setMetricKeys)}
              />
            ))}
          </Group>
          <Group title="Batches">
            {batches.map((b) => (
              <CheckRow
                key={b.id}
                label={`${b.id} · ${b.machine}`}
                checked={batchIds.has(b.id)}
                onChange={() => toggle(batchIds, b.id, setBatchIds)}
              />
            ))}
          </Group>

          <div className="mt-2 flex items-center gap-2 border-t border-line pt-2">
            <FmtButton label="PDF" icon={<FilePdf size={15} />} onClick={() => run(() => printElement(printId, 'Analysis · Comparison'))} disabled={!ready} />
            <FmtButton label="CSV" onClick={() => run(() => exportCsv(filenameBase, buildSheets()[0]))} disabled={!ready} />
            <FmtButton label="Excel" onClick={() => run(() => exportXlsx(filenameBase, buildSheets()))} disabled={!ready} />
          </div>
        </div>
      )}
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p className="mb-1 text-[0.625rem] font-semibold uppercase tracking-wide text-faint">{title}</p>
      <div className="max-h-40 space-y-0.5 overflow-auto">{children}</div>
    </div>
  )
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm text-ink hover:bg-page">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-3.5 w-3.5 accent-primary" />
      <span className="truncate">{label}</span>
    </label>
  )
}

function FmtButton({ label, icon, onClick, disabled }: { label: string; icon?: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-line px-2 py-1.5 text-xs font-medium text-ink transition-colors enabled:hover:bg-page disabled:cursor-not-allowed disabled:opacity-40"
    >
      {icon}
      {label}
    </button>
  )
}
