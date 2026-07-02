import type { Meta, StoryObj } from '@storybook/react'
import AvailabilityDashboard from './AvailabilityDashboard'
import { withAvailabilityState } from '../../stories/decorators'

const meta = {
  title: 'Availability/AvailabilityDashboard',
  component: AvailabilityDashboard,
  decorators: [withAvailabilityState],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The full availability dashboard: Today / Yesterday / Goal / Month / Machine Ranking / Year cards. Gauges, planned-vs-executed bars, and availability charts with a goal line. Supports the same Edit mode as the Batches metrics grid (drag to reorder, remove, + Add, and pick the chart type on the Month/Year cards). Seeded here with a Mon–Fri 8h plan so the charts have data.',
      },
    },
  },
  args: {
    selectedMachine: 'Zeta 10',
  },
} satisfies Meta<typeof AvailabilityDashboard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NoMachineHighlighted: Story = {
  args: { selectedMachine: undefined },
}
