import { useMemo, useState } from 'react'
import AppHeader from './components/AppHeader'
import Sidebar from './components/Sidebar'
import Tabs, { type TabDef } from './components/Tabs'
import Filters, { type Period } from './components/Filters'
import MetricsGrid from './components/MetricsGrid'
import Calendar from './components/Calendar'
import Rankings from './components/Rankings'
import InOperation from './components/InOperation'
import DetailsDrawer from './components/DetailsDrawer'
import { ALL_BATCHES, LIVE_BATCHES, MONTHS, type Batch } from './data/mockData'
import { filterBatches, buildKpis, byDay, buildRankings, type Kpi, type DayRollup } from './lib/compute'

const TABS: TabDef[] = [
  { key: 'batches', label: 'Batches' },
  { key: 'machine', label: 'Machine' },
]

interface DrawerState {
  open: boolean
  title: string
  subtitle: string
  batches: Batch[]
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeNav, setActiveNav] = useState('dashboard')
  const [tab, setTab] = useState('batches')

  const [machines, setMachines] = useState<string[]>(['Zeta 10', 'Zeta 60'])
  const [recipes, setRecipes] = useState<string[]>(['Dark Red'])
  const [period, setPeriod] = useState<Period>('monthly')
  const [monthKey, setMonthKey] = useState('2026-04')

  const [drawer, setDrawer] = useState<DrawerState>({
    open: false,
    title: '',
    subtitle: '',
    batches: [],
  })

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
      title: `${monthMeta.label.split(' ')[0]} ${String(day).padStart(2, '0')}`,
      subtitle: `${data.count} ${data.count === 1 ? 'batch' : 'batches'} · ${(
        Math.round(data.mass * 10) / 10
      ).toFixed(1)} ton`,
      batches: data.batches,
    })

  const openKpiDetails = (kpi: Kpi) =>
    setDrawer({
      open: true,
      title: kpi.label,
      subtitle: `${monthMeta.label} · ${monthBatches.length} batches in scope`,
      batches: monthBatches,
    })

  return (
    <div className="flex h-screen flex-col">
      <AppHeader onToggleSidebar={() => setSidebarOpen((v) => !v)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} active={activeNav} onSelect={setActiveNav} />

        <main className="flex-1 overflow-auto">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-5 p-5">
            {/* Tabs strip */}
            <div className="rounded-xl bg-card pt-1 shadow-card">
              <Tabs tabs={TABS} active={tab} onChange={setTab} />
            </div>

            {tab === 'batches' ? (
              <>
                {/* Filter + Metrics + Calendar */}
                <div className="overflow-hidden rounded-xl bg-card shadow-card">
                  <Filters
                    machines={machines}
                    recipes={recipes}
                    setMachines={setMachines}
                    setRecipes={setRecipes}
                    period={period}
                    setPeriod={setPeriod}
                    monthKey={monthKey}
                    setMonthKey={setMonthKey}
                    onClear={clearFilters}
                  />
                  <div className="border-t border-line/70 pt-4">
                    <MetricsGrid kpis={kpis} onDetails={openKpiDetails} />
                    <Calendar
                      period={period}
                      year={monthMeta.year}
                      month={monthMeta.month}
                      dayMap={dayMap}
                      avgMass={avgMass}
                      onDetails={openDayDetails}
                    />
                  </div>
                </div>

                <Rankings rankings={rankings} />
                <InOperation batches={LIVE_BATCHES} />
              </>
            ) : (
              <div className="grid place-items-center rounded-xl bg-card p-20 text-center shadow-card">
                <div>
                  <p className="text-lg font-semibold text-ink">Machine view</p>
                  <p className="mt-1 text-sm text-muted">
                    Per-machine breakdown isn't part of this screen yet.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <DetailsDrawer
        open={drawer.open}
        title={drawer.title}
        subtitle={drawer.subtitle}
        batches={drawer.batches}
        onClose={() => setDrawer((d) => ({ ...d, open: false }))}
      />
    </div>
  )
}
