// Aggregations that drive the KPI cards, calendar, and rankings.
// Everything here is pure: filtered batches in, derived numbers out.

import { INTERRUPTIONS, RECIPES, STATUSES, type Batch } from '../data/mockData'

export type ValueFormat = 'int' | 'dec1' | 'dec3'

export interface Kpi {
  key: string
  label: string
  value: number
  unit: string
  fmt: ValueFormat
  delta: number
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

  return {
    count,
    mass, // ton
    energy, // kWh
    cooling, // liters
    co2, // kg CO2
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

// Build the 8 KPI cards, comparing the current month against the previous one.
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
  valueFn: (b: Batch) => number
): RankItem[] {
  const totals = new Map<string, number>(keys.map((k) => [k, 0]))
  for (const b of batches) totals.set(keyFn(b), (totals.get(keyFn(b)) || 0) + valueFn(b))
  return [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
}

export function buildRankings(batches: Batch[]): Rankings {
  return {
    interruptions: rank(batches, INTERRUPTIONS, (b) => b.interruption, () => 1),
    // recipes ranked by produced mass, expressed in kg
    recipes: rank(batches, RECIPES, (b) => b.recipe, (b) => b.mass * 1000),
    status: rank(batches, STATUSES, (b) => b.status, () => 1),
  }
}
