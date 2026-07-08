import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { performanceService, PERFORMANCE_GOAL_PCT, type PerfSeries } from '../../data/performanceData'
import { availabilityService } from '../../data/availabilityData'
import {
  resolveMachineAvailability,
  useAvailabilitySettings,
  useAvailabilityPlan,
  useMachineAvailabilityMap,
  useWorkingHolidays,
} from '../../lib/availability'
import { useHolidays } from '../../lib/holidays'
import AvailabilityGauge from '../AvailabilityGauge'
import AvailabilityChart from '../AvailabilityChart'
import Dropdown from '../Dropdown'
import { ChevronLeft, ChevronRight } from '../../icons/Icons'

const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Performance dashboard (Machine tab › Performance). One shared month
// selector (in the header row) drives every monthly card; the Year card has
// its own year dropdown — mirroring how the Availability dashboard is scoped.
export default function PerformanceDashboard() {
  const goal = PERFORMANCE_GOAL_PCT

  // Shared month scope, clamped to the range with production data.
  const latest = performanceService.latestDataMonth()
  const first = performanceService.firstDataMonth()
  const [viewMonth, setViewMonth] = useState(latest.month)
  const [viewYear, setViewYear] = useState(latest.year)
  const atLatest = viewYear === latest.year && viewMonth === latest.month
  const atFirst = viewYear === first.year && viewMonth === first.month

  const stepMonth = (dir: number) => {
    let m = viewMonth + dir
    let y = viewYear
    if (m < 0) {
      m = 11
      y--
    } else if (m > 11) {
      m = 0
      y++
    }
    if (!performanceService.hasData(y, m)) return
    setViewMonth(m)
    setViewYear(y)
  }

  const kpis = useMemo(() => performanceService.monthKpis(viewYear, viewMonth), [viewYear, viewMonth])
  const weekly = useMemo(() => performanceService.weeklySeries(viewYear, viewMonth), [viewYear, viewMonth])
  const recipes = useMemo(() => performanceService.recipeRanking(viewYear, viewMonth), [viewYear, viewMonth])

  // Per-machine production: tons from the batches; worked × planned hours from
  // each machine's effective availability plan (per-machine config included).
  const [availMap] = useMachineAvailabilityMap()
  const [globalSettings] = useAvailabilitySettings()
  const [globalPlan] = useAvailabilityPlan()
  const globalWh = useWorkingHolidays()
  const holidays = useHolidays(viewYear)
  const machineRows = useMemo(
    () =>
      performanceService.machineMonthProduction(viewYear, viewMonth).map((p) => {
        const eff = resolveMachineAvailability(availMap, p.machine, globalSettings, globalPlan, globalWh.set)
        const ms = availabilityService.monthSeries(
          viewYear,
          viewMonth,
          eff.plan,
          eff.settings,
          holidays.set,
          eff.workingHolidays,
          p.machine
        )
        return { ...p, plannedH: Math.round(ms.totalPlanned), workedH: Math.round(ms.totalExecuted) }
      }),
    [viewYear, viewMonth, availMap, globalSettings, globalPlan, globalWh.set, holidays.set]
  )

  // Year card owns its own year selector.
  const yearOptions = performanceService.dataYears().map(String)
  const [chartYear, setChartYear] = useState(latest.year)
  const yearly = useMemo(() => performanceService.yearSeries(chartYear), [chartYear])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink">Performance</h3>
        <div className="no-print flex items-center gap-1.5">
          <button
            onClick={() => stepMonth(-1)}
            disabled={atFirst}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted enabled:hover:bg-page enabled:hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[7.5rem] text-center text-sm font-medium text-ink">
            {MONTH_LABELS[viewMonth]} {viewYear}
          </span>
          <button
            onClick={() => stepMonth(1)}
            disabled={atLatest}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted enabled:hover:bg-page enabled:hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi
          label="Performance"
          value={`${kpis.pct}%`}
          delta={kpis.deltaPp}
          sub={`Goal ${goal}% · ${kpis.batches} batches`}
          warn={kpis.pct < goal}
        />
        <Kpi
          label="Average rate"
          value={`${kpis.avgActualRate} t/h`}
          sub={`Ideal ${kpis.avgIdealRate} t/h`}
        />
        <Kpi label="Minor stops" value={String(kpis.minorStops)} sub={`${kpis.minorStopH}h in micro-stops`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* weekly trend */}
        <Card title="Weekly performance" className="lg:col-span-2">
          <div className="grid h-full grid-cols-1 items-center gap-4 sm:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center justify-center">
              <AvailabilityGauge value={kpis.pct} label="Month" goal={goal} size="8rem" />
            </div>
            <div>
              <AvailabilityChart labels={weekly.labels} values={weekly.pct} type="bar" goal={goal} height={300} />
              <p className="mt-1 text-center text-[0.6875rem] text-faint">{buildCaption(weekly)}</p>
            </div>
          </div>
        </Card>

        {/* production per machine */}
        <Card title="Production by machine">
          <p className="text-xs text-muted">Tons produced and production hours (worked × planned) this month.</p>
          <div className="mt-3 flex flex-col gap-2.5">
            {machineRows.map((m) => {
              const ratio = m.plannedH > 0 ? Math.min(1, m.workedH / m.plannedH) : 0
              return (
                <div key={m.machine} className="rounded-lg border border-line/70 bg-page/30 px-3 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-ink">{m.machine}</span>
                    <span className="text-sm font-bold tabular-nums text-primary">{m.tons} t</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line/60">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${ratio * 100}%` }} />
                    </div>
                    <span className="shrink-0 text-[0.6875rem] tabular-nums text-muted">
                      {m.workedH}h / {m.plannedH}h
                    </span>
                  </div>
                </div>
              )
            })}
            {machineRows.length === 0 && <p className="text-sm text-faint">No production in this month.</p>}
          </div>
        </Card>

        {/* recipe ranking */}
        <Card title="Performance by recipe" className="lg:col-span-3">
          <p className="text-xs text-muted">Batch performance per recipe — minimum, average and maximum, slowest first.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[0.6875rem] uppercase tracking-wide text-muted">
                  <th className="pb-2 pr-3 font-semibold">Recipe</th>
                  <th className="w-full pb-2 pr-3 font-semibold">Min–max range · avg marker</th>
                  <th className="pb-2 pr-3 text-right font-semibold">Min</th>
                  <th className="pb-2 pr-3 text-right font-semibold">Avg</th>
                  <th className="pb-2 pr-3 text-right font-semibold">Max</th>
                  <th className="pb-2 text-right font-semibold">Batches</th>
                </tr>
              </thead>
              <tbody>
                {recipes.map((r) => (
                  <tr key={r.recipe} className="border-t border-line/60">
                    <td className="whitespace-nowrap py-2.5 pr-3 font-medium text-ink">{r.recipe}</td>
                    <td className="py-2.5 pr-3">
                      <RangeBar min={r.minPct} avg={r.pct} max={r.maxPct} goal={goal} />
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-muted">{r.minPct}%</td>
                    <td className="py-2.5 pr-3 text-right">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${
                          r.pct >= goal ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {r.pct}%
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-muted">{r.maxPct}%</td>
                    <td className="py-2.5 text-right tabular-nums text-muted">{r.batches}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* yearly trend */}
        <Card
          title="Year"
          className="lg:col-span-3"
          toolbar={
            <Dropdown value={String(chartYear)} options={yearOptions} onChange={(v) => setChartYear(Number(v))} className="w-28" />
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center justify-center">
              <AvailabilityGauge value={yearly.overallPct} label="Year" goal={goal} size="8rem" />
            </div>
            <div>
              <AvailabilityChart labels={yearly.labels} values={yearly.pct} type="bar" goal={goal} height={200} />
              <p className="mt-1 text-center text-[0.6875rem] text-faint">{buildCaption(yearly)}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function buildCaption(s: PerfSeries): string {
  if (!s.pct.length) return 'No production in this period.'
  const avg = Math.round(s.pct.reduce((a, b) => a + b, 0) / s.pct.length)
  let best = 0
  let worst = 0
  s.pct.forEach((v, i) => {
    if (v > s.pct[best]) best = i
    if (v < s.pct[worst]) worst = i
  })
  return `Avg ${avg}% · Best ${s.labels[best]} (${s.pct[best]}%) · Worst ${s.labels[worst]} (${s.pct[worst]}%)`
}

// min→max band with an average marker, on a 0–100% track with the goal ticked.
function RangeBar({ min, avg, max, goal }: { min: number; avg: number; max: number; goal: number }) {
  const below = avg < goal
  const color = below ? 'var(--color-warning)' : 'var(--color-primary)'
  return (
    <div className="relative h-2.5 min-w-[8rem] rounded-full bg-page">
      {/* goal tick */}
      <div className="absolute top-1/2 h-3.5 w-px -translate-y-1/2 border-l border-dashed border-primary/50" style={{ left: `${goal}%` }} />
      {/* min–max band */}
      <div
        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full opacity-35"
        style={{ left: `${min}%`, width: `${Math.max(1, max - min)}%`, background: color }}
      />
      {/* avg marker */}
      <div
        className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-card"
        style={{ left: `${avg}%`, background: color }}
      />
    </div>
  )
}

// --- small building blocks (same card chrome as the Availability dashboard) ---

function Card({
  title,
  children,
  className = '',
  toolbar,
}: {
  title: string
  children: ReactNode
  className?: string
  toolbar?: ReactNode
}) {
  return (
    <div className={`flex flex-col rounded-xl border border-line/70 bg-card p-4 shadow-card ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-ink">{title}</p>
        {toolbar && <div className="no-print">{toolbar}</div>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function Kpi({
  label,
  value,
  sub,
  delta,
  warn,
}: {
  label: string
  value: string
  sub?: string
  delta?: number | null
  warn?: boolean
}) {
  return (
    <div className="rounded-xl border border-line/70 bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">{label}</p>
        {delta != null && (
          <span className={`text-[0.6875rem] font-semibold tabular-nums ${delta >= 0 ? 'text-up' : 'text-down'}`}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}pp
          </span>
        )}
      </div>
      <p className={`mt-1.5 text-2xl font-bold tabular-nums ${warn ? 'text-warning' : 'text-ink'}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  )
}
