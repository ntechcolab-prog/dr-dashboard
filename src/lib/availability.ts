// Availability planning — settings model, persisted hooks and pure helpers.
//
// This module owns the *configuration* and *math* of availability planning.
// The actual numbers shown on the dashboard (executed hours, alarms) come from
// the swappable service in `src/data/availabilityData.ts`. Keeping the two apart
// means replacing the mock source with a real API later touches only that file.

import { useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'

const EMPTY_SET: Set<string> = new Set()

// --- Planning period granularity (TASK-1) ---

export type PlanningGranularity =
  | 'Daily'
  | 'Weekly'
  | 'Monthly'
  | 'Bimonthly'
  | 'Quarterly'
  | 'Biannual'

export const PLANNING_GRANULARITIES: PlanningGranularity[] = [
  'Daily',
  'Weekly',
  'Monthly',
  'Bimonthly',
  'Quarterly',
  'Biannual',
]

// 0 = Sunday … 6 = Saturday (matches Date.getDay()).
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6
export const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6]
export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// --- Settings model (TASK-2/3/4/12/6) ---

export interface AvailabilitySettings {
  granularity: PlanningGranularity // TASK-1
  hoursPerPeriod: number // TASK-2 — target working hours for the chosen period
  workingDays: Weekday[] // TASK-3 — which weekdays the company operates
  defaultHoursByWeekday: Record<Weekday, number> // TASK-4 — standard time per day
  monthlyGoalPct: number // TASK-12 — availability target (%) for the month
  operateOnHolidays: boolean // TASK-6 — company also produces on holidays
}

export const DEFAULT_AVAILABILITY_SETTINGS: AvailabilitySettings = {
  granularity: 'Monthly',
  hoursPerPeriod: 160,
  workingDays: [1, 2, 3, 4, 5],
  defaultHoursByWeekday: { 0: 0, 1: 8, 2: 8, 3: 8, 4: 8, 5: 8, 6: 0 },
  monthlyGoalPct: 85,
  operateOnHolidays: false,
}

const SETTINGS_KEY = 'dr-availability-settings'

export function useAvailabilitySettings() {
  const [raw, setRaw] = useLocalStorage<AvailabilitySettings>(SETTINGS_KEY, DEFAULT_AVAILABILITY_SETTINGS)
  // Merge against defaults so older persisted blobs gain any new fields.
  const settings: AvailabilitySettings = {
    ...DEFAULT_AVAILABILITY_SETTINGS,
    ...raw,
    defaultHoursByWeekday: { ...DEFAULT_AVAILABILITY_SETTINGS.defaultHoursByWeekday, ...raw.defaultHoursByWeekday },
  }
  return [settings, setRaw] as const
}

// A production day has at most 24 hours — every write path (calendar cells,
// steppers, schedule inputs, the assistant and the header quick-edit) clamps
// through here.
export const MAX_DAY_HOURS = 24
export function clampDayHours(h: number): number {
  if (!Number.isFinite(h)) return 0
  return Math.max(0, Math.min(MAX_DAY_HOURS, h))
}

// --- Per-day planned-hours overrides (the planning calendar, TASK-7/8/9/10) ---
// Keyed by ISO date 'YYYY-MM-DD'. Absent days fall back to the weekday default.

export type PlanMap = Record<string, number>

const PLAN_KEY = 'dr-availability-plan'

export function useAvailabilityPlan() {
  return useLocalStorage<PlanMap>(PLAN_KEY, {})
}

// --- Confirmation locks (TASK-11) — per ISO week ('2026-W24') and month ('2026-06') ---

export type ConfirmMap = Record<string, boolean>

const CONFIRM_KEY = 'dr-availability-confirm'

export function useAvailabilityConfirm() {
  return useLocalStorage<ConfirmMap>(CONFIRM_KEY, {})
}

// --- Holidays explicitly marked as working days (per ISO date) ---
// Independent of the day's hours, so the toggle can be turned off without
// zeroing the number.

const WORKING_HOLIDAYS_KEY = 'dr-working-holidays'

export function useWorkingHolidays() {
  const [list, setList] = useLocalStorage<string[]>(WORKING_HOLIDAYS_KEY, [])
  const set = useMemo(() => new Set(list), [list])
  const isWorking = (iso: string) => set.has(iso)
  const setWorking = (iso: string, next: boolean) =>
    setList((prev) => (next ? (prev.includes(iso) ? prev : [...prev, iso]) : prev.filter((x) => x !== iso)))
  return { set, isWorking, setWorking } as const
}

// --- Per-machine availability (Settings › Production) ---
//
// Copy-on-write overlay over the plant-wide config above: a machine with no
// entry inherits the global settings/plan/working-holidays; the first edit
// snapshots the effective value into its own entry, and from then on the
// machine owns that piece of config. Keeping the global keys untouched means
// the header mini-calendar, the batches calendar and v2 keep working as-is.

export interface MachineAvailabilityEntry {
  settings?: AvailabilitySettings
  plan?: PlanMap
  workingHolidays?: string[]
}

export type MachineAvailabilityMap = Record<string, MachineAvailabilityEntry>

const BY_MACHINE_KEY = 'dr-availability-by-machine'

export function useMachineAvailabilityMap() {
  return useLocalStorage<MachineAvailabilityMap>(BY_MACHINE_KEY, {})
}

export interface EffectiveMachineAvailability {
  settings: AvailabilitySettings
  plan: PlanMap
  workingHolidays: Set<string>
  /** which pieces the machine owns (true) vs inherits from the plant (false) */
  owns: { settings: boolean; plan: boolean; workingHolidays: boolean }
}

// Pure resolver so non-hook code (loops over machines, replicate panel) can
// compute a machine's effective config from already-fetched state.
export function resolveMachineAvailability(
  map: MachineAvailabilityMap,
  machine: string | undefined,
  globalSettings: AvailabilitySettings,
  globalPlan: PlanMap,
  globalWorkingHolidays: Set<string>
): EffectiveMachineAvailability {
  const entry = (machine && map[machine]) || {}
  return {
    settings: entry.settings ?? globalSettings,
    plan: entry.plan ?? globalPlan,
    workingHolidays: entry.workingHolidays ? new Set(entry.workingHolidays) : globalWorkingHolidays,
    owns: { settings: !!entry.settings, plan: !!entry.plan, workingHolidays: !!entry.workingHolidays },
  }
}

// Hook mirror of the global trio (settings/plan/workingHolidays) scoped to one
// machine. Setter signatures match the global hooks so the availability
// section works with either source. No machine → behaves like the global hooks.
export function useMachineAvailability(machine?: string) {
  const [globalSettings, setGlobalSettings] = useAvailabilitySettings()
  const [globalPlan, setGlobalPlan] = useAvailabilityPlan()
  const globalWh = useWorkingHolidays()
  const [map, setMap] = useMachineAvailabilityMap()

  const effective = resolveMachineAvailability(map, machine, globalSettings, globalPlan, globalWh.set)

  const patchEntry = (patch: (entry: MachineAvailabilityEntry, eff: EffectiveMachineAvailability) => MachineAvailabilityEntry) =>
    setMap((prev) => {
      if (!machine) return prev
      const eff = resolveMachineAvailability(prev, machine, globalSettings, globalPlan, globalWh.set)
      return { ...prev, [machine]: patch(prev[machine] ?? {}, eff) }
    })

  const setSettings = (updater: (prev: AvailabilitySettings) => AvailabilitySettings) => {
    if (!machine) return setGlobalSettings(updater)
    patchEntry((entry, eff) => ({ ...entry, settings: updater(eff.settings) }))
  }

  const setPlan = (updater: (prev: PlanMap) => PlanMap) => {
    if (!machine) return setGlobalPlan(updater)
    patchEntry((entry, eff) => ({ ...entry, plan: updater(eff.plan) }))
  }

  const setWorkingHoliday = (iso: string, next: boolean) => {
    if (!machine) return globalWh.setWorking(iso, next)
    patchEntry((entry, eff) => {
      const list = entry.workingHolidays ?? [...eff.workingHolidays]
      const has = list.includes(iso)
      const workingHolidays = next ? (has ? list : [...list, iso]) : list.filter((x) => x !== iso)
      return { ...entry, workingHolidays }
    })
  }

  // Copy config between machines (Settings › Production › Copy configuration).
  // 'to' pushes this machine's effective config onto the targets; 'from' pulls
  // the first target's effective config onto this machine. Only the chosen
  // scopes are written — everything else on the target machines is untouched.
  const replicate = (direction: 'to' | 'from', otherMachines: string[], scopes: AvailabilityScopeKey[]) => {
    if (!machine || otherMachines.length === 0 || scopes.length === 0) return
    setMap((prev) => {
      const snapshot = (of: string): MachineAvailabilityEntry => {
        const eff = resolveMachineAvailability(prev, of, globalSettings, globalPlan, globalWh.set)
        const entry: MachineAvailabilityEntry = {}
        if (scopes.includes('settings'))
          entry.settings = { ...eff.settings, defaultHoursByWeekday: { ...eff.settings.defaultHoursByWeekday } }
        if (scopes.includes('plan')) entry.plan = { ...eff.plan }
        if (scopes.includes('workingHolidays')) entry.workingHolidays = [...eff.workingHolidays]
        return entry
      }
      const next = { ...prev }
      if (direction === 'to') {
        const snap = snapshot(machine)
        for (const m of otherMachines) next[m] = { ...prev[m], ...snap }
      } else {
        next[machine] = { ...prev[machine], ...snapshot(otherMachines[0]) }
      }
      return next
    })
  }

  // Resolve ANY machine's effective config from the same state (for views that
  // loop over the fleet, e.g. per-machine export sheets).
  const resolve = (m: string) => resolveMachineAvailability(map, m, globalSettings, globalPlan, globalWh.set)

  return { ...effective, setSettings, setPlan, setWorkingHoliday, replicate, resolve, map, setMap } as const
}

export type AvailabilityScopeKey = 'settings' | 'plan' | 'workingHolidays'

// --- Dashboard chart-type preferences (TASK-19), persisted per user ---

export type ChartType = 'bar' | 'line' | 'area'
export const CHART_TYPES: ChartType[] = ['bar', 'line', 'area']
export const CHART_TYPE_LABELS: Record<ChartType, string> = { bar: 'Bars', line: 'Line', area: 'Area' }

export type CardKey = 'today' | 'yesterday' | 'month' | 'year' | 'goal' | 'alarms'

export type DashboardPrefs = Partial<Record<CardKey, ChartType>>

const PREFS_KEY = 'dr-availability-dashprefs'
const DEFAULT_PREFS: DashboardPrefs = { month: 'bar', year: 'bar' }

export function useDashboardPrefs() {
  const [prefs, setPrefs] = useLocalStorage<DashboardPrefs>(PREFS_KEY, DEFAULT_PREFS)
  const setCard = (key: CardKey, type: ChartType) => setPrefs((p) => ({ ...p, [key]: type }))
  const typeFor = (key: CardKey, fallback: ChartType = 'bar'): ChartType => prefs[key] ?? fallback
  return { prefs, setCard, typeFor } as const
}

// --- Date helpers (timezone-safe: parse/format in local time, never UTC) ---

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isoOf(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

// ISO week key like '2026-W24' (Thursday-based ISO 8601 week number).
export function isoWeekKey(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = (d.getDay() + 6) % 7 // Mon=0 … Sun=6
  d.setDate(d.getDate() - day + 3) // nearest Thursday
  const firstThursday = new Date(d.getFullYear(), 0, 4)
  const week = 1 + Math.round(((d.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

// --- Planned-hours resolution (the bridge Settings → Dashboard) ---
//
// Resolution order for a given day:
//   1. explicit value in the planning calendar (PlanMap), else
//   2. weekday default hours — unless it's a non-working weekday, or a holiday
//      the company doesn't operate on, in which case it's 0.

export function plannedHoursForDay(
  iso: string,
  plan: PlanMap,
  _settings: AvailabilitySettings,
  holidays: Set<string>,
  workingHolidays: Set<string> = EMPTY_SET
): number {
  // The plan is the single source of truth — the working schedule is only a
  // template applied via "Apply" / "Fill", never an automatic fallback. So a
  // day shows hours only when it has an explicit plan entry (any day, including
  // weekends). A holiday counts only when toggled to a working day.
  if (holidays.has(iso) && !workingHolidays.has(iso)) return 0
  return iso in plan ? plan[iso] : 0
}

// Total planned hours for a month (used by the Settings preview).
export function plannedHoursForMonth(
  year: number,
  month: number,
  plan: PlanMap,
  settings: AvailabilitySettings,
  holidays: Set<string>,
  workingHolidays: Set<string> = EMPTY_SET
): number {
  let total = 0
  const n = daysInMonth(year, month)
  for (let d = 1; d <= n; d++)
    total += plannedHoursForDay(isoOf(year, month, d), plan, settings, holidays, workingHolidays)
  return total
}

// availability % from planned vs executed, clamped to [0, 100]; 0 planned → 0.
export function availabilityPct(planned: number, executed: number): number {
  if (planned <= 0) return 0
  return Math.max(0, Math.min(100, (executed / planned) * 100))
}
