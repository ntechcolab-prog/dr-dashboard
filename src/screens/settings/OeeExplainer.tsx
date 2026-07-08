import { useEffect, useMemo, useState } from 'react'
import { Close, Refresh } from '../../icons/Icons'
import { useMachineAvailability } from '../../lib/availability'
import { useMachinePerformance } from '../../lib/performanceSettings'
import { PERFORMANCE_GOAL_PCT } from '../../data/performanceData'

// Interactive "how OEE works" explainer (Settings › Production).
//
// The classic Availability × Performance × Quality = OEE waterfall, live:
// the five inputs start from the selected machine's own configuration
// (working hours, availability target, target throughput, performance goal)
// and every edit re-flows the bars, the derived captions and the final OEE.

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

interface Props {
  machine: string
  onClose: () => void
}

export default function OeeExplainer({ machine, onClose }: Props) {
  const { settings: avail } = useMachineAvailability(machine)
  const { settings: perf } = useMachinePerformance(machine)

  // Defaults derived from the machine's configuration.
  const defaults = useMemo(() => {
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

  const [scheduled, setScheduled] = useState(defaults.scheduled)
  const [downtime, setDowntime] = useState(defaults.downtime)
  const [idealRate, setIdealRate] = useState(defaults.idealRate)
  const [actual, setActual] = useState(defaults.actual)
  const [good, setGood] = useState(defaults.good)

  const reset = () => {
    setScheduled(defaults.scheduled)
    setDowntime(defaults.downtime)
    setIdealRate(defaults.idealRate)
    setActual(defaults.actual)
    setGood(defaults.good)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // --- the OEE math ---
  const uptime = Math.max(0, scheduled - Math.min(downtime, scheduled))
  const maxPotential = uptime * idealRate
  const actualClamped = Math.min(actual, maxPotential)
  const goodClamped = Math.min(good, actualClamped)

  const a = scheduled > 0 ? uptime / scheduled : 0
  const p = maxPotential > 0 ? actualClamped / maxPotential : 0
  const q = actualClamped > 0 ? goodClamped / actualClamped : 0
  const oee = a * p * q

  // Stacked loss bar (sums to 100%).
  const availLoss = 1 - a
  const perfLoss = a * (1 - p)
  const qualLoss = a * p * (1 - q)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-h-full w-full max-w-4xl overflow-y-auto rounded-2xl bg-card p-6 shadow-pop">
        {/* header */}
        <div className="mb-1 flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-ink">
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
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-page hover:text-ink"
          >
            <Close size={18} />
          </button>
        </div>
        <p className="mb-5 text-sm text-muted">
          Pre-filled from <span className="font-medium text-ink">{machine}</span>’s configuration — change any value and
          watch the three factors and the final OEE re-flow.
        </p>

        {/* inputs */}
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <ExplainerInput label="Scheduled time" suffix="h" value={scheduled} min={0} step={0.5} onChange={setScheduled} />
          <ExplainerInput label="Downtime" suffix="h" value={downtime} min={0} step={0.5} onChange={setDowntime} />
          <ExplainerInput label="Ideal rate" suffix="t/h" value={idealRate} min={0} step={0.1} onChange={setIdealRate} />
          <ExplainerInput label="Actual output" suffix="t" value={actual} min={0} step={0.1} onChange={setActual} />
          <ExplainerInput label="Good output" suffix="t" value={good} min={0} step={0.1} onChange={setGood} />
        </div>

        {/* derived captions */}
        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span>
            Uptime <span className="font-semibold text-ink">{fmt(uptime)}h</span>
          </span>
          <span>
            Max potential output <span className="font-semibold text-ink">{fmt(maxPotential)} t</span>
          </span>
          <span>
            Actual output <span className="font-semibold text-ink">{fmt(actualClamped)} t</span>
          </span>
          <span>
            Good products <span className="font-semibold text-ink">{fmt(goodClamped)} t</span>
          </span>
          <button
            type="button"
            onClick={reset}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:text-ink"
          >
            <Refresh size={13} />
            Reset to {machine}’s config
          </button>
        </div>

        {/* diagram */}
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1.2fr] items-end gap-2 sm:gap-3">
          <FactorBar
            name="Availability"
            color={COLORS.availability}
            pct={a}
            lossLabel={`Downtime ${fmt(Math.min(downtime, scheduled))}h`}
            mainLabel={`Uptime ${fmt(uptime)}h`}
          />
          <Operator symbol="×" />
          <FactorBar
            name="Performance"
            color={COLORS.performance}
            pct={p}
            lossLabel={`Perf. loss ${fmt(Math.max(0, maxPotential - actualClamped))} t`}
            mainLabel={`Output ${fmt(actualClamped)} t`}
          />
          <Operator symbol="×" />
          <FactorBar
            name="Quality"
            color={COLORS.quality}
            pct={q}
            lossLabel={`Scrap ${fmt(Math.max(0, actualClamped - goodClamped))} t`}
            mainLabel={`Good ${fmt(goodClamped)} t`}
          />
          <Operator symbol="=" />
          <OeeBar a={availLoss} p={perfLoss} q={qualLoss} oee={oee} />
        </div>

        {/* formula line */}
        <p className="mt-5 border-t border-line pt-3 text-center text-sm">
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
      </div>
    </div>
  )
}

function ExplainerInput({
  label,
  suffix,
  value,
  min,
  step,
  onChange,
}: {
  label: string
  suffix: string
  value: number
  min: number
  step: number
  onChange: (n: number) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[0.6875rem] font-medium uppercase tracking-wide text-muted">{label}</span>
      <span className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-2 focus-within:border-primary">
        <input
          type="number"
          value={value}
          min={min}
          step={step}
          onChange={(e) => {
            const n = e.target.value === '' ? 0 : Number(e.target.value)
            onChange(Number.isFinite(n) ? Math.max(min, n) : 0)
          }}
          className="no-spin w-full min-w-0 bg-transparent text-sm font-semibold tabular-nums text-ink outline-none"
        />
        <span className="shrink-0 text-xs text-muted">{suffix}</span>
      </span>
    </label>
  )
}

const BAR_H = '13rem'

// One factor column: light "loss" segment on top, solid value below.
function FactorBar({
  name,
  color,
  pct,
  lossLabel,
  mainLabel,
}: {
  name: string
  color: string
  pct: number // 0–1
  lossLabel: string
  mainLabel: string
}) {
  const valuePct = Math.max(0, Math.min(1, pct)) * 100
  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full max-w-[5.5rem] flex-col overflow-hidden rounded-lg" style={{ height: BAR_H }}>
        <div
          className="flex w-full items-center justify-center transition-all duration-500"
          style={{ height: `${100 - valuePct}%`, background: `color-mix(in oklab, ${color} 22%, white)` }}
          title={lossLabel}
        >
          {100 - valuePct >= 10 && (
            <span className="px-1 text-center text-[0.6875rem] font-semibold tabular-nums" style={{ color }}>
              {fmt(100 - valuePct)}%
            </span>
          )}
        </div>
        <div
          className="flex w-full items-center justify-center transition-all duration-500"
          style={{ height: `${valuePct}%`, background: color }}
          title={mainLabel}
        >
          {valuePct >= 10 && (
            <span className="px-1 text-center text-xs font-bold tabular-nums text-white">{fmt(valuePct)}%</span>
          )}
        </div>
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-ink">{name}</p>
      <p className="text-center text-[0.6875rem] tabular-nums text-muted">{mainLabel}</p>
    </div>
  )
}

function Operator({ symbol }: { symbol: string }) {
  return (
    <span className="pb-14 text-lg font-semibold text-muted" aria-hidden>
      {symbol}
    </span>
  )
}

// The stacked result: the three losses on top, OEE at the bottom.
function OeeBar({ a, p, q, oee }: { a: number; p: number; q: number; oee: number }) {
  const seg = (v: number) => Math.max(0, v) * 100
  const rows: { label: string; pct: number; bg: string; fg: string }[] = [
    { label: 'Availability loss', pct: seg(a), bg: `color-mix(in oklab, ${COLORS.availability} 22%, white)`, fg: COLORS.availability },
    { label: 'Performance loss', pct: seg(p), bg: `color-mix(in oklab, ${COLORS.performance} 22%, white)`, fg: COLORS.performance },
    { label: 'Quality loss', pct: seg(q), bg: `color-mix(in oklab, ${COLORS.quality} 25%, white)`, fg: COLORS.quality },
    { label: 'OEE', pct: seg(oee), bg: COLORS.oee, fg: '#7a6206' },
  ]
  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full max-w-[8rem] flex-col overflow-hidden rounded-lg" style={{ height: BAR_H }}>
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex w-full items-center justify-center transition-all duration-500"
            style={{ height: `${r.pct}%`, background: r.bg }}
            title={`${r.label} · ${fmt(r.pct)}%`}
          >
            {r.pct >= 9 && (
              <span className="px-1 text-center text-[0.625rem] font-semibold leading-tight" style={{ color: r.fg }}>
                {r.label === 'OEE' ? `${fmt(r.pct)}% = OEE` : r.label}
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-ink">OEE</p>
      <p className="text-center text-[0.6875rem] tabular-nums text-muted">{fmt(oee * 100)}%</p>
    </div>
  )
}
