'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
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
import type { ResultsData, ResultRow } from '@/src/data/batchForm'
import { RESULT_VARIABLES } from '@/src/data/batchForm'
import { maskDate, maskTime } from '@/src/lib/masks'
import { deltaLabel, latestValue } from '@/src/lib/expected'

const emptyDraft = (vars: string[]): ResultRow => ({
  date: '', time: '', values: Object.fromEntries(vars.map((v) => [v, ''])),
})

export default function ResultsTab({ value, onChange }: { value: ResultsData; onChange: (v: ResultsData) => void }) {
  const [draft, setDraft] = useState<ResultRow>(emptyDraft(value.variables))
  const [varDraft, setVarDraft] = useState('')
  const [editVar, setEditVar] = useState<string | null>(null)
  const [varRename, setVarRename] = useState('')
  const [editRow, setEditRow] = useState<number | null>(null)
  const [rowDraft, setRowDraft] = useState<ResultRow>(emptyDraft(value.variables))

  const available = RESULT_VARIABLES.filter((v) => !value.variables.includes(v))

  const addVariable = (v: string) => {
    onChange({
      ...value,
      variables: [...value.variables, v],
      rows: value.rows.map((r) => ({ ...r, values: { ...r.values, [v]: '' } })),
    })
    setDraft((d) => ({ ...d, values: { ...d.values, [v]: '' } }))
  }

  const commitVariable = () => {
    const v = varDraft.trim()
    if (!v) return
    if (!value.variables.some((x) => x.toLowerCase() === v.toLowerCase())) addVariable(v)
    setVarDraft('')
  }

  const removeVariable = (v: string) => {
    const { [v]: _dropped, ...expectedRest } = value.expected ?? {}
    onChange({
      ...value,
      variables: value.variables.filter((x) => x !== v),
      rows: value.rows.map((r) => {
        const rest = { ...r.values }
        delete rest[v]
        return { ...r, values: rest }
      }),
      expected: expectedRest,
    })
  }

  const startVarEdit = (v: string) => { setEditVar(v); setVarRename(v) }
  const commitVarRename = () => {
    const oldName = editVar
    setEditVar(null)
    if (oldName == null) return
    const nn = varRename.trim()
    if (!nn || nn === oldName) return
    if (value.variables.some((x) => x !== oldName && x.toLowerCase() === nn.toLowerCase())) return
    const renameKey = (vals: Record<string, string>) => {
      const { [oldName]: ov, ...rest } = vals
      return { ...rest, [nn]: ov ?? '' }
    }
    onChange({
      ...value,
      variables: value.variables.map((x) => (x === oldName ? nn : x)),
      rows: value.rows.map((r) => ({ ...r, values: renameKey(r.values) })),
      expected: oldName in (value.expected ?? {}) ? renameKey(value.expected ?? {}) : value.expected,
    })
    setDraft((d) => ({ ...d, values: renameKey(d.values) }))
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
  const summaryRow = { '& td': { bgcolor: 'background.default', py: 1 } }
  const summaryLabel = {
    fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.04em', color: 'text.secondary',
  }

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Enter Test Results</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Select a variable and enter its test result in the table.</Typography>

      <Box sx={{ mt: 2.5, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 280, maxWidth: 420 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>Variable · pick one or type a new one</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              select={available.length > 0}
              size="small" fullWidth value={varDraft}
              onChange={(e) => setVarDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && commitVariable()}
              placeholder="e.g. d50 — or type to create"
              slotProps={available.length > 0 ? { select: { displayEmpty: true } } : undefined}
            >
              {available.length > 0 && [
                <MenuItem key="__none" value=""><em>Type or pick…</em></MenuItem>,
                ...available.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>),
              ]}
            </TextField>
            <Button variant="outlined" onClick={commitVariable} disabled={!varDraft.trim()} sx={{ flexShrink: 0 }}>Add</Button>
          </Box>
        </Box>
        <Button variant="contained" onClick={importSample}>Import</Button>
      </Box>

      {value.variables.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {value.variables.map((v) =>
            editVar === v ? (
              <TextField
                key={v} autoFocus size="small" value={varRename}
                onChange={(e) => setVarRename(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') commitVarRename(); if (e.key === 'Escape') setEditVar(null) }}
                onBlur={commitVarRename}
                sx={{ width: 120 }}
              />
            ) : (
              <Chip
                key={v} label={v} color="primary" onDelete={() => removeVariable(v)}
                onClick={() => startVarEdit(v)} deleteIcon={<CloseIcon />}
                icon={<EditIcon sx={{ fontSize: 14 }} />}
              />
            )
          )}
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
            {/* Target vs latest measurement, aligned with each variable column.
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
                  <TableCell sx={summaryLabel}>Current</TableCell>
                  <TableCell />
                  {value.variables.map((v) => {
                    const current = latestValue(value.rows, v)
                    const diff = deltaLabel(value.expected?.[v], current)
                    return (
                      <TableCell key={v} sx={{ ...cell, fontVariantNumeric: 'tabular-nums' }}>
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
              editRow === i ? (
                <TableRow key={i} sx={{ bgcolor: 'background.default' }}>
                  <TableCell><TextField size="small" value={rowDraft.date} onChange={(e) => setRowDraft({ ...rowDraft, date: maskDate(e.target.value) })} placeholder="DD/MM/YYYY" sx={{ width: 120 }} /></TableCell>
                  <TableCell><TextField size="small" value={rowDraft.time} onChange={(e) => setRowDraft({ ...rowDraft, time: maskTime(e.target.value) })} placeholder="00:00:00" sx={{ width: 100 }} /></TableCell>
                  {value.variables.map((v) => (
                    <TableCell key={v}>
                      <TextField size="small" value={rowDraft.values[v] ?? ''} onChange={(e) => setRowDraft({ ...rowDraft, values: { ...rowDraft.values, [v]: e.target.value } })} placeholder="0000" sx={{ width: 84 }} />
                    </TableCell>
                  ))}
                  <TableCell align="right">
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
                  <TableCell align="right">
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => startRowEdit(i)} aria-label={`Edit row ${i + 1}`}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => removeRow(i)} aria-label={`Delete row ${i + 1}`}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              )
            )}

            {/* input row */}
            <TableRow sx={{ bgcolor: 'background.default' }}>
              <TableCell><TextField size="small" value={draft.date} onChange={(e) => setDraft({ ...draft, date: maskDate(e.target.value) })} placeholder="DD/MM/YYYY" sx={{ width: 120 }} /></TableCell>
              <TableCell><TextField size="small" value={draft.time} onChange={(e) => setDraft({ ...draft, time: maskTime(e.target.value) })} placeholder="00:00:00" sx={{ width: 100 }} /></TableCell>
              {value.variables.map((v) => (
                <TableCell key={v}>
                  <TextField size="small" value={draft.values[v] ?? ''} onChange={(e) => setDraft({ ...draft, values: { ...draft.values, [v]: e.target.value } })} placeholder="0000" sx={{ width: 84 }} />
                </TableCell>
              ))}
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Button variant="outlined" onClick={addRow}>+ Add row</Button>
      </Box>
    </Card>
  )
}
