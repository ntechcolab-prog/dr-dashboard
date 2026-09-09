// ─── SHARED (v1 + v2) ────────────────────────────────────────────────────────
// KPI card visualizations — sparkline/bar/area marks, palette and captions.
// Framework-neutral SVG, so both the Tailwind cards (v1 MetricsGridV2) and the
// MUI cards (v2 MetricsGridV2Mui, KpiCardV2, CalendarV2, machine/*) render it.
// ⚠ Changing this affects BOTH versions of the app.
// ─────────────────────────────────────────────────────────────────────────────
import { useId, type ReactNode } from 'react'
import LineChart from './LineChart'
import { formatValue, type Kpi } from '../lib/compute'
import type { ChartType } from '../lib/availability'

// ── Shared metric visualization language ─────────────────────────────────────
// One viz per metric, used in two sizes: compact (KPI card) and detail (drawer).
// Centralizing it here keeps the card and the Details panel perfectly in sync.

export type VizKind = 'column' | 'area' | 'gauge' | 'donut' | 'compare' | 'bullet'

// Per-card chart-style override, persisted by the metrics grid and read back
// by the Details drawer so both always show the same chart style.
export type MetricStyleMap = Record<string, ChartType | ''>
export const METRIC_STYLE_KEY = 'dr-metrics-viz-style'

export const VIZ: Record<string, VizKind> = {
  production: 'column',
  size: 'area',
  totalEnergy: 'compare',
  productionRate: 'gauge',
  coolingEnergy: 'column',
  specificEnergy: 'bullet',
  carbon: 'area',
  ratio: 'donut',
  runningHours: 'area',
  passes: 'column',
  cycles: 'column',
}

export const VIZ_CAPTION: Record<string, string> = {
  production: 'batches / day',
  size: '30-day trend',
  totalEnergy: 'vs last month',
  productionRate: 'of best day',
  coolingEnergy: 'liters / day',
  specificEnergy: 'monthly range',
  carbon: '30-day trend',
  ratio: 'production vs idle',
  runningHours: '30-day trend',
  passes: 'passes / day',
  cycles: 'cycles / day',
}

export const META: Record<string, { accent: string; icon: ReactNode }> = {
  production: { accent: '#46aa9f', icon: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></> },
  size: { accent: '#3b82f6', icon: <><path d="M12 3v18" /><path d="m7 7 5-4 5 4" /><path d="M4 21h16" /><path d="M6 11h12l-2 6H8z" /></> },
  totalEnergy: { accent: '#f19909', icon: <polygon points="13 2 4 14 11 14 10 22 20 9 13 9 13 2" /> },
  productionRate: { accent: '#1aa367', icon: <><path d="M3 12a9 9 0 0 1 18 0" /><path d="m12 12 4-3" /><circle cx="12" cy="12" r="1.6" /></> },
  coolingEnergy: { accent: '#06b6d4', icon: <path d="M12 2.5S6 9 6 14a6 6 0 0 0 12 0c0-5-6-11.5-6-11.5Z" /> },
  specificEnergy: { accent: '#8b5cf6', icon: <><path d="M3 17l5-5 4 3 6-7" /><path d="M17 5h4v4" /></> },
  carbon: { accent: '#16a34a', icon: <><path d="M11 20A7 7 0 0 1 4 13c0-5 5-9 12-9 0 7-3 12-9 12Z" /><path d="M5 19c4-1 7-4 9-9" /></> },
  ratio: { accent: '#6366f1', icon: <><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 1 0 18Z" /></> },
  runningHours: { accent: '#0ea5e9', icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></> },
  passes: { accent: '#f97316', icon: <><path d="M3 12h12" /><path d="m11 7 5 5-5 5" /><path d="M20 4v16" /></> },
  cycles: { accent: '#a855f7', icon: <><path d="M20 12a8 8 0 1 1-2.3-5.6" /><path d="M20 3v5h-5" /></> },
}
const FALLBACK = { accent: '#46aa9f', icon: <circle cx="12" cy="12" r="8" /> }
export const metaFor = (key: string) => META[key] ?? FALLBACK

export const withAlpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

const prevOf = (kpi: Kpi) => (kpi.delta <= -100 ? 0 : kpi.value / (1 + kpi.delta / 100))

// ── Compact viz for the KPI card ─────────────────────────────────────────────
// `override` lets the user force a universal style (bar/line/area) per card,
// otherwise the per-metric default viz is used.
export function CardViz({ kpi, series, color, override }: { kpi: Kpi; series: number[]; color: string; override?: ChartType }) {
  if (override) {
    if (override === 'bar') return <Columns data={series} color={color} className="h-full" />
    if (override === 'line') return <Line data={series} color={color} className="h-full" />
    return <Area data={series} color={color} className="h-full" />
  }
  const kind = VIZ[kpi.key] ?? 'area'
  switch (kind) {
    case 'column':
      return <Columns data={series} color={color} className="h-full" />
    case 'compare':
      return <CompareBars current={kpi.value} previous={prevOf(kpi)} color={color} fmt={kpi.fmt} />
    case 'gauge': {
      const peak = Math.max(kpi.value, ...series, 1)
      return <RadialGauge pct={kpi.value / peak} color={color} className="h-full" />
    }
    case 'donut':
      return <DonutRing pct={Math.max(0, Math.min(1, kpi.value / 100))} color={color} className="h-full" />
    case 'bullet': {
      const max = Math.max(kpi.value, ...series, 1)
      const min = Math.min(kpi.value, ...(series.length ? series : [kpi.value]))
      const avg = series.length ? series.reduce((a, b) => a + b, 0) / series.length : kpi.value
      return <BulletBar value={kpi.value} min={min} max={max} avg={avg} color={color} />
    }
    default:
      return <Area data={series} color={color} className="h-full" />
  }
}

// ── Detail viz for the drawer — same style, larger ───────────────────────────
export function DetailViz({
  kpi,
  series,
  labels,
  color,
  override,
}: {
  kpi: Kpi
  series: number[]
  labels: string[]
  color: string
  override?: ChartType
}) {
  // A user-chosen style on the card wins here too (bar/line/area).
  if (override) {
    if (override === 'bar') return <ColumnsDetail data={series} labels={labels} color={color} unit={kpi.unit} />
    return <LineChart data={series} labels={labels} unit={kpi.unit} height={220} maxLabels={8} />
  }
  const kind = VIZ[kpi.key] ?? 'area'
  switch (kind) {
    case 'column':
      return <ColumnsDetail data={series} labels={labels} color={color} unit={kpi.unit} />
    case 'area':
      return <LineChart data={series} labels={labels} unit={kpi.unit} height={220} maxLabels={8} />
    case 'compare':
      return (
        <div className="px-1 py-2">
          <CompareBars current={kpi.value} previous={prevOf(kpi)} color={color} fmt={kpi.fmt} detail />
        </div>
      )
    case 'gauge': {
      const peak = Math.max(kpi.value, ...series, 1)
      return (
        <div className="py-2">
          <RadialGauge pct={kpi.value / peak} color={color} centerLabel={`${Math.round((kpi.value / peak) * 100)}%`} className="h-32" />
          <p className="mt-1 text-center text-xs text-muted">{formatValue(kpi.value, kpi.fmt)} {kpi.unit} · {Math.round((kpi.value / peak) * 100)}% of the best day</p>
        </div>
      )
    }
    case 'donut':
      return (
        <div className="py-2">
          <DonutRing pct={Math.max(0, Math.min(1, kpi.value / 100))} color={color} className="mx-auto h-32 w-32" />
          <p className="mt-1 text-center text-xs text-muted">Production time vs idle time</p>
        </div>
      )
    case 'bullet': {
      const max = Math.max(kpi.value, ...series, 1)
      const min = Math.min(kpi.value, ...(series.length ? series : [kpi.value]))
      const avg = series.length ? series.reduce((a, b) => a + b, 0) / series.length : kpi.value
      return (
        <div className="px-1 py-3">
          <BulletBar value={kpi.value} min={min} max={max} avg={avg} color={color} fmt={kpi.fmt} detail />
        </div>
      )
    }
    default:
      return <LineChart data={series} labels={labels} unit={kpi.unit} height={220} maxLabels={8} />
  }
}

// ── Primitives ───────────────────────────────────────────────────────────────

// Vertical columns (CSS, crisp at any size).
function Columns({ data, color, className }: { data: number[]; color: string; className?: string }) {
  if (!data.length) return <div className={className} />
  const max = Math.max(...data, 1)
  return (
    <div className={`flex items-end gap-px ${className ?? ''}`}>
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{ height: `${Math.max((v / max) * 100, v > 0 ? 3 : 0)}%`, background: color, opacity: 0.35 + 0.65 * (v / max) }}
        />
      ))}
    </div>
  )
}

function ColumnsDetail({ data, labels, color, unit }: { data: number[]; labels: string[]; color: string; unit: string }) {
  const max = Math.max(...data, 1)
  const peakIdx = data.indexOf(Math.max(...data))
  const ticks = labels.filter((_, i) => i % Math.max(1, Math.ceil(labels.length / 8)) === 0 || i === labels.length - 1)
  return (
    <div>
      <div className="mb-1 flex justify-between text-[0.625rem] tabular-nums text-faint">
        <span>peak {formatValue(max, 'dec1')} {unit}</span>
        <span>day {labels[peakIdx]}</span>
      </div>
      <Columns data={data} color={color} className="h-44" />
      <div className="mt-1.5 flex justify-between text-[0.625rem] tabular-nums text-faint">
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  )
}

// Area trend (compact card use; drawer area uses LineChart for axes).
function Area({ data, color, className }: { data: number[]; color: string; className?: string }) {
  const gid = useId().replace(/:/g, '')
  if (data.length < 2) return <div className={className} />
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const n = data.length
  const x = (i: number) => (i / (n - 1)) * 100
  const y = (v: number) => 30 - ((v - min) / range) * 26 + 2
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join(' ')
  const area = `${line} L 100 32 L 0 32 Z`
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className={`block w-full ${className ?? ''}`}>
      <defs>
        <linearGradient id={`spark-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.24} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

// Line sparkline (no fill) — the 'line' override style.
function Line({ data, color, className }: { data: number[]; color: string; className?: string }) {
  if (data.length < 2) return <div className={className} />
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const n = data.length
  const x = (i: number) => (i / (n - 1)) * 100
  const y = (v: number) => 30 - ((v - min) / range) * 26 + 2
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join(' ')
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className={`block w-full ${className ?? ''}`}>
      <path d={line} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

// Semicircular gauge.
function RadialGauge({ pct, color, centerLabel, className }: { pct: number; color: string; centerLabel?: string; className?: string }) {
  const p = Math.max(0, Math.min(1, pct))
  const r = 38
  const cx = 50
  const cy = 46
  const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
  return (
    <div className="flex h-full w-full items-center justify-center">
      <svg viewBox="0 0 100 54" className={`block ${className ?? 'h-12'}`}>
        <path d={d} fill="none" stroke="var(--color-page)" strokeWidth={8} strokeLinecap="round" />
        <path d={d} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 1`} style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.22,1,0.36,1)' }} />
        {centerLabel && (
          <text x={cx} y={cy - 4} textAnchor="middle" className="fill-ink" style={{ fontSize: 14, fontWeight: 700 }}>
            {centerLabel}
          </text>
        )}
      </svg>
    </div>
  )
}

// Percentage donut.
function DonutRing({ pct, color, className }: { pct: number; color: string; className?: string }) {
  const p = Math.max(0, Math.min(1, pct))
  const r = 22
  const c = 2 * Math.PI * r
  return (
    <div className="flex h-full w-full items-center justify-center">
      <svg viewBox="0 0 60 60" className={`block aspect-square ${className ?? 'h-12 w-12'}`}>
        <circle cx="30" cy="30" r={r} fill="none" stroke="var(--color-page)" strokeWidth={7} />
        <circle cx="30" cy="30" r={r} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeDasharray={`${(c * p).toFixed(2)} ${c.toFixed(2)}`} transform="rotate(-90 30 30)" style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.22,1,0.36,1)' }} />
        <text x="30" y="30" textAnchor="middle" dominantBaseline="central" className="fill-ink" style={{ fontSize: 13, fontWeight: 700 }}>
          {Math.round(p * 100)}%
        </text>
      </svg>
    </div>
  )
}

// Current vs previous month bars.
function CompareBars({ current, previous, color, fmt, detail }: { current: number; previous: number; color: string; fmt: Kpi['fmt']; detail?: boolean }) {
  const max = Math.max(current, previous, 1)
  const Row = ({ label, value, faded }: { label: string; value: number; faded?: boolean }) => (
    <div className="flex items-center gap-2">
      <span className={`shrink-0 font-medium uppercase tracking-wide text-faint ${detail ? 'w-12 text-[0.625rem]' : 'w-9 text-[0.5625rem]'}`}>{label}</span>
      <div className={`flex-1 overflow-hidden rounded-full bg-page ${detail ? 'h-4' : 'h-3'}`}>
        <div className="h-full rounded-full" style={{ width: `${Math.max((value / max) * 100, value > 0 ? 4 : 0)}%`, background: faded ? withAlpha(color, 0.35) : color, transition: 'width 0.55s cubic-bezier(0.22,1,0.36,1)' }} />
      </div>
      <span className={`shrink-0 text-right tabular-nums text-muted ${detail ? 'w-16 text-sm' : 'w-12 text-[0.625rem]'}`}>{formatValue(value, fmt)}</span>
    </div>
  )
  return (
    <div className={`flex flex-col justify-center ${detail ? 'gap-3' : 'h-full gap-2'}`}>
      <Row label="This" value={current} />
      <Row label="Last" value={previous} faded />
    </div>
  )
}

// Value positioned within the month's min–max range.
function BulletBar({ value, min, max, avg, color, fmt, detail }: { value: number; min: number; max: number; avg: number; color: string; fmt?: Kpi['fmt']; detail?: boolean }) {
  const range = max - min || 1
  const pos = (v: number) => Math.max(0, Math.min(100, ((v - min) / range) * 100))
  return (
    <div className={`flex flex-col justify-center ${detail ? 'gap-2' : 'h-full gap-2'}`}>
      {detail && (
        <p className="text-sm font-semibold text-ink">
          {formatValue(value, fmt ?? 'dec1')} <span className="text-xs font-normal text-muted">current</span>
        </p>
      )}
      <div className={`relative rounded-full ${detail ? 'h-4' : 'h-3'}`} style={{ background: withAlpha(color, 0.14) }}>
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pos(value)}%`, background: color, transition: 'width 0.55s cubic-bezier(0.22,1,0.36,1)' }} />
        <span className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-ink/40" style={{ left: `${pos(avg)}%` }} />
      </div>
      <div className={`flex justify-between font-medium uppercase tracking-wide text-faint ${detail ? 'text-[0.625rem]' : 'text-[0.5625rem]'}`}>
        <span>{detail ? `min ${formatValue(min, fmt ?? 'dec1')}` : 'min'}</span>
        <span>{detail ? `avg ${formatValue(avg, fmt ?? 'dec1')}` : 'avg'}</span>
        <span>{detail ? `max ${formatValue(max, fmt ?? 'dec1')}` : 'max'}</span>
      </div>
    </div>
  )
}
