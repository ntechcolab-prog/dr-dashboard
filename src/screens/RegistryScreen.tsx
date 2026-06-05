import { useMemo, useState } from 'react'
import SubHeader from '../components/SubHeader'
import { RegistryIcon, Search } from '../icons/Icons'
import { REGISTRY_ROWS, type RegistryRow } from '../data/appData'

const COLUMNS = ['Batch ID', 'Product', 'Start Date', 'End Date', 'Production Line', 'Status', 'Data source']

export default function RegistryScreen() {
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return REGISTRY_ROWS
    return REGISTRY_ROWS.filter((r) =>
      [r.id, r.product, r.line, r.status, r.source].some((v) => v.toLowerCase().includes(q))
    )
  }, [query])

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 p-5">
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
            <button className="rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-primary-700">
              New Batch
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="bg-page/60 text-left text-xs text-muted">
                {COLUMNS.map((c) => (
                  <th key={c} className="px-4 py-3 font-medium first:rounded-l-lg last:rounded-r-lg">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Row key={r.id} row={r} />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-muted">
                    No batches match “{query}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Row({ row }: { row: RegistryRow }) {
  return (
    <tr className="border-b border-line last:border-0 hover:bg-page/50">
      <td className="px-4 py-3.5 font-medium text-ink">{row.id}</td>
      <td className="px-4 py-3.5 text-ink">{row.product}</td>
      <td className="px-4 py-3.5 text-muted">{row.start}</td>
      <td className="px-4 py-3.5 text-muted">{row.end}</td>
      <td className="px-4 py-3.5 text-ink">{row.line}</td>
      <td className="px-4 py-3.5">
        <StatusBadge status={row.status} />
      </td>
      <td className="px-4 py-3.5 text-muted">{row.source}</td>
    </tr>
  )
}

function StatusBadge({ status }: { status: RegistryRow['status'] }) {
  const tone =
    status === 'Completed'
      ? 'text-up'
      : status === 'Cancelled'
      ? 'text-down'
      : 'text-warning'
  const dot =
    status === 'Completed' ? 'bg-up' : status === 'Cancelled' ? 'bg-down' : 'bg-warning'
  return (
    <span className={`flex items-center gap-1.5 text-sm ${tone}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  )
}
