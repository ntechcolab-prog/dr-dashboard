import type { Meta, StoryObj } from '@storybook/react'
import InOperation from './InOperation'
import { LIVE_BATCHES } from '../data/mockData'

const meta = {
  title: 'Rankings & Live/InOperation',
  component: InOperation,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Live batches strip: fixed-size cards (3 per view) in a snap-scrolling carousel with a progress bar and state pill. When the track overflows, prev/next arrows appear. Click any card to open the full detail modal (progress, live stats, event timeline).',
      },
    },
  },
  args: {
    batches: LIVE_BATCHES,
  },
} satisfies Meta<typeof InOperation>

export default meta
type Story = StoryObj<typeof meta>

export const Carousel: Story = {}

// Three or fewer batches → no overflow arrows.
export const FewBatches: Story = {
  args: { batches: LIVE_BATCHES.slice(0, 3) },
}
