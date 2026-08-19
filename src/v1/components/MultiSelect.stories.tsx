import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import MultiSelect from './MultiSelect'
import { boxed } from '../../shared/stories/decorators'
import { MACHINES, RECIPES } from '../../shared/data/mockData'

function MultiSelectHarness(props: {
  label: string
  options: string[]
  placeholder?: string
  initial?: string[]
}) {
  const [selected, setSelected] = useState<string[]>(props.initial ?? [])
  return (
    <MultiSelect
      label={props.label}
      options={props.options}
      selected={selected}
      onChange={setSelected}
      placeholder={props.placeholder}
    />
  )
}

const meta: Meta<typeof MultiSelect> = {
  title: 'Filters & Inputs/MultiSelect',
  component: MultiSelect,
  decorators: [boxed(360)],
  parameters: {
    docs: {
      description: {
        component:
          'A filter field that shows the selected values as removable chips and opens a searchable, checkbox list of the remaining options — with an additive "Select all / Clear all" that acts on the current search.',
      },
    },
  },
  render: () => (
    <MultiSelectHarness
      label="Filter by Machine"
      options={MACHINES}
      placeholder="Select machines"
      initial={['Zeta 10']}
    />
  ),
}

export default meta
type Story = StoryObj<typeof MultiSelect>

export const Machines: Story = {}

export const RecipesEmpty: Story = {
  render: () => (
    <MultiSelectHarness label="Filter by Recipe" options={RECIPES} placeholder="Select recipes" />
  ),
}
