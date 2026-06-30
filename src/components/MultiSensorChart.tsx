import { useRef, useState } from 'react'

// Shared multi-series sensor chart used by the Registry (Resume + Remarks).
// Y axes on BOTH sides, hover tooltip with every series value, optional
// per-series highlight (hovering its card), note markers with their own
// tooltip, and click-to-annotate support.

export interface SensorSeries {
  name: string
  color: string
  data: number[]
}

export interface ChartNote {
  frac: number // 0..1 along the plot width
  label: string // e.g. "19/06/2026 · 09:30"
  comment: string
}

interface Props {
  series: SensorSeries[]
  pointLabels: string[] // one label per data point (x axis / tooltip header)
  max: number
  height?: number
  highlight?: number | null // index of the hovered sensor card
  band?: [number, number] | null // status band between two point indexes
  notes?: ChartNote[]
  activeNote?: number | null // externally-driven note to emphasize (e.g. table row hover)
  markerFrac?: number | null // transient vertical guide at a fraction (0..1) of the plot
  onPlotClick?: (pointIndex: number) => void
}

const W = 880
const PAD_L = 44
const PAD_R = 44
const PAD_T = 14
const PAD_B = 28

export default function MultiSensorChart({
  series,
  pointLabels,
  max,
  height = 260,
  highlight = null,
  band = null,
  notes = [],
  activeNote = null,
  markerFrac = null,
  onPlotClick,
}: Props) {
  const H = height
  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B
  const n = series[0]?.data.length ?? 0
  const x = (i: number) => PAD_L + (i / Math.max(1, n - 1)) * plotW
  const y = (v: number) => PAD_T + plotH - (v / max) * plotH

  const wrapRef = useRef<HTMLDivElement>(null)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [noteHover, setNoteHover] = useState<number | null>(null)

  // Map a mouse position to the nearest data point (svg scales with width).
  const idxFromEvent = (e: React.MouseEvent): number | null => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect || n < 2) return null
    const svgX = ((e.clientX - rect.left) / rect.width) * W
    const t = (svgX - PAD_L) / plotW
    if (t < -0.04 || t > 1.04) return null
    return Math.max(0, Math.min(n - 1, Math.round(t * (n - 1))))
  }

  const fracOf = (i: number) => (x(i) / W) * 100

  // Tick values for both Y axes (quarter steps of the scale).
  const ticks = [0, 0.25, 0.5, 0.75, 1]

  // Which x labels get drawn (~6, always first and last).
  const every = Math.max(1, Math.ceil(n / 6))

  // A note is emphasized either by hovering its marker or from the outside
  // (e.g. hovering its row in the Notes table).
  const shownNote = noteHover != null ? noteHover : activeNote

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseMove={(e) => setHoverIdx(idxFromEvent(e))}
      onMouseLeave={() => setHoverIdx(null)}
      onClick={(e) => {
        const i = idxFromEvent(e)
        if (i != null) onPlotClick?.(i)
      }}
      style={{ cursor: onPlotClick ? 'copy' : undefined }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: H }}>
        {band && (
          <rect x={x(band[0])} y={PAD_T} width={x(band[1]) - x(band[0])} height={plotH} fill="#59d66e" opacity={0.08} />
        )}

        {/* gridlines + Y tick labels on BOTH sides */}
        {ticks.map((t, i) => {
          const yy = PAD_T + plotH * (1 - t)
          const tickValue = Math.round(max * t * 10) / 10
          return (
            <g key={i}>
              <line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={yy}
                y2={yy}
                stroke="var(--color-line)"
                strokeWidth={1}
                strokeDasharray={t === 0 ? undefined : '2 6'}
              />
              <text x={PAD_L - 8} y={yy + 3} textAnchor="end" className="fill-muted" style={{ fontSize: 9 }}>
                {tickValue}
              </text>
              <text x={W - PAD_R + 8} y={yy + 3} textAnchor="start" className="fill-muted" style={{ fontSize: 9 }}>
                {tickValue}
              </text>
            </g>
          )
        })}

        {/* hover guide */}
        {hoverIdx != null && (
          <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={PAD_T} y2={PAD_T + plotH} stroke="var(--color-ink)" strokeWidth={1} opacity={0.25} />
        )}

        {/* series (straight lines — discrete production data) */}
        {series.map((s, si) => {
          const dimmed = highlight != null && highlight !== si
          return (
            <polyline
              key={si}
              points={s.data.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
              fill="none"
              stroke={s.color}
              strokeWidth={highlight === si ? 3 : 2}
              strokeLinejoin="round"
              opacity={dimmed ? 0.18 : 1}
              pathLength={1}
              className="chart-line"
              style={{ animationDelay: `${si * 90}ms`, transition: 'opacity 0.2s, stroke-width 0.2s' }}
            />
          )
        })}

        {/* hover value dots */}
        {hoverIdx != null &&
          series.map((s, si) =>
            highlight != null && highlight !== si ? null : (
              <circle key={si} cx={x(hoverIdx)} cy={y(s.data[hoverIdx])} r={3.5} fill={s.color} stroke="#fff" strokeWidth={1.5} />
            )
          )}

        {/* note markers — pin + guide line */}
        {notes.map((nt, ni) => {
          const nx = PAD_L + nt.frac * plotW
          const active = shownNote === ni
          return (
            <g
              key={ni}
              onMouseEnter={() => setNoteHover(ni)}
              onMouseLeave={() => setNoteHover(null)}
              style={{ cursor: 'default' }}
            >
              <line
                x1={nx}
                x2={nx}
                y1={PAD_T + 8}
                y2={PAD_T + plotH}
                stroke="var(--color-primary)"
                strokeWidth={active ? 2 : 1}
                strokeDasharray={active ? undefined : '3 4'}
                opacity={active ? 0.9 : 0.55}
              />
              {active && <circle cx={nx} cy={PAD_T + 8} r={11} fill="var(--color-primary)" opacity={0.18} />}
              <circle cx={nx} cy={PAD_T + 8} r={active ? 7 : 5} fill="var(--color-primary)" stroke="#fff" strokeWidth={1.5} />
              <text x={nx} y={PAD_T + (active ? 11.5 : 11)} textAnchor="middle" fill="#fff" style={{ fontSize: active ? 8.5 : 7.5, fontWeight: 700 }}>
                {ni + 1}
              </text>
            </g>
          )
        })}

        {/* transient marker driven from outside (e.g. hovering a table row) */}
        {markerFrac != null && (
          <g>
            <line
              x1={PAD_L + markerFrac * plotW}
              x2={PAD_L + markerFrac * plotW}
              y1={PAD_T}
              y2={PAD_T + plotH}
              stroke="var(--color-ink)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              opacity={0.7}
            />
            <path
              d={`M ${PAD_L + markerFrac * plotW - 5} ${PAD_T} L ${PAD_L + markerFrac * plotW + 5} ${PAD_T} L ${PAD_L + markerFrac * plotW} ${PAD_T + 7} Z`}
              fill="var(--color-ink)"
            />
          </g>
        )}

        {/* x labels */}
        {pointLabels.map((lab, i) =>
          lab && (i % every === 0 || i === n - 1) ? (
            <text key={i} x={x(i)} y={H - 9} textAnchor="middle" className="fill-muted" style={{ fontSize: 9 }}>
              {lab}
            </text>
          ) : null
        )}
      </svg>

      {/* values tooltip (HTML, follows the hovered point) */}
      {hoverIdx != null && shownNote == null && (
        <div
          className="pointer-events-none absolute top-2 z-20 w-44 rounded-lg border border-line bg-white/95 p-2.5 shadow-pop backdrop-blur-sm"
          style={fracOf(hoverIdx) > 55 ? { right: `${100 - fracOf(hoverIdx) + 2}%` } : { left: `${fracOf(hoverIdx) + 2}%` }}
        >
          <p className="mb-1 text-[0.6875rem] font-semibold text-ink">{pointLabels[hoverIdx] || `Point ${hoverIdx + 1}`}</p>
          <dl className="space-y-0.5">
            {series.map((s, si) =>
              highlight != null && highlight !== si ? null : (
                <div key={si} className="flex items-center justify-between gap-2 text-[0.6875rem]">
                  <dt className="flex min-w-0 items-center gap-1.5 text-muted">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
                    <span className="truncate">{s.name}</span>
                  </dt>
                  <dd className="shrink-0 font-semibold tabular-nums text-ink">{s.data[hoverIdx]}</dd>
                </div>
              )
            )}
          </dl>
          {onPlotClick && <p className="mt-1.5 border-t border-line pt-1 text-[0.625rem] text-faint">Click to add a note here</p>}
        </div>
      )}

      {/* note tooltip */}
      {shownNote != null && notes[shownNote] && (
        <div
          className="pointer-events-none absolute top-2 z-30 w-52 rounded-lg border border-line bg-white/95 p-2.5 shadow-pop backdrop-blur-sm"
          style={
            (PAD_L + notes[shownNote].frac * plotW) / W > 0.55
              ? { right: `${100 - ((PAD_L + notes[shownNote].frac * plotW) / W) * 100 + 2}%` }
              : { left: `${((PAD_L + notes[shownNote].frac * plotW) / W) * 100 + 2}%` }
          }
        >
          <p className="text-[0.6875rem] font-semibold text-primary">Note {shownNote + 1} · {notes[shownNote].label}</p>
          <p className="mt-1 text-xs text-ink">{notes[shownNote].comment || '—'}</p>
        </div>
      )}
    </div>
  )
}
