// Machines domain — get-notify/api customer surface.
//   GET /v1/machines/                          full list
//   GET /v1/machines/resume                    resumed list
//   GET /v1/machines/{id}                       single
//   GET /v1/machines/{id}/production-metrics    product-engagement KPIs

import { request } from './client'
import { activeOrganizationId } from './auth'
import type { Machine, MachineProductionMetrics } from './types'

export function listMachines(organizationId?: string): Promise<Machine[]> {
  const organization_id = organizationId ?? activeOrganizationId() ?? undefined
  return request<Machine[]>('/v1/machines/', { query: { organization_id } })
}

export function listMachinesResumed(organizationId?: string): Promise<Machine[]> {
  const organization_id = organizationId ?? activeOrganizationId() ?? undefined
  return request<Machine[]>('/v1/machines/resume', { query: { organization_id } })
}

export function getMachine(id: string): Promise<Machine> {
  return request<Machine>(`/v1/machines/${id}`)
}

export function getProductionMetrics(machineId: string): Promise<MachineProductionMetrics> {
  return request<MachineProductionMetrics>(`/v1/machines/${machineId}/production-metrics`)
}
