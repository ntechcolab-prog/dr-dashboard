import { useState } from 'react'
import type { ReactNode } from 'react'
import type { BatchForm } from '../../../data/batchForm'
import { FormSection } from '../../../components/FormControls'
import { SelectInput } from '../../../components/FormControls'
import { useProductionMonitoring } from '../../settings/MiscSettings'
import { Plus, Download, Refresh, Search, CheckCircle, ChevronLeft, ChevronRight } from '../../../icons/Icons'

interface Props {
  form: BatchForm
}

// ─── Batch Details (key/value groups) ────────────────────────────────────────
const TARGET_ROWS = [
  ['Target Type', 'Energy'],
  ['Target Value', '2000.0'],
  ['Maximum Temperature Allowed (°C)', '60'],
]
const PROCESS_ROWS = [
  ['Energy', '978.2 kWh'],
  ['Specific Energy (kWh/kg)', '0.050'],
  ['Estimated Energy Consumption (kWh)', '0.0'],
  ['Total Runtime', '00:00:04'],
  ['Cycles', '0.0'],
]

// ─── Machine Details ─────────────────────────────────────────────────────────
const MACHINE_BASIC = [
  ['Manufacturer', 'NETZSCH'],
  ['Type', 'Bead Mill'],
  ['Commission number', 'l2500522-10'],
  ['Name', 'ALPHA lll - (30kW) BlueLab'],
  ['Production line', 'Line 2'],
]
const MACHINE_TECH = [
  ['Samba system', 'Yes'],
  ['Grinding technology', 'Neos'],
  ['Inner liner material', 'NE Steel'],
  ['Sieve size', '120 mm'],
  ['Bead material', 'CeraBeads'],
  ['Bead size 1', '8 mm'],
  ['Bead size 2', '12 mm'],
  ['Bead filling level', '75%'],
]

// ─── Additional Notes — sensor chart ─────────────────────────────────────────
const SENSORS = [
  { name: 'Energy', unit: 'kWh', color: '#f19909', stats: [['Min', '0'], ['Max', '2456'], ['Avg', '1050']] },
  { name: 'Product flow', unit: 'l/Min', color: '#9b7fd4', stats: [['Min', '30'], ['Max', '160'], ['Avg', '90']] },
  { name: 'Mill current', unit: 'kWh', color: '#e0489b', stats: [['Min', '20'], ['Max', '102'], ['Avg', '48']] },
]
const SERIES = [
  { color: '#f19909', data: [3, 5, 7, 8, 9, 9.5, 9, 8, 8.6, 9.4, 7.8, 6] },
  { color: '#9b7fd4', data: [5, 6.4, 5.4, 7, 6, 5.2, 6.1, 7, 5.8, 5, 4.6, 4] },
  { color: '#e0489b', data: [3, 3.2, 3.8, 4, 3.4, 4, 4.6, 4.1, 4, 3.4, 3.8, 3.2] },
]
const X_LABELS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00']

// ─── Tables ──────────────────────────────────────────────────────────────────
const ALARMS = [
  ['02 Mar 2021 / 11:13am', '02 Mar 2021 / 11:14am', 'Low cooling liquid level'],
  ['02 Mar 2021 / 10:48am', '02 Mar 2021 / 10:49am', 'High product temperature'],
  ['02 Mar 2021 / 10:21am', '02 Mar 2021 / 10:22am', 'Pressure above setpoint'],
  ['02 Mar 2021 / 09:57am', '02 Mar 2021 / 09:58am', 'Low cooling liquid level'],
  ['02 Mar 2021 / 09:30am', '02 Mar 2021 / 09:31am', 'Bead wear warning'],
]
const ALERTS = [
  ['02 Mar 2021 / 11:05am', '02 Mar 2021 / 11:06am', 'Flow rate fluctuation detected'],
  ['02 Mar 2021 / 10:32am', '02 Mar 2021 / 10:33am', 'Mill current near limit'],
  ['02 Mar 2021 / 10:04am', '02 Mar 2021 / 10:05am', 'Cooling pump speed reduced'],
  ['02 Mar 2021 / 09:41am', '02 Mar 2021 / 09:42am', 'Sample interval exceeded'],
]
const ACTIVITY = [
  ['1', 'MR completed by Antoni Newton', 'Commissioning ER alarm', '11/05/2021 12:46:34'],
  ['2', 'User logged in', 'User Login', '11/05/2021 11:32:08'],
  ['3', 'User logged out', 'User Logout', '09/05/2021 18:14:51'],
  ['4', 'Recipe Start: Action Start', 'Manual action', '09/05/2021 09:02:10'],
  ['5', 'Recipe Start: Action Start', 'Manual action', '08/05/2021 17:48:22'],
  ['6', 'Limit value reached for fill level', 'Automatic change', '08/05/2021 16:12:03'],
  ['7', 'Batch BA-0074 created', 'Batch start', '05/05/2021 08:30:00'],
]

export default function ResumeTab({ form }: Props) {
  const [period, setPeriod] = useState('Last 24 hours')
  const [showStatus, setShowStatus] = useState(false)
  const [query, setQuery] = useState('')

  // Alarms / Alerts / Action Log only exist in the Production Monitoring edition.
  const pmOn = useProductionMonitoring()

  const activity = ACTIVITY.filter((r) =>
    query.trim() ? r.some((c) => c.toLowerCase().includes(query.trim().toLowerCase())) : true,
  )

  return (
    <div className="space-y-4">
      {/* Batch Status */}
      <FormSection title="Batch Status">
        <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Status">
            <span className="flex items-center gap-1.5 font-medium text-up">
              <CheckCircle size={16} /> Complete
            </span>
          </Stat>
          <Stat label="Progress (%)" value="100" />
          <Stat label="Batch Length" value="3:00:00" />
          <Stat label="Total Batch Size" value={`${form.product.weight} kg`} />
          <Stat label="Start Time" value="15 May, 2023, 08:30:21" />
          <Stat label="End Time" value="15 May, 2023, 12:30:21" />
        </div>
      </FormSection>

      {/* Batch Details */}
      <FormSection title="Batch Details">
        <div className="grid gap-8 md:grid-cols-2">
          <KvGroup heading="Target" rows={TARGET_ROWS} />
          <KvGroup heading="Process" rows={PROCESS_ROWS} />
        </div>
      </FormSection>

      {/* Machine Details */}
      <FormSection title="Machine Details">
        <div className="rounded-xl border border-line p-5">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary-700">Basic information</p>
              <KvList rows={MACHINE_BASIC} />
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary-700">Recipe and beads</p>
              <KvList rows={MACHINE_TECH} />
            </div>
          </div>
        </div>
      </FormSection>

      {/* Notes */}
      <FormSection
        title="Notes"
        action={
          <button className="flex items-center gap-1.5 rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary hover:bg-primary-soft/50">
            <Plus size={14} /> Add note
          </button>
        }
      >
        <div className="mb-5 grid place-items-center rounded-lg border border-dashed border-line py-6 text-sm text-muted">
          There are currently no notes in this section.
        </div>

        {/* Sensor chart card */}
        <div className="rounded-xl border border-line p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="w-48">
              <SelectInput
                value={period}
                options={['Last 24 hours', 'Last 7 days', 'Last 30 days']}
                onChange={setPeriod}
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted hover:bg-page">
                <Download size={14} /> Export
              </button>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted hover:bg-page">
                <input type="checkbox" checked={showStatus} onChange={(e) => setShowStatus(e.target.checked)} className="accent-primary" />
                Show Machine Status (Range)
              </label>
              <button className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-primary hover:bg-primary-soft/50">
                <Refresh size={14} /> Refresh Data
              </button>
            </div>
          </div>

          <SensorChart showStatus={showStatus} />

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {SENSORS.map((s) => (
              <div key={s.name} className="rounded-lg border-l-4 bg-page/40 p-3" style={{ borderColor: s.color }}>
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: s.color }}>{s.name}</p>
                  <span className="text-[0.6875rem] text-faint">{s.unit}</span>
                </div>
                <div className="mt-2 flex gap-4">
                  {s.stats.map(([k, v]) => (
                    <span key={k} className="text-xs text-muted">
                      {k} <span className="font-semibold text-ink tabular-nums">{v}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </FormSection>

      {/* Alarms — Production Monitoring edition only */}
      {pmOn && (
        <FormSection title="Alarms">
          <EventTable columns={['Batch Time', 'Acknowledge Time', 'Alarm Message']} rows={ALARMS} dot="#c12907" />
        </FormSection>
      )}

      {/* Alerts — Production Monitoring edition only */}
      {pmOn && (
        <FormSection title="Alerts">
          <EventTable columns={['Batch Time', 'Acknowledge Time', 'Alert Message']} rows={ALERTS} dot="#f19909" />
        </FormSection>
      )}

      {/* Activity / Action log — Production Monitoring edition only */}
      {pmOn && (
      <FormSection
        title="Action Log"
        action={
          <div className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5">
            <Search size={15} className="text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search description…"
              className="w-44 bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>
        }
      >
        <div className="overflow-hidden rounded-lg border border-line">
          <div className="grid grid-cols-[48px_1fr_1fr_180px] bg-page/60 px-4 py-3 text-xs font-medium text-muted">
            <span>#</span>
            <span>Description</span>
            <span>Event</span>
            <span>Date</span>
          </div>
          {activity.map((r) => (
            <div key={r[0]} className="grid grid-cols-[48px_1fr_1fr_180px] items-center border-t border-line px-4 py-3 text-sm">
              <span className="text-muted tabular-nums">{r[0]}</span>
              <span className="text-ink">{r[1]}</span>
              <span className="text-muted">{r[2]}</span>
              <span className="text-muted tabular-nums">{r[3]}</span>
            </div>
          ))}
          {activity.length === 0 && (
            <div className="border-t border-line px-4 py-8 text-center text-sm text-muted">No entries match “{query}”.</div>
          )}
        </div>
        <Pagination count={activity.length} />
      </FormSection>
      )}
    </div>
  )
}

function Stat({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  return (
    <div>
      <p className="text-[0.6875rem] uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-1 text-sm font-medium text-ink tabular-nums">{children ?? value}</div>
    </div>
  )
}

function KvGroup({ heading, rows }: { heading: string; rows: string[][] }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary-700">{heading}</p>
      <KvList rows={rows} />
    </div>
  )
}

function KvList({ rows }: { rows: string[][] }) {
  return (
    <dl className="divide-y divide-line">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-4 py-2.5 text-sm">
          <dt className="text-muted">{k}</dt>
          <dd className="text-right font-medium text-ink tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function EventTable({ columns, rows, dot }: { columns: string[]; rows: string[][]; dot: string }) {
  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-line">
        <div className="grid grid-cols-[200px_200px_1fr] bg-page/60 px-4 py-3 text-xs font-medium text-muted">
          {columns.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[200px_200px_1fr] items-center border-t border-line px-4 py-3 text-sm">
            <span className="text-muted tabular-nums">{r[0]}</span>
            <span className="text-muted tabular-nums">{r[1]}</span>
            <span className="flex items-center gap-2 text-ink">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: dot }} />
              {r[2]}
            </span>
          </div>
        ))}
      </div>
      <Pagination count={rows.length} />
    </div>
  )
}

function Pagination({ count }: { count: number }) {
  return (
    <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted">
      <span>1–{count} of {count}</span>
      <button className="grid h-7 w-7 place-items-center rounded-md border border-line text-faint" disabled>
        <ChevronLeft size={14} />
      </button>
      <button className="grid h-7 w-7 place-items-center rounded-md border border-line text-faint" disabled>
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

function SensorChart({ showStatus }: { showStatus: boolean }) {
  const W = 880
  const H = 260
  const padL = 36
  const padR = 12
  const padT = 12
  const padB = 28
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  const max = 10
  const n = SERIES[0].data.length
  const x = (i: number) => padL + (i / (n - 1)) * plotW
  const y = (v: number) => padT + plotH - (v / max) * plotH

  // optional machine-status band (a producing window highlight)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {showStatus && (
        <rect x={x(2)} y={padT} width={x(7) - x(2)} height={plotH} fill="#59d66e" opacity={0.08} />
      )}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line
          key={i}
          x1={padL}
          x2={W - padR}
          y1={padT + plotH * t}
          y2={padT + plotH * t}
          stroke="var(--color-line)"
          strokeWidth={1}
          strokeDasharray={i === 4 ? undefined : '2 6'}
        />
      ))}
      {SERIES.map((s, si) => (
        <polyline
          key={si}
          points={s.data.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
          fill="none"
          stroke={s.color}
          strokeWidth={2}
          strokeLinejoin="round"
          pathLength={1}
          className="chart-line"
          style={{ animationDelay: `${si * 90}ms` }}
        />
      ))}
      {X_LABELS.map((lab, i) => {
        const idx = Math.round((i / (X_LABELS.length - 1)) * (n - 1))
        return (
          <text key={i} x={x(idx)} y={H - 9} textAnchor="middle" className="fill-muted" style={{ fontSize: 9 }}>
            {lab}
          </text>
        )
      })}
    </svg>
  )
}
