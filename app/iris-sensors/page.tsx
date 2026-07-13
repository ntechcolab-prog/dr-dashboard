'use client'

// Live sensor readings from the real backend. The process telemetry the mock
// used to fake (speed, current, power, temps, flows) comes from here:
//   /v2/filters/machine/{id}/sensors  → sensor types
//   /v1/metrics/last?metrics=<type>,<unit>  → latest values
// IRIS-gated.

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { isAuthenticated } from '@/src/api/tokenStore'
import { listMachinesResumed } from '@/src/api/machines'
import { machineSensorList, latestSensorValues, type LastMetric } from '@/src/api/metrics'
import { metricParam } from '@/src/api/sensorUnits'
import IrisNav from '@/src/client/iris/IrisNav'
import { ApiRequestError } from '@/src/api/client'
import type { Machine } from '@/src/api/types'

const errMsg = (e: unknown) =>
  e instanceof ApiRequestError ? `${e.status} ${e.code ?? ''} — ${e.message}` : e instanceof Error ? e.message : String(e)

const fmtVal = (n?: number) => (n == null ? '—' : Math.abs(n) >= 100 ? Math.round(n).toLocaleString('en-US') : n.toFixed(2))

export default function IrisSensorsPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [machines, setMachines] = useState<Machine[]>([])
  const [selected, setSelected] = useState('')
  const [metrics, setMetrics] = useState<LastMetric[]>([])
  const [sensorCount, setSensorCount] = useState(0)
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

  const load = useCallback(async (machineId: string) => {
    setLoading(true)
    setError(null)
    setMetrics([])
    try {
      const { sensors } = await machineSensorList(machineId)
      setSensorCount(sensors.length)
      if (sensors.length === 0) return
      const params = sensors.map((s) => metricParam(s.type))
      const last = await latestSensorValues(machineId, params)
      setMetrics(last)
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selected) load(selected)
  }, [selected, load])

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
      <h1 className="mb-4 text-lg font-semibold text-ink">Sensors · live</h1>

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

      {loading && <p className="text-sm text-muted">Loading…</p>}
      {error && <p className="text-sm text-warning">{error}</p>}

      {!loading && !error && (
        <p className="mb-3 text-xs text-muted">
          {sensorCount} sensors configured · {metrics.length} reporting values
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {metrics.map((m) => {
          const latest = m.values?.[m.values.length - 1]
          return (
            <div key={m.type} className="rounded-xl border border-line/70 bg-card p-3 shadow-card">
              <p className="truncate text-[0.6875rem] text-muted" title={m.name}>
                {m.name}
              </p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-ink">
                {fmtVal(latest?.value)}
                <span className="ml-1 text-xs font-normal text-muted">{m.units && m.units !== 'n/a' ? m.units : ''}</span>
              </p>
              {latest && <p className="mt-0.5 text-[0.625rem] text-faint">{latest.time.replace('T', ' ').slice(0, 16)}</p>}
            </div>
          )
        })}
      </div>

      {!loading && !error && metrics.length === 0 && (
        <p className="text-sm text-faint">No sensors currently reporting values for this machine.</p>
      )}
    </main>
  )
}
