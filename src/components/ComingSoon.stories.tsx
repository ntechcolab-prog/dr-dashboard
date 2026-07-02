import type { Meta, StoryObj } from '@storybook/react'
import ComingSoon from './ComingSoon'
import { boxed } from '../stories/decorators'

const meta = {
  title: 'Layout/ComingSoon',
  component: ComingSoon,
  decorators: [boxed(560)],
  parameters: {
    docs: {
      description: {
        component: 'Generic "Coming Soon" placeholder used by unfinished screens and tabs.',
      },
    },
  },
  args: {},
} satisfies Meta<typeof ComingSoon>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Custom: Story = {
  args: {
    title: 'Analysis is on the way',
    description: 'Cross-batch comparison and saved analyses land in the next release.',
  },
}
