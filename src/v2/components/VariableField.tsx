'use client'

import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { findVariable, type ResultVariable } from '@/src/shared/lib/resultVariables'

// A pick from the catalog, or a name the user typed that isn't in it yet.
type VarOption = { name: string; create?: boolean }
const filterVars = createFilterOptions<VarOption>()

interface Props {
  /** What is typed in the field. */
  value: string
  onChange: (v: string) => void
  /** The result variables catalog (Settings › Production). */
  catalog: ResultVariable[]
  /** Names already used in this table — hidden from the options. */
  exclude: string[]
}

// Variable picker shared by Product › Expected Results and Settings › Production:
// options come from the catalog, and a typed name that isn't there is offered as
// "Create". The caller adds it to the catalog when the row is committed.
export default function VariableField({ value, onChange, catalog, exclude }: Props) {
  const taken = new Set(exclude.map((x) => x.toLowerCase()))
  const options: VarOption[] = catalog.filter((v) => !taken.has(v.name.toLowerCase())).map((v) => ({ name: v.name }))

  return (
    <Autocomplete<VarOption, false, false, true>
      freeSolo
      size="small"
      fullWidth
      options={options}
      value={null}
      inputValue={value}
      onInputChange={(_, v, reason) => reason === 'input' && onChange(v)}
      onChange={(_, v) => onChange(v === null ? '' : typeof v === 'string' ? v : v.name)}
      getOptionLabel={(o) => (typeof o === 'string' ? o : o.name)}
      filterOptions={(opts, state) => {
        const shown = filterVars(opts, state)
        const typed = state.inputValue.trim()
        if (typed && !findVariable(catalog, typed) && !taken.has(typed.toLowerCase())) {
          shown.push({ name: typed, create: true })
        }
        return shown
      }}
      renderOption={({ key, ...props }, o) => (
        <li key={key} {...props}>
          {o.create ? <>Create&nbsp;<strong>&ldquo;{o.name}&rdquo;</strong></> : o.name}
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Pick or type a new one"
          slotProps={{ ...params.slotProps, htmlInput: { ...params.slotProps.htmlInput, 'aria-label': 'Variable' } }}
        />
      )}
    />
  )
}
