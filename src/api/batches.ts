// Batches domain — get-notify/api customer surface. Gated server-side by the
// BATCH_RECORDS feature flag (check auth.hasFeature('BATCH_RECORDS')).
//   GET    /v1/batch/completed | /running   paginated { data, page, total_pages }
//   GET    /v1/batch/{id}                    full BatchRecord
//   POST   /v1/batch  ·  PUT /v1/batch/{id}  ·  DELETE /v1/batch/{id}
//   *      /v1/batch_notes/*                  batch notes

import { request } from './client'
import type { BatchNote, BatchRecord, PaginatedBatches } from './types'

export interface BatchListParams {
  limit?: number
  page?: number
  sort?: string
  order?: 'asc' | 'desc'
  batch_id?: string
  machine_name?: string
  recipe?: string
}

export function listCompletedBatches(params: BatchListParams = {}): Promise<PaginatedBatches> {
  return request<PaginatedBatches>('/v1/batch/completed', { query: { ...params } })
}

export function listRunningBatches(params: BatchListParams = {}): Promise<PaginatedBatches> {
  return request<PaginatedBatches>('/v1/batch/running', { query: { ...params } })
}

export function getBatch(batchId: string): Promise<BatchRecord> {
  return request<BatchRecord>(`/v1/batch/${batchId}`)
}

export function deleteBatch(batchId: string): Promise<void> {
  return request<void>(`/v1/batch/${batchId}`, { method: 'DELETE' })
}

// --- Batch notes --------------------------------------------------------

export function listBatchNotes(batchId: string): Promise<BatchNote[]> {
  return request<BatchNote[]>(`/v1/batch_notes/batch/${batchId}`)
}

export function createBatchNote(note: Pick<BatchNote, 'batch_id' | 'title' | 'note'>): Promise<BatchNote> {
  return request<BatchNote>('/v1/batch_notes/', { method: 'POST', body: note })
}

export function updateBatchNote(id: string, note: Partial<Pick<BatchNote, 'title' | 'note'>>): Promise<BatchNote> {
  return request<BatchNote>(`/v1/batch_notes/${id}`, { method: 'PUT', body: note })
}

export function deleteBatchNote(id: string): Promise<void> {
  return request<void>(`/v1/batch_notes/${id}`, { method: 'DELETE' })
}
