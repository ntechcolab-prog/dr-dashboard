import type { Meta, StoryObj } from '@storybook/react'
import { CardViz, DetailViz, metaFor, VIZ } from './metricViz'
import { KPIS, SERIES, MASS_SERIES } from '../stories/mocks'

// The metric visualization language: one viz per metric (column / area / gauge /
// donut / compare / bullet), rendered in two sizes — compact for the KPI card
// and larger for the Details drawer.
const meta: Meta<typeof CardViz> = {
  title: 'Charts/MetricViz',
  component: CardViz,
  parameters: {
    docs: {
      description: {
        component:
          'Shared metric-viz primitives (`CardViz` / `DetailViz`). Centralizing them keeps the KPI card and its Details drawer perfectly in sync. Each metric maps to a fixed viz kind via the `VIZ` table.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof CardViz>

// Gallery: the compact card viz for every one of the 8 metrics.
export const AllCardViz: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {KPIS.map((kpi) => (
        <div key={kpi.key} className="rounded-xl border border-line/70 bg-card p-3 shadow-card">
          <p className="mb-1 truncate text-[0.625rem] font-semibold uppercase tracking-wide text-muted">
            {kpi.label} · {VIZ[kpi.key] ?? 'area'}
          </p>
          <div className="h-16">
            <CardViz kpi={kpi} series={SERIES[kpi.key] ?? []} color={metaFor(kpi.key).accent} />
          </div>
        </div>
      ))}
    </div>
  ),
}

// The larger drawer viz for a single metric (area/trend kind).
export const DetailArea: Story = {
  render: () => {
    const kpi = KPIS.find((k) => k.key === 'size')!
    return (
      <div className="max-w-md rounded-xl border border-line/70 bg-card p-5 shadow-card">
        <DetailViz
          kpi={kpi}
          series={MASS_SERIES.data}
          labels={MASS_SERIES.labels}
          color={metaFor(kpi.key).accent}
        />
      </div>
    )
  },
}

// The drawer viz for the "ratio" metric (donut summary kind).
export const DetailDonut: Story = {
  render: () => {
    const kpi = KPIS.find((k) => k.key === 'ratio')!
    return (
      <div className="max-w-md rounded-xl border border-line/70 bg-card p-5 shadow-card">
        <DetailViz kpi={kpi} series={SERIES.ratio ?? []} labels={[]} color={metaFor(kpi.key).accent} />
      </div>
    )
  },
}
