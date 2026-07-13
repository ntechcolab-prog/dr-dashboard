'use client'

// Alarm & alert history from the real backend.
//   /v2/machines/metrics/alarm-history · /v2/machines/metrics/alert-history
// IRIS-gated.

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { isAuthenticated } from '@/src/api/tokenStore'
import { alarmHistory, alertHistory } from '@/src/api/alarms'
import IrisNav from '@/src/client/iris/IrisNav'
import { ApiRequestError } from '@/src/api/client'
import type { MetricAlarm, MetricAlert } from '@/src/api/types'

type Tab = 'alarms' | 'alerts'

const errMsg = (e: unknown) =>
  e instanceof ApiRequestError ? `${e.status} ${e.code ?? ''} — ${e.message}` : e instanceof Error ? e.message : String(e)

const fmtDate = (iso?: string | null) => (iso ? iso.replace('T', ' ').slice(0, 16) : '—')

export default function IrisAlarmsPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [tab, setTab] = useState<Tab>('alarms')
  const [page, setPage] = useState(1)
  const [alarms, setAlarms] = useState<MetricAlarm[]>([])
  const [alerts, setAlerts] = useState<MetricAlert[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setAuthed(isAuthenticated()), [])

  const load = useCallback(async (which: Tab, p: number) => {
    setLoading(true)
    setError(null)
    try {
      if (which === 'alarms') {
        const res = await alarmHistory({ page: p, limit: 20 })
        setAlarms(res.data)
        setTotalPages(res.total_pages)
      } else {
        const res = await alertHistory({ page: p, limit: 20 })
        setAlerts(res.data)
        setTotalPages(res.total_pages)
      }
    } catch (e) {
      setError(errMsg(e))
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

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <IrisNav />
      <h1 className="mb-4 text-lg font-semibold text-ink">Alarms &amp; alerts · live</h1>

      <div className="mb-4 flex gap-1">
        {(['alarms', 'alerts'] as Tab[]).map((t) => (
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
          {tab === 'alarms' ? (
            <>
              <thead>
                <tr className="border-b border-line/60 text-[0.6875rem] uppercase tracking-wide text-muted">
                  <th className="px-3 py-2.5 font-semibold">Machine</th>
                  <th className="px-3 py-2.5 font-semibold">Message</th>
                  <th className="px-3 py-2.5 font-semibold">State</th>
                  <th className="px-3 py-2.5 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {alarms.map((a) => (
                  <tr key={a.id} className="border-b border-line/40 last:border-0">
                    <td className="whitespace-nowrap px-3 py-2.5 font-medium text-ink">{a.machine_name}</td>
                    <td className="px-3 py-2.5 text-muted">{a.message}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${
                          a.is_active ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {a.is_active ? 'Active' : a.resolved ? 'Resolved' : 'Inactive'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-muted">{fmtDate(a.time)}</td>
                  </tr>
                ))}
              </tbody>
            </>
          ) : (
            <>
              <thead>
                <tr className="border-b border-line/60 text-[0.6875rem] uppercase tracking-wide text-muted">
                  <th className="px-3 py-2.5 font-semibold">Machine</th>
                  <th className="px-3 py-2.5 font-semibold">Message</th>
                  <th className="px-3 py-2.5 font-semibold">Target</th>
                  <th className="px-3 py-2.5 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id} className="border-b border-line/40 last:border-0">
                    <td className="whitespace-nowrap px-3 py-2.5 font-medium text-ink">{a.machine_name}</td>
                    <td className="px-3 py-2.5 text-muted">{a.message}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-muted">{a.alarm_target ?? '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-muted">{fmtDate(a.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </table>
      </div>

      {error && <p className="mt-3 text-xs text-warning">{error}</p>}

      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <span>{loading ? 'Loading…' : `Page ${page} of ${totalPages}`}</span>
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
