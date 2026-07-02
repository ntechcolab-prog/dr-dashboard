import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import Sidebar from './Sidebar'

function SidebarHarness({ open: initialOpen = true, restricted = false }: { open?: boolean; restricted?: boolean }) {
  const [open, setOpen] = useState(initialOpen)
  const [active, setActive] = useState('dashboard')
  return (
    <div style={{ height: 420 }} className="flex overflow-hidden rounded-xl border border-line">
      <Sidebar
        open={open}
        active={active}
        onSelect={setActive}
        onToggle={() => setOpen((v) => !v)}
        restricted={restricted}
      />
      <div className="flex-1 bg-page p-6 text-sm text-muted">
        Active section: <span className="font-semibold text-ink">{active}</span>
      </div>
    </div>
  )
}

const meta: Meta<typeof Sidebar> = {
  title: 'Layout/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The collapsible side navigation: expanded (icon + label, 264px) or an icon rail (72px). Disabled items show a "Coming Soon" pill; `restricted` (v0) leaves only Registry enabled. Use the bottom control to collapse/expand.',
      },
    },
  },
  render: () => <SidebarHarness />,
}

export default meta
type Story = StoryObj<typeof Sidebar>

export const Expanded: Story = {}

export const Collapsed: Story = {
  render: () => <SidebarHarness open={false} />,
}

export const Restricted: Story = {
  render: () => <SidebarHarness restricted />,
}
