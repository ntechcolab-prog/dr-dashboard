'use client'

import { useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Pagination from '@mui/material/Pagination'
import SearchIcon from '@mui/icons-material/Search'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLongOutlined'
import { REGISTRY_ROWS, type RegistryRow } from '@/src/shared/data/appData'
import { makeDraft, type BatchForm } from '@/src/shared/data/batchForm'
import { isLiveMode } from '@/src/shared/data/mockData'
import { getLiveBatchRecord, batchRecordToForm } from '@/src/v2/live/liveBatchStore'
import { useLocalStorage } from '@/src/shared/lib/useLocalStorage'
import type { Sheet } from '@/src/shared/lib/exportData'
import BatchEditorV2 from './BatchEditorV2'
import ExportMenuV2 from './ExportMenuV2'
import { withAlpha } from './ui'

// MUI-native Registry. Same data pipeline / business logic as the Tailwind v0/v1
// screen (search filter → selection → export, New Batch draft, edit existing);
// only the presentation is rebuilt on MUI. Batch editor with its tabs lives in
// BatchEditorV2.
const COLUMNS = ['Batch ID', 'Recipe', 'Start Date', 'End Date', 'Machine', 'Status']
const REGISTRY_PRINT_ID = 'registry-batch-log-print-v2'
const PAGE_SIZE = 10

export default function RegistryV2({ restricted = false }: { restricted?: boolean }) {
  const [rows, setRows] = useLocalStorage<RegistryRow[]>('dr-registry-rows', REGISTRY_ROWS)
  const [seq, setSeq] = useLocalStorage<number>('dr-batch-seq', 274)
  const [editing, setEditing] = useState<BatchForm | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      [r.id, r.product, r.line, r.status, r.start, r.end].some((v) => v.toLowerCase().includes(q)),
    )
  }, [rows, query])

  // Paginated view. The page index is clamped instead of reset so that deleting
  // or filtering rows away can never leave the table showing an empty page.
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const visible = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)
  useEffect(() => {
    setPage(0)
  }, [query])

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const allFilteredSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id))
  const someFilteredSelected = filtered.some((r) => selected.has(r.id))
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) filtered.forEach((r) => next.delete(r.id))
      else filtered.forEach((r) => next.add(r.id))
      return next
    })

  const buildSheets = (): Sheet[] => {
    const picked = rows.filter((r) => selected.has(r.id))
    return [
      {
        name: 'Selected Batches',
        rows: [COLUMNS, ...picked.map((r) => [r.id, r.product, r.start, r.end, r.line, r.status])],
      },
    ]
  }

  const newBatch = () => setEditing(makeDraft(seq))
  const editExisting = (row: RegistryRow) => {
    if (isLiveMode()) {
      const rec = getLiveBatchRecord(row.id)
      setEditing(rec ? batchRecordToForm(rec) : { ...makeDraft(0), id: row.id })
      return
    }
    setEditing({ ...makeDraft(0), id: row.id })
  }

  const onSave = (formData: BatchForm) => {
    const newRow: RegistryRow = {
      id: formData.id,
      product: formData.product.productType.split(' - ')[1] ?? formData.product.productType,
      start: `${formData.period.startDate} - ${formData.period.startTime}`,
      end: `${formData.period.endDate} - ${formData.period.endTime}`,
      line: 'Zeta 10',
      status: 'In progress',
      source: 'Manual',
    }
    setRows((prev) => {
      const exists = prev.some((r) => r.id === newRow.id)
      return exists ? prev.map((r) => (r.id === newRow.id ? newRow : r)) : [newRow, ...prev]
    })
    if (formData.id.startsWith('BA-')) setSeq((s) => s + 1)
  }

  if (editing) {
    return <BatchEditorV2 initial={editing} onBack={() => setEditing(null)} onSave={onSave} restricted={restricted} />
  }

  return (
    <Box sx={{ maxWidth: '80rem', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2, p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 36, height: 36, display: 'grid', placeItems: 'center', borderRadius: 1.5, bgcolor: (t) => withAlpha(t.palette.primary.main, 0.12), color: 'primary.main' }}>
          <ReceiptLongIcon fontSize="small" />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Registry</Typography>
      </Box>

      <Card sx={{ p: 3 }}>
        <Box sx={{ mb: 2.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TextField
              size="small"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for …"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
            />
            {!restricted && (
              <ExportMenuV2
                title="Registry · Selected Batches"
                printId={REGISTRY_PRINT_ID}
                filenameBase="registry-selected-batches"
                sheets={buildSheets}
                disabled={selected.size === 0}
                label={selected.size > 0 ? `Export (${selected.size})` : 'Export'}
                accent
              />
            )}
            <Button variant="contained" onClick={newBatch}>New Batch</Button>
          </Box>
        </Box>

        <Box id={REGISTRY_PRINT_ID} sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: '56.75rem', '& th, & td': { px: 3, whiteSpace: 'nowrap' } }}>
            <TableHead>
              <TableRow sx={{ '& th': { color: 'text.secondary', fontWeight: 500, bgcolor: 'background.default' } }}>
                {!restricted && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={allFilteredSelected}
                      indeterminate={!allFilteredSelected && someFilteredSelected}
                      onChange={toggleAll}
                      slotProps={{ input: { 'aria-label': allFilteredSelected ? 'Clear selection' : 'Select all' } }}
                    />
                  </TableCell>
                )}
                {COLUMNS.map((c) => <TableCell key={c}>{c}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((r) => {
                const isSel = selected.has(r.id)
                return (
                  <TableRow
                    key={r.id}
                    hover
                    onClick={() => editExisting(r)}
                    selected={isSel}
                    sx={{ cursor: 'pointer' }}
                  >
                    {!restricted && (
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox size="small" checked={isSel} onChange={() => toggleRow(r.id)} slotProps={{ input: { 'aria-label': `Select ${r.id}` } }} />
                      </TableCell>
                    )}
                    <TableCell sx={{ fontWeight: 500, color: 'text.primary' }}>{r.id}</TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>{r.product}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{r.start}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{r.end}</TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>{r.line}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={restricted ? COLUMNS.length : COLUMNS.length + 1} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No batches match “{query}”.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        {filtered.length > PAGE_SIZE && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, '@media print': { display: 'none' } }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Showing {current * PAGE_SIZE + 1}–{current * PAGE_SIZE + visible.length} of {filtered.length} batches
            </Typography>
            <Pagination
              count={pageCount}
              page={current + 1}
              onChange={(_, p) => setPage(p - 1)}
              color="primary"
              shape="rounded"
              size="small"
            />
          </Box>
        )}
      </Card>
    </Box>
  )
}

function StatusBadge({ status }: { status: RegistryRow['status'] }) {
  const color = status === 'Completed' ? 'success.main' : status === 'Cancelled' ? 'error.main' : 'warning.main'
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, color, fontSize: '0.875rem' }}>
      <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color }} />
      {status}
    </Box>
  )
}
