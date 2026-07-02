import type { Meta, StoryObj } from '@storybook/react'
import MachineRankingBoard from './MachineRankingBoard'
import { withAvailabilityState } from '../../stories/decorators'

const meta = {
  title: 'Availability/MachineRankingBoard',
  component: MachineRankingBoard,
  decorators: [withAvailabilityState],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '"Attack-focus" board at the top of the Machine tab: a column chart of machine availability, worst performer on the left, with a dashed goal reference line and a rich hover tooltip (availability, gap to goal, planned/executed hours). Owns its own month selector (never steps into the future).',
      },
    },
  },
} satisfies Meta<typeof MachineRankingBoard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
