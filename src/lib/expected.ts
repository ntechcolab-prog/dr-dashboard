// Expected (target) vs current (latest measured) for a Results variable.
//
// Values are user-typed strings and the plant writes decimals both ways
// ("1,60" and "1.60"), so every comparison goes through parseNumeric first and
// silently gives up when a value is not a number — a target of "clear" or
// "pass" still displays, it just has no delta.

import type { ResultRow } from '../data/batchForm'

export function parseNumeric(raw: string | undefined): number | null {
  if (!raw) return null
  const n = Number(raw.trim().replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/** Latest measurement for a variable: the last row that has a value for it. */
export function latestValue(rows: ResultRow[], variable: string): string {
  for (let i = rows.length - 1; i >= 0; i--) {
    const v = rows[i].values[variable]
    if (v != null && v !== '') return v
  }
  return ''
}

/** Format a number back in the comma style the app uses, without trailing zeros. */
export function formatNumber(n: number): string {
  return n.toFixed(3).replace(/\.?0+$/, '').replace('.', ',')
}

/** Signed difference between the current value and its target, or null when
 *  either side is missing or not numeric. */
export function delta(expected: string | undefined, current: string | undefined): number | null {
  const e = parseNumeric(expected)
  const c = parseNumeric(current)
  return e == null || c == null ? null : c - e
}

/** "+0,24" / "-0,19" / "0" — the label shown under the current value. */
export function deltaLabel(expected: string | undefined, current: string | undefined): string | null {
  const d = delta(expected, current)
  if (d == null) return null
  if (d === 0) return '0'
  const rounded = Math.round(d * 1000) / 1000
  if (rounded === 0) return '0'
  return `${rounded > 0 ? '+' : '-'}${formatNumber(Math.abs(rounded))}`
}
