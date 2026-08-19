import type { Meta, StoryObj } from '@storybook/react'
import AvailabilityGauge from './AvailabilityGauge'

const meta = {
  title: 'Availability/AvailabilityGauge',
  component: AvailabilityGauge,
  parameters: {
    docs: {
      description: {
        component:
          'Single-value circular gauge reused for the Yesterday / Month / Year cards. The arc animates in and turns amber when below the optional goal, which also renders a labelled target tick on the ring.',
      },
    },
  },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    goal: { control: { type: 'range', min: 0, max: 100, step: 1 } },
  },
  args: {
    value: 92,
    label: 'Month',
    goal: 85,
    size: '10rem',
  },
} satisfies Meta<typeof AvailabilityGauge>

export default meta
type Story = StoryObj<typeof meta>

export const OnTarget: Story = {}

export const BelowGoal: Story = {
  args: { value: 71, label: 'Yesterday' },
}

export const NoGoal: Story = {
  args: { value: 88, goal: undefined },
}
