'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import InputAdornment from '@mui/material/InputAdornment'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import type { BatchForm } from '@/src/data/batchForm'
import { useProductionMonitoring } from '@/src/screens/settings/MiscSettings'
import { SectionCard, Stat, KvGroup, KvList, withAlpha } from '../ui'
import SensorChartV2 from '../SensorChartV2'

const TARGET_ROWS = [
  ['Target Type', 'Energy'],
  ['Target Value', '2000.0'],
  ['Maximum Temperature Allowed (°C)', '60'],
]
const PROCESS_ROWS = [
  ['Energy', '978.2 kWh'],
  ['Specific Energy (kWh/kg)', '0.050'],
  ['Estimated Energy Consumption (kWh)', '0.0'],
  ['Total Runtime', '00:00:04'],
  ['Cycles', '0.0'],
]
const MACHINE_BASIC = [
  ['Manufacturer', 'NETZSCH'],
  ['Type', 'Bead Mill'],
  ['Commission number', 'l2500522-10'],
  ['Name', 'ALPHA lll - (30kW) BlueLab'],
  ['Production line', 'Line 2'],
]
const MACHINE_TECH = [
  ['Samba system', 'Yes'],
  ['Grinding technology', 'Neos'],
  ['Inner liner material', 'NE Steel'],
  ['Sieve size', '120 mm'],
  ['Bead material', 'CeraBeads'],
  ['Bead size 1', '8 mm'],
  ['Bead size 2', '12 mm'],
  ['Bead filling level', '75%'],
]

const SENSORS = [
  { name: 'Energy', unit: 'kWh', color: '#f19909', stats: [['Min', '0'], ['Max', '2456'], ['Avg', '1050']] },
  { name: 'Product flow', unit: 'l/Min', color: '#9b7fd4', stats: [['Min', '30'], ['Max', '160'], ['Avg', '90']] },
  { name: 'Mill current', unit: 'kWh', color: '#e0489b', stats: [['Min', '20'], ['Max', '102'], ['Avg', '48']] },
]
const SERIES = [
  { name: 'Energy', color: '#f19909', data: [3, 5, 7, 8, 9, 9.5, 9, 8, 8.6, 9.4, 7.8, 6] },
  { name: 'Product flow', color: '#9b7fd4', data: [5, 6.4, 5.4, 7, 6, 5.2, 6.1, 7, 5.8, 5, 4.6, 4] },
  { name: 'Mill current', color: '#e0489b', data: [3, 3.2, 3.8, 4, 3.4, 4, 4.6, 4.1, 4, 3.4, 3.8, 3.2] },
]
const X_LABELS = SERIES[0].data.map((_, i) => {
  const m = 8 * 60 + i * 30
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
})

const GRAPH_TEMPLATES = [
  { name: 'All sensors', sensors: ['Energy', 'Product flow', 'Mill current'] },
  { name: 'Energy profile', sensors: ['Energy'] },
  { name: 'Flow & current', sensors: ['Product flow', 'Mill current'] },
  { name: 'Mill current', sensors: ['Mill current'] },
]

const ALARMS = [
  ['02 Mar 2021 / 11:13am', '02 Mar 2021 / 11:14am', 'Low cooling liquid level'],
  ['02 Mar 2021 / 10:48am', '02 Mar 2021 / 10:49am', 'High product temperature'],
  ['02 Mar 2021 / 10:21am', '02 Mar 2021 / 10:22am', 'Pressure above setpoint'],
  ['02 Mar 2021 / 09:57am', '02 Mar 2021 / 09:58am', 'Low cooling liquid level'],
  ['02 Mar 2021 / 09:30am', '02 Mar 2021 / 09:31am', 'Bead wear warning'],
]
const ALERTS = [
  ['02 Mar 2021 / 11:05am', '02 Mar 2021 / 11:06am', 'Flow rate fluctuation detected'],
  ['02 Mar 2021 / 10:32am', '02 Mar 2021 / 10:33am', 'Mill current near limit'],
  ['02 Mar 2021 / 10:04am', '02 Mar 2021 / 10:05am', 'Cooling pump speed reduced'],
  ['02 Mar 2021 / 09:41am', '02 Mar 2021 / 09:42am', 'Sample interval exceeded'],
]
const ACTIVITY = [
  ['1', 'MR completed by Antoni Newton', 'Commissioning ER alarm', '11/05/2021 12:46:34'],
  ['2', 'User logged in', 'User Login', '11/05/2021 11:32:08'],
  ['3', 'User logged out', 'User Logout', '09/05/2021 18:14:51'],
  ['4', 'Recipe Start: Action Start', 'Manual action', '09/05/2021 09:02:10'],
  ['5', 'Recipe Start: Action Start', 'Manual action', '08/05/2021 17:48:22'],
  ['6', 'Limit value reached for fill level', 'Automatic change', '08/05/2021 16:12:03'],
  ['7', 'Batch BA-0074 created', 'Batch start', '05/05/2021 08:30:00'],
]

export default function ResumeTab({ form }: { form: BatchForm }) {
  const [template, setTemplate] = useState(GRAPH_TEMPLATES[0].name)
  const [showStatus, setShowStatus] = useState(false)
  const [query, setQuery] = useState('')
  const [hoverSensor, setHoverSensor] = useState<number | null>(null)

  const activeTemplate = GRAPH_TEMPLATES.find((t) => t.name === template) ?? GRAPH_TEMPLATES[0]
  const visibleSeries = SERIES.filter((s) => activeTemplate.sensors.includes(s.name))
  const visibleSensors = SENSORS.filter((s) => activeTemplate.sensors.includes(s.name))

  const pmOn = useProductionMonitoring()

  const activity = ACTIVITY.filter((r) =>
    query.trim() ? r.some((c) => c.toLowerCase().includes(query.trim().toLowerCase())) : true,
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* NOTE: floating scroll-spy "Sections" quick-nav is staged for follow-up. */}

      <SectionCard title="Batch Status" id="resume-status">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 2.5 }}>
          <Stat label="Status">
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'success.main', fontWeight: 500 }}>
              <CheckCircleIcon sx={{ fontSize: 16 }} /> Complete
            </Box>
          </Stat>
          <Stat label="Progress (%)" value="100" />
          <Stat label="Batch Length" value="3:00:00" />
          <Stat label="Total Batch Size" value={`${form.product.weight} kg`} />
          <Stat label="Start Time" value="15 May, 2023, 08:30:21" />
          <Stat label="End Time" value="15 May, 2023, 12:30:21" />
        </Box>
      </SectionCard>

      <SectionCard title="Batch Details" id="resume-details">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
          <KvGroup heading="Target" rows={TARGET_ROWS} />
          <KvGroup heading="Process" rows={PROCESS_ROWS} />
        </Box>
      </SectionCard>

      <SectionCard title="Machine Details" id="resume-machine">
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'primary.dark' }}>Basic information</Typography>
              <KvList rows={MACHINE_BASIC} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'primary.dark' }}>Technology</Typography>
              <KvList rows={MACHINE_TECH} />
            </Box>
          </Box>
        </Box>
      </SectionCard>

      <SectionCard
        title="Notes"
        id="resume-notes"
        action={<Button size="small" variant="outlined" startIcon={<AddIcon />}>Add note</Button>}
      >
        <Box sx={{ display: 'grid', placeItems: 'center', py: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
          There are currently no notes in this section.
        </Box>
      </SectionCard>

      <SectionCard title="Graph" id="resume-graph">
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
          <TextField select size="small" value={template} onChange={(e) => setTemplate(e.target.value)} sx={{ minWidth: 224 }}>
            {GRAPH_TEMPLATES.map((t) => <MenuItem key={t.name} value={t.name}>{t.name}</MenuItem>)}
          </TextField>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={<Checkbox size="small" checked={showStatus} onChange={(e) => setShowStatus(e.target.checked)} />}
              label={<Typography variant="caption">Show Machine Status (Range)</Typography>}
            />
            <Button size="small" variant="outlined" startIcon={<RefreshIcon fontSize="small" />}>Refresh Data</Button>
          </Box>
        </Box>

        <SensorChartV2 series={visibleSeries} pointLabels={X_LABELS} max={10} height={320} highlight={hoverSensor} />

        <Box sx={{ mt: 2.5, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
          {visibleSensors.map((s, i) => (
            <Box
              key={s.name}
              onMouseEnter={() => setHoverSensor(i)}
              onMouseLeave={() => setHoverSensor(null)}
              sx={{ borderRadius: 2, borderLeft: '4px solid', borderColor: s.color, bgcolor: (t) => withAlpha(t.palette.text.secondary, 0.06), p: 1.5, cursor: 'default' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: s.color }}>{s.name}</Typography>
                <Typography variant="caption" color="text.disabled">{s.unit}</Typography>
              </Box>
              <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
                {s.stats.map(([k, v]) => (
                  <Typography key={k} variant="caption" color="text.secondary">
                    {k} <Box component="span" sx={{ fontWeight: 600, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>{v}</Box>
                  </Typography>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </SectionCard>

      {pmOn && (
        <SectionCard title="Alarms" id="resume-alarms">
          <EventTable columns={['Batch Time', 'Acknowledge Time', 'Alarm Message']} rows={ALARMS} dot="#c12907" />
        </SectionCard>
      )}

      {pmOn && (
        <SectionCard title="Alerts" id="resume-alerts">
          <EventTable columns={['Batch Time', 'Acknowledge Time', 'Alert Message']} rows={ALERTS} dot="#f19909" />
        </SectionCard>
      )}

      {pmOn && (
        <SectionCard
          title="Action Log"
          id="resume-log"
          action={
            <TextField
              size="small" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search description…"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
            />
          }
        >
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { color: 'text.secondary', fontWeight: 500, bgcolor: 'background.default' } }}>
                  <TableCell sx={{ width: 48 }}>#</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell sx={{ width: 180 }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activity.map((r) => (
                  <TableRow key={r[0]}>
                    <TableCell sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{r[0]}</TableCell>
                    <TableCell>{r[1]}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{r[2]}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{r[3]}</TableCell>
                  </TableRow>
                ))}
                {activity.length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>No entries match “{query}”.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </SectionCard>
      )}
    </Box>
  )
}

function EventTable({ columns, rows, dot }: { columns: string[]; rows: string[][]; dot: string }) {
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ '& th': { color: 'text.secondary', fontWeight: 500, bgcolor: 'background.default' } }}>
            {columns.map((c, i) => <TableCell key={c} sx={{ width: i < 2 ? 200 : 'auto' }}>{c}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i} hover>
              <TableCell sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{r[0]}</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{r[1]}</TableCell>
              <TableCell>
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                  <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: dot, flexShrink: 0 }} />
                  {r[2]}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}
