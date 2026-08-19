import { useState } from 'react'
import type { BatchForm } from '../../../shared/data/batchForm'
import SubHeader from '../../components/SubHeader'
import ResumeTab from './tabs/ResumeTab'
import ProductTab from './tabs/ProductTab'
import MachineFormTab from './tabs/MachineFormTab'
import PeriodTab from './tabs/PeriodTab'
import ResultsTab from './tabs/ResultsTab'
import RemarksTab from './tabs/RemarksTab'
import LogsTab from './tabs/LogsTab'
import ReportsTab from './tabs/ReportsTab'
import ExportMenu from '../../components/ExportMenu'
import type { Sheet } from '../../../shared/lib/exportData'
import { useLocalStorage } from '../../../shared/lib/useLocalStorage'
import { ChevronLeft, Save, Pencil, RegistryIcon } from '../../icons/Icons'
import { useProductionMonitoring } from '../../../shared/lib/productionMonitoring'
import { gatedEditorSteps } from '../../../shared/versionGate'

const EDITOR_PRINT_ID = 'batch-editor-print'

const STEPS = ['Resume', 'Product', 'Machine', 'Period', 'Results', 'Remarks', 'Details', 'Reports'] as const
type Step = (typeof STEPS)[number]

interface Props {
  initial: BatchForm
  onBack: () => void
  onSave: (form: BatchForm) => void
  // v0: only the tabs in V0_ALLOWED_EDITOR_STEPS stay enabled (see shared/versionGate).
  restricted?: boolean
}

export default function BatchEditor({ initial, onBack, onSave, restricted = false }: Props) {
  const DISABLED_STEPS: Step[] = gatedEditorSteps(STEPS, restricted)
  // Persist the whole batch form per id so Results/Remarks edits survive navigation.
  const [form, setForm] = useLocalStorage<BatchForm>(`dr-batch-form-${initial.id}`, initial)
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

  // Export reflects whatever is currently filled in the editor.
  const buildSheets = (): Sheet[] => [
    {
      name: 'Batch',
      rows: [
        ['Field', 'Value'],
        ['Batch ID', form.id],
        ['Version', form.version],
        ['Product information', form.product.details],
        ['Start', `${form.period.startDate} ${form.period.startTime}`],
        ['End', `${form.period.endDate} ${form.period.endTime}`],
        ['Machine', form.machine.name],
        ['Machine type', form.machine.machineType],
      ],
    },
    {
      name: 'Results',
      rows: [
        ['Date', 'Time', ...form.results.variables],
        ...form.results.rows.map((r) => [r.date, r.time, ...form.results.variables.map((v) => r.values[v] ?? '')]),
      ],
    },
    {
      name: 'Notes',
      rows: [['Date', 'Time', 'Comment'], ...form.remarks.notes.map((n) => [n.date, n.time, n.comment])],
    },
  ]

  return (
    <div className="mx-auto flex max-w-[75rem] flex-col gap-4 p-5">
      {/* header — back = green arrow button, title = the batch id itself */}
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
          <SubHeader Icon={RegistryIcon} title={form.id} />
        </div>
        <div className="flex items-center gap-5">
          <Meta label="Version" value={form.version} />
          <div className="flex items-center gap-2">
            {saved && <span className="text-xs font-medium text-up">Saved ✓</span>}
            <ExportMenu
              title={`Batch ${form.id}`}
              printId={EDITOR_PRINT_ID}
              filenameBase={`batch-${form.id}`}
              sheets={buildSheets}
            />
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

      <div className="pt-1" id={EDITOR_PRINT_ID}>
        {step === 'Resume' && <ResumeTab form={form} />}
        {step === 'Product' && <ProductTab
            value={form.product}
            onChange={(v) => update('product', v)}
            results={form.results}
            onResultsChange={(v) => update('results', v)}
          />}
        {step === 'Machine' && <MachineFormTab value={form.machine} onChange={(v) => update('machine', v)} />}
        {step === 'Period' && <PeriodTab value={form.period} onChange={(v) => update('period', v)} />}
        {step === 'Results' && <ResultsTab value={form.results} onChange={(v) => update('results', v)} />}
        {step === 'Remarks' && pmOn && <RemarksTab value={form.remarks} onChange={(v) => update('remarks', v)} />}
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
