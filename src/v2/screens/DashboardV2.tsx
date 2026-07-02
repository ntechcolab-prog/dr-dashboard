'use client'

import { useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import FiltersV2, { type Period } from '../components/FiltersV2'
import KpiCardV2 from '../components/KpiCardV2'
import CalendarV2 from '../components/CalendarV2'
import { ALL_BATCHES, MONTHS } from '@/src/data/mockData'
import { filterBatches, buildKpis, byDay, metricByDaySeries, type Kpi, type DayRollup } from '@/src/lib/compute'
import { useAvailabilitySettings, useAvailabilityPlan, useWorkingHolidays } from '@/src/lib/availability'
import { useHolidays } from '@/src/lib/holidays'
import { availabilityService } from '@/src/data/availabilityData'

// MUI-native Dashboard. Same data pipeline as v0/v1 (filter → KPIs → daily
// rollup); the presentation is rebuilt on MUI + MUI X Charts. Advanced extras
// from v1 (edit-mode reorder, rankings, machine tab, details drawer) are staged
// for follow-up passes.
export default function DashboardV2() {
  const [tab, setTab] = useState(0)
  const [machines, setMachines] = useState<string[]>(['Zeta 10', 'Zeta 60'])
  const [recipes, setRecipes] = useState<string[]>(['Dark Red'])
  const [period, setPeriod] = useState<Period>('monthly')
  const [monthKey, setMonthKey] = useState('2026-06')
  const [weekIdx, setWeekIdx] = useState(0)

  useEffect(() => { setWeekIdx(0) }, [monthKey])

  const monthMeta = MONTHS.find((m) => m.key === monthKey)!
  const monthIdx = MONTHS.findIndex((m) => m.key === monthKey)
  const prevMeta = monthIdx > 0 ? MONTHS[monthIdx - 1] : null

  const filtered = useMemo(() => filterBatches(ALL_BATCHES, { machines, recipes }), [machines, recipes])
  const monthBatches = useMemo(
    () => filtered.filter((b) => b.year === monthMeta.year && b.month === monthMeta.month),
    [filtered, monthMeta])
  const prevBatches = useMemo(
    () => (prevMeta ? filtered.filter((b) => b.year === prevMeta.year && b.month === prevMeta.month) : []),
    [filtered, prevMeta])

  const kpis = useMemo(() => buildKpis(monthBatches, prevBatches), [monthBatches, prevBatches])
  const dayMap = useMemo(() => byDay(monthBatches), [monthBatches])

  const seriesByKey = useMemo(() => {
    const daysInMonth = new Date(monthMeta.year, monthMeta.month + 1, 0).getDate()
    const out: Record<string, number[]> = {}
    for (const k of kpis) out[k.key] = metricByDaySeries(monthBatches, k.key, daysInMonth).data
    return out
  }, [kpis, monthBatches, monthMeta])

  const [availSettings] = useAvailabilitySettings()
  const [availPlan] = useAvailabilityPlan()
  const availWh = useWorkingHolidays()
  const availHolidays = useHolidays(monthMeta.year)
  const availByDay = useMemo(() => {
    const ms = availabilityService.monthSeries(
      monthMeta.year, monthMeta.month, availPlan, availSettings, availHolidays.set, availWh.set)
    const map = new Map<number, number>()
    ms.pct.forEach((p, i) => map.set(i + 1, p))
    return map
  }, [monthMeta, availPlan, availSettings, availHolidays.set, availWh.set])

  const avgMass = useMemo(() => {
    const days = [...dayMap.values()]
    if (!days.length) return 0
    return days.reduce((a, d) => a + d.mass, 0) / days.length
  }, [dayMap])

  const clearFilters = () => { setMachines([]); setRecipes([]) }

  const hasMachine = machines.length > 0
  const hasData = hasMachine && monthBatches.length > 0
  const openKpiDetails = (_kpi: Kpi) => {} // details drawer staged for follow-up
  const openDayDetails = (_day: number, _data: DayRollup) => {}

  return (
    <Box sx={{ maxWidth: '75rem', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5, p: 2.5 }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Batches" />
        <Tab label="Machine" />
      </Tabs>

      {tab === 0 ? (
        <Card sx={{ overflow: 'hidden' }}>
          <FiltersV2
            machines={machines} recipes={recipes} setMachines={setMachines} setRecipes={setRecipes}
            period={period} setPeriod={setPeriod} monthKey={monthKey} setMonthKey={setMonthKey}
            year={monthMeta.year} month={monthMeta.month} weekIdx={weekIdx} setWeekIdx={setWeekIdx}
            onClear={clearFilters}
          />
          <Divider />
          {hasData ? (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ px: 3, pb: 1 }}>
                <Typography variant="overline" sx={{ fontWeight: 600, color: 'text.primary' }}>Metrics</Typography>
              </Box>
              <Box sx={{ px: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 1.5 }}>
                {kpis.map((k) => (
                  <KpiCardV2 key={k.key} kpi={k} series={seriesByKey[k.key] ?? []} onDetails={openKpiDetails} />
                ))}
              </Box>
              <CalendarV2
                year={monthMeta.year} month={monthMeta.month} dayMap={dayMap}
                avgMass={avgMass} onDetails={openDayDetails} availByDay={availByDay}
              />
            </Box>
          ) : (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h6" color="text.primary">
                {hasMachine ? 'No batches match these filters' : 'Select at least one machine'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {hasMachine
                  ? 'Try a different recipe, month or clear some filters.'
                  : 'Choose a machine in the filter above to load metrics and the calendar.'}
              </Typography>
            </Box>
          )}
        </Card>
      ) : (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">Machine tab — staged for follow-up</Typography>
        </Card>
      )}
    </Box>
  )
}
