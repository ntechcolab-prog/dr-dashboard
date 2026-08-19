import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import Tabs from './Tabs'

function TabsHarness({ tabs }: { tabs: { key: string; label: string }[] }) {
  const [active, setActive] = useState(tabs[0].key)
  return <Tabs tabs={tabs} active={active} onChange={setActive} />
}

const meta: Meta<typeof Tabs> = {
  title: 'Filters & Inputs/Tabs',
  component: Tabs,
  parameters: {
    docs: {
      description: {
        component:
          'Segmented control (consistent with the Monthly/Weekly and period toggles) used for top-level view switching.',
      },
    },
  },
  render: () => (
    <TabsHarness
      tabs={[
        { key: 'production', label: 'Production' },
        { key: 'machine', label: 'Machine' },
      ]}
    />
  ),
}

export default meta
type Story = StoryObj<typeof Tabs>

export const TwoTabs: Story = {}

export const ThreeTabs: Story = {
  render: () => (
    <TabsHarness
      tabs={[
        { key: 'overview', label: 'Overview' },
        { key: 'resume', label: 'Resume' },
        { key: 'remarks', label: 'Remarks' },
      ]}
    />
  ),
}
