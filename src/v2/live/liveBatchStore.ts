// Holds the real batch records loaded for the live app, so the Registry batch
// editor can open a batch with its real data. Adapts a BatchRecord to the
// editor's BatchForm — mapped fields filled, invented ones left blank.

import type { BatchRecord } from '@/src/api/types'
import type { BatchForm } from '@/src/data/batchForm'

const byKey = new Map<string, BatchRecord>()

export function setLiveBatchRecords(records: BatchRecord[]): void {
  byKey.clear()
  for (const r of records) {
    if (r.details?.batch_id) byKey.set(r.details.batch_id, r)
    if (r.details?.id) byKey.set(r.details.id, r)
  }
}

export function getLiveBatchRecord(key: string): BatchRecord | undefined {
  return byKey.get(key)
}

const s = (v: unknown): string => (v == null ? '' : String(v))

function dateParts(iso?: string): { date: string; time: string } {
  if (!iso) return { date: '', time: '' }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { date: '', time: '' }
  const p = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
    time: `${p(d.getHours())}:${p(d.getMinutes())}`,
  }
}

/** Real BatchRecord → editor BatchForm. Fields with no backend source are blank. */
export function batchRecordToForm(r: BatchRecord): BatchForm {
  const mc = r.machine?.mechanical_config ?? {}
  const start = dateParts(r.details?.date?.start)
  const end = dateParts(r.details?.date?.end)
  const recipe = r.details?.recipe && r.details.recipe !== '-' ? r.details.recipe : ''
  return {
    id: r.details?.batch_id ?? '',
    version: '1.0',
    product: {
      branch: '',
      productType: '',
      weight: s(r.details?.size),
      volume: '',
      density: '',
      processMode: '',
      solidsContent: '',
      details: recipe,
    },
    machine: {
      name: s(r.machine?.name),
      machineType: '',
      equipment: '',
      grindingTech: s(mc.grinding_technology),
      innerLiner: s(mc.inner_liner_material),
      separationSystem: '',
      sealingLiquid: '',
      sieveSize: s(mc.sieve_size),
      beadMaterial: s(mc.bead_material),
      bead1Type: '',
      bead1Size: s(mc.beads_size_1),
      bead1FillKg: '',
      bead1FillPct: s(mc.beads_filling_level),
      bead2Type: '',
      bead2Size: s(mc.beads_size_2),
      bead2FillKg: '',
      bead2FillPct: '',
    },
    period: { startDate: start.date, endDate: end.date, startTime: start.time, endTime: end.time },
    results: { variables: [], rows: [] },
    remarks: {
      notes: (r.batch_notes ?? []).map((n) => {
        const dt = dateParts(n.created_at)
        return { date: dt.date, time: dt.time, comment: n.note || n.title || '' }
      }),
      conclusion: r.note ?? '',
    },
    reports: [],
  }
}
