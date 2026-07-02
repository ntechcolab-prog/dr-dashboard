'use client'

import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import type { PeriodData } from '@/src/data/batchForm'
import { SectionCard } from '../ui'

export default function PeriodTab({ value, onChange }: { value: PeriodData; onChange: (v: PeriodData) => void }) {
  const set = <K extends keyof PeriodData>(key: K, v: PeriodData[K]) => onChange({ ...value, [key]: v })

  return (
    <SectionCard title="Timeline">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
        <TextField
          type="date" label="Start Date" size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }}
          value={value.startDate} onChange={(e) => set('startDate', e.target.value)}
        />
        <TextField
          type="date" label="End Date" size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }}
          value={value.endDate} onChange={(e) => set('endDate', e.target.value)}
        />
        <TextField
          type="time" label="Start Time" size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }}
          value={value.startTime} onChange={(e) => set('startTime', e.target.value)}
        />
        <TextField
          type="time" label="End Time" size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }}
          value={value.endTime} onChange={(e) => set('endTime', e.target.value)}
        />
      </Box>
    </SectionCard>
  )
}
