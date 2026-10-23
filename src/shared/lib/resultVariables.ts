// Result variables catalog (Settings › Production).
//
// The list every batch picks its Expected Results / Results columns from.
// Batches store the variable *name*, so editing or deleting an entry here only
// changes what new batches can pick — measurements already recorded stay as
// they are.

import { useLocalStorage } from './useLocalStorage'
import { RESULT_VARIABLES } from '../data/batchForm'

export interface ResultVariable {
  name: string
  unit: string
}

const DEFAULT_UNITS: Record<string, string> = {
  d10: 'µm',
  d50: 'µm',
  d90: 'µm',
  Viscosity: 'mPa·s',
  Fineness: 'µm',
  pH: '',
  Temperature: '°C',
}

export const DEFAULT_RESULT_VARIABLES: ResultVariable[] = RESULT_VARIABLES.map((name) => ({
  name,
  unit: DEFAULT_UNITS[name] ?? '',
}))

const KEY = 'dr-result-variables'

export function useResultVariables() {
  return useLocalStorage<ResultVariable[]>(KEY, DEFAULT_RESULT_VARIABLES)
}

/** Case-insensitive lookup, so "D50" and "d50" are the same variable. */
export function findVariable(list: ResultVariable[], name: string): ResultVariable | undefined {
  const key = name.trim().toLowerCase()
  return list.find((v) => v.name.toLowerCase() === key)
}

/** The catalog's spelling of a typed name; a name it doesn't know joins it
 *  (no unit yet), so other batches and products can pick it too. */
export function ensureVariable(
  list: ResultVariable[],
  setList: (fn: (prev: ResultVariable[]) => ResultVariable[]) => void,
  typed: string,
): string {
  const name = typed.trim()
  const known = findVariable(list, name)
  if (known) return known.name
  setList((prev) => (findVariable(prev, name) ? prev : [...prev, { name, unit: '' }]))
  return name
}
