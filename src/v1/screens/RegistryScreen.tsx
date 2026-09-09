import { useMemo, useRef, useState, useEffect } from 'react'
import SubHeader from '../components/SubHeader'
import { ChevronLeft, ChevronRight, RegistryIcon, Search } from '../icons/Icons'
import ExportMenu from '../components/ExportMenu'
import BatchEditor from './registry/BatchEditor'
import { REGISTRY_ROWS, type RegistryRow } from '../../shared/data/appData'
import { makeDraft, type BatchForm } from '../../shared/data/batchForm'
import { useLocalStorage } from '../../shared/lib/useLocalStorage'
import type { Sheet } from '../../shared/lib/exportData'

const COLUMNS = ['Batch ID', 'Recipe', 'Start Date', 'End Date', 'Machine', 'Status']
const REGISTRY_PRINT_ID = 'registry-batch-log-print'
const PAGE_SIZE = 10

export default function RegistryScreen({ restricted = false }: { restricted?: boolean }) {
  const [rows, setRows] = useLocalStorage<RegistryRow[]>('dr-registry-rows', REGISTRY_ROWS)
  const [seq, setSeq] = useLocalStorage<number>('dr-batch-seq', 274)
  const [editing, setEditing] = useState<BatchForm | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      [r.id, r.product, r.line, r.status, r.start, r.end].some((v) => v.toLowerCase().includes(q)),
    )
  }, [rows, query])

  // Paginated view. The page index is clamped instead of reset so that deleting
  // or filtering rows away can never leave the table showing an empty page.
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const visible = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)
  useEffect(() => {
    setPage(0)
  }, [query])

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
        rows: [COLUMNS, ...picked.map((r) => [r.id, r.product, r.start, r.end, r.line, r.status])],
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
      line: 'Zeta 10',
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
    return <BatchEditor initial={editing} onBack={() => setEditing(null)} onSave={onSave} restricted={restricted} />
  }

  return (
    <div className="mx-auto flex max-w-[80rem] flex-col gap-4 p-5">
      <SubHeader Icon={RegistryIcon} title="Registry" />

      <section className="rounded-xl bg-card p-6 shadow-card">
        <div className="mb-5 flex flex-wrap items-center justify-end gap-3">
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
            {!restricted && (
              <ExportMenu
                title="Registry · Selected Batches"
                printId={REGISTRY_PRINT_ID}
                filenameBase="registry-selected-batches"
                sheets={buildSheets}
                disabled={selected.size === 0}
                label={selected.size > 0 ? `Export (${selected.size})` : 'Export'}
                accent
              />
            )}
            <button onClick={newBatch} className="rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-primary-700">
              New Batch
            </button>
          </div>
        </div>

        <div className="overflow-x-auto" id={REGISTRY_PRINT_ID}>
          <table className="w-full min-w-[56.75rem] border-collapse text-sm">
            <thead>
              <tr className="bg-page/60 text-left text-xs text-muted">
                {!restricted && (
                  <th className="w-10 rounded-l-lg px-6 py-3">
                    <Checkbox
                      checked={allFilteredSelected}
                      indeterminate={!allFilteredSelected && someFilteredSelected}
                      onChange={toggleAll}
                      label={allFilteredSelected ? 'Clear selection' : 'Select all'}
                    />
                  </th>
                )}
                {COLUMNS.map((c) => (
                  <th key={c} className="whitespace-nowrap px-6 py-3 font-medium last:rounded-r-lg">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const isSel = selected.has(r.id)
                return (
                  <tr
                    key={r.id}
                    onClick={() => editExisting(r)}
                    className={`cursor-pointer border-b border-line last:border-0 hover:bg-page/50 ${isSel ? 'bg-primary/5' : ''}`}
                  >
                    {!restricted && (
                      <td className="px-6 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSel} onChange={() => toggleRow(r.id)} label={`Select ${r.id}`} />
                      </td>
                    )}
                    <td className="whitespace-nowrap px-6 py-3.5 font-medium text-ink">{r.id}</td>
                    <td className="px-6 py-3.5 text-ink">{r.product}</td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-muted">{r.start}</td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-muted">{r.end}</td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-ink">{r.line}</td>
                    <td className="px-6 py-3.5"><StatusBadge status={r.status} /></td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={restricted ? COLUMNS.length : COLUMNS.length + 1} className="px-6 py-10 text-center text-muted">No batches match “{query}”.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > PAGE_SIZE && (
          <Pagination
            page={current}
            pageCount={pageCount}
            from={current * PAGE_SIZE + 1}
            to={current * PAGE_SIZE + visible.length}
            total={filtered.length}
            onPage={setPage}
          />
        )}
      </section>
    </div>
  )
}

function Pagination({
  page,
  pageCount,
  from,
  to,
  total,
  onPage,
}: {
  page: number
  pageCount: number
  from: number
  to: number
  total: number
  onPage: (p: number) => void
}) {
  const btn = 'flex h-8 min-w-8 items-center justify-center rounded-lg border border-line px-2 text-xs font-medium transition-colors'
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
      <p className="text-xs text-muted">
        Showing {from}–{to} of {total} batches
      </p>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onPage(page - 1)} disabled={page === 0} className={`${btn} text-muted enabled:hover:text-ink disabled:opacity-40`} aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: pageCount }, (_, i) => (
          <button
            key={i}
            onClick={() => onPage(i)}
            aria-current={i === page ? 'page' : undefined}
            className={`${btn} ${i === page ? 'border-primary bg-primary text-white' : 'text-muted hover:text-ink'}`}
          >
            {i + 1}
          </button>
        ))}
        <button onClick={() => onPage(page + 1)} disabled={page >= pageCount - 1} className={`${btn} text-muted enabled:hover:text-ink disabled:opacity-40`} aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </div>
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
