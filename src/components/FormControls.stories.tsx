import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import {
  FormSection,
  Field,
  TextInput,
  Textarea,
  NumberInput,
  Toggle,
  ToggleRow,
  SelectInput,
} from './FormControls'
import { boxed } from '../stories/decorators'
import { MACHINES } from '../data/mockData'

const meta: Meta<typeof TextInput> = {
  title: 'Filters & Inputs/FormControls',
  component: TextInput,
  decorators: [boxed(480)],
  parameters: {
    docs: {
      description: {
        component:
          'The batch-editor form primitives: `FormSection`, `Field`, `TextInput`, `Textarea`, `NumberInput`, `Toggle` / `ToggleRow`, and `SelectInput` — all styled to the Figma fields with focus rings and consistent chrome.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof TextInput>

// A representative section assembling every control.
export const FullForm: Story = {
  render: function FullForm() {
    const [name, setName] = useState('Dark Red')
    const [notes, setNotes] = useState('Fineness within target on pass 3.')
    const [mass, setMass] = useState(1.2)
    const [machine, setMachine] = useState(MACHINES[0])
    const [live, setLive] = useState(true)
    const [alarms, setAlarms] = useState(false)

    return (
      <FormSection title="Batch details">
        <div className="space-y-4">
          <Field label="Recipe">
            <TextInput value={name} onChange={setName} placeholder="Recipe name" />
          </Field>
          <Field label="Machine">
            <SelectInput value={machine} options={MACHINES} onChange={setMachine} />
          </Field>
          <Field label="Target mass">
            <NumberInput value={mass} onChange={setMass} suffix="ton" min={0} step={0.1} />
          </Field>
          <Field label="Remarks">
            <Textarea value={notes} onChange={setNotes} rows={3} placeholder="Add remarks" />
          </Field>
          <div className="rounded-lg border border-line px-3">
            <ToggleRow label="Live monitoring" hint="Stream sensor data in real time" on={live} onChange={setLive} />
            <ToggleRow label="Alarm notifications" hint="Notify on threshold breach" on={alarms} onChange={setAlarms} />
          </div>
        </div>
      </FormSection>
    )
  },
}

// The standalone switch.
export const ToggleOnly: Story = {
  render: function ToggleOnly() {
    const [on, setOn] = useState(true)
    return <Toggle on={on} onChange={setOn} />
  },
}
