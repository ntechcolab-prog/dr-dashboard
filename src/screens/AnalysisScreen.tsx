import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import SubHeader from '../components/SubHeader'
import LineChart from '../components/LineChart'
import BarChart from '../components/BarChart'
import { AnalysisIcon } from '../icons/Icons'
import { ALL_BATCHES, MONTHS, MACHINES, RECIPES } from '../data/mockData'
import { aggregate, type RankItem } from '../lib/compute'

const METRICS = [
  { key: 'mass', label: 'Output (kg)' },
  { key: 'energy', label: 'Energy (kWh)' },
  { key: 'count', label: 'Batches' },
] as const

type MetricKey = (typeof METRICS)[number]['key']

export default function AnalysisScreen() {
  const [metric, setMetric] = useState<MetricKey>('mass')

  // Monthly trend for the selected metric.
  const trend = useMemo(() => {
    return MONTHS.map((m) => {
      const rows = ALL_BATCHES.filter((b) => b.year === m.year && b.month === m.month)
      const agg = aggregate(rows)
      if (metric === 'mass') return Math.round(agg.mass * 1000)
      if (metric === 'energy') return Math.round(agg.energy)
      return agg.count
    })
  }, [metric])

  const trendUnit = metric === 'mass' ? 'kg' : metric === 'energy' ? 'kWh' : 'batches'

  // Output by recipe (kg), top 6.
  const byRecipe: RankItem[] = useMemo(() => {
    return RECIPES.map((r) => ({
      label: r,
      value: Math.round(
        ALL_BATCHES.filter((b) => b.recipe === r).reduce((a, b) => a + b.mass * 1000, 0)
      ),
    }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [])

  // Specific energy by machine (kWh/ton) — lower is better.
  const byMachine: RankItem[] = useMemo(() => {
    return MACHINES.map((m) => {
      const rows = ALL_BATCHES.filter((b) => b.machine === m)
      const agg = aggregate(rows)
      return { label: m, value: Math.round(agg.specificEnergy * 10) / 10 }
    }).sort((a, b) => b.value - a.value)
  }, [])

  const totals = useMemo(() => aggregate(ALL_BATCHES), [])

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-4 p-5">
      <SubHeader Icon={AnalysisIcon} title="Analysis" />

      {/* Summary strip */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total batches" value={totals.count.toLocaleString('en-US')} />
        <Stat label="Total output" value={`${Math.round(totals.mass).toLocaleString('en-US')} ton`} />
        <Stat label="Total energy" value={`${Math.round(totals.energy).toLocaleString('en-US')} kWh`} />
        <Stat
          label="Avg specific energy"
          value={`${(Math.round(totals.specificEnergy * 10) / 10).toFixed(1)} kWh/ton`}
        />
      </section>

      {/* Trend */}
      <Panel
        title="Production Trend"
        action={
          <div className="inline-flex rounded-lg bg-page p-1">
            {METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  metric === m.key ? 'bg-white text-ink shadow-card' : 'text-muted hover:text-ink'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        }
      >
        <LineChart
          data={trend}
          labels={MONTHS.map((m) => m.label.split(' ')[0])}
          unit={trendUnit}
          height={260}
        />
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Output by Recipe (kg)">
          <BarChart data={byRecipe} valueLabel="kg produced" />
        </Panel>
        <Panel title="Specific Energy by Machine (kWh/ton)">
          <BarChart data={byMachine} valueLabel="kWh per ton — lower is better" />
        </Panel>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line/70 bg-card p-4 shadow-card">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-ink">{value}</p>
    </div>
  )
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}
