// ⚠ NOT WIRED — no route or screen imports this today.
// The intended mock↔API switch (see INTEGRATION_NOTES.md). The live path
// currently goes through src/v2/live/loadLiveApp.ts instead, which injects real
// data straight into the datasets.
// Kept because it may come back; delete it if the backend integration lands without it.

// Data-access seam. Screens import from HERE instead of reaching into the mock
// modules or the api modules directly — so swapping mock→real happens in one
// place, not across the ~54 scattered imports.
//
// Default is 'mock' so nothing changes until a screen migrates to these facade
// functions AND setDataSource('api') is flipped (e.g. once auth + stg are wired).

import { ALL_BATCHES, MACHINE_INFO, type Batch, type MachineInfo } from './mockData'
import { listMachinesResumed } from '../api/machines'
import { listCompletedBatches, listRunningBatches, type BatchListParams } from '../api/batches'
import { batchSummaryToBatch, machineToMachineInfo } from '../api/adapters'

export type DataSource = 'mock' | 'api'

let currentSource: DataSource = 'mock'

export function setDataSource(source: DataSource): void {
  currentSource = source
}

export function getDataSource(): DataSource {
  return currentSource
}

// --- Machines -----------------------------------------------------------

export async function fetchMachines(): Promise<MachineInfo[]> {
  if (currentSource === 'api') {
    const machines = await listMachinesResumed()
    return machines.map(machineToMachineInfo)
  }
  return MACHINE_INFO
}

// --- Batches ------------------------------------------------------------

export async function fetchCompletedBatches(params: BatchListParams = {}): Promise<Batch[]> {
  if (currentSource === 'api') {
    const page = await listCompletedBatches(params)
    return page.data.map(batchSummaryToBatch)
  }
  return ALL_BATCHES
}

export async function fetchRunningBatches(params: BatchListParams = {}): Promise<Batch[]> {
  if (currentSource === 'api') {
    const page = await listRunningBatches(params)
    return page.data.map(batchSummaryToBatch)
  }
  return ALL_BATCHES.filter((b) => b.status === 'In operation')
}
