import type { Meta, StoryObj } from '@storybook/react'
import AvailabilityChart from './AvailabilityChart'
import { boxed } from '../../shared/stories/decorators'
import { AVAIL_MONTH_SERIES, AVAIL_YEAR_SERIES } from '../../shared/stories/mocks'

const meta = {
  title: 'Charts/AvailabilityChart',
  component: AvailabilityChart,
  decorators: [boxed(620)],
  parameters: {
    docs: {
      description: {
        component:
          'Availability % chart reused by the Month (daily) and Year (monthly) cards. `type` switches bar / line / area, `goal` draws a dashed target line and tints bars below it amber, and the hover tooltip surfaces planned vs executed hours.',
      },
    },
  },
  argTypes: {
    type: { control: 'inline-radio', options: ['bar', 'line', 'area'] },
    goal: { control: { type: 'range', min: 0, max: 100, step: 5 } },
  },
  args: {
    labels: AVAIL_MONTH_SERIES.labels,
    values: AVAIL_MONTH_SERIES.pct,
    planned: AVAIL_MONTH_SERIES.planned,
    executed: AVAIL_MONTH_SERIES.executed,
    type: 'bar',
    goal: 85,
    height: 220,
    maxLabels: 15,
  },
} satisfies Meta<typeof AvailabilityChart>

export default meta
type Story = StoryObj<typeof meta>

export const Bars: Story = {}

export const Line: Story = { args: { type: 'line' } }

export const Area: Story = { args: { type: 'area' } }

// Monthly rollup across the year.
export const YearlyArea: Story = {
  args: {
    labels: AVAIL_YEAR_SERIES.labels,
    values: AVAIL_YEAR_SERIES.pct,
    planned: AVAIL_YEAR_SERIES.planned,
    executed: AVAIL_YEAR_SERIES.executed,
    type: 'area',
    maxLabels: 12,
  },
}
