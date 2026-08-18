// Deterministic synthetic batch dataset for the Digital Reports dashboard.
// Seeded PRNG so the numbers are stable across reloads.

export interface Batch {
  id: string
  date: Date
  day: number
  month: number
  year: number
  machine: string
  recipe: string
  productionLine: string
  mass: number
  energy: number
  cooling: number
  grindMin: number
  setupMin: number
  idleMin: number
  alarmMin: number
  status: string
  interruption: string
  co2: number
}

export interface LiveBatch {
  id: string
  recipe: string
  machine: string
  productionLine: string
  energy: number
  progress: number
  state: 'Running' | 'Idle'
  // Detail fields surfaced in the "In Operation" modal.
  operator: string
  startedAt: string // HH:mm
  eta: string // HH:mm
  phase: string
  targetMass: number // ton
  currentMass: number // ton
  millSpeed: number // rpm
  productTemp: number // °C
  flowRate: number // l/min
  alarms: number
  events: { time: string; text: string }[]
}

export interface MonthMeta {
  key: string
  label: string
  year: number
  month: number
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

export let MACHINES = ['Zeta 10', 'Zeta 60', 'Zeta 25', 'Omega 5', 'Alpha 22', 'Neos 40']

// Fleet metadata for the machine filters (Settings › Production). Families
// mirror the NETZSCH mill lines; line assignment matches PRODUCTION_LINES.
export interface MachineInfo {
  name: string
  line: string
  family: string // mill family — filterable
  model: string // display subtitle
}

export let MACHINE_INFO: MachineInfo[] = [
  { name: 'Zeta 10', line: 'Production Line A', family: 'Zeta', model: 'Circulation bead mill' },
  { name: 'Zeta 60', line: 'Production Line A', family: 'Zeta', model: 'Circulation bead mill' },
  { name: 'Zeta 25', line: 'Production Line B', family: 'Zeta', model: 'Circulation bead mill' },
  { name: 'Omega 5', line: 'Production Line B', family: 'Omega', model: 'Economic bead mill' },
  { name: 'Alpha 22', line: 'Production Line C', family: 'Alpha', model: 'Agitator bead mill' },
  { name: 'Neos 40', line: 'Production Line C', family: 'Neos', model: 'High-performance mill' },
]

export let RECIPES = [
  'Dark Red',
  'White Chocolate',
  'Dark Chocolate',
  'Red Paint',
  'Black Paint',
  'Blue Paint',
  'Green Paint',
  'Milk Chocolate',
  'Yellow Pigment',
  'UV Coating',
]

export const STATUSES = [
  'Completed',
  'Completed before target',
  'Completed with target updates',
  'In operation',
  'Cancelled',
]

export const INTERRUPTIONS = [
  'Product finished',
  'Machine malfunction',
  'Product rejected',
  'Variation of raw material',
  'Others',
]

const PRODUCTION_LINES = ['Production Line A', 'Production Line B', 'Production Line C']

const pick = <T>(rng: () => number, arr: T[]): T => arr[Math.floor(rng() * arr.length)]
const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d

// Build batches across three months so period-over-period deltas are real.
function buildMonth(year: number, month: number /* 0-indexed */, seed: number): Batch[] {
  const rng = mulberry32(seed)
  const batches: Batch[] = []
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let serial = month * 1000 + 12000

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const weekday = date.getDay() // 0 = Sunday
    if (weekday === 0) continue // plants idle on Sundays in this mock

    const perDay = 2 + Math.floor(rng() * 3) // 2–4 batches
    for (let b = 0; b < perDay; b++) {
      const mass = round(0.4 + rng() * 1.2, 2) // ton
      const energy = round(28 + rng() * 34, 1) // kWh
      const statusRoll = rng()
      let status: string
      if (statusRoll > 0.94) status = 'Cancelled'
      else if (statusRoll > 0.82) status = 'Completed with target updates'
      else if (statusRoll > 0.62) status = 'Completed before target'
      else status = 'Completed'

      batches.push({
        id: `#${serial++}`,
        date,
        day,
        month,
        year,
        machine: pick(rng, MACHINES),
        recipe: pick(rng, RECIPES),
        productionLine: pick(rng, PRODUCTION_LINES),
        mass,
        energy,
        cooling: round(120 + rng() * 110, 0), // liters
        grindMin: Math.round(40 + rng() * 90), // active grinding minutes
        setupMin: Math.round(8 + rng() * 22),
        idleMin: Math.round(rng() * 30),
        alarmMin: Math.round(rng() * 12),
        status,
        interruption: pick(rng, INTERRUPTIONS),
        co2: round(mass * 4.2 + energy * 0.08, 3),
      })
    }
  }
  return batches
}

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** MonthMeta for a "YYYY-MM" key. Falls back to a synthesized month when the key
 *  is not in MONTHS — live mode can end up with no months at all (an org with no
 *  batches, or batch details that failed to load), and the dashboards used to
 *  read `.year` off the undefined result and take the whole app down. */
export function monthMetaFor(key: string): MonthMeta {
  const found = MONTHS.find((m) => m.key === key)
  if (found) return found
  const [rawYear, rawMonth] = key.split('-').map(Number)
  const now = new Date()
  const year = Number.isFinite(rawYear) ? rawYear : now.getFullYear()
  const monthIdx = Number.isFinite(rawMonth) && rawMonth >= 1 && rawMonth <= 12 ? rawMonth - 1 : now.getMonth()
  return { key, label: `${MONTH_LABELS[monthIdx]} ${year}`, year, month: monthIdx }
}

export let MONTHS: MonthMeta[] = [
  { key: '2025-09', label: 'September 2025', year: 2025, month: 8 },
  { key: '2025-10', label: 'October 2025', year: 2025, month: 9 },
  { key: '2025-11', label: 'November 2025', year: 2025, month: 10 },
  { key: '2025-12', label: 'December 2025', year: 2025, month: 11 },
  { key: '2026-01', label: 'January 2026', year: 2026, month: 0 },
  { key: '2026-02', label: 'February 2026', year: 2026, month: 1 },
  { key: '2026-03', label: 'March 2026', year: 2026, month: 2 },
  { key: '2026-04', label: 'April 2026', year: 2026, month: 3 },
  { key: '2026-05', label: 'May 2026', year: 2026, month: 4 },
  { key: '2026-06', label: 'June 2026', year: 2026, month: 5 },
]

export let ALL_BATCHES: Batch[] = MONTHS.flatMap((m) =>
  buildMonth(m.year, m.month, m.year * 10000 + (m.month + 1) * 100 + 1)
)

// Live batches for the "In operation" carousel (3 visible per page).
export let LIVE_BATCHES: LiveBatch[] = [
  {
    id: '#12031',
    recipe: 'Dark Red',
    machine: 'Zeta 10',
    productionLine: 'Production Line A',
    energy: 24.6,
    progress: 62,
    state: 'Running',
    operator: 'M. Hoffmann',
    startedAt: '06:40',
    eta: '14:10',
    phase: 'Grinding · pass 3 of 4',
    targetMass: 1.2,
    currentMass: 0.74,
    millSpeed: 1480,
    productTemp: 41.2,
    flowRate: 18.5,
    alarms: 0,
    events: [
      { time: '06:40', text: 'Batch started — recipe Dark Red loaded' },
      { time: '07:05', text: 'Setup completed, grinding pass 1 started' },
      { time: '09:32', text: 'Pass 2 completed — fineness within target' },
      { time: '11:48', text: 'Pass 3 started' },
    ],
  },
  {
    id: '#12032',
    recipe: 'Blue Paint',
    machine: 'Zeta 60',
    productionLine: 'Production Line B',
    energy: 18.1,
    progress: 35,
    state: 'Running',
    operator: 'A. Costa',
    startedAt: '08:15',
    eta: '16:45',
    phase: 'Grinding · pass 1 of 3',
    targetMass: 0.9,
    currentMass: 0.31,
    millSpeed: 1320,
    productTemp: 38.7,
    flowRate: 15.2,
    alarms: 1,
    events: [
      { time: '08:15', text: 'Batch started — recipe Blue Paint loaded' },
      { time: '08:40', text: 'Setup completed' },
      { time: '10:02', text: 'Alarm: product temperature high — auto-resolved' },
      { time: '10:10', text: 'Grinding resumed at reduced speed' },
    ],
  },
  {
    id: '#12033',
    recipe: 'White Chocolate',
    machine: 'Zeta 25',
    productionLine: 'Production Line C',
    energy: 9.4,
    progress: 18,
    state: 'Idle',
    operator: 'J. Tanaka',
    startedAt: '09:50',
    eta: '18:30',
    phase: 'Idle · waiting raw material',
    targetMass: 1.5,
    currentMass: 0.27,
    millSpeed: 0,
    productTemp: 29.3,
    flowRate: 0,
    alarms: 0,
    events: [
      { time: '09:50', text: 'Batch started — recipe White Chocolate loaded' },
      { time: '10:55', text: 'Grinding pass 1 started' },
      { time: '12:20', text: 'Paused — waiting for raw material refill' },
    ],
  },
  {
    id: '#12034',
    recipe: 'Black Paint',
    machine: 'Omega 5',
    productionLine: 'Production Line A',
    energy: 31.8,
    progress: 84,
    state: 'Running',
    operator: 'M. Hoffmann',
    startedAt: '05:10',
    eta: '12:55',
    phase: 'Grinding · final pass',
    targetMass: 1.1,
    currentMass: 0.92,
    millSpeed: 1510,
    productTemp: 43.8,
    flowRate: 19.1,
    alarms: 2,
    events: [
      { time: '05:10', text: 'Batch started — recipe Black Paint loaded' },
      { time: '06:25', text: 'Alarm: mill current spike — operator acknowledged' },
      { time: '08:50', text: 'Pass 2 completed' },
      { time: '11:15', text: 'Final pass started' },
      { time: '11:40', text: 'Alarm: cooling flow low — auto-resolved' },
    ],
  },
  {
    id: '#12035',
    recipe: 'Yellow Pigment',
    machine: 'Alpha 22',
    productionLine: 'Production Line B',
    energy: 12.7,
    progress: 47,
    state: 'Running',
    operator: 'L. Weber',
    startedAt: '07:30',
    eta: '15:20',
    phase: 'Grinding · pass 2 of 4',
    targetMass: 0.8,
    currentMass: 0.38,
    millSpeed: 1395,
    productTemp: 39.9,
    flowRate: 16.8,
    alarms: 0,
    events: [
      { time: '07:30', text: 'Batch started — recipe Yellow Pigment loaded' },
      { time: '07:55', text: 'Setup completed' },
      { time: '09:45', text: 'Pass 1 completed — fineness check OK' },
      { time: '10:20', text: 'Pass 2 started' },
    ],
  },
]

// --- Live-data injection -----------------------------------------------------
// The v2 app reads these datasets by import (live ES bindings). A live route can
// replace them with real backend data before rendering AppV2, so the SAME app
// shows real data. Defaults above stay in place for the mock routes.

let _liveMode = false

/** True once real datasets have been injected (used to flag metrics without a
 *  backend source, e.g. cooling/carbon, as "—"). */
export function isLiveMode(): boolean {
  return _liveMode
}

export function setLiveDatasets(d: {
  batches?: Batch[]
  months?: MonthMeta[]
  liveBatches?: LiveBatch[]
  machineInfo?: MachineInfo[]
  machines?: string[]
  recipes?: string[]
}): void {
  if (d.batches) ALL_BATCHES = d.batches
  if (d.months) MONTHS = d.months
  if (d.liveBatches) LIVE_BATCHES = d.liveBatches
  if (d.machineInfo) MACHINE_INFO = d.machineInfo
  if (d.machines) MACHINES = d.machines
  if (d.recipes) RECIPES = d.recipes
  _liveMode = true
}
