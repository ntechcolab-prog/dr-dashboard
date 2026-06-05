import { FormSection, Field, TextInput, SelectInput, Textarea } from '../../../components/FormControls'
import type { ProductData } from '../../../data/batchForm'
import { BRANCHES, PRODUCT_TYPES, PROCESS_MODES, SOLIDS } from '../../../data/batchForm'

interface Props {
  value: ProductData
  onChange: (v: ProductData) => void
}

const GRINDING_ROWS = [
  { phase: 'Filling pass', feed: '1500 rpm', mill: '54.0 kW' },
  { phase: 'Circulation', sub: 'Reduced grinding', feed: '- rpm', mill: '- kW' },
  { phase: '', sub: 'Grinding', feed: '1500 rpm', mill: '54.0 kW' },
  { phase: 'Emptying pass', feed: '1500 rpm', mill: '54.0 kW' },
]

export default function ProductTab({ value, onChange }: Props) {
  const set = <K extends keyof ProductData>(key: K, v: ProductData[K]) => onChange({ ...value, [key]: v })

  return (
    <div className="space-y-4">
      <FormSection title="Basic Information">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Branch">
            <SelectInput value={value.branch} options={BRANCHES} onChange={(v) => set('branch', v)} />
          </Field>
          <Field label="Product Type">
            <SelectInput value={value.productType} options={PRODUCT_TYPES} onChange={(v) => set('productType', v)} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Product Specifications">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Field label="Weight">
            <TextInput value={value.weight} onChange={(v) => set('weight', v)} suffix="kg" />
          </Field>
          <Field label="Volume">
            <TextInput value={value.volume} onChange={(v) => set('volume', v)} suffix="m³" />
          </Field>
          <Field label="Density">
            <TextInput value={value.density} onChange={(v) => set('density', v)} />
          </Field>
          <Field label="Process Mode">
            <SelectInput value={value.processMode} options={PROCESS_MODES} onChange={(v) => set('processMode', v)} />
          </Field>
          <Field label="Solids Content">
            <SelectInput value={value.solidsContent} options={SOLIDS} onChange={(v) => set('solidsContent', v)} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Recipe">
        <div className="overflow-hidden rounded-lg border border-line">
          <div className="flex items-center justify-between bg-page/60 px-4 py-3 text-xs font-semibold text-ink">
            <span>Grinding settings</span>
            <span className="flex gap-16 text-muted">
              <span>Feeding control</span>
              <span>Mill control</span>
            </span>
          </div>
          {GRINDING_ROWS.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_auto] items-center gap-8 border-t border-line px-4 py-3 text-sm">
              <span className="text-ink">
                {r.phase}
                {r.sub && <span className={r.phase ? 'ml-2 text-muted' : 'text-muted'}>{r.sub}</span>}
              </span>
              <span className="w-20 text-right text-muted tabular-nums">{r.feed}</span>
              <span className="w-20 text-right text-muted tabular-nums">{r.mill}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-line">
          <div className="flex items-center justify-between bg-page/60 px-4 py-3 text-xs font-semibold text-ink">
            <span>Limits</span>
            <span className="flex gap-16 text-muted">
              <span>Temperature</span>
              <span>Pressure</span>
            </span>
          </div>
          <div className="border-t border-line px-4 py-3 text-sm">
            <p className="mb-2 text-ink">Setpoints</p>
            <div className="space-y-1 text-muted">
              <Row label="High warning" temp="60°C" pres="60°C" />
              <Row label="High critical" temp="60°C" pres="60°C" />
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Product Details">
        <Textarea value={value.details} onChange={(v) => set('details', v)} placeholder="Write product details here" rows={4} />
      </FormSection>

      <FormSection title="Attachments">
        <div className="grid place-items-center rounded-lg border-2 border-dashed border-primary/40 bg-primary-soft/40 py-10 text-primary">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5" />
            <polyline points="6 11 12 5 18 11" />
          </svg>
          <p className="mt-2 text-sm">Drag files here or click to upload</p>
        </div>
      </FormSection>
    </div>
  )
}

function Row({ label, temp, pres }: { label: string; temp: string; pres: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-8">
      <span>{label}</span>
      <span className="w-20 text-right tabular-nums">{temp}</span>
      <span className="w-20 text-right tabular-nums">{pres}</span>
    </div>
  )
}
