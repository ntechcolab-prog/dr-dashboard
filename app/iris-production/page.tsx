'use client'

// Per-machine production dashboard with OEE (Availability × Performance ×
// Quality) computed at runtime from the real production-metrics endpoint.
//
// Quality is fully real (completed ÷ total). Availability and Performance use
// placeholder business targets (planned time, ideal rate) until those are wired
// — they are labelled as such. IRIS-gated.

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { isAuthenticated } from '@/src/api/tokenStore'
import { listMachinesResumed, getProductionMetrics } from '@/src/api/machines'
import { oeeFromProduction } from '@/src/api/adapters'
import { toPct } from '@/src/lib/oee'
import IrisNav from '@/src/client/iris/IrisNav'
import { ApiRequestError } from '@/src/api/client'
import type { Machine, MachineProductionMetrics, ProductionMetrics } from '@/src/api/types'

const errMsg = (e: unknown) =>
  e instanceof ApiRequestError ? `${e.status} ${e.code ?? ''} — ${e.message}` : e instanceof Error ? e.message : String(e)

// Placeholder planned-time per window (business config pending).
const PLANNED_HOURS: Record<string, number> = { last_week: 40, up_to_today: 40, last_month: 8 * 22 }
const IDEAL_RATE = 5 // t/h placeholder

const WINDOWS: { key: keyof MachineProductionMetrics; label: string }[] = [
  { key: 'up_to_today', label: 'Up to today' },
  { key: 'last_week', label: 'Last week' },
  { key: 'last_month', label: 'Last month' },
]

function OeeCard({ label, pm, plannedHours }: { label: string; pm: ProductionMetrics; plannedHours: number }) {
  const r = oeeFromProduction(pm, { plannedTimeHours: plannedHours, idealRate: IDEAL_RATE })
  const b = pm.batches
  const cell = (k: string, v: string) => (
    <div>
      <p className="text-[0.625rem] uppercase tracking-wide text-muted">{k}</p>
      <p className="text-sm font-semibold tabular-nums text-ink">{v}</p>
    </div>
  )
  return (
    <div className="rounded-xl border border-line/70 bg-card p-4 shadow-card">
      <p className="mb-2 text-[0.8125rem] font-semibold uppercase tracking-wide text-ink">{label}</p>
      <div className="mb-3 flex items-end gap-3">
        <div>
          <p className="text-[0.625rem] uppercase tracking-wide text-muted">OEE</p>
          <p className="text-3xl font-bold tabular-nums text-primary">{toPct(r.oee)}%</p>
        </div>
        <div className="mb-1 flex gap-3 text-xs text-muted">
          <span>A {toPct(r.availability)}%</span>
          <span>P {toPct(r.performance)}%</span>
          <span>Q {toPct(r.quality)}%</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {cell('Completed', String(b?.completed ?? 0))}
        {cell('Cancelled', String(b?.cancelled ?? 0))}
        {cell('Total', String(b?.total ?? 0))}
        {cell('Alarms', String(pm.alarms ?? 0))}
        {cell('Alerts', String(pm.alerts ?? 0))}
        {cell('Hour meter', pm.hour_meter ?? '—')}
      </div>
    </div>
  )
}

export default function IrisProductionPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [machines, setMachines] = useState<Machine[]>([])
  const [selected, setSelected] = useState<string>('')
  const [metrics, setMetrics] = useState<MachineProductionMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setAuthed(isAuthenticated()), [])

  useEffect(() => {
    if (!authed) return
    listMachinesResumed()
      .then((ms) => {
        setMachines(ms)
        if (ms[0]) setSelected(ms[0].id)
      })
      .catch((e) => setError(errMsg(e)))
  }, [authed])

  const loadMetrics = useCallback(async (machineId: string) => {
    setLoading(true)
    setError(null)
    setMetrics(null)
    try {
      setMetrics(await getProductionMetrics(machineId))
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selected) loadMetrics(selected)
  }, [selected, loadMetrics])

  const selectedName = useMemo(() => machines.find((m) => m.id === selected)?.name ?? '', [machines, selected])

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

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <IrisNav />
      <h1 className="mb-4 text-lg font-semibold text-ink">Production · OEE (live)</h1>

      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="mb-4 w-full max-w-xs rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink sm:w-auto"
      >
        {machines.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>

      {loading && <p className="text-sm text-muted">Loading {selectedName}…</p>}
      {error && <p className="text-sm text-warning">{error}</p>}

      {metrics && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {WINDOWS.map(({ key, label }) => (
            <OeeCard key={key} label={label} pm={metrics[key]} plannedHours={PLANNED_HOURS[key]} />
          ))}
        </div>
      )}

      <p className="mt-4 text-[0.6875rem] text-faint">
        Quality is real (completed ÷ total). Availability &amp; Performance use placeholder targets (planned time,
        ideal rate {IDEAL_RATE} t/h) until the business config is wired.
      </p>
    </main>
  )
}
