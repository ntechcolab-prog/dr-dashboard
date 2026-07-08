// Performance planning — per-machine throughput targets (Settings › Production).
//
// Mirrors the availability model: a machine with no entry inherits the plant
// defaults; the first edit snapshots them into its own entry (copy-on-write).
// The dashboard goal % stays in `performanceData.PERFORMANCE_GOAL_PCT` — this
// module owns the tonnage targets the customer plans against.

import { useLocalStorage } from './useLocalStorage'
import { daysInMonth } from './availability'

export type TargetPeriod = 'month' | 'week' | 'day'

export const TARGET_PERIODS: TargetPeriod[] = ['month', 'week', 'day']
export const TARGET_PERIOD_LABELS: Record<TargetPeriod, string> = {
  month: 'per month',
  week: 'per week',
  day: 'per day',
}

export interface PerformanceSettings {
  targetRate: number // t/h the machine should sustain while grinding
  productionTarget: number // tons per target period
  targetPeriod: TargetPeriod
}

// Plant defaults sized against the mock batches (~1 t and ~1.4 h grinding per
// batch, ~15 batches per machine-month).
export const DEFAULT_PERFORMANCE_SETTINGS: PerformanceSettings = {
  targetRate: 1,
  productionTarget: 20,
  targetPeriod: 'month',
}

export type MachinePerformanceMap = Record<string, PerformanceSettings>

const BY_MACHINE_KEY = 'dr-performance-by-machine'

export function useMachinePerformanceMap() {
  return useLocalStorage<MachinePerformanceMap>(BY_MACHINE_KEY, {})
}

export function resolveMachinePerformance(map: MachinePerformanceMap, machine?: string): PerformanceSettings {
  const entry = machine ? map[machine] : undefined
  return { ...DEFAULT_PERFORMANCE_SETTINGS, ...entry }
}

export function useMachinePerformance(machine?: string) {
  const [map, setMap] = useMachinePerformanceMap()
  const settings = resolveMachinePerformance(map, machine)
  const owns = !!(machine && map[machine])

  const setSettings = (updater: (prev: PerformanceSettings) => PerformanceSettings) =>
    setMap((prev) => {
      if (!machine) return prev
      return { ...prev, [machine]: updater(resolveMachinePerformance(prev, machine)) }
    })

  // Copy targets between machines — same semantics as the availability one.
  const replicate = (direction: 'to' | 'from', otherMachines: string[]) => {
    if (!machine || otherMachines.length === 0) return
    setMap((prev) => {
      const next = { ...prev }
      if (direction === 'to') {
        const snap = resolveMachinePerformance(prev, machine)
        for (const m of otherMachines) next[m] = { ...snap }
      } else {
        next[machine] = { ...resolveMachinePerformance(prev, otherMachines[0]) }
      }
      return next
    })
  }

  return { settings, setSettings, replicate, owns, map, setMap } as const
}

// --- Target math (the calendar preview) ---

// Normalize the user's target to a month total in tons.
//   per month → the value as-is
//   per week  → value × (days in month / 7), the usual ~4.3-week month
//   per day   → value × number of days with planned hours
export function monthlyTargetTons(
  settings: PerformanceSettings,
  year: number,
  month: number,
  plannedDaysCount: number
): number {
  const v = settings.productionTarget
  if (settings.targetPeriod === 'month') return v
  if (settings.targetPeriod === 'week') return round1((v * daysInMonth(year, month)) / 7)
  return round1(v * plannedDaysCount)
}

// Spread the month total across days proportionally to their planned hours —
// a day that runs longer carries more of the target. Days without planned
// hours get 0. Returns tons per day (1-indexed by position in `plannedByDay`).
export function distributeTargetByPlan(monthTotalTons: number, plannedByDay: number[]): number[] {
  const totalHours = plannedByDay.reduce((a, b) => a + b, 0)
  if (totalHours <= 0) return plannedByDay.map(() => 0)
  return plannedByDay.map((h) => round1((monthTotalTons * h) / totalHours))
}

const round1 = (n: number) => Math.round(n * 10) / 10
