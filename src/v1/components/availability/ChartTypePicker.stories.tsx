import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import ChartTypePicker from './ChartTypePicker'
import type { ChartType } from '../../../shared/lib/availability'

const meta: Meta<typeof ChartTypePicker> = {
  title: 'Filters & Inputs/ChartTypePicker',
  component: ChartTypePicker,
  parameters: {
    docs: {
      description: {
        component:
          'Three-button chart-type picker (Bars / Line / Area) shown in edit mode on the availability chart cards.',
      },
    },
  },
  render: function Render() {
    const [type, setType] = useState<ChartType>('bar')
    return <ChartTypePicker value={type} onChange={setType} />
  },
}

export default meta
type Story = StoryObj<typeof ChartTypePicker>

export const Default: Story = {}
