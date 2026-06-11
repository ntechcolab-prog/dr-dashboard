import { useRef, useState } from 'react'
import { FormSection, Textarea } from '../../../components/FormControls'
import MultiSensorChart, { type ChartNote } from '../../../components/MultiSensorChart'
import { maskDate, maskTime } from '../../../lib/masks'
import type { RemarksData, NoteRow } from '../../../data/batchForm'

interface Props {
  value: RemarksData
  onChange: (v: RemarksData) => void
}

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

// Chart window: 08:00 → 13:30 in 30-minute steps (12 points).
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

export default function RemarksTab({ value, onChange }: Props) {
  const [draft, setDraft] = useState<NoteRow>({ date: '', time: '', comment: '' })
  const [hoverSensor, setHoverSensor] = useState<number | null>(null)
  const commentRef = useRef<HTMLInputElement>(null)

  const addNote = () => {
    if (!draft.comment.trim()) return
    onChange({ ...value, notes: [...value.notes, draft] })
    setDraft({ date: '', time: '', comment: '' })
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

  return (
    <div className="space-y-4">
      <FormSection title="Notes">
        <p className="-mt-3 mb-3 text-xs text-muted">
          Tip: click a point on the graph below to start a note at that time — it shows up as a numbered marker.
        </p>
        <div className="overflow-hidden rounded-lg border border-line">
          <div className="grid grid-cols-[140px_120px_1fr] bg-page/60 px-4 py-3 text-xs font-medium text-muted">
            <span>DATE</span>
            <span>TIME</span>
            <span>COMMENTS</span>
          </div>
          {value.notes.map((n, i) => (
            <div key={i} className="grid grid-cols-[140px_120px_1fr] border-t border-line px-4 py-3 text-sm">
              <span className="text-muted">{n.date}</span>
              <span className="text-muted">{n.time}</span>
              <span className="text-ink">
                {timeToFrac(n.time) != null && (
                  <span className="mr-2 inline-grid h-4 w-4 place-items-center rounded-full bg-primary align-middle text-[0.625rem] font-bold text-white">
                    {chartNotes.findIndex((c) => c.comment === n.comment && c.label.includes(n.time)) + 1 || ''}
                  </span>
                )}
                {n.comment}
              </span>
            </div>
          ))}
          <div className="grid grid-cols-[140px_120px_1fr] gap-2 border-t border-line px-3 py-2">
            <input
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: maskDate(e.target.value) })}
              placeholder="DD/MM/YYYY"
              inputMode="numeric"
              className="rounded-md border border-line px-2 py-1.5 text-sm outline-none focus:border-primary"
            />
            <input
              value={draft.time}
              onChange={(e) => setDraft({ ...draft, time: maskTime(e.target.value) })}
              placeholder="00:00:00"
              inputMode="numeric"
              className="rounded-md border border-line px-2 py-1.5 text-sm outline-none focus:border-primary"
            />
            <div className="flex gap-2">
              <input
                ref={commentRef}
                value={draft.comment}
                onChange={(e) => setDraft({ ...draft, comment: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && addNote()}
                placeholder="Write here"
                className="flex-1 rounded-md border border-line px-2 py-1.5 text-sm outline-none focus:border-primary"
              />
              <button onClick={addNote} className="rounded-md bg-primary px-3 text-xs font-semibold text-white hover:bg-primary-700">Add</button>
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Graph">
        <p className="-mt-3 mb-3 text-xs text-muted">
          Multi-sensor readings over the batch window. Hover for values · hover a note marker to read it · click to annotate.
        </p>
        <MultiSensorChart
          series={SERIES}
          pointLabels={POINT_LABELS}
          max={12}
          height={240}
          highlight={hoverSensor}
          notes={chartNotes}
          onPlotClick={noteFromChart}
        />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {SERIES.map((s, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoverSensor(i)}
              onMouseLeave={() => setHoverSensor(null)}
              className="cursor-default rounded-lg border-2 bg-white p-3 transition-shadow hover:shadow-card"
              style={{ borderColor: s.color }}
            >
              <p className="text-[0.6875rem] font-semibold uppercase tracking-wide" style={{ color: s.color }}>{s.name}</p>
              <p className="mt-1 text-xs text-muted">{SENSOR_META[i].line}</p>
              <p className="text-xs text-muted">{SENSOR_META[i].machine}</p>
            </div>
          ))}
          <button className="grid place-items-center rounded-lg border-2 border-dashed border-primary/40 p-3 text-primary hover:bg-primary-soft/40">
            <span className="text-sm font-medium">+ Add sensor</span>
          </button>
        </div>
      </FormSection>

      <FormSection title="Conclusion">
        <Textarea value={value.conclusion} onChange={(v) => onChange({ ...value, conclusion: v })} placeholder="Write the conclusion of the test here." rows={4} />
      </FormSection>
    </div>
  )
}
