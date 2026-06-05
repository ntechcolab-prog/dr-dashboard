import { useState } from 'react'
import { FormSection, Textarea } from '../../../components/FormControls'
import type { RemarksData, NoteRow } from '../../../data/batchForm'

interface Props {
  value: RemarksData
  onChange: (v: RemarksData) => void
}

const SENSORS = [
  { name: 'Grinding Energy', line: 'Production Line A', machine: 'Machine ABC', color: '#e0489b' },
  { name: 'Grinding Energy', line: 'Production Line A', machine: 'Machine ABC', color: '#3a86d6' },
  { name: 'Grinding Energy', line: 'Production Line A', machine: 'Machine ABC', color: '#f19909' },
]

// Deterministic multi-series sample for the graph.
const SERIES = [
  { color: '#f19909', data: [3, 5, 7, 8, 9, 10, 9, 8, 9, 10, 8, 6] },
  { color: '#9b7fd4', data: [4, 6, 5, 7, 6, 5, 6, 7, 6, 5, 4, 4] },
  { color: '#e0489b', data: [3, 3, 4, 4, 3, 4, 5, 4, 4, 3, 4, 3] },
  { color: '#2ea36b', data: [2, 3, 2, 3, 4, 3, 2, 3, 4, 3, 2, 3] },
]
const X = ['08:00', '', '09:00', '', '10:00', '', '11:00', '', '12:00', '', '13:00', '']

export default function RemarksTab({ value, onChange }: Props) {
  const [draft, setDraft] = useState<NoteRow>({ date: '', time: '', comment: '' })

  const addNote = () => {
    if (!draft.comment.trim()) return
    onChange({ ...value, notes: [...value.notes, draft] })
    setDraft({ date: '', time: '', comment: '' })
  }

  return (
    <div className="space-y-4">
      <FormSection title="Notes">
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
              <span className="text-ink">{n.comment}</span>
            </div>
          ))}
          <div className="grid grid-cols-[140px_120px_1fr] gap-2 border-t border-line px-3 py-2">
            <input value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} placeholder="DD/MM/YYYY" className="rounded-md border border-line px-2 py-1.5 text-sm outline-none focus:border-primary" />
            <input value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} placeholder="00:00:00" className="rounded-md border border-line px-2 py-1.5 text-sm outline-none focus:border-primary" />
            <div className="flex gap-2">
              <input value={draft.comment} onChange={(e) => setDraft({ ...draft, comment: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addNote()} placeholder="Write here" className="flex-1 rounded-md border border-line px-2 py-1.5 text-sm outline-none focus:border-primary" />
              <button onClick={addNote} className="rounded-md bg-primary px-3 text-xs font-semibold text-white hover:bg-primary-700">Add</button>
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Graph">
        <p className="-mt-3 mb-3 text-xs text-muted">Multi-sensor readings over the batch window.</p>
        <MultiLine />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SENSORS.map((s, i) => (
            <div key={i} className="rounded-lg border-2 bg-white p-3" style={{ borderColor: s.color }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: s.color }}>{s.name}</p>
              <p className="mt-1 text-xs text-muted">{s.line}</p>
              <p className="text-xs text-muted">{s.machine}</p>
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

function MultiLine() {
  const W = 760
  const H = 240
  const padL = 30
  const padR = 12
  const padT = 12
  const padB = 26
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  const max = 12
  const n = SERIES[0].data.length
  const x = (i: number) => padL + (i / (n - 1)) * plotW
  const y = (v: number) => padT + plotH - (v / max) * plotH

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i} x1={padL} x2={W - padR} y1={padT + plotH * t} y2={padT + plotH * t} stroke="var(--color-line)" strokeWidth={1} strokeDasharray={i === 4 ? undefined : '2 5'} />
      ))}
      {SERIES.map((s, si) => (
        <polyline
          key={si}
          points={s.data.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
          fill="none"
          stroke={s.color}
          strokeWidth={2}
          strokeLinejoin="round"
          pathLength={1}
          className="chart-line"
          style={{ animationDelay: `${si * 90}ms` }}
        />
      ))}
      {X.map((lab, i) =>
        lab ? (
          <text key={i} x={x(i)} y={H - 10} textAnchor="middle" className="fill-muted" style={{ fontSize: 9 }}>{lab}</text>
        ) : null
      )}
    </svg>
  )
}
