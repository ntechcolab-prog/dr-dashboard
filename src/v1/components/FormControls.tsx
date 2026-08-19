import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown } from '../icons/Icons'

// Section card with an uppercase label, used across the batch editor.
export function FormSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-card p-6 shadow-card">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

// FormSection's heading + content without the card chrome — for stacking
// several groups inside ONE big card (e.g. Settings › Production).
export function FormBlock({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

// Labeled wrapper around any control.
export function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm text-muted">
        {label}
      </label>
      {children}
    </div>
  )
}

const fieldBox =
  'flex w-full items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink transition-colors focus-within:border-primary'

export function TextInput({
  value,
  onChange,
  placeholder,
  suffix,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  suffix?: string
  type?: string
}) {
  return (
    <div className={fieldBox}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted"
      />
      {suffix && <span className="shrink-0 text-muted">{suffix}</span>}
    </div>
  )
}

export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-y rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-primary"
    />
  )
}

// Numeric field box (value-as-number, optional suffix and bounds).
// Numeric field UX: while the user is typing, the field shows exactly what
// they typed — including empty after clearing a value (the math treats it as
// 0). On blur it snaps back to the canonical number. Without this, clearing a
// field leaves a sticky "0" that can't be deleted.
export function useLooseNumber(value: number, apply: (n: number) => void) {
  const [text, setText] = useState<string | null>(null)
  return {
    value: text ?? String(value),
    onChange: (raw: string) => {
      setText(raw)
      if (raw === '') return apply(0)
      const n = Number(raw)
      if (Number.isFinite(n)) apply(n)
    },
    onBlur: () => setText(null),
  } as const
}

export function NumberInput({
  value,
  onChange,
  suffix,
  min,
  max,
  step,
}: {
  value: number
  onChange: (n: number) => void
  suffix?: string
  min?: number
  max?: number
  step?: number
}) {
  const loose = useLooseNumber(value, onChange)
  return (
    <div className={fieldBox}>
      <input
        type="number"
        value={loose.value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => loose.onChange(e.target.value)}
        onBlur={loose.onBlur}
        className="min-w-0 flex-1 bg-transparent tabular-nums outline-none"
      />
      {suffix && <span className="shrink-0 text-muted">{suffix}</span>}
    </div>
  )
}

// Accessible on/off switch.
export function Toggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        on ? 'bg-primary' : 'bg-line'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

// Labeled toggle row (label + helper text on the left, switch on the right).
export function ToggleRow({
  label,
  hint,
  on,
  onChange,
}: {
  label: string
  hint?: string
  on: boolean
  onChange: (on: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  )
}

// Select styled like the Figma fields (right-facing chevron).
export function SelectInput({
  value,
  options,
  onChange,
  placeholder = 'Select',
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} className={`${fieldBox} justify-between`}>
        <span className={value ? 'text-ink' : 'text-muted'}>{value || placeholder}</span>
        <ChevronDown size={16} className={`shrink-0 text-muted transition-transform ${open ? 'rotate-180' : '-rotate-90'}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-auto rounded-lg border border-line bg-white py-1 shadow-pop">
          {options.map((o) => (
            <button
              type="button"
              key={o}
              onClick={() => {
                onChange(o)
                setOpen(false)
              }}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-page ${
                o === value ? 'font-semibold text-primary' : 'text-ink'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
