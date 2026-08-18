import { useId, useState } from 'react'
import { Close, Pencil, CheckCircle } from '../../../icons/Icons'
import type { ResultsData, ResultRow } from '../../../data/batchForm'
import { RESULT_VARIABLES } from '../../../data/batchForm'
import { maskDate, maskTime } from '../../../lib/masks'
import { deltaLabel, latestValue } from '../../../lib/expected'

interface Props {
  value: ResultsData
  onChange: (v: ResultsData) => void
}

const emptyDraft = (vars: string[]): ResultRow => ({
  date: '',
  time: '',
  values: Object.fromEntries(vars.map((v) => [v, ''])),
})

export default function ResultsTab({ value, onChange }: Props) {
  const [draft, setDraft] = useState<ResultRow>(emptyDraft(value.variables))
  const [varDraft, setVarDraft] = useState('')
  const [editVar, setEditVar] = useState<string | null>(null)
  const [varRename, setVarRename] = useState('')
  const [editRow, setEditRow] = useState<number | null>(null)
  const [rowDraft, setRowDraft] = useState<ResultRow>(emptyDraft(value.variables))
  const datalistId = useId()

  const available = RESULT_VARIABLES.filter((v) => !value.variables.includes(v))

  const addVariable = (v: string) => {
    onChange({
      ...value,
      variables: [...value.variables, v],
      rows: value.rows.map((r) => ({ ...r, values: { ...r.values, [v]: '' } })),
    })
    setDraft((d) => ({ ...d, values: { ...d.values, [v]: '' } }))
  }

  // Picks a known variable or creates a brand-new one from free text.
  const commitVariable = () => {
    const v = varDraft.trim()
    if (!v) return
    if (!value.variables.some((x) => x.toLowerCase() === v.toLowerCase())) addVariable(v)
    setVarDraft('')
  }

  const removeVariable = (v: string) => {
    const { [v]: _dropped, ...expectedRest } = value.expected ?? {}
    onChange({
      ...value,
      variables: value.variables.filter((x) => x !== v),
      rows: value.rows.map((r) => {
        const rest = { ...r.values }
        delete rest[v]
        return { ...r, values: rest }
      }),
      expected: expectedRest,
    })
  }

  // Rename a variable title (e.g. "d98" → "d50") across the catalogue and every row.
  const startVarEdit = (v: string) => {
    setEditVar(v)
    setVarRename(v)
  }
  const commitVarRename = () => {
    const oldName = editVar
    setEditVar(null)
    if (oldName == null) return
    const nn = varRename.trim()
    if (!nn || nn === oldName) return
    if (value.variables.some((x) => x !== oldName && x.toLowerCase() === nn.toLowerCase())) return
    const renameKey = (vals: Record<string, string>) => {
      const { [oldName]: ov, ...rest } = vals
      return { ...rest, [nn]: ov ?? '' }
    }
    onChange({
      ...value,
      variables: value.variables.map((x) => (x === oldName ? nn : x)),
      rows: value.rows.map((r) => ({ ...r, values: renameKey(r.values) })),
      expected: oldName in (value.expected ?? {}) ? renameKey(value.expected ?? {}) : value.expected,
    })
    setDraft((d) => ({ ...d, values: renameKey(d.values) }))
  }

  const addRow = () => {
    if (!draft.date && !draft.time && Object.values(draft.values).every((x) => !x)) return
    onChange({ ...value, rows: [...value.rows, draft] })
    setDraft(emptyDraft(value.variables))
  }

  const removeRow = (i: number) => onChange({ ...value, rows: value.rows.filter((_, idx) => idx !== i) })

  const startRowEdit = (i: number) => {
    setEditRow(i)
    setRowDraft(value.rows[i])
  }
  const saveRowEdit = () => {
    if (editRow == null) return
    onChange({ ...value, rows: value.rows.map((r, idx) => (idx === editRow ? rowDraft : r)) })
    setEditRow(null)
  }

  const importSample = () => {
    const sample: ResultRow = {
      date: '19/11/2024',
      time: '12:15:00',
      values: Object.fromEntries(value.variables.map((v) => [v, (Math.round(Math.random() * 1000) / 100).toString()])),
    }
    onChange({ ...value, rows: [...value.rows, sample] })
  }

  const hasExpected = Object.keys(value.expected ?? {}).length > 0

  return (
    <section className="rounded-xl bg-card p-6 shadow-card">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-ink">Enter Test Results</h3>
      <p className="mt-1 text-sm text-muted">Select a variable and enter its test result in the table.</p>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div className="w-full max-w-sm">
          <label className="mb-1.5 block text-sm text-muted">Variable · pick one or type a new one</label>
          <div className="flex gap-2">
            <input
              list={datalistId}
              value={varDraft}
              onChange={(e) => setVarDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && commitVariable()}
              placeholder="e.g. d50 — or type to create"
              className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-primary"
            />
            <datalist id={datalistId}>
              {available.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
            <button
              onClick={commitVariable}
              disabled={!varDraft.trim()}
              className="shrink-0 rounded-lg border border-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary hover:bg-primary-soft disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
        <button
          onClick={importSample}
          className="rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-primary-700"
        >
          Import
        </button>
      </div>

      {value.variables.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {value.variables.map((v) =>
            editVar === v ? (
              <span key={v} className="flex items-center gap-1 rounded-full bg-primary-700 px-2 py-1 text-xs font-medium text-white">
                <input
                  autoFocus
                  value={varRename}
                  onChange={(e) => setVarRename(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitVarRename()
                    if (e.key === 'Escape') setEditVar(null)
                  }}
                  onBlur={commitVarRename}
                  aria-label={`Rename ${v}`}
                  className="w-20 rounded bg-white/95 px-1.5 py-0.5 text-xs text-ink outline-none"
                />
                <button onMouseDown={(e) => e.preventDefault()} onClick={commitVarRename} aria-label="Save title" className="opacity-80 hover:opacity-100">
                  <CheckCircle size={14} />
                </button>
              </span>
            ) : (
              <span key={v} className="flex items-center gap-2 rounded-full bg-primary-700 px-3 py-1.5 text-xs font-medium text-white">
                {v}
                <button onClick={() => startVarEdit(v)} aria-label={`Rename ${v}`} className="opacity-80 hover:opacity-100">
                  <Pencil size={12} />
                </button>
                <button onClick={() => removeVariable(v)} aria-label={`Remove ${v}`} className="opacity-80 hover:opacity-100">
                  <Close size={13} />
                </button>
              </span>
            )
          )}
        </div>
      )}

      <div className="mt-5 overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[40rem] text-sm">
          <thead>
            <tr className="bg-page/60 text-left text-xs text-muted">
              <th className="px-4 py-3 font-medium">DATE</th>
              <th className="px-4 py-3 font-medium">Time</th>
              {value.variables.map((v) => (
                <th key={v} className="px-4 py-3 font-medium">{v}</th>
              ))}
              <th className="w-24 px-4 py-3" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {/* Target vs latest measurement, aligned with each variable column.
                Only rendered once the batch has at least one expected value. */}
            {hasExpected && (
              <>
                <tr className="border-t border-line bg-page/60">
                  <td className="px-4 py-2 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">Expected</td>
                  <td />
                  {value.variables.map((v) => (
                    <td key={v} className="px-4 py-2 tabular-nums">{value.expected?.[v] || '—'}</td>
                  ))}
                  <td />
                </tr>
                <tr className="border-b-2 border-line bg-page/60">
                  <td className="px-4 py-2 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">Current</td>
                  <td />
                  {value.variables.map((v) => {
                    const current = latestValue(value.rows, v)
                    const diff = deltaLabel(value.expected?.[v], current)
                    return (
                      <td key={v} className="px-4 py-2 tabular-nums">
                        {current || '—'}
                        {diff && <span className="block text-[0.6875rem] text-muted">{diff}</span>}
                      </td>
                    )
                  })}
                  <td />
                </tr>
              </>
            )}

            {value.rows.map((r, i) =>
              editRow === i ? (
                <tr key={i} className="border-t border-line bg-page/30">
                  <td className="px-3 py-2">
                    <input
                      value={rowDraft.date}
                      onChange={(e) => setRowDraft({ ...rowDraft, date: maskDate(e.target.value) })}
                      placeholder="DD/MM/YYYY"
                      inputMode="numeric"
                      className="w-28 rounded-md border border-line bg-white px-2 py-1.5 text-sm outline-none focus:border-primary"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={rowDraft.time}
                      onChange={(e) => setRowDraft({ ...rowDraft, time: maskTime(e.target.value) })}
                      placeholder="00:00:00"
                      inputMode="numeric"
                      className="w-24 rounded-md border border-line bg-white px-2 py-1.5 text-sm outline-none focus:border-primary"
                    />
                  </td>
                  {value.variables.map((v) => (
                    <td key={v} className="px-3 py-2">
                      <input
                        value={rowDraft.values[v] ?? ''}
                        onChange={(e) => setRowDraft({ ...rowDraft, values: { ...rowDraft.values, [v]: e.target.value } })}
                        placeholder="0000"
                        className="w-20 rounded-md border border-line bg-white px-2 py-1.5 text-sm outline-none focus:border-primary"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={saveRowEdit} aria-label={`Save row ${i + 1}`} className="rounded-md p-1 text-up hover:bg-up/10"><CheckCircle size={16} /></button>
                      <button onClick={() => setEditRow(null)} aria-label="Cancel" className="rounded-md p-1 text-faint hover:bg-page hover:text-ink"><Close size={16} /></button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={i} className="group border-t border-line">
                  <td className="px-4 py-3 text-ink">{r.date}</td>
                  <td className="px-4 py-3 text-muted">{r.time}</td>
                  {value.variables.map((v) => (
                    <td key={v} className="px-4 py-3 text-ink tabular-nums">{r.values[v] || '—'}</td>
                  ))}
                  <td className="px-2 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => startRowEdit(i)}
                        aria-label={`Edit row ${i + 1}`}
                        className="rounded-md p-1 text-faint opacity-0 transition-opacity hover:bg-primary-soft hover:text-primary focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => removeRow(i)}
                        aria-label={`Delete row ${i + 1}`}
                        className="rounded-md p-1 text-faint opacity-0 transition-opacity hover:bg-down/10 hover:text-down focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <Close size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}

            {/* input row */}
            <tr className="border-t border-line bg-page/30">
              <td className="px-3 py-2">
                <input
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: maskDate(e.target.value) })}
                  placeholder="DD/MM/YYYY"
                  inputMode="numeric"
                  className="w-28 rounded-md border border-line bg-white px-2 py-1.5 text-sm outline-none focus:border-primary"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  value={draft.time}
                  onChange={(e) => setDraft({ ...draft, time: maskTime(e.target.value) })}
                  placeholder="00:00:00"
                  inputMode="numeric"
                  className="w-24 rounded-md border border-line bg-white px-2 py-1.5 text-sm outline-none focus:border-primary"
                />
              </td>
              {value.variables.map((v) => (
                <td key={v} className="px-3 py-2">
                  <input
                    value={draft.values[v] ?? ''}
                    onChange={(e) => setDraft({ ...draft, values: { ...draft.values, [v]: e.target.value } })}
                    placeholder="0000"
                    className="w-20 rounded-md border border-line bg-white px-2 py-1.5 text-sm outline-none focus:border-primary"
                  />
                </td>
              ))}
              <td className="px-2 py-2" />
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-3">
        <button onClick={addRow} className="rounded-lg border border-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary hover:bg-primary-soft">
          + Add row
        </button>
      </div>
    </section>
  )
}
