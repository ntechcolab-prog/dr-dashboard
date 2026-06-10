import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import Dropdown from './Dropdown'
import LineChart from './LineChart'
import OeeGauge from './OeeGauge'
import HBars from './HBars'
import EmptyState from './EmptyState'
import { PRODUCTION_LINES, MACHINE_NAMES, machinePerformance } from '../data/appData'

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
  const [machine, setMachine] = useState('')
  const [period, setPeriod] = useState('7 days')

  const perf = useMemo(
    () => (machine ? machinePerformance(machine, line, period) : null),
    [machine, line, period]
  )

  return (
    <div className="px-6 py-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Dropdown value={line} options={PRODUCTION_LINES} onChange={setLine} className="w-52" />
          <Dropdown
            value={machine}
            options={MACHINE_NAMES}
            onChange={setMachine}
            placeholder="Select machine"
            className="w-48"
          />
        </div>
        <div className="inline-flex rounded-lg bg-page p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              disabled={!machine}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${
                period === p ? 'bg-white text-ink shadow-card' : 'text-muted hover:text-ink'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {!perf ? (
        <EmptyState
          icon={<MachineIcon />}
          title="Select a machine"
          description="Pick a machine to see its OEE, productivity, downtime and energy for the chosen line and period."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card title="OEE">
            <OeeGauge availability={perf.oee.availability} performance={perf.oee.performance} quality={perf.oee.quality} />
            <div className="mt-3 grid grid-cols-4 gap-2 border-t border-line pt-3 text-center">
              <Legend label="Target" value={`${perf.oee.target}%`} color="text-ink" />
              <Legend label="Availability" value={`${perf.oee.availability}%`} color="text-[#6c3fb5]" />
              <Legend label="Performance" value={`${perf.oee.performance}%`} color="text-[#f19909]" />
              <Legend label="Quality" value={`${perf.oee.quality}%`} color="text-[#2f9be0]" />
            </div>
          </Card>

          <Card title="Machine Productivity">
            <LineChart
              data={perf.productivity.data}
              labels={perf.productivity.labels}
              unit="Kg"
              xLabel={perf.productivity.xLabel}
            />
          </Card>

          <Card title="Downtime by Group">
            <div className="pt-2">
              <HBars
                items={perf.downtime.map((d) => ({
                  label: d.label,
                  value: d.value,
                  color: DOWNTIME_COLORS[d.label],
                  leftLabel: `${d.value}h`,
                }))}
                axisMax={Math.max(...perf.downtime.map((d) => d.value)) + 1}
              />
            </div>
          </Card>

          <Card title="Availability">
            <LineChart
              data={perf.availability.data}
              labels={perf.availability.labels}
              unit="%"
              xLabel={perf.availability.xLabel}
              yMax={100}
            />
          </Card>

          <Card title="Performance (Batch)">
            <div className="pt-2">
              <HBars
                items={perf.performance.map((p, i) => ({ label: p.label, value: p.value, color: PERF_COLORS[i] }))}
                axisMax={10}
                axisTicks={[0, 2, 4, 6, 8, 10]}
              />
            </div>
          </Card>

          <Card title="Total Energy">
            <LineChart
              data={perf.totalEnergy.data}
              labels={perf.totalEnergy.labels}
              unit="kWh"
              xLabel={perf.totalEnergy.xLabel}
            />
          </Card>
        </div>
      )}
    </div>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line/70 bg-card p-4 shadow-card">
      <p className="mb-2 text-[0.8125rem] font-semibold uppercase tracking-wide text-ink">{title}</p>
      {children}
    </div>
  )
}

function Legend({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p className="text-[0.625rem] text-muted">{label}</p>
      <p className={`mt-0.5 text-sm font-bold ${color}`}>{value}</p>
    </div>
  )
}

function MachineIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="9" width="13" height="11" rx="1.5" />
      <path d="M16 13h3l2 2v5h-5" />
      <circle cx="9.5" cy="14.5" r="2.5" />
      <line x1="7" y1="5" x2="12" y2="5" />
    </svg>
  )
}
