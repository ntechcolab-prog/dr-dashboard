'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
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
import type { ProductData, ResultsData } from '@/src/shared/data/batchForm'
import { ensureVariable, useResultVariables } from '@/src/shared/lib/resultVariables'
import VariableField from '@/src/v2/components/VariableField'
import { withAlpha } from '../ui'
import { EditableCard, useEditing } from '../cardEdit'
import RichTextField from '@/src/v2/components/RichTextField'

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

  // Options come from the catalog in Settings › Production.
  const [catalog, setCatalog] = useResultVariables()
  const editInfo = useEditing('product-info')
  const editExpected = useEditing('product-expected')
  const editFiles = useEditing('product-attachments')

  // Adding a target also creates the variable on the Results tab (if it is not
  // there yet), so the column the operator will type into already exists.
  const withTargets = (targets: Record<string, string>) => {
    let { variables, rows } = results
    const next = { ...expected }
    for (const [typed, val] of Object.entries(targets)) {
      const canonical = ensureVariable(catalog, setCatalog, typed)
      const name = variables.find((x) => x.toLowerCase() === canonical.toLowerCase()) ?? canonical
      if (!variables.includes(name)) {
        variables = [...variables, name]
        rows = rows.map((r) => ({ ...r, values: { ...r.values, [name]: '' } }))
      }
      next[name] = val
    }
    onResultsChange({ ...results, variables, rows, expected: next })
  }

  const addExpected = () => {
    if (!varDraft.trim()) return
    withTargets({ [varDraft]: valDraft.trim() })
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
      <EditableCard cardId="product-info" title="Information">
        {/* Remount on mode change so Discard shows the saved text again. */}
        <RichTextField
          key={editInfo ? 'edit' : 'view'}
          value={value.details}
          onChange={(html) => set('details', html)}
          readOnly={!editInfo}
          placeholder="Write product information here"
        />
        {!editInfo && !value.details && (
          <Typography variant="body2" color="text.secondary">No product information yet.</Typography>
        )}
      </EditableCard>

      <EditableCard cardId="product-expected" title="Expected Results">
        <Typography variant="body2" color="text.secondary">
          Set the value each variable is expected to reach. Variables added here become columns on the
          Results tab, where the target is shown next to what was measured. The variable list is managed
          in Settings › Production.
        </Typography>

        <Box sx={{ mt: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 420 }}>
            <TableHead>
              <TableRow sx={{ '& th': { color: 'text.secondary', fontWeight: 500, bgcolor: 'background.default' } }}>
                <TableCell sx={{ width: 220 }}>Variable</TableCell>
                <TableCell>Expected value</TableCell>
                {editExpected && <TableCell align="right" sx={{ width: 72 }} />}
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map(([v, val]) => (
                <TableRow key={v} hover>
                  <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{v}</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums' }}>
                    {editExpected ? (
                      <TextField
                        size="small"
                        value={val}
                        onChange={(e) => setExpected(v, e.target.value)}
                        placeholder="0000"
                        slotProps={{ htmlInput: { 'aria-label': `Expected value for ${v}` } }}
                        sx={{ width: 120 }}
                      />
                    ) : (val || '—')}
                  </TableCell>
                  {editExpected && (
                    <TableCell align="right">
                      <Tooltip title="Remove">
                        <IconButton size="small" color="error" onClick={() => removeExpected(v)} aria-label={`Remove ${v}`}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}

              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={editExpected ? 3 : 2} sx={{ py: 2.5, color: 'text.secondary', fontSize: '0.875rem' }}>
                    No expected values yet.
                  </TableCell>
                </TableRow>
              )}

              {/* input row — only while the card is in edit mode */}
              {editExpected && (
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell>
                  <VariableField value={varDraft} onChange={setVarDraft} catalog={catalog} exclude={Object.keys(expected)} />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={valDraft}
                    onChange={(e) => setValDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addExpected()}
                    placeholder="0000"
                    slotProps={{ htmlInput: { 'aria-label': 'Expected value' } }}
                    sx={{ width: 120 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button size="small" variant="outlined" onClick={addExpected} disabled={!varDraft.trim()} sx={{ whiteSpace: 'nowrap' }}>
                    + Add
                  </Button>
                </TableCell>
              </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </EditableCard>

      <EditableCard cardId="product-attachments" title="Attachments">
        {!editFiles ? (
          <Typography variant="body2" color="text.secondary">No attachments yet.</Typography>
        ) : (
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
        )}
      </EditableCard>
    </Box>
  )
}
