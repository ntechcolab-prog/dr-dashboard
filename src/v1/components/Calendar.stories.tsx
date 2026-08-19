import type { Meta, StoryObj } from '@storybook/react'
import Calendar from './Calendar'
import {
  CURRENT_MONTH,
  DAY_MAP,
  AVG_MASS,
  AVAIL_MONTH_SERIES,
} from '../../shared/stories/mocks'

// Per-day availability map (day → %) for the optional badges.
const availByDay = new Map<number, number>(
  AVAIL_MONTH_SERIES.pct.map((pct, i) => [i + 1, pct]),
)

const meta = {
  title: 'Metrics/Calendar',
  component: Calendar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Month/week calendar grid. Each active day shows batch count, produced mass, and energy with up/down deltas vs the daily average, plus an optional availability badge (teal ≥ 85 %, amber below). Empty days (e.g. Sundays) are muted.',
      },
    },
  },
  args: {
    period: 'monthly',
    year: CURRENT_MONTH.year,
    month: CURRENT_MONTH.month,
    weekIdx: 0,
    dayMap: DAY_MAP,
    avgMass: AVG_MASS,
    onDetails: () => {},
  },
} satisfies Meta<typeof Calendar>

export default meta
type Story = StoryObj<typeof meta>

export const Monthly: Story = {}

// With the availability badges surfaced on each planned day.
export const MonthlyWithAvailability: Story = {
  args: { availByDay },
}

// Weekly view — a single, taller week row.
export const Weekly: Story = {
  args: { period: 'weekly', weekIdx: 1, availByDay },
}
