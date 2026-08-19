import { useId, useState } from 'react'
import { FormSection, Textarea } from '../../../components/FormControls'
import { Close } from '../../../icons/Icons'
import type { ProductData, ResultsData } from '../../../../shared/data/batchForm'
import { RESULT_VARIABLES } from '../../../../shared/data/batchForm'

interface Props {
  value: ProductData
  onChange: (v: ProductData) => void
  /** The Results dataset — the expected values live next to the variables they
   *  belong to, so the Results table can show target and measurement together. */
  results: ResultsData
  onResultsChange: (v: ResultsData) => void
}

export default function ProductTab({ value, onChange, results, onResultsChange }: Props) {
  const set = <K extends keyof ProductData>(key: K, v: ProductData[K]) => onChange({ ...value, [key]: v })

  const expected = results.expected ?? {}
  const entries = Object.entries(expected)
  const [varDraft, setVarDraft] = useState('')
  const [valDraft, setValDraft] = useState('')
  const datalistId = useId()

  const available = RESULT_VARIABLES.filter((v) => !(v in expected))

  // Adding a target also creates the variable on the Results tab (if it is not
  // there yet), so the column the operator will type into already exists.
  const addExpected = () => {
    const typed = varDraft.trim()
    if (!typed) return
    const name = results.variables.find((x) => x.toLowerCase() === typed.toLowerCase()) ?? typed
    const isNew = !results.variables.includes(name)
    onResultsChange({
      ...results,
      variables: isNew ? [...results.variables, name] : results.variables,
      rows: isNew ? results.rows.map((r) => ({ ...r, values: { ...r.values, [name]: '' } })) : results.rows,
      expected: { ...expected, [name]: valDraft.trim() },
    })
    setVarDraft('')
    setValDraft('')
  }

  const setExpected = (v: string, val: string) =>
    onResultsChange({ ...results, expected: { ...expected, [v]: val } })

  // Removing a target drops the Results column too — but only while nothing has
  // been measured for it, so a delete here can never destroy recorded data.
  const removeExpected = (v: string) => {
    const { [v]: _dropped, ...rest } = expected
    const measured = results.rows.some((r) => (r.values[v] ?? '') !== '')
    onResultsChange({
      ...results,
      expected: rest,
      variables: measured ? results.variables : results.variables.filter((x) => x !== v),
      rows: measured
        ? results.rows
        : results.rows.map((r) => {
            const { [v]: _drop, ...values } = r.values
            return { ...r, values }
          }),
    })
  }

  const inputCls =
    'w-full rounded-lg border border-line bg-white px-3.5 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-primary'

  return (
    <div className="space-y-4">
      <FormSection title="Information">
        <Textarea value={value.details} onChange={(v) => set('details', v)} placeholder="Write product information here" rows={4} />
      </FormSection>

      <FormSection title="Expected Results">
        <p className="text-sm text-muted">
          Set the value each variable is expected to reach. Variables added here become columns on the Results
          tab, where the target is shown next to what was measured.
        </p>

        <div className="mt-4 overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[26rem] text-sm">
            <thead>
              <tr className="bg-page/60 text-left text-xs text-muted">
                <th className="w-64 px-4 py-3 font-medium">Variable</th>
                <th className="px-4 py-3 font-medium">Expected value</th>
                <th className="w-16 px-4 py-3" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {entries.map(([v, val]) => (
                <tr key={v} className="border-t border-line">
                  <td className="px-4 py-2 font-medium text-ink">{v}</td>
                  <td className="px-3 py-2">
                    <input
                      value={val}
                      onChange={(e) => setExpected(v, e.target.value)}
                      placeholder="0000"
                      aria-label={`Expected value for ${v}`}
                      className={`${inputCls} max-w-[8rem]`}
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => removeExpected(v)}
                      aria-label={`Remove ${v}`}
                      className="text-muted hover:text-down"
                    >
                      <Close size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {entries.length === 0 && (
                <tr className="border-t border-line">
                  <td colSpan={3} className="px-4 py-4 text-sm text-muted">
                    No expected values yet.
                  </td>
                </tr>
              )}

              {/* input row */}
              <tr className="border-t border-line bg-page/30">
                <td className="px-3 py-2">
                  <input
                    list={datalistId}
                    value={varDraft}
                    onChange={(e) => setVarDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addExpected()}
                    placeholder="e.g. d50 or a new one"
                    aria-label="Variable"
                    className={inputCls}
                  />
                  <datalist id={datalistId}>
                    {available.map((v) => (
                      <option key={v} value={v} />
                    ))}
                  </datalist>
                </td>
                <td className="px-3 py-2">
                  <input
                    value={valDraft}
                    onChange={(e) => setValDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addExpected()}
                    placeholder="0000"
                    aria-label="Expected value"
                    className={`${inputCls} max-w-[8rem]`}
                  />
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>

        <button
          onClick={addExpected}
          disabled={!varDraft.trim()}
          className="mt-4 rounded-lg border border-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary hover:bg-primary-soft disabled:opacity-50"
        >
          + Add expected value
        </button>
      </FormSection>

      <FormSection title="Attachments">
        <div className="grid place-items-center rounded-lg border-2 border-dashed border-primary/40 bg-primary-soft/40 py-10 text-primary">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5" />
            <polyline points="6 11 12 5 18 11" />
          </svg>
          <p className="mt-2 text-sm">Drag files here or click to upload</p>
        </div>
      </FormSection>
    </div>
  )
}
