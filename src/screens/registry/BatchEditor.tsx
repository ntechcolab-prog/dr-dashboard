import { useState } from 'react'
import type { BatchForm } from '../../data/batchForm'
import ProductTab from './tabs/ProductTab'
import MachineFormTab from './tabs/MachineFormTab'
import PeriodTab from './tabs/PeriodTab'
import ResultsTab from './tabs/ResultsTab'
import RemarksTab from './tabs/RemarksTab'
import LogsTab from './tabs/LogsTab'
import ReportsTab from './tabs/ReportsTab'

const STEPS = ['Product', 'Machine', 'Period', 'Results', 'Remarks', 'Logs', 'Reports'] as const
type Step = (typeof STEPS)[number]

interface Props {
  initial: BatchForm
  onBack: () => void
  onSave: (form: BatchForm) => void
}

export default function BatchEditor({ initial, onBack, onSave }: Props) {
  const [form, setForm] = useState<BatchForm>(initial)
  const [step, setStep] = useState<Step>('Product')
  const [saved, setSaved] = useState(false)

  const update = <K extends keyof BatchForm>(key: K, val: BatchForm[K]) => setForm((f) => ({ ...f, [key]: val }))

  const save = () => {
    onSave(form)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-4 p-5">
      {/* meta bar */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Registry
          </button>
          <Meta label="Batch ID" value={form.id} />
          <span className="h-8 w-px bg-line" />
          <Meta label="Version" value={form.version} />
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs font-medium text-up">Saved ✓</span>}
          <button onClick={save} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-primary-700">
            Save
          </button>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-ink">Batch Information</h1>

      {/* step tabs */}
      <div className="flex flex-wrap gap-1">
        {STEPS.map((s) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              s === step ? 'bg-primary text-white' : 'text-muted hover:bg-page hover:text-ink'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="pt-1">
        {step === 'Product' && <ProductTab value={form.product} onChange={(v) => update('product', v)} />}
        {step === 'Machine' && <MachineFormTab value={form.machine} onChange={(v) => update('machine', v)} />}
        {step === 'Period' && <PeriodTab value={form.period} onChange={(v) => update('period', v)} />}
        {step === 'Results' && <ResultsTab value={form.results} onChange={(v) => update('results', v)} />}
        {step === 'Remarks' && <RemarksTab value={form.remarks} onChange={(v) => update('remarks', v)} />}
        {step === 'Logs' && <LogsTab />}
        {step === 'Reports' && <ReportsTab value={form.reports} onChange={(v) => update('reports', v)} />}
      </div>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="text-base font-semibold text-ink">{value}</p>
    </div>
  )
}
