import { useEffect, useRef, useState } from 'react'
import MultiSelect from './MultiSelect.jsx'
import { ChevronDown } from '../icons/Icons.jsx'
import { MACHINES, RECIPES, MONTHS } from '../data/mockData.js'

export default function Filters({
  machines,
  recipes,
  setMachines,
  setRecipes,
  period,
  setPeriod,
  monthKey,
  setMonthKey,
  onClear,
}) {
  return (
    <section className="px-6 py-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink">Filter</h3>

      <div className="grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-2">
        <MultiSelect
          label="Filter by Machine"
          options={MACHINES}
          selected={machines}
          onChange={setMachines}
          placeholder="Select machines"
        />
        <MultiSelect
          label="Filter by Recipe"
          options={RECIPES}
          selected={recipes}
          onChange={setRecipes}
          placeholder="Select recipes"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            value={period}
            onChange={setPeriod}
            options={[
              { key: 'monthly', label: 'Monthly' },
              { key: 'weekly', label: 'Weekly' },
            ]}
          />
          <MonthDropdown value={monthKey} onChange={setMonthKey} />
        </div>

        <button
          onClick={onClear}
          className="rounded-md border border-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary-soft"
        >
          Clear Filters
        </button>
      </div>
    </section>
  )
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-lg bg-page p-1">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            value === o.key ? 'bg-white text-ink shadow-card' : 'text-muted hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function MonthDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = MONTHS.find((m) => m.key === value)

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium text-ink"
      >
        {current?.label}
        <ChevronDown size={16} className="text-muted" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-line bg-white py-1 shadow-pop">
          {MONTHS.map((m) => (
            <button
              key={m.key}
              onClick={() => {
                onChange(m.key)
                setOpen(false)
              }}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-page ${
                m.key === value ? 'font-semibold text-primary' : 'text-ink'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
