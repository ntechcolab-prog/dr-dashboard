import { useEffect, useMemo, useState } from 'react'
import { Close, Refresh } from '../../icons/Icons'
import { useMachineAvailability } from '../../../shared/lib/availability'
import { useMachinePerformance } from '../../../shared/lib/performanceSettings'
import { PERFORMANCE_GOAL_PCT } from '../../../shared/data/performanceData'

// Interactive "how OEE works" panel (Settings › Production).
//
// Docked to the corner instead of a blocking modal, so the configuration and
// the diagram are visible side by side: the inputs derive LIVE from the
// machine's configuration (working hours, availability target, target
// throughput) — edit the config on the page and the bars re-flow in real
// time. Typing in the panel overrides a field locally (chip turns "edited");
// Reset drops the overrides and follows the configuration again.

const COLORS = {
  availability: '#22ab67',
  performance: '#4d8bf5',
  quality: '#f19b19',
  oee: '#f7d038',
}

const fmt = (n: number, digits = 1) => {
  const r = Number(n.toFixed(digits))
  return Number.isInteger(r) ? String(r) : r.toFixed(digits)
}

type FieldKey = 'scheduled' | 'downtime' | 'idealRate' | 'actual' | 'good'

interface Props {
  machine?: string
  onClose: () => void
}

export default function OeeExplainer({ machine, onClose }: Props) {
  const { settings: avail } = useMachineAvailability(machine)
  const { settings: perf } = useMachinePerformance(machine)
  const scopeLabel = machine ?? 'plant defaults'

  // Live defaults — recompute whenever the machine's configuration changes,
  // so edits made on the page flow straight into the diagram.
  const defaults = useMemo<Record<FieldKey, number>>(() => {
    const workingHours = avail.workingDays.length
      ? avail.defaultHoursByWeekday[avail.workingDays[0]] || 8
      : 8
    const scheduled = workingHours
    const downtime = Math.round(scheduled * (1 - avail.monthlyGoalPct / 100) * 10) / 10
    const idealRate = perf.targetRate || 1
    const maxPotential = (scheduled - downtime) * idealRate
    const actual = Math.round(maxPotential * (PERFORMANCE_GOAL_PCT / 100) * 10) / 10
    const good = Math.round(actual * 0.95 * 10) / 10
    return { scheduled, downtime, idealRate, actual, good }
  }, [avail, perf])

  // Per-field overrides (raw text, so a cleared field stays cleared while
  // editing). A field without an override follows the live config.
  const [overrides, setOverrides] = useState<Partial<Record<FieldKey, string>>>({})
  const overridden = Object.keys(overrides).length > 0

  const valueOf = (k: FieldKey): number => {
    const raw = overrides[k]
    if (raw === undefined) return defaults[k]
    const n = Number(raw)
    return raw !== '' && Number.isFinite(n) ? Math.max(0, n) : 0
  }
  const shownOf = (k: FieldKey): string => overrides[k] ?? String(defaults[k])
  const setField = (k: FieldKey) => (raw: string) => setOverrides((prev) => ({ ...prev, [k]: raw }))
  const blurField = (k: FieldKey) => () =>
    setOverrides((prev) => (prev[k] === '' ? { ...prev, [k]: '0' } : prev))
  const reset = () => setOverrides({})

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // --- the OEE math ---
  const scheduled = valueOf('scheduled')
  const downClamped = Math.min(valueOf('downtime'), scheduled)
  const uptime = Math.max(0, scheduled - downClamped)
  const maxPotential = uptime * valueOf('idealRate')
  const actualClamped = Math.min(valueOf('actual'), maxPotential)
  const goodClamped = Math.min(valueOf('good'), actualClamped)
  const scrapT = Math.max(0, actualClamped - goodClamped)

  const a = scheduled > 0 ? uptime / scheduled : 0
  const p = maxPotential > 0 ? actualClamped / maxPotential : 0
  const q = actualClamped > 0 ? goodClamped / actualClamped : 0
  const oee = a * p * q

  return (
    <aside
      aria-label="How OEE works"
      className="fixed bottom-6 right-6 z-50 max-h-[calc(100vh-6rem)] w-[27rem] max-w-[calc(100vw-3rem)] overflow-y-auto rounded-2xl border border-line bg-card p-5 shadow-pop"
    >
      {/* header */}
      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-ink">
          <span style={{ color: COLORS.availability }}>Availability</span>
          <span className="text-muted"> × </span>
          <span style={{ color: COLORS.performance }}>Performance</span>
          <span className="text-muted"> × </span>
          <span style={{ color: COLORS.quality }}>Quality</span>
          <span className="text-muted"> = </span>
          OEE
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted hover:bg-page hover:text-ink"
        >
          <Close size={16} />
        </button>
      </div>
      <p className="mb-4 text-xs text-muted">
        Live from <span className="font-medium text-ink">{scopeLabel}</span> — change the configuration on this page
        and the diagram follows. Typing here overrides a value.
      </p>

      {/* diagram — compact: 3 factors + stacked result */}
      <div className="grid grid-cols-[1fr_1fr_1fr_1.2fr] items-end gap-2">
        <MiniBar
          name="Availability"
          color={COLORS.availability}
          pct={a}
          lossLabel={`Downtime ${fmt(downClamped)}h`}
          subLabel={`Uptime ${fmt(uptime)}h`}
        />
        <MiniBar
          name="Performance"
          color={COLORS.performance}
          pct={p}
          lossLabel={`Loss ${fmt(Math.max(0, maxPotential - actualClamped))} t`}
          subLabel={`Out ${fmt(actualClamped)} of ${fmt(maxPotential)} t`}
        />
        <MiniBar
          name="Quality"
          color={COLORS.quality}
          pct={q}
          lossLabel={`Scrap ${fmt(scrapT)} t`}
          subLabel={`Good ${fmt(goodClamped)} t`}
        />
        <MiniOeeBar a={1 - a} p={a * (1 - p)} q={a * p * (1 - q)} oee={oee} />
      </div>

      {/* formula line */}
      <p className="mt-3 border-t border-line pt-2.5 text-center text-xs">
        <span className="font-semibold" style={{ color: COLORS.availability }}>
          {fmt(a * 100)}%
        </span>
        <span className="text-muted"> × </span>
        <span className="font-semibold" style={{ color: COLORS.performance }}>
          {fmt(p * 100)}%
        </span>
        <span className="text-muted"> × </span>
        <span className="font-semibold" style={{ color: COLORS.quality }}>
          {fmt(q * 100)}%
        </span>
        <span className="text-muted"> = </span>
        <span className="font-bold text-ink">OEE {fmt(oee * 100)}%</span>
      </p>

      {/* inputs */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <PanelInput label="Scheduled time" suffix="h" value={shownOf('scheduled')} edited={'scheduled' in overrides} onChange={setField('scheduled')} onBlur={blurField('scheduled')} />
        <PanelInput label="Downtime" suffix="h" value={shownOf('downtime')} edited={'downtime' in overrides} onChange={setField('downtime')} onBlur={blurField('downtime')} />
        <PanelInput label="Ideal rate" suffix="t/h" value={shownOf('idealRate')} edited={'idealRate' in overrides} onChange={setField('idealRate')} onBlur={blurField('idealRate')} />
        <PanelInput label="Actual output" suffix="t" value={shownOf('actual')} edited={'actual' in overrides} onChange={setField('actual')} onBlur={blurField('actual')} />
        <PanelInput label="Good output" suffix="t" value={shownOf('good')} edited={'good' in overrides} onChange={setField('good')} onBlur={blurField('good')} />
        {overridden && (
          <button
            type="button"
            onClick={reset}
            className="flex items-end justify-center gap-1.5 rounded-lg border border-line px-2 pb-2.5 text-xs font-medium text-muted transition-colors hover:text-ink"
          >
            <Refresh size={13} className="mb-0.5" />
            Follow config again
          </button>
        )}
      </div>
    </aside>
  )
}

function PanelInput({
  label,
  suffix,
  value,
  edited,
  onChange,
  onBlur,
}: {
  label: string
  suffix: string
  value: string
  edited: boolean
  onChange: (raw: string) => void
  onBlur: () => void
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-[0.625rem] font-medium uppercase tracking-wide text-muted">
        {label}
        {edited && <span className="rounded-full bg-primary/10 px-1.5 py-px text-[0.5625rem] lowercase text-primary">edited</span>}
      </span>
      <span className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 focus-within:border-primary">
        <input
          type="number"
          value={value}
          min={0}
          step={0.1}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="no-spin w-full min-w-0 bg-transparent text-sm font-semibold tabular-nums text-ink outline-none"
        />
        <span className="shrink-0 text-[0.6875rem] text-muted">{suffix}</span>
      </span>
    </label>
  )
}

const BAR_H = '9rem'

// Compact factor column: loss on top, value below, key numbers underneath.
function MiniBar({
  name,
  color,
  pct,
  lossLabel,
  subLabel,
}: {
  name: string
  color: string
  pct: number // 0–1
  lossLabel: string
  subLabel: string
}) {
  const valuePct = Math.max(0, Math.min(1, pct)) * 100
  const lossPct = 100 - valuePct
  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full max-w-[4.5rem] flex-col overflow-hidden rounded-md" style={{ height: BAR_H }}>
        <div
          className="flex w-full items-center justify-center transition-all duration-500"
          style={{ height: `${lossPct}%`, background: `color-mix(in oklab, ${color} 22%, white)` }}
          title={lossLabel}
        >
          {lossPct >= 9 && (
            <span className="px-0.5 text-center text-[0.625rem] font-semibold tabular-nums" style={{ color }}>
              {fmt(lossPct)}%
            </span>
          )}
        </div>
        <div
          className="flex w-full items-center justify-center transition-all duration-500"
          style={{ height: `${valuePct}%`, background: color }}
          title={subLabel}
        >
          {valuePct >= 9 && (
            <span className="px-0.5 text-center text-xs font-bold tabular-nums text-white">{fmt(valuePct)}%</span>
          )}
        </div>
      </div>
      <p className="mt-1.5 text-center text-[0.6875rem] font-semibold leading-tight text-ink">{name}</p>
      <p className="text-center text-[0.625rem] leading-tight text-muted">{subLabel}</p>
      <p className="text-center text-[0.625rem] leading-tight text-faint">{lossLabel}</p>
    </div>
  )
}

// Compact stacked result: the three losses + the OEE block.
function MiniOeeBar({ a, p, q, oee }: { a: number; p: number; q: number; oee: number }) {
  const seg = (v: number) => Math.max(0, v) * 100
  const rows = [
    { label: 'Availability loss', pct: seg(a), bg: `color-mix(in oklab, ${COLORS.availability} 22%, white)`, fg: COLORS.availability },
    { label: 'Performance loss', pct: seg(p), bg: `color-mix(in oklab, ${COLORS.performance} 22%, white)`, fg: COLORS.performance },
    { label: 'Quality loss', pct: seg(q), bg: `color-mix(in oklab, ${COLORS.quality} 25%, white)`, fg: COLORS.quality },
    { label: 'OEE', pct: seg(oee), bg: COLORS.oee, fg: '#7a6206' },
  ]
  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full max-w-[5.5rem] flex-col overflow-hidden rounded-md" style={{ height: BAR_H }}>
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex w-full items-center justify-center transition-all duration-500"
            style={{ height: `${r.pct}%`, background: r.bg }}
            title={`${r.label} · ${fmt(r.pct)}%`}
          >
            {r.pct >= 11 && (
              <span className="px-0.5 text-center text-[0.5625rem] font-semibold leading-tight" style={{ color: r.fg }}>
                {r.label === 'OEE' ? `${fmt(r.pct)}% OEE` : r.label}
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-center text-[0.6875rem] font-semibold leading-tight text-ink">OEE</p>
      <p className="text-center text-[0.625rem] leading-tight text-muted">
        of scheduled time → <span className="font-semibold tabular-nums text-ink">{fmt(oee * 100)}%</span>
      </p>
    </div>
  )
}
