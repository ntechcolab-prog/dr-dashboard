import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import Filters, { type Period } from './Filters'
import { CURRENT_MONTH } from '../../shared/stories/mocks'

// Filters is fully controlled — this wrapper holds the state a page would own.
function FiltersHarness({ withActions = false }: { withActions?: boolean }) {
  const [machines, setMachines] = useState<string[]>(['Zeta 10'])
  const [recipes, setRecipes] = useState<string[]>([])
  const [period, setPeriod] = useState<Period>('monthly')
  const [monthKey, setMonthKey] = useState(CURRENT_MONTH.key)
  const [weekIdx, setWeekIdx] = useState(0)

  return (
    <div className="rounded-xl bg-card shadow-card">
      <Filters
        machines={machines}
        recipes={recipes}
        setMachines={setMachines}
        setRecipes={setRecipes}
        period={period}
        setPeriod={setPeriod}
        monthKey={monthKey}
        setMonthKey={setMonthKey}
        year={CURRENT_MONTH.year}
        month={CURRENT_MONTH.month}
        weekIdx={weekIdx}
        setWeekIdx={setWeekIdx}
        onClear={() => {
          setMachines([])
          setRecipes([])
        }}
        actions={
          withActions ? (
            <button className="rounded-lg border border-line bg-card px-3 py-1.5 text-sm font-medium text-muted">
              Export
            </button>
          ) : undefined
        }
      />
    </div>
  )
}

const meta: Meta<typeof Filters> = {
  title: 'Filters & Inputs/Filters',
  component: Filters,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The dashboard filter bar: machine + recipe MultiSelects, a Monthly/Weekly segmented control with the matching month or week dropdown, Clear Filters, and an optional actions slot (export / generate analysis).',
      },
    },
  },
  render: () => <FiltersHarness />,
}

export default meta
type Story = StoryObj<typeof Filters>

export const Default: Story = {}

export const WithActions: Story = {
  render: () => <FiltersHarness withActions />,
}
