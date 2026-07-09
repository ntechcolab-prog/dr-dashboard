import { describe, expect, it } from 'vitest'
import { batchRecordToBatch, batchSummaryToBatch, machineToMachineInfo, oeeFromProduction, statusToDisplay } from './adapters'
import type { BatchRecord, BatchSummary, Machine, ProductionMetrics } from './types'

describe('machineToMachineInfo', () => {
  it('maps real machine fields and derives the mill family from type', () => {
    const m: Machine = {
      id: 'm1',
      name: 'Alpha 22',
      type: 'NETZSCH_ALPHA_DISCUS',
      brand: 'Agitator bead mill',
      production_line: 'Production Line C',
    }
    expect(machineToMachineInfo(m)).toEqual({
      name: 'Alpha 22',
      line: 'Production Line C',
      family: 'Alpha',
      model: 'Agitator bead mill',
    })
  })
  it('falls back to a prettified type when brand/line are missing', () => {
    const m: Machine = { id: 'm2', name: 'X', type: 'NETZSCH_KAPPA_10' }
    const info = machineToMachineInfo(m)
    expect(info.line).toBe('')
    expect(info.family).toBe('Kappa')
    expect(info.model).toBe('Kappa 10')
  })
})

describe('statusToDisplay', () => {
  it('maps known enums to the UI labels', () => {
    expect(statusToDisplay('COMPLETED')).toBe('Completed')
    expect(statusToDisplay('COMPLETED_BEFORE_TARGET')).toBe('Completed before target')
    expect(statusToDisplay('IN_OPERATION')).toBe('In operation')
    expect(statusToDisplay('CANCELLED')).toBe('Cancelled')
  })
  it('title-cases unknown enums instead of inventing', () => {
    expect(statusToDisplay('SOME_NEW_STATE')).toBe('Some New State')
  })
})

describe('batchSummaryToBatch', () => {
  it('maps the summary row, leaving unmapped fields at 0', () => {
    const s: BatchSummary = {
      id: 'row1',
      batch_id: 'B-100',
      machine: 'Zeta 60',
      recipe: 'Dark Red',
      status: 'COMPLETED',
      progress: 100,
      grinding_energy: 420,
      start_time: '2026-03-14T08:00:00Z',
    }
    const b = batchSummaryToBatch(s)
    expect(b.id).toBe('B-100')
    expect(b.machine).toBe('Zeta 60')
    expect(b.recipe).toBe('Dark Red')
    expect(b.energy).toBe(420)
    expect(b.status).toBe('Completed')
    expect(b.year).toBe(2026)
    expect(b.month).toBe(2) // March = 2
    // no real counterpart → 0
    expect(b.mass).toBe(0)
    expect(b.cooling).toBe(0)
    expect(b.co2).toBe(0)
  })
})

describe('batchRecordToBatch', () => {
  it('maps the full record incl. size and grinding time', () => {
    const r: BatchRecord = {
      created_at: '2026-03-14T08:00:00Z',
      time: '2026-03-14T08:00:00Z',
      origin: 'IRIS_V3',
      machine_id: 'm1',
      machine: { id: 'm1', name: 'Alpha 22', type: 'NETZSCH_ALPHA_DISCUS', production_line: 'Production Line C' },
      property: { grinding_energy: 500, total_grinding_time: 120 },
      details: { batch_id: 'B-200', id: 'd1', recipe: 'UV Coating', status: 'COMPLETED', progress: 100, size: 3, date: { start: '2026-03-14T08:00:00Z', end: '2026-03-14T10:00:00Z' } },
    }
    const b = batchRecordToBatch(r)
    expect(b.id).toBe('B-200')
    expect(b.machine).toBe('Alpha 22')
    expect(b.productionLine).toBe('Production Line C')
    expect(b.mass).toBe(3)
    expect(b.energy).toBe(500)
    expect(b.grindMin).toBe(120) // 120 min = 2h → 120 min
    expect(b.status).toBe('Completed')
  })
})

describe('oeeFromProduction', () => {
  it('computes OEE from a real production-metrics window + business targets', () => {
    const pm: ProductionMetrics = {
      from: '2026-03-01',
      to: '2026-03-31',
      alarms: 3,
      alerts: 1,
      hour_meter: '6',
      batches: { completed: 9, cancelled: 1, total: 10, production_size: 24 },
    }
    // actualRate = 24 / 6 = 4 t/h; ideal 5 → performance 0.8
    // availability 6/8 = 0.75; quality 9/10 = 0.9
    const r = oeeFromProduction(pm, { plannedTimeHours: 8, idealRate: 5 })
    expect(r.availability).toBe(0.75)
    expect(r.performance).toBe(0.8)
    expect(r.quality).toBe(0.9)
    expect(r.oee).toBeCloseTo(0.54)
  })
})
