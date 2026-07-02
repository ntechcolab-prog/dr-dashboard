'use client'

import { useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Tooltip from '@mui/material/Tooltip'
import EditIcon from '@mui/icons-material/EditOutlined'
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import CheckIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import CloseIcon from '@mui/icons-material/Close'
import type { RemarksData, NoteRow } from '@/src/data/batchForm'
import { maskDate, maskTime } from '@/src/lib/masks'
import { SectionCard, withAlpha } from '../ui'
import SensorChartV2, { type ChartNote } from '../SensorChartV2'

// Deterministic multi-series sample for the graph (cards mirror the lines).
const SERIES = [
  { name: 'Energy', color: '#f19909', data: [3, 5, 7, 8, 9, 10, 9, 8, 9, 10, 8, 6] },
  { name: 'Product flow', color: '#9b7fd4', data: [4, 6, 5, 7, 6, 5, 6, 7, 6, 5, 4, 4] },
  { name: 'Mill current', color: '#e0489b', data: [3, 3, 4, 4, 3, 4, 5, 4, 4, 3, 4, 3] },
  { name: 'Product temp.', color: '#2ea36b', data: [2, 3, 2, 3, 4, 3, 2, 3, 4, 3, 2, 3] },
]
const SENSOR_META = [
  { line: 'Production Line A', machine: 'Machine ABC' },
  { line: 'Production Line A', machine: 'Machine ABC' },
  { line: 'Production Line B', machine: 'Machine ABC' },
  { line: 'Production Line B', machine: 'Machine ABC' },
]
const WINDOW_START_MIN = 8 * 60
const STEP_MIN = 30
const N_POINTS = SERIES[0].data.length
const WINDOW_END_MIN = WINDOW_START_MIN + (N_POINTS - 1) * STEP_MIN
const minutesToLabel = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const POINT_LABELS = Array.from({ length: N_POINTS }, (_, i) => minutesToLabel(WINDOW_START_MIN + i * STEP_MIN))

// "HH:MM[:SS]" → fraction across the chart window (null if outside/unreadable).
function timeToFrac(time: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(time)
  if (!m) return null
  const mins = Number(m[1]) * 60 + Number(m[2])
  if (mins < WINDOW_START_MIN || mins > WINDOW_END_MIN) return null
  return (mins - WINDOW_START_MIN) / (WINDOW_END_MIN - WINDOW_START_MIN)
}

const todayMasked = () => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

export default function RemarksTab({ value, onChange }: { value: RemarksData; onChange: (v: RemarksData) => void }) {
  const [draft, setDraft] = useState<NoteRow>({ date: '', time: '', comment: '' })
  const [hoverSensor, setHoverSensor] = useState<number | null>(null)
  const [hoverNote, setHoverNote] = useState<number | null>(null)
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<NoteRow>({ date: '', time: '', comment: '' })
  const commentRef = useRef<HTMLInputElement>(null)

  const addNote = () => {
    if (!draft.comment.trim()) return
    onChange({ ...value, notes: [...value.notes, draft] })
    setDraft({ date: '', time: '', comment: '' })
  }
  const startEdit = (i: number) => { setEditIdx(i); setEditDraft(value.notes[i]) }
  const saveEdit = () => {
    if (editIdx == null || !editDraft.comment.trim()) return
    onChange({ ...value, notes: value.notes.map((n, idx) => (idx === editIdx ? editDraft : n)) })
    setEditIdx(null)
  }
  const deleteNote = (i: number) => {
    onChange({ ...value, notes: value.notes.filter((_, idx) => idx !== i) })
    if (editIdx === i) setEditIdx(null)
  }

  // Clicking the chart starts a note at that time — fill the comment and Add.
  const noteFromChart = (pointIdx: number) => {
    setDraft((d) => ({
      ...d,
      date: d.date || todayMasked(),
      time: `${POINT_LABELS[pointIdx]}:00`,
    }))
    commentRef.current?.focus()
  }

  // Notes that fall inside the chart window appear as numbered markers.
  const chartNotes: ChartNote[] = value.notes
    .map((n) => {
      const frac = timeToFrac(n.time)
      return frac == null ? null : { frac, label: [n.date, n.time].filter(Boolean).join(' · '), comment: n.comment }
    })
    .filter((n): n is ChartNote => n !== null)

  // Index of a table note within chartNotes (for badge numbering + hover link).
  const chartNoteIndex = (n: NoteRow) =>
    chartNotes.findIndex((c) => c.comment === n.comment && c.label.includes(n.time))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <SectionCard title="Notes">
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          Tip: click a point on the graph below to start a note at that time — it shows up as a numbered marker.
        </Typography>
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { color: 'text.secondary', fontWeight: 500, bgcolor: 'background.default' } }}>
                <TableCell sx={{ width: 150 }}>DATE</TableCell>
                <TableCell sx={{ width: 130 }}>TIME</TableCell>
                <TableCell>COMMENTS</TableCell>
                <TableCell align="right">ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {value.notes.map((n, i) =>
                editIdx === i ? (
                  <TableRow key={i} sx={{ bgcolor: 'background.default' }}>
                    <TableCell><TextField size="small" value={editDraft.date} onChange={(e) => setEditDraft({ ...editDraft, date: maskDate(e.target.value) })} placeholder="DD/MM/YYYY" /></TableCell>
                    <TableCell><TextField size="small" value={editDraft.time} onChange={(e) => setEditDraft({ ...editDraft, time: maskTime(e.target.value) })} placeholder="00:00:00" /></TableCell>
                    <TableCell><TextField size="small" fullWidth value={editDraft.comment} onChange={(e) => setEditDraft({ ...editDraft, comment: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && saveEdit()} placeholder="Write here" /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="success" onClick={saveEdit} aria-label="Save note"><CheckIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => setEditIdx(null)} aria-label="Cancel"><CloseIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow
                    key={i}
                    hover
                    onMouseEnter={() => {
                      const idx = chartNoteIndex(n)
                      if (idx >= 0) setHoverNote(idx)
                    }}
                    onMouseLeave={() => setHoverNote(null)}
                  >
                    <TableCell sx={{ color: 'text.secondary' }}>{n.date}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{n.time}</TableCell>
                    <TableCell>
                      {chartNoteIndex(n) >= 0 && (
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-grid',
                            placeItems: 'center',
                            width: 16,
                            height: 16,
                            mr: 1,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            verticalAlign: 'middle',
                          }}
                        >
                          {chartNoteIndex(n) + 1}
                        </Box>
                      )}
                      {n.comment}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => startEdit(i)} aria-label={`Edit note ${i + 1}`}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => deleteNote(i)} aria-label={`Delete note ${i + 1}`}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                )
              )}
              <TableRow>
                <TableCell><TextField size="small" value={draft.date} onChange={(e) => setDraft({ ...draft, date: maskDate(e.target.value) })} placeholder="DD/MM/YYYY" /></TableCell>
                <TableCell><TextField size="small" value={draft.time} onChange={(e) => setDraft({ ...draft, time: maskTime(e.target.value) })} placeholder="00:00:00" /></TableCell>
                <TableCell><TextField size="small" fullWidth inputRef={commentRef} value={draft.comment} onChange={(e) => setDraft({ ...draft, comment: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addNote()} placeholder="Write here" /></TableCell>
                <TableCell align="right"><Button variant="contained" size="small" onClick={addNote}>Add</Button></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </SectionCard>

      <SectionCard title="Graph">
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          Multi-sensor readings over the batch window. Hover for values · hover a note marker to read it · click to annotate.
        </Typography>
        <SensorChartV2
          series={SERIES}
          pointLabels={POINT_LABELS}
          max={12}
          height={320}
          highlight={hoverSensor}
          notes={chartNotes}
          activeNote={hoverNote}
          onPlotClick={noteFromChart}
        />
        <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(5, 1fr)' }, gap: 1.5 }}>
          {SERIES.map((s, i) => (
            <Box
              key={i}
              onMouseEnter={() => setHoverSensor(i)}
              onMouseLeave={() => setHoverSensor(null)}
              sx={{ borderRadius: 2, border: '2px solid', borderColor: s.color, bgcolor: 'background.paper', p: 1.5, cursor: 'default' }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: s.color }}>{s.name}</Typography>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>{SENSOR_META[i].line}</Typography>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>{SENSOR_META[i].machine}</Typography>
            </Box>
          ))}
          <Button
            variant="outlined"
            sx={{ borderStyle: 'dashed', borderColor: (t) => withAlpha(t.palette.primary.main, 0.4) }}
          >
            + Add sensor
          </Button>
        </Box>
      </SectionCard>

      <SectionCard title="Conclusion">
        <TextField
          fullWidth multiline minRows={4}
          value={value.conclusion}
          onChange={(e) => onChange({ ...value, conclusion: e.target.value })}
          placeholder="Write the conclusion of the test here."
        />
      </SectionCard>
    </Box>
  )
}
