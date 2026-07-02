import type { Meta, StoryObj } from '@storybook/react'
import MetricsGridV2 from './MetricsGridV2'
import { KPIS, SERIES } from '../stories/mocks'

const meta = {
  title: 'Metrics/MetricsGridV2',
  component: MetricsGridV2,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The v1 KPI grid: eight metric cards, each pairing the value with a metric-specific visualization (`CardViz`). Click **Edit** to enter the iOS-style edit mode — cards jiggle, can be dragged to reorder, removed (−), re-added (+ Add), and given a per-card chart style. "Cooling energy" is hidden by default and re-addable.',
      },
    },
  },
  args: {
    kpis: KPIS,
    series: SERIES,
    onDetails: () => {},
  },
} satisfies Meta<typeof MetricsGridV2>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// No per-metric series → cards fall back to their summary vizzes only.
export const WithoutSeries: Story = {
  args: { series: undefined },
}
