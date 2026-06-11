import { useEffect, useMemo, useState } from 'react'
import Tabs, { type TabDef } from '../components/Tabs'
import Filters, { type Period } from '../components/Filters'
import MetricsGridV2 from '../components/MetricsGridV2'
import Calendar from '../components/Calendar'
import Rankings from '../components/Rankings'
import InOperation from '../components/InOperation'
import DetailsDrawer, { type DrawerData } from '../components/DetailsDrawer'
import MachineTab from '../components/MachineTab'
import EmptyState from '../components/EmptyState'
import ExportMenu from '../components/ExportMenu'
import { AnalysisIcon } from '../icons/Icons'
import type { Sheet } from '../lib/exportData'
import { ALL_BATCHES, LIVE_BATCHES, MONTHS } from '../data/mockData'
import { useAvailabilitySettings, useAvailabilityPlan, useWorkingHolidays } from '../lib/availability'
import { useHolidays } from '../lib/holidays'
import { availabilityService } from '../data/availabilityData'
import {
  filterBatches,
  buildKpis,
  byDay,
  buildRankings,
  metricByDaySeries,
  metricByMachine,
  metricByRecipe,
  formatValue,
  type Kpi,
  type DayRollup,
} from '../lib/compute'

const TABS: TabDef[] = [
  { key: 'batches', label: 'Batches' },
  { key: 'machine', label: 'Machine' },
]

const CLOSED_DRAWER: DrawerData = {
  open: false,
  kind: 'day',
  title: '',
  subtitle: '',
  batches: [],
}

interface DashboardScreenProps {
  onNavigate?: (key: string) => void
}

const BATCHES_PRINT_ID = 'batches-print'

export default function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  const [tab, setTab] = useState('batches')
  const [machines, setMachines] = useState<string[]>(['Zeta 10', 'Zeta 60'])
  const [recipes, setRecipes] = useState<string[]>(['Dark Red'])
  const [period, setPeriod] = useState<Period>('monthly')
  const [monthKey, setMonthKey] = useState('2026-06')
  const [weekIdx, setWeekIdx] = useState(0)

  // Reset the selected week whenever the month changes.
  useEffect(() => {
    setWeekIdx(0)
  }, [monthKey])

  const [drawer, setDrawer] = useState<DrawerData>(CLOSED_DRAWER)

  const monthMeta = MONTHS.find((m) => m.key === monthKey)!
  const monthIdx = MONTHS.findIndex((m) => m.key === monthKey)
  const prevMeta = monthIdx > 0 ? MONTHS[monthIdx - 1] : null

  const filtered = useMemo(
    () => filterBatches(ALL_BATCHES, { machines, recipes }),
    [machines, recipes]
  )

  const monthBatches = useMemo(
    () => filtered.filter((b) => b.year === monthMeta.year && b.month === monthMeta.month),
    [filtered, monthMeta]
  )

  const prevBatches = useMemo(
    () =>
      prevMeta
        ? filtered.filter((b) => b.year === prevMeta.year && b.month === prevMeta.month)
        : [],
    [filtered, prevMeta]
  )

  const kpis = useMemo(() => buildKpis(monthBatches, prevBatches), [monthBatches, prevBatches])
  const dayMap = useMemo(() => byDay(monthBatches), [monthBatches])
  const rankings = useMemo(() => buildRankings(monthBatches), [monthBatches])

  // Per-metric daily series for the (now shared) rich metric cards.
  const seriesByKey = useMemo(() => {
    const daysInMonth = new Date(monthMeta.year, monthMeta.month + 1, 0).getDate()
    const out: Record<string, number[]> = {}
    for (const k of kpis) out[k.key] = metricByDaySeries(monthBatches, k.key, daysInMonth).data
    return out
  }, [kpis, monthBatches, monthMeta])

  // Per-day availability % for the calendar, from the availability service.
  const [availSettings] = useAvailabilitySettings()
  const [availPlan] = useAvailabilityPlan()
  const availWh = useWorkingHolidays()
  const availHolidays = useHolidays(monthMeta.year)
  const availByDay = useMemo(() => {
    const ms = availabilityService.monthSeries(
      monthMeta.year,
      monthMeta.month,
      availPlan,
      availSettings,
      availHolidays.set,
      availWh.set
    )
    const map = new Map<number, number>()
    ms.pct.forEach((p, i) => map.set(i + 1, p))
    return map
  }, [monthMeta, availPlan, availSettings, availHolidays.set, availWh.set])

  const avgMass = useMemo(() => {
    const days = [...dayMap.values()]
    if (!days.length) return 0
    return days.reduce((a, d) => a + d.mass, 0) / days.length
  }, [dayMap])

  const clearFilters = () => {
    setMachines([])
    setRecipes([])
  }

  const openDayDetails = (day: number, data: DayRollup) =>
    setDrawer({
      open: true,
      kind: 'day',
      title: `${monthMeta.label.split(' ')[0]} ${String(day).padStart(2, '0')}`,
      subtitle: `${data.count} ${data.count === 1 ? 'batch' : 'batches'} · ${(
        Math.round(data.mass * 10) / 10
      ).toFixed(1)} ton`,
      batches: data.batches,
    })

  const openKpiDetails = (kpi: Kpi) => {
    const daysInMonth = new Date(monthMeta.year, monthMeta.month + 1, 0).getDate()
    setDrawer({
      open: true,
      kind: 'kpi',
      title: kpi.label,
      subtitle: `${monthMeta.label} · ${monthBatches.length} batches in scope`,
      batches: [],
      kpi,
      daily: metricByDaySeries(monthBatches, kpi.key, daysInMonth),
      byMachine: metricByMachine(monthBatches, kpi.key),
      byRecipe: metricByRecipe(monthBatches, kpi.key),
      richViz: true,
    })
  }

  const hasMachine = machines.length > 0
  const hasData = hasMachine && monthBatches.length > 0

  // Export sheets reflect the current filters (machines/recipes/month).
  const buildBatchesSheets = (): Sheet[] => {
    const metrics: Sheet = {
      name: 'Metrics',
      rows: [
        ['Metric', 'Value', 'Unit', 'Δ vs last month (%)'],
        ...kpis.map((k) => [k.label, formatValue(k.value, k.fmt), k.unit, Math.round(k.delta)]),
      ],
    }
    const batchRows: Sheet = {
      name: 'Batches',
      rows: [
        ['ID', 'Day', 'Machine', 'Recipe', 'Line', 'Mass (ton)', 'Energy (kWh)', 'Status'],
        ...monthBatches.map((b) => [
          b.id,
          b.day,
          b.machine,
          b.recipe,
          b.productionLine,
          b.mass,
          b.energy,
          b.status,
        ]),
      ],
    }
    return [metrics, batchRows]
  }

  return (
    <div className="mx-auto flex max-w-[75rem] flex-col gap-5 p-5">
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'batches' ? (
        <>
          <div id={BATCHES_PRINT_ID} className="overflow-hidden rounded-xl bg-card shadow-card">
            <Filters
              machines={machines}
              recipes={recipes}
              setMachines={setMachines}
              setRecipes={setRecipes}
              period={period}
              setPeriod={setPeriod}
              monthKey={monthKey}
              setMonthKey={setMonthKey}
              year={monthMeta.year}
              month={monthMeta.month}
              weekIdx={weekIdx}
              setWeekIdx={setWeekIdx}
              onClear={clearFilters}
              actions={
                <>
                  <ExportMenu
                    title={`Batches · ${monthMeta.label} · ${machines.length ? machines.join(', ') : 'All machines'}`}
                    printId={BATCHES_PRINT_ID}
                    filenameBase={`batches-${monthMeta.key}`}
                    sheets={buildBatchesSheets}
                  />
                  <button
                    onClick={() => onNavigate?.('analysis')}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
                  >
                    <AnalysisIcon size={16} />
                    Generate Analysis
                  </button>
                </>
              }
            />
            {hasData ? (
              <div className="border-t border-line/70 pt-4">
                <MetricsGridV2 kpis={kpis} series={seriesByKey} onDetails={openKpiDetails} />
                <Calendar
                  period={period}
                  year={monthMeta.year}
                  month={monthMeta.month}
                  weekIdx={weekIdx}
                  dayMap={dayMap}
                  avgMass={avgMass}
                  onDetails={openDayDetails}
                  availByDay={availByDay}
                />
              </div>
            ) : (
              <div className="border-t border-line/70">
                <EmptyState
                  title={hasMachine ? 'No batches match these filters' : 'Select at least one machine'}
                  description={
                    hasMachine
                      ? 'Try a different recipe, month or clear some filters.'
                      : 'Choose a machine in the filter above to load metrics, the calendar and rankings.'
                  }
                />
              </div>
            )}
          </div>

          {hasData && <Rankings rankings={rankings} />}
          {hasData && <InOperation batches={LIVE_BATCHES} />}
        </>
      ) : (
        <div className="overflow-hidden rounded-xl bg-card shadow-card">
          <MachineTab onNavigate={onNavigate} />
        </div>
      )}

      <DetailsDrawer {...drawer} onClose={() => setDrawer((d) => ({ ...d, open: false }))} />
    </div>
  )
}
