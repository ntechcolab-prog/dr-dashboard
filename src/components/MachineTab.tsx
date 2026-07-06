import { useState } from 'react'
import Dropdown from './Dropdown'
import AvailabilityDashboard from './availability/AvailabilityDashboard'
import MachineRankingBoard from './availability/MachineRankingBoard'
import PerformanceDashboard from './performance/PerformanceDashboard'
import PerformanceRankingBoard from './performance/PerformanceRankingBoard'
import ExportMenu from './ExportMenu'
import { PRODUCTION_LINES } from '../data/appData'
import { MACHINES } from '../data/mockData'
import { useAvailabilitySettings, useAvailabilityPlan, useWorkingHolidays } from '../lib/availability'
import { useHolidays } from '../lib/holidays'
import { availabilityService } from '../data/availabilityData'
import { performanceService, PERFORMANCE_GOAL_PCT } from '../data/performanceData'
import type { Sheet } from '../lib/exportData'

const MACHINE_PRINT_ID = 'machine-availability-print'
const PERFORMANCE_PRINT_ID = 'machine-performance-print'
const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

type MachineView = 'availability' | 'performance'
const MACHINE_VIEWS: { key: MachineView; label: string }[] = [
  { key: 'availability', label: 'Availability' },
  { key: 'performance', label: 'Performance' },
]

export default function MachineTab() {
  const [view, setView] = useState<MachineView>('availability')
  const [line, setLine] = useState(PRODUCTION_LINES[0])
  // Same machine list the rankings use, so the selection always exists there.
  const [machine, setMachine] = useState(MACHINES[0])

  const [settings] = useAvailabilitySettings()
  const [plan] = useAvailabilityPlan()
  const wh = useWorkingHolidays()
  const now = new Date()
  const holidays = useHolidays(now.getFullYear())

  // Export sheets reflect the current machine/line for the current month + year.
  const buildAvailabilitySheets = (): Sheet[] => {
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

  // Performance sheets use the newest month with production data (the same
  // month the performance dashboard opens on).
  const buildPerformanceSheets = (): Sheet[] => {
    const { year: y, month: m } = performanceService.latestDataMonth()
    const daily = performanceService.dailySeries(y, m)
    const ranking = performanceService.machineRanking(y, m)
    const recipes = performanceService.recipeRanking(y, m)
    const slowest = performanceService.slowestBatches(y, m)
    const meta: Sheet = {
      name: 'Scope',
      rows: [
        ['Field', 'Value'],
        ['Line', line],
        ['Machine', machine],
        ['Month', `${MONTH_LABELS[m]} ${y}`],
        ['Performance goal (%)', PERFORMANCE_GOAL_PCT],
      ],
    }
    const dailySheet: Sheet = {
      name: `${MONTH_LABELS[m]} ${y}`,
      rows: [
        ['Day', 'Performance (%)'],
        ...daily.labels.map((d, i) => [d, daily.pct[i]]),
        ['Overall', daily.overallPct],
      ],
    }
    const machinesSheet: Sheet = {
      name: 'Machines',
      rows: [
        ['Machine', 'Performance (%)', 'Actual rate (t/h)', 'Ideal rate (t/h)', 'Speed loss (h)', 'Minor stops', 'Batches'],
        ...ranking.map((r) => [r.machine, r.pct, r.actualRate, r.idealRate, r.speedLossH, r.minorStops, r.batches]),
      ],
    }
    const recipesSheet: Sheet = {
      name: 'Recipes',
      rows: [
        ['Recipe', 'Performance (%)', 'Actual rate (t/h)', 'Ideal rate (t/h)', 'Batches'],
        ...recipes.map((r) => [r.recipe, r.pct, r.actualRate, r.idealRate, r.batches]),
      ],
    }
    const slowestSheet: Sheet = {
      name: 'Slowest batches',
      rows: [
        ['Batch', 'Day', 'Machine', 'Recipe', 'Actual rate (t/h)', 'Ideal rate (t/h)', 'Performance (%)'],
        ...slowest.map((b) => [b.id, b.day, b.machine, b.recipe, b.actualRate, b.idealRate, b.pct]),
      ],
    }
    return [meta, dailySheet, machinesSheet, recipesSheet, slowestSheet]
  }

  const isPerf = view === 'performance'
  const exportTitle = `Machine · ${machine} · ${line} · ${isPerf ? 'Performance' : 'Availability'}`

  return (
    <div className="px-6 py-5">
      {/* Availability | Performance tabs — same pill style as the Settings tabs */}
      <div className="mb-5 inline-flex flex-wrap gap-1 rounded-xl bg-card p-2 shadow-card">
        {MACHINE_VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              v.key === view ? 'bg-primary text-white' : 'text-muted hover:bg-page hover:text-ink'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* attack-focus ranking — worst performers first, separated from the filters below */}
      <div className="mb-5">
        {isPerf ? <PerformanceRankingBoard selectedMachine={machine} /> : <MachineRankingBoard />}
      </div>

      {/* line + machine scope */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Dropdown value={line} options={PRODUCTION_LINES} onChange={setLine} className="w-52" />
          <Dropdown value={machine} options={MACHINES} onChange={setMachine} className="w-44" />
        </div>
        <div className="no-print flex items-center gap-2">
          <ExportMenu
            title={exportTitle}
            printId={isPerf ? PERFORMANCE_PRINT_ID : MACHINE_PRINT_ID}
            filenameBase={`machine-${machine}-${isPerf ? 'performance' : 'availability'}`}
            sheets={isPerf ? buildPerformanceSheets : buildAvailabilitySheets}
          />
        </div>
      </div>

      {/* printable region — reflects current line/machine + dashboard state */}
      {isPerf ? (
        <div id={PERFORMANCE_PRINT_ID}>
          <PerformanceDashboard />
        </div>
      ) : (
        <div id={MACHINE_PRINT_ID}>
          <AvailabilityDashboard selectedMachine={machine} />
        </div>
      )}
    </div>
  )
}
