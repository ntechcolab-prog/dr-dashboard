import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Close } from '../../icons/Icons'
import AvailabilityChart from '../AvailabilityChart'
import type { ChartType } from '../../lib/availability'
import type { SeriesResult } from '../../data/availabilityData'

// TASK-19 — slide-over drawer opened by clicking a chart card (outside edit
// mode). Renders the same series bigger, using the SAME chart type from
// typeFor(card) so the preference reflects in both card and detail panel.

interface Props {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  series: SeriesResult
  type: ChartType
  goal: number
  /** Extra content under the chart (caption, summary). */
  footer?: ReactNode
}

export default function ChartDetailPanel({ open, onClose, title, subtitle, series, type, goal, footer }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div className={`fixed inset-0 z-40 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      {/* backdrop */}
      <div
        className={`absolute inset-0 bg-ink/30 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      {/* panel */}
      <div
        role="dialog"
        aria-label={title}
        className={`absolute right-0 top-0 flex h-full w-full max-w-[36rem] flex-col bg-card shadow-pop transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between border-b border-line px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-ink">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-page hover:text-ink"
            aria-label="Close"
          >
            <Close size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-5">
          <AvailabilityChart
            labels={series.labels}
            values={series.pct}
            planned={series.planned}
            executed={series.executed}
            type={type}
            goal={goal}
            height={340}
          />

          <div className="mt-5 grid grid-cols-3 gap-3">
            <Stat label="Planned" value={`${Math.round(series.totalPlanned)}h`} />
            <Stat label="Executed" value={`${Math.round(series.totalExecuted)}h`} />
            <Stat label="Availability" value={`${Math.round(series.overallPct)}%`} />
          </div>

          {footer && <div className="mt-4 text-sm text-muted">{footer}</div>}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-page px-3 py-2.5">
      <p className="text-[0.625rem] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-ink">{value}</p>
    </div>
  )
}
