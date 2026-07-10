// Loads real backend data and injects it into the datasets the v2 app reads by
// import, so the SAME AppV2 (topbar + sidebar + screens) renders with real data.
// Fields with no backend source stay at their neutral defaults and are flagged
// "—" by the screens (isLiveMode).

import { getBatch, listCompletedBatches, listRunningBatches } from '@/src/api/batches'
import { listMachinesResumed } from '@/src/api/machines'
import { batchRecordToBatch, machineToMachineInfo, statusToDisplay } from '@/src/api/adapters'
import { setLiveDatasets } from '@/src/data/mockData'
import type { Batch, LiveBatch, MonthMeta } from '@/src/data/mockData'
import type { BatchSummary } from '@/src/api/types'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function monthsFromBatches(batches: Batch[]): MonthMeta[] {
  const seen = new Map<string, MonthMeta>()
  for (const b of batches) {
    const key = `${b.year}-${String(b.month + 1).padStart(2, '0')}`
    if (!seen.has(key)) seen.set(key, { key, label: `${MONTH_NAMES[b.month]} ${b.year}`, year: b.year, month: b.month })
  }
  return [...seen.values()].sort((a, b) => (a.key < b.key ? -1 : 1))
}

// Running batch summary → LiveBatch. Fields without a backend source (operator,
// phase, targets, live sensor readings, events) stay neutral.
function toLiveBatch(s: BatchSummary): LiveBatch {
  const hhmm = s.start_time ? s.start_time.slice(11, 16) : ''
  return {
    id: s.batch_id || s.id,
    recipe: s.recipe || '—',
    machine: s.machine,
    productionLine: '',
    energy: s.grinding_energy ?? 0,
    progress: Math.round(s.progress ?? 0),
    state: 'Running',
    operator: '—',
    startedAt: hhmm,
    eta: '—',
    phase: statusToDisplay(String(s.status)),
    targetMass: 0,
    currentMass: 0,
    millSpeed: 0,
    productTemp: 0,
    flowRate: 0,
    alarms: 0,
    events: [],
  }
}

export async function loadLiveApp(limit = 60): Promise<void> {
  const [machines, completed, running] = await Promise.all([
    listMachinesResumed().catch(() => []),
    listCompletedBatches({ page: 1, limit, sort: 'start_time', order: 'desc' }).catch(() => ({ data: [], page: 1, total_pages: 0 })),
    listRunningBatches({ page: 1, limit: 20 }).catch(() => ({ data: [], page: 1, total_pages: 0 })),
  ])

  const ids = completed.data.map((r) => r.id).filter(Boolean)
  const records = await Promise.all(ids.map((id) => getBatch(id).catch(() => null)))
  const batches = records.filter((r): r is NonNullable<typeof r> => r != null).map(batchRecordToBatch)

  // Filter options come from what actually has data (no fictitious mock items).
  const machineNames = Array.from(new Set(batches.map((b) => b.machine))).filter(Boolean)
  const recipeNames = Array.from(new Set(batches.map((b) => b.recipe))).filter((r) => r && r !== '-' && r !== '—')

  setLiveDatasets({
    batches,
    months: monthsFromBatches(batches),
    liveBatches: running.data.map(toLiveBatch),
    machineInfo: machines.map(machineToMachineInfo),
    machines: machineNames,
    recipes: recipeNames,
  })
}
