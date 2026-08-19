import type { Meta, StoryObj } from '@storybook/react'
import MultiSensorChart from './MultiSensorChart'
import { boxed } from '../../shared/stories/decorators'
import {
  SENSOR_SERIES,
  SENSOR_POINT_LABELS,
  SENSOR_MAX,
  SENSOR_NOTES,
} from '../../shared/stories/mocks'

const meta = {
  title: 'Charts/MultiSensorChart',
  component: MultiSensorChart,
  decorators: [boxed(880)],
  parameters: {
    docs: {
      description: {
        component:
          'Multi-series sensor chart used by the Registry (Resume + Remarks). Y axes on both sides, a hover tooltip with every series value, straight lines (discrete production data), optional note markers with their own tooltip, and click-to-annotate support.',
      },
    },
  },
  args: {
    series: SENSOR_SERIES,
    pointLabels: SENSOR_POINT_LABELS,
    max: SENSOR_MAX,
    height: 260,
  },
} satisfies Meta<typeof MultiSensorChart>

export default meta
type Story = StoryObj<typeof meta>

export const ThreeSensors: Story = {}

// Notes pinned along the plot; hover a numbered marker for its comment.
export const WithNotes: Story = {
  args: { notes: SENSOR_NOTES },
}

// A single sensor highlighted (others dimmed) with a status band.
export const HighlightAndBand: Story = {
  args: { highlight: 0, band: [6, 12] },
}
