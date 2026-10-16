'use client'

import { useEffect, useState } from 'react'
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
import CancelIcon from '@mui/icons-material/Cancel'
import PendingIcon from '@mui/icons-material/Pending'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import type { BatchForm, TargetData } from '@/src/shared/data/batchForm'
import { BATCH_STATUSES, TARGET_TYPES } from '@/src/shared/data/batchForm'
import { isLiveMode } from '@/src/shared/data/mockData'
import { getLiveBatchRecord } from '@/src/v2/live/liveBatchStore'
import { statusToDisplay } from '@/src/shared/api/adapters'
import { SectionCard, Stat, KvGroup, KvList, withAlpha } from '../ui'
import { EditableCard, useEditing } from '../cardEdit'
import SensorChartV2 from '../SensorChartV2'
import { useProductionMonitoring } from '@/src/shared/lib/productionMonitoring'

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
const WINDOW_START_MIN = 8 * 60
const WINDOW_END_MIN = WINDOW_START_MIN + (SERIES[0].data.length - 1) * 30

// Pull the "HH:MM[am|pm]" out of an event timestamp and map it to a fraction
// across the chart window (null if it can't be read or falls outside).
function eventTimeToFrac(s: string): number | null {
  const m = /(\d{1,2}):(\d{2})\s*(am|pm)?/i.exec(s)
  if (!m) return null
  let h = Number(m[1])
  const ap = m[3]?.toLowerCase()
  if (ap === 'pm' && h !== 12) h += 12
  if (ap === 'am' && h === 12) h = 0
  const t = h * 60 + Number(m[2])
  if (t < WINDOW_START_MIN || t > WINDOW_END_MIN) return null
  return (t - WINDOW_START_MIN) / (WINDOW_END_MIN - WINDOW_START_MIN)
}

// Floating quick-nav (Resume sections). pmOnly entries only in the PM edition.
const SECTIONS = [
  { id: 'resume-status', label: 'Batch Status' },
  { id: 'resume-details', label: 'Batch Details' },
  { id: 'resume-machine', label: 'Machine Details' },
  { id: 'resume-notes', label: 'Notes' },
  { id: 'resume-graph', label: 'Graph' },
  { id: 'resume-alarms', label: 'Alarms', pmOnly: true },
  { id: 'resume-alerts', label: 'Alerts', pmOnly: true },
  { id: 'resume-log', label: 'Action Log', pmOnly: true },
]

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
// [#, description, operator, event, date] — automatic events have no human
// operator, so they are logged as "System".
const ACTIVITY = [
  ['1', 'MR completed by Antoni Newton', 'A. Newton', 'Commissioning ER alarm', '11/05/2021 12:46:34'],
  ['2', 'User logged in', 'A. Newton', 'User Login', '11/05/2021 11:32:08'],
  ['3', 'User logged out', 'M. Hoffmann', 'User Logout', '09/05/2021 18:14:51'],
  ['4', 'Recipe Start: Action Start', 'M. Hoffmann', 'Manual action', '09/05/2021 09:02:10'],
  ['5', 'Recipe Start: Action Start', 'A. Costa', 'Manual action', '08/05/2021 17:48:22'],
  ['6', 'Limit value reached for fill level', 'System', 'Automatic change', '08/05/2021 16:12:03'],
  ['7', 'Batch BA-0074 created', 'J. Tanaka', 'Batch start', '05/05/2021 08:30:00'],
]

const dash = (v: unknown, unit = ''): string => (v == null || v === '' ? '—' : `${v}${unit ? ` ${unit}` : ''}`)
const fmtDateTime = (iso?: string): string =>
  iso ? new Date(iso).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
const durationStr = (a?: string, b?: string): string => {
  if (!a || !b) return '—'
  const ms = new Date(b).getTime() - new Date(a).getTime()
  if (!(ms > 0)) return '—'
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

// "2026-04-19" + "10:15" → ISO-ish local timestamp (undefined if incomplete).
const periodIso = (date: string, time: string): string | undefined =>
  date ? `${date}T${time || '00:00'}` : undefined

export default function ResumeTab({ form, onChange }: { form: BatchForm; onChange: (v: BatchForm) => void }) {
  const editStatus = useEditing('resume-status')
  const editDetails = useEditing('resume-details')
  // Live: pull the real batch record so the summary shows real values ("—" where
  // there is no backend source).
  const rec = isLiveMode() ? getLiveBatchRecord(form.id) : undefined
  const d = rec?.details
  const p = rec?.property
  // Edited values (form) win over the machine record / mock defaults.
  const statusText = form.status ?? (rec ? statusToDisplay(String(d?.status)) : 'Completed')
  const progressText = form.progress ?? (rec ? String(Math.round(d?.progress ?? 0)) : '100')
  const startIso = periodIso(form.period.startDate, form.period.startTime) ?? d?.date?.start
  const endIso = periodIso(form.period.endDate, form.period.endTime) ?? d?.date?.end
  const lengthText = durationStr(startIso, endIso)
  const startText = fmtDateTime(startIso)
  const endText = fmtDateTime(endIso)
  const target: TargetData = form.target ?? (rec
    ? { type: String(rec.target?.type ?? ''), value: String(rec.target?.value ?? ''), maxTemperature: String(d?.max_allowed_temperature ?? '') }
    : { type: TARGET_ROWS[0][1], value: TARGET_ROWS[1][1], maxTemperature: TARGET_ROWS[2][1] })
  const targetRows: string[][] = [
    ['Target Type', dash(target.type)],
    ['Target Value', dash(target.value)],
    ['Maximum Temperature Allowed (°C)', dash(target.maxTemperature)],
  ]
  // An imported (live) batch comes from the machine: only its period can be corrected.
  const imported = Boolean(rec)
  const setPeriod = (key: keyof BatchForm['period'], v: string) => onChange({ ...form, period: { ...form.period, [key]: v } })
  const setTarget = (key: keyof TargetData, v: string) => onChange({ ...form, target: { ...target, [key]: v } })
  const StatusIcon = statusText === 'Completed' ? CheckCircleIcon : statusText === 'Cancelled' ? CancelIcon : PendingIcon
  const statusColor = statusText === 'Completed' ? 'success.main' : statusText === 'Cancelled' ? 'error.main' : 'warning.main'
  const processRows: string[][] = rec
    ? [
        ['Energy', dash(p?.grinding_energy, 'kWh')],
        ['Specific Energy (kWh/kg)', dash(p?.specific_energy)],
        ['Estimated Energy Consumption (kWh)', dash(p?.est_energy_consumption)],
        ['Total Runtime', dash(p?.total_grinding_time)],
        ['Cycles', dash(d?.cycles)],
      ]
    : PROCESS_ROWS
  const machineBasic: string[][] = rec
    ? [['Manufacturer', dash(rec.machine?.brand ?? 'NETZSCH')], ['Type', dash(rec.machine?.type)]]
    : MACHINE_BASIC

  const [template, setTemplate] = useState(GRAPH_TEMPLATES[0].name)
  const [showStatus, setShowStatus] = useState(false)
  const [query, setQuery] = useState('')
  const [hoverSensor, setHoverSensor] = useState<number | null>(null)
  const [eventMarker, setEventMarker] = useState<number | null>(null)
  const [navOpen, setNavOpen] = useState(false)

  const activeTemplate = GRAPH_TEMPLATES.find((t) => t.name === template) ?? GRAPH_TEMPLATES[0]
  const visibleSeries = SERIES.filter((s) => activeTemplate.sensors.includes(s.name))
  const visibleSensors = SENSORS.filter((s) => activeTemplate.sensors.includes(s.name))

  const pmOn = useProductionMonitoring()
  const sections = SECTIONS.filter((s) => pmOn || !s.pmOnly)

  // Scroll-spy: highlight the section currently in view on the floating nav.
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActiveSection(e.target.id)
      },
      { rootMargin: '-25% 0px -65% 0px' },
    )
    for (const s of sections) {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pmOn])

  const jumpTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const activity = ACTIVITY.filter((r) =>
    query.trim() ? r.some((c) => c.toLowerCase().includes(query.trim().toLowerCase())) : true,
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Floating quick-nav — a slim handle on the right edge that slides out on
          hover/focus and highlights the section currently in view. */}
      <Box
        onMouseEnter={() => setNavOpen(true)}
        onMouseLeave={() => setNavOpen(false)}
        sx={{
          position: 'fixed',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: (t) => t.zIndex.appBar,
          display: { xs: 'none', xl: 'block' },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'stretch',
            transition: 'transform 0.3s ease-out',
            transform: navOpen ? 'translateX(0)' : 'translateX(calc(100% - 1.75rem))',
          }}
        >
          {/* Handle — always visible; clicking also toggles (touch / no-hover). */}
          <Box
            component="button"
            type="button"
            onClick={() => setNavOpen((v) => !v)}
            aria-expanded={navOpen}
            aria-label={navOpen ? 'Hide sections' : 'Show sections'}
            sx={{
              flexShrink: 0,
              width: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 1.5,
              cursor: 'pointer',
              border: '1px solid',
              borderRight: 'none',
              borderColor: 'divider',
              borderRadius: '16px 0 0 16px',
              bgcolor: 'background.paper',
              boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            }}
          >
            <Box
              component="span"
              sx={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                fontSize: '0.625rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'text.disabled',
              }}
            >
              Sections
            </Box>
          </Box>
          {/* Panel */}
          <Box
            component="nav"
            aria-label="Resume sections"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.25,
              p: 0.75,
              pr: 1.5,
              border: '1px solid',
              borderLeft: 'none',
              borderColor: 'divider',
              borderRadius: '0 16px 16px 0',
              bgcolor: 'background.paper',
              boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            }}
          >
            {sections.map((s) => {
              const active = activeSection === s.id
              return (
                <Box
                  key={s.id}
                  component="button"
                  onClick={() => {
                    jumpTo(s.id)
                    setNavOpen(false)
                  }}
                  aria-current={active ? 'true' : undefined}
                  sx={{
                    px: 1.25,
                    py: 0.75,
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: 'none',
                    borderRadius: 1.5,
                    transition: 'background-color 0.15s, color 0.15s',
                    bgcolor: active ? 'primary.main' : 'transparent',
                    color: active ? 'primary.contrastText' : 'text.secondary',
                    '&:hover': active
                      ? {}
                      : { bgcolor: 'action.hover', color: 'text.primary' },
                  }}
                >
                  {s.label}
                </Box>
              )
            })}
          </Box>
        </Box>
      </Box>

      <EditableCard cardId="resume-status" title="Batch Status" id="resume-status">
        {editStatus ? (
          <Box>
            {imported && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This batch was imported from the machine. Only its period can be corrected.
              </Typography>
            )}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 2.5 }}>
              <TextField select size="small" label="Status" value={statusText} disabled={imported} onChange={(e) => onChange({ ...form, status: e.target.value })}>
                {(BATCH_STATUSES.includes(statusText) ? BATCH_STATUSES : [statusText, ...BATCH_STATUSES]).map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </TextField>
              <TextField size="small" label="Progress (%)" value={progressText} disabled={imported} onChange={(e) => onChange({ ...form, progress: e.target.value })} />
              <TextField
                size="small" label="Total Batch Size" value={form.product.weight} disabled={imported}
                onChange={(e) => onChange({ ...form, product: { ...form.product, weight: e.target.value } })}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">kg</InputAdornment> } }}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 1 }}>
                <TextField type="date" size="small" label="Start date" value={form.period.startDate} onChange={(e) => setPeriod('startDate', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                <TextField type="time" size="small" label="Start time" value={form.period.startTime} onChange={(e) => setPeriod('startTime', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 1 }}>
                <TextField type="date" size="small" label="End date" value={form.period.endDate} onChange={(e) => setPeriod('endDate', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                <TextField type="time" size="small" label="End time" value={form.period.endTime} onChange={(e) => setPeriod('endTime', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              </Box>
              <Stat label="Batch Length" value={lengthText} />
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 2.5 }}>
            <Stat label="Status">
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: statusColor, fontWeight: 500 }}>
                <StatusIcon sx={{ fontSize: 16 }} /> {statusText}
              </Box>
            </Stat>
            <Stat label="Progress (%)" value={progressText} />
            <Stat label="Batch Length" value={lengthText} />
            <Stat label="Total Batch Size" value={dash(form.product.weight, 'kg')} />
            <Stat label="Start Time" value={startText} />
            <Stat label="End Time" value={endText} />
          </Box>
        )}
      </EditableCard>

      <EditableCard cardId="resume-details" title="Batch Details" id="resume-details" canEdit={!imported}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
          {editDetails ? (
            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'primary.dark' }}>Target</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField select size="small" label="Target Type" value={target.type} onChange={(e) => setTarget('type', e.target.value)}>
                  {(TARGET_TYPES.includes(target.type) || !target.type ? TARGET_TYPES : [target.type, ...TARGET_TYPES]).map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </TextField>
                <TextField size="small" label="Target Value" value={target.value} onChange={(e) => setTarget('value', e.target.value)} />
                <TextField
                  size="small" label="Maximum Temperature Allowed" value={target.maxTemperature} onChange={(e) => setTarget('maxTemperature', e.target.value)}
                  slotProps={{ input: { endAdornment: <InputAdornment position="end">°C</InputAdornment> } }}
                />
              </Box>
            </Box>
          ) : (
            <KvGroup heading="Target" rows={targetRows} />
          )}
          {/* Process values are measured by the machine — never edited. */}
          <KvGroup heading="Process" rows={processRows} />
        </Box>
      </EditableCard>

      <SectionCard title="Machine Details" id="resume-machine">
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'primary.dark' }}>Basic information</Typography>
              <KvList rows={machineBasic} />
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

        <SensorChartV2
          series={visibleSeries}
          pointLabels={X_LABELS}
          max={10}
          height={320}
          highlight={hoverSensor}
          band={showStatus ? [2, 7] : null}
          markerFrac={eventMarker}
        />

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
          <EventTable columns={['Batch Time', 'Acknowledge Time', 'Alarm Message']} rows={ALARMS} dot="#c12907" onHoverRow={setEventMarker} />
        </SectionCard>
      )}

      {pmOn && (
        <SectionCard title="Alerts" id="resume-alerts">
          <EventTable columns={['Batch Time', 'Acknowledge Time', 'Alert Message']} rows={ALERTS} dot="#f19909" onHoverRow={setEventMarker} />
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
                  <TableCell sx={{ width: 160 }}>Operator</TableCell>
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
                    <TableCell sx={{ color: 'text.secondary' }}>{r[3]}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{r[4]}</TableCell>
                  </TableRow>
                ))}
                {activity.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No entries match “{query}”.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </SectionCard>
      )}
    </Box>
  )
}

function EventTable({
  columns,
  rows,
  dot,
  onHoverRow,
}: {
  columns: string[]
  rows: string[][]
  dot: string
  onHoverRow?: (frac: number | null) => void
}) {
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
            <TableRow
              key={i}
              hover
              onMouseEnter={() => onHoverRow?.(eventTimeToFrac(r[0]))}
              onMouseLeave={() => onHoverRow?.(null)}
            >
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
