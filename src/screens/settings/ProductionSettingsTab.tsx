import { useState } from 'react'
import MachineAvailabilitySection from './MachineAvailabilitySection'
import MachinePerformanceSection from './MachinePerformanceSection'
import { FormSection } from '../../components/FormControls'
import { MACHINES } from '../../data/mockData'
import { useMachineAvailabilityMap } from '../../lib/availability'
import { useMachinePerformanceMap } from '../../lib/performanceSettings'

type ProductionMenu = 'availability' | 'performance' | 'quality' | 'oee'

const MENUS: { key: ProductionMenu; label: string; soon?: boolean }[] = [
  { key: 'availability', label: 'Availability' },
  { key: 'performance', label: 'Performance' },
  { key: 'quality', label: 'Quality', soon: true },
  { key: 'oee', label: 'OEE', soon: true },
]

// Settings › Production — everything the plant plans per machine. Pick ONE
// machine, then configure its availability (schedule, calendar, holidays) and
// performance (targets) through the menus below. Quality and OEE join later.
export default function ProductionSettingsTab() {
  const [machine, setMachine] = useState<string | null>(null)
  const [menu, setMenu] = useState<ProductionMenu>('availability')

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
        action={machine ? <span className="text-xs text-muted">Configuring {machine}</span> : undefined}
      >
        <p className="mb-3 text-sm text-muted">
          Production is planned per machine — select one to configure its availability and performance.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {MACHINES.map((m) => {
            const on = machine === m
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMachine(m)}
                aria-pressed={on}
                className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                  on ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink hover:border-primary'
                }`}
              >
                <span className="block truncate text-sm font-semibold">{m}</span>
                <span className={`mt-0.5 block text-[0.6875rem] ${on ? 'text-white/80' : 'text-muted'}`}>
                  {isCustomized(m) ? 'Customized' : 'Plant defaults'}
                </span>
              </button>
            )
          })}
        </div>
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
