// Rule-based parser for the planning assistant (TASK-9). NO AI / LLM.
//
// Grammar (informal, case-insensitive, order/comma/"and"-tolerant):
//
//   <clause> := <weekday-list> ("for"? <hours>) ("h" | "hour" | "hours")?
//   <weekday-list> := one or more weekday names, separated by commas / "and" /
//                     spaces. Names accepted: full ("monday"), plural
//                     ("mondays"), or 3-letter ("mon"). Sun..Sat all supported.
//   <hours> := a number (integer or decimal) bound to the weekdays that
//              immediately precede it. "8h", "8 hours", "for 8", "4.5h" all work.
//   <bound> (optional, applies to the WHOLE sentence) :=
//                 "until day N"  | "until the Nth"  |  "until DD/MM"
//              |  "through day N" | "up to day N"   |  "until N"
//
// A sentence may contain several clauses. Each weekday gets the hours of the
// clause it appears in. Days beyond the bound (if any) are skipped; without a
// bound the rule fills the whole visible month.
//
// Example:
//   "Mondays, Tuesdays and Wednesdays for 8h, Thursdays and Fridays for 4h until day 20"
//   → Mon/Tue/Wed = 8h, Thu/Fri = 4h, applied to days 1..20.

import type { Weekday } from '../../lib/availability'

export interface ParsedRule {
  // weekday (0=Sun..6=Sat) → hours
  hoursByWeekday: Partial<Record<Weekday, number>>
  // inclusive day-of-month upper bound, or null = whole month
  untilDay: number | null
}

const WEEKDAY_TOKENS: Array<{ re: RegExp; day: Weekday }> = [
  { re: /\b(sun(day)?s?)\b/, day: 0 },
  { re: /\b(mon(day)?s?)\b/, day: 1 },
  { re: /\b(tue(s|sday|sdays|days)?s?)\b/, day: 2 },
  { re: /\b(wed(nesday)?s?)\b/, day: 3 },
  { re: /\b(thu(r|rs|rsday|rsdays|rsdays)?s?)\b/, day: 4 },
  { re: /\b(fri(day)?s?)\b/, day: 5 },
  { re: /\b(sat(urday)?s?)\b/, day: 6 },
]

// Find every weekday hit in a fragment, in order of appearance.
function weekdaysIn(fragment: string): Weekday[] {
  const hits: Array<{ idx: number; day: Weekday }> = []
  for (const { re, day } of WEEKDAY_TOKENS) {
    const m = re.exec(fragment)
    if (m) hits.push({ idx: m.index, day })
  }
  return hits.sort((a, b) => a.idx - b.idx).map((h) => h.day)
}

// Pull an "until …" day bound from the full sentence, if present.
function parseBound(text: string): number | null {
  // "until DD/MM" → day-of-month
  const dm = /\b(?:until|through|up to|till)\s+(\d{1,2})\s*\/\s*\d{1,2}\b/.exec(text)
  if (dm) return clampDay(Number(dm[1]))
  // "until day 20" / "until the 20th" / "until 20"
  const dn = /\b(?:until|through|up to|till)\s+(?:the\s+)?(?:day\s+)?(\d{1,2})(?:st|nd|rd|th)?\b/.exec(text)
  if (dn) return clampDay(Number(dn[1]))
  return null
}

function clampDay(n: number): number {
  return Math.max(1, Math.min(31, Math.round(n)))
}

// Split a sentence into clauses on commas / "and" / "&", then within each
// clause pair the trailing number with the weekdays named there. We carry a
// running "current hours" so "Mondays and Tuesdays for 8h" (where the hours sit
// in a later clause) still attaches to earlier weekdays in the same run.
export function parseAssistant(input: string): ParsedRule | null {
  const text = input.toLowerCase().trim()
  if (!text) return null

  const untilDay = parseBound(text)

  // Strip the bound phrase so its number isn't mistaken for hours.
  const body = text.replace(/\b(?:until|through|up to|till)\s+(?:the\s+)?(?:day\s+)?\d{1,2}(?:st|nd|rd|th)?(?:\s*\/\s*\d{1,2})?\b/g, ' ')

  // Tokenize into clauses separated by commas, semicolons, "and", "&".
  const clauses = body
    .split(/\s*(?:,|;|&|\band\b)\s*/)
    .map((c) => c.trim())
    .filter(Boolean)

  // First pass: for each clause capture its weekdays and any explicit hours.
  type Clause = { days: Weekday[]; hours: number | null }
  const parsed: Clause[] = clauses.map((c) => {
    const days = weekdaysIn(c)
    // hours: "for 8", "8h", "8 hours", "4.5", but only when a weekday is present
    // OR it's a standalone hours token following weekday clauses.
    const hm = /(?:for\s+)?(\d+(?:\.\d+)?)\s*(?:h\b|hours?\b)?/.exec(c)
    const hours = hm ? Number(hm[1]) : null
    return { days, hours }
  })

  // Second pass: weekdays without local hours inherit the hours of the next
  // clause (to the right) that carries hours — covers "Mon and Tue for 8h".
  const hoursByWeekday: Partial<Record<Weekday, number>> = {}
  for (let i = 0; i < parsed.length; i++) {
    const cl = parsed[i]
    if (!cl.days.length) continue
    let hrs = cl.hours
    if (hrs == null) {
      // Day-only clause (e.g. "Mondays" in "Mondays, Tuesdays for 8h"):
      // inherit the hours of the next clause to the right that carries them.
      for (let j = i + 1; j < parsed.length; j++) {
        if (parsed[j].hours != null) {
          hrs = parsed[j].hours
          break
        }
      }
    }
    if (hrs == null) continue
    for (const d of cl.days) hoursByWeekday[d] = hrs
  }

  if (Object.keys(hoursByWeekday).length === 0) return null
  return { hoursByWeekday, untilDay }
}
