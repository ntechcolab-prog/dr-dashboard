'use client'

import { useState } from 'react'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import DownloadIcon from '@mui/icons-material/FileDownloadOutlined'
import PdfIcon from '@mui/icons-material/PictureAsPdfOutlined'
import GridIcon from '@mui/icons-material/GridOnOutlined'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { printElement } from '@/src/shared/lib/exportPdf'
import { exportCsv, exportXlsx, type Sheet } from '@/src/shared/lib/exportData'

// MUI export button (PDF / CSV / XLSX). Reuses the exact export helpers from
// src/lib — only the trigger UI is rebuilt on MUI. `sheets`/`title` resolve
// lazily on click so the export always reflects current state.
export default function ExportMenuV2({
  title,
  printId,
  filenameBase,
  sheets,
  disabled = false,
  label = 'Export',
  accent = false,
}: {
  title: string
  printId: string
  filenameBase: string
  sheets: () => Sheet[]
  disabled?: boolean
  label?: string
  accent?: boolean
}) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const open = Boolean(anchor)

  const run = (fn: () => void | Promise<void>) => {
    Promise.resolve(fn()).catch(() => {})
    setAnchor(null)
  }

  return (
    <>
      <Button
        variant={accent ? 'outlined' : 'text'}
        color={accent ? 'primary' : 'inherit'}
        size="small"
        disabled={disabled}
        startIcon={<DownloadIcon fontSize="small" />}
        endIcon={<ArrowDropDownIcon fontSize="small" />}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={accent ? undefined : { color: 'text.secondary', border: '1px solid', borderColor: 'divider' }}
      >
        {label}
      </Button>
      <Menu anchorEl={anchor} open={open} onClose={() => setAnchor(null)}>
        <MenuItem onClick={() => run(() => printElement(printId, title))}>
          <ListItemIcon><PdfIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="PDF" secondary="Print / save" />
        </MenuItem>
        <MenuItem onClick={() => run(() => exportCsv(filenameBase, sheets()[0]))}>
          <ListItemIcon><GridIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="CSV" secondary=".csv" />
        </MenuItem>
        <MenuItem onClick={() => run(() => exportXlsx(filenameBase, sheets()))}>
          <ListItemIcon><GridIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="XLSX" secondary="Excel" />
        </MenuItem>
      </Menu>
    </>
  )
}
