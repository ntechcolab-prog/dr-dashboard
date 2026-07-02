'use client'

import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Box from '@mui/material/Box'
import { SectionCard } from '../ui'

interface LogEntry { at: string; user: string; action: string; detail: string }

const LOGS: LogEntry[] = [
  { at: '19/04/2026 13:48', user: 'G. Oliveira', action: 'Updated', detail: 'Conclusion text edited' },
  { at: '19/04/2026 13:45', user: 'G. Oliveira', action: 'Added', detail: 'Result row d10/d50/d90 at 11:45' },
  { at: '19/04/2026 11:20', user: 'M. Costa', action: 'Changed', detail: 'Process Mode: Single Pass → Recirculation' },
  { at: '19/04/2026 10:15', user: 'M. Costa', action: 'Created', detail: 'Batch BA-0274 created (version 1.0)' },
]

const color = (a: string): 'primary' | 'warning' | 'default' =>
  a === 'Created' ? 'primary' : a === 'Changed' ? 'warning' : 'default'

export default function LogsTab() {
  return (
    <SectionCard title="Changelog">
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { color: 'text.secondary', fontWeight: 500, bgcolor: 'background.default' } }}>
              <TableCell>Date / Time</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Detail</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {LOGS.map((l, i) => (
              <TableRow key={i}>
                <TableCell sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{l.at}</TableCell>
                <TableCell>{l.user}</TableCell>
                <TableCell><Chip size="small" label={l.action} color={color(l.action)} variant={color(l.action) === 'default' ? 'outlined' : 'filled'} /></TableCell>
                <TableCell>{l.detail}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </SectionCard>
  )
}
