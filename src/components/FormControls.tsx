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
