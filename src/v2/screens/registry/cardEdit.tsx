'use client'

import { createContext, useContext, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import EditIcon from '@mui/icons-material/EditOutlined'
import { SectionCard } from './ui'

// Card-based editing for the batch editor (NOTI-6052, Manager Tool pattern):
// every card is read-only until its own Edit button is pressed; while editing,
// the card swaps Edit for Discard / Save. One card edits at a time — the editor
// (BatchEditorV2) owns the draft and asks before throwing changes away.

export interface CardEditApi {
  /** Card currently in edit mode, or null. */
  editing: string | null
  /** The open card has changes that are not saved yet. */
  dirty: boolean
  /** Open a card for editing (asks first if another card has unsaved changes). */
  start: (cardId: string) => void
  save: () => void
  discard: () => void
}

const Ctx = createContext<CardEditApi | null>(null)

export const CardEditProvider = Ctx.Provider

export function useCardEdit(): CardEditApi {
  const api = useContext(Ctx)
  if (!api) throw new Error('useCardEdit must be used inside CardEditProvider')
  return api
}

/** True while this card is the one being edited. */
export function useEditing(cardId: string): boolean {
  return useCardEdit().editing === cardId
}

export function EditableCard({
  cardId,
  title,
  id,
  canEdit = true,
  extraAction,
  children,
}: {
  cardId: string
  title: string
  id?: string
  /** False hides the Edit button (e.g. data that comes from the machine). */
  canEdit?: boolean
  /** Extra controls shown next to Edit / Save (e.g. Import). */
  extraAction?: ReactNode
  children: ReactNode
}) {
  const { editing, start, save, discard } = useCardEdit()
  const on = editing === cardId

  const action = on ? (
    <>
      <Button size="small" variant="outlined" onClick={discard}>Discard</Button>
      <Button size="small" variant="contained" onClick={save}>Save</Button>
    </>
  ) : canEdit ? (
    <Button size="small" variant="outlined" startIcon={<EditIcon fontSize="small" />} onClick={() => start(cardId)} aria-label={`Edit ${title}`}>
      Edit
    </Button>
  ) : null

  return (
    <SectionCard
      title={title}
      id={id}
      editing={on}
      action={(action || extraAction) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {extraAction}
          {action}
        </Box>
      )}
    >
      {children}
    </SectionCard>
  )
}

export function UnsavedDialog({
  open,
  onSave,
  onDiscard,
  onClose,
}: {
  open: boolean
  onSave: () => void
  onDiscard: () => void
  onClose: () => void
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth aria-labelledby="unsaved-title">
      <DialogTitle id="unsaved-title">Unsaved changes</DialogTitle>
      <DialogContent>
        <DialogContentText>
          You changed this card but did not save it. Do you want to save your changes before leaving?
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" onClick={onDiscard}>Discard changes</Button>
        <Button variant="contained" onClick={onSave}>Save changes</Button>
      </DialogActions>
    </Dialog>
  )
}
