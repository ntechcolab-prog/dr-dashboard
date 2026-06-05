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

export const REGISTRY_ROWS: RegistryRow[] = [
  { id: 'BATCH1234', product: 'Blue', start: '18/05/2026 - 10:30:00', end: '18/05/2026 - 12:30:00', line: 'Line A - Zeta', status: 'In progress', source: 'IRIS' },
  { id: 'BATCH1235', product: 'Blue', start: '18/05/2026 - 14:30:00', end: '18/05/2026 - 18:30:00', line: 'Line A - Zeta', status: 'In progress', source: 'IRIS' },
  { id: 'BATCH1236', product: 'Yellow', start: '17/05/2026 - 08:00:00', end: '17/05/2026 - 12:00:00', line: 'Line B - Beta', status: 'In progress', source: 'Manual' },
  { id: 'BATCH1237', product: 'Yellow', start: '17/05/2026 - 14:00:00', end: '17/05/2026 - 18:00:00', line: 'Line A - Zeta', status: 'Completed', source: 'IRIS' },
  { id: 'BATCH1238', product: 'Blues', start: '16/05/2026 - 07:30:00', end: '16/05/2026 - 12:30:00', line: 'Line B - Beta', status: 'Completed', source: 'Manual' },
  { id: 'BATCH1239', product: 'Green', start: '16/05/2026 - 15:30:00', end: '16/05/2026 - 17:30:00', line: 'Line A - Zeta', status: 'Completed', source: 'IRIS' },
  { id: 'BATCH1240', product: 'Yellow', start: '16/05/2026 - 18:30:00', end: '16/05/2026 - 22:30:00', line: 'Line A - Zeta', status: 'Completed', source: 'IRIS' },
  { id: 'BATCH1241', product: 'Green', start: '15/05/2026 - 09:00:00', end: '15/05/2026 - 13:00:00', line: 'Line B - Beta', status: 'Completed', source: 'Manual' },
  { id: 'BATCH1242', product: 'Blue', start: '15/05/2026 - 14:30:00', end: '15/05/2026 - 19:00:00', line: 'Line A - Zeta', status: 'Cancelled', source: 'IRIS' },
]

export interface MachineCard {
  name: string
  line: string
  subtitle: string
  installDate: string
  hours: string
  productFamily: string
  commission: string
  lastService: string
  upgrade?: boolean
}

export const MACHINE_CARDS: MachineCard[] = [
  { name: 'Discus 30', line: 'LINE 1', subtitle: '', installDate: '2024-08-20', hours: '10,345 h', productFamily: 'Wet Grinding', commission: '2801548-10', lastService: 'Feb 12, 2026' },
  { name: 'Zeta 60', line: '', subtitle: 'BLACK PRODUCTION ONLY', installDate: '2024-06-15', hours: '8,720 h', productFamily: 'Dispersing', commission: '15202462-20', lastService: 'Jan 28, 2026' },
  { name: 'MasterMix 45', line: 'LINE 3', subtitle: '', installDate: '2024-08-20', hours: '14,210 h', productFamily: 'Mixer', commission: '15202531-10', lastService: 'Dec 05, 2025' },
  { name: 'Alpha Zeta 10', line: '', subtitle: 'WHITE PRODUCTION ONLY', installDate: '2024-09-10', hours: '3,190 h', productFamily: 'Wet Grinding', commission: '80204882', lastService: 'Mar 10, 2026' },
  { name: 'ProPhi', line: 'LINE 4', subtitle: '', installDate: '2024-08-20', hours: '6,580 h', productFamily: 'Wet Grinding', commission: '15202530-10', lastService: 'Mar 01, 2026', upgrade: true },
]

export const SETTINGS_TABS = [
  'General',
  'Work Schedule',
  'Machines & Equipment',
  'Performance & OEE Rules',
  'User & Access Control',
  'Notifications & Alerts',
  'Data Export',
]

export const PRODUCTION_LINES = ['Production Line A', 'Production Line B', 'Production Line C']
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
