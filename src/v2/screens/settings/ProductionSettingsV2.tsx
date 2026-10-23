'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import EditIcon from '@mui/icons-material/EditOutlined'
import { ensureVariable, findVariable, useResultVariables, type ResultVariable } from '@/src/shared/lib/resultVariables'
import { useProductTargets, type ProductTargets } from '@/src/shared/lib/productTargets'
import VariableField from '@/src/v2/components/VariableField'
import { FormSectionV2 } from './settingsUi'

// Settings › Production. Owns the result variables catalog (the list batches pick
// their Expected Results from, and that become Results columns) and the expected
// results per product, which a batch loads on Registry › Product.

const EMPTY: ResultVariable = { name: '', unit: '' }

export default function ProductionSettingsV2() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <ProductTargetsSection />
      <ResultVariablesSection />
    </Box>
  )
}

function ResultVariablesSection() {
  const [vars, setVars] = useResultVariables()
  // Row being edited: its index in the list, or 'new' for the add row.
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [draft, setDraft] = useState<ResultVariable>(EMPTY)
  const [toDelete, setToDelete] = useState<number | null>(null)

  const name = draft.name.trim()
  const clash = name ? findVariable(vars, name) : undefined
  const duplicate = !!clash && (editing === 'new' || vars[editing as number] !== clash)
  const canSave = !!name && !duplicate

  const startEdit = (i: number) => {
    setEditing(i)
    setDraft(vars[i])
  }
  const startAdd = () => {
    setEditing('new')
    setDraft(EMPTY)
  }
  const cancel = () => {
    setEditing(null)
    setDraft(EMPTY)
  }
  const save = () => {
    if (!canSave) return
    const next = { name, unit: draft.unit.trim() }
    setVars((prev) => (editing === 'new' ? [...prev, next] : prev.map((v, i) => (i === editing ? next : v))))
    cancel()
  }
  const remove = () => {
    if (toDelete === null) return
    setVars((prev) => prev.filter((_, i) => i !== toDelete))
    if (editing === toDelete) cancel()
    setToDelete(null)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') cancel()
  }

  const editRow = (key: string) => (
    <TableRow key={key} sx={{ bgcolor: 'background.default' }}>
      <TableCell>
        <TextField
          autoFocus
          size="small"
          fullWidth
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          onKeyDown={onKey}
          placeholder="e.g. d97"
          slotProps={{ htmlInput: { 'aria-label': 'Variable name' } }}
          error={duplicate}
          helperText={duplicate ? 'This variable already exists' : undefined}
        />
      </TableCell>
      <TableCell>
        <TextField
          size="small"
          value={draft.unit}
          onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
          onKeyDown={onKey}
          placeholder="e.g. µm"
          slotProps={{ htmlInput: { 'aria-label': 'Unit' } }}
          sx={{ width: 140 }}
        />
      </TableCell>
      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
        <Tooltip title="Save">
          <span>
            <IconButton size="small" color="primary" onClick={save} disabled={!canSave} aria-label="Save variable">
              <CheckIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Cancel">
          <IconButton size="small" onClick={cancel} aria-label="Cancel">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormSectionV2
        title="Result variables"
        action={
          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={startAdd} disabled={editing !== null}>
            New variable
          </Button>
        }
      >
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          The variables a batch can set expected results for and measure on the Results tab. Changes apply
          to what batches can pick from now on — values already recorded on a batch are kept.
        </Typography>

        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 420 }}>
            <TableHead>
              <TableRow sx={{ '& th': { color: 'text.secondary', fontWeight: 500, bgcolor: 'background.default' } }}>
                <TableCell>Variable</TableCell>
                <TableCell sx={{ width: 180 }}>Unit</TableCell>
                <TableCell align="right" sx={{ width: 96 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {vars.map((v, i) =>
                editing === i ? (
                  editRow(v.name)
                ) : (
                  <TableRow key={v.name} hover>
                    <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{v.name}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem', color: v.unit ? 'text.primary' : 'text.secondary' }}>
                      {v.unit || '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Edit">
                        <span>
                          <IconButton size="small" onClick={() => startEdit(i)} disabled={editing !== null} aria-label={`Edit ${v.name}`}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <span>
                          <IconButton size="small" color="error" onClick={() => setToDelete(i)} disabled={editing !== null} aria-label={`Delete ${v.name}`}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ),
              )}

              {editing === 'new' && editRow('__new')}

              {vars.length === 0 && editing !== 'new' && (
                <TableRow>
                  <TableCell colSpan={3} sx={{ py: 2.5, color: 'text.secondary', fontSize: '0.875rem' }}>
                    No variables yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </FormSectionV2>

      <Dialog open={toDelete !== null} onClose={() => setToDelete(null)}>
        <DialogTitle>Delete {toDelete !== null ? vars[toDelete]?.name : ''}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            New batches won&apos;t be able to pick this variable. Batches that already use it keep their
            expected and measured values.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={remove}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// ── Expected results per product ──────────────────────────────────────────────

const preview = (expected: Record<string, string>) => Object.entries(expected)

function ProductTargetsSection() {
  const [products, setProducts] = useProductTargets()
  // Product open in the dialog: its index, or 'new'.
  const [open, setOpen] = useState<number | 'new' | null>(null)
  const [toDelete, setToDelete] = useState<number | null>(null)

  const save = (next: ProductTargets) => {
    setProducts((prev) => (open === 'new' ? [...prev, next] : prev.map((p, i) => (i === open ? next : p))))
    setOpen(null)
  }
  const remove = () => {
    if (toDelete === null) return
    setProducts((prev) => prev.filter((_, i) => i !== toDelete))
    setToDelete(null)
  }

  return (
    <FormSectionV2
      title="Expected results by product"
      action={
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setOpen('new')}>
          New product
        </Button>
      }
    >
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        The values each product is expected to reach. A batch loads them on Registry › Product and can adjust
        them there; editing a product here doesn&apos;t change batches that already loaded it.
      </Typography>

      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 520 }}>
          <TableHead>
            <TableRow sx={{ '& th': { color: 'text.secondary', fontWeight: 500, bgcolor: 'background.default' } }}>
              <TableCell sx={{ width: 220 }}>Product</TableCell>
              <TableCell>Expected results</TableCell>
              <TableCell align="right" sx={{ width: 96 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((p, i) => (
              <TableRow key={p.product} hover>
                <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{p.product}</TableCell>
                <TableCell>
                  {preview(p.expected).length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {preview(p.expected).map(([v, val]) => (
                        <Chip key={v} size="small" variant="outlined" label={`${v}: ${val || '—'}`} />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No expected results yet.</Typography>
                  )}
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => setOpen(i)} aria-label={`Edit ${p.product}`}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => setToDelete(i)} aria-label={`Delete ${p.product}`}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} sx={{ py: 2.5, color: 'text.secondary', fontSize: '0.875rem' }}>
                  No products yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      {open !== null && (
        <ProductDialog
          initial={open === 'new' ? { product: '', expected: {} } : products[open]}
          taken={products.filter((_, i) => i !== open).map((p) => p.product)}
          onCancel={() => setOpen(null)}
          onSave={save}
        />
      )}

      <Dialog open={toDelete !== null} onClose={() => setToDelete(null)}>
        <DialogTitle>Delete {toDelete !== null ? products[toDelete]?.product : ''}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Its expected results won&apos;t be offered to new batches. Batches that already loaded them keep
            their values.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={remove}>Delete</Button>
        </DialogActions>
      </Dialog>
    </FormSectionV2>
  )
}

function ProductDialog({
  initial,
  taken,
  onCancel,
  onSave,
}: {
  initial: ProductTargets
  /** Other products' names, to block duplicates. */
  taken: string[]
  onCancel: () => void
  onSave: (p: ProductTargets) => void
}) {
  const [catalog, setCatalog] = useResultVariables()
  const [name, setName] = useState(initial.product)
  const [rows, setRows] = useState<[string, string][]>(Object.entries(initial.expected))
  const [varDraft, setVarDraft] = useState('')
  const [valDraft, setValDraft] = useState('')

  const trimmed = name.trim()
  const duplicate = taken.some((t) => t.toLowerCase() === trimmed.toLowerCase())
  const canSave = !!trimmed && !duplicate

  const unitOf = (v: string) => findVariable(catalog, v)?.unit
  const addRow = () => {
    if (!varDraft.trim()) return
    const v = ensureVariable(catalog, setCatalog, varDraft)
    setRows((prev) => [...prev.filter(([x]) => x.toLowerCase() !== v.toLowerCase()), [v, valDraft.trim()]])
    setVarDraft('')
    setValDraft('')
  }
  const setVal = (i: number, val: string) => setRows((prev) => prev.map((r, j) => (j === i ? [r[0], val] : r)))
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, j) => j !== i))
  const save = () => canSave && onSave({ product: trimmed, expected: Object.fromEntries(rows) })

  return (
    <Dialog open onClose={onCancel} fullWidth maxWidth="sm">
      <DialogTitle>{initial.product ? `Edit ${initial.product}` : 'New product'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TextField
          autoFocus={!initial.product}
          size="small"
          label="Product"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={duplicate}
          helperText={duplicate ? 'This product already exists' : undefined}
          sx={{ mt: 1 }}
        />

        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { color: 'text.secondary', fontWeight: 500, bgcolor: 'background.default' } }}>
                <TableCell sx={{ width: 200 }}>Variable</TableCell>
                <TableCell>Expected value</TableCell>
                <TableCell align="right" sx={{ width: 72 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(([v, val], i) => (
                <TableRow key={v}>
                  <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{v}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={val}
                      onChange={(e) => setVal(i, e.target.value)}
                      placeholder="0000"
                      sx={{ width: 140 }}
                      slotProps={{
                        htmlInput: { 'aria-label': `Expected value for ${v}` },
                        input: unitOf(v) ? { endAdornment: <Typography variant="caption" color="text.secondary">{unitOf(v)}</Typography> } : undefined,
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Remove">
                      <IconButton size="small" color="error" onClick={() => removeRow(i)} aria-label={`Remove ${v}`}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell>
                  <VariableField value={varDraft} onChange={setVarDraft} catalog={catalog} exclude={rows.map(([v]) => v)} />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={valDraft}
                    onChange={(e) => setValDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addRow()}
                    placeholder="0000"
                    sx={{ width: 140 }}
                    slotProps={{ htmlInput: { 'aria-label': 'Expected value' } }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button size="small" variant="outlined" onClick={addRow} disabled={!varDraft.trim()} sx={{ whiteSpace: 'nowrap' }}>
                    + Add
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={!canSave}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}
