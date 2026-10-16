'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Tooltip from '@mui/material/Tooltip'
import EditIcon from '@mui/icons-material/EditOutlined'
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import CheckIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import CloseIcon from '@mui/icons-material/Close'
import type { ResultsData, ResultRow } from '@/src/shared/data/batchForm'
import { maskDate, maskTime } from '@/src/shared/lib/masks'
import { deltaLabel } from '@/src/shared/lib/expected'
import { EditableCard, useEditing } from '../cardEdit'

const emptyDraft = (vars: string[]): ResultRow => ({
  date: '', time: '', values: Object.fromEntries(vars.map((v) => [v, ''])),
})

export default function ResultsTab({ value, onChange }: { value: ResultsData; onChange: (v: ResultsData) => void }) {
  const on = useEditing('results')
  const [draft, setDraft] = useState<ResultRow>(emptyDraft(value.variables))
  const [editRow, setEditRow] = useState<number | null>(null)
  const [rowDraft, setRowDraft] = useState<ResultRow>(emptyDraft(value.variables))

  // Leaving edit mode (Save or Discard) drops any half-typed row.
  const [wasOn, setWasOn] = useState(on)
  if (wasOn !== on) {
    setWasOn(on)
    setEditRow(null)
    setDraft(emptyDraft(value.variables))
  }

  const addRow = () => {
    if (!draft.date && !draft.time && Object.values(draft.values).every((x) => !x)) return
    onChange({ ...value, rows: [...value.rows, draft] })
    setDraft(emptyDraft(value.variables))
  }
  const removeRow = (i: number) => onChange({ ...value, rows: value.rows.filter((_, idx) => idx !== i) })
  const startRowEdit = (i: number) => { setEditRow(i); setRowDraft(value.rows[i]) }
  const saveRowEdit = () => {
    if (editRow == null) return
    onChange({ ...value, rows: value.rows.map((r, idx) => (idx === editRow ? rowDraft : r)) })
    setEditRow(null)
  }

  const importSample = () => {
    const sample: ResultRow = {
      date: '19/11/2024',
      time: '12:15:00',
      values: Object.fromEntries(value.variables.map((v) => [v, (Math.round(Math.random() * 1000) / 100).toString()])),
    }
    onChange({ ...value, rows: [...value.rows, sample] })
  }

  const cell = { fontSize: '0.875rem' }
  const hasExpected = Object.keys(value.expected ?? {}).length > 0
  // "Last Sample" = the most recent row that has at least one measured value.
  const lastSample = [...value.rows].reverse().find((r) => value.variables.some((v) => (r.values[v] ?? '') !== ''))
  const summaryRow = { '& td': { bgcolor: 'background.default', py: 1 } }
  const summaryLabel = {
    fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.04em', color: 'text.secondary',
  }

  return (
    <EditableCard
      cardId="results"
      title="Enter Test Results"
      extraAction={on && <Button size="small" variant="outlined" onClick={importSample}>Import</Button>}
    >
      <Typography variant="body2" color="text.secondary">
        {on ? 'Enter each sample in the grey row and press + Add row.' : 'Measured values for each variable of this batch.'}
      </Typography>

      {/* Variables mirror Product → Expected Results and are managed only there. */}
      {value.variables.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
          {value.variables.map((v) => <Chip key={v} label={v} color="primary" size="small" />)}
          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
            Variables are managed in Product → Expected Results.
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow sx={{ '& th': { color: 'text.secondary', fontWeight: 500, bgcolor: 'background.default' } }}>
              <TableCell>DATE</TableCell>
              <TableCell>Time</TableCell>
              {value.variables.map((v) => <TableCell key={v}>{v}</TableCell>)}
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Target vs last sample, aligned with each variable column.
                Only rendered once the batch has at least one expected value. */}
            {hasExpected && (
              <>
                <TableRow sx={summaryRow}>
                  <TableCell sx={summaryLabel}>Expected</TableCell>
                  <TableCell />
                  {value.variables.map((v) => (
                    <TableCell key={v} sx={{ ...cell, fontVariantNumeric: 'tabular-nums' }}>
                      {value.expected?.[v] || '—'}
                    </TableCell>
                  ))}
                  <TableCell />
                </TableRow>
                <TableRow sx={{ ...summaryRow, '& td': { ...summaryRow['& td'], borderBottom: '2px solid', borderBottomColor: 'divider' } }}>
                  <TableCell sx={{ ...cell, verticalAlign: 'top' }}>
                    <Box component="span" sx={{ ...summaryLabel, display: 'block' }}>Last Sample</Box>
                    {lastSample?.date || '—'}
                  </TableCell>
                  <TableCell sx={{ ...cell, color: 'text.secondary', verticalAlign: 'bottom' }}>{lastSample?.time || ''}</TableCell>
                  {value.variables.map((v) => {
                    const current = lastSample?.values[v] ?? ''
                    const diff = deltaLabel(value.expected?.[v], current)
                    return (
                      <TableCell key={v} sx={{ ...cell, fontVariantNumeric: 'tabular-nums', verticalAlign: 'bottom' }}>
                        {current || '—'}
                        {diff && (
                          <Box component="span" sx={{ display: 'block', fontSize: '0.6875rem', color: 'text.secondary' }}>
                            {diff}
                          </Box>
                        )}
                      </TableCell>
                    )
                  })}
                  <TableCell />
                </TableRow>
              </>
            )}

            {value.rows.map((r, i) =>
              on && editRow === i ? (
                <TableRow key={i} sx={{ bgcolor: 'background.default' }}>
                  <TableCell><TextField size="small" value={rowDraft.date} onChange={(e) => setRowDraft({ ...rowDraft, date: maskDate(e.target.value) })} placeholder="DD/MM/YYYY" sx={{ width: 120 }} /></TableCell>
                  <TableCell><TextField size="small" value={rowDraft.time} onChange={(e) => setRowDraft({ ...rowDraft, time: maskTime(e.target.value) })} placeholder="00:00:00" sx={{ width: 100 }} /></TableCell>
                  {value.variables.map((v) => (
                    <TableCell key={v}>
                      <TextField size="small" value={rowDraft.values[v] ?? ''} onChange={(e) => setRowDraft({ ...rowDraft, values: { ...rowDraft.values, [v]: e.target.value } })} placeholder="0000" sx={{ width: 84 }} />
                    </TableCell>
                  ))}
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <IconButton size="small" color="success" onClick={saveRowEdit} aria-label={`Save row ${i + 1}`}><CheckIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => setEditRow(null)} aria-label="Cancel"><CloseIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={i} hover>
                  <TableCell sx={cell}>{r.date}</TableCell>
                  <TableCell sx={{ ...cell, color: 'text.secondary' }}>{r.time}</TableCell>
                  {value.variables.map((v) => (
                    <TableCell key={v} sx={{ ...cell, fontVariantNumeric: 'tabular-nums' }}>{r.values[v] || '—'}</TableCell>
                  ))}
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {on && (
                      <>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => startRowEdit(i)} aria-label={`Edit row ${i + 1}`}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => removeRow(i)} aria-label={`Delete row ${i + 1}`}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              )
            )}

            {value.rows.length === 0 && !on && (
              <TableRow>
                <TableCell colSpan={value.variables.length + 3} sx={{ py: 2.5, color: 'text.secondary', fontSize: '0.875rem' }}>
                  No samples yet.
                </TableCell>
              </TableRow>
            )}

            {/* input row — the last grey row, with + Add row at its end */}
            {on && (
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell><TextField size="small" value={draft.date} onChange={(e) => setDraft({ ...draft, date: maskDate(e.target.value) })} placeholder="DD/MM/YYYY" sx={{ width: 120 }} slotProps={{ htmlInput: { 'aria-label': 'New sample date' } }} /></TableCell>
                <TableCell><TextField size="small" value={draft.time} onChange={(e) => setDraft({ ...draft, time: maskTime(e.target.value) })} placeholder="00:00:00" sx={{ width: 100 }} slotProps={{ htmlInput: { 'aria-label': 'New sample time' } }} /></TableCell>
                {value.variables.map((v) => (
                  <TableCell key={v}>
                    <TextField size="small" value={draft.values[v] ?? ''} onChange={(e) => setDraft({ ...draft, values: { ...draft.values, [v]: e.target.value } })} onKeyDown={(e) => e.key === 'Enter' && addRow()} placeholder="0000" sx={{ width: 84 }} slotProps={{ htmlInput: { 'aria-label': `New sample ${v}` } }} />
                  </TableCell>
                ))}
                <TableCell align="right">
                  <Button size="small" variant="outlined" onClick={addRow} sx={{ whiteSpace: 'nowrap' }}>+ Add row</Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </EditableCard>
  )
}
