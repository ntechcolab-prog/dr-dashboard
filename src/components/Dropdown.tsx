import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from '../icons/Icons'

interface DropdownProps {
  value: string
  options: string[]
  onChange: (v: string) => void
  className?: string
  placeholder?: string
}

// Simple single-select dropdown styled like the Figma filter selects.
export default function Dropdown({ value, options, onChange, className = '', placeholder }: DropdownProps) {
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
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink"
      >
        <span className={value ? 'text-ink' : 'text-muted'}>{value || placeholder}</span>
        <ChevronDown size={16} className="text-muted" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-lg border border-line bg-white py-1 shadow-pop">
          {options.map((o) => (
            <button
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
