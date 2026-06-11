import { useState } from 'react'
import type { BatchForm } from '../../data/batchForm'
import SubHeader from '../../components/SubHeader'
import ResumeTab from './tabs/ResumeTab'
import ProductTab from './tabs/ProductTab'
import MachineFormTab from './tabs/MachineFormTab'
import PeriodTab from './tabs/PeriodTab'
import ResultsTab from './tabs/ResultsTab'
import RemarksTab from './tabs/RemarksTab'
import LogsTab from './tabs/LogsTab'
import ReportsTab from './tabs/ReportsTab'
import { useProductionMonitoring } from '../settings/MiscSettings'
import { ChevronLeft, Save, Pencil, RegistryIcon } from '../../icons/Icons'

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
  const [rawStep, setStep] = useState<Step>('Resume')
  const [saved, setSaved] = useState(false)

  // Production Monitoring edition: Remarks only exists when the flag is on.
  const pmOn = useProductionMonitoring()
  const visibleSteps = STEPS.filter((s) => pmOn || s !== 'Remarks')
  const step: Step = !pmOn && rawStep === 'Remarks' ? 'Resume' : rawStep

  const update = <K extends keyof BatchForm>(key: K, val: BatchForm[K]) => setForm((f) => ({ ...f, [key]: val }))

  const save = () => {
    onSave(form)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  return (
    <div className="mx-auto flex max-w-[75rem] flex-col gap-4 p-5">
      {/* header — same pattern as the other screens, back = green arrow button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Back to Registry"
            title="Back to Registry"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-primary transition-colors hover:border-primary hover:bg-primary-soft"
          >
            <ChevronLeft size={18} />
          </button>
          <SubHeader Icon={RegistryIcon} title="Batch Information" />
        </div>
        <div className="flex items-center gap-5">
          <Meta label="Batch ID" value={form.id} />
          <span className="h-8 w-px bg-line" />
          <Meta label="Version" value={form.version} />
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
      </div>

      {/* step tabs */}
      <div className="flex flex-wrap gap-1 pt-2">
        {visibleSteps.map((s) => {
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
        {step === 'Remarks' && pmOn && <RemarksTab value={form.remarks} onChange={(v) => update('remarks', v)} />}
        {step === 'Details' && <LogsTab />}
        {step === 'Reports' && <ReportsTab value={form.reports} onChange={(v) => update('reports', v)} />}
      </div>

      {/* floating quick-nav — fixed on screen, jumps straight to a section */}
      <nav
        aria-label="Batch sections"
        className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-0.5 rounded-xl border border-line bg-white/95 p-1.5 shadow-pop backdrop-blur-sm xl:flex"
      >
        <p className="px-2.5 pb-1 pt-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-faint">Sections</p>
        {visibleSteps.filter((s) => !DISABLED_STEPS.includes(s)).map((s) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            aria-current={s === step ? 'true' : undefined}
            className={`rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
              s === step ? 'bg-primary text-white' : 'text-muted hover:bg-page hover:text-ink'
            }`}
          >
            {s}
          </button>
        ))}
      </nav>
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
