'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Tooltip from '@mui/material/Tooltip'
import RefreshIcon from '@mui/icons-material/Refresh'
import ScienceIcon from '@mui/icons-material/ScienceOutlined'
import type { ResultsData } from '@/src/shared/data/batchForm'
import { parseNumeric } from '@/src/shared/lib/expected'
import { withAlpha } from './ui'
import SensorChartV2, { type ChartNote, type OverlaySeries } from './SensorChartV2'

// The batch "Graph" card body — one component so Resume and Remarks show the
// same chart (template picker, status range, sensor cards).

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
export const GRAPH_WINDOW_START_MIN = 8 * 60
const STEP_MIN = 30
export const GRAPH_WINDOW_END_MIN = GRAPH_WINDOW_START_MIN + (SERIES[0].data.length - 1) * STEP_MIN
export const GRAPH_X_LABELS = SERIES[0].data.map((_, i) => {
  const m = GRAPH_WINDOW_START_MIN + i * STEP_MIN
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
})

// "HH:MM[:SS]" → fraction across the chart window (null if outside/unreadable).
export function timeToFrac(time: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(time)
  if (!m) return null
  const mins = Number(m[1]) * 60 + Number(m[2])
  if (mins < GRAPH_WINDOW_START_MIN || mins > GRAPH_WINDOW_END_MIN) return null
  return (mins - GRAPH_WINDOW_START_MIN) / (GRAPH_WINDOW_END_MIN - GRAPH_WINDOW_START_MIN)
}

// Results variables get a blue ramp (light → dark in variable order, so d10 →
// d90 reads as small → large), kept apart from the warm sensor colors.
const RESULT_COLORS = ['#5aa9e6', '#2f6fd6', '#173f8f', '#0b6e99', '#4c5fd5']

function resultsOverlay(results: ResultsData): OverlaySeries[] {
  return results.variables
    .map((v, i) => ({
      name: v,
      color: RESULT_COLORS[i % RESULT_COLORS.length],
      points: results.rows.flatMap((r) => {
        const frac = timeToFrac(r.time)
        const value = parseNumeric(r.values[v])
        // Log axis: only positive values can be drawn.
        return frac == null || value == null || value <= 0 ? [] : [{ frac, value, time: r.time.slice(0, 5) }]
      }),
    }))
    .filter((o) => o.points.length > 0)
}

const GRAPH_TEMPLATES = [
  { name: 'All sensors', sensors: ['Energy', 'Product flow', 'Mill current'] },
  { name: 'Energy profile', sensors: ['Energy'] },
  { name: 'Flow & current', sensors: ['Product flow', 'Mill current'] },
  { name: 'Mill current', sensors: ['Mill current'] },
]

export default function BatchGraph({
  markerFrac = null,
  notes,
  activeNote,
  onPlotClick,
  results,
}: {
  markerFrac?: number | null
  notes?: ChartNote[]
  activeNote?: number | null
  onPlotClick?: (pointIndex: number) => void
  /** Results tab data — when given, a "Show Results" toggle overlays the samples. */
  results?: ResultsData
}) {
  const [template, setTemplate] = useState(GRAPH_TEMPLATES[0].name)
  const [showStatus, setShowStatus] = useState(false)
  const [hoverSensor, setHoverSensor] = useState<number | null>(null)
  const [showResults, setShowResults] = useState(false)

  const activeTemplate = GRAPH_TEMPLATES.find((t) => t.name === template) ?? GRAPH_TEMPLATES[0]
  const visibleSeries = SERIES.filter((s) => activeTemplate.sensors.includes(s.name))
  const visibleSensors = SENSORS.filter((s) => activeTemplate.sensors.includes(s.name))
  const overlay = results ? resultsOverlay(results) : []

  return (
    <>
      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
        <TextField select size="small" value={template} onChange={(e) => setTemplate(e.target.value)} sx={{ minWidth: 224 }}>
          {GRAPH_TEMPLATES.map((t) => <MenuItem key={t.name} value={t.name}>{t.name}</MenuItem>)}
        </TextField>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControlLabel
            control={<Checkbox size="small" checked={showStatus} onChange={(e) => setShowStatus(e.target.checked)} />}
            label={<Typography variant="caption">Show Machine Status (Range)</Typography>}
          />
          {results && (
            <Tooltip title={overlay.length ? '' : 'No samples inside the graph window yet'}>
              <span>
                <Button
                  size="small"
                  variant={showResults ? 'contained' : 'outlined'}
                  startIcon={<ScienceIcon fontSize="small" />}
                  disabled={overlay.length === 0}
                  aria-pressed={showResults}
                  onClick={() => setShowResults((v) => !v)}
                >
                  {showResults ? 'Hide Results' : 'Show Results'}
                </Button>
              </span>
            </Tooltip>
          )}
          <Button size="small" variant="outlined" startIcon={<RefreshIcon fontSize="small" />}>Refresh Data</Button>
        </Box>
      </Box>

      <SensorChartV2
        series={visibleSeries}
        pointLabels={GRAPH_X_LABELS}
        max={10}
        height={320}
        highlight={hoverSensor}
        band={showStatus ? [2, 7] : null}
        markerFrac={markerFrac}
        notes={notes}
        activeNote={activeNote}
        onPlotClick={onPlotClick}
        overlay={showResults ? overlay : []}
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
    </>
  )
}
