// Mock-but-plausible content for the remaining Settings tabs. Everything is
// persisted to localStorage; swap to a real settings service later.

import { FormSection, Field, TextInput, Textarea, SelectInput, NumberInput, ToggleRow } from '../../components/FormControls'
import { useLocalStorage } from '../../lib/useLocalStorage'

const TIMEZONES = ['America/Sao_Paulo', 'America/New_York', 'Europe/Berlin', 'Europe/London', 'Asia/Shanghai', 'UTC']
const LANGUAGES = ['English', 'Português (BR)', 'Deutsch', '中文']
const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']
const LANDING = ['Dashboard', 'Registry', 'Analysis']

// ── General ──────────────────────────────────────────────────────────────────

interface General {
  facilityName: string
  location: string
  timezone: string
  language: string
  units: 'Metric' | 'Imperial'
  dateFormat: string
  firstDayOfWeek: 'Sunday' | 'Monday'
  landingPage: string
  compactDensity: boolean
  showTips: boolean
  // Edition flag only — nothing reacts to it yet.
  productionMonitoring: boolean
}
const GENERAL_DEFAULTS: General = {
  facilityName: 'NETZSCH Grinding & Dispersing',
  location: 'Curitiba, PR — Brazil',
  timezone: 'America/Sao_Paulo',
  language: 'English',
  units: 'Metric',
  dateFormat: 'DD/MM/YYYY',
  firstDayOfWeek: 'Monday',
  landingPage: 'Dashboard',
  compactDensity: false,
  showTips: true,
  productionMonitoring: true,
}

// Read-only accessor for the edition flag — Production Monitoring features
// (Remarks tab, Resume alarm/event/log sections) hide when it's off.
export function useProductionMonitoring(): boolean {
  const [s] = useLocalStorage<General>('dr-settings-general', GENERAL_DEFAULTS)
  return s.productionMonitoring ?? true
}

export function GeneralSettings() {
  const [s, set] = useLocalStorage<General>('dr-settings-general', GENERAL_DEFAULTS)
  const f = <K extends keyof General>(k: K, v: General[K]) => set((p) => ({ ...p, [k]: v }))
  const pmOn = s.productionMonitoring ?? true
  return (
    <div className="flex flex-col gap-4">
      <FormSection title="Edition">
        <p className="mb-3 text-sm text-muted">
          Which edition this installation runs. This is a flag only for now — features don't change yet.
        </p>
        <div className="inline-flex rounded-lg bg-page p-1">
          {([
            [true, 'With Production Monitoring'],
            [false, 'Without Production Monitoring'],
          ] as const).map(([value, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => f('productionMonitoring', value)}
              aria-pressed={pmOn === value}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                pmOn === value ? 'bg-white text-primary shadow-card' : 'text-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </FormSection>

      <FormSection title="Organization">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Facility name">
            <TextInput value={s.facilityName} onChange={(v) => f('facilityName', v)} />
          </Field>
          <Field label="Location">
            <TextInput value={s.location} onChange={(v) => f('location', v)} />
          </Field>
          <Field label="Time zone">
            <SelectInput value={s.timezone} options={TIMEZONES} onChange={(v) => f('timezone', v)} />
          </Field>
          <Field label="Language">
            <SelectInput value={s.language} options={LANGUAGES} onChange={(v) => f('language', v)} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Regional & display">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Measurement units">
            <SelectInput value={s.units} options={['Metric', 'Imperial']} onChange={(v) => f('units', v as General['units'])} />
          </Field>
          <Field label="Date format">
            <SelectInput value={s.dateFormat} options={DATE_FORMATS} onChange={(v) => f('dateFormat', v)} />
          </Field>
          <Field label="First day of week">
            <SelectInput value={s.firstDayOfWeek} options={['Sunday', 'Monday']} onChange={(v) => f('firstDayOfWeek', v as General['firstDayOfWeek'])} />
          </Field>
          <Field label="Default landing page">
            <SelectInput value={s.landingPage} options={LANDING} onChange={(v) => f('landingPage', v)} />
          </Field>
        </div>
        <div className="mt-3">
          <ToggleRow label="Compact density" hint="Tighter spacing across tables and cards." on={s.compactDensity} onChange={(v) => f('compactDensity', v)} />
          <ToggleRow label="Show tips" hint="Display contextual hints and empty-state guidance." on={s.showTips} onChange={(v) => f('showTips', v)} />
        </div>
      </FormSection>
    </div>
  )
}

// ── Performance & OEE Rules ───────────────────────────────────────────────────

interface Oee {
  targetOee: number
  targetAvailability: number
  targetPerformance: number
  targetQuality: number
  shiftHours: number
  idealCycleMin: number
  microStopMin: number
  scrapPct: number
  excludePlannedDowntime: boolean
  countSetupAsDowntime: boolean
}
const OEE_DEFAULTS: Oee = {
  targetOee: 85,
  targetAvailability: 90,
  targetPerformance: 95,
  targetQuality: 99,
  shiftHours: 8,
  idealCycleMin: 95,
  microStopMin: 5,
  scrapPct: 2,
  excludePlannedDowntime: true,
  countSetupAsDowntime: false,
}

export function OeeRulesSettings() {
  const [s, set] = useLocalStorage<Oee>('dr-settings-oee', OEE_DEFAULTS)
  const f = <K extends keyof Oee>(k: K, v: Oee[K]) => set((p) => ({ ...p, [k]: v }))
  const pct = (k: keyof Oee, label: string) => (
    <Field label={label}>
      <NumberInput value={s[k] as number} suffix="%" min={0} max={100} onChange={(n) => f(k, Math.max(0, Math.min(100, n)) as Oee[typeof k])} />
    </Field>
  )
  return (
    <div className="flex flex-col gap-4">
      <FormSection title="OEE targets">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {pct('targetOee', 'Overall OEE')}
          {pct('targetAvailability', 'Availability')}
          {pct('targetPerformance', 'Performance')}
          {pct('targetQuality', 'Quality')}
        </div>
      </FormSection>

      <FormSection title="Calculation rules">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Field label="Shift duration">
            <NumberInput value={s.shiftHours} suffix="h" min={1} max={24} onChange={(n) => f('shiftHours', n)} />
          </Field>
          <Field label="Ideal cycle (grind)">
            <NumberInput value={s.idealCycleMin} suffix="min" min={1} onChange={(n) => f('idealCycleMin', n)} />
          </Field>
          <Field label="Micro-stop threshold">
            <NumberInput value={s.microStopMin} suffix="min" min={0} onChange={(n) => f('microStopMin', n)} />
          </Field>
          {pct('scrapPct', 'Scrap threshold')}
        </div>
        <div className="mt-3">
          <ToggleRow label="Exclude planned downtime from availability" hint="Scheduled maintenance won't count against availability." on={s.excludePlannedDowntime} onChange={(v) => f('excludePlannedDowntime', v)} />
          <ToggleRow label="Count setup time as downtime" hint="Treat batch setup as a loss in the availability calculation." on={s.countSetupAsDowntime} onChange={(v) => f('countSetupAsDowntime', v)} />
        </div>
      </FormSection>
    </div>
  )
}

// ── Notifications & Alerts ────────────────────────────────────────────────────

interface Notifs {
  email: boolean
  inApp: boolean
  sms: boolean
  onAlarm: boolean
  onAvailabilityBelowGoal: boolean
  onMaintenanceDue: boolean
  dailySummary: boolean
  summaryTime: string
  recipients: string
  quietFrom: string
  quietTo: string
}
const NOTIFS_DEFAULTS: Notifs = {
  email: true,
  inApp: true,
  sms: false,
  onAlarm: true,
  onAvailabilityBelowGoal: true,
  onMaintenanceDue: true,
  dailySummary: true,
  summaryTime: '07:00',
  recipients: 'gabriel.oliveira@netzsch.com',
  quietFrom: '20:00',
  quietTo: '06:00',
}

export function NotificationsSettings() {
  const [s, set] = useLocalStorage<Notifs>('dr-settings-notifs', NOTIFS_DEFAULTS)
  const f = <K extends keyof Notifs>(k: K, v: Notifs[K]) => set((p) => ({ ...p, [k]: v }))
  return (
    <div className="flex flex-col gap-4">
      <FormSection title="Channels">
        <ToggleRow label="Email" on={s.email} onChange={(v) => f('email', v)} />
        <ToggleRow label="In-app" on={s.inApp} onChange={(v) => f('inApp', v)} />
        <ToggleRow label="SMS" hint="Carrier charges may apply." on={s.sms} onChange={(v) => f('sms', v)} />
      </FormSection>

      <FormSection title="Triggers">
        <ToggleRow label="New alarm raised" on={s.onAlarm} onChange={(v) => f('onAlarm', v)} />
        <ToggleRow label="Availability below the monthly goal" on={s.onAvailabilityBelowGoal} onChange={(v) => f('onAvailabilityBelowGoal', v)} />
        <ToggleRow label="Maintenance due" on={s.onMaintenanceDue} onChange={(v) => f('onMaintenanceDue', v)} />
        <ToggleRow label="Daily summary" hint="A once-a-day digest of production and availability." on={s.dailySummary} onChange={(v) => f('dailySummary', v)} />
      </FormSection>

      <FormSection title="Delivery">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Field label="Daily summary time">
            <TextInput value={s.summaryTime} onChange={(v) => f('summaryTime', v)} type="time" />
          </Field>
          <Field label="Quiet hours from">
            <TextInput value={s.quietFrom} onChange={(v) => f('quietFrom', v)} type="time" />
          </Field>
          <Field label="Quiet hours to">
            <TextInput value={s.quietTo} onChange={(v) => f('quietTo', v)} type="time" />
          </Field>
        </div>
        <Field label="Recipients" className="mt-4">
          <Textarea value={s.recipients} onChange={(v) => f('recipients', v)} rows={2} placeholder="comma-separated emails" />
        </Field>
      </FormSection>
    </div>
  )
}

// ── Data Export ───────────────────────────────────────────────────────────────

interface DataExport {
  defaultFormat: 'PDF' | 'CSV' | 'XLSX'
  includeCharts: boolean
  schedule: 'Off' | 'Daily' | 'Weekly' | 'Monthly'
  deliveryEmail: string
  retention: string
  autoEmail: boolean
}
const EXPORT_DEFAULTS: DataExport = {
  defaultFormat: 'XLSX',
  includeCharts: true,
  schedule: 'Off',
  deliveryEmail: 'gabriel.oliveira@netzsch.com',
  retention: '90 days',
  autoEmail: false,
}

export function DataExportSettings() {
  const [s, set] = useLocalStorage<DataExport>('dr-settings-export', EXPORT_DEFAULTS)
  const f = <K extends keyof DataExport>(k: K, v: DataExport[K]) => set((p) => ({ ...p, [k]: v }))
  return (
    <div className="flex flex-col gap-4">
      <FormSection title="Defaults">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Default format">
            <SelectInput value={s.defaultFormat} options={['PDF', 'CSV', 'XLSX']} onChange={(v) => f('defaultFormat', v as DataExport['defaultFormat'])} />
          </Field>
          <Field label="Data retention">
            <SelectInput value={s.retention} options={['30 days', '90 days', '180 days', '1 year', 'Forever']} onChange={(v) => f('retention', v)} />
          </Field>
        </div>
        <div className="mt-3">
          <ToggleRow label="Include charts in PDF exports" on={s.includeCharts} onChange={(v) => f('includeCharts', v)} />
        </div>
      </FormSection>

      <FormSection title="Scheduled export">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Frequency">
            <SelectInput value={s.schedule} options={['Off', 'Daily', 'Weekly', 'Monthly']} onChange={(v) => f('schedule', v as DataExport['schedule'])} />
          </Field>
          <Field label="Delivery email">
            <TextInput value={s.deliveryEmail} onChange={(v) => f('deliveryEmail', v)} type="email" />
          </Field>
        </div>
        <div className="mt-3">
          <ToggleRow label="Auto-email scheduled exports" hint="Send the export to the delivery email on each run." on={s.autoEmail} onChange={(v) => f('autoEmail', v)} />
        </div>
      </FormSection>
    </div>
  )
}
