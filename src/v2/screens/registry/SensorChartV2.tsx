'use client'

import Box from '@mui/material/Box'
import { LineChart } from '@mui/x-charts/LineChart'

export interface SensorSeries {
  name: string
  color: string
  data: number[]
}

// MUI X line chart for the batch sensor readings (Resume + Remarks tabs).
// curve="linear" is enforced on every series — this is manufacturing data, so
// segments must be straight, never smoothed. Advanced Tailwind-version extras
// (status band, note markers, click-to-annotate, per-series hover dimming) are
// staged for follow-up; the core multi-series plot + tooltip is reproduced here.
export default function SensorChartV2({
  series,
  pointLabels,
  max,
  height = 320,
  highlight = null,
}: {
  series: SensorSeries[]
  pointLabels: string[]
  max: number
  height?: number
  highlight?: number | null
}) {
  return (
    <Box sx={{ width: '100%' }}>
      <LineChart
        height={height}
        xAxis={[{ data: pointLabels, scaleType: 'point' }]}
        yAxis={[{ min: 0, max }]}
        series={series.map((s, i) => ({
          data: s.data,
          label: s.name,
          color: s.color,
          curve: 'linear',
          showMark: false,
          // dim non-highlighted series when a sensor card is hovered
          ...(highlight != null && highlight !== i ? { color: fade(s.color) } : {}),
        }))}
        margin={{ left: 8, right: 8, top: 12, bottom: 8 }}
        slotProps={{ legend: { position: { vertical: 'bottom', horizontal: 'center' } } }}
      />
    </Box>
  )
}

function fade(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, 0.2)`
}
