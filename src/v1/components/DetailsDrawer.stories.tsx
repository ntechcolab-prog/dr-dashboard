import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import DetailsDrawer, { type DrawerData } from './DetailsDrawer'
import {
  KPIS,
  CURRENT_BATCHES,
  MASS_SERIES,
} from '../../shared/stories/mocks'
import { metricByMachine, metricByRecipe } from '../../shared/lib/compute'

function DrawerHarness(data: Omit<DrawerData, 'open'>) {
  const [open, setOpen] = useState(true)
  return (
    <div className="min-h-[28rem]">
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
      >
        Open drawer
      </button>
      <DetailsDrawer {...data} open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

const sizeKpi = KPIS.find((k) => k.key === 'size')!

const meta: Meta<typeof DetailsDrawer> = {
  title: 'Layout/DetailsDrawer',
  component: DetailsDrawer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Right-hand slide-over panel. In KPI mode it shows the metric headline, a trend chart (optionally the rich metric viz), and by-machine / by-recipe rankings. In day mode it lists the batches for a calendar day. Use "Open drawer" to reopen it after closing.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof DetailsDrawer>

// KPI drill-down with daily trend + rankings.
export const KpiDetail: Story = {
  render: () => (
    <DrawerHarness
      kind="kpi"
      title="Size"
      subtitle="Produced mass · June 2026"
      batches={[]}
      kpi={sizeKpi}
      daily={MASS_SERIES}
      byMachine={metricByMachine(CURRENT_BATCHES, 'size')}
      byRecipe={metricByRecipe(CURRENT_BATCHES, 'size')}
      richViz
    />
  ),
}

// Calendar-day mode: the list of batches for a day.
export const DayBatches: Story = {
  render: () => (
    <DrawerHarness
      kind="day"
      title="12 June 2026"
      subtitle={`${CURRENT_BATCHES.length} batches`}
      batches={CURRENT_BATCHES.slice(0, 6)}
    />
  ),
}
