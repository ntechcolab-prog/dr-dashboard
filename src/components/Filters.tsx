import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import MultiSelect from './MultiSelect'
import { ChevronDown } from '../icons/Icons'
import { MACHINES, RECIPES, MONTHS } from '../data/mockData'
import { buildWeeks, weekLabel } from '../lib/weeks'

export type Period = 'monthly' | 'weekly'

interface FiltersProps {
  machines: string[]
  recipes: string[]
  setMachines: (next: string[]) => void
  setRecipes: (next: string[]) => void
  period: Period
  setPeriod: (p: Period) => void
  monthKey: string
  setMonthKey: (key: string) => void
  year: number
  month: number
  weekIdx: number
  setWeekIdx: (i: number) => void
  onClear: () => void
  actions?: ReactNode // header-right actions (export, generate analysis)
}

export default function Filters({
  machines,
  recipes,
  setMachines,
  setRecipes,
  period,
  setPeriod,
  monthKey,
  setMonthKey,
  year,
  month,
  weekIdx,
  setWeekIdx,
  onClear,
  actions,
}: FiltersProps) {
  return (
    <section className="px-6 py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">Filter</h3>
        {actions && <div className="no-print flex items-center gap-2">{actions}</div>}
      </div>

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
          {period === 'weekly' ? (
            <WeekDropdown year={year} month={month} value={weekIdx} onChange={setWeekIdx} />
          ) : (
            <MonthDropdown value={monthKey} onChange={setMonthKey} />
          )}
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

interface SegmentedProps {
  value: Period
  onChange: (p: Period) => void
  options: { key: Period; label: string }[]
}

function Segmented({ value, onChange, options }: SegmentedProps) {
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

function useOutsideClose(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [onClose])
  return ref
}

function MonthDropdown({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useOutsideClose(() => setOpen(false))
  const current = MONTHS.find((m) => m.key === value)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium text-ink"
      >
        <span className="text-muted">Month:</span> {current?.label}
        <ChevronDown size={16} className="text-muted" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-lg border border-line bg-white py-1 shadow-pop">
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

function WeekDropdown({
  year,
  month,
  value,
  onChange,
}: {
  year: number
  month: number
  value: number
  onChange: (i: number) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useOutsideClose(() => setOpen(false))
  const weeks = buildWeeks(year, month)
  const safe = Math.min(value, weeks.length - 1)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium text-ink"
      >
        <span className="text-muted">Week:</span> {weekLabel(year, month, weeks[safe])}
        <ChevronDown size={16} className="text-muted" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-lg border border-line bg-white py-1 shadow-pop">
          {weeks.map((w, i) => (
            <button
              key={i}
              onClick={() => {
                onChange(i)
                setOpen(false)
              }}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-page ${
                i === safe ? 'font-semibold text-primary' : 'text-ink'
              }`}
            >
              Week {i + 1} · {weekLabel(year, month, w)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
