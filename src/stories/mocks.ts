// Shared, realistic mock props for the Storybook stories.
// Everything here is derived from the app's real mock data + compute helpers,
// so the stories show the components exactly as the dashboard renders them.

import { ALL_BATCHES, MONTHS, type Batch } from '../data/mockData'
import { buildKpis, buildRankings, byDay, metricByDaySeries } from '../lib/compute'
import {
  DEFAULT_AVAILABILITY_SETTINGS,
  isoOf,
  daysInMonth,
  type PlanMap,
} from '../lib/availability'
import { availabilityService } from '../data/availabilityData'

// --- Batch dataset slice: June 2026 (current) vs May 2026 (previous) ---------

export const CURRENT_MONTH = MONTHS.find((m) => m.key === '2026-06')! // June 2026
export const PREVIOUS_MONTH = MONTHS.find((m) => m.key === '2026-05')! // May 2026

const inMonth = (b: Batch, year: number, month: number) => b.year === year && b.month === month

export const CURRENT_BATCHES = ALL_BATCHES.filter((b) =>
  inMonth(b, CURRENT_MONTH.year, CURRENT_MONTH.month),
)
export const PREVIOUS_BATCHES = ALL_BATCHES.filter((b) =>
  inMonth(b, PREVIOUS_MONTH.year, PREVIOUS_MONTH.month),
)

export const DAYS_IN_CURRENT = daysInMonth(CURRENT_MONTH.year, CURRENT_MONTH.month)

// KPI cards (8 metrics) comparing June vs May.
export const KPIS = buildKpis(CURRENT_BATCHES, PREVIOUS_BATCHES)

// Per-metric daily series keyed by kpi.key — drives the card visualizations.
export const SERIES: Record<string, number[]> = Object.fromEntries(
  KPIS.map((k) => [k.key, metricByDaySeries(CURRENT_BATCHES, k.key, DAYS_IN_CURRENT).data]),
)

// Rankings (interruptions / recipes / status).
export const RANKINGS = buildRankings(CURRENT_BATCHES)

// A single metric's day-by-day series (labels + data) for the line chart story.
export const MASS_SERIES = metricByDaySeries(CURRENT_BATCHES, 'size', DAYS_IN_CURRENT)
export const ENERGY_SERIES = metricByDaySeries(CURRENT_BATCHES, 'totalEnergy', DAYS_IN_CURRENT)

// Per-day rollups for the calendar grid.
export const DAY_MAP = byDay(CURRENT_BATCHES)
export const AVG_MASS =
  CURRENT_BATCHES.reduce((a, b) => a + b.mass, 0) / (DAY_MAP.size || 1)

// --- Availability planning: seed a Mon–Fri 8h plan so charts have data --------

function buildPlan(years: number[]): PlanMap {
  const plan: PlanMap = {}
  for (const year of years) {
    for (let month = 0; month < 12; month++) {
      const n = daysInMonth(year, month)
      for (let d = 1; d <= n; d++) {
        const wd = new Date(year, month, d).getDay()
        if (wd >= 1 && wd <= 5) plan[isoOf(year, month, d)] = 8
      }
    }
  }
  return plan
}

export const AVAIL_PLAN = buildPlan([2025, 2026])

// Company-state seed map: hand this to a per-story <CompanyStateProvider initial>
// so the availability hooks (plan/settings) resolve to real data.
export const AVAIL_STATE_SEED: Record<string, unknown> = {
  'dr-availability-plan': AVAIL_PLAN,
  'dr-availability-settings': DEFAULT_AVAILABILITY_SETTINGS,
}

// A standalone month availability series (June 2026) for the AvailabilityChart
// story — computed the same way the dashboard does, minus the React hooks.
const NO_HOLIDAYS = new Set<string>()
export const AVAIL_MONTH_SERIES = availabilityService.monthSeries(
  2026,
  5,
  AVAIL_PLAN,
  DEFAULT_AVAILABILITY_SETTINGS,
  NO_HOLIDAYS,
)
export const AVAIL_YEAR_SERIES = availabilityService.yearSeries(
  2026,
  AVAIL_PLAN,
  DEFAULT_AVAILABILITY_SETTINGS,
  NO_HOLIDAYS,
)

// --- Multi-sensor chart series (Registry Resume/Remarks) ---------------------

function wave(n: number, base: number, amp: number, phase: number, seed: number): number[] {
  const out: number[] = []
  let r = seed
  for (let i = 0; i < n; i++) {
    r = (r * 1103515245 + 12345) & 0x7fffffff
    const noise = (r / 0x7fffffff - 0.5) * amp * 0.5
    out.push(Math.round((base + Math.sin(i / 3 + phase) * amp + noise) * 10) / 10)
  }
  return out
}

const SENSOR_N = 24
export const SENSOR_POINT_LABELS = Array.from({ length: SENSOR_N }, (_, i) => {
  const h = 6 + Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})

export const SENSOR_SERIES = [
  { name: 'Mill speed (rpm)', color: '#46aa9f', data: wave(SENSOR_N, 1450, 90, 0, 7) },
  { name: 'Product temp (°C)', color: '#f19909', data: wave(SENSOR_N, 41, 6, 1.4, 21) },
  { name: 'Flow rate (l/min)', color: '#3b82f6', data: wave(SENSOR_N, 18, 4, 2.7, 42) },
]

export const SENSOR_MAX = 1600

export const SENSOR_NOTES = [
  { frac: 0.28, label: '19/06/2026 · 09:00', comment: 'Fineness check within target.' },
  { frac: 0.62, label: '19/06/2026 · 12:30', comment: 'Cooling flow briefly low — auto-resolved.' },
]
