import { useState } from 'react'
import type { ReactNode } from 'react'
import Dropdown from './Dropdown'
import LineChart from './LineChart'
import OeeGauge from './OeeGauge'
import HBars from './HBars'
import {
  PRODUCTION_LINES,
  MACHINE_NAMES,
  MACHINE_PRODUCTIVITY,
  TOTAL_ENERGY,
  AVAILABILITY,
  DOWNTIME_BY_GROUP,
  PERFORMANCE_BATCH,
  OEE,
} from '../data/appData'

const PERIODS = ['Today', '7 days', '30 days', 'Custom']

const DOWNTIME_COLORS: Record<string, string> = {
  'Work Arrangement': 'var(--color-chart-1)',
  Uncommented: 'var(--color-chart-3)',
  Maintenance: 'var(--color-chart-4)',
  Setup: 'var(--color-up)',
}

const PERF_COLORS = ['#0b9c92', '#7fb2e8', '#9ad6a6', '#bfe0d9', '#bfe0d9', '#cfe7e2', '#cfe7e2']

export default function MachineTab() {
  const [line, setLine] = useState(PRODUCTION_LINES[0])
  const [machine, setMachine] = useState(MACHINE_NAMES[0])
  const [period, setPeriod] = useState('Today')

  return (
    <div className="px-6 py-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Dropdown value={line} options={PRODUCTION_LINES} onChange={setLine} className="w-52" />
          <Dropdown value={machine} options={MACHINE_NAMES} onChange={setMachine} className="w-44" />
        </div>
        <div className="inline-flex rounded-lg bg-page p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                period === p ? 'bg-white text-ink shadow-card' : 'text-muted hover:text-ink'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* OEE */}
        <Card title="OEE">
          <OeeGauge availability={OEE.availability} performance={OEE.performance} quality={OEE.quality} />
          <div className="mt-3 grid grid-cols-4 gap-2 border-t border-line pt-3 text-center">
            <Legend label="Target" value={`${OEE.target}%`} color="text-ink" />
            <Legend label="Availability" value={`${OEE.availability}%`} color="text-[#6c3fb5]" />
            <Legend label="Performance" value={`${OEE.performance}%`} color="text-[#f19909]" />
            <Legend label="Quality" value={`${OEE.quality}%`} color="text-[#2f9be0]" />
          </div>
        </Card>

        {/* Machine productivity */}
        <Card title="Machine Productivity">
          <LineChart
            data={MACHINE_PRODUCTIVITY}
            labels={['01', '02', '03', '04', '05', '06']}
            unit="Kg"
            xLabel="Days"
            yMax={1000}
          />
        </Card>

        {/* Downtime by group */}
        <Card title="Downtime by Group">
          <div className="pt-2">
            <HBars
              items={DOWNTIME_BY_GROUP.map((d) => ({
                label: d.label,
                value: d.value,
                color: DOWNTIME_COLORS[d.label],
                leftLabel: `${d.value}h`,
              }))}
              axisMax={10}
              axisTicks={[0, 20000, 40000, 60000, 80000]}
            />
          </div>
        </Card>

        {/* Availability */}
        <Card title="Availability">
          <LineChart
            data={AVAILABILITY}
            labels={['01', '02', '03', '04', '05', '06', '07']}
            unit="%"
            xLabel="Days"
            yMax={100}
            color="var(--color-chart-2)"
          />
        </Card>

        {/* Performance (batch) */}
        <Card title="Performance (Batch)">
          <div className="pt-2">
            <HBars
              items={PERFORMANCE_BATCH.map((p, i) => ({
                label: p.label,
                value: p.value,
                color: PERF_COLORS[i],
              }))}
              axisMax={10}
              axisTicks={[0, 2, 4, 6, 8, 10]}
            />
          </div>
        </Card>

        {/* Total energy */}
        <Card title="Total Energy">
          <LineChart
            data={TOTAL_ENERGY}
            labels={['01', '02', '03', '04', '05', '06', '07']}
            unit="kWh"
            xLabel="Time"
            yMax={1000}
            color="var(--color-chart-2)"
          />
        </Card>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line/70 bg-card p-4 shadow-card">
      <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-ink">{title}</p>
      {children}
    </div>
  )
}

function Legend({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted">{label}</p>
      <p className={`mt-0.5 text-sm font-bold ${color}`}>{value}</p>
    </div>
  )
}
