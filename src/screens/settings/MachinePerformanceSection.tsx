import { useMemo, useState } from 'react'
import { FormBlock, Field, NumberInput } from '../../components/FormControls'
import Dropdown from '../../components/Dropdown'
import ReplicatePanel from './ReplicatePanel'
import { ChevronLeft, ChevronRight, Sun, Info } from '../../icons/Icons'
import {
  WEEKDAY_LABELS,
  daysInMonth,
  isoOf,
  plannedHoursForDay,
  useMachineAvailability,
} from '../../lib/availability'
import { buildWeeks } from '../../lib/weeks'
import { useHolidays } from '../../lib/holidays'
import {
  TARGET_PERIODS,
  TARGET_PERIOD_LABELS,
  monthlyTargetTons,
  distributeTargetByPlan,
  useMachinePerformance,
  type TargetPeriod,
} from '../../lib/performanceSettings'
import { MACHINES } from '../../data/mockData'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const PERIOD_OPTIONS = TARGET_PERIODS.map((p) => TARGET_PERIOD_LABELS[p])
const periodFromLabel = (label: string): TargetPeriod =>
  TARGET_PERIODS.find((p) => TARGET_PERIOD_LABELS[p] === label) ?? 'month'

// Performance configuration for ONE machine (Settings › Production): the
// throughput target in t/h, the production target (t per month/week/day) and
// a live calendar preview of how that target lands on the planned days.
export default function MachinePerformanceSection({ machine }: { machine: string }) {
  const mp = useMachinePerformance(machine)
  const { settings, setSettings } = mp

  // The preview distributes the target over the machine's availability plan.
  const availability = useMachineAvailability(machine)

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const holidays = useHolidays(year)

  const prevMonth = () =>
    setMonth((m) => {
      if (m === 0) {
        setYear((y) => y - 1)
        return 11
      }
      return m - 1
    })
  const nextMonth = () =>
    setMonth((m) => {
      if (m === 11) {
        setYear((y) => y + 1)
        return 0
      }
      return m + 1
    })

  // Planned hours per day of the viewed month → target tons per day.
  const totalDays = daysInMonth(year, month)
  const plannedByDay = useMemo(() => {
    const out: number[] = []
    for (let d = 1; d <= totalDays; d++)
      out.push(
        plannedHoursForDay(isoOf(year, month, d), availability.plan, availability.settings, holidays.set, availability.workingHolidays)
      )
    return out
  }, [year, month, totalDays, availability.plan, availability.settings, holidays.set, availability.workingHolidays])

  const plannedDaysCount = plannedByDay.filter((h) => h > 0).length
  const totalPlannedHours = plannedByDay.reduce((a, b) => a + b, 0)
  const monthTarget = monthlyTargetTons(settings, year, month, plannedDaysCount)
  const tonsByDay = useMemo(() => distributeTargetByPlan(monthTarget, plannedByDay), [monthTarget, plannedByDay])
  const maxDayTons = Math.max(0.1, ...tonsByDay)

  const weeks = useMemo(() => buildWeeks(year, month), [year, month])
  const weekTotal = (week: (number | null)[]) =>
    round1(week.reduce<number>((a, d) => (d ? a + tonsByDay[d - 1] : a), 0))

  const avgPerWorkingDay = plannedDaysCount > 0 ? round1(monthTarget / plannedDaysCount) : 0
  const perWeek = round1((monthTarget * 7) / totalDays)

  return (
    // One big card — targets, preview calendar and copy flow together
    // without per-section chrome.
    <section className="rounded-xl bg-card p-6 shadow-card">
      <div className="flex flex-col gap-10">
      {/* Targets */}
      <FormBlock title="Performance targets">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Field label="Target throughput">
            <NumberInput
              value={settings.targetRate}
              suffix="t/h"
              min={0}
              step={0.1}
              onChange={(n) => setSettings((p) => ({ ...p, targetRate: Math.max(0, n) }))}
            />
          </Field>
          <Field label="Production target">
            <NumberInput
              value={settings.productionTarget}
              suffix="t"
              min={0}
              step={1}
              onChange={(n) => setSettings((p) => ({ ...p, productionTarget: Math.max(0, n) }))}
            />
          </Field>
          <Field label="Target period">
            <Dropdown
              value={TARGET_PERIOD_LABELS[settings.targetPeriod]}
              options={PERIOD_OPTIONS}
              onChange={(v) => setSettings((p) => ({ ...p, targetPeriod: periodFromLabel(v) }))}
            />
          </Field>
        </div>
        <p className="mt-3 text-xs text-muted">
          Target throughput is the rate {machine} should sustain while grinding. The production target is the tonnage
          the machine is expected to deliver — set it per month, week or day; the calendar below always shows the
          resulting daily split.
        </p>
      </FormBlock>

      {/* Target preview calendar */}
      <FormBlock
        title="Target preview"
        action={
          <span className="text-xs text-muted">
            {monthTarget} t in {MONTH_NAMES[month]} · from {machine}’s availability plan
          </span>
        }
      >
        {/* month nav */}
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={prevMonth}
            aria-label="Previous month"
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-ink"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[9.5rem] text-center text-base font-semibold text-ink">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            aria-label="Next month"
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-ink"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* summary strip */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryStat label="Month target" value={`${monthTarget} t`} tone="primary" />
          <SummaryStat label="≈ per week" value={`${perWeek} t`} />
          <SummaryStat label="Working days" value={String(plannedDaysCount)} />
          <SummaryStat label="Avg per working day" value={`${avgPerWorkingDay} t`} />
        </div>

        {totalPlannedHours <= 0 && (
          <p className="mb-4 flex items-start gap-2 rounded-lg bg-page px-3 py-2.5 text-sm text-muted">
            <Info size={15} className="mt-0.5 shrink-0 text-warning" />
            No planned hours for {MONTH_NAMES[month]} {year} on {machine} — plan its availability first and the
            target will be split across the planned days automatically.
          </p>
        )}

        {/* calendar grid — 7 weekday columns + a week-total column */}
        <div className="overflow-hidden rounded-xl border border-line">
          <div className="grid grid-cols-[repeat(7,1fr)_5rem] border-b border-line bg-page">
            {WEEKDAY_LABELS.map((w) => (
              <div key={w} className="px-2 py-2.5 text-center text-[0.6875rem] font-semibold uppercase tracking-wide text-ink">
                {w}
              </div>
            ))}
            <div className="border-l border-line px-2 py-2.5 text-center text-[0.6875rem] font-semibold uppercase tracking-wide text-primary">
              Week
            </div>
          </div>

          {weeks.map((week, wi) => (
            <div
              key={wi}
              className={`grid grid-cols-[repeat(7,1fr)_5rem] ${wi < weeks.length - 1 ? 'border-b border-line' : ''}`}
            >
              {week.map((day, di) => {
                if (day == null)
                  return <div key={di} className="min-h-[4.5rem] border-r border-line bg-page/30" />
                const iso = isoOf(year, month, day)
                const isHoliday = holidays.set.has(iso) && !availability.workingHolidays.has(iso)
                const tons = tonsByDay[day - 1]
                const planned = plannedByDay[day - 1]
                const tint =
                  tons > 0 ? `rgba(70,170,159,${(0.1 + 0.32 * Math.min(1, tons / maxDayTons)).toFixed(3)})` : undefined
                return (
                  <div
                    key={di}
                    className={`relative flex min-h-[4.5rem] flex-col border-r border-line p-2 ${
                      isHoliday ? 'bg-[#fdf3e2]' : planned <= 0 ? 'bg-page/50' : ''
                    }`}
                    style={{ background: tint }}
                    title={planned > 0 ? `${planned}h planned` : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${planned > 0 ? 'text-ink' : 'text-faint'}`}>
                        {String(day).padStart(2, '0')}
                      </span>
                      {isHoliday && <Sun size={12} className="text-warning" />}
                    </div>
                    {tons > 0 ? (
                      <div className="mt-1.5 text-center">
                        <span className="text-sm font-bold tabular-nums text-ink">{tons}</span>
                        <span className="ml-0.5 text-[0.625rem] text-muted">t</span>
                      </div>
                    ) : (
                      <p className="mt-1.5 text-center text-[0.6875rem] font-medium text-faint">
                        {isHoliday ? 'Holiday' : 'Off'}
                      </p>
                    )}
                  </div>
                )
              })}
              <div className="flex min-h-[4.5rem] flex-col items-center justify-center border-l border-line bg-page/40 p-2">
                <span className="text-sm font-bold tabular-nums text-primary">{weekTotal(week)}</span>
                <span className="text-[0.625rem] text-muted">t</span>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-muted">
          The daily split follows the availability plan — days with more planned hours carry more of the target.
          Change {machine}’s planned hours in the Availability menu and this preview updates.
        </p>
      </FormBlock>

      {/* Copy configuration between machines */}
      <ReplicatePanel
        machine={machine}
        machines={MACHINES}
        scopes={[{ key: 'targets', label: 'Performance targets' }]}
        isCustomized={(m) => !!mp.map[m]}
        onApply={(direction, others) => mp.replicate(direction, others)}
        plain
      />
      </div>
    </section>
  )
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone?: 'primary' }) {
  const color = tone === 'primary' ? 'text-primary' : 'text-ink'
  return (
    <div className="rounded-xl border border-line bg-white px-3.5 py-2.5">
      <p className="text-[0.625rem] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-0.5 text-xl font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  )
}

const round1 = (n: number) => Math.round(n * 10) / 10
