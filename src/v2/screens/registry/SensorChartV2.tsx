'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import { LineChart } from '@mui/x-charts/LineChart'
import { useDrawingArea, useXScale } from '@mui/x-charts/hooks'

export interface SensorSeries {
  name: string
  color: string
  data: number[]
}

// A numbered annotation pinned to a fraction (0..1) of the plot width.
export interface ChartNote {
  frac: number
  label: string // e.g. "19/06/2026 · 09:30"
  comment: string
}

// MUI X line chart for the batch sensor readings (Resume + Remarks tabs).
// curve="linear" is enforced on every series — this is manufacturing data, so
// segments must be straight, never smoothed. The core multi-series plot + legend
// + default value tooltip + per-series hover dimming is the LineChart itself; the
// advanced Tailwind extras (status band, note markers with their own tooltip,
// click-to-annotate, transient guide marker) are layered as composed SVG children
// that read the live drawing area / x-scale from the chart context.
export default function SensorChartV2({
  series,
  pointLabels,
  max,
  height = 320,
  highlight = null,
  band = null,
  notes = [],
  activeNote = null,
  markerFrac = null,
  onPlotClick,
}: {
  series: SensorSeries[]
  pointLabels: string[]
  max: number
  height?: number
  highlight?: number | null
  band?: [number, number] | null // status band between two point indexes
  notes?: ChartNote[]
  activeNote?: number | null // note emphasized from outside (e.g. table row hover)
  markerFrac?: number | null // transient vertical guide at a fraction (0..1) of the plot
  onPlotClick?: (pointIndex: number) => void // click-to-annotate
}) {
  return (
    <Box sx={{ width: '100%', cursor: onPlotClick ? 'copy' : undefined }}>
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
        onAxisClick={
          onPlotClick ? (_event, data) => data && onPlotClick(data.dataIndex) : undefined
        }
        slotProps={{ legend: { position: { vertical: 'bottom', horizontal: 'center' } } }}
      >
        <ChartExtras
          labels={pointLabels}
          band={band}
          notes={notes}
          activeNote={activeNote}
          markerFrac={markerFrac}
        />
      </LineChart>
    </Box>
  )
}

// Composed SVG overlay rendered inside the ChartsSurface. It reads the live
// drawing area + point scale so bands / markers align with the plotted data.
function ChartExtras({
  labels,
  band,
  notes,
  activeNote,
  markerFrac,
}: {
  labels: string[]
  band: [number, number] | null
  notes: ChartNote[]
  activeNote: number | null
  markerFrac: number | null
}) {
  const area = useDrawingArea()
  const xScale = useXScale<'point'>()
  const [noteHover, setNoteHover] = useState<number | null>(null)

  // A note is emphasized either by hovering its marker or from the outside
  // (e.g. hovering its row in the Notes table).
  const shownNote = noteHover != null ? noteHover : activeNote

  const top = area.top
  const h = area.height

  // Map a 0..1 fraction of the batch window onto the point-scale pixel range
  // (0 = first label, 1 = last label) so it lines up with real data points.
  const x0 = xScale(labels[0]) ?? area.left
  const xLast = xScale(labels[labels.length - 1]) ?? area.left + area.width
  const span = xLast - x0 || area.width
  const fracToX = (f: number) => x0 + f * span

  const bandX0 = band ? xScale(labels[band[0]]) ?? area.left : 0
  const bandX1 = band ? xScale(labels[band[1]]) ?? area.left : 0

  const primary = 'var(--mui-palette-primary-main)'

  return (
    <g>
      {/* status band (machine status range) */}
      {band && bandX1 > bandX0 && (
        <rect
          x={bandX0}
          y={top}
          width={bandX1 - bandX0}
          height={h}
          fill="var(--mui-palette-success-main)"
          opacity={0.1}
        />
      )}

      {/* note markers — pin + guide line */}
      {notes.map((nt, ni) => {
        const nx = fracToX(nt.frac)
        const active = shownNote === ni
        return (
          <g
            key={ni}
            onMouseEnter={() => setNoteHover(ni)}
            onMouseLeave={() => setNoteHover(null)}
            style={{ cursor: 'default' }}
          >
            <line
              x1={nx}
              x2={nx}
              y1={top + 8}
              y2={top + h}
              stroke={primary}
              strokeWidth={active ? 2 : 1}
              strokeDasharray={active ? undefined : '3 4'}
              opacity={active ? 0.9 : 0.55}
            />
            {active && <circle cx={nx} cy={top + 8} r={11} fill={primary} opacity={0.18} />}
            <circle cx={nx} cy={top + 8} r={active ? 7 : 5} fill={primary} stroke="#fff" strokeWidth={1.5} />
            <text
              x={nx}
              y={top + (active ? 11.5 : 11)}
              textAnchor="middle"
              fill="#fff"
              style={{ fontSize: active ? 8.5 : 7.5, fontWeight: 700 }}
            >
              {ni + 1}
            </text>
          </g>
        )
      })}

      {/* transient marker driven from outside (e.g. hovering a table row) */}
      {markerFrac != null && (
        <g>
          <line
            x1={fracToX(markerFrac)}
            x2={fracToX(markerFrac)}
            y1={top}
            y2={top + h}
            stroke="var(--mui-palette-text-primary)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            opacity={0.7}
          />
          <path
            d={`M ${fracToX(markerFrac) - 5} ${top} L ${fracToX(markerFrac) + 5} ${top} L ${fracToX(markerFrac)} ${top + 7} Z`}
            fill="var(--mui-palette-text-primary)"
          />
        </g>
      )}

      {/* note tooltip (HTML in a foreignObject, positioned near the marker) */}
      {shownNote != null && notes[shownNote] && (
        <NoteTooltip
          note={notes[shownNote]}
          index={shownNote}
          nx={fracToX(notes[shownNote].frac)}
          area={area}
          top={top}
        />
      )}
    </g>
  )
}

function NoteTooltip({
  note,
  index,
  nx,
  area,
  top,
}: {
  note: ChartNote
  index: number
  nx: number
  area: { left: number; width: number }
  top: number
}) {
  const tipW = 208
  const near = (nx - area.left) / area.width > 0.55
  const tx = near ? nx - tipW - 6 : nx + 6
  return (
    <foreignObject
      x={tx}
      y={top + 4}
      width={tipW}
      height={96}
      style={{ pointerEvents: 'none', overflow: 'visible' }}
    >
      <div
        style={{
          width: tipW,
          borderRadius: 8,
          border: '1px solid var(--mui-palette-divider)',
          background: 'rgba(255,255,255,0.96)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
          backdropFilter: 'blur(4px)',
          padding: '10px',
          boxSizing: 'border-box',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.6875rem', fontWeight: 600, color: 'var(--mui-palette-primary-main)' }}>
          Note {index + 1} · {note.label}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--mui-palette-text-primary)' }}>
          {note.comment || '—'}
        </p>
      </div>
    </foreignObject>
  )
}

function fade(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, 0.2)`
}
