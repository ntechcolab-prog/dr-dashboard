import { useState } from 'react'
import { FormBlock, FormSection } from '../../components/FormControls'
import { Copy, CheckCircle } from '../../icons/Icons'

// Copy configuration between machines (Settings › Production).
//
// One panel, two directions:
//   · "Apply to machines"  — push the current machine's setup onto others
//     (multi-select, the fast way to roll one plan out to the fleet).
//   · "Import from"        — pull another machine's setup onto this one
//     (single-select, the fast way to start a new machine from a good one).
// What gets copied is controlled by scope chips (working schedule, calendar…),
// so a partial copy — e.g. only the planning calendar — is one click away.

export interface ReplicateScope {
  key: string
  label: string
}

interface Props {
  machine: string
  machines: string[]
  scopes: ReplicateScope[]
  /** badge machines that already have their own config */
  isCustomized?: (machine: string) => boolean
  onApply: (direction: 'to' | 'from', otherMachines: string[], scopeKeys: string[]) => void
  /** render without the card chrome (for use inside a bigger card) */
  plain?: boolean
}

export default function ReplicatePanel({ machine, machines, scopes, isCustomized, onApply, plain }: Props) {
  const others = machines.filter((m) => m !== machine)
  const [direction, setDirection] = useState<'to' | 'from'>('to')
  const [selected, setSelected] = useState<string[]>([])
  const [scopeKeys, setScopeKeys] = useState<string[]>(scopes.map((s) => s.key))
  const [done, setDone] = useState<string | null>(null)

  const toggleMachine = (m: string) => {
    setDone(null)
    if (direction === 'from') {
      setSelected((prev) => (prev[0] === m ? [] : [m]))
    } else {
      setSelected((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))
    }
  }

  const toggleScope = (key: string) => {
    setDone(null)
    setScopeKeys((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]))
  }

  const switchDirection = (dir: 'to' | 'from') => {
    setDirection(dir)
    setSelected([])
    setDone(null)
  }

  const allSelected = selected.length === others.length
  const canApply = selected.length > 0 && scopeKeys.length > 0

  const apply = () => {
    onApply(direction, selected, scopeKeys)
    setDone(
      direction === 'to'
        ? `Applied ${machine}’s configuration to ${selected.length === 1 ? selected[0] : `${selected.length} machines`}.`
        : `Imported ${selected[0]}’s configuration into ${machine}.`
    )
    setSelected([])
  }

  const Wrapper = plain ? FormBlock : FormSection
  return (
    <Wrapper
      title="Copy configuration"
      action={
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <Copy size={14} />
          {machine}
        </span>
      }
    >
      {/* direction */}
      <div className="mb-4 inline-flex rounded-lg bg-page p-1">
        {([
          ['to', 'Apply to machines'],
          ['from', 'Import from'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => switchDirection(key)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              direction === key ? 'bg-white text-primary shadow-card' : 'text-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm text-muted">
        {direction === 'to'
          ? `Push ${machine}’s setup onto other machines — pick which parts and who gets them.`
          : `Pull another machine’s setup onto ${machine} — pick the source and which parts to bring over.`}
      </p>

      {/* what gets copied */}
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">What to copy</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {scopes.map((s) => {
          const on = scopeKeys.includes(s.key)
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggleScope(s.key)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                on ? 'border-primary bg-primary/10 text-primary' : 'border-line text-muted hover:border-primary hover:text-primary'
              }`}
            >
              {on && <CheckCircle size={14} />}
              {s.label}
            </button>
          )
        })}
      </div>

      {/* which machines */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {direction === 'to' ? 'Apply to' : 'Import from'}
        </p>
        {direction === 'to' && others.length > 1 && (
          <button
            type="button"
            onClick={() => {
              setDone(null)
              setSelected(allSelected ? [] : [...others])
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            {allSelected ? 'Clear all' : 'Select all'}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {others.map((m) => {
          const on = selected.includes(m)
          const custom = isCustomized?.(m)
          return (
            <button
              key={m}
              type="button"
              onClick={() => toggleMachine(m)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                on ? 'border-primary bg-primary text-white' : 'border-line text-ink hover:border-primary'
              }`}
            >
              {m}
              {custom && (
                <span
                  className={`rounded-full px-1.5 py-px text-[0.5625rem] font-medium lowercase tracking-wide ${
                    on ? 'bg-white/20 text-white' : 'bg-line text-muted'
                  }`}
                >
                  customized
                </span>
              )}
            </button>
          )
        })}
      </div>

      {direction === 'to' && selected.length > 0 && (
        <p className="mt-3 text-xs text-warning">
          This overwrites the selected parts on {selected.length === 1 ? selected[0] : `${selected.length} machines`} — their
          current values are replaced.
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={apply}
          disabled={!canApply}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {direction === 'to'
            ? selected.length > 0
              ? `Apply to ${selected.length} machine${selected.length === 1 ? '' : 's'}`
              : 'Apply'
            : selected.length > 0
            ? `Import from ${selected[0]}`
            : 'Import'}
        </button>
        {done && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-up">
            <CheckCircle size={15} />
            {done}
          </span>
        )}
      </div>
    </Wrapper>
  )
}
