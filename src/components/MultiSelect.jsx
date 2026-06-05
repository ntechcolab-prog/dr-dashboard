import { useEffect, useRef, useState } from 'react'
import { Search, Close, ChevronDown } from '../icons/Icons.jsx'

// A filter field that shows selected values as removable chips and opens a
// searchable list of the remaining options.
export default function MultiSelect({ label, options, selected, onChange, placeholder }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const toggle = (opt) =>
    onChange(selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt])

  const remove = (opt) => onChange(selected.filter((o) => o !== opt))

  const available = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="relative min-w-0" ref={ref}>
      <label className="mb-1 block text-xs font-medium text-primary">{label}</label>

      <div
        className="flex min-h-[40px] cursor-text flex-wrap items-center gap-1.5 border-b border-faint pb-1.5 pr-7"
        onClick={() => setOpen(true)}
      >
        {selected.map((opt) => (
          <span
            key={opt}
            className="flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary-700"
          >
            {opt}
            <button
              onClick={(e) => {
                e.stopPropagation()
                remove(opt)
              }}
              className="grid h-4 w-4 place-items-center rounded-full text-primary-700/70 hover:bg-primary/20"
              aria-label={`Remove ${opt}`}
            >
              <Close size={12} />
            </button>
          </span>
        ))}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={selected.length ? '' : placeholder}
          className="min-w-[60px] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted"
        />
        <button
          onClick={(e) => {
            e.stopPropagation()
            setOpen((v) => !v)
          }}
          className="absolute bottom-1.5 right-0 text-muted"
          aria-label="Open options"
        >
          <Search size={18} />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-lg border border-line bg-white py-1 shadow-pop">
          {available.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted">No matches</p>
          )}
          {available.map((opt) => {
            const checked = selected.includes(opt)
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-page"
              >
                <span
                  className={`grid h-4 w-4 place-items-center rounded border ${
                    checked ? 'border-primary bg-primary text-white' : 'border-faint'
                  }`}
                >
                  {checked && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                {opt}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
