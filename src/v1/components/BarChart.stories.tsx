import type { Meta, StoryObj } from '@storybook/react'
import BarChart from './BarChart'
import { boxed } from '../../shared/stories/decorators'
import { RANKINGS } from '../../shared/stories/mocks'

const meta = {
  title: 'Charts/BarChart',
  component: BarChart,
  decorators: [boxed(420)],
  parameters: {
    docs: {
      description: {
        component:
          'Horizontal ranking bar chart (CSS-driven) with a numeric axis, animated widths, and a rich hover tooltip when a row carries `extra` detail rows. Powers the three Rankings panels.',
      },
    },
  },
  args: {
    data: RANKINGS.recipes,
    valueLabel: 'kg produced',
  },
} satisfies Meta<typeof BarChart>

export default meta
type Story = StoryObj<typeof meta>

export const Recipes: Story = {}

export const Interruptions: Story = {
  args: { data: RANKINGS.interruptions, valueLabel: undefined },
}

export const Status: Story = {
  args: { data: RANKINGS.status, valueLabel: undefined },
}
