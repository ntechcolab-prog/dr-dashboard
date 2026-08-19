// Alarms, alerts and machine errors — get-notify/api customer surface.
//   GET /v2/machines/metrics/alarm-history   paginated alarms (params)
//   GET /v2/machines/metrics/alert-history   paginated alerts (params)
//   GET /v1/errors/                          machine errors (from/to)
//   GET /v1/errors/unresolved                unresolved errors

import { request } from './client'
import type { MachineError, MetricAlarm, MetricAlert, Paginated } from './types'

export interface HistoryParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
  machine_ids?: string[]
  production_lines?: string[]
  sensors?: string[]
  period_time?: string
}

export function alarmHistory(params: HistoryParams = {}): Promise<Paginated<MetricAlarm>> {
  return request<Paginated<MetricAlarm>>('/v2/machines/metrics/alarm-history', { query: { ...params } })
}

export function alertHistory(params: HistoryParams = {}): Promise<Paginated<MetricAlert>> {
  return request<Paginated<MetricAlert>>('/v2/machines/metrics/alert-history', { query: { ...params } })
}

export function machineErrors(machineId: string, from?: string, to?: string): Promise<MachineError[]> {
  return request<MachineError[]>('/v1/errors/', { query: { machine_id: machineId, from, to } })
}

export function unresolvedMachineErrors(machineId: string): Promise<MachineError[]> {
  return request<MachineError[]>('/v1/errors/unresolved', { query: { machine_id: machineId } })
}
