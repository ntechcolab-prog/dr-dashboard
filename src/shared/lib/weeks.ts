// Week helpers shared by the Filters week selector and the Calendar grid.

export type Cell = number | null

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Matrix of weeks; each slot is a day number or null (padding).
export function buildWeeks(year: number, month: number): Cell[][] {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = new Date(year, month, 1).getDay() // 0 = Sun
  const cells: Cell[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: Cell[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

// "Apr 01 – 04" style label for a given week row.
export function weekLabel(_year: number, month: number, week: Cell[]): string {
  const days = week.filter((d): d is number => d !== null)
  if (!days.length) return '—'
  const first = String(days[0]).padStart(2, '0')
  const last = String(days[days.length - 1]).padStart(2, '0')
  return `${MONTH_SHORT[month]} ${first} – ${last}`
}
