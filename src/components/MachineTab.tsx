import { useState } from 'react'
import Dropdown from './Dropdown'
import ComingSoon from './ComingSoon'
import AvailabilityDashboard from './availability/AvailabilityDashboard'
import PeriodFilter, { DEFAULT_PERIOD, periodLabel, type PeriodState } from './availability/PeriodFilter'
import { FilePdf, AnalysisIcon } from '../icons/Icons'
import { printElement } from '../lib/exportPdf'
import { PRODUCTION_LINES, MACHINE_NAMES } from '../data/appData'

const MACHINE_PRINT_ID = 'machine-availability-print'

interface Props {
  onNavigate?: (key: string) => void
}

type View = 'availability' | 'oee'

export default function MachineTab({ onNavigate }: Props) {
  const [line, setLine] = useState(PRODUCTION_LINES[0])
  const [machine, setMachine] = useState(MACHINE_NAMES[0])
  const [view, setView] = useState<View>('availability')
  const [period, setPeriod] = useState<PeriodState>(DEFAULT_PERIOD)

  const exportPdf = () =>
    printElement(MACHINE_PRINT_ID, `Machine · ${machine} · ${line} · ${periodLabel(period)}`)

  return (
    <div className="px-6 py-5">
      {/* line + machine scope (always visible) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Dropdown value={line} options={PRODUCTION_LINES} onChange={setLine} className="w-52" />
          <Dropdown value={machine} options={MACHINE_NAMES} onChange={setMachine} className="w-44" />
        </div>
        <div className="no-print flex items-center gap-2">
          <button
            onClick={exportPdf}
            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            <FilePdf size={16} />
            Export PDF
          </button>
          <button
            onClick={() => onNavigate?.('analysis')}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            <AnalysisIcon size={16} />
            Generate Analysis
          </button>
        </div>
      </div>

      {/* Availability | OEE segmented control (TASK-13) */}
      <div className="no-print mb-4 inline-flex rounded-lg bg-page p-1">
        <button
          onClick={() => setView('availability')}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            view === 'availability' ? 'bg-white text-ink shadow-card' : 'text-muted hover:text-ink'
          }`}
        >
          Availability
        </button>
        <button
          onClick={() => setView('oee')}
          disabled
          className="flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium text-faint disabled:cursor-not-allowed"
        >
          OEE
          <span className="rounded bg-page px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-muted ring-1 ring-line">
            Soon
          </span>
        </button>
      </div>

      {view === 'availability' ? (
        <>
          {/* New period filter (TASK-22) */}
          <div className="no-print mb-5">
            <PeriodFilter value={period} onChange={setPeriod} />
          </div>

          {/* printable region — reflects current line/machine/period */}
          <div id={MACHINE_PRINT_ID}>
            <AvailabilityDashboard period={period} />
          </div>
        </>
      ) : (
        <ComingSoon
          title="OEE analytics are coming soon"
          description="Availability, performance and quality combined into a single OEE view. For now, use the Availability dashboard."
        />
      )}
    </div>
  )
}
