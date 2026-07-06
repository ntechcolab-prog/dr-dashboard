import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { performanceService, PERFORMANCE_GOAL_PCT, type PerfSeries } from '../../data/performanceData'
import AvailabilityGauge from '../AvailabilityGauge'
import AvailabilityChart from '../AvailabilityChart'
import HBars from '../HBars'
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
  const daily = useMemo(() => performanceService.dailySeries(viewYear, viewMonth), [viewYear, viewMonth])
  const losses = useMemo(() => performanceService.lossBreakdown(viewYear, viewMonth), [viewYear, viewMonth])
  const recipes = useMemo(() => performanceService.recipeRanking(viewYear, viewMonth), [viewYear, viewMonth])
  const slowest = useMemo(() => performanceService.slowestBatches(viewYear, viewMonth), [viewYear, viewMonth])

  // Year card owns its own year selector.
  const yearOptions = performanceService.dataYears().map(String)
  const [chartYear, setChartYear] = useState(latest.year)
  const yearly = useMemo(() => performanceService.yearSeries(chartYear), [chartYear])

  const totalLossH = Math.round(losses.reduce((a, l) => a + l.hours, 0) * 10) / 10

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
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
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
        <Kpi label="Speed loss" value={`${kpis.speedLossH}h`} sub="Running below ideal rate" />
        <Kpi label="Minor stops" value={String(kpis.minorStops)} sub={`${kpis.minorStopH}h in micro-stops`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* daily trend */}
        <Card title="Daily performance" className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center justify-center">
              <AvailabilityGauge value={kpis.pct} label="Month" goal={goal} size="8rem" />
            </div>
            <div>
              <AvailabilityChart labels={daily.labels} values={daily.pct} type="line" goal={goal} height={180} maxLabels={15} />
              <p className="mt-1 text-center text-[0.6875rem] text-faint">{buildCaption(daily)}</p>
            </div>
          </div>
        </Card>

        {/* speed loss breakdown */}
        <Card title="Speed loss breakdown">
          <p className="text-xs text-muted">Where the {totalLossH}h below ideal rate went.</p>
          <div className="mt-3">
            <HBars
              items={losses.map((l) => ({
                label: l.cause,
                value: l.hours,
                leftLabel: `${l.hours}h`,
              }))}
            />
          </div>
          <p className="mt-2 border-t border-line pt-2 text-center text-xs text-muted">
            Biggest loss: <span className="font-semibold text-ink">{losses[0]?.cause}</span> ({losses[0]?.hours}h)
          </p>
        </Card>

        {/* recipe ranking */}
        <Card title="Performance by recipe">
          <p className="text-xs text-muted">Actual vs ideal rate per recipe — slowest first.</p>
          <div className="mt-3">
            <HBars
              items={recipes.map((r) => ({
                label: r.recipe,
                value: r.pct,
                leftLabel: `${r.pct}%`,
                color: r.pct >= goal ? 'var(--color-primary)' : 'var(--color-warning)',
              }))}
              axisMax={100}
            />
          </div>
        </Card>

        {/* slowest batches */}
        <Card title="Slowest batches" className="lg:col-span-2">
          <p className="text-xs text-muted">Worst actual-vs-ideal rate this month — good candidates for a batch review.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[0.6875rem] uppercase tracking-wide text-muted">
                  <th className="pb-2 pr-3 font-semibold">Batch</th>
                  <th className="pb-2 pr-3 font-semibold">Day</th>
                  <th className="pb-2 pr-3 font-semibold">Machine</th>
                  <th className="pb-2 pr-3 font-semibold">Recipe</th>
                  <th className="pb-2 pr-3 text-right font-semibold">Actual</th>
                  <th className="pb-2 pr-3 text-right font-semibold">Ideal</th>
                  <th className="pb-2 text-right font-semibold">Perf.</th>
                </tr>
              </thead>
              <tbody>
                {slowest.map((b) => (
                  <tr key={b.id} className="border-t border-line/60">
                    <td className="py-2 pr-3 font-medium text-ink">{b.id}</td>
                    <td className="py-2 pr-3 tabular-nums text-muted">{String(b.day).padStart(2, '0')}</td>
                    <td className="py-2 pr-3 text-ink">{b.machine}</td>
                    <td className="py-2 pr-3 text-ink">{b.recipe}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-ink">{b.actualRate} t/h</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-muted">{b.idealRate} t/h</td>
                    <td className="py-2 text-right">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${
                          b.pct >= goal ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {b.pct}%
                      </span>
                    </td>
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

