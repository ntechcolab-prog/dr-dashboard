'use client'

// Live machines list, fed by the real backend (/v1/machines/resume).
// IRIS-gated, isolated from the legacy mock screens.

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { isAuthenticated } from '@/src/api/tokenStore'
import { listMachinesResumed } from '@/src/api/machines'
import { machineToMachineInfo } from '@/src/api/adapters'
import IrisNav from '@/src/client/iris/IrisNav'
import { ApiRequestError } from '@/src/api/client'
import type { Machine } from '@/src/api/types'

const errMsg = (e: unknown) =>
  e instanceof ApiRequestError ? `${e.status} ${e.code ?? ''} — ${e.message}` : e instanceof Error ? e.message : String(e)

function statusClass(value?: string): string {
  const s = (value ?? '').toUpperCase()
  if (s === 'CRITICAL' || s === 'ERROR') return 'bg-warning/10 text-warning'
  if (s === 'WARNING') return 'bg-amber-500/10 text-amber-600'
  if (s === 'OK' || s === 'NORMAL' || s === 'RUNNING') return 'bg-primary/10 text-primary'
  return 'bg-line/40 text-muted' // NODATA / unknown
}

export default function IrisMachinesPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setAuthed(isAuthenticated()), [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setMachines(await listMachinesResumed())
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authed) load()
  }, [authed, load])

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
      <h1 className="mb-4 text-lg font-semibold text-ink">Machines · live</h1>

      {loading && <p className="text-sm text-muted">Loading…</p>}
      {error && <p className="text-sm text-warning">{error}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {machines.map((m) => {
          const info = machineToMachineInfo(m)
          return (
            <div key={m.id} className="rounded-xl border border-line/70 bg-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{m.name}</p>
                  <p className="truncate text-xs text-muted">
                    {info.family} · {info.model}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${statusClass(m.status?.value)}`}>
                  {m.status?.value ?? '—'}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem] text-muted">
                <span>Line: {m.production_line || '—'}</span>
                {m.commission_number && <span>CN: {m.commission_number}</span>}
                {m.enabled_config?.batch && <span className="text-primary">batch</span>}
              </div>
            </div>
          )
        })}
      </div>

      {!loading && machines.length === 0 && !error && <p className="text-sm text-faint">No machines.</p>}
    </main>
  )
}
