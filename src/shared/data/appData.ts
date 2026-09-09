// Datasets for the Registry, Settings and Machine screens.

export interface RegistryRow {
  id: string
  product: string
  start: string
  end: string
  line: string
  status: 'In progress' | 'Completed' | 'Cancelled'
  source: 'IRIS' | 'Manual'
}

// The Registry demo dataset. `product` feeds the Recipe column and `line` the
// Machine column; both keep their field names because the live adapters map
// onto them. Enough rows here to page through (10 per page).
export let REGISTRY_ROWS: RegistryRow[] = [
  { id: 'BATCH1234', product: 'Blue Paint', start: '18/05/2026 - 07:30:00', end: '18/05/2026 - 11:30:00', line: 'Zeta 10', status: 'In progress', source: 'Manual' },
  { id: 'BATCH1235', product: 'White Chocolate', start: '18/05/2026 - 12:30:00', end: '18/05/2026 - 16:00:00', line: 'Zeta 60', status: 'In progress', source: 'IRIS' },
  { id: 'BATCH1236', product: 'Dark Chocolate', start: '18/05/2026 - 17:00:00', end: '18/05/2026 - 21:30:00', line: 'Zeta 25', status: 'In progress', source: 'IRIS' },
  { id: 'BATCH1237', product: 'Dark Chocolate', start: '17/05/2026 - 07:30:00', end: '17/05/2026 - 11:30:00', line: 'Omega 5', status: 'Completed', source: 'Manual' },
  { id: 'BATCH1238', product: 'Black Paint', start: '17/05/2026 - 12:30:00', end: '17/05/2026 - 16:00:00', line: 'Alpha 22', status: 'Completed', source: 'IRIS' },
  { id: 'BATCH1239', product: 'Blue Paint', start: '17/05/2026 - 17:00:00', end: '17/05/2026 - 21:30:00', line: 'Neos 40', status: 'Completed', source: 'IRIS' },
  { id: 'BATCH1240', product: 'Green Paint', start: '16/05/2026 - 07:30:00', end: '16/05/2026 - 11:30:00', line: 'Zeta 10', status: 'Completed', source: 'Manual' },
  { id: 'BATCH1241', product: 'Milk Chocolate', start: '16/05/2026 - 12:30:00', end: '16/05/2026 - 16:00:00', line: 'Zeta 60', status: 'Completed', source: 'IRIS' },
  { id: 'BATCH1242', product: 'Yellow Pigment', start: '16/05/2026 - 17:00:00', end: '16/05/2026 - 21:30:00', line: 'Zeta 25', status: 'Completed', source: 'IRIS' },
  { id: 'BATCH1243', product: 'Dark Red', start: '15/05/2026 - 07:30:00', end: '15/05/2026 - 11:30:00', line: 'Omega 5', status: 'Cancelled', source: 'Manual' },
  { id: 'BATCH1244', product: 'Dark Red', start: '15/05/2026 - 12:30:00', end: '15/05/2026 - 16:00:00', line: 'Alpha 22', status: 'Completed', source: 'IRIS' },
  { id: 'BATCH1245', product: 'White Chocolate', start: '15/05/2026 - 17:00:00', end: '15/05/2026 - 21:30:00', line: 'Neos 40', status: 'Completed', source: 'IRIS' },
  { id: 'BATCH1246', product: 'White Chocolate', start: '14/05/2026 - 07:30:00', end: '14/05/2026 - 11:30:00', line: 'Zeta 10', status: 'Completed', source: 'Manual' },
  { id: 'BATCH1247', product: 'Red Paint', start: '14/05/2026 - 12:30:00', end: '14/05/2026 - 16:00:00', line: 'Zeta 60', status: 'Completed', source: 'IRIS' },
  { id: 'BATCH1248', product: 'Black Paint', start: '14/05/2026 - 17:00:00', end: '14/05/2026 - 21:30:00', line: 'Zeta 25', status: 'Completed', source: 'IRIS' },
  { id: 'BATCH1249', product: 'Yellow Pigment', start: '13/05/2026 - 07:30:00', end: '13/05/2026 - 11:30:00', line: 'Omega 5', status: 'Completed', source: 'Manual' },
  { id: 'BATCH1250', product: 'Green Paint', start: '13/05/2026 - 12:30:00', end: '13/05/2026 - 16:00:00', line: 'Alpha 22', status: 'Completed', source: 'IRIS' },
  { id: 'BATCH1251', product: 'Milk Chocolate', start: '13/05/2026 - 17:00:00', end: '13/05/2026 - 21:30:00', line: 'Neos 40', status: 'Completed', source: 'IRIS' },
  { id: 'BATCH1252', product: 'White Chocolate', start: '12/05/2026 - 07:30:00', end: '12/05/2026 - 11:30:00', line: 'Zeta 10', status: 'Completed', source: 'Manual' },
  { id: 'BATCH1253', product: 'UV Coating', start: '12/05/2026 - 12:30:00', end: '12/05/2026 - 16:00:00', line: 'Zeta 60', status: 'Cancelled', source: 'IRIS' },
  { id: 'BATCH1254', product: 'Dark Red', start: '12/05/2026 - 17:00:00', end: '12/05/2026 - 21:30:00', line: 'Zeta 25', status: 'Completed', source: 'IRIS' },
  { id: 'BATCH1255', product: 'Blue Paint', start: '11/05/2026 - 07:30:00', end: '11/05/2026 - 11:30:00', line: 'Omega 5', status: 'Completed', source: 'Manual' },
  { id: 'BATCH1256', product: 'Dark Chocolate', start: '11/05/2026 - 12:30:00', end: '11/05/2026 - 16:00:00', line: 'Alpha 22', status: 'Completed', source: 'IRIS' },
  { id: 'BATCH1257', product: 'Red Paint', start: '11/05/2026 - 17:00:00', end: '11/05/2026 - 21:30:00', line: 'Neos 40', status: 'Completed', source: 'IRIS' },
]

export const SETTINGS_TABS = [
  'General',
  'Production',
  'Data Export',
]

export let PRODUCTION_LINES = ['Production Line A', 'Production Line B', 'Production Line C']
export const MACHINE_NAMES = ['ZETA', 'DISCUS', 'OMEGA', 'MASTERMIX']

// Machine-tab chart datasets (synthetic but plausible).
export const MACHINE_PRODUCTIVITY = [380, 470, 560, 590, 650, 700] // kg over days 01–06
export const TOTAL_ENERGY = [360, 470, 520, 560, 610, 660, 700] // kWh over time 01–07
export const AVAILABILITY = [92, 88, 95, 90, 86, 93, 89] // % over days 01–07

export const DOWNTIME_BY_GROUP = [
  { label: 'Work Arrangement', value: 8 },
  { label: 'Uncommented', value: 4 },
  { label: 'Maintenance', value: 4 },
  { label: 'Setup', value: 2 },
]

export const PERFORMANCE_BATCH = [
  { label: '8', value: 8 },
  { label: '6', value: 6 },
  { label: '5', value: 5 },
  { label: '4', value: 4 },
  { label: '4', value: 4 },
  { label: '4', value: 4 },
  { label: '4', value: 4 },
]

export const OEE = { target: 100, availability: 80, performance: 90, quality: 64 }

// --- Per-machine performance (drives the functional Machine tab) ---

export interface Series {
  labels: string[]
  data: number[]
  xLabel: string
}

export interface MachinePerf {
  oee: { target: number; availability: number; performance: number; quality: number }
  productivity: Series
  totalEnergy: Series
  availability: Series
  downtime: { label: string; value: number }[]
  performance: { label: string; value: number }[]
}

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function periodAxis(period: string): { n: number; labels: string[]; xLabel: string } {
  if (period === 'Today') {
    const labels = ['00', '03', '06', '09', '12', '15', '18', '21']
    return { n: labels.length, labels, xLabel: 'Hours' }
  }
  const n = period === '7 days' ? 7 : 30
  return { n, labels: Array.from({ length: n }, (_, i) => String(i + 1).padStart(2, '0')), xLabel: 'Days' }
}

export function machinePerformance(machine: string, line: string, period: string): MachinePerf {
  const rng = mulberry32(hashStr(`${machine}|${line}|${period}`))
  const { n, labels, xLabel } = periodAxis(period)

  let p = 280 + rng() * 200
  const productivity: number[] = []
  for (let i = 0; i < n; i++) {
    p += rng() * 80 - 12
    productivity.push(Math.max(60, Math.round(p)))
  }

  let e = 300 + rng() * 160
  const energy: number[] = []
  for (let i = 0; i < n; i++) {
    e += rng() * 70 - 12
    energy.push(Math.max(90, Math.round(e)))
  }

  const avail: number[] = []
  for (let i = 0; i < n; i++) avail.push(Math.round(78 + rng() * 20))

  const a = Math.round(72 + rng() * 22)
  const perf = Math.round(80 + rng() * 16)
  const q = Math.round(58 + rng() * 32)

  const downtime = [
    { label: 'Work Arrangement', value: Math.round(5 + rng() * 5) },
    { label: 'Uncommented', value: Math.round(2 + rng() * 4) },
    { label: 'Maintenance', value: Math.round(2 + rng() * 4) },
    { label: 'Setup', value: Math.round(1 + rng() * 3) },
  ].sort((x, y) => y.value - x.value)

  const performance = Array.from({ length: 7 }, () => Math.round(3 + rng() * 6)).sort((x, y) => y - x)

  return {
    oee: { target: 100, availability: a, performance: perf, quality: q },
    productivity: { labels, data: productivity, xLabel },
    totalEnergy: { labels, data: energy, xLabel },
    availability: { labels, data: avail, xLabel },
    downtime,
    performance: performance.map((v) => ({ label: String(v), value: v })),
  }
}

// --- Live-data injection (see mockData.setLiveDatasets) ---------------------
export function setLiveAppData(d: { registryRows?: RegistryRow[]; productionLines?: string[] }): void {
  if (d.registryRows) REGISTRY_ROWS = d.registryRows
  if (d.productionLines && d.productionLines.length) PRODUCTION_LINES = d.productionLines
}
