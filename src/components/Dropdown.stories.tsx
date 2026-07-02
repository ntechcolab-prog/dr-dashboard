import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import Dropdown from './Dropdown'
import { boxed } from '../stories/decorators'
import { MACHINES } from '../data/mockData'

const meta: Meta<typeof Dropdown> = {
  title: 'Filters & Inputs/Dropdown',
  component: Dropdown,
  decorators: [boxed(240)],
  parameters: {
    docs: {
      description: {
        component: 'Simple single-select dropdown styled like the Figma filter selects.',
      },
    },
  },
  render: function Render() {
    const [value, setValue] = useState(MACHINES[0])
    return <Dropdown value={value} options={MACHINES} onChange={setValue} />
  },
}

export default meta
type Story = StoryObj<typeof Dropdown>

export const Default: Story = {}
