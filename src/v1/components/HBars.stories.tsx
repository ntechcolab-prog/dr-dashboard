import type { Meta, StoryObj } from '@storybook/react'
import HBars from './HBars'
import { boxed } from '../../shared/stories/decorators'

const meta = {
  title: 'Charts/HBars',
  component: HBars,
  decorators: [boxed(420)],
  parameters: {
    docs: {
      description: {
        component:
          'Horizontal bars with a left-side label (rank or value), animated widths, optional per-bar colors, an optional numeric axis, and a `dim` flag to de-emphasize non-selected bars. Used by the Machine tab (performance / downtime).',
      },
    },
  },
  args: {
    items: [
      { label: 'Zeta 10', value: 94, leftLabel: '94%', color: 'var(--color-primary)' },
      { label: 'Neos 40', value: 88, leftLabel: '88%', color: 'var(--color-primary)' },
      { label: 'Zeta 60', value: 81, leftLabel: '81%', color: 'var(--color-warning)', dim: true },
      { label: 'Omega 5', value: 76, leftLabel: '76%', color: 'var(--color-warning)', dim: true },
      { label: 'Alpha 22', value: 69, leftLabel: '69%', color: 'var(--color-warning)', dim: true },
    ],
    axisMax: 100,
  },
} satisfies Meta<typeof HBars>

export default meta
type Story = StoryObj<typeof meta>

export const PerformanceRanking: Story = {}

export const WithAxis: Story = {
  args: { axisTicks: [0, 25, 50, 75, 100] },
}
