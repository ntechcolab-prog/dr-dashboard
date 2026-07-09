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
