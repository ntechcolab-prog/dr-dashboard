import type { Meta, StoryObj } from '@storybook/react'
import ExportMenu from './ExportMenu'
import type { Sheet } from '../../shared/lib/exportData'
import { CURRENT_BATCHES } from '../../shared/stories/mocks'

// Lazily-built export payload reflecting current state.
const sheets = (): Sheet[] => [
  {
    name: 'Batches',
    rows: [
      ['Batch', 'Recipe', 'Machine', 'Mass (ton)', 'Energy (kWh)', 'Status'],
      ...CURRENT_BATCHES.slice(0, 25).map((b) => [b.id, b.recipe, b.machine, b.mass, b.energy, b.status]),
    ],
  },
]

const meta = {
  title: 'Layout/ExportMenu',
  component: ExportMenu,
  decorators: [
    (Story) => (
      <div className="flex justify-end rounded-xl bg-card p-4 shadow-card">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'A single Export button with a PDF / CSV / XLSX menu. `sheets` and `title` resolve lazily on click so the export always reflects current state. `accent` turns it into a solid call-to-action once enabled; `disabled` greys it out.',
      },
    },
  },
  args: {
    title: 'Batch report — June 2026',
    printId: 'nonexistent-print-root',
    filenameBase: 'batch-report-2026-06',
    sheets,
  },
} satisfies Meta<typeof ExportMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Accent: Story = {
  args: { accent: true, label: 'Export selected' },
}

export const Disabled: Story = {
  args: { disabled: true },
}
