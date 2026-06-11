import { FormSection, Field, TextInput, SelectInput } from '../../../components/FormControls'
import type { MachineData } from '../../../data/batchForm'
import {
  MACHINE_TYPES,
  EQUIPMENTS,
  GRINDING_TECH,
  LINERS,
  SEPARATIONS,
  SEALING_LIQUIDS,
  SIEVE_SIZES,
  BEAD_MATERIALS,
  BEAD_TYPES,
} from '../../../data/batchForm'

interface Props {
  value: MachineData
  onChange: (v: MachineData) => void
}

export default function MachineFormTab({ value, onChange }: Props) {
  const set = <K extends keyof MachineData>(key: K, v: MachineData[K]) => onChange({ ...value, [key]: v })

  return (
    <FormSection title="Mill">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Field label="Name">
          <TextInput value={value.name} onChange={(v) => set('name', v)} />
        </Field>
        <Field label="Machine Type">
          <SelectInput value={value.machineType} options={MACHINE_TYPES} onChange={(v) => set('machineType', v)} />
        </Field>
        <Field label="Equipment">
          <SelectInput value={value.equipment} options={EQUIPMENTS} onChange={(v) => set('equipment', v)} />
        </Field>

        <Field label="Grinding Technology">
          <SelectInput value={value.grindingTech} options={GRINDING_TECH} onChange={(v) => set('grindingTech', v)} />
        </Field>
        <Field label="Inner liner material">
          <SelectInput value={value.innerLiner} options={LINERS} onChange={(v) => set('innerLiner', v)} />
        </Field>
        <Field label="Separation System">
          <SelectInput value={value.separationSystem} options={SEPARATIONS} onChange={(v) => set('separationSystem', v)} />
        </Field>

        <Field label="Sealing Liquid">
          <SelectInput value={value.sealingLiquid} options={SEALING_LIQUIDS} onChange={(v) => set('sealingLiquid', v)} />
        </Field>
        <Field label="Sieve Size (mm)">
          <SelectInput value={value.sieveSize} options={SIEVE_SIZES} onChange={(v) => set('sieveSize', v)} />
        </Field>
        <Field label="Bead Material">
          <SelectInput value={value.beadMaterial} options={BEAD_MATERIALS} onChange={(v) => set('beadMaterial', v)} />
        </Field>

        <Field label="Bead 1 Type">
          <SelectInput value={value.bead1Type} options={BEAD_TYPES} onChange={(v) => set('bead1Type', v)} />
        </Field>
        <Field label="Bead 1 Size">
          <SelectInput value={value.bead1Size} options={['0.2', '0.4', '0.6', '0.8']} onChange={(v) => set('bead1Size', v)} />
        </Field>
        <Field label="Filling">
          <div className="grid grid-cols-2 gap-2">
            <TextInput value={value.bead1FillKg} onChange={(v) => set('bead1FillKg', v)} suffix="kg" />
            <TextInput value={value.bead1FillPct} onChange={(v) => set('bead1FillPct', v)} suffix="%" />
          </div>
        </Field>

        <Field label="Bead 2 Type">
          <SelectInput value={value.bead2Type} options={BEAD_TYPES} onChange={(v) => set('bead2Type', v)} />
        </Field>
        <Field label="Bead 2 Size">
          <SelectInput value={value.bead2Size} options={['0.2', '0.4', '0.6', '0.8']} onChange={(v) => set('bead2Size', v)} />
        </Field>
        <Field label="Filling">
          <div className="grid grid-cols-2 gap-2">
            <TextInput value={value.bead2FillKg} onChange={(v) => set('bead2FillKg', v)} suffix="kg" />
            <TextInput value={value.bead2FillPct} onChange={(v) => set('bead2FillPct', v)} suffix="%" />
          </div>
        </Field>
      </div>
    </FormSection>
  )
}
