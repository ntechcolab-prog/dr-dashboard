// ⚠ NOT WIRED — no route or screen imports this today.
// Data-export endpoint from the Notify API. Exports today are built
// client-side by src/shared/lib/exportData.ts / exportPdf.ts.
// Kept because it may come back; delete it if the server-side export lands without it.

// Data exports — get-notify/api customer surface. The export is generated async
// and a download link is emailed (sender-aws); the download itself is served at
// GET /export/{hash} on the api host.
//   PUT /v1/data-exports/machines/{machineId}/
//   PUT /v1/data-exports/batch/{batchId}/

import { request } from './client'

export function exportMachineData(machineId: string, body: unknown): Promise<unknown> {
  return request('/v1/data-exports/machines/' + machineId + '/', { method: 'PUT', body })
}

export function exportBatchData(batchId: string, body: unknown): Promise<unknown> {
  return request('/v1/data-exports/batch/' + batchId + '/', { method: 'PUT', body })
}
