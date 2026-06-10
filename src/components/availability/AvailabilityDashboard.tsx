import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  useAvailabilitySettings,
  useAvailabilityPlan,
  useDashboardPrefs,
  toISO,
  parseISO,
} from '../../lib/availability'
import { useHolidays } from '../../lib/holidays'
import { availabilityService, type SeriesResult } from '../../data/availabilityData'
import AvailabilityGauge from '../AvailabilityGauge'
import AvailabilityChart from '../AvailabilityChart'
import HBars from '../HBars'
import Dropdown from '../Dropdown'
import { Alarm, Pencil, ChevronLeft, ChevronRight, CheckCircle } from '../../icons/Icons'
import ChartTypePicker from './ChartTypePicker'
import ChartDetailPanel from './ChartDetailPanel'
import { periodLabel, type PeriodState } from './PeriodFilter'

const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface Props {
  period: PeriodState
}

// Map the period range to a number of days back from "today" — used to window
// the Month daily series so the dashboard responds to the chosen window.
function rangeDays(period: PeriodState): number | null {
  switch (period.range) {
    case 'lastDay':
      return 1
    case 'lastWeek':
      return 7
    case 'last30':
      return 30
    case 'custom':
      if (period.customStart && period.customEnd) {
        const a = parseISO(period.customStart).getTime()
        const b = parseISO(period.customEnd).getTime()
        return Math.max(1, Math.round((b - a) / 86400000) + 1)
      }
      return null
  }
}

// Slice a daily SeriesResult to only the last `days` points (or a date window).
function windowSeries(s: SeriesResult, lastN: number | null): SeriesResult {
  if (lastN == null || lastN >= s.labels.length) return s
  const start = Math.max(0, s.labels.length - lastN)
  const slice = <T,>(arr: T[]) => arr.slice(start)
  const planned = slice(s.planned)
  const executed = slice(s.executed)
  const totalPlanned = planned.reduce((a, b) => a + b, 0)
  const totalExecuted = executed.reduce((a, b) => a + b, 0)
  return {
    labels: slice(s.labels),
    planned,
    executed,
    pct: slice(s.pct),
    totalPlanned,
    totalExecuted,
    overallPct: totalPlanned > 0 ? Math.round((totalExecuted / totalPlanned) * 100) : 0,
  }
}

export default function AvailabilityDashboard({ period }: Props) {
  const [settings] = useAvailabilitySettings()
  const [plan] = useAvailabilityPlan()
  const { typeFor, setCard } = useDashboardPrefs()

  const now = new Date()
  const todayIso = toISO(now)
  const yIso = toISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))

  // Month card owns its own month/year selector.
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewMonthYear, setViewMonthYear] = useState(now.getFullYear())
  // Year card owns its own year selector.
  const [viewYear, setViewYear] = useState(now.getFullYear())

  const [editMode, setEditMode] = useState(false)
  const [detail, setDetail] = useState<null | 'month' | 'year'>(null)

  // Holidays: gather for every year referenced so service math is consistent.
  const hToday = useHolidays(now.getFullYear())
  const hMonth = useHolidays(viewMonthYear)
  const hYear = useHolidays(viewYear)

  const goal = settings.monthlyGoalPct

  const today = useMemo(
    () => availabilityService.day(todayIso, plan, settings, hToday.set),
    [todayIso, plan, settings, hToday.set]
  )
  const yesterday = useMemo(
    () => availabilityService.day(yIso, plan, settings, hToday.set),
    [yIso, plan, settings, hToday.set]
  )

  const lastN = rangeDays(period)

  const monthSeriesFull = useMemo(
    () => availabilityService.monthSeries(viewMonthYear, viewMonth, plan, settings, hMonth.set),
    [viewMonthYear, viewMonth, plan, settings, hMonth.set]
  )
  // Window the daily series by the selected range (only when viewing the
  // current month — windowing a historical month back-counts from its end).
  const monthSeries = useMemo(() => windowSeries(monthSeriesFull, lastN), [monthSeriesFull, lastN])

  const yearSeries = useMemo(
    () => availabilityService.yearSeries(viewYear, plan, settings, hYear.set),
    [viewYear, plan, settings, hYear.set]
  )

  const alarms = useMemo(
    () => availabilityService.alarmsByDay(viewMonthYear, viewMonth),
    [viewMonthYear, viewMonth]
  )
  const totalAlarms = alarms.reduce((a, d) => a + d.count, 0)
  const topAlarms = [...alarms].filter((d) => d.count > 0).sort((a, b) => b.count - a.count).slice(0, 5)

  const monthType = typeFor('month')
  const yearType = typeFor('year')

  const stepMonth = (dir: number) => {
    let m = viewMonth + dir
    let y = viewMonthYear
    if (m < 0) {
      m = 11
      y--
    } else if (m > 11) {
      m = 0
      y++
    }
    setViewMonth(m)
    setViewMonthYear(y)
  }

  const yearOptions = useMemo(() => {
    const cy = now.getFullYear()
    return [cy - 2, cy - 1, cy, cy + 1].map(String)
  }, [now])

  // TASK-20: hover enrichment caption fields (avg availability + best/worst day).
  const monthCaption = useMemo(() => buildDailyCaption(monthSeries), [monthSeries])

  return (
    <div>
      {/* dashboard toolbar */}
      <div className="no-print mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">{periodLabel(period)}</p>
        <button
          onClick={() => setEditMode((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            editMode
              ? 'border-primary bg-primary-soft text-primary'
              : 'border-line text-muted hover:text-ink'
          }`}
        >
          {editMode ? <CheckCircle size={15} /> : <Pencil size={15} />}
          {editMode ? 'Done' : 'Edit'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* TASK-14 — Today: planned vs executed two-bar comparison */}
        <Card title="Today">
          <TodayBars planned={today.planned} executed={today.executed} pct={today.pct} />
          <p className="mt-3 border-t border-line pt-2 text-center text-xs text-muted">
            {WEEKDAY_LONG[parseISO(todayIso).getDay()]} · {today.executed}h of {today.planned}h planned
          </p>
        </Card>

        {/* TASK-15 — Yesterday gauge */}
        <Card title="Yesterday">
          <AvailabilityGauge value={yesterday.pct} label="Yesterday" goal={goal} />
          <p className="mt-2 text-center text-xs text-muted">
            {yesterday.executed}h executed · {yesterday.planned}h planned
          </p>
        </Card>

        {/* TASK-18 — Goal card */}
        <Card title="Goal">
          <div className="flex h-full flex-col items-center justify-center py-4">
            <p className="text-5xl font-bold text-primary">{goal}%</p>
            <p className="mt-2 text-center text-sm text-muted">Monthly availability target</p>
            <p className="mt-1 text-center text-xs text-faint">
              Shown as the dashed line on the Month &amp; Year charts.
            </p>
          </div>
        </Card>

        {/* TASK-16 — Month: gauge + daily chart, own month/year selector */}
        <Card
          title="Month"
          className="lg:col-span-2"
          toolbar={
            <div className="flex items-center gap-1.5">
              {editMode && <ChartTypePicker value={monthType} onChange={(t) => setCard('month', t)} />}
              <button
                onClick={() => stepMonth(-1)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-page hover:text-ink"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="min-w-[7.5rem] text-center text-sm font-medium text-ink">
                {MONTH_LABELS[viewMonth]} {viewMonthYear}
              </span>
              <button
                onClick={() => stepMonth(1)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-page hover:text-ink"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center justify-center">
              <AvailabilityGauge value={monthSeries.overallPct} label="Month" goal={goal} size="8rem" />
            </div>
            <button
              type="button"
              onClick={() => !editMode && setDetail('month')}
              className={`block w-full text-left ${editMode ? 'cursor-default' : 'cursor-pointer'}`}
              title={editMode ? undefined : 'Open detail'}
            >
              <AvailabilityChart
                labels={monthSeries.labels}
                values={monthSeries.pct}
                planned={monthSeries.planned}
                executed={monthSeries.executed}
                type={monthType}
                goal={goal}
                height={180}
                maxLabels={15}
              />
              <p className="mt-1 text-center text-[0.6875rem] text-faint">{monthCaption}</p>
            </button>
          </div>
        </Card>

        {/* TASK-21 — Total Alarms */}
        <Card title="Total Alarms">
          <div className="flex items-center gap-2">
            <Alarm size={22} className="text-warning" />
            <span className="text-4xl font-bold text-ink">{totalAlarms}</span>
            <span className="text-xs text-muted">in {MONTH_LABELS[viewMonth].slice(0, 3)}</span>
          </div>
          <div className="mt-3 border-t border-line pt-3">
            {topAlarms.length ? (
              <HBars
                items={topAlarms.map((d) => ({
                  label: `Day ${String(d.day).padStart(2, '0')}`,
                  value: d.count,
                  leftLabel: String(d.day).padStart(2, '0'),
                  color: 'var(--color-warning)',
                }))}
                axisMax={Math.max(...topAlarms.map((d) => d.count)) + 1}
              />
            ) : (
              <p className="py-3 text-center text-xs text-muted">No alarms this month</p>
            )}
          </div>
        </Card>

        {/* TASK-17 — Year: gauge + monthly chart, own year selector */}
        <Card
          title="Year"
          className="lg:col-span-3"
          toolbar={
            <div className="flex items-center gap-1.5">
              {editMode && <ChartTypePicker value={yearType} onChange={(t) => setCard('year', t)} />}
              <Dropdown
                value={String(viewYear)}
                options={yearOptions}
                onChange={(v) => setViewYear(Number(v))}
                className="w-28"
              />
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center justify-center">
              <AvailabilityGauge value={yearSeries.overallPct} label="Year" goal={goal} size="8rem" />
            </div>
            <button
              type="button"
              onClick={() => !editMode && setDetail('year')}
              className={`block w-full text-left ${editMode ? 'cursor-default' : 'cursor-pointer'}`}
              title={editMode ? undefined : 'Open detail'}
            >
              <AvailabilityChart
                labels={yearSeries.labels}
                values={yearSeries.pct}
                planned={yearSeries.planned}
                executed={yearSeries.executed}
                type={yearType}
                goal={goal}
                height={200}
              />
              <p className="mt-1 text-center text-[0.6875rem] text-faint">
                {buildMonthlyCaption(yearSeries)}
              </p>
            </button>
          </div>
        </Card>
      </div>

      {/* TASK-19 — detail slide-over reflecting the same chart type */}
      <ChartDetailPanel
        open={detail === 'month'}
        onClose={() => setDetail(null)}
        title={`${MONTH_LABELS[viewMonth]} ${viewMonthYear} · Daily availability`}
        subtitle={periodLabel(period)}
        series={monthSeries}
        type={monthType}
        goal={goal}
        footer={monthCaption}
      />
      <ChartDetailPanel
        open={detail === 'year'}
        onClose={() => setDetail(null)}
        title={`${viewYear} · Monthly availability`}
        subtitle={periodLabel(period)}
        series={yearSeries}
        type={yearType}
        goal={goal}
        footer={buildMonthlyCaption(yearSeries)}
      />
    </div>
  )
}

// --- TASK-20: enrichment captions (avg + best/worst point) ---

function buildDailyCaption(s: SeriesResult): string {
  if (!s.pct.length) return ''
  const avg = Math.round(s.pct.reduce((a, b) => a + b, 0) / s.pct.length)
  let best = 0
  let worst = 0
  s.pct.forEach((v, i) => {
    if (v > s.pct[best]) best = i
    if (v < s.pct[worst]) worst = i
  })
  return `Avg ${avg}% · Best day ${s.labels[best]} (${s.pct[best]}%) · Worst day ${s.labels[worst]} (${s.pct[worst]}%)`
}

function buildMonthlyCaption(s: SeriesResult): string {
  if (!s.pct.length) return ''
  const avg = Math.round(s.pct.reduce((a, b) => a + b, 0) / s.pct.length)
  let best = 0
  let worst = 0
  s.pct.forEach((v, i) => {
    if (v > s.pct[best]) best = i
    if (v < s.pct[worst]) worst = i
  })
  return `Avg ${avg}% · Best ${s.labels[best]} (${s.pct[best]}%) · Worst ${s.labels[worst]} (${s.pct[worst]}%)`
}

// --- small building blocks ---

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

function TodayBars({ planned, executed, pct }: { planned: number; executed: number; pct: number }) {
  const max = Math.max(planned, executed, 1)
  const below = pct < 100
  return (
    <div>
      <div className="flex items-end justify-center gap-8 py-3" style={{ height: 150 }}>
        <Bar label="Planned" value={planned} pctH={(planned / max) * 100} color="#cfe0dd" />
        <Bar label="Executed" value={executed} pctH={(executed / max) * 100} color={below ? '#f0b54d' : '#46aa9f'} />
      </div>
      <p className="text-center text-sm font-semibold text-ink">
        Availability <span className={below ? 'text-warning' : 'text-up'}>{Math.round(pct)}%</span>
      </p>
    </div>
  )
}

function Bar({ label, value, pctH, color }: { label: string; value: number; pctH: number; color: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-end">
      <span className="mb-1 text-xs font-semibold text-ink">{value}h</span>
      <div
        className="w-12 rounded-t-md"
        style={{ height: `${Math.max(pctH, 2)}%`, background: color, transition: 'height 0.6s cubic-bezier(0.22,1,0.36,1)' }}
      />
      <span className="mt-1.5 text-[0.6875rem] text-muted">{label}</span>
    </div>
  )
}
