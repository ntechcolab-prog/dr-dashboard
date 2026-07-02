'use client'

import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import InputAdornment from '@mui/material/InputAdornment'
import type { MachineData } from '@/src/data/batchForm'
import {
  MACHINE_TYPES, EQUIPMENTS, GRINDING_TECH, LINERS, SEPARATIONS,
  SEALING_LIQUIDS, SIEVE_SIZES, BEAD_MATERIALS, BEAD_TYPES,
} from '@/src/data/batchForm'
import { SectionCard } from '../ui'

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <TextField select size="small" fullWidth label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
    </TextField>
  )
}

function Text({ label, value, onChange, suffix }: { label: string; value: string; onChange: (v: string) => void; suffix?: string }) {
  return (
    <TextField
      size="small" fullWidth label={label} value={value} onChange={(e) => onChange(e.target.value)}
      slotProps={suffix ? { input: { endAdornment: <InputAdornment position="end">{suffix}</InputAdornment> } } : undefined}
    />
  )
}

export default function MachineFormTab({ value, onChange }: { value: MachineData; onChange: (v: MachineData) => void }) {
  const set = <K extends keyof MachineData>(key: K, v: MachineData[K]) => onChange({ ...value, [key]: v })

  return (
    <SectionCard title="Mill">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2.5 }}>
        <Text label="Name" value={value.name} onChange={(v) => set('name', v)} />
        <Select label="Machine Type" value={value.machineType} options={MACHINE_TYPES} onChange={(v) => set('machineType', v)} />
        <Select label="Equipment" value={value.equipment} options={EQUIPMENTS} onChange={(v) => set('equipment', v)} />

        <Select label="Grinding Technology" value={value.grindingTech} options={GRINDING_TECH} onChange={(v) => set('grindingTech', v)} />
        <Select label="Inner liner material" value={value.innerLiner} options={LINERS} onChange={(v) => set('innerLiner', v)} />
        <Select label="Separation System" value={value.separationSystem} options={SEPARATIONS} onChange={(v) => set('separationSystem', v)} />

        <Select label="Sealing Liquid" value={value.sealingLiquid} options={SEALING_LIQUIDS} onChange={(v) => set('sealingLiquid', v)} />
        <Select label="Sieve Size (mm)" value={value.sieveSize} options={SIEVE_SIZES} onChange={(v) => set('sieveSize', v)} />
        <Select label="Bead Material" value={value.beadMaterial} options={BEAD_MATERIALS} onChange={(v) => set('beadMaterial', v)} />

        <Select label="Bead 1 Type" value={value.bead1Type} options={BEAD_TYPES} onChange={(v) => set('bead1Type', v)} />
        <Select label="Bead 1 Size" value={value.bead1Size} options={['0.2', '0.4', '0.6', '0.8']} onChange={(v) => set('bead1Size', v)} />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <Text label="Filling" value={value.bead1FillKg} onChange={(v) => set('bead1FillKg', v)} suffix="kg" />
          <Text label="Filling" value={value.bead1FillPct} onChange={(v) => set('bead1FillPct', v)} suffix="%" />
        </Box>

        <Select label="Bead 2 Type" value={value.bead2Type} options={BEAD_TYPES} onChange={(v) => set('bead2Type', v)} />
        <Select label="Bead 2 Size" value={value.bead2Size} options={['0.2', '0.4', '0.6', '0.8']} onChange={(v) => set('bead2Size', v)} />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <Text label="Filling" value={value.bead2FillKg} onChange={(v) => set('bead2FillKg', v)} suffix="kg" />
          <Text label="Filling" value={value.bead2FillPct} onChange={(v) => set('bead2FillPct', v)} suffix="%" />
        </Box>
      </Box>
    </SectionCard>
  )
}
