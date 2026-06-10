// Mock availability data source + series builders.
//
// SWAP POINT: every executed-hours / alarm number originates here. Replace the
// body of `efficiency`, `executedHours` and `alarmsForDay` with real service
// calls and the whole dashboard (cards, gauges, charts) keeps working unchanged
// — the builders below only consume those primitives plus the planning config.

import {
  availabilityPct,
  daysInMonth,
  isoOf,
  plannedHoursForDay,
  parseISO,
  type AvailabilitySettings,
  type PlanMap,
} from '../lib/availability'

// --- deterministic PRNG (same family used across the app) ---

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const round1 = (n: number) => Math.round(n * 10) / 10

// Executed/planned efficiency for a day — mostly high, with occasional dips.
// Deterministic per ISO date so reloads are stable.
function efficiency(iso: string): number {
  const rng = mulberry32(hashStr(`avail|${iso}`))
  let eff = 0.82 + rng() * 0.17 // 0.82–0.99 baseline
  if (rng() < 0.12) eff -= 0.22 + rng() * 0.18 // bad day
  return Math.max(0.4, Math.min(1, eff))
}

// Mock alarm count for a day (0 on idle/zero-planned days handled by caller).
function alarmsForDay(iso: string): number {
  const rng = mulberry32(hashStr(`alarm|${iso}`))
  const roll = rng()
  if (roll > 0.85) return 3 + Math.floor(rng() * 4) // spike day
  if (roll > 0.55) return 1 + Math.floor(rng() * 2)
  return 0
}

// --- public primitives (the actual swap surface) ---

export interface DayAvailability {
  iso: string
  day: number
  planned: number
  executed: number
  pct: number
}

export function executedHours(iso: string, planned: number): number {
  if (planned <= 0) return 0
  return round1(planned * efficiency(iso))
}

export interface AvailabilityService {
  day(iso: string, plan: PlanMap, settings: AvailabilitySettings, holidays: Set<string>): DayAvailability
  monthSeries(
    year: number,
    month: number,
    plan: PlanMap,
    settings: AvailabilitySettings,
    holidays: Set<string>
  ): SeriesResult
  yearSeries(year: number, plan: PlanMap, settings: AvailabilitySettings, holidays: Set<string>): SeriesResult
  alarmsByDay(year: number, month: number): { day: number; iso: string; count: number }[]
}

export interface SeriesResult {
  labels: string[]
  planned: number[]
  executed: number[]
  pct: number[] // availability % per point
  totalPlanned: number
  totalExecuted: number
  overallPct: number
}

function dayAvailability(
  iso: string,
  plan: PlanMap,
  settings: AvailabilitySettings,
  holidays: Set<string>
): DayAvailability {
  const planned = plannedHoursForDay(iso, plan, settings, holidays)
  const executed = executedHours(iso, planned)
  return { iso, day: parseISO(iso).getDate(), planned, executed, pct: availabilityPct(planned, executed) }
}

function overall(planned: number[], executed: number[]): { totalPlanned: number; totalExecuted: number; overallPct: number } {
  const totalPlanned = planned.reduce((a, b) => a + b, 0)
  const totalExecuted = executed.reduce((a, b) => a + b, 0)
  return { totalPlanned, totalExecuted, overallPct: availabilityPct(totalPlanned, totalExecuted) }
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const availabilityService: AvailabilityService = {
  day: dayAvailability,

  monthSeries(year, month, plan, settings, holidays) {
    const n = daysInMonth(year, month)
    const labels: string[] = []
    const planned: number[] = []
    const executed: number[] = []
    const pct: number[] = []
    for (let d = 1; d <= n; d++) {
      const da = dayAvailability(isoOf(year, month, d), plan, settings, holidays)
      labels.push(String(d).padStart(2, '0'))
      planned.push(round1(da.planned))
      executed.push(round1(da.executed))
      pct.push(Math.round(da.pct))
    }
    return { labels, planned, executed, pct, ...overall(planned, executed) }
  },

  yearSeries(year, plan, settings, holidays) {
    const labels: string[] = []
    const planned: number[] = []
    const executed: number[] = []
    const pct: number[] = []
    for (let m = 0; m < 12; m++) {
      const ms = this.monthSeries(year, m, plan, settings, holidays)
      labels.push(MONTH_SHORT[m])
      planned.push(round1(ms.totalPlanned))
      executed.push(round1(ms.totalExecuted))
      pct.push(Math.round(ms.overallPct))
    }
    return { labels, planned, executed, pct, ...overall(planned, executed) }
  },

  alarmsByDay(year, month) {
    const n = daysInMonth(year, month)
    const out: { day: number; iso: string; count: number }[] = []
    for (let d = 1; d <= n; d++) {
      const iso = isoOf(year, month, d)
      out.push({ day: d, iso, count: alarmsForDay(iso) })
    }
    return out
  },
}
