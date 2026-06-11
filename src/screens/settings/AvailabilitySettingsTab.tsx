import { useState } from 'react'
import { FormSection, Field } from '../../components/FormControls'
import PlanningCalendar from '../../components/planning/PlanningCalendar'
import { Sun, Info, Calendar, Plus, Trash, Download, ChevronDown } from '../../icons/Icons'
import {
  WEEKDAYS,
  WEEKDAY_LABELS,
  WEEKDAY_LONG,
  parseISO,
  toISO,
  isoOf,
  daysInMonth,
  plannedHoursForMonth,
  useAvailabilitySettings,
  useAvailabilityPlan,
  useWorkingHolidays,
  type Weekday,
} from '../../lib/availability'
import { useHolidays } from '../../lib/holidays'
import { parseAssistant, type ParsedRule } from '../../components/planning/assistantParser'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function AvailabilitySettingsTab() {
  const [settings, setSettings] = useAvailabilitySettings()
  const [plan, setPlan] = useAvailabilityPlan()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const holidays = useHolidays(year)
  const workingHols = useWorkingHolidays()

  // Apply-over-range (working schedule → plan).
  const [showApplyPeriod, setShowApplyPeriod] = useState(false)
  const [applyStart, setApplyStart] = useState('')
  const [applyEnd, setApplyEnd] = useState('')

  // Working-schedule mode: manual config vs. the planning assistant.
  const [scheduleMode, setScheduleMode] = useState<'manual' | 'assistant'>('manual')

  // Planning assistant (natural language → plan for the viewed month).
  const [assistantText, setAssistantText] = useState('')
  const [preview, setPreview] = useState<ParsedRule | null>(null)
  const parseAssistantNow = () => setPreview(parseAssistant(assistantText))
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
  }

  const applyRange = () => {
    if (!applyStart || !applyEnd) return
    const start = parseISO(applyStart)
    const end = parseISO(applyEnd)
    if (end < start) return
    setPlan((prev) => {
      const next = { ...prev }
      const cur = new Date(start)
      while (cur <= end) {
        const iso = toISO(cur)
        const wd = cur.getDay() as Weekday
        let h = 0
        if (holidays.set.has(iso)) h = workingHols.set.has(iso) ? settings.defaultHoursByWeekday[wd] ?? 0 : 0
        else if (settings.workingDays.includes(wd)) h = settings.defaultHoursByWeekday[wd] ?? 0
        next[iso] = h
        cur.setDate(cur.getDate() + 1)
      }
      return next
    })
  }

  // Add-holiday form + import status (Add Holiday / Import holidays).
  const [showAddHoliday, setShowAddHoliday] = useState(false)
  const [newHolidayDate, setNewHolidayDate] = useState('')
  const [newHolidayName, setNewHolidayName] = useState('')
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  const addHoliday = () => {
    if (!newHolidayDate) return
    holidays.add(newHolidayDate, newHolidayName || 'Custom holiday')
    setNewHolidayDate('')
    setNewHolidayName('')
    setShowAddHoliday(false)
  }

  const importHolidays = async () => {
    setImporting(true)
    setImportMsg(null)
    try {
      const n = await holidays.importYear(year)
      setImportMsg(n > 0 ? `Imported ${n} holiday${n === 1 ? '' : 's'} for ${year}.` : `No new holidays to import for ${year}.`)
    } catch {
      setImportMsg('Could not reach the holidays service. Check your connection and try again.')
    } finally {
      setImporting(false)
    }
  }

  const toggleWorkingDay = (d: Weekday) =>
    setSettings((prev) => {
      const has = prev.workingDays.includes(d)
      const workingDays = has
        ? prev.workingDays.filter((w) => w !== d)
        : [...prev.workingDays, d].sort((a, b) => a - b)
      return { ...prev, workingDays }
    })

  const setDefaultHours = (d: Weekday, hours: number) =>
    setSettings((prev) => ({
      ...prev,
      defaultHoursByWeekday: { ...prev.defaultHoursByWeekday, [d]: hours },
    }))

  const monthTotal = plannedHoursForMonth(year, month, plan, settings, holidays.set, workingHols.set)

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

  return (
    <div className="flex flex-col gap-4">
      {/* Working schedule */}
      <FormSection title="Working schedule">
        {/* mode switch */}
        <div className="mb-5 inline-flex rounded-lg bg-page p-1">
          {([
            ['manual', 'Manual configuration'],
            ['assistant', 'Planning assistant'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setScheduleMode(key)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                scheduleMode === key ? 'bg-white text-primary shadow-card' : 'text-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {scheduleMode === 'manual' ? (
          <>
            <p className="mb-2 text-sm text-muted">Working days · select a day to set its hours</p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((d) => {
                const on = settings.workingDays.includes(d)
                return (
                  <div key={d} className="flex w-[4.75rem] flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleWorkingDay(d)}
                      className={`rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                        on
                          ? 'border-primary bg-primary text-white'
                          : 'border-line text-muted hover:border-primary hover:text-primary'
                      }`}
                    >
                      {WEEKDAY_LABELS[d]}
                    </button>
                    {on && (
                      <div className="flex items-center rounded-lg border border-line bg-white px-2 py-1.5 focus-within:border-primary">
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={settings.defaultHoursByWeekday[d] ?? 0}
                          onChange={(e) => setDefaultHours(d, e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                          className="no-spin w-full min-w-0 bg-transparent text-center text-sm font-semibold tabular-nums text-ink outline-none"
                        />
                        <span className="text-xs text-muted">h</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Apply the working schedule across a date range — pinned to the card footer */}
            <div className="mt-5 border-t border-line pt-4">
              <button
                type="button"
                onClick={() => setShowApplyPeriod((v) => !v)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                <ChevronDown size={16} className={`transition-transform ${showApplyPeriod ? 'rotate-180' : ''}`} />
                Apply schedule to a period
              </button>
            </div>
            {showApplyPeriod && (
              <div className="mt-4">
                <div className="flex flex-wrap items-end gap-3">
                  <Field label="Start" className="w-44">
                    <input
                      type="date"
                      value={applyStart}
                      onChange={(e) => setApplyStart(e.target.value)}
                      className="no-spin w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
                    />
                  </Field>
                  <Field label="End" className="w-44">
                    <input
                      type="date"
                      value={applyEnd}
                      onChange={(e) => setApplyEnd(e.target.value)}
                      className="no-spin w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={applyRange}
                    disabled={!applyStart || !applyEnd}
                    className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
                <p className="mt-2 text-xs text-muted">
                  Fills every day in the range with its weekday’s hours (non-working days and holidays stay off
                  unless marked as working).
                </p>
              </div>
            )}
          </>
        ) : (
          <div>
            <p className="mb-1 text-sm font-medium text-ink">Use the Planning assistant</p>
            <p className="mb-3 text-xs text-muted">
              Describe the plan in plain English — applied to {MONTH_NAMES[month]} {year} (the month shown in the calendar below).
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
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
              type="button"
              onClick={parseAssistantNow}
              disabled={!assistantText.trim()}
              className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              Parse
            </button>
          </div>

          {preview && (
            <div className="mt-3 rounded-lg border border-line bg-page/50 p-3">
              {Object.keys(preview.hoursByWeekday).length === 0 ? (
                <p className="text-sm text-down">Couldn’t read any weekday + hours from that.</p>
              ) : (
                <>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Parsed plan</p>
                  <ul className="flex flex-wrap gap-2 text-sm">
                    {(Object.entries(preview.hoursByWeekday) as [string, number][])
                      .sort((a, b) => Number(a[0]) - Number(b[0]))
                      .map(([wd, h]) => (
                        <li key={wd} className="rounded-md bg-primary-soft px-2.5 py-1 font-medium text-primary">
                          {WEEKDAY_LONG[Number(wd)]} · {h}h
                        </li>
                      ))}
                  </ul>
                  <p className="mt-2 text-xs text-muted">
                    {preview.untilDay ? `Applies to days 1–${preview.untilDay}.` : 'Applies to the whole month.'}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={applyAssistant} className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-700">
                      Apply
                    </button>
                    <button type="button" onClick={() => setPreview(null)} className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-muted hover:text-ink">
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          </div>
        )}
      </FormSection>

      {/* Planning calendar */}
      <FormSection
        title="Planning calendar"
        action={
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Calendar size={14} />
            {monthTotal} h planned this month
          </span>
        }
      >
        <PlanningCalendar
          year={year}
          month={month}
          onPrev={prevMonth}
          onNext={nextMonth}
          settings={settings}
          plan={plan}
          setPlan={setPlan}
          holidaySet={holidays.set}
          holidayName={holidays.nameOf}
          workingHolidays={workingHols.set}
          onToggleWorkingHoliday={workingHols.setWorking}
        />
      </FormSection>

      {/* 2. Holidays */}
      <FormSection
        title={`Holidays · ${year}`}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={importHolidays}
              disabled={importing}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-ink disabled:opacity-50"
            >
              <Download size={14} />
              {importing ? 'Importing…' : 'Import holidays'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddHoliday((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <Plus size={14} />
              Add Holiday
            </button>
          </div>
        }
      >
        <p className="mb-3 flex items-start gap-2 text-sm text-muted">
          <Info size={15} className="mt-0.5 shrink-0 text-primary" />
          Holidays are days off in the calendar above. Need to produce on one? Toggle
          “Working day” on that day. Add your own holidays, or import the public list for {year}.
        </p>

        {importMsg && <p className="mb-3 rounded-lg bg-page px-3 py-2 text-xs text-muted">{importMsg}</p>}

        {showAddHoliday && (
          <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-line bg-page/60 p-3">
            <Field label="Date" className="w-44">
              <input
                type="date"
                value={newHolidayDate}
                onChange={(e) => setNewHolidayDate(e.target.value)}
                className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
              />
            </Field>
            <Field label="Name" className="min-w-[12rem] flex-1">
              <input
                type="text"
                value={newHolidayName}
                onChange={(e) => setNewHolidayName(e.target.value)}
                placeholder="e.g. Company anniversary"
                className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-primary"
              />
            </Field>
            <button
              type="button"
              onClick={addHoliday}
              disabled={!newHolidayDate}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        )}

        {holidays.holidays.length === 0 ? (
          <p className="text-sm text-faint">No holidays for {year}. Add one or import the public list.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {holidays.holidays.map((h) => {
              const d = parseISO(h.date)
              const label = `${WEEKDAY_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
              const custom = holidays.isCustom(h.date)
              return (
                <li key={h.date} className="group flex items-center gap-3 rounded-lg border border-line bg-white px-3 py-2.5">
                  <Sun size={16} className="shrink-0 text-warning" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{h.name}</p>
                    <p className="text-xs text-muted">{label}</p>
                  </div>
                  {custom && (
                    <button
                      type="button"
                      onClick={() => holidays.remove(h.date)}
                      aria-label={`Remove ${h.name}`}
                      className="shrink-0 rounded p-1 text-faint transition-colors hover:bg-page hover:text-down"
                    >
                      <Trash size={15} />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </FormSection>

    </div>
  )
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
