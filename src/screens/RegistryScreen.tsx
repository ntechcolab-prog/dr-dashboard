import { useMemo, useRef, useState, useEffect } from 'react'
import SubHeader from '../components/SubHeader'
import { RegistryIcon, Search } from '../icons/Icons'
import ExportMenu from '../components/ExportMenu'
import BatchEditor from './registry/BatchEditor'
import { REGISTRY_ROWS, type RegistryRow } from '../data/appData'
import { makeDraft, type BatchForm } from '../data/batchForm'
import { useLocalStorage } from '../lib/useLocalStorage'
import type { Sheet } from '../lib/exportData'

const COLUMNS = ['Batch ID', 'Product', 'Start Date', 'End Date', 'Production Line', 'Status', 'Data source']
const REGISTRY_PRINT_ID = 'registry-batch-log-print'

export default function RegistryScreen() {
  const [rows, setRows] = useLocalStorage<RegistryRow[]>('dr-registry-rows', REGISTRY_ROWS)
  const [seq, setSeq] = useLocalStorage<number>('dr-batch-seq', 274)
  const [editing, setEditing] = useState<BatchForm | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      [r.id, r.product, r.line, r.status, r.source, r.start, r.end].some((v) => v.toLowerCase().includes(q)),
    )
  }, [rows, query])

  // Selection helpers — "select all" / "clear" operate on the visible (filtered) rows.
  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const allFilteredSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id))
  const someFilteredSelected = filtered.some((r) => selected.has(r.id))
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) filtered.forEach((r) => next.delete(r.id))
      else filtered.forEach((r) => next.add(r.id))
      return next
    })

  const buildSheets = (): Sheet[] => {
    const picked = rows.filter((r) => selected.has(r.id))
    return [
      {
        name: 'Selected Batches',
        rows: [COLUMNS, ...picked.map((r) => [r.id, r.product, r.start, r.end, r.line, r.status, r.source])],
      },
    ]
  }

  const newBatch = () => setEditing(makeDraft(seq))
  const editExisting = (row: RegistryRow) => setEditing({ ...makeDraft(0), id: row.id })

  const onSave = (form: BatchForm) => {
    const newRow: RegistryRow = {
      id: form.id,
      product: form.product.productType.split(' - ')[1] ?? form.product.productType,
      start: `${form.period.startDate} - ${form.period.startTime}`,
      end: `${form.period.endDate} - ${form.period.endTime}`,
      line: 'Line A - Zeta',
      status: 'In progress',
      source: 'Manual',
    }
    setRows((prev) => {
      const exists = prev.some((r) => r.id === newRow.id)
      return exists ? prev.map((r) => (r.id === newRow.id ? newRow : r)) : [newRow, ...prev]
    })
    if (form.id.startsWith('BA-')) setSeq((s) => s + 1)
  }

  if (editing) {
    return <BatchEditor initial={editing} onBack={() => setEditing(null)} onSave={onSave} />
  }

  return (
    <div className="mx-auto flex max-w-[80rem] flex-col gap-4 p-5">
      <SubHeader Icon={RegistryIcon} title="Registry" />

      <section className="rounded-xl bg-card p-6 shadow-card">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">Batch Log</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">
              <Search size={16} className="text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for …"
                className="w-44 bg-transparent text-sm outline-none placeholder:text-muted"
              />
            </div>
            <ExportMenu
              title="Registry · Selected Batches"
              printId={REGISTRY_PRINT_ID}
              filenameBase="registry-selected-batches"
              sheets={buildSheets}
              disabled={selected.size === 0}
              label={selected.size > 0 ? `Export (${selected.size})` : 'Export'}
              accent
            />
            <button onClick={newBatch} className="rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-primary-700">
              New Batch
            </button>
          </div>
        </div>

        <div className="overflow-x-auto" id={REGISTRY_PRINT_ID}>
          <table className="w-full min-w-[56.75rem] border-collapse text-sm">
            <thead>
              <tr className="bg-page/60 text-left text-xs text-muted">
                <th className="w-10 rounded-l-lg px-4 py-3">
                  <Checkbox
                    checked={allFilteredSelected}
                    indeterminate={!allFilteredSelected && someFilteredSelected}
                    onChange={toggleAll}
                    label={allFilteredSelected ? 'Clear selection' : 'Select all'}
                  />
                </th>
                {COLUMNS.map((c) => (
                  <th key={c} className="px-4 py-3 font-medium last:rounded-r-lg">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const isSel = selected.has(r.id)
                return (
                  <tr
                    key={r.id}
                    onClick={() => editExisting(r)}
                    className={`cursor-pointer border-b border-line last:border-0 hover:bg-page/50 ${isSel ? 'bg-primary/5' : ''}`}
                  >
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={isSel} onChange={() => toggleRow(r.id)} label={`Select ${r.id}`} />
                    </td>
                    <td className="px-4 py-3.5 font-medium text-ink">{r.id}</td>
                    <td className="px-4 py-3.5 text-ink">{r.product}</td>
                    <td className="px-4 py-3.5 text-muted">{r.start}</td>
                    <td className="px-4 py-3.5 text-muted">{r.end}</td>
                    <td className="px-4 py-3.5 text-ink">{r.line}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3.5 text-muted">{r.source}</td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="px-4 py-10 text-center text-muted">No batches match “{query}”.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
  label: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      title={label}
      className="h-4 w-4 cursor-pointer accent-primary align-middle"
    />
  )
}

function StatusBadge({ status }: { status: RegistryRow['status'] }) {
  const tone = status === 'Completed' ? 'text-up' : status === 'Cancelled' ? 'text-down' : 'text-warning'
  const dot = status === 'Completed' ? 'bg-up' : status === 'Cancelled' ? 'bg-down' : 'bg-warning'
  return (
    <span className={`flex items-center gap-1.5 text-sm ${tone}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  )
}
