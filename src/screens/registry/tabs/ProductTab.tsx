import { FormSection, Textarea } from '../../../components/FormControls'
import type { ProductData } from '../../../data/batchForm'

interface Props {
  value: ProductData
  onChange: (v: ProductData) => void
}

export default function ProductTab({ value, onChange }: Props) {
  const set = <K extends keyof ProductData>(key: K, v: ProductData[K]) => onChange({ ...value, [key]: v })

  return (
    <div className="space-y-4">
      <FormSection title="Information">
        <Textarea value={value.details} onChange={(v) => set('details', v)} placeholder="Write product information here" rows={4} />
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
