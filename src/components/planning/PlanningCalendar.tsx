import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, Sun } from '../../icons/Icons'
import { useLooseNumber } from '../FormControls'
import {
  WEEKDAY_LABELS,
  clampDayHours,
  daysInMonth,
  isoOf,
  plannedHoursForDay,
  MAX_DAY_HOURS,
  type AvailabilitySettings,
  type PlanMap,
  type Weekday,
} from '../../lib/availability'

interface Props {
  year: number
  month: number // 0-based
  onPrev: () => void
  onNext: () => void
  settings: AvailabilitySettings
  plan: PlanMap
  setPlan: (updater: (prev: PlanMap) => PlanMap) => void
  holidaySet: Set<string> // single source of truth, passed from the tab
  holidayName: (iso: string) => string | undefined
  workingHolidays: Set<string> // holidays explicitly marked as working days
  onToggleWorkingHoliday: (iso: string, next: boolean) => void
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Build the weeks grid: array of 7-slot rows (null = empty leading/trailing cell).
function buildWeeks(year: number, month: number): (number | null)[][] {
  const total = daysInMonth(year, month)
  const firstDow = new Date(year, month, 1).getDay() // 0=Sun
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= total; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export default function PlanningCalendar({
  year,
  month,
  onPrev,
  onNext,
  settings,
  plan,
  setPlan,
  holidaySet,
  holidayName,
  workingHolidays,
  onToggleWorkingHoliday,
}: Props) {
  const weeks = useMemo(() => buildWeeks(year, month), [year, month])

  const setDay = (iso: string, hours: number) =>
    setPlan((prev) => ({ ...prev, [iso]: clampDayHours(hours) }))

  // --- Derived: heatmap scale + month summary (for the new clearer UI) ---
  const totalDays = daysInMonth(year, month)
  const maxHours = useMemo(() => {
    const defaults = Object.values(settings.defaultHoursByWeekday)
    const planned = Object.entries(plan)
      .filter(([iso]) => iso.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
      .map(([, h]) => h)
    return Math.max(8, ...defaults, ...planned)
  }, [settings.defaultHoursByWeekday, plan, year, month])

  const summary = useMemo(() => {
    let planned = 0
    let workingDays = 0
    let holidayCount = 0
    let offDays = 0
    for (let d = 1; d <= totalDays; d++) {
      const iso = isoOf(year, month, d)
      const h = plannedHoursForDay(iso, plan, settings, holidaySet, workingHolidays)
      if (holidaySet.has(iso)) holidayCount++
      if (h > 0) {
        planned += h
        workingDays++
      } else {
        offDays++
      }
    }
    return { planned, workingDays, holidayCount, offDays }
  }, [year, month, totalDays, plan, settings, holidaySet])

  const todayIso = isoOf(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

  return (
    <div>
      {/* Month nav + confirm month */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            aria-label="Previous month"
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-ink"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[9.5rem] text-center text-base font-semibold text-ink">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={onNext}
            aria-label="Next month"
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-ink"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Summary strip — read the month at a glance */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Planned hours" value={`${summary.planned}h`} tone="primary" />
        <SummaryStat label="Working days" value={String(summary.workingDays)} />
        <SummaryStat label="Days off" value={String(summary.offDays)} />
        <SummaryStat label="Holidays" value={String(summary.holidayCount)} tone="warning" />
      </div>

      {/* Calendar grid */}
      <div className="overflow-hidden rounded-xl border border-line">
        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-line bg-page">
          {WEEKDAY_LABELS.map((w, i) => (
            <div
              key={w}
              className={`px-2 py-2.5 text-center text-[0.6875rem] font-semibold uppercase tracking-wide ${
                settings.workingDays.includes(i as Weekday) ? 'text-ink' : 'text-faint'
              }`}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Week rows */}
        {weeks.map((week, wi) => {
          return (
            <div
              key={wi}
              className={`grid grid-cols-7 ${wi < weeks.length - 1 ? 'border-b border-line' : ''}`}
            >
              {week.map((day, di) => {
                if (day == null) {
                  return <div key={di} className="min-h-[5.5rem] border-r border-line bg-page/30 last:border-r-0" />
                }
                const iso = isoOf(year, month, day)
                const weekday = di as Weekday
                const isHoliday = holidaySet.has(iso)
                const isWorkingWeekday = settings.workingDays.includes(weekday)
                // A holiday is a working day only when explicitly toggled on —
                // independent of the hours, so toggling off keeps the number.
                const holidayWorking = isHoliday && workingHolidays.has(iso)
                // Any non-holiday day with planned hours is shown/editable — even
                // weekends, so hours added from the header reflect here too.
                const editable = isHoliday ? holidayWorking : isWorkingWeekday || (plan[iso] ?? 0) > 0
                const hours = plannedHoursForDay(iso, plan, settings, holidaySet, workingHolidays)
                return (
                  <DayPlanCell
                    key={di}
                    day={day}
                    hours={hours}
                    editable={editable}
                    isHoliday={isHoliday}
                    holidayLabel={isHoliday ? holidayName(iso) : undefined}
                    isOverride={iso in plan}
                    isToday={iso === todayIso}
                    maxHours={maxHours}
                    onSet={(h) => setDay(iso, h)}
                    onToggleHolidayWorking={isHoliday ? (next) => onToggleWorkingHoliday(iso, next) : undefined}
                  />
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: 'rgba(70,170,159,0.4)' }} /> Planned hours
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-dashed border-faint bg-white" /> Not set yet
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" /> Edited
        </span>
        <span className="flex items-center gap-1.5">
          <Sun size={13} className="text-warning" /> Holiday
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-page" /> Day off
        </span>
      </div>
    </div>
  )
}

// Day-cell hours input — loose while typing (clearable), clamped to 0–24.
function HoursInput({ hours, hasHours, onSet }: { hours: number; hasHours: boolean; onSet: (h: number) => void }) {
  const loose = useLooseNumber(hours, (n) => onSet(clampDayHours(n)))
  return (
    <input
      type="number"
      min={0}
      max={MAX_DAY_HOURS}
      step={0.5}
      value={loose.value}
      onChange={(e) => loose.onChange(e.target.value)}
      onBlur={loose.onBlur}
      className={`no-spin w-10 bg-transparent text-center text-base font-bold tabular-nums outline-none ${
        hasHours ? 'text-ink' : 'text-faint'
      }`}
    />
  )
}

// Stat chip for the month summary strip.
function SummaryStat({ label, value, tone }: { label: string; value: string; tone?: 'primary' | 'warning' }) {
  const color = tone === 'primary' ? 'text-primary' : tone === 'warning' ? 'text-warning' : 'text-ink'
  return (
    <div className="rounded-xl border border-line bg-white px-3.5 py-2.5">
      <p className="text-[0.625rem] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-0.5 text-xl font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  )
}

// One day in the planning grid. Clear state: heatmap-filled when hours are set,
// dashed "set" hint when a working day is still 0h, distinct off/holiday chips,
// an "edited" dot for explicit overrides, +/- steppers and a direct input.
function DayPlanCell({
  day,
  hours,
  editable,
  isHoliday,
  holidayLabel,
  isOverride,
  isToday,
  maxHours,
  onSet,
  onToggleHolidayWorking,
}: {
  day: number
  hours: number
  editable: boolean
  isHoliday: boolean
  holidayLabel?: string
  isOverride: boolean
  isToday: boolean
  maxHours: number
  onSet: (h: number) => void
  onToggleHolidayWorking?: (next: boolean) => void
}) {
  const hasHours = hours > 0
  // Heatmap tint for working days that have hours.
  const tint = editable && hasHours ? `rgba(70,170,159,${(0.12 + 0.32 * Math.min(1, hours / maxHours)).toFixed(3)})` : undefined

  const ring = isToday ? 'ring-2 ring-inset ring-primary/60' : ''

  return (
    <div
      className={`relative flex min-h-[6rem] flex-col border-r border-line p-2 last:border-r-0 ${ring} ${
        isHoliday && !editable ? 'bg-[#fdf3e2]' : !editable ? 'bg-page/50' : ''
      }`}
      style={{ background: tint }}
      title={holidayLabel}
    >
      {/* day number + markers */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold ${editable ? 'text-ink' : 'text-faint'}`}>
          {String(day).padStart(2, '0')}
        </span>
        <span className="flex items-center gap-1">
          {isOverride && editable && <span className="h-1.5 w-1.5 rounded-full bg-primary" title="Edited" />}
          {isHoliday && <Sun size={13} className="text-warning" />}
        </span>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col">
        {!editable ? (
          <div className="mt-1.5 flex flex-col">
            <span className="text-[0.6875rem] font-medium text-faint">{isHoliday ? 'Holiday' : 'Day off'}</span>
            {isHoliday && holidayLabel && (
              <span className="mt-0.5 truncate text-[0.625rem] text-muted">{holidayLabel}</span>
            )}
          </div>
        ) : (
          <div className="mt-1.5">
            <div
              className={`flex items-center justify-center gap-1 rounded-lg ${
                hasHours ? '' : 'border border-dashed border-faint'
              }`}
            >
              <button
                type="button"
                onClick={() => onSet(Math.max(0, Math.round((hours - 1) * 2) / 2))}
                aria-label="Decrease hours"
                className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted hover:bg-white/70 hover:text-ink"
              >
                <span className="text-base leading-none">−</span>
              </button>
              <HoursInput hours={hours} hasHours={hasHours} onSet={onSet} />
              <button
                type="button"
                onClick={() => onSet(clampDayHours(Math.round((hours + 1) * 2) / 2))}
                aria-label="Increase hours"
                className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted hover:bg-white/70 hover:text-ink"
              >
                <span className="text-base leading-none">+</span>
              </button>
            </div>
            {!hasHours && <p className="mt-1 text-center text-[0.5625rem] text-faint">not set</p>}
          </div>
        )}

        {/* per-holiday "this is a working day" toggle (replaces the global setting) */}
        {isHoliday && onToggleHolidayWorking && (
          <button
            type="button"
            onClick={() => onToggleHolidayWorking(!editable)}
            className="mt-auto flex items-center gap-1.5 pt-1.5 text-[0.625rem] font-medium text-muted hover:text-ink"
            title={editable ? 'Holiday set as a working day — click to make it a day off' : 'Make this holiday a working day'}
          >
            <span
              className={`relative inline-flex h-3.5 w-6 shrink-0 items-center rounded-full transition-colors ${
                editable ? 'bg-primary' : 'bg-line'
              }`}
            >
              <span
                className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow transition-transform ${
                  editable ? 'translate-x-3' : 'translate-x-0.5'
                }`}
              />
            </span>
            Working day
          </button>
        )}
      </div>
    </div>
  )
}

