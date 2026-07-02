import type { Meta, StoryObj } from '@storybook/react'
import EmptyState from './EmptyState'
import { boxed } from '../stories/decorators'

const meta = {
  title: 'Layout/EmptyState',
  component: EmptyState,
  decorators: [boxed(520)],
  parameters: {
    docs: {
      description: {
        component: 'Centered empty state with a soft circular icon badge, title, and optional description.',
      },
    },
  },
  args: {
    title: 'No batches match your filters',
    description: 'Try widening the date range or clearing the machine and recipe filters.',
  },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const TitleOnly: Story = {
  args: { title: 'Nothing here yet', description: undefined },
}
