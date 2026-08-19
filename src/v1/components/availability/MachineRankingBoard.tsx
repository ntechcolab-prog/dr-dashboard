import { useMemo, useState } from 'react'
import { availabilityService, type MachineRankRow } from '../../../shared/data/availabilityData'
import { useAvailabilitySettings } from '../../../shared/lib/availability'
import { MACHINES } from '../../../shared/data/mockData'
import { ChevronLeft, ChevronRight } from '../../icons/Icons'

const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
// Fixed label-zone height so the bars and the goal line share one vertical scale.
const LABEL_H = '3.75rem'

// Attack-focus board: worst-performing machines first, column chart, rich
// detail on hover. Stands on its own at the top of the Machine tab, above the
// filters — independent from the per-machine ranking card below.
export default function MachineRankingBoard() {
  const [settings] = useAvailabilitySettings()
  const goal = settings.monthlyGoalPct

  const now = new Date()
  // Own month selector — never steps into the future (no future data).
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())
  const atCurrent = year === now.getFullYear() && month === now.getMonth()

  const step = (dir: number) => {
    let m = month + dir
    let y = year
    if (m < 0) {
      m = 11
      y--
    } else if (m > 11) {
      m = 0
      y++
    }
    // Block stepping past the current month.
    if (y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth())) return
    setMonth(m)
    setYear(y)
  }

  const rows = useMemo(
    () => availabilityService.machineRankingDetailed(year, month, MACHINES),
    [year, month]
  )

  const [hover, setHover] = useState<number | null>(null)
  const belowCount = rows.filter((r) => r.pct < goal).length

  return (
    <section className="rounded-xl border border-line/70 bg-card p-5 shadow-card">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink">Availability Ranking</h3>
          <p className="mt-0.5 text-xs text-muted">
            Lowest availability first — prioritize the top of the list.
            {belowCount > 0 && (
              <>
                {' '}
                <span className="font-semibold text-warning">{belowCount}</span> below the {goal}% goal.
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => step(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-page hover:text-ink"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[7.5rem] text-center text-sm font-medium text-ink">
            {MONTH_LABELS[month]} {year}
          </span>
          <button
            onClick={() => step(1)}
            disabled={atCurrent}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted enabled:hover:bg-page enabled:hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next month"
            title={atCurrent ? 'No future data' : undefined}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* column chart — machines side by side, worst on the left */}
      <div className="mt-5 flex items-stretch gap-2" style={{ height: 248 }}>
        {/* y-axis scale */}
        <div className="relative w-7 shrink-0 text-right text-[0.625rem] tabular-nums text-faint">
          <span className="absolute right-0 top-0">100%</span>
          <span
            className="absolute right-0 text-primary/70"
            style={{ bottom: `calc(${LABEL_H} + (100% - ${LABEL_H}) * ${goal / 100} - 0.5rem)` }}
          >
            {goal}%
          </span>
          <span className="absolute right-0" style={{ bottom: LABEL_H }}>
            0%
          </span>
        </div>

        {/* plot with goal reference line */}
        <div className="relative flex flex-1 items-end gap-1.5">
          <div
            className="pointer-events-none absolute inset-x-0 z-0 border-t border-dashed border-primary/40"
            style={{ bottom: `calc(${LABEL_H} + (100% - ${LABEL_H}) * ${goal / 100})` }}
          />
          {rows.map((r, i) => (
            <RankColumn
              key={r.machine}
              row={r}
              goal={goal}
              active={hover === i}
              align={i < rows.length / 2 ? 'left' : 'right'}
              onEnter={() => setHover(i)}
              onLeave={() => setHover(null)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function RankColumn({
  row,
  goal,
  active,
  align,
  onEnter,
  onLeave,
}: {
  row: MachineRankRow
  goal: number
  active: boolean
  align: 'left' | 'right'
  onEnter: () => void
  onLeave: () => void
}) {
  const below = row.pct < goal
  const color = below ? 'var(--color-warning)' : 'var(--color-primary)'
  const gap = row.pct - goal
  const alignCls = align === 'left' ? 'left-0' : 'right-0'

  return (
    <div
      className={`relative z-10 flex h-full flex-1 flex-col items-center rounded-lg ${active ? 'bg-page/60' : ''}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      tabIndex={0}
    >
      {/* bar track (fills the column height minus the label zone) */}
      <div className="flex w-full flex-1 items-end justify-center">
        <div className="flex h-full w-full max-w-[3rem] items-end">
          <div
            className="w-full rounded-t-md"
            style={{
              height: `${Math.max(row.pct, 3)}%`,
              background: `linear-gradient(180deg, color-mix(in oklab, ${color} 84%, white) 0%, ${color} 100%)`,
              transition: 'height 0.6s cubic-bezier(0.22,1,0.36,1)',
              filter: active ? 'saturate(1.15) brightness(1.04)' : undefined,
            }}
          />
        </div>
      </div>

      {/* label zone — fixed height so bars + goal line share one scale */}
      <div className="flex w-full flex-col items-center justify-start gap-0.5 pt-1.5" style={{ height: LABEL_H }}>
        <span className={`text-xs font-bold tabular-nums ${below ? 'text-warning' : 'text-up'}`}>{row.pct}%</span>
        <span className="w-full truncate px-0.5 text-center text-[0.6875rem] font-medium text-ink" title={row.machine}>
          {row.machine}
        </span>
        <span className="text-[0.625rem] tabular-nums text-faint">
          {row.executedH}/{row.plannedH}h
        </span>
      </div>

      {active && (
        <div
          className={`absolute top-0 z-30 w-52 rounded-lg border border-line bg-white p-3 text-left shadow-pop ${alignCls}`}
        >
          <p className="text-sm font-semibold text-ink">
            {row.machine}
            <span className="ml-2 font-normal text-muted">
              #{row.rank} of {row.total}
            </span>
          </p>
          <dl className="mt-2 space-y-1 text-xs">
            <Detail label="Availability">
              <span className={`font-semibold ${below ? 'text-warning' : 'text-up'}`}>{row.pct}%</span>
            </Detail>
            <Detail label="Goal">
              <span className={`font-semibold ${gap >= 0 ? 'text-up' : 'text-down'}`}>
                {gap === 0 ? 'On goal' : `${Math.abs(gap)}% ${gap > 0 ? 'above' : 'below'}`}
              </span>
            </Detail>
            <Detail label="Planned">
              <span className="tabular-nums text-ink">{row.plannedH}h</span>
            </Detail>
            <Detail label="Executed">
              <span className="tabular-nums text-ink">{row.executedH}h</span>
            </Detail>
          </dl>
        </div>
      )}
    </div>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}
