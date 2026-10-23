'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
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
import { findVariable, useResultVariables, type ResultVariable } from '@/src/shared/lib/resultVariables'
import { FormSectionV2 } from './settingsUi'

// Settings › Production. Owns the result variables catalog: the list batches pick
// their Expected Results from (Registry › Product) and that become Results columns.

const EMPTY: ResultVariable = { name: '', unit: '' }

export default function ProductionSettingsV2() {
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
