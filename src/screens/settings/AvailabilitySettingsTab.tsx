import { useState } from 'react'
import { FormSection, Field } from '../../components/FormControls'
import PlanningCalendar from '../../components/planning/PlanningCalendar'
import { Sun, Info, Calendar, Plus, Trash, Download } from '../../icons/Icons'
import {
  WEEKDAYS,
  WEEKDAY_LABELS,
  WEEKDAY_LONG,
  parseISO,
  toISO,
  plannedHoursForMonth,
  useAvailabilitySettings,
  useAvailabilityPlan,
  useAvailabilityConfirm,
  useWorkingHolidays,
  type Weekday,
} from '../../lib/availability'
import { useHolidays } from '../../lib/holidays'

export default function AvailabilitySettingsTab() {
  const [settings, setSettings] = useAvailabilitySettings()
  const [plan, setPlan] = useAvailabilityPlan()
  const [confirm, setConfirm] = useAvailabilityConfirm()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const holidays = useHolidays(year)
  const workingHols = useWorkingHolidays()

  // Apply-over-range (working schedule → plan).
  const [applyStart, setApplyStart] = useState('')
  const [applyEnd, setApplyEnd] = useState('')

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
      {/* Working schedule — defines what the calendar fills with */}
      <FormSection title="Working schedule">
        <p className="mb-2 text-sm text-muted">Working days</p>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((d) => {
            const on = settings.workingDays.includes(d)
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleWorkingDay(d)}
                className={`min-w-[3.25rem] rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  on
                    ? 'border-primary bg-primary text-white'
                    : 'border-line text-muted hover:border-primary hover:text-primary'
                }`}
              >
                {WEEKDAY_LABELS[d]}
              </button>
            )
          })}
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm text-muted">Default time per day</p>
          {settings.workingDays.length === 0 ? (
            <p className="text-sm text-faint">Select at least one working day above.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {[...settings.workingDays]
                .sort((a, b) => a - b)
                .map((d) => (
                  <div key={d} className="flex items-center gap-2">
                    <span className="w-9 text-sm text-ink">{WEEKDAY_LABELS[d]}</span>
                    <div className="w-24">
                      <NumberBox
                        value={settings.defaultHoursByWeekday[d] ?? 0}
                        suffix="h"
                        min={0}
                        step={0.5}
                        onChange={(n) => setDefaultHours(d, n)}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Apply the working schedule across a date range */}
        <div className="mt-6 border-t border-line pt-4">
          <p className="mb-2 text-sm text-muted">Apply schedule to a period</p>
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
            Fills every day in the range with its weekday’s default hours (non-working days and holidays stay off
            unless marked as working).
          </p>
        </div>
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
          confirm={confirm}
          setConfirm={setConfirm}
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

// Number input matching the FormControls field box, but value-as-number.
function NumberBox({
  value,
  onChange,
  suffix,
  min,
  max,
  step,
}: {
  value: number
  onChange: (n: number) => void
  suffix?: string
  min?: number
  max?: number
  step?: number
}) {
  return (
    <div className="flex w-full items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink transition-colors focus-within:border-primary">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = e.target.value === '' ? 0 : Number(e.target.value)
          onChange(Number.isFinite(n) ? n : 0)
        }}
        className="min-w-0 flex-1 bg-transparent tabular-nums outline-none"
      />
      {suffix && <span className="shrink-0 text-muted">{suffix}</span>}
    </div>
  )
}
