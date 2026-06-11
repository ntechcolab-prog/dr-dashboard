import { useState } from 'react'
import Dropdown from './Dropdown'
import AvailabilityDashboard from './availability/AvailabilityDashboard'
import ExportMenu from './ExportMenu'
import { PRODUCTION_LINES } from '../data/appData'
import { MACHINES } from '../data/mockData'
import { useAvailabilitySettings, useAvailabilityPlan, useWorkingHolidays } from '../lib/availability'
import { useHolidays } from '../lib/holidays'
import { availabilityService } from '../data/availabilityData'
import type { Sheet } from '../lib/exportData'

const MACHINE_PRINT_ID = 'machine-availability-print'
const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function MachineTab() {
  const [line, setLine] = useState(PRODUCTION_LINES[0])
  // Same machine list the ranking uses, so the selection always exists there.
  const [machine, setMachine] = useState(MACHINES[0])

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
          <Dropdown value={machine} options={MACHINES} onChange={setMachine} className="w-44" />
        </div>
        <div className="no-print flex items-center gap-2">
          <ExportMenu
            title={exportTitle}
            printId={MACHINE_PRINT_ID}
            filenameBase={`machine-${machine}-availability`}
            sheets={buildSheets}
          />
        </div>
      </div>

      {/* printable region — reflects current line/machine + dashboard state */}
      <div id={MACHINE_PRINT_ID}>
        <AvailabilityDashboard selectedMachine={machine} />
      </div>
    </div>
  )
}
