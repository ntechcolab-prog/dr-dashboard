'use client'

// Integration diagnostic. Once authenticated (via /iris-login), this exercises
// the whole real chain — token → client → domain endpoints → adapters → OEE —
// and dumps the raw results, so the integration can be validated end-to-end
// against staging without touching any production screen.

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { currentClaims, enabledFeatures, activeOrganizationId, logout } from '@/src/api/auth'
import { isAuthenticated } from '@/src/api/tokenStore'
import { listMachinesResumed, getProductionMetrics } from '@/src/api/machines'
import { listCompletedBatches } from '@/src/api/batches'
import { oeeFromProduction } from '@/src/api/adapters'
import { ApiRequestError } from '@/src/api/client'
import { toPct } from '@/src/lib/oee'
import type { Machine } from '@/src/api/types'

interface Probe<T> {
  status: 'idle' | 'loading' | 'ok' | 'error'
  data?: T
  error?: string
}

const errMsg = (e: unknown) =>
  e instanceof ApiRequestError ? `${e.status} ${e.code ?? ''} — ${e.message}` : e instanceof Error ? e.message : String(e)

function Panel({ title, probe }: { title: string; probe: Probe<unknown> }) {
  return (
    <section className="rounded-xl border border-line/70 bg-card p-4 shadow-card">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <span
          className={`rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${
            probe.status === 'ok'
              ? 'bg-primary/10 text-primary'
              : probe.status === 'error'
                ? 'bg-warning/10 text-warning'
                : 'bg-line/40 text-muted'
          }`}
        >
          {probe.status}
        </span>
      </div>
      {probe.error && <p className="mb-2 text-xs text-warning">{probe.error}</p>}
      {probe.data != null && (
        <pre className="max-h-72 overflow-auto rounded-lg bg-page/60 p-3 text-[0.6875rem] leading-relaxed text-ink">
          {JSON.stringify(probe.data, null, 2)}
        </pre>
      )}
    </section>
  )
}

export default function IrisStatusPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [machines, setMachines] = useState<Probe<Machine[]>>({ status: 'idle' })
  const [batches, setBatches] = useState<Probe<unknown>>({ status: 'idle' })
  const [oee, setOee] = useState<Probe<unknown>>({ status: 'idle' })

  useEffect(() => setAuthed(isAuthenticated()), [])

  const run = useCallback(async () => {
    setMachines({ status: 'loading' })
    setBatches({ status: 'loading' })
    setOee({ status: 'idle' })

    let firstMachineId: string | undefined
    try {
      const list = await listMachinesResumed()
      firstMachineId = list[0]?.id
      setMachines({ status: 'ok', data: list })
    } catch (e) {
      setMachines({ status: 'error', error: errMsg(e) })
    }

    try {
      const page = await listCompletedBatches({ limit: 5 })
      setBatches({ status: 'ok', data: page })
    } catch (e) {
      setBatches({ status: 'error', error: errMsg(e) })
    }

    if (firstMachineId) {
      setOee({ status: 'loading' })
      try {
        const pm = await getProductionMetrics(firstMachineId)
        // Placeholder business targets until planned time / ideal rate are wired.
        const result = oeeFromProduction(pm.last_month, { plannedTimeHours: 8 * 22, idealRate: 5 })
        setOee({
          status: 'ok',
          data: {
            machineId: firstMachineId,
            production_metrics_last_month: pm.last_month,
            oee: {
              availability: toPct(result.availability),
              performance: toPct(result.performance),
              quality: toPct(result.quality),
              oee: toPct(result.oee),
            },
          },
        })
      } catch (e) {
        setOee({ status: 'error', error: errMsg(e) })
      }
    }
  }, [])

  if (authed === null) return null

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-page px-4">
        <div className="max-w-sm text-center">
          <p className="mb-4 text-sm text-muted">Not authenticated with IRIS.</p>
          <Link href="/iris-login" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
            Go to login
          </Link>
        </div>
      </main>
    )
  }

  const claims = currentClaims()

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">Integration diagnostic</h1>
        <button onClick={() => logout().then(() => setAuthed(false))} className="text-xs text-muted hover:text-ink">
          Log out
        </button>
      </div>

      <section className="mb-4 rounded-xl border border-line/70 bg-card p-4 shadow-card">
        <h2 className="mb-2 text-sm font-semibold text-ink">Session</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt className="text-muted">Email</dt>
          <dd className="text-ink">{claims?.['e-mail'] ?? '—'}</dd>
          <dt className="text-muted">Org (active)</dt>
          <dd className="text-ink">{activeOrganizationId() ?? '—'}</dd>
          <dt className="text-muted">Features</dt>
          <dd className="text-ink">{enabledFeatures().join(', ') || '—'}</dd>
        </dl>
      </section>

      <button
        onClick={run}
        className="mb-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
      >
        Run endpoint checks
      </button>

      <div className="flex flex-col gap-4">
        <Panel title="GET /v1/machines/resume" probe={machines} />
        <Panel title="GET /v1/batch/completed?limit=5" probe={batches} />
        <Panel title="production-metrics → OEE (computed)" probe={oee} />
      </div>
    </main>
  )
}
