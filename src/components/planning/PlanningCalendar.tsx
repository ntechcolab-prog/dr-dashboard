import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Wand,
  Copy,
  Refresh,
  Sun,
  CalendarCheck,
  CheckCircle,
  Close,
} from '../../icons/Icons'
import {
  WEEKDAY_LABELS,
  WEEKDAY_LONG,
  daysInMonth,
  isoOf,
  parseISO,
  monthKey,
  isoWeekKey,
  plannedHoursForDay,
  type AvailabilitySettings,
  type PlanMap,
  type ConfirmMap,
  type Weekday,
} from '../../lib/availability'
import { parseAssistant, type ParsedRule } from './assistantParser'

interface Props {
  year: number
  month: number // 0-based
  onPrev: () => void
  onNext: () => void
  settings: AvailabilitySettings
  plan: PlanMap
  setPlan: (updater: (prev: PlanMap) => PlanMap) => void
  confirm: ConfirmMap
  setConfirm: (updater: (prev: ConfirmMap) => ConfirmMap) => void
  holidaySet: Set<string> // single source of truth, passed from the tab
  holidayName: (iso: string) => string | undefined
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
  confirm,
  setConfirm,
  holidaySet,
  holidayName,
}: Props) {
  const weeks = useMemo(() => buildWeeks(year, month), [year, month])

  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantText, setAssistantText] = useState('')
  const [preview, setPreview] = useState<ParsedRule | null>(null)

  const setDay = (iso: string, hours: number) =>
    setPlan((prev) => ({ ...prev, [iso]: hours }))

  // Resolve the default hours a working day would receive (holiday-aware).
  const defaultFor = (day: number): number => {
    const iso = isoOf(year, month, day)
    const weekday = new Date(year, month, day).getDay() as Weekday
    if (holidaySet.has(iso) && !settings.operateOnHolidays) return 0
    if (!settings.workingDays.includes(weekday)) return 0
    return settings.defaultHoursByWeekday[weekday] ?? 0
  }

  // --- Toolbar actions ---

  // TASK-7: fill every day of the month with its weekday default (holidays→0).
  const fillWithDefault = () => {
    setPlan((prev) => {
      const next = { ...prev }
      const n = daysInMonth(year, month)
      for (let d = 1; d <= n; d++) next[isoOf(year, month, d)] = defaultFor(d)
      return next
    })
  }

  // TASK-8: for each weekday, take its first occurrence's hours and apply to all.
  const replicateWeekday = () => {
    setPlan((prev) => {
      const next = { ...prev }
      const n = daysInMonth(year, month)
      const firstByWeekday: Partial<Record<Weekday, number>> = {}
      for (let d = 1; d <= n; d++) {
        const wd = new Date(year, month, d).getDay() as Weekday
        if (wd in firstByWeekday) continue
        firstByWeekday[wd] = plannedHoursForDay(isoOf(year, month, d), prev, settings, holidaySet)
      }
      for (let d = 1; d <= n; d++) {
        const wd = new Date(year, month, d).getDay() as Weekday
        const h = firstByWeekday[wd]
        if (h != null) next[isoOf(year, month, d)] = h
      }
      return next
    })
  }

  // TASK-10: copy previous month's plan by day-of-month into this month.
  const copyFromLastMonth = () => {
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    // Source holidays are only on hand when last month is in the loaded year.
    const srcHolidays = prevYear === year ? holidaySet : new Set<string>()
    setPlan((prev) => {
      const next = { ...prev }
      const n = daysInMonth(year, month)
      const prevN = daysInMonth(prevYear, prevMonth)
      for (let d = 1; d <= n; d++) {
        if (d > prevN) continue
        const srcIso = isoOf(prevYear, prevMonth, d)
        next[isoOf(year, month, d)] = plannedHoursForDay(srcIso, prev, settings, srcHolidays)
      }
      return next
    })
  }

  // TASK-9: assistant — parse text into a rule preview.
  const runAssistantParse = () => setPreview(parseAssistant(assistantText))

  const applyAssistant = () => {
    if (!preview) return
    setPlan((prev) => {
      const next = { ...prev }
      const n = daysInMonth(year, month)
      const bound = preview.untilDay ?? n
      for (let d = 1; d <= Math.min(bound, n); d++) {
        const wd = new Date(year, month, d).getDay() as Weekday
        const h = preview.hoursByWeekday[wd]
        if (h != null) next[isoOf(year, month, d)] = h
      }
      return next
    })
    setPreview(null)
    setAssistantText('')
    setAssistantOpen(false)
  }

  // --- Confirmation (TASK-11) ---

  const monthMk = monthKey(year, month)
  const monthConfirmed = !!confirm[monthMk]
  const toggleMonth = () =>
    setConfirm((prev) => ({ ...prev, [monthMk]: !prev[monthMk] }))

  const weekKeyOf = (week: (number | null)[]): string | null => {
    const firstDay = week.find((d) => d != null)
    if (firstDay == null) return null
    return isoWeekKey(parseISO(isoOf(year, month, firstDay)))
  }

  const toggleWeek = (wk: string) =>
    setConfirm((prev) => ({ ...prev, [wk]: !prev[wk] }))

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
      const h = plannedHoursForDay(iso, plan, settings, holidaySet)
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

        <button
          onClick={toggleMonth}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            monthConfirmed
              ? 'bg-primary text-white'
              : 'border border-primary text-primary hover:bg-primary-soft'
          }`}
        >
          <CalendarCheck size={16} />
          {monthConfirmed ? 'Month confirmed' : 'OK month'}
        </button>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ToolbarButton icon={<CheckCircle size={15} />} label="Fill with default" onClick={fillWithDefault} />
        <ToolbarButton icon={<Refresh size={15} />} label="Replicate weekday" onClick={replicateWeekday} />
        <ToolbarButton icon={<Copy size={15} />} label="Copy from last month" onClick={copyFromLastMonth} />
        <ToolbarButton
          icon={<Wand size={15} />}
          label="Planning assistant"
          onClick={() => setAssistantOpen((v) => !v)}
          active={assistantOpen}
        />
      </div>

      {/* Assistant panel */}
      {assistantOpen && (
        <div className="mb-4 rounded-lg border border-primary/40 bg-primary-soft/40 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-ink">
            <Wand size={16} className="text-primary" />
            Planning assistant
          </div>
          <p className="mt-1 text-xs text-muted">
            Describe the plan in plain English. The rule is applied to {MONTH_NAMES[month]} {year}.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={assistantText}
              onChange={(e) => {
                setAssistantText(e.target.value)
                setPreview(null)
              }}
              placeholder="Mondays, Tuesdays and Wednesdays for 8h, Thursdays and Fridays for 4h until day 20"
              className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-primary"
            />
            <button
              onClick={runAssistantParse}
              className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Parse
            </button>
          </div>

          {preview && (
            <div className="mt-3 rounded-lg border border-line bg-white p-3">
              {Object.keys(preview.hoursByWeekday).length === 0 ? (
                <p className="text-sm text-down">Couldn't read any weekday + hours from that.</p>
              ) : (
                <>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Parsed plan</p>
                  <ul className="flex flex-wrap gap-2 text-sm text-ink">
                    {(Object.entries(preview.hoursByWeekday) as [string, number][])
                      .sort((a, b) => Number(a[0]) - Number(b[0]))
                      .map(([wd, h]) => (
                        <li
                          key={wd}
                          className="rounded-md bg-primary-soft px-2.5 py-1 font-medium text-primary"
                        >
                          {WEEKDAY_LONG[Number(wd)]} · {h}h
                        </li>
                      ))}
                  </ul>
                  <p className="mt-2 text-xs text-muted">
                    {preview.untilDay
                      ? `Applied to days 1–${preview.untilDay} of the month.`
                      : 'Applied to the whole month.'}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={applyAssistant}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                      <CheckCircle size={15} /> Apply
                    </button>
                    <button
                      onClick={() => setPreview(null)}
                      className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-muted hover:text-ink"
                    >
                      <Close size={15} /> Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

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
        <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_3.75rem] border-b border-line bg-page">
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
          <div className="px-1 py-2.5 text-center text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">
            OK
          </div>
        </div>

        {/* Week rows */}
        {weeks.map((week, wi) => {
          const wk = weekKeyOf(week)
          const weekConfirmed = wk ? !!confirm[wk] : false
          const locked = weekConfirmed || monthConfirmed
          return (
            <div
              key={wi}
              className={`grid grid-cols-[repeat(7,minmax(0,1fr))_3.75rem] ${
                wi < weeks.length - 1 ? 'border-b border-line' : ''
              } ${weekConfirmed ? 'bg-primary-soft/20' : ''}`}
            >
              {week.map((day, di) => {
                if (day == null) {
                  return <div key={di} className="min-h-[5.5rem] border-r border-line bg-page/30 last:border-r-0" />
                }
                const iso = isoOf(year, month, day)
                const weekday = di as Weekday
                const isHoliday = holidaySet.has(iso)
                const isWorking = settings.workingDays.includes(weekday)
                const countsAsOff = (isHoliday && !settings.operateOnHolidays) || !isWorking
                const hours = plannedHoursForDay(iso, plan, settings, holidaySet)
                return (
                  <DayPlanCell
                    key={di}
                    day={day}
                    hours={hours}
                    editable={!countsAsOff}
                    isHoliday={isHoliday}
                    holidayLabel={isHoliday ? holidayName(iso) : undefined}
                    isOverride={iso in plan}
                    isToday={iso === todayIso}
                    locked={locked}
                    maxHours={maxHours}
                    onSet={(h) => setDay(iso, h)}
                  />
                )
              })}
              {/* Week confirm cell */}
              <div className="grid place-items-center border-l border-line p-1">
                {wk && (
                  <button
                    onClick={() => toggleWeek(wk)}
                    aria-label={weekConfirmed ? 'Un-confirm week' : 'Confirm week'}
                    title={weekConfirmed ? 'Confirmed — click to unlock' : 'Confirm this week'}
                    className={`grid h-9 w-9 place-items-center rounded-lg text-xs font-semibold transition-colors ${
                      weekConfirmed
                        ? 'bg-primary text-white'
                        : 'border border-line text-muted hover:border-primary hover:text-primary'
                    }`}
                  >
                    {weekConfirmed ? <CalendarCheck size={16} /> : 'OK'}
                  </button>
                )}
              </div>
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
        <span className="flex items-center gap-1.5">
          <CalendarCheck size={13} className="text-primary" /> Confirmed (locked)
        </span>
      </div>
    </div>
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
  locked,
  maxHours,
  onSet,
}: {
  day: number
  hours: number
  editable: boolean
  isHoliday: boolean
  holidayLabel?: string
  isOverride: boolean
  isToday: boolean
  locked: boolean
  maxHours: number
  onSet: (h: number) => void
}) {
  const hasHours = hours > 0
  // Heatmap tint for working days that have hours.
  const tint = editable && hasHours ? `rgba(70,170,159,${(0.12 + 0.32 * Math.min(1, hours / maxHours)).toFixed(3)})` : undefined

  const ring = isToday ? 'ring-2 ring-inset ring-primary/60' : ''

  return (
    <div
      className={`relative min-h-[5.5rem] border-r border-line p-2 last:border-r-0 ${ring} ${
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
          {locked && <CalendarCheck size={12} className="text-primary/70" />}
        </span>
      </div>

      {/* body */}
      {!editable ? (
        <div className="mt-2 flex flex-col">
          <span className="text-[0.6875rem] font-medium text-faint">{isHoliday ? 'Holiday' : 'Day off'}</span>
          {isHoliday && holidayLabel && (
            <span className="mt-0.5 truncate text-[0.625rem] text-muted">{holidayLabel}</span>
          )}
        </div>
      ) : locked ? (
        <div className="mt-2 flex items-baseline gap-0.5">
          <span className="text-lg font-bold tabular-nums text-ink">{hours}</span>
          <span className="text-xs text-muted">h</span>
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
            <input
              type="number"
              min={0}
              step={0.5}
              value={hours}
              onChange={(e) => {
                const v = e.target.value === '' ? 0 : Number(e.target.value)
                onSet(Number.isFinite(v) ? Math.max(0, v) : 0)
              }}
              className={`w-9 bg-transparent text-center text-base font-bold tabular-nums outline-none ${
                hasHours ? 'text-ink' : 'text-faint'
              }`}
            />
            <button
              type="button"
              onClick={() => onSet(Math.round((hours + 1) * 2) / 2)}
              aria-label="Increase hours"
              className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted hover:bg-white/70 hover:text-ink"
            >
              <span className="text-base leading-none">+</span>
            </button>
          </div>
          {!hasHours && <p className="mt-1 text-center text-[0.5625rem] text-faint">not set</p>}
        </div>
      )}
    </div>
  )
}

function ToolbarButton({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-primary bg-primary-soft text-primary'
          : 'border-line text-muted hover:border-primary hover:text-primary'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
