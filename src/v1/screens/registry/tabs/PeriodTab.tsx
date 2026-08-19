import { FormSection, Field } from '../../../components/FormControls'
import type { PeriodData } from '../../../../shared/data/batchForm'

interface Props {
  value: PeriodData
  onChange: (v: PeriodData) => void
}

const inputCls =
  'w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary'

export default function PeriodTab({ value, onChange }: Props) {
  const set = <K extends keyof PeriodData>(key: K, v: PeriodData[K]) => onChange({ ...value, [key]: v })

  return (
    <FormSection title="Timeline">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Start Date">
          <input type="date" value={value.startDate} onChange={(e) => set('startDate', e.target.value)} className={inputCls} />
        </Field>
        <Field label="End Date">
          <input type="date" value={value.endDate} onChange={(e) => set('endDate', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Start Time">
          <input type="time" value={value.startTime} onChange={(e) => set('startTime', e.target.value)} className={inputCls} />
        </Field>
        <Field label="End Time">
          <input type="time" value={value.endTime} onChange={(e) => set('endTime', e.target.value)} className={inputCls} />
        </Field>
      </div>
    </FormSection>
  )
}
