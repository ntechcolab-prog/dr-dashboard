// ⚠ NOT WIRED — no route or screen imports this today.
// Filter-options endpoints from the Notify API. The screens still build their
// filter lists from src/shared/data/mockData.ts.
// Kept because it may come back; delete it if the real filters work lands without it.

// Filter lookups (v2 resumed endpoints) — used to populate machine / production-
// line / sensor pickers.
//   GET /v2/filters/production-lines/resumed
//   GET /v2/filters/machines/resumed?organization_id=&production_lines=&sensors=
//   GET /v2/filters/sensors/resumed
//   GET /v2/filters/machine/{machineId}/sensors?template_name=
//
// NOTE: response shapes are typed conservatively (see types.ts) and should be
// pinned against api/specification_v2.yaml before relying on optional fields.

import { request } from './client'
import { activeOrganizationId } from './auth'
import type { MachineTuple, SensorInfo } from './types'

export function productionLinesResumed(): Promise<string[]> {
  return request<string[]>('/v2/filters/production-lines/resumed')
}

export function machinesResumed(params: { production_lines?: string[]; sensors?: string[] } = {}): Promise<MachineTuple[]> {
  const organization_id = activeOrganizationId() ?? undefined
  return request<MachineTuple[]>('/v2/filters/machines/resumed', { query: { organization_id, ...params } })
}

export function sensorsResumed(): Promise<SensorInfo[]> {
  return request<SensorInfo[]>('/v2/filters/sensors/resumed')
}

export function machineSensors(machineId: string, templateName?: string): Promise<SensorInfo[]> {
  return request<SensorInfo[]>(`/v2/filters/machine/${machineId}/sensors`, { query: { template_name: templateName } })
}
