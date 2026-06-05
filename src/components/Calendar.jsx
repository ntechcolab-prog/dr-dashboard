import { useState, useEffect } from 'react'
import { ArrowUp, ArrowDown } from '../icons/Icons.jsx'

const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

// Build a matrix of weeks; each slot is a day number or null (padding).
function buildWeeks(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = new Date(year, month, 1).getDay() // 0 = Sun
  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export default function Calendar({ period, year, month, dayMap, avgMass, onDetails }) {
  const weeks = buildWeeks(year, month)
  const [weekIdx, setWeekIdx] = useState(0)

  // Keep the selected week valid when the month changes.
  useEffect(() => {
    setWeekIdx(0)
  }, [year, month])

  const visibleWeeks = period === 'weekly' ? [weeks[Math.min(weekIdx, weeks.length - 1)]] : weeks

  return (
    <section className="px-6 pb-6 pt-2">
      {period === 'weekly' && (
        <div className="mb-3 flex items-center justify-end gap-2 text-sm">
          <button
            onClick={() => setWeekIdx((i) => Math.max(0, i - 1))}
            disabled={weekIdx === 0}
            className="rounded-md border border-line px-3 py-1 text-muted enabled:hover:text-ink disabled:opacity-40"
          >
            ‹ Prev week
          </button>
          <span className="text-muted">Week {Math.min(weekIdx, weeks.length - 1) + 1} of {weeks.length}</span>
          <button
            onClick={() => setWeekIdx((i) => Math.min(weeks.length - 1, i + 1))}
            disabled={weekIdx >= weeks.length - 1}
            className="rounded-md border border-line px-3 py-1 text-muted enabled:hover:text-ink disabled:opacity-40"
          >
            Next week ›
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-line">
        <div className="grid grid-cols-7 border-b border-line bg-page/60">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-3 py-2.5 text-center text-[11px] font-semibold tracking-wide text-muted">
              {d}
            </div>
          ))}
        </div>

        {visibleWeeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((day, di) => (
              <DayCell
                key={di}
                day={day}
                data={day ? dayMap.get(day) : null}
                avgMass={avgMass}
                tall={period === 'weekly'}
                onDetails={onDetails}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

function DayCell({ day, data, avgMass, tall, onDetails }) {
  const empty = !day || !data
  return (
    <div
      className={`border-b border-r border-line last:border-r-0 ${tall ? 'min-h-[170px]' : 'min-h-[120px]'} ${
        empty ? 'bg-page/70' : 'bg-white'
      } p-3`}
    >
      {day && (
        <div className="flex h-full flex-col">
          <span className={`text-sm font-medium ${empty ? 'text-faint' : 'text-ink'}`}>
            {String(day).padStart(2, '0')}
          </span>

          {data && (
            <div className="mt-2 flex flex-1 flex-col gap-1 text-xs text-muted">
              <Metric up={data.mass >= avgMass} label={`${data.count} ${data.count === 1 ? 'batch' : 'batches'}`} />
              <Metric up={data.mass >= avgMass} label={`${(Math.round(data.mass * 10) / 10).toFixed(1)} ton`} />
              <Metric up={data.energy >= avgMass * 40} label={`${Math.round(data.energy)} kWh`} />
              <button
                onClick={() => onDetails(day, data)}
                className="mt-auto self-start text-xs font-medium text-primary hover:underline"
              >
                Details
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Metric({ up, label }) {
  return (
    <span className="flex items-center gap-1">
      <span className={up ? 'text-up' : 'text-down'}>
        {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      </span>
      {label}
    </span>
  )
}
