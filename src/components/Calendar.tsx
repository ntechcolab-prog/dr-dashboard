import { ArrowUp, ArrowDown } from '../icons/Icons'
import type { DayRollup } from '../lib/compute'
import type { Period } from './Filters'
import { buildWeeks, type Cell } from '../lib/weeks'

const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

interface CalendarProps {
  period: Period
  year: number
  month: number
  weekIdx: number
  dayMap: Map<number, DayRollup>
  avgMass: number
  onDetails: (day: number, data: DayRollup) => void
}

export default function Calendar({ period, year, month, weekIdx, dayMap, avgMass, onDetails }: CalendarProps) {
  const weeks = buildWeeks(year, month)
  const safe = Math.min(weekIdx, weeks.length - 1)
  const visibleWeeks = period === 'weekly' ? [weeks[safe]] : weeks

  return (
    <section className="px-6 pb-6 pt-2">
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
                data={day ? dayMap.get(day) ?? null : null}
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

interface DayCellProps {
  day: Cell
  data: DayRollup | null
  avgMass: number
  tall: boolean
  onDetails: (day: number, data: DayRollup) => void
}

function DayCell({ day, data, avgMass, tall, onDetails }: DayCellProps) {
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

function Metric({ up, label }: { up: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={up ? 'text-up' : 'text-down'}>
        {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      </span>
      {label}
    </span>
  )
}
