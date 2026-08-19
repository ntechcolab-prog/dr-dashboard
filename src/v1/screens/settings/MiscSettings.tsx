// Mock-but-plausible content for the remaining Settings tabs. Everything is
// persisted to localStorage; swap to a real settings service later.

import { FormSection, Field, SelectInput, NumberInput } from '../../components/FormControls'
import { useLocalStorage } from '../../../shared/lib/useLocalStorage'

// ── General ──────────────────────────────────────────────────────────────────

const COUNTRIES = ['Germany', 'Brazil', 'USA', 'China', 'India']

// Typical national grid emission factors (kg CO₂e per kWh). Picking a country
// prefills the matching value, but the factor stays freely editable.
const CARBON_FACTOR_BY_COUNTRY: Record<string, number> = {
  Germany: 0.38,
  Brazil: 0.07,
  USA: 0.39,
  China: 0.58,
  India: 0.71,
}

interface General {
  country: string
  carbonFactor: number
}
const GENERAL_DEFAULTS: General = {
  country: 'Germany',
  carbonFactor: CARBON_FACTOR_BY_COUNTRY.Germany,
}

export function GeneralSettings() {
  const [s, set] = useLocalStorage<General>('dr-settings-general', GENERAL_DEFAULTS)
  const country = s.country ?? GENERAL_DEFAULTS.country
  const carbonFactor = s.carbonFactor ?? GENERAL_DEFAULTS.carbonFactor
  const setCountry = (c: string) =>
    set((p) => ({ ...p, country: c, carbonFactor: CARBON_FACTOR_BY_COUNTRY[c] ?? p.carbonFactor }))
  const setFactor = (n: number) => set((p) => ({ ...p, carbonFactor: Math.max(0, n) }))

  return (
    <div className="flex flex-col gap-4">
      <FormSection title="Region & emissions">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Country">
            <SelectInput value={country} options={COUNTRIES} onChange={setCountry} />
          </Field>
          <Field label="Carbon footprint reference factor">
            <NumberInput value={carbonFactor} suffix="kg CO₂e/kWh" min={0} step={0.01} onChange={setFactor} />
          </Field>
        </div>
        <p className="mt-3 text-xs text-muted">
          Used to estimate CO₂ emissions from energy consumption (kg CO₂e per kWh of electricity).
          Choosing a country prefills a typical grid value — adjust it to match your supplier or region.
        </p>
      </FormSection>
    </div>
  )
}

// ── Data Export ───────────────────────────────────────────────────────────────

interface DataExport {
  schedule: 'Off' | 'Daily' | 'Weekly' | 'Monthly'
  content: 'Summary' | 'Full (all complete data)'
  format: 'PDF' | 'CSV' | 'XLSX'
}
const EXPORT_DEFAULTS: DataExport = {
  schedule: 'Off',
  content: 'Summary',
  format: 'XLSX',
}

export function DataExportSettings() {
  const [s, set] = useLocalStorage<DataExport>('dr-settings-export', EXPORT_DEFAULTS)
  const f = <K extends keyof DataExport>(k: K, v: DataExport[K]) => set((p) => ({ ...p, [k]: v }))
  return (
    <div className="flex flex-col gap-4">
      <FormSection title="Scheduled export">
        <p className="mb-4 text-sm text-muted">
          Automatically generate a recurring export of your batches.
        </p>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Field label="Frequency">
            <SelectInput
              value={s.schedule}
              options={['Off', 'Daily', 'Weekly', 'Monthly']}
              onChange={(v) => f('schedule', v as DataExport['schedule'])}
            />
          </Field>
          <Field label="Report content">
            <SelectInput
              value={s.content}
              options={['Summary', 'Full (all complete data)']}
              onChange={(v) => f('content', v as DataExport['content'])}
            />
          </Field>
          <Field label="Format">
            <SelectInput
              value={s.format}
              options={['PDF', 'CSV', 'XLSX']}
              onChange={(v) => f('format', v as DataExport['format'])}
            />
          </Field>
        </div>
        <p className="mt-3 text-xs text-muted">
          <span className="font-medium text-ink">Summary</span> delivers headline KPIs and totals per batch;{' '}
          <span className="font-medium text-ink">Full</span> includes every recorded field for each completed batch.
          The export covers your batches only — it's sent to the email on your logged-in account.
        </p>
      </FormSection>
    </div>
  )
}
