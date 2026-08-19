import type { Meta, StoryObj } from '@storybook/react'
import Rankings from './Rankings'
import { RANKINGS } from '../../shared/stories/mocks'

const meta = {
  title: 'Rankings & Live/Rankings',
  component: Rankings,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Three ranked BarChart panels — Interruptions, Recipes (by kg produced), and Status. `embedded` drops the card chrome so it reads as part of a parent production card.',
      },
    },
  },
  args: {
    rankings: RANKINGS,
  },
} satisfies Meta<typeof Rankings>

export default meta
type Story = StoryObj<typeof meta>

export const Card: Story = {}

export const Embedded: Story = {
  args: { embedded: true },
  decorators: [
    (Story) => (
      <div className="rounded-xl bg-card shadow-card">
        <div className="px-6 pt-5 text-xs font-semibold uppercase tracking-wide text-muted">
          Production (parent card)
        </div>
        <Story />
      </div>
    ),
  ],
}
