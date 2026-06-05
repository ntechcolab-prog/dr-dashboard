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

export const MACHINES = ['Zeta 10', 'Zeta 60', 'Zeta 25', 'Omega 5']

export const RECIPES = [
  'Dark Red',
  'White Chocolate',
  'Dark Chocolate',
  'Red Paint',
  'Black Paint',
  'Blue Paint',
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

    const perDay = 1 + Math.floor(rng() * 2) // 1–2 batches
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

export const MONTHS: MonthMeta[] = [
  { key: '2026-02', label: 'February 2026', year: 2026, month: 1 },
  { key: '2026-03', label: 'March 2026', year: 2026, month: 2 },
  { key: '2026-04', label: 'April 2026', year: 2026, month: 3 },
]

export const ALL_BATCHES: Batch[] = [
  ...buildMonth(2026, 1, 20260201),
  ...buildMonth(2026, 2, 20260301),
  ...buildMonth(2026, 3, 20260401),
]

// Two live batches for the "In operation" strip.
export const LIVE_BATCHES: LiveBatch[] = [
  {
    id: '#12003',
    recipe: 'Dark Red',
    machine: 'Zeta 10',
    productionLine: 'Production Line A',
    energy: 20,
    progress: 50,
    state: 'Running',
  },
  {
    id: '#12003',
    recipe: 'Dark Red',
    machine: 'Zeta 60',
    productionLine: 'Production Line B',
    energy: 20,
    progress: 50,
    state: 'Idle',
  },
]
