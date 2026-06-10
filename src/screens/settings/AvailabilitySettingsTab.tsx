import { useState } from 'react'
import { FormSection, Field, SelectInput } from '../../components/FormControls'
import PlanningCalendar from '../../components/planning/PlanningCalendar'
import { Sun, Info, Calendar } from '../../icons/Icons'
import {
  PLANNING_GRANULARITIES,
  WEEKDAYS,
  WEEKDAY_LABELS,
  WEEKDAY_LONG,
  parseISO,
  plannedHoursForMonth,
  useAvailabilitySettings,
  useAvailabilityPlan,
  useAvailabilityConfirm,
  type PlanningGranularity,
  type Weekday,
} from '../../lib/availability'
import { useHolidays } from '../../lib/holidays'

const GRANULARITY_NOUN: Record<PlanningGranularity, string> = {
  Daily: 'day',
  Weekly: 'week',
  Monthly: 'month',
  Bimonthly: 'two months',
  Quarterly: 'quarter',
  Biannual: 'half-year',
}

export default function AvailabilitySettingsTab() {
  const [settings, setSettings] = useAvailabilitySettings()
  const [plan, setPlan] = useAvailabilityPlan()
  const [confirm, setConfirm] = useAvailabilityConfirm()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const holidays = useHolidays(year)

  // --- Configuration setters (updater form) ---
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

  const periodNoun = GRANULARITY_NOUN[settings.granularity]
  const monthTotal = plannedHoursForMonth(year, month, plan, settings, holidays.set)

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
      {/* A. Configuration */}
      <FormSection title="Planning configuration">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Planning granularity">
            <SelectInput
              value={settings.granularity}
              options={PLANNING_GRANULARITIES as unknown as string[]}
              onChange={(v) => setSettings((prev) => ({ ...prev, granularity: v as PlanningGranularity }))}
            />
          </Field>

          <Field label={`Hours per ${periodNoun}`}>
            <NumberBox
              value={settings.hoursPerPeriod}
              suffix="h"
              onChange={(n) => setSettings((prev) => ({ ...prev, hoursPerPeriod: n }))}
            />
          </Field>

          <Field label="Monthly availability goal">
            <NumberBox
              value={settings.monthlyGoalPct}
              suffix="%"
              min={0}
              max={100}
              onChange={(n) =>
                setSettings((prev) => ({ ...prev, monthlyGoalPct: Math.max(0, Math.min(100, n)) }))
              }
            />
          </Field>

          <Field label="Operate on holidays">
            <div className="flex items-center gap-3 pt-1">
              <Toggle
                on={settings.operateOnHolidays}
                onChange={(on) => setSettings((prev) => ({ ...prev, operateOnHolidays: on }))}
              />
              <span className="text-sm text-muted">
                {settings.operateOnHolidays
                  ? 'Holidays count as worked days.'
                  : 'Holidays are treated as days off.'}
              </span>
            </div>
          </Field>
        </div>

        {/* Working days */}
        <div className="mt-6">
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
        </div>

        {/* Default time per working day */}
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
      </FormSection>

      {/* B. Holidays */}
      <FormSection
        title={`Holidays · ${year}`}
        action={
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Info size={14} />
            {settings.operateOnHolidays ? 'Counted as worked' : 'Treated as days off'}
          </span>
        }
      >
        <p className="mb-4 flex items-start gap-2 text-sm text-muted">
          <Info size={15} className="mt-0.5 shrink-0 text-primary" />
          These national holidays are reflected automatically in the planning calendar below.
        </p>
        {holidays.holidays.length === 0 ? (
          <p className="text-sm text-faint">No holidays loaded for {year}.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {holidays.holidays.map((h) => {
              const d = parseISO(h.date)
              const label = `${WEEKDAY_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
              return (
                <li
                  key={h.date}
                  className="flex items-center gap-3 rounded-lg border border-line bg-white px-3 py-2.5"
                >
                  <Sun size={16} className="shrink-0 text-warning" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{h.name}</p>
                    <p className="text-xs text-muted">{label}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </FormSection>

      {/* C. Planning calendar */}
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
        />
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

// Simple accessible switch.
function Toggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        on ? 'bg-primary' : 'bg-line'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
