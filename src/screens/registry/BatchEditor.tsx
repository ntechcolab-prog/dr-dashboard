import { useState } from 'react'
import type { BatchForm } from '../../data/batchForm'
import ResumeTab from './tabs/ResumeTab'
import ProductTab from './tabs/ProductTab'
import MachineFormTab from './tabs/MachineFormTab'
import PeriodTab from './tabs/PeriodTab'
import ResultsTab from './tabs/ResultsTab'
import RemarksTab from './tabs/RemarksTab'
import LogsTab from './tabs/LogsTab'
import ReportsTab from './tabs/ReportsTab'
import { ChevronLeft, Save, Pencil } from '../../icons/Icons'

const STEPS = ['Resume', 'Product', 'Machine', 'Period', 'Results', 'Remarks', 'Details', 'Reports', 'Example'] as const
type Step = (typeof STEPS)[number]

const DISABLED_STEPS: Step[] = ['Example']

interface Props {
  initial: BatchForm
  onBack: () => void
  onSave: (form: BatchForm) => void
}

export default function BatchEditor({ initial, onBack, onSave }: Props) {
  const [form, setForm] = useState<BatchForm>(initial)
  const [step, setStep] = useState<Step>('Resume')
  const [saved, setSaved] = useState(false)

  const update = <K extends keyof BatchForm>(key: K, val: BatchForm[K]) => setForm((f) => ({ ...f, [key]: val }))

  const save = () => {
    onSave(form)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  return (
    <div className="mx-auto flex max-w-[75rem] flex-col gap-4 p-5">
      {/* meta bar */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
            <ChevronLeft size={18} />
            Registry
          </button>
          <Meta label="Batch ID" value={form.id} />
          <span className="h-8 w-px bg-line" />
          <Meta label="Version" value={form.version} />
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs font-medium text-up">Saved ✓</span>}
          <button
            onClick={save}
            className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted hover:bg-page"
            aria-label="Save"
          >
            <Save size={16} />
          </button>
          <button className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted hover:bg-page" aria-label="Edit">
            <Pencil size={16} />
          </button>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-ink">Batch Information</h1>

      {/* step tabs */}
      <div className="flex flex-wrap gap-1 pt-2">
        {STEPS.map((s) => {
          const disabled = DISABLED_STEPS.includes(s)
          return (
            <button
              key={s}
              onClick={() => !disabled && setStep(s)}
              disabled={disabled}
              aria-disabled={disabled}
              title={disabled ? `${s} (coming soon)` : s}
              className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                disabled
                  ? 'cursor-not-allowed text-faint'
                  : s === step
                  ? 'bg-primary text-white'
                  : 'text-muted hover:bg-page hover:text-ink'
              }`}
            >
              {disabled && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-line px-1.5 py-px text-[0.5625rem] font-medium lowercase tracking-wide text-muted">
                  soon
                </span>
              )}
              {s}
            </button>
          )
        })}
      </div>

      <div className="pt-1">
        {step === 'Resume' && <ResumeTab form={form} />}
        {step === 'Product' && <ProductTab value={form.product} onChange={(v) => update('product', v)} />}
        {step === 'Machine' && <MachineFormTab value={form.machine} onChange={(v) => update('machine', v)} />}
        {step === 'Period' && <PeriodTab value={form.period} onChange={(v) => update('period', v)} />}
        {step === 'Results' && <ResultsTab value={form.results} onChange={(v) => update('results', v)} />}
        {step === 'Remarks' && <RemarksTab value={form.remarks} onChange={(v) => update('remarks', v)} />}
        {step === 'Details' && <LogsTab />}
        {step === 'Reports' && <ReportsTab value={form.reports} onChange={(v) => update('reports', v)} />}
      </div>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.6875rem] uppercase tracking-wide text-muted">{label}</p>
      <p className="text-base font-semibold text-ink">{value}</p>
    </div>
  )
}
