// Aggregations that drive the KPI cards, calendar, and rankings.
// Everything here is pure: filtered batches in, derived numbers out.

import { INTERRUPTIONS, MACHINES, RECIPES, STATUSES, type Batch } from '../data/mockData'

export type ValueFormat = 'int' | 'dec1' | 'dec3'

export interface Kpi {
  key: string
  label: string
  value: number
  unit: string
  fmt: ValueFormat
  delta: number
  // When true the metric has no real backend source — the card shows "—".
  na?: boolean
}

export interface DayRollup {
  count: number
  mass: number
  energy: number
  batches: Batch[]
}

export interface RankItem {
  label: string
  value: number
  // Extra label/value rows shown in the hover tooltip (rankings only).
  extra?: { label: string; value: string }[]
}

export interface Rankings {
  interruptions: RankItem[]
  recipes: RankItem[]
  status: RankItem[]
}

interface FilterState {
  machines: string[]
  recipes: string[]
}

const sum = (arr: Batch[], f: (b: Batch) => number) => arr.reduce((a, x) => a + f(x), 0)

export function filterBatches(batches: Batch[], { machines, recipes }: FilterState): Batch[] {
  return batches.filter((b) => {
    if (machines.length && !machines.includes(b.machine)) return false
    if (recipes.length && !recipes.includes(b.recipe)) return false
    return true
  })
}

export function aggregate(batches: Batch[]) {
  const count = batches.length
  const mass = sum(batches, (b) => b.mass)
  const energy = sum(batches, (b) => b.energy)
  const cooling = sum(batches, (b) => b.cooling)
  const grindMin = sum(batches, (b) => b.grindMin)
  const idleMin = sum(batches, (b) => b.idleMin)
  const co2 = sum(batches, (b) => b.co2)
  const activeHours = grindMin / 60
  const passes = sum(batches, (b) => b.passes)
  const cycles = sum(batches, (b) => b.cycles)

  return {
    count,
    mass, // ton
    energy, // kWh
    cooling, // liters
    co2, // kg CO2
    runningHours: activeHours, // h of active grinding
    passes, // total passes through the mill
    cycles, // total circulation cycles
    productionRate: activeHours ? mass / activeHours : 0, // ton/h
    specificEnergy: mass ? energy / mass : 0, // kWh/ton
    // share of productive time vs idle time, as a percentage
    ratioProdIdle: grindMin + idleMin ? (grindMin / (grindMin + idleMin)) * 100 : 0,
  }
}

const pct = (cur: number, prev: number) => {
  if (!prev) return cur ? 100 : 0
  return ((cur - prev) / prev) * 100
}

// Build the KPI cards, comparing the current month against the previous one.
export function buildKpis(current: Batch[], previous: Batch[]): Kpi[] {
  const c = aggregate(current)
  const p = aggregate(previous)

  return [
    { key: 'production', label: 'Production', value: c.count, unit: 'batches', fmt: 'int', delta: pct(c.count, p.count) },
    { key: 'size', label: 'Size', value: c.mass, unit: 'ton', fmt: 'dec1', delta: pct(c.mass, p.mass) },
    { key: 'totalEnergy', label: 'Total energy', value: c.energy, unit: 'kWh', fmt: 'int', delta: pct(c.energy, p.energy) },
    { key: 'productionRate', label: 'Production rate', value: c.productionRate, unit: 'ton/h', fmt: 'dec1', delta: pct(c.productionRate, p.productionRate) },
    { key: 'coolingEnergy', label: 'Cooling energy', value: c.cooling, unit: 'liters', fmt: 'int', delta: pct(c.cooling, p.cooling) },
    { key: 'specificEnergy', label: 'Specific energy', value: c.specificEnergy, unit: 'kWh/ton', fmt: 'dec1', delta: pct(c.specificEnergy, p.specificEnergy) },
    { key: 'carbon', label: 'Carbon footprint', value: c.co2, unit: 'CO₂', fmt: 'dec3', delta: pct(c.co2, p.co2) },
    { key: 'ratio', label: 'Ratio production time / idle time', value: c.ratioProdIdle, unit: '%', fmt: 'int', delta: pct(c.ratioProdIdle, p.ratioProdIdle) },
    { key: 'runningHours', label: 'Running hours', value: c.runningHours, unit: 'h', fmt: 'dec1', delta: pct(c.runningHours, p.runningHours) },
    { key: 'passes', label: 'Number of passes', value: c.passes, unit: 'passes', fmt: 'int', delta: pct(c.passes, p.passes) },
    { key: 'cycles', label: 'Number of cycles', value: c.cycles, unit: 'cycles', fmt: 'int', delta: pct(c.cycles, p.cycles) },
  ]
}

export function formatValue(value: number, fmt: ValueFormat): string {
  switch (fmt) {
    case 'int':
      return Math.round(value).toLocaleString('en-US')
    case 'dec1':
      return (Math.round(value * 10) / 10).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    case 'dec3':
      return (Math.round(value * 1000) / 1000).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
    default:
      return String(value)
  }
}

// Per-day rollups for the calendar grid.
export function byDay(batches: Batch[]): Map<number, DayRollup> {
  const map = new Map<number, DayRollup>()
  for (const b of batches) {
    const cur = map.get(b.day) || { count: 0, mass: 0, energy: 0, batches: [] }
    cur.count += 1
    cur.mass += b.mass
    cur.energy += b.energy
    cur.batches.push(b)
    map.set(b.day, cur)
  }
  return map
}

// Rankings — each returns RankItem[], descending, top 5.
function rank(
  batches: Batch[],
  keys: string[],
  keyFn: (b: Batch) => string,
  valueFn: (b: Batch) => number,
  extraFn?: (group: Batch[], value: number, total: number) => RankItem['extra']
): RankItem[] {
  const totals = new Map<string, number>(keys.map((k) => [k, 0]))
  const groups = new Map<string, Batch[]>(keys.map((k) => [k, []]))
  for (const b of batches) {
    const k = keyFn(b)
    totals.set(k, (totals.get(k) || 0) + valueFn(b))
    const g = groups.get(k)
    if (g) g.push(b)
    else groups.set(k, [b])
  }
  const total = [...totals.values()].reduce((a, v) => a + v, 0)
  return [...totals.entries()]
    .map(([label, value]) => ({
      label,
      value,
      extra: extraFn?.(groups.get(label) ?? [], value, total),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
}

// Most frequent machine within a group of batches.
function topMachine(group: Batch[]): string {
  const counts = new Map<string, number>()
  for (const b of group) counts.set(b.machine, (counts.get(b.machine) || 0) + 1)
  let best = '—'
  let max = 0
  for (const [m, c] of counts) if (c > max) { max = c; best = m }
  return best
}

const sharePct = (value: number, total: number) => (total ? `${Math.round((value / total) * 100)}%` : '0%')

// --- Per-metric drill-down (drives the KPI details drawer) ---

type AggField =
  | 'count'
  | 'mass'
  | 'energy'
  | 'cooling'
  | 'co2'
  | 'productionRate'
  | 'specificEnergy'
  | 'ratioProdIdle'
  | 'runningHours'
  | 'passes'
  | 'cycles'

const METRIC_FIELD: Record<string, AggField> = {
  production: 'count',
  size: 'mass',
  totalEnergy: 'energy',
  productionRate: 'productionRate',
  coolingEnergy: 'cooling',
  specificEnergy: 'specificEnergy',
  carbon: 'co2',
  ratio: 'ratioProdIdle',
  runningHours: 'runningHours',
  passes: 'passes',
  cycles: 'cycles',
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function metricValue(batches: Batch[], kpiKey: string): number {
  const field = METRIC_FIELD[kpiKey] ?? 'count'
  return aggregate(batches)[field]
}

// Daily series of a metric across the month (0 on empty days).
export function metricByDaySeries(
  batches: Batch[],
  kpiKey: string,
  daysInMonth: number
): { labels: string[]; data: number[] } {
  const groups = new Map<number, Batch[]>()
  for (const b of batches) {
    const arr = groups.get(b.day)
    if (arr) arr.push(b)
    else groups.set(b.day, [b])
  }
  const labels: string[] = []
  const data: number[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    labels.push(String(d).padStart(2, '0'))
    data.push(round1(metricValue(groups.get(d) ?? [], kpiKey)))
  }
  return { labels, data }
}

function metricByGroup(batches: Batch[], kpiKey: string, keys: string[], keyFn: (b: Batch) => string): RankItem[] {
  const groups = new Map<string, Batch[]>(keys.map((k) => [k, []]))
  for (const b of batches) {
    const g = groups.get(keyFn(b))
    if (g) g.push(b)
  }
  return keys
    .map((label) => ({ label, value: round1(metricValue(groups.get(label) ?? [], kpiKey)) }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
}

export function metricByMachine(batches: Batch[], kpiKey: string): RankItem[] {
  return metricByGroup(batches, kpiKey, MACHINES, (b) => b.machine)
}

export function metricByRecipe(batches: Batch[], kpiKey: string): RankItem[] {
  return metricByGroup(batches, kpiKey, RECIPES, (b) => b.recipe).slice(0, 6)
}

export function buildRankings(batches: Batch[]): Rankings {
  return {
    interruptions: rank(
      batches,
      INTERRUPTIONS,
      (b) => b.interruption,
      () => 1,
      (group, value, total) => [
        { label: 'Share of interruptions', value: sharePct(value, total) },
        { label: 'Mass affected', value: `${formatValue(sum(group, (b) => b.mass), 'dec1')} ton` },
        { label: 'Downtime (alarm)', value: `${Math.round(sum(group, (b) => b.alarmMin))} min` },
        { label: 'Top machine', value: topMachine(group) },
      ]
    ),
    // recipes ranked by produced mass, expressed in kg
    recipes: rank(
      batches,
      RECIPES,
      (b) => b.recipe,
      (b) => b.mass * 1000,
      (group, value, total) => [
        { label: 'Share of production', value: sharePct(value, total) },
        { label: 'Batches', value: String(group.length) },
        { label: 'Avg / batch', value: group.length ? `${Math.round(value / group.length)} kg` : '—' },
        { label: 'Energy', value: `${formatValue(sum(group, (b) => b.energy), 'int')} kWh` },
        { label: 'Top machine', value: topMachine(group) },
      ]
    ),
    status: rank(
      batches,
      STATUSES,
      (b) => b.status,
      () => 1,
      (group, value, total) => [
        { label: 'Share of batches', value: sharePct(value, total) },
        { label: 'Mass', value: `${formatValue(sum(group, (b) => b.mass), 'dec1')} ton` },
        { label: 'Energy', value: `${formatValue(sum(group, (b) => b.energy), 'int')} kWh` },
        { label: 'Avg grinding', value: group.length ? `${Math.round(sum(group, (b) => b.grindMin) / group.length)} min` : '—' },
      ]
    ),
  }
}
