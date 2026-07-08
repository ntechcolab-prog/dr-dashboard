import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  useDashboardPrefs,
  useMachineAvailability,
  toISO,
  parseISO,
} from '../../lib/availability'
import { useHolidays } from '../../lib/holidays'
import { availabilityService, type SeriesResult } from '../../data/availabilityData'
import { MACHINES } from '../../data/mockData'
import AvailabilityGauge from '../AvailabilityGauge'
import AvailabilityChart from '../AvailabilityChart'
import HBars from '../HBars'
import Dropdown from '../Dropdown'
import { Pencil, ChevronLeft, ChevronRight } from '../../icons/Icons'
import ChartTypePicker from './ChartTypePicker'
import ChartDetailPanel from './ChartDetailPanel'

const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type CardKey = 'today' | 'yesterday' | 'goal' | 'month' | 'ranking' | 'year'
const CARD_KEYS: CardKey[] = ['today', 'yesterday', 'goal', 'month', 'ranking', 'year']

interface Props {
  // Machine picked in the Machine-tab dropdown — highlighted in the ranking.
  selectedMachine?: string
}

export default function AvailabilityDashboard({ selectedMachine }: Props) {
  // Scope every card to the selected machine's own availability config
  // (Settings › Production). Without a machine it falls back to the plant plan.
  const { settings, plan, workingHolidays } = useMachineAvailability(selectedMachine)
  const wh = { set: workingHolidays }
  const { typeFor, setCard } = useDashboardPrefs()

  const now = new Date()
  const todayIso = toISO(now)
  const yIso = toISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))

  // Month card owns its own month/year selector.
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewMonthYear, setViewMonthYear] = useState(now.getFullYear())
  // Year card owns its own year selector.
  const [viewYear, setViewYear] = useState(now.getFullYear())

  const [detail, setDetail] = useState<null | 'month' | 'year'>(null)

  // Edit mode — same interaction as the Batches metrics grid: drag to
  // reorder, remove cards, add them back, with cancel/discard protection.
  const [editMode, setEditMode] = useState(false)
  const [order, setOrder] = useState<CardKey[]>(CARD_KEYS)
  const [hidden, setHidden] = useState<Set<CardKey>>(new Set())
  const [dragKey, setDragKey] = useState<CardKey | null>(null)
  const [snapshot, setSnapshot] = useState<{ order: CardKey[]; hidden: Set<CardKey> } | null>(null)
  const [confirming, setConfirming] = useState(false)

  const enterEdit = () => {
    setSnapshot({ order: [...order], hidden: new Set(hidden) })
    setEditMode(true)
  }
  const done = () => {
    setEditMode(false)
    setConfirming(false)
    setSnapshot(null)
  }
  const dirty =
    !!snapshot &&
    (snapshot.order.join() !== order.join() ||
      snapshot.hidden.size !== hidden.size ||
      [...hidden].some((k) => !snapshot.hidden.has(k)))
  const cancel = () => {
    if (dirty) {
      setConfirming(true)
      return
    }
    done()
  }
  const discard = () => {
    if (snapshot) {
      setOrder([...snapshot.order])
      setHidden(new Set(snapshot.hidden))
    }
    done()
  }
  const hide = (key: CardKey) => setHidden((s) => new Set(s).add(key))
  const show = (key: CardKey) =>
    setHidden((s) => {
      const n = new Set(s)
      n.delete(key)
      return n
    })
  const reorder = (targetKey: CardKey) => {
    if (!dragKey || dragKey === targetKey) return
    setOrder((prev) => {
      const from = prev.indexOf(dragKey)
      const to = prev.indexOf(targetKey)
      if (from < 0 || to < 0) return prev
      const next = [...prev]
      next.splice(from, 1)
      next.splice(to, 0, dragKey)
      return next
    })
  }

  // Holidays: gather for every year referenced so service math is consistent.
  const hToday = useHolidays(now.getFullYear())
  const hMonth = useHolidays(viewMonthYear)
  const hYear = useHolidays(viewYear)

  const goal = settings.monthlyGoalPct

  const today = useMemo(
    () => availabilityService.day(todayIso, plan, settings, hToday.set, wh.set, selectedMachine),
    [todayIso, plan, settings, hToday.set, wh.set, selectedMachine]
  )
  const yesterday = useMemo(
    () => availabilityService.day(yIso, plan, settings, hToday.set, wh.set, selectedMachine),
    [yIso, plan, settings, hToday.set, wh.set, selectedMachine]
  )

  const monthSeries = useMemo(
    () => availabilityService.monthSeries(viewMonthYear, viewMonth, plan, settings, hMonth.set, wh.set, selectedMachine),
    [viewMonthYear, viewMonth, plan, settings, hMonth.set, wh.set, selectedMachine]
  )

  const yearSeries = useMemo(
    () => availabilityService.yearSeries(viewYear, plan, settings, hYear.set, wh.set, selectedMachine),
    [viewYear, plan, settings, hYear.set, wh.set, selectedMachine]
  )

  // Machine performance ranking — has its own month filter.
  const [rankMonth, setRankMonth] = useState(now.getMonth())
  const [rankYear, setRankYear] = useState(now.getFullYear())
  const stepRankMonth = (dir: number) => {
    let m = rankMonth + dir
    let y = rankYear
    if (m < 0) {
      m = 11
      y--
    } else if (m > 11) {
      m = 0
      y++
    }
    setRankMonth(m)
    setRankYear(y)
  }
  const ranking = useMemo(
    () => availabilityService.machineRanking(rankYear, rankMonth, MACHINES),
    [rankYear, rankMonth]
  )

  const monthType = typeFor('month')
  const yearType = typeFor('year')

  const stepMonth = (dir: number) => {
    let m = viewMonth + dir
    let y = viewMonthYear
    if (m < 0) {
      m = 11
      y--
    } else if (m > 11) {
      m = 0
      y++
    }
    setViewMonth(m)
    setViewMonthYear(y)
  }

  const yearOptions = useMemo(() => {
    const cy = now.getFullYear()
    return [cy - 2, cy - 1, cy, cy + 1].map(String)
  }, [now])

  // TASK-20: hover enrichment caption fields (avg availability + best/worst day).
  const monthCaption = useMemo(() => buildDailyCaption(monthSeries), [monthSeries])

  // --- card registry (key → title/span/toolbar/body) ---

  const cards: Record<CardKey, { title: string; className?: string; toolbar?: ReactNode; body: ReactNode }> = {
    today: {
      title: 'Today',
      body: (
        <>
          <TodayBars planned={today.planned} executed={today.executed} pct={today.pct} />
          <p className="mt-3 border-t border-line pt-2 text-center text-xs text-muted">
            {WEEKDAY_LONG[parseISO(todayIso).getDay()]} · {today.executed}h of {today.planned}h planned
          </p>
        </>
      ),
    },
    yesterday: {
      title: 'Yesterday',
      body: (
        <>
          <AvailabilityGauge value={yesterday.pct} label="Yesterday" goal={goal} />
          <p className="mt-2 text-center text-xs text-muted">
            {yesterday.executed}h executed · {yesterday.planned}h planned
          </p>
        </>
      ),
    },
    goal: {
      title: 'Goal',
      body: (
        <div className="flex h-full flex-col items-center justify-center py-4">
          <p className="text-5xl font-bold text-primary">{goal}%</p>
          <p className="mt-2 text-center text-sm text-muted">Monthly availability target</p>
          <p className="mt-1 text-center text-xs text-faint">
            Shown as the dashed line on the Month &amp; Year charts.
          </p>
        </div>
      ),
    },
    month: {
      title: 'Month',
      className: 'lg:col-span-2',
      toolbar: (
        <div className="flex items-center gap-1.5">
          {editMode && <ChartTypePicker value={monthType} onChange={(t) => setCard('month', t)} />}
          <button
            onClick={() => stepMonth(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-page hover:text-ink"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[7.5rem] text-center text-sm font-medium text-ink">
            {MONTH_LABELS[viewMonth]} {viewMonthYear}
          </span>
          <button
            onClick={() => stepMonth(1)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-page hover:text-ink"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      ),
      body: (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center justify-center">
            <AvailabilityGauge value={monthSeries.overallPct} label="Month" goal={goal} size="8rem" />
          </div>
          <button
            type="button"
            onClick={() => !editMode && setDetail('month')}
            className={`block w-full text-left ${editMode ? 'cursor-default' : 'cursor-pointer'}`}
            title={editMode ? undefined : 'Open detail'}
          >
            <AvailabilityChart
              labels={monthSeries.labels}
              values={monthSeries.pct}
              planned={monthSeries.planned}
              executed={monthSeries.executed}
              type={monthType}
              goal={goal}
              height={180}
              maxLabels={15}
            />
            <p className="mt-1 text-center text-[0.6875rem] text-faint">{monthCaption}</p>
          </button>
        </div>
      ),
    },
    ranking: {
      title: 'Machine Ranking',
      toolbar: (
        <div className="flex items-center gap-1">
          <button
            onClick={() => stepRankMonth(-1)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-page hover:text-ink"
            aria-label="Previous month (ranking)"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="min-w-[4.5rem] text-center text-xs font-medium text-ink">
            {MONTH_LABELS[rankMonth].slice(0, 3)} {rankYear}
          </span>
          <button
            onClick={() => stepRankMonth(1)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-page hover:text-ink"
            aria-label="Next month (ranking)"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      ),
      body: (
        <>
          <p className="text-xs text-muted">
            Performance vs goal {goal}%
            {selectedMachine ? (
              <>
                {' '}· <span className="font-semibold text-primary">{selectedMachine}</span> highlighted
              </>
            ) : null}
          </p>
          <div className="mt-3">
            <HBars
              items={ranking.map((r) => ({
                label: r.machine,
                value: r.pct,
                leftLabel: `${r.pct}%`,
                color: r.pct >= goal ? 'var(--color-primary)' : 'var(--color-warning)',
                dim: selectedMachine ? r.machine !== selectedMachine : undefined,
              }))}
              axisMax={100}
            />
          </div>
          <p className="mt-2 border-t border-line pt-2 text-center text-xs text-muted">
            Best: <span className="font-semibold text-ink">{ranking[0]?.machine}</span> ({ranking[0]?.pct}%)
          </p>
        </>
      ),
    },
    year: {
      title: 'Year',
      className: 'lg:col-span-3',
      toolbar: (
        <div className="flex items-center gap-1.5">
          {editMode && <ChartTypePicker value={yearType} onChange={(t) => setCard('year', t)} />}
          <Dropdown
            value={String(viewYear)}
            options={yearOptions}
            onChange={(v) => setViewYear(Number(v))}
            className="w-28"
          />
        </div>
      ),
      body: (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center justify-center">
            <AvailabilityGauge value={yearSeries.overallPct} label="Year" goal={goal} size="8rem" />
          </div>
          <button
            type="button"
            onClick={() => !editMode && setDetail('year')}
            className={`block w-full text-left ${editMode ? 'cursor-default' : 'cursor-pointer'}`}
            title={editMode ? undefined : 'Open detail'}
          >
            <AvailabilityChart
              labels={yearSeries.labels}
              values={yearSeries.pct}
              planned={yearSeries.planned}
              executed={yearSeries.executed}
              type={yearType}
              goal={goal}
              height={200}
            />
            <p className="mt-1 text-center text-[0.6875rem] text-faint">
              {buildMonthlyCaption(yearSeries)}
            </p>
          </button>
        </div>
      ),
    },
  }

  const visible = order.filter((k) => !hidden.has(k))
  const hiddenCards = order.filter((k) => hidden.has(k))

  return (
    <div>
      {/* dashboard toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink">Availability</h3>
        {editMode ? (
          <div className="no-print relative flex items-center gap-3">
            <button
              onClick={cancel}
              className="text-xs font-semibold uppercase tracking-wide text-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              onClick={done}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-primary-700"
            >
              Done
            </button>
            {confirming && (
              <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-line bg-white p-4 text-left shadow-pop">
                <p className="text-sm font-semibold text-ink">Discard changes?</p>
                <p className="mt-1 text-xs text-muted">
                  Your layout changes (removed, added or reordered cards) won't be saved.
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => setConfirming(false)}
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-muted hover:text-ink"
                  >
                    Keep editing
                  </button>
                  <button
                    onClick={discard}
                    className="rounded-md bg-down px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={enterEdit}
            className="no-print flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            <Pencil size={15} />
            Edit
          </button>
        )}
      </div>

      {editMode && (
        <div className="no-print mb-3 flex items-center gap-2 rounded-lg bg-page px-3 py-2 text-xs text-muted">
          Drag cards to reorder · tap <span className="font-semibold text-down">−</span> to remove · use{' '}
          <span className="font-semibold text-primary">+ Add</span> to bring cards back · pick the chart type on
          the Month/Year cards
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {visible.map((key, i) => {
          const c = cards[key]
          const dragging = dragKey === key
          return (
            <div
              key={key}
              draggable={editMode}
              onDragStart={() => setDragKey(key)}
              onDragEnter={() => reorder(key)}
              onDragOver={(e) => editMode && e.preventDefault()}
              onDragEnd={() => setDragKey(null)}
              onDrop={(e) => e.preventDefault()}
              className={`relative transition-opacity ${c.className ?? ''} ${
                editMode ? 'cursor-grab active:cursor-grabbing' : ''
              } ${dragging ? 'opacity-40' : editMode ? (i % 2 === 1 ? 'jiggle-alt' : 'jiggle') : ''}`}
            >
              {editMode && (
                <button
                  onClick={() => hide(key)}
                  className="absolute -left-2 -top-2 z-10 grid h-6 w-6 place-items-center rounded-full bg-down text-white shadow-md transition-transform hover:scale-110"
                  aria-label={`Remove ${c.title}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              )}
              <Card title={c.title} toolbar={c.toolbar} className={`h-full ${dragging ? 'border-primary' : ''}`}>
                {c.body}
              </Card>
            </div>
          )
        })}
        {editMode && <AddCard hidden={hiddenCards.map((k) => ({ key: k, title: cards[k].title }))} onAdd={show} />}
      </div>

      {/* TASK-19 — detail slide-over reflecting the same chart type */}
      <ChartDetailPanel
        open={detail === 'month'}
        onClose={() => setDetail(null)}
        title={`${MONTH_LABELS[viewMonth]} ${viewMonthYear} · Daily availability`}
        subtitle={`Planned vs executed · ${monthSeries.overallPct}% overall`}
        series={monthSeries}
        type={monthType}
        goal={goal}
        footer={monthCaption}
      />
      <ChartDetailPanel
        open={detail === 'year'}
        onClose={() => setDetail(null)}
        title={`${viewYear} · Monthly availability`}
        subtitle={`Planned vs executed · ${yearSeries.overallPct}% overall`}
        series={yearSeries}
        type={yearType}
        goal={goal}
        footer={buildMonthlyCaption(yearSeries)}
      />
    </div>
  )
}

// --- TASK-20: enrichment captions (avg + best/worst point) ---

function buildDailyCaption(s: SeriesResult): string {
  if (!s.pct.length) return ''
  const avg = Math.round(s.pct.reduce((a, b) => a + b, 0) / s.pct.length)
  let best = 0
  let worst = 0
  s.pct.forEach((v, i) => {
    if (v > s.pct[best]) best = i
    if (v < s.pct[worst]) worst = i
  })
  return `Avg ${avg}% · Best day ${s.labels[best]} (${s.pct[best]}%) · Worst day ${s.labels[worst]} (${s.pct[worst]}%)`
}

function buildMonthlyCaption(s: SeriesResult): string {
  if (!s.pct.length) return ''
  const avg = Math.round(s.pct.reduce((a, b) => a + b, 0) / s.pct.length)
  let best = 0
  let worst = 0
  s.pct.forEach((v, i) => {
    if (v > s.pct[best]) best = i
    if (v < s.pct[worst]) worst = i
  })
  return `Avg ${avg}% · Best ${s.labels[best]} (${s.pct[best]}%) · Worst ${s.labels[worst]} (${s.pct[worst]}%)`
}

// --- small building blocks ---

function Card({
  title,
  children,
  className = '',
  toolbar,
}: {
  title: string
  children: ReactNode
  className?: string
  toolbar?: ReactNode
}) {
  return (
    <div className={`flex flex-col rounded-xl border border-line/70 bg-card p-4 shadow-card ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-ink">{title}</p>
        {toolbar && <div className="no-print">{toolbar}</div>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

// Dashed "+ Add" tile listing removed cards (mirrors the Batches metrics grid).
function AddCard({ hidden, onAdd }: { hidden: { key: CardKey; title: string }[]; onAdd: (key: CardKey) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-full min-h-[10rem] w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-faint text-muted transition-colors hover:border-primary hover:text-primary"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span className="text-sm font-medium">Add</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-lg border border-line bg-white py-1 shadow-pop">
          {hidden.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted">All cards are shown.</p>
          ) : (
            hidden.map((c) => (
              <button
                key={c.key}
                onClick={() => {
                  onAdd(c.key)
                  if (hidden.length === 1) setOpen(false)
                }}
                className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-page"
              >
                {c.title}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function TodayBars({ planned, executed, pct }: { planned: number; executed: number; pct: number }) {
  const max = Math.max(planned, executed, 1)
  const below = pct < 100
  return (
    <div>
      <div className="flex items-end justify-center gap-8 py-3" style={{ height: 150 }}>
        <Bar label="Planned" value={planned} pctH={(planned / max) * 100} color="#cfe0dd" />
        <Bar label="Executed" value={executed} pctH={(executed / max) * 100} color={below ? '#f0b54d' : '#46aa9f'} />
      </div>
      <p className="text-center text-sm font-semibold text-ink">
        Availability <span className={below ? 'text-warning' : 'text-up'}>{Math.round(pct)}%</span>
      </p>
    </div>
  )
}

function Bar({ label, value, pctH, color }: { label: string; value: number; pctH: number; color: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-end">
      <span className="mb-1 text-xs font-semibold text-ink">{value}h</span>
      <div
        className="w-12 rounded-t-md"
        style={{ height: `${Math.max(pctH, 2)}%`, background: color, transition: 'height 0.6s cubic-bezier(0.22,1,0.36,1)' }}
      />
      <span className="mt-1.5 text-[0.6875rem] text-muted">{label}</span>
    </div>
  )
}
