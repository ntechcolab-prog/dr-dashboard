'use client'

// Sensor trends over time, from the real backend (/v1/metrics/history/chart-data),
// rendered with ECharts. Only sensors currently reporting are charted.
// IRIS-gated.

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { isAuthenticated } from '@/src/api/tokenStore'
import { listMachinesResumed } from '@/src/api/machines'
import { machineSensorList, latestSensorValues, sensorHistoryChart, type ChartDataPoint } from '@/src/api/metrics'
import { metricParam } from '@/src/api/sensorUnits'
import IrisNav from '@/src/client/iris/IrisNav'
import { ApiRequestError } from '@/src/api/client'
import type { Machine } from '@/src/api/types'
import type { EChartsOption } from 'echarts'

// Client-only (ECharts touches the DOM) — keep it out of server prerender.
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

const errMsg = (e: unknown) =>
  e instanceof ApiRequestError ? `${e.status} ${e.code ?? ''} — ${e.message}` : e instanceof Error ? e.message : String(e)

const DAYS = 3

export default function IrisTrendsPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [machines, setMachines] = useState<Machine[]>([])
  const [selected, setSelected] = useState('')
  const [points, setPoints] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

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
    setNote(null)
    setPoints([])
    try {
      const { sensors } = await machineSensorList(machineId)
      const params = sensors.map((s) => metricParam(s.type))
      // Only sensors that currently report a value have history worth charting.
      const last = params.length ? await latestSensorValues(machineId, params) : []
      const reporting = last.map((m) => `${m.type},${m.units || 'n/a'}`)
      if (reporting.length === 0) {
        setNote('No sensors currently reporting values for this machine.')
        return
      }
      const to = new Date()
      const from = new Date(to.getTime() - DAYS * 86400000)
      const { chartData } = await sensorHistoryChart(machineId, reporting, {
        from: from.toISOString(),
        to: to.toISOString(),
      })
      setPoints(chartData ?? [])
      if (!chartData?.length) setNote(`No readings in the last ${DAYS} days.`)
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selected) load(selected)
  }, [selected, load])

  const option = useMemo<EChartsOption | null>(() => {
    if (!points.length) return null
    // Distinct series from the labels carried on each point.
    const seriesKeys = new Map<string, string>() // type → labelName
    points.forEach((p) => p.labels?.forEach((l) => seriesKeys.set(l.type, l.labelName)))
    const series = [...seriesKeys.entries()].map(([type, name]) => ({
      name,
      type: 'line' as const,
      showSymbol: false,
      data: points.map((p) => [p.time, p.labels?.find((l) => l.type === type)?.value ?? null] as [number, number | null]),
    }))
    return {
      tooltip: { trigger: 'axis' },
      legend: { type: 'scroll', bottom: 0 },
      grid: { left: 48, right: 16, top: 16, bottom: 48 },
      xAxis: { type: 'time' },
      yAxis: { type: 'value', scale: true },
      series,
    }
  }, [points])

  const selectedName = useMemo(() => machines.find((m) => m.id === selected)?.name ?? '', [machines, selected])

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
      <h1 className="mb-4 text-lg font-semibold text-ink">Trends · live ({DAYS}d)</h1>

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
      {note && !loading && <p className="text-sm text-faint">{note}</p>}

      {option && (
        <div className="rounded-xl border border-line/70 bg-card p-4 shadow-card">
          <ReactECharts option={option} style={{ height: 420 }} notMerge lazyUpdate />
        </div>
      )}
    </main>
  )
}
