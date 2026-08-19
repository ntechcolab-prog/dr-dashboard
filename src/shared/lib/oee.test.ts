import { describe, expect, it } from 'vitest'
import {
  availability,
  batchActualRate,
  clamp01,
  computeOee,
  grindingTimeHours,
  oee,
  parseHourMeter,
  performance,
  quality,
  qualityFromProduction,
  toPct,
} from './oee'

describe('clamp01 / toPct', () => {
  it('clamps to [0,1]', () => {
    expect(clamp01(-0.5)).toBe(0)
    expect(clamp01(1.5)).toBe(1)
    expect(clamp01(0.42)).toBe(0.42)
  })
  it('renders one-decimal percent', () => {
    expect(toPct(0.8642)).toBe(86.4)
    expect(toPct(2)).toBe(100)
  })
})

describe('quality', () => {
  it('is good ÷ total', () => {
    expect(quality(90, 100)).toBe(0.9)
  })
  it('is 0 when total is 0', () => {
    expect(quality(0, 0)).toBe(0)
  })
  it('reads production-metrics, falling back to completed+cancelled', () => {
    expect(qualityFromProduction({ from: '', to: '', alarms: 0, alerts: 0, batches: { completed: 8, total: 10 } })).toBe(0.8)
    expect(qualityFromProduction({ from: '', to: '', alarms: 0, alerts: 0, batches: { completed: 6, cancelled: 2 } })).toBe(0.75)
    expect(qualityFromProduction(undefined)).toBe(0)
  })
})

describe('availability', () => {
  it('is run ÷ planned, clamped', () => {
    expect(availability(6, 8)).toBe(0.75)
    expect(availability(10, 8)).toBe(1) // over-run clamps
    expect(availability(5, 0)).toBe(0)
  })
})

describe('parseHourMeter', () => {
  it('parses a plain number of hours', () => {
    expect(parseHourMeter('123.5')).toBe(123.5)
  })
  it('parses HH:MM:SS and HH:MM', () => {
    expect(parseHourMeter('01:30:00')).toBe(1.5)
    expect(parseHourMeter('02:15')).toBeCloseTo(2.25)
  })
  it('is 0 for empty / garbage', () => {
    expect(parseHourMeter(undefined)).toBe(0)
    expect(parseHourMeter('abc')).toBe(0)
  })
})

describe('performance', () => {
  it('is actual ÷ ideal, clamped', () => {
    expect(performance(4, 5)).toBe(0.8)
    expect(performance(6, 5)).toBe(1)
    expect(performance(4, 0)).toBe(0)
  })
  it('derives actual rate from size and grinding hours', () => {
    expect(batchActualRate(3, 2)).toBe(1.5)
    expect(batchActualRate(3, 0)).toBe(0)
  })
  it('converts total_grinding_time (minutes) to hours', () => {
    expect(grindingTimeHours({ total_grinding_time: 90 })).toBe(1.5)
    expect(grindingTimeHours(undefined)).toBe(0)
  })
})

describe('oee roll-up', () => {
  it('is the product of the three pillars', () => {
    expect(oee(0.8, 0.9, 0.95)).toBeCloseTo(0.684)
  })
  it('computeOee wires real inputs end-to-end', () => {
    const r = computeOee({ runTimeHours: 6, plannedTimeHours: 8, actualRate: 4, idealRate: 5, good: 90, total: 100 })
    expect(r.availability).toBe(0.75)
    expect(r.performance).toBe(0.8)
    expect(r.quality).toBe(0.9)
    expect(r.oee).toBeCloseTo(0.54)
  })
})
