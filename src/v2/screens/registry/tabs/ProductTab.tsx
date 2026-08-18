'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import UploadIcon from '@mui/icons-material/FileUploadOutlined'
import type { ProductData, ResultsData } from '@/src/data/batchForm'
import { RESULT_VARIABLES } from '@/src/data/batchForm'
import { SectionCard, withAlpha } from '../ui'

interface Props {
  value: ProductData
  onChange: (v: ProductData) => void
  /** The Results dataset — the expected values live next to the variables they
   *  belong to, so the Results table can show target and measurement together. */
  results: ResultsData
  onResultsChange: (v: ResultsData) => void
}

export default function ProductTab({ value, onChange, results, onResultsChange }: Props) {
  const set = <K extends keyof ProductData>(key: K, v: ProductData[K]) => onChange({ ...value, [key]: v })

  const expected = results.expected ?? {}
  const entries = Object.entries(expected)
  const [varDraft, setVarDraft] = useState('')
  const [valDraft, setValDraft] = useState('')

  const available = RESULT_VARIABLES.filter((v) => !(v in expected))

  // Adding a target also creates the variable on the Results tab (if it is not
  // there yet), so the column the operator will type into already exists.
  const addExpected = () => {
    const typed = varDraft.trim()
    if (!typed) return
    const name = results.variables.find((x) => x.toLowerCase() === typed.toLowerCase()) ?? typed
    const isNew = !results.variables.includes(name)
    onResultsChange({
      ...results,
      variables: isNew ? [...results.variables, name] : results.variables,
      rows: isNew ? results.rows.map((r) => ({ ...r, values: { ...r.values, [name]: '' } })) : results.rows,
      expected: { ...expected, [name]: valDraft.trim() },
    })
    setVarDraft('')
    setValDraft('')
  }

  const setExpected = (v: string, val: string) =>
    onResultsChange({ ...results, expected: { ...expected, [v]: val } })

  // Removing a target drops the Results column too — but only while nothing has
  // been measured for it, so a delete here can never destroy recorded data.
  const removeExpected = (v: string) => {
    const { [v]: _dropped, ...rest } = expected
    const measured = results.rows.some((r) => (r.values[v] ?? '') !== '')
    onResultsChange({
      ...results,
      expected: rest,
      variables: measured ? results.variables : results.variables.filter((x) => x !== v),
      rows: measured
        ? results.rows
        : results.rows.map((r) => {
            const { [v]: _drop, ...values } = r.values
            return { ...r, values }
          }),
    })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <SectionCard title="Information">
        <TextField
          fullWidth
          multiline
          minRows={4}
          value={value.details}
          onChange={(e) => set('details', e.target.value)}
          placeholder="Write product information here"
        />
      </SectionCard>

      <SectionCard title="Expected Results">
        <Typography variant="body2" color="text.secondary">
          Set the value each variable is expected to reach. Variables added here become columns on the
          Results tab, where the target is shown next to what was measured.
        </Typography>

        <Box sx={{ mt: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 420 }}>
            <TableHead>
              <TableRow sx={{ '& th': { color: 'text.secondary', fontWeight: 500, bgcolor: 'background.default' } }}>
                <TableCell sx={{ width: 220 }}>Variable</TableCell>
                <TableCell>Expected value</TableCell>
                <TableCell align="right" sx={{ width: 72 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map(([v, val]) => (
                <TableRow key={v} hover>
                  <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{v}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={val}
                      onChange={(e) => setExpected(v, e.target.value)}
                      placeholder="0000"
                      aria-label={`Expected value for ${v}`}
                      sx={{ width: 120 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Remove">
                      <IconButton size="small" color="error" onClick={() => removeExpected(v)} aria-label={`Remove ${v}`}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}

              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} sx={{ py: 2.5, color: 'text.secondary', fontSize: '0.875rem' }}>
                    No expected values yet.
                  </TableCell>
                </TableRow>
              )}

              {/* input row */}
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell>
                  <TextField
                    select={available.length > 0}
                    size="small"
                    fullWidth
                    value={varDraft}
                    onChange={(e) => setVarDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addExpected()}
                    placeholder="e.g. d50 — or type to create"
                    aria-label="Variable"
                    slotProps={available.length > 0 ? { select: { displayEmpty: true } } : undefined}
                  >
                    {available.length > 0 && [
                      <MenuItem key="__none" value=""><em>Type or pick…</em></MenuItem>,
                      ...available.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>),
                    ]}
                  </TextField>
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={valDraft}
                    onChange={(e) => setValDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addExpected()}
                    placeholder="0000"
                    aria-label="Expected value"
                    sx={{ width: 120 }}
                  />
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={addExpected} disabled={!varDraft.trim()}>
            + Add expected value
          </Button>
        </Box>
      </SectionCard>

      <SectionCard title="Attachments">
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            gap: 1,
            py: 5,
            borderRadius: 2,
            border: '2px dashed',
            borderColor: (t) => withAlpha(t.palette.primary.main, 0.4),
            bgcolor: (t) => withAlpha(t.palette.primary.main, 0.06),
            color: 'primary.main',
            cursor: 'pointer',
          }}
        >
          <UploadIcon />
          <Typography variant="body2">Drag files here or click to upload</Typography>
        </Box>
      </SectionCard>
    </Box>
  )
}
