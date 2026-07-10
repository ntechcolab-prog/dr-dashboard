// Feeds the DESIGNED dashboard KPI grid with REAL data. Fetches recent completed
// batches, pulls their full records (for size / grinding time / energy), adapts
// them to the mock `Batch` shape the compute pipeline expects, and marks the
// metrics with no backend source as `na` so the cards render "—".

import { getBatch, listCompletedBatches } from '@/src/api/batches'
import { batchRecordToBatch } from '@/src/api/adapters'
import { buildKpis, type Kpi } from '@/src/lib/compute'
import type { Batch } from '@/src/data/mockData'

// No real backend source: cooling energy, carbon footprint, prod/idle ratio.
const NA_KEYS = new Set(['coolingEnergy', 'carbon', 'ratio'])

export interface LiveKpiResult {
  kpis: Kpi[]
  batches: Batch[]
  count: number
}

export async function loadLiveKpis(limit = 25): Promise<LiveKpiResult> {
  const page = await listCompletedBatches({ page: 1, limit, sort: 'start_time', order: 'desc' })
  const ids = page.data.map((r) => r.id).filter(Boolean)
  const records = await Promise.all(ids.map((id) => getBatch(id).catch(() => null)))
  const batches = records.filter((r): r is NonNullable<typeof r> => r != null).map(batchRecordToBatch)

  // Same KPI pipeline as the mock dashboard; no comparison period yet (delta 0);
  // unbacked metrics flagged na.
  const kpis = buildKpis(batches, []).map((k) => (NA_KEYS.has(k.key) ? { ...k, na: true } : { ...k, delta: 0 }))

  return { kpis, batches, count: batches.length }
}
