// Per-batch metric definitions for the Analysis comparison.
// Mirrors the metric language of the Batches "metrics" section, but evaluated
// for a single batch so analyses can compare batches side by side.

import type { Batch } from '../data/mockData'
import { formatValue, type ValueFormat } from './compute'

// --- deterministic process telemetry ----------------------------------------
// The mock Batch carries no per-run sensor readings, so we synthesize stable
// values seeded by (batch id, parameter) — same PRNG family used elsewhere.

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

// Stable synthetic reading for a (batch, parameter), in [base, base+range].
export function paramValue(batchId: string, key: string, base: number, range: number): number {
  return base + mulberry32(hashStr(`param|${batchId}|${key}`))() * range
}

// Min / max / average of a sensor parameter over a synthetic run. The mock
// Batch has no time series, so we deterministically sample a stable sweep of
// readings seeded by (batch, parameter) and aggregate them.
export interface MetricStats {
  min: number
  max: number
  avg: number
}

export function paramStats(batchId: string, key: string, base: number, range: number): MetricStats {
  const rnd = mulberry32(hashStr(`stats|${batchId}|${key}`))
  const samples = 24
  let min = Infinity
  let max = -Infinity
  let sum = 0
  for (let i = 0; i < samples; i++) {
    const v = base + rnd() * range
    if (v < min) min = v
    if (v > max) max = v
    sum += v
  }
  return { min, max, avg: sum / samples }
}

export type MetricGroup = 'Production' | 'Electrical' | 'Pressure' | 'Speed' | 'Flow' | 'Temperature'

export interface BatchMetricDef {
  key: string
  label: string
  unit: string
  group: MetricGroup
  fmt: ValueFormat
  value: (b: Batch) => number
  // Whether a higher value is "better" — drives the best/worst insight wording.
  betterHigh: boolean
  // Sensor parameters report a sweep, so they expose max / min / avg.
  // Core production metrics are single values and leave this undefined.
  stats?: (b: Batch) => MetricStats
}

// Core metrics derived from the real batch fields (same as the Batches metrics).
const CORE_METRICS: BatchMetricDef[] = [
  { key: 'output', label: 'Output', unit: 'ton', group: 'Production', fmt: 'dec1', value: (b) => b.mass, betterHigh: true },
  { key: 'totalEnergy', label: 'Total energy', unit: 'kWh', group: 'Production', fmt: 'dec1', value: (b) => b.energy, betterHigh: false },
  {
    key: 'productionRate',
    label: 'Production rate',
    unit: 'ton/h',
    group: 'Production',
    fmt: 'dec1',
    value: (b) => (b.grindMin ? b.mass / (b.grindMin / 60) : 0),
    betterHigh: true,
  },
  {
    key: 'specificEnergy',
    label: 'Grinding energy',
    unit: 'kWh/ton',
    group: 'Production',
    fmt: 'dec1',
    value: (b) => (b.mass ? b.energy / b.mass : 0),
    betterHigh: false,
  },
  { key: 'carbon', label: 'Carbon footprint', unit: 'CO₂', group: 'Production', fmt: 'dec3', value: (b) => b.co2, betterHigh: false },
  { key: 'grindTime', label: 'Grinding time', unit: 'min', group: 'Production', fmt: 'int', value: (b) => b.grindMin, betterHigh: false },
  {
    key: 'ratio',
    label: 'Prod/idle ratio',
    unit: '%',
    group: 'Production',
    fmt: 'int',
    value: (b) => (b.grindMin + b.idleMin ? (b.grindMin / (b.grindMin + b.idleMin)) * 100 : 0),
    betterHigh: true,
  },
]

// Process parameters from the machine telemetry (synthetic per-batch readings).
const PROCESS_SPECS: { key: string; label: string; unit: string; group: MetricGroup; fmt: ValueFormat; base: number; range: number }[] = [
  // Electrical / power
  { key: 'feedPumpCurrent', label: 'Feed pump current', unit: 'A', group: 'Electrical', fmt: 'dec1', base: 2, range: 10 },
  { key: 'millCurrent', label: 'Mill current', unit: 'A', group: 'Electrical', fmt: 'dec1', base: 60, range: 120 },
  { key: 'feedPumpPower', label: 'Feed pump power', unit: 'kW', group: 'Electrical', fmt: 'dec1', base: 1, range: 7 },
  { key: 'millNetPower', label: 'Mill net power', unit: 'kW', group: 'Electrical', fmt: 'dec1', base: 20, range: 40 },
  { key: 'millPower', label: 'Mill power', unit: 'kW', group: 'Electrical', fmt: 'dec1', base: 25, range: 45 },
  // Pressure
  { key: 'sealPressure', label: 'Mechanical seal pressure', unit: 'bar', group: 'Pressure', fmt: 'dec1', base: 1, range: 3 },
  { key: 'productInletPressure', label: 'Product inlet pressure', unit: 'bar', group: 'Pressure', fmt: 'dec1', base: 0.1, range: 1.9 },
  // Speed / frequency
  { key: 'millFrequency', label: 'Mill frequency', unit: 'Hz', group: 'Speed', fmt: 'dec1', base: 30, range: 30 },
  { key: 'millSpeed', label: 'Mill speed', unit: 'rpm', group: 'Speed', fmt: 'int', base: 500, range: 1000 },
  { key: 'millPeripheralSpeed', label: 'Mill peripheral speed', unit: 'm/s', group: 'Speed', fmt: 'dec1', base: 8, range: 6 },
  { key: 'feedPumpSpeed', label: 'Feed pump speed', unit: 'rpm', group: 'Speed', fmt: 'int', base: 200, range: 1000 },
  { key: 'feedPumpSpeedPct', label: 'Feed pump speed', unit: '%', group: 'Speed', fmt: 'int', base: 20, range: 80 },
  { key: 'millTorque', label: 'Mill torque', unit: '%', group: 'Speed', fmt: 'int', base: 20, range: 70 },
  // Flow
  { key: 'agitatorCoolingInletFlow', label: 'Agitator shaft cooling inlet flow', unit: 'l/min', group: 'Flow', fmt: 'dec1', base: 2, range: 8 },
  { key: 'batchTankCoolingInletFlow', label: 'Batch tank cooling inlet flow', unit: 'l/min', group: 'Flow', fmt: 'dec1', base: 2, range: 8 },
  { key: 'chamberCoolingInletFlow', label: 'Chamber cooling inlet flow', unit: 'l/min', group: 'Flow', fmt: 'dec1', base: 2, range: 8 },
  // Temperature
  { key: 'agitatorCoolingOutletTemp', label: 'Agitator shaft cooling outlet temp', unit: '°C', group: 'Temperature', fmt: 'dec1', base: 18, range: 12 },
  { key: 'batchTankCoolingOutletTemp', label: 'Batch tank cooling outlet temp', unit: '°C', group: 'Temperature', fmt: 'dec1', base: 18, range: 12 },
  { key: 'chamberCoolingDeltaTemp', label: 'Chamber cooling delta temp', unit: '°C', group: 'Temperature', fmt: 'dec1', base: -5, range: 10 },
  { key: 'coolingChamberOutletTemp', label: 'Cooling chamber outlet temp', unit: '°C', group: 'Temperature', fmt: 'dec1', base: 18, range: 12 },
  { key: 'sealCoolingOutletTemp', label: 'Mechanical seal cooling outlet temp', unit: '°C', group: 'Temperature', fmt: 'dec1', base: 18, range: 12 },
  { key: 'millCoolingInletTemp', label: 'Mill cooling inlet temp', unit: '°C', group: 'Temperature', fmt: 'dec1', base: 18, range: 10 },
  { key: 'millFixedBearingTemp', label: 'Mill fixed bearing temp', unit: '°C', group: 'Temperature', fmt: 'dec1', base: 20, range: 12 },
  { key: 'millRotaryBearingTemp', label: 'Mill rotary bearing temp', unit: '°C', group: 'Temperature', fmt: 'dec1', base: 20, range: 12 },
  { key: 'productInletTemp', label: 'Product inlet temp', unit: '°C', group: 'Temperature', fmt: 'dec1', base: 20, range: 14 },
  { key: 'productOutletTemp', label: 'Product outlet temp', unit: '°C', group: 'Temperature', fmt: 'dec1', base: 22, range: 14 },
  { key: 'sealLiquidTemp', label: 'Seal liquid temp', unit: '°C', group: 'Temperature', fmt: 'dec1', base: 20, range: 12 },
]

const PROCESS_METRICS: BatchMetricDef[] = PROCESS_SPECS.map((s) => {
  const stats = (b: Batch) => paramStats(b.id, s.key, s.base, s.range)
  return {
    key: s.key,
    label: s.label,
    unit: s.unit,
    group: s.group,
    fmt: s.fmt,
    // The single comparison value is the run average; max/min/avg live in stats.
    value: (b: Batch) => stats(b).avg,
    betterHigh: false,
    stats,
  }
})

export const BATCH_METRICS: BatchMetricDef[] = [...CORE_METRICS, ...PROCESS_METRICS]

// Keys shown by default in a fresh comparison (kept compact — the user adds the rest).
export const DEFAULT_METRIC_KEYS = CORE_METRICS.map((m) => m.key)

export const formatMetric = (m: BatchMetricDef, v: number) => `${formatValue(v, m.fmt)} ${m.unit}`

// Min / max batch (by id) for one metric across a batch set.
export interface Extreme {
  metric: BatchMetricDef
  maxId: string
  maxValue: number
  minId: string
  minValue: number
}

export function extremesFor(metric: BatchMetricDef, batches: Batch[]): Extreme | null {
  if (!batches.length) return null
  let maxB = batches[0]
  let minB = batches[0]
  for (const b of batches) {
    if (metric.value(b) > metric.value(maxB)) maxB = b
    if (metric.value(b) < metric.value(minB)) minB = b
  }
  return {
    metric,
    maxId: maxB.id,
    maxValue: metric.value(maxB),
    minId: minB.id,
    minValue: metric.value(minB),
  }
}
