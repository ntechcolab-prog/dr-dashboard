import { useState } from 'react'
import { Info } from '../../icons/Icons'

// TASK-22 — Period filter that replaces the old PERIODS segmented control.
// Owns a mode (Planned vs Real-Time) and a range (last day/week/30 days/custom).
// "Custom" reveals start + end date inputs. An Info tooltip explains the options.

export type AvailMode = 'planned' | 'realtime'
export type RangeKey = 'lastDay' | 'lastWeek' | 'last30' | 'custom'

export interface PeriodState {
  mode: AvailMode
  range: RangeKey
  customStart: string // ISO yyyy-mm-dd
  customEnd: string
}

export const DEFAULT_PERIOD: PeriodState = {
  mode: 'planned',
  range: 'last30',
  customStart: '',
  customEnd: '',
}

const RANGE_LABELS: Record<RangeKey, string> = {
  lastDay: 'Last day',
  lastWeek: 'Last week',
  last30: 'Last 30 days',
  custom: 'Custom',
}

const RANGES: RangeKey[] = ['lastDay', 'lastWeek', 'last30', 'custom']

interface Props {
  value: PeriodState
  onChange: (next: PeriodState) => void
}

export default function PeriodFilter({ value, onChange }: Props) {
  const [showInfo, setShowInfo] = useState(false)
  const set = (patch: Partial<PeriodState>) => onChange({ ...value, ...patch })

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* mode toggle */}
      <div className="inline-flex rounded-lg bg-page p-1">
        {(['planned', 'realtime'] as AvailMode[]).map((m) => (
          <button
            key={m}
            onClick={() => set({ mode: m })}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
              value.mode === m ? 'bg-white text-ink shadow-card' : 'text-muted hover:text-ink'
            }`}
          >
            {m === 'planned' ? 'Planned' : 'Real-Time'}
          </button>
        ))}
      </div>

      {/* range selector */}
      <div className="inline-flex rounded-lg bg-page p-1">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => set({ range: r })}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              value.range === r ? 'bg-white text-ink shadow-card' : 'text-muted hover:text-ink'
            }`}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>

      {/* custom range inputs */}
      {value.range === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value.customStart}
            max={value.customEnd || undefined}
            onChange={(e) => set({ customStart: e.target.value })}
            className="rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm text-ink outline-none focus:border-primary"
            aria-label="Start date"
          />
          <span className="text-sm text-muted">to</span>
          <input
            type="date"
            value={value.customEnd}
            min={value.customStart || undefined}
            onChange={(e) => set({ customEnd: e.target.value })}
            className="rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm text-ink outline-none focus:border-primary"
            aria-label="End date"
          />
        </div>
      )}

      {/* info tooltip */}
      <div className="relative">
        <button
          type="button"
          onMouseEnter={() => setShowInfo(true)}
          onMouseLeave={() => setShowInfo(false)}
          onFocus={() => setShowInfo(true)}
          onBlur={() => setShowInfo(false)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-page hover:text-ink"
          aria-label="About these options"
        >
          <Info size={16} />
        </button>
        {showInfo && (
          <div className="absolute right-0 top-9 z-20 w-72 rounded-lg border border-line bg-card p-3 text-[0.75rem] leading-relaxed text-muted shadow-pop">
            <p className="mb-1.5 font-semibold text-ink">Filtering options</p>
            <ul className="space-y-1">
              <li>
                <span className="font-medium text-ink">Planned</span> — compares
                planned vs executed hours (availability %).
              </li>
              <li>
                <span className="font-medium text-ink">Real-Time</span> — shows
                the live executed view as it happens.
              </li>
              <li>
                <span className="font-medium text-ink">Last day / week / 30 days</span>{' '}
                — scope the dashboard to a recent window.
              </li>
              <li>
                <span className="font-medium text-ink">Custom</span> — pick an
                exact start and end date.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// Human-readable label for the active window (used by cards & PDF title).
export function periodLabel(p: PeriodState): string {
  const mode = p.mode === 'planned' ? 'Planned' : 'Real-Time'
  if (p.range === 'custom') {
    if (p.customStart && p.customEnd) return `${mode} · ${p.customStart} → ${p.customEnd}`
    return `${mode} · Custom range`
  }
  return `${mode} · ${RANGE_LABELS[p.range]}`
}
