'use client'

// First real screen fed by the live backend: a batch registry (completed +
// running) with real fields and pagination. IRIS-gated, isolated from the
// legacy mock screens — this is the migration taking shape against real data.

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/src/api/tokenStore'
import { listCompletedBatches, listRunningBatches, type BatchListParams } from '@/src/api/batches'
import { statusToDisplay } from '@/src/api/adapters'
import IrisNav from '@/src/client/iris/IrisNav'
import { ApiRequestError } from '@/src/api/client'
import type { BatchSummary, PaginatedBatches } from '@/src/api/types'

type Tab = 'completed' | 'running'

const errMsg = (e: unknown) =>
  e instanceof ApiRequestError ? `${e.status} ${e.code ?? ''} — ${e.message}` : e instanceof Error ? e.message : String(e)

const fmtDate = (iso?: string) => (iso ? iso.replace('T', ' ').slice(0, 16) : '—')

function statusClass(status: string): string {
  const s = status.toUpperCase()
  if (s.startsWith('COMPLETED') || s === 'CONCLUDED') return 'bg-primary/10 text-primary'
  if (s === 'CANCELLED' || s === 'STOPPED') return 'bg-warning/10 text-warning'
  if (s === 'IN_OPERATION' || s === 'LOADING') return 'bg-blue-500/10 text-blue-600'
  return 'bg-line/40 text-muted'
}

export default function IrisRegistryPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [tab, setTab] = useState<Tab>('completed')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PaginatedBatches | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setAuthed(isAuthenticated()), [])

  const load = useCallback(async (which: Tab, p: number) => {
    setLoading(true)
    setError(null)
    const params: BatchListParams = { page: p, limit: 20, sort: 'start_time', order: 'desc' }
    try {
      const res = which === 'completed' ? await listCompletedBatches(params) : await listRunningBatches(params)
      setData(res)
    } catch (e) {
      setError(errMsg(e))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authed) load(tab, page)
  }, [authed, tab, page, load])

  const switchTab = (t: Tab) => {
    setTab(t)
    setPage(1)
  }

  if (authed === null) return null
  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-page px-4">
        <div className="max-w-sm text-center">
          <p className="mb-4 text-sm text-muted">Not authenticated with IRIS.</p>
          <Link href="/" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
            Go to login
          </Link>
        </div>
      </main>
    )
  }

  const rows: BatchSummary[] = data?.data ?? []
  const totalPages = data?.total_pages ?? 1

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <IrisNav />
      <h1 className="mb-4 text-lg font-semibold text-ink">Batch registry · live</h1>

      <div className="mb-4 flex gap-1">
        {(['completed', 'running'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
              tab === t ? 'bg-primary text-white' : 'text-muted hover:bg-page'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-line/70 bg-card shadow-card">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-line/60 text-[0.6875rem] uppercase tracking-wide text-muted">
              <th className="px-3 py-2.5 font-semibold">Batch</th>
              <th className="px-3 py-2.5 font-semibold">Machine</th>
              <th className="px-3 py-2.5 font-semibold">Recipe</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="px-3 py-2.5 text-right font-semibold">Progress</th>
              <th className="px-3 py-2.5 font-semibold">Start</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr
                key={b.id || b.batch_id}
                onClick={() => b.id && router.push(`/iris-batch/${b.id}`)}
                className="cursor-pointer border-b border-line/40 last:border-0 hover:bg-page/50"
              >
                <td className="px-3 py-2.5 font-medium text-ink">{b.batch_id || b.id}</td>
                <td className="px-3 py-2.5 text-muted">{b.machine}</td>
                <td className="px-3 py-2.5 text-muted">{b.recipe || '—'}</td>
                <td className="px-3 py-2.5">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${statusClass(String(b.status))}`}>
                    {statusToDisplay(String(b.status))}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-muted">
                  {b.progress != null ? `${Math.round(b.progress)}%` : '—'}
                </td>
                <td className="px-3 py-2.5 tabular-nums text-muted">{fmtDate(b.start_time)}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-faint">
                  {error ? '—' : `No ${tab} batches.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {error && <p className="mt-3 text-xs text-warning">{error}</p>}

      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <span>{loading ? 'Loading…' : `Page ${data?.page ?? page} of ${totalPages}`}</span>
        <div className="flex gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={loading || page <= 1}
            className="rounded-md border border-line px-2.5 py-1 enabled:hover:bg-page disabled:opacity-40"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={loading || page >= totalPages}
            className="rounded-md border border-line px-2.5 py-1 enabled:hover:bg-page disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </main>
  )
}
