import { useEffect, useMemo, useState } from 'react'
import { Close, Refresh } from '../../icons/Icons'
import { useMachineAvailability } from '../../lib/availability'
import { useMachinePerformance } from '../../lib/performanceSettings'
import { PERFORMANCE_GOAL_PCT } from '../../data/performanceData'

// Interactive "how OEE works" explainer (Settings › Production).
//
// The classic Availability × Performance × Quality = OEE waterfall, live:
// the five inputs start from the machine's own configuration (working hours,
// availability target, target throughput, performance goal) and every edit
// re-flows the bars, the annotations and the final OEE — mirroring the
// reference diagram: scheduled time on the left, losses annotated per bar,
// max potential / actual / good products bridging the factors.

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
  machine?: string
  onClose: () => void
}

export default function OeeExplainer({ machine, onClose }: Props) {
  const { settings: avail } = useMachineAvailability(machine)
  const { settings: perf } = useMachinePerformance(machine)
  const scopeLabel = machine ?? 'the plant defaults'

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
  const downClamped = Math.min(downtime, scheduled)
  const uptime = Math.max(0, scheduled - downClamped)
  const maxPotential = uptime * idealRate
  const actualClamped = Math.min(actual, maxPotential)
  const goodClamped = Math.min(good, actualClamped)
  const perfLossT = Math.max(0, maxPotential - actualClamped)
  const scrapT = Math.max(0, actualClamped - goodClamped)

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
      <div className="relative max-h-full w-full max-w-5xl overflow-y-auto rounded-2xl bg-card p-6 shadow-pop">
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
          Pre-filled from <span className="font-medium text-ink">{scopeLabel}</span> — change any value and watch the
          three factors and the final OEE re-flow.
        </p>

        {/* inputs */}
        <div className="mb-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <ExplainerInput label="Scheduled time" suffix="h" value={scheduled} min={0} step={0.5} onChange={setScheduled} />
          <ExplainerInput label="Downtime" suffix="h" value={downtime} min={0} step={0.5} onChange={setDowntime} />
          <ExplainerInput label="Ideal rate" suffix="t/h" value={idealRate} min={0} step={0.1} onChange={setIdealRate} />
          <ExplainerInput label="Actual output" suffix="t" value={actual} min={0} step={0.1} onChange={setActual} />
          <ExplainerInput label="Good output" suffix="t" value={good} min={0} step={0.1} onChange={setGood} />
        </div>
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:text-ink"
          >
            <Refresh size={13} />
            Reset to {machine ? `${machine}’s config` : 'plant defaults'}
          </button>
        </div>

        {/* diagram — scheduled-time label, 3 factor bars bridged by the
            derived quantities, and the stacked result on the right */}
        <div className="grid grid-cols-[auto_1fr_minmax(5.5rem,auto)_1fr_minmax(5.5rem,auto)_1fr_minmax(5.5rem,auto)_1.25fr] items-end gap-1.5 sm:gap-2">
          {/* left axis: scheduled time */}
          <div className="flex flex-col items-end justify-center self-stretch pb-16 pr-1">
            <p className="max-w-[4.5rem] text-right text-[0.625rem] leading-tight text-muted">Scheduled time</p>
            <p className="text-sm font-bold tabular-nums text-ink">{fmt(scheduled)}h</p>
          </div>

          <FactorBar
            name="Availability"
            color={COLORS.availability}
            pct={a}
            lossTitle="Downtime"
            lossValue={`${fmt(downClamped)}h`}
            mainTitle="Uptime"
            mainValue={`${fmt(uptime)}h`}
          />
          <GapCol symbol="×" caption="Max potential output during uptime" value={`${fmt(maxPotential)} t`} />
          <FactorBar
            name="Performance"
            color={COLORS.performance}
            pct={p}
            lossTitle="Perf. loss"
            lossValue={`${fmt(perfLossT)} t`}
            mainTitle="Actual output"
            mainValue={`${fmt(actualClamped)} t`}
          />
          <GapCol symbol="×" caption="Actual output" value={`${fmt(actualClamped)} t`} />
          <FactorBar
            name="Quality"
            color={COLORS.quality}
            pct={q}
            lossTitle="Scrap"
            lossValue={`${fmt(scrapT)} t`}
            mainTitle="Good products"
            mainValue={`${fmt(goodClamped)} t`}
          />
          <GapCol symbol="=" caption="Good products" value={`${fmt(goodClamped)} t`} />
          <OeeBar a={availLoss} p={perfLoss} q={qualLoss} oee={oee} />
        </div>

        {/* formula line */}
        <p className="mt-5 border-t border-line pt-3 text-center text-sm">
          <span className="text-muted">Availability </span>
          <span className="font-semibold" style={{ color: COLORS.availability }}>
            {fmt(a * 100)}%
          </span>
          <span className="text-muted"> × Performance </span>
          <span className="font-semibold" style={{ color: COLORS.performance }}>
            {fmt(p * 100)}%
          </span>
          <span className="text-muted"> × Quality </span>
          <span className="font-semibold" style={{ color: COLORS.quality }}>
            {fmt(q * 100)}%
          </span>
          <span className="text-muted"> = </span>
          <span className="font-bold text-ink">OEE {fmt(oee * 100)}%</span>
        </p>
        <p className="mt-1 text-center text-xs text-muted">
          OEE is the share of the scheduled time that became good product at the ideal rate.
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

const BAR_H = '15rem'

// One factor column: light "loss" segment on top (annotated), solid value
// below (annotated) — the numbers live inside the segments like the drawing.
function FactorBar({
  name,
  color,
  pct,
  lossTitle,
  lossValue,
  mainTitle,
  mainValue,
}: {
  name: string
  color: string
  pct: number // 0–1
  lossTitle: string
  lossValue: string
  mainTitle: string
  mainValue: string
}) {
  const valuePct = Math.max(0, Math.min(1, pct)) * 100
  const lossPct = 100 - valuePct
  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full max-w-[6.5rem] flex-col overflow-hidden rounded-lg" style={{ height: BAR_H }}>
        <div
          className="flex w-full flex-col items-center justify-center transition-all duration-500"
          style={{ height: `${lossPct}%`, background: `color-mix(in oklab, ${color} 22%, white)` }}
          title={`${lossTitle} ${lossValue}`}
        >
          {lossPct >= 14 && (
            <>
              <span className="px-1 text-center text-xs font-bold tabular-nums" style={{ color }}>
                {fmt(lossPct)}%
              </span>
              <span className="px-1 text-center text-[0.625rem] font-medium leading-tight" style={{ color }}>
                {lossTitle} {lossValue}
              </span>
            </>
          )}
          {lossPct >= 7 && lossPct < 14 && (
            <span className="px-1 text-center text-[0.6875rem] font-semibold tabular-nums" style={{ color }}>
              {fmt(lossPct)}%
            </span>
          )}
        </div>
        <div
          className="flex w-full flex-col items-center justify-center transition-all duration-500"
          style={{ height: `${valuePct}%`, background: color }}
          title={`${mainTitle} ${mainValue}`}
        >
          {valuePct >= 14 && (
            <>
              <span className="px-1 text-center text-base font-bold tabular-nums text-white">{fmt(valuePct)}%</span>
              <span className="px-1 text-center text-[0.625rem] font-medium leading-tight text-white/90">
                {mainTitle} {mainValue}
              </span>
            </>
          )}
          {valuePct >= 7 && valuePct < 14 && (
            <span className="px-1 text-center text-xs font-bold tabular-nums text-white">{fmt(valuePct)}%</span>
          )}
        </div>
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-ink">
        {name} <span className="tabular-nums" style={{ color }}>{fmt(valuePct)}%</span>
      </p>
    </div>
  )
}

// Bridge column between two bars: the operator + the quantity that flows
// from one factor into the next.
function GapCol({ symbol, caption, value }: { symbol: string; caption: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 self-stretch pb-16">
      <span className="text-xl font-semibold text-muted" aria-hidden>
        {symbol}
      </span>
      <p className="max-w-[6.5rem] text-center text-[0.625rem] leading-tight text-muted">{caption}</p>
      <p className="text-center text-xs font-bold tabular-nums text-ink">{value}</p>
    </div>
  )
}

// The stacked result: the three losses on top, OEE at the bottom, with a
// 100% reference at the top of the column.
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
      <p className="mb-1 text-[0.625rem] font-medium tabular-nums text-faint">100% of scheduled time</p>
      <div className="flex w-full max-w-[9rem] flex-col overflow-hidden rounded-lg" style={{ height: BAR_H }}>
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex w-full flex-col items-center justify-center transition-all duration-500"
            style={{ height: `${r.pct}%`, background: r.bg }}
            title={`${r.label} · ${fmt(r.pct)}%`}
          >
            {r.pct >= 13 && (
              <>
                <span className="px-1 text-center text-[0.625rem] font-semibold leading-tight" style={{ color: r.fg }}>
                  {r.label === 'OEE' ? `${fmt(r.pct)}% = OEE` : r.label}
                </span>
                {r.label !== 'OEE' && (
                  <span className="px-1 text-center text-[0.625rem] font-bold tabular-nums" style={{ color: r.fg }}>
                    {fmt(r.pct)}%
                  </span>
                )}
              </>
            )}
            {r.pct >= 6 && r.pct < 13 && (
              <span className="px-1 text-center text-[0.5625rem] font-semibold leading-none" style={{ color: r.fg }}>
                {r.label === 'OEE' ? `${fmt(r.pct)}%` : `${r.label} ${fmt(r.pct)}%`}
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-ink">
        OEE <span className="tabular-nums" style={{ color: '#b8940a' }}>{fmt(oee * 100)}%</span>
      </p>
    </div>
  )
}
