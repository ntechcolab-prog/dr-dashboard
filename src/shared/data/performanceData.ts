// Mock OEE-performance data source.
//
// Performance = how fast the machines run while they run (actual throughput
// vs the recipe's ideal rate). Availability answers "did we run when
// planned?"; this module answers "did we run at full speed?".
//
// SWAP POINT: every number here derives from `batchPerformance` — a
// deterministic synthetic perf factor per mock batch (plus the batch's real
// mass/grindMin). Replace `batchPerformance` with real per-batch rate data
// from the API and every aggregate below (KPIs, rankings, series, losses)
// keeps working unchanged.

import { ALL_BATCHES, MONTHS, type Batch } from './mockData'

// Monthly performance target. Move into Settings > Performance & OEE Rules
// once real rules exist (availability keeps its goal in AvailabilitySettings).
export const PERFORMANCE_GOAL_PCT = 85

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
const round2 = (n: number) => Math.round(n * 100) / 100

// --- per-batch primitive (the actual swap surface) ---

export interface BatchPerformance {
  batch: Batch
  pct: number // 0–100, actual rate vs ideal rate
  actualRate: number // t/h while grinding
  idealRate: number // t/h the recipe should sustain
  speedLossMin: number // grinding minutes lost to running below ideal
  minorStops: number // micro-stop count (< 5 min, not availability downtime)
  minorStopMin: number
}

export function batchPerformance(b: Batch): BatchPerformance {
  const rng = mulberry32(hashStr(`perfb|${b.id}`))
  let perf = 0.7 + rng() * 0.28 // 0.70–0.98 baseline
  if (rng() < 0.12) perf -= 0.14 + rng() * 0.18 // slow batch
  perf = Math.max(0.45, Math.min(0.99, perf))

  const actualRate = round2(b.mass / (b.grindMin / 60))
  const idealRate = round2(actualRate / perf)
  const speedLossMin = Math.round(b.grindMin * (1 - perf))

  const stopsRoll = rng()
  const minorStops = stopsRoll > 0.8 ? 2 + Math.floor(rng() * 3) : stopsRoll > 0.45 ? 1 : 0
  const minorStopMin = minorStops === 0 ? 0 : Math.round(minorStops * (2 + rng() * 5))

  return { batch: b, pct: Math.round(perf * 100), actualRate, idealRate, speedLossMin, minorStops, minorStopMin }
}

// --- aggregates ---

export interface PerfKpis {
  pct: number // grind-time-weighted overall performance %
  deltaPp: number | null // percentage points vs previous month (null = no data)
  avgActualRate: number // t/h, grind-time-weighted
  avgIdealRate: number // t/h, grind-time-weighted
  speedLossH: number
  minorStops: number
  minorStopH: number
  batches: number
}

export interface PerfSeries {
  labels: string[]
  pct: number[]
  overallPct: number
}

export interface MachinePerfRow {
  machine: string
  pct: number
  actualRate: number
  idealRate: number
  speedLossH: number
  minorStops: number
  batches: number
  rank: number // 1 = best performer
  total: number
}

export interface RecipePerfRow {
  recipe: string
  pct: number // grind-time-weighted average
  minPct: number // worst batch of the month
  maxPct: number // best batch of the month
  actualRate: number // grind-time-weighted average rate (t/h)
  minRate: number // slowest batch of the month (t/h)
  maxRate: number // fastest batch of the month (t/h)
  idealRate: number
  batches: number
}

export interface MachineProductionRow {
  machine: string
  tons: number // produced mass this month
  producedH: number // hours actually grinding (from the batches)
  batches: number
}

export interface SlowBatchRow {
  id: string
  day: number
  machine: string
  recipe: string
  pct: number
  actualRate: number
  idealRate: number
}

export interface LossSlice {
  cause: string
  hours: number
}

function monthBatches(year: number, month: number): BatchPerformance[] {
  return ALL_BATCHES.filter((b) => b.year === year && b.month === month).map(batchPerformance)
}

function weightedPct(rows: BatchPerformance[]): number {
  const w = rows.reduce((a, r) => a + r.batch.grindMin, 0)
  if (w === 0) return 0
  return Math.round(rows.reduce((a, r) => a + r.pct * r.batch.grindMin, 0) / w)
}

function weightedRate(rows: BatchPerformance[], pickRate: (r: BatchPerformance) => number): number {
  const w = rows.reduce((a, r) => a + r.batch.grindMin, 0)
  if (w === 0) return 0
  return round2(rows.reduce((a, r) => a + pickRate(r) * r.batch.grindMin, 0) / w)
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const performanceService = {
  hasData(year: number, month: number): boolean {
    return MONTHS.some((m) => m.year === year && m.month === month)
  },

  // Mock batches stop before "today", so the dashboard opens on the newest
  // month that actually has production instead of an empty current month.
  latestDataMonth(): { year: number; month: number } {
    const m = MONTHS[MONTHS.length - 1]
    return { year: m.year, month: m.month }
  },

  firstDataMonth(): { year: number; month: number } {
    const m = MONTHS[0]
    return { year: m.year, month: m.month }
  },

  dataYears(): number[] {
    return [...new Set(MONTHS.map((m) => m.year))]
  },

  monthKpis(year: number, month: number): PerfKpis {
    const rows = monthBatches(year, month)
    const prev = month === 0 ? monthBatches(year - 1, 11) : monthBatches(year, month - 1)
    const pct = weightedPct(rows)
    return {
      pct,
      deltaPp: prev.length ? pct - weightedPct(prev) : null,
      avgActualRate: weightedRate(rows, (r) => r.actualRate),
      avgIdealRate: weightedRate(rows, (r) => r.idealRate),
      speedLossH: round1(rows.reduce((a, r) => a + r.speedLossMin, 0) / 60),
      minorStops: rows.reduce((a, r) => a + r.minorStops, 0),
      minorStopH: round1(rows.reduce((a, r) => a + r.minorStopMin, 0) / 60),
      batches: rows.length,
    }
  },

  // Daily performance % — only days with production (plants idle on Sundays).
  dailySeries(year: number, month: number): PerfSeries {
    const rows = monthBatches(year, month)
    const labels: string[] = []
    const pct: number[] = []
    const days = new Date(year, month + 1, 0).getDate()
    for (let d = 1; d <= days; d++) {
      const dayRows = rows.filter((r) => r.batch.day === d)
      if (!dayRows.length) continue
      labels.push(String(d).padStart(2, '0'))
      pct.push(weightedPct(dayRows))
    }
    return { labels, pct, overallPct: weightedPct(rows) }
  },

  // Weekly performance % — calendar weeks (Sun–Sat, matching the calendars
  // across the app), only weeks with production. Labels carry the day range.
  weeklySeries(year: number, month: number): PerfSeries {
    const rows = monthBatches(year, month)
    const days = new Date(year, month + 1, 0).getDate()
    const labels: string[] = []
    const pct: number[] = []
    let weekStart = 1
    let w = 1
    while (weekStart <= days) {
      // A week row ends on Saturday (getDay() === 6) or at the end of the month.
      let weekEnd = weekStart
      while (weekEnd < days && new Date(year, month, weekEnd).getDay() !== 6) weekEnd++
      const weekRows = rows.filter((r) => r.batch.day >= weekStart && r.batch.day <= weekEnd)
      if (weekRows.length) {
        labels.push(`W${w} · ${String(weekStart).padStart(2, '0')}–${String(weekEnd).padStart(2, '0')}`)
        pct.push(weightedPct(weekRows))
      }
      w++
      weekStart = weekEnd + 1
    }
    return { labels, pct, overallPct: weightedPct(rows) }
  },

  // Tons produced + grinding hours per machine in a month (from the batches).
  machineMonthProduction(year: number, month: number): MachineProductionRow[] {
    const rows = monthBatches(year, month)
    const machines = [...new Set(rows.map((r) => r.batch.machine))]
    return machines
      .map((machine) => {
        const mr = rows.filter((r) => r.batch.machine === machine)
        return {
          machine,
          tons: round1(mr.reduce((a, r) => a + r.batch.mass, 0)),
          producedH: round1(mr.reduce((a, r) => a + r.batch.grindMin, 0) / 60),
          batches: mr.length,
        }
      })
      .sort((a, b) => b.tons - a.tons)
  },

  // Monthly performance % — only months with data in the given year.
  yearSeries(year: number): PerfSeries {
    const labels: string[] = []
    const pct: number[] = []
    const all: BatchPerformance[] = []
    for (let m = 0; m < 12; m++) {
      if (!this.hasData(year, m)) continue
      const rows = monthBatches(year, m)
      labels.push(MONTH_SHORT[m])
      pct.push(weightedPct(rows))
      all.push(...rows)
    }
    return { labels, pct, overallPct: weightedPct(all) }
  },

  // Worst performers first (attack focus) — rank position is best-first.
  machineRanking(year: number, month: number): MachinePerfRow[] {
    const rows = monthBatches(year, month)
    const machines = [...new Set(rows.map((r) => r.batch.machine))]
    const byBest = machines
      .map((machine) => {
        const mr = rows.filter((r) => r.batch.machine === machine)
        return {
          machine,
          pct: weightedPct(mr),
          actualRate: weightedRate(mr, (r) => r.actualRate),
          idealRate: weightedRate(mr, (r) => r.idealRate),
          speedLossH: round1(mr.reduce((a, r) => a + r.speedLossMin, 0) / 60),
          minorStops: mr.reduce((a, r) => a + r.minorStops, 0),
          batches: mr.length,
        }
      })
      .sort((a, b) => b.pct - a.pct)
    const withRank = byBest.map((r, i) => ({ ...r, rank: i + 1, total: machines.length }))
    return [...withRank].sort((a, b) => a.pct - b.pct)
  },

  // Worst recipes first — which products drag the plant below ideal rate.
  recipeRanking(year: number, month: number): RecipePerfRow[] {
    const rows = monthBatches(year, month)
    const recipes = [...new Set(rows.map((r) => r.batch.recipe))]
    return recipes
      .map((recipe) => {
        const rr = rows.filter((r) => r.batch.recipe === recipe)
        return {
          recipe,
          pct: weightedPct(rr),
          minPct: Math.min(...rr.map((r) => r.pct)),
          maxPct: Math.max(...rr.map((r) => r.pct)),
          actualRate: weightedRate(rr, (r) => r.actualRate),
          minRate: round2(Math.min(...rr.map((r) => r.actualRate))),
          maxRate: round2(Math.max(...rr.map((r) => r.actualRate))),
          idealRate: weightedRate(rr, (r) => r.idealRate),
          batches: rr.length,
        }
      })
      .sort((a, b) => a.pct - b.pct)
  },

  slowestBatches(year: number, month: number, n = 8): SlowBatchRow[] {
    return monthBatches(year, month)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, n)
      .map((r) => ({
        id: r.batch.id,
        day: r.batch.day,
        machine: r.batch.machine,
        recipe: r.batch.recipe,
        pct: r.pct,
        actualRate: r.actualRate,
        idealRate: r.idealRate,
      }))
  },

  // Where the speed loss went. Minor stops are measured; the split of the
  // remaining slow-running time is a mock heuristic until real loss codes land.
  lossBreakdown(year: number, month: number): LossSlice[] {
    const rows = monthBatches(year, month)
    const minorStopH = rows.reduce((a, r) => a + r.minorStopMin, 0) / 60
    const speedLossH = rows.reduce((a, r) => a + r.speedLossMin, 0) / 60
    return [
      { cause: 'Reduced speed', hours: round1(speedLossH * 0.58) },
      { cause: 'Ramp-up after setup', hours: round1(speedLossH * 0.27) },
      { cause: 'Changeover running-in', hours: round1(speedLossH * 0.15) },
      { cause: 'Minor stops', hours: round1(minorStopH) },
    ].sort((a, b) => b.hours - a.hours)
  },
}
