// Local holidays service (TASK-5).
//
// SWAP POINT: today this returns an embedded Brazilian national-holiday list so
// the planning calendar works offline and deterministically during the mock
// phase. `fetchHolidaysFromApi` is a ready-to-wire Nager.Date provider — flip
// `USE_LIVE_API` (or call it directly) once a real source is approved. The hook
// always resolves synchronously with the embedded set, then enriches from the
// API in the background if enabled, so the UI never blocks on the network.

import { useEffect, useState } from 'react'
import { useLocalStorage } from './useLocalStorage'

export interface Holiday {
  date: string // 'YYYY-MM-DD'
  name: string
}

// Brazilian national holidays (fixed + computed movable feasts) for 2025–2027.
// Curitiba/PR locale — municipal/state dates can be layered in later.
const BR_NATIONAL: Record<number, Holiday[]> = {
  2025: [
    { date: '2025-01-01', name: "New Year's Day" },
    { date: '2025-03-03', name: 'Carnival Monday' },
    { date: '2025-03-04', name: 'Carnival' },
    { date: '2025-04-18', name: 'Good Friday' },
    { date: '2025-04-21', name: 'Tiradentes' },
    { date: '2025-05-01', name: 'Labour Day' },
    { date: '2025-06-19', name: 'Corpus Christi' },
    { date: '2025-09-07', name: 'Independence Day' },
    { date: '2025-10-12', name: 'Our Lady of Aparecida' },
    { date: '2025-11-02', name: "All Souls' Day" },
    { date: '2025-11-15', name: 'Republic Proclamation' },
    { date: '2025-11-20', name: 'Black Awareness Day' },
    { date: '2025-12-25', name: 'Christmas' },
  ],
  2026: [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-02-16', name: 'Carnival Monday' },
    { date: '2026-02-17', name: 'Carnival' },
    { date: '2026-04-03', name: 'Good Friday' },
    { date: '2026-04-21', name: 'Tiradentes' },
    { date: '2026-05-01', name: 'Labour Day' },
    { date: '2026-06-04', name: 'Corpus Christi' },
    { date: '2026-09-07', name: 'Independence Day' },
    { date: '2026-10-12', name: 'Our Lady of Aparecida' },
    { date: '2026-11-02', name: "All Souls' Day" },
    { date: '2026-11-15', name: 'Republic Proclamation' },
    { date: '2026-11-20', name: 'Black Awareness Day' },
    { date: '2026-12-25', name: 'Christmas' },
  ],
  2027: [
    { date: '2027-01-01', name: "New Year's Day" },
    { date: '2027-02-08', name: 'Carnival Monday' },
    { date: '2027-02-09', name: 'Carnival' },
    { date: '2027-03-26', name: 'Good Friday' },
    { date: '2027-04-21', name: 'Tiradentes' },
    { date: '2027-05-01', name: 'Labour Day' },
    { date: '2027-05-27', name: 'Corpus Christi' },
    { date: '2027-09-07', name: 'Independence Day' },
    { date: '2027-10-12', name: 'Our Lady of Aparecida' },
    { date: '2027-11-02', name: "All Souls' Day" },
    { date: '2027-11-15', name: 'Republic Proclamation' },
    { date: '2027-11-20', name: 'Black Awareness Day' },
    { date: '2027-12-25', name: 'Christmas' },
  ],
}

const COUNTRY = 'BR'
const USE_LIVE_API = false

export function getLocalHolidays(year: number): Holiday[] {
  return BR_NATIONAL[year] ?? []
}

// Real provider (Nager.Date — free, no key). Not called unless USE_LIVE_API.
export async function fetchHolidaysFromApi(year: number, country = COUNTRY): Promise<Holiday[]> {
  const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`)
  if (!res.ok) throw new Error(`Holiday API ${res.status}`)
  const data: Array<{ date: string; localName: string; name: string }> = await res.json()
  return data.map((h) => ({ date: h.date, name: h.localName || h.name }))
}

// User-managed holidays (added/imported), persisted across years. Keyed by ISO
// date so it merges cleanly with the embedded national list.
type CustomMap = Record<string, string> // iso -> name

// Hook: embedded national list + user-added/imported holidays for the year,
// plus mutation helpers used by the Settings holidays section.
export function useHolidays(year: number) {
  const [custom, setCustom] = useLocalStorage<CustomMap>('dr-holidays-custom', {})
  const [apiCache, setApiCache] = useState<Holiday[] | null>(null)

  useEffect(() => {
    setApiCache(null)
    if (!USE_LIVE_API) return
    let alive = true
    fetchHolidaysFromApi(year)
      .then((list) => alive && list.length && setApiCache(list))
      .catch(() => {
        /* offline / API down — embedded list already in place */
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year])

  // Merge embedded (or API) + custom for this year, dedupe by date (custom wins).
  const base = apiCache ?? getLocalHolidays(year)
  const byDate = new Map<string, Holiday>()
  for (const h of base) byDate.set(h.date, h)
  for (const [date, name] of Object.entries(custom)) {
    if (date.startsWith(`${year}-`)) byDate.set(date, { date, name })
  }
  const holidays = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))

  const set = new Set(holidays.map((h) => h.date))
  const nameOf = (iso: string) => holidays.find((h) => h.date === iso)?.name
  const isCustom = (iso: string) => iso in custom

  // Add a single user holiday (TASK: "Add Holiday").
  const add = (date: string, name: string) =>
    setCustom((c) => ({ ...c, [date]: name.trim() || 'Holiday' }))

  // Remove a user-added holiday (only custom ones can be removed).
  const remove = (date: string) =>
    setCustom((c) => {
      const next = { ...c }
      delete next[date]
      return next
    })

  // Import the year's public holidays from the API and persist them (TASK:
  // "Import holidays"). Returns how many were added. Throws on network failure.
  const importYear = async (y: number = year): Promise<number> => {
    const list = await fetchHolidaysFromApi(y)
    let added = 0
    setCustom((c) => {
      const next = { ...c }
      for (const h of list) {
        if (!(h.date in next)) {
          next[h.date] = h.name
          added++
        }
      }
      return next
    })
    return added
  }

  return { holidays, set, nameOf, isCustom, add, remove, importYear } as const
}
