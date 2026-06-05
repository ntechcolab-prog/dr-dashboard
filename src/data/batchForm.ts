// Typed model for the "Batch Information" editor (the New Batch flow).

export interface ProductData {
  branch: string
  productType: string
  weight: string
  volume: string
  density: string
  processMode: string
  solidsContent: string
  details: string
}

export interface MachineData {
  name: string
  machineType: string
  equipment: string
  grindingTech: string
  innerLiner: string
  separationSystem: string
  sealingLiquid: string
  sieveSize: string
  beadMaterial: string
  bead1Type: string
  bead1Size: string
  bead1FillKg: string
  bead1FillPct: string
  bead2Type: string
  bead2Size: string
  bead2FillKg: string
  bead2FillPct: string
}

export interface PeriodData {
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}

export interface ResultRow {
  date: string
  time: string
  values: Record<string, string>
}

export interface ResultsData {
  variables: string[]
  rows: ResultRow[]
}

export interface NoteRow {
  date: string
  time: string
  comment: string
}

export interface RemarksData {
  notes: NoteRow[]
  conclusion: string
}

export interface ReportItem {
  id: string
  template: string
  createdAt: string
}

export interface BatchForm {
  id: string
  version: string
  product: ProductData
  machine: MachineData
  period: PeriodData
  results: ResultsData
  remarks: RemarksData
  reports: ReportItem[]
}

// Option lists for the select fields.
export const BRANCHES = ['A0 - Printing Inks', 'B1 - Coatings', 'C2 - Adhesives', 'D3 - Pigments']
export const PRODUCT_TYPES = ['01 - Offset Printing Inks', '02 - Flexo Inks', '03 - Gravure Inks', '04 - UV Inks']
export const PROCESS_MODES = ['Recirculation', 'Single Pass', 'Multi Pass']
export const SOLIDS = ['10%', '20%', '30%', '40%', '50%']
export const MACHINE_TYPES = ['Bead Mill', 'Basket Mill', 'Disc Mill', 'Pin Mill']
export const EQUIPMENTS = ['Alpha', 'Beta', 'Gamma']
export const GRINDING_TECH = ['Alpha', 'Zeta', 'Omega']
export const LINERS = ['EPDM', 'PU', 'Ceramic', 'Steel']
export const SEPARATIONS = ['0,1 mm', '0,2 mm', '0,3 mm']
export const SEALING_LIQUIDS = ['Monoetilenoglicol', 'Water', 'Glycol']
export const SIEVE_SIZES = ['0,2-04 mm', '0,4-06 mm', '0,6-08 mm']
export const BEAD_MATERIALS = ['Ceramic', 'Glass', 'Steel', 'Zirconium']
export const BEAD_TYPES = ['CeraBeads', 'ZircoBeads', 'GlassBeads']
export const RESULT_VARIABLES = ['d10', 'd50', 'd90', 'Viscosity', 'Fineness', 'pH', 'Temperature']

function pad(n: number): string {
  return String(n).padStart(4, '0')
}

// Build a fresh draft prefilled with realistic defaults (matches the Figma mock).
export function makeDraft(seq: number): BatchForm {
  return {
    id: `BA-${pad(seq)}`,
    version: '1.0',
    product: {
      branch: 'A0 - Printing Inks',
      productType: '01 - Offset Printing Inks',
      weight: '1.000',
      volume: '1.000',
      density: '10',
      processMode: 'Recirculation',
      solidsContent: '10%',
      details: '',
    },
    machine: {
      name: 'Pump',
      machineType: 'Bead Mill',
      equipment: 'Alpha',
      grindingTech: 'Alpha',
      innerLiner: 'EPDM',
      separationSystem: '0,2 mm',
      sealingLiquid: 'Monoetilenoglicol',
      sieveSize: '0,4-06 mm',
      beadMaterial: 'Ceramic',
      bead1Type: 'CeraBeads',
      bead1Size: '0.2',
      bead1FillKg: '66',
      bead1FillPct: '80',
      bead2Type: 'CeraBeads',
      bead2Size: '0.6',
      bead2FillKg: '50',
      bead2FillPct: '60',
    },
    period: {
      startDate: '2026-04-19',
      endDate: '2026-04-19',
      startTime: '10:15',
      endTime: '13:45',
    },
    results: {
      variables: ['d10', 'd50', 'd90'],
      rows: [
        { date: '19/11/2024', time: '10:15:00', values: { d10: '1,77', d50: '14', d90: '112' } },
        { date: '19/11/2024', time: '10:45:00', values: { d10: '0,795', d50: '2,2', d90: '5,56' } },
        { date: '19/11/2024', time: '11:15:00', values: { d10: '0,747', d50: '1,84', d90: '4,13' } },
        { date: '19/11/2024', time: '11:45:00', values: { d10: '0,656', d50: '1,60', d90: '2,31' } },
      ],
    },
    remarks: {
      notes: [
        { date: '26/05/2026', time: '10:30:00', comment: 'Increased the amount of blue pigment to reach the desired color intensity.' },
        { date: '26/05/2026', time: '14:30:00', comment: 'Solvent added more slowly to avoid foam formation.' },
        { date: '26/05/2026', time: '15:30:00', comment: 'Color shade verified under daylight — no correction needed.' },
      ],
      conclusion: '',
    },
    reports: [],
  }
}
