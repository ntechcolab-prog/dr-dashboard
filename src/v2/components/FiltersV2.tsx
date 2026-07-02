'use client'

import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Checkbox from '@mui/material/Checkbox'
import ListItemText from '@mui/material/ListItemText'
import Chip from '@mui/material/Chip'
import OutlinedInput from '@mui/material/OutlinedInput'
import Button from '@mui/material/Button'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { MACHINES, RECIPES, MONTHS } from '@/src/data/mockData'
import { buildWeeks, weekLabel } from '@/src/lib/weeks'

export type Period = 'monthly' | 'weekly'

interface FiltersV2Props {
  machines: string[]
  recipes: string[]
  setMachines: (next: string[]) => void
  setRecipes: (next: string[]) => void
  period: Period
  setPeriod: (p: Period) => void
  monthKey: string
  setMonthKey: (key: string) => void
  year: number
  month: number
  weekIdx: number
  setWeekIdx: (i: number) => void
  onClear: () => void
  actions?: ReactNode
}

function MultiSelect({
  label, options, selected, onChange,
}: { label: string; options: readonly string[]; selected: string[]; onChange: (v: string[]) => void }) {
  return (
    <FormControl fullWidth size="small">
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={selected}
        onChange={(e) => onChange(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
        input={<OutlinedInput label={label} />}
        renderValue={(sel) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {sel.map((v) => <Chip key={v} label={v} size="small" color="primary" variant="outlined" />)}
          </Box>
        )}
      >
        {options.map((o) => (
          <MenuItem key={o} value={o}>
            <Checkbox checked={selected.includes(o)} size="small" />
            <ListItemText primary={o} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default function FiltersV2({
  machines, recipes, setMachines, setRecipes,
  period, setPeriod, monthKey, setMonthKey, year, month, weekIdx, setWeekIdx, onClear, actions,
}: FiltersV2Props) {
  const weeks = buildWeeks(year, month)
  const safeWeek = Math.min(weekIdx, weeks.length - 1)

  return (
    <Box sx={{ px: 3, py: 2.5 }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
        <Typography variant="overline" sx={{ fontWeight: 600, color: 'text.primary' }}>Filter</Typography>
        {actions && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{actions}</Box>}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, columnGap: 5, rowGap: 2 }}>
        <MultiSelect label="Filter by Machine" options={MACHINES} selected={machines} onChange={setMachines} />
        <MultiSelect label="Filter by Recipe" options={RECIPES} selected={recipes} onChange={setRecipes} />
      </Box>

      <Box sx={{ mt: 2.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
          <ToggleButtonGroup
            exclusive size="small" value={period}
            onChange={(_, v) => v && setPeriod(v)}
          >
            <ToggleButton value="monthly">Monthly</ToggleButton>
            <ToggleButton value="weekly">Weekly</ToggleButton>
          </ToggleButtonGroup>

          {period === 'weekly' ? (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Week</InputLabel>
              <Select label="Week" value={String(safeWeek)} onChange={(e) => setWeekIdx(Number(e.target.value))}>
                {weeks.map((w, i) => (
                  <MenuItem key={i} value={String(i)}>Week {i + 1} · {weekLabel(year, month, w)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Month</InputLabel>
              <Select label="Month" value={monthKey} onChange={(e) => setMonthKey(e.target.value)}>
                {MONTHS.map((m) => <MenuItem key={m.key} value={m.key}>{m.label}</MenuItem>)}
              </Select>
            </FormControl>
          )}
        </Box>

        <Button variant="outlined" size="small" onClick={onClear}>Clear Filters</Button>
      </Box>
    </Box>
  )
}
