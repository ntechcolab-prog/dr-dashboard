import { useState } from 'react'
import Dropdown from './Dropdown'
import AvailabilityDashboard from './availability/AvailabilityDashboard'
import ExportMenu from './ExportMenu'
import { AnalysisIcon } from '../icons/Icons'
import { PRODUCTION_LINES, MACHINE_NAMES } from '../data/appData'
import { useAvailabilitySettings, useAvailabilityPlan, useWorkingHolidays } from '../lib/availability'
import { useHolidays } from '../lib/holidays'
import { availabilityService } from '../data/availabilityData'
import type { Sheet } from '../lib/exportData'

const MACHINE_PRINT_ID = 'machine-availability-print'
const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

interface Props {
  onNavigate?: (key: string) => void
}

export default function MachineTab({ onNavigate }: Props) {
  const [line, setLine] = useState(PRODUCTION_LINES[0])
  const [machine, setMachine] = useState(MACHINE_NAMES[0])

  const [settings] = useAvailabilitySettings()
  const [plan] = useAvailabilityPlan()
  const wh = useWorkingHolidays()
  const now = new Date()
  const holidays = useHolidays(now.getFullYear())

  // Export sheets reflect the current machine/line for the current month + year.
  const buildSheets = (): Sheet[] => {
    const y = now.getFullYear()
    const m = now.getMonth()
    const ms = availabilityService.monthSeries(y, m, plan, settings, holidays.set, wh.set)
    const ys = availabilityService.yearSeries(y, plan, settings, holidays.set, wh.set)
    const daily: Sheet = {
      name: `${MONTH_LABELS[m]} ${y}`,
      rows: [
        ['Day', 'Planned (h)', 'Executed (h)', 'Availability (%)'],
        ...ms.labels.map((d, i) => [d, ms.planned[i], ms.executed[i], ms.pct[i]]),
        ['Total', ms.totalPlanned, ms.totalExecuted, ms.overallPct],
      ],
    }
    const monthly: Sheet = {
      name: `Year ${y}`,
      rows: [
        ['Month', 'Planned (h)', 'Executed (h)', 'Availability (%)'],
        ...ys.labels.map((mo, i) => [mo, ys.planned[i], ys.executed[i], ys.pct[i]]),
        ['Total', ys.totalPlanned, ys.totalExecuted, ys.overallPct],
      ],
    }
    const meta: Sheet = {
      name: 'Scope',
      rows: [
        ['Field', 'Value'],
        ['Line', line],
        ['Machine', machine],
        ['Month', `${MONTH_LABELS[m]} ${y}`],
        ['Availability goal (%)', settings.monthlyGoalPct],
      ],
    }
    return [meta, daily, monthly]
  }

  const exportTitle = `Machine · ${machine} · ${line} · Availability`

  return (
    <div className="px-6 py-5">
      {/* line + machine scope */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Dropdown value={line} options={PRODUCTION_LINES} onChange={setLine} className="w-52" />
          <Dropdown value={machine} options={MACHINE_NAMES} onChange={setMachine} className="w-44" />
        </div>
        <div className="no-print flex items-center gap-2">
          <ExportMenu
            title={exportTitle}
            printId={MACHINE_PRINT_ID}
            filenameBase={`machine-${machine}-availability`}
            sheets={buildSheets}
          />
          <button
            onClick={() => onNavigate?.('analysis')}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            <AnalysisIcon size={16} />
            Generate Analysis
          </button>
        </div>
      </div>

      {/* printable region — reflects current line/machine + dashboard state */}
      <div id={MACHINE_PRINT_ID}>
        <AvailabilityDashboard />
      </div>
    </div>
  )
}
