import { useMemo, useState } from 'react'
import MachineAvailabilitySection from './MachineAvailabilitySection'
import MachinePerformanceSection from './MachinePerformanceSection'
import { FormSection } from '../../components/FormControls'
import Dropdown from '../../components/Dropdown'
import { Search } from '../../icons/Icons'
import { MACHINE_INFO } from '../../data/mockData'
import { useMachineAvailabilityMap } from '../../lib/availability'
import { useMachinePerformanceMap } from '../../lib/performanceSettings'

type ProductionMenu = 'availability' | 'performance' | 'quality' | 'oee'

const MENUS: { key: ProductionMenu; label: string; soon?: boolean }[] = [
  { key: 'availability', label: 'Availability' },
  { key: 'performance', label: 'Performance' },
  { key: 'quality', label: 'Quality', soon: true },
  { key: 'oee', label: 'OEE', soon: true },
]

const ALL_LINES = 'All lines'
const ALL_FAMILIES = 'All families'
const LINE_OPTIONS = [ALL_LINES, ...new Set(MACHINE_INFO.map((m) => m.line))]
const FAMILY_OPTIONS = [ALL_FAMILIES, ...new Set(MACHINE_INFO.map((m) => m.family))]

// Settings › Production — everything the plant plans per machine. Filter the
// fleet (search, line, family), pick ONE machine, then configure it through
// the menus below. Quality and OEE join later.
export default function ProductionSettingsTab() {
  const [machine, setMachine] = useState<string | null>(null)
  const [menu, setMenu] = useState<ProductionMenu>('availability')

  // Fleet filters — the picker has to scale past a handful of machines.
  const [query, setQuery] = useState('')
  const [line, setLine] = useState(ALL_LINES)
  const [family, setFamily] = useState(ALL_FAMILIES)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return MACHINE_INFO.filter(
      (m) =>
        (line === ALL_LINES || m.line === line) &&
        (family === ALL_FAMILIES || m.family === family) &&
        (!q || m.name.toLowerCase().includes(q) || m.model.toLowerCase().includes(q))
    )
  }, [query, line, family])

  const filtering = query.trim() !== '' || line !== ALL_LINES || family !== ALL_FAMILIES
  const clearFilters = () => {
    setQuery('')
    setLine(ALL_LINES)
    setFamily(ALL_FAMILIES)
  }

  // "Customized" badges: which machines already own config of either kind.
  const [availMap] = useMachineAvailabilityMap()
  const [perfMap] = useMachinePerformanceMap()
  const isCustomized = (m: string) => {
    const a = availMap[m]
    return (!!a && Object.keys(a).length > 0) || !!perfMap[m]
  }

  return (
    <div className="flex flex-col gap-4">
      {/* machine filter — single selection */}
      <FormSection
        title="Machine"
        action={
          <span className="text-xs text-muted">
            {machine ? `Configuring ${machine}` : `${filtered.length} of ${MACHINE_INFO.length} machines`}
          </span>
        }
      >
        <p className="mb-3 text-sm text-muted">
          Production is planned per machine — filter the fleet and select one to configure its availability and
          performance.
        </p>

        {/* filters row */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex min-w-[14rem] flex-1 items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 transition-colors focus-within:border-primary">
            <Search size={16} className="shrink-0 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search machine or model…"
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />
          </div>
          <Dropdown value={line} options={LINE_OPTIONS} onChange={setLine} className="w-52" />
          <Dropdown value={family} options={FAMILY_OPTIONS} onChange={setFamily} className="w-44" />
          {filtering && (
            <button type="button" onClick={clearFilters} className="text-xs font-medium text-primary hover:underline">
              Clear filters
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-lg bg-page px-3 py-6 text-center text-sm text-muted">
            No machines match these filters.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => {
              const on = machine === m.name
              return (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => setMachine(m.name)}
                  aria-pressed={on}
                  className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                    on ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink hover:border-primary'
                  }`}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{m.name}</span>
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-px text-[0.5625rem] font-medium lowercase tracking-wide ${
                        on ? 'bg-white/20 text-white' : isCustomized(m.name) ? 'bg-primary/10 text-primary' : 'bg-line text-muted'
                      }`}
                    >
                      {isCustomized(m.name) ? 'customized' : 'defaults'}
                    </span>
                  </span>
                  <span className={`mt-1 block truncate text-xs ${on ? 'text-white/80' : 'text-muted'}`}>
                    {m.model} · {m.family}
                  </span>
                  <span className={`mt-0.5 block truncate text-[0.6875rem] ${on ? 'text-white/70' : 'text-faint'}`}>
                    {m.line}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </FormSection>

      {/* per-machine menus — only once a machine is picked */}
      {machine && (
        <>
          <div className="flex flex-wrap gap-1 rounded-xl bg-card p-2 shadow-card">
            {MENUS.map((m) => {
              const disabled = !!m.soon
              return (
                <button
                  key={m.key}
                  onClick={() => !disabled && setMenu(m.key)}
                  disabled={disabled}
                  aria-disabled={disabled}
                  title={disabled ? `${m.label} (coming soon)` : m.label}
                  className={`relative rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    disabled
                      ? 'cursor-not-allowed text-faint'
                      : m.key === menu
                      ? 'bg-primary text-white'
                      : 'text-muted hover:bg-page hover:text-ink'
                  }`}
                >
                  {disabled && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-line px-1.5 py-px text-[0.5625rem] font-medium lowercase tracking-wide text-muted">
                      soon
                    </span>
                  )}
                  {m.label}
                </button>
              )
            })}
          </div>

          {menu === 'availability' && <MachineAvailabilitySection machine={machine} />}
          {menu === 'performance' && <MachinePerformanceSection machine={machine} />}
        </>
      )}
    </div>
  )
}
