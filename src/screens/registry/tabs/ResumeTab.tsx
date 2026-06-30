import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { BatchForm } from '../../../data/batchForm'
import { FormSection } from '../../../components/FormControls'
import { SelectInput } from '../../../components/FormControls'
import MultiSensorChart from '../../../components/MultiSensorChart'
import { useProductionMonitoring } from '../../settings/MiscSettings'
import { Plus, Refresh, Search, CheckCircle, ChevronLeft, ChevronRight } from '../../../icons/Icons'

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
  { name: 'Energy', color: '#f19909', data: [3, 5, 7, 8, 9, 9.5, 9, 8, 8.6, 9.4, 7.8, 6] },
  { name: 'Product flow', color: '#9b7fd4', data: [5, 6.4, 5.4, 7, 6, 5.2, 6.1, 7, 5.8, 5, 4.6, 4] },
  { name: 'Mill current', color: '#e0489b', data: [3, 3.2, 3.8, 4, 3.4, 4, 4.6, 4.1, 4, 3.4, 3.8, 3.2] },
]
// One label per data point (08:00 → 13:30, 30-minute steps).
const X_LABELS = SERIES[0].data.map((_, i) => {
  const m = 8 * 60 + i * 30
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
})
const WINDOW_START_MIN = 8 * 60
const WINDOW_END_MIN = WINDOW_START_MIN + (SERIES[0].data.length - 1) * 30

// Pull the "HH:MM[am|pm]" out of an event timestamp and map it to a fraction
// across the chart window (null if it can't be read or falls outside).
function eventTimeToFrac(s: string): number | null {
  const m = /(\d{1,2}):(\d{2})\s*(am|pm)?/i.exec(s)
  if (!m) return null
  let h = Number(m[1])
  const ap = m[3]?.toLowerCase()
  if (ap === 'pm' && h !== 12) h += 12
  if (ap === 'am' && h === 12) h = 0
  const t = h * 60 + Number(m[2])
  if (t < WINDOW_START_MIN || t > WINDOW_END_MIN) return null
  return (t - WINDOW_START_MIN) / (WINDOW_END_MIN - WINDOW_START_MIN)
}

// Graph templates — preset sensor views (a single batch has a fixed window, so a
// time-range filter is meaningless here; the picker selects which curves to plot).
const GRAPH_TEMPLATES = [
  { name: 'All sensors', sensors: ['Energy', 'Product flow', 'Mill current'] },
  { name: 'Energy profile', sensors: ['Energy'] },
  { name: 'Flow & current', sensors: ['Product flow', 'Mill current'] },
  { name: 'Mill current', sensors: ['Mill current'] },
]

// ─── Floating quick-nav (Resume sections) ────────────────────────────────────
const SECTIONS = [
  { id: 'resume-status', label: 'Batch Status' },
  { id: 'resume-details', label: 'Batch Details' },
  { id: 'resume-machine', label: 'Machine Details' },
  { id: 'resume-notes', label: 'Notes' },
  { id: 'resume-graph', label: 'Graph' },
  { id: 'resume-alarms', label: 'Alarms', pmOnly: true },
  { id: 'resume-alerts', label: 'Alerts', pmOnly: true },
  { id: 'resume-log', label: 'Action Log', pmOnly: true },
]

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
  const [template, setTemplate] = useState(GRAPH_TEMPLATES[0].name)
  const [showStatus, setShowStatus] = useState(false)
  const [query, setQuery] = useState('')
  const [hoverSensor, setHoverSensor] = useState<number | null>(null)
  const [eventMarker, setEventMarker] = useState<number | null>(null)
  const [navOpen, setNavOpen] = useState(false)

  // Apply the selected graph template to both the chart curves and the stat cards.
  const activeTemplate = GRAPH_TEMPLATES.find((t) => t.name === template) ?? GRAPH_TEMPLATES[0]
  const visibleSeries = SERIES.filter((s) => activeTemplate.sensors.includes(s.name))
  const visibleSensors = SENSORS.filter((s) => activeTemplate.sensors.includes(s.name))

  // Alarms / Alerts / Action Log only exist in the Production Monitoring edition.
  const pmOn = useProductionMonitoring()
  const sections = SECTIONS.filter((s) => pmOn || !s.pmOnly)

  // Scroll-spy: highlight the section currently in view on the floating nav.
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActiveSection(e.target.id)
      },
      { rootMargin: '-25% 0px -65% 0px' }
    )
    for (const s of sections) {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pmOn])

  const jumpTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const activity = ACTIVITY.filter((r) =>
    query.trim() ? r.some((c) => c.toLowerCase().includes(query.trim().toLowerCase())) : true,
  )

  return (
    <div className="space-y-4">
      {/* Floating quick-nav — collapsed to a slim handle on the right edge; slides
          out on hover/focus so it never sits on top of the content. */}
      <div
        className="fixed right-0 top-1/2 z-30 hidden -translate-y-1/2 xl:block"
        onMouseEnter={() => setNavOpen(true)}
        onMouseLeave={() => setNavOpen(false)}
      >
        <div
          className={`flex items-stretch transition-transform duration-300 ease-out ${
            navOpen ? 'translate-x-0' : 'translate-x-[calc(100%-1.75rem)]'
          }`}
        >
          {/* Handle — always visible; clicking it also toggles (touch / no-hover) */}
          <button
            type="button"
            onClick={() => setNavOpen((v) => !v)}
            aria-expanded={navOpen}
            aria-label={navOpen ? 'Hide sections' : 'Show sections'}
            className="flex w-7 shrink-0 items-center justify-center rounded-l-2xl border border-r-0 border-white/60 bg-white/50 py-3 shadow-pop backdrop-blur-2xl backdrop-saturate-150"
          >
            <span className="rotate-180 text-[0.625rem] font-semibold uppercase tracking-wide text-faint [writing-mode:vertical-rl]">
              Sections
            </span>
          </button>
          {/* Panel */}
          <nav
            aria-label="Resume sections"
            className="flex flex-col gap-0.5 rounded-r-2xl border border-l-0 border-white/60 bg-white/50 p-1.5 pr-3 shadow-pop backdrop-blur-2xl backdrop-saturate-150"
          >
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  jumpTo(s.id)
                  setNavOpen(false)
                }}
                aria-current={activeSection === s.id ? 'true' : undefined}
                className={`rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                  activeSection === s.id ? 'bg-primary/90 text-white' : 'text-muted hover:bg-white/70 hover:text-ink'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Batch Status */}
      <div id="resume-status" className="scroll-mt-4">
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
      </div>

      {/* Batch Details */}
      <div id="resume-details" className="scroll-mt-4">
      <FormSection title="Batch Details">
        <div className="grid gap-8 md:grid-cols-2">
          <KvGroup heading="Target" rows={TARGET_ROWS} />
          <KvGroup heading="Process" rows={PROCESS_ROWS} />
        </div>
      </FormSection>
      </div>

      {/* Machine Details */}
      <div id="resume-machine" className="scroll-mt-4">
      <FormSection title="Machine Details">
        <div className="rounded-xl border border-line p-5">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary-700">Basic information</p>
              <KvList rows={MACHINE_BASIC} />
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary-700">Technology</p>
              <KvList rows={MACHINE_TECH} />
            </div>
          </div>
        </div>
      </FormSection>
      </div>

      {/* Notes */}
      <div id="resume-notes" className="scroll-mt-4">
      <FormSection
        title="Notes"
        action={
          <button className="flex items-center gap-1.5 rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary hover:bg-primary-soft/50">
            <Plus size={14} /> Add note
          </button>
        }
      >
        <div className="grid place-items-center rounded-lg border border-dashed border-line py-6 text-sm text-muted">
          There are currently no notes in this section.
        </div>
      </FormSection>
      </div>

      {/* Graph — its own card; chart fills the card width */}
      <div id="resume-graph" className="scroll-mt-4">
      <FormSection title="Graph">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="w-56">
            <SelectInput
              value={template}
              options={GRAPH_TEMPLATES.map((t) => t.name)}
              onChange={setTemplate}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted hover:bg-page">
              <input type="checkbox" checked={showStatus} onChange={(e) => setShowStatus(e.target.checked)} className="accent-primary" />
              Show Machine Status (Range)
            </label>
            <button className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-primary hover:bg-primary-soft/50">
              <Refresh size={14} /> Refresh Data
            </button>
          </div>
        </div>

        <div className="w-full">
          <MultiSensorChart
            series={visibleSeries}
            pointLabels={X_LABELS}
            max={10}
            height={320}
            highlight={hoverSensor}
            band={showStatus ? [2, 7] : null}
            markerFrac={eventMarker}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {visibleSensors.map((s, i) => (
            <div
              key={s.name}
              onMouseEnter={() => setHoverSensor(i)}
              onMouseLeave={() => setHoverSensor(null)}
              className="cursor-default rounded-lg border-l-4 bg-page/40 p-3 transition-shadow hover:shadow-card"
              style={{ borderColor: s.color }}
            >
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
      </FormSection>
      </div>

      {/* Alarms — Production Monitoring edition only */}
      {pmOn && (
        <div id="resume-alarms" className="scroll-mt-4">
        <FormSection title="Alarms">
          <EventTable columns={['Batch Time', 'Acknowledge Time', 'Alarm Message']} rows={ALARMS} dot="#c12907" onHoverRow={setEventMarker} />
        </FormSection>
        </div>
      )}

      {/* Alerts — Production Monitoring edition only */}
      {pmOn && (
        <div id="resume-alerts" className="scroll-mt-4">
        <FormSection title="Alerts">
          <EventTable columns={['Batch Time', 'Acknowledge Time', 'Alert Message']} rows={ALERTS} dot="#f19909" onHoverRow={setEventMarker} />
        </FormSection>
        </div>
      )}

      {/* Activity / Action log — Production Monitoring edition only */}
      {pmOn && (
      <div id="resume-log" className="scroll-mt-4">
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
      </div>
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

function EventTable({
  columns,
  rows,
  dot,
  onHoverRow,
}: {
  columns: string[]
  rows: string[][]
  dot: string
  onHoverRow?: (frac: number | null) => void
}) {
  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-line">
        <div className="grid grid-cols-[200px_200px_1fr] bg-page/60 px-4 py-3 text-xs font-medium text-muted">
          {columns.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        {rows.map((r, i) => (
          <div
            key={i}
            onMouseEnter={() => onHoverRow?.(eventTimeToFrac(r[0]))}
            onMouseLeave={() => onHoverRow?.(null)}
            className="grid grid-cols-[200px_200px_1fr] items-center border-t border-line px-4 py-3 text-sm transition-colors hover:bg-primary-soft/30"
          >
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

