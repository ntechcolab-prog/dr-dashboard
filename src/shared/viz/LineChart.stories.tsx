import type { Meta, StoryObj } from '@storybook/react'
import LineChart from './LineChart'
import { boxed } from '../stories/decorators'
import { MASS_SERIES, ENERGY_SERIES } from '../stories/mocks'

const meta = {
  title: 'Charts/LineChart',
  component: LineChart,
  decorators: [boxed(560)],
  parameters: {
    docs: {
      description: {
        component:
          'Responsive SVG line chart with a teal stroke gradient, soft area fill, gridlines, and a hover crosshair + tooltip. Geometry scales with the fluid root font-size (`useRootScale`). Hover the plot to see the tooltip.',
      },
    },
  },
  args: {
    data: MASS_SERIES.data,
    labels: MASS_SERIES.labels,
    unit: 'ton',
    height: 230,
    maxLabels: 8,
  },
} satisfies Meta<typeof LineChart>

export default meta
type Story = StoryObj<typeof meta>

// Daily produced mass across June 2026.
export const DailyMass: Story = {}

// Total energy per day — larger values exercise the y-axis "nice max".
export const DailyEnergy: Story = {
  args: { data: ENERGY_SERIES.data, labels: ENERGY_SERIES.labels, unit: 'kWh' },
}

// Few points: dots are drawn (showDots kicks in at ≤ 12 points).
export const FewPoints: Story = {
  args: {
    data: [12, 18, 9, 22, 16, 27, 20],
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    unit: 'batches',
    xLabel: 'Weekday',
  },
}
