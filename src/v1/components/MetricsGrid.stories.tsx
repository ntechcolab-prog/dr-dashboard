import type { Meta, StoryObj } from '@storybook/react'
import MetricsGrid from './MetricsGrid'
import { KPIS } from '../../shared/stories/mocks'

const meta = {
  title: 'Metrics/MetricsGrid',
  component: MetricsGrid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The original (v0) KPI grid: value + delta cards, with the same Edit mode (drag to reorder, remove, + Add) but no per-card visualization. Kept for reference alongside MetricsGridV2.',
      },
    },
  },
  args: {
    kpis: KPIS,
    onDetails: () => {},
  },
} satisfies Meta<typeof MetricsGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
