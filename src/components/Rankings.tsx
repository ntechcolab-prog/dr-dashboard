import type { ReactNode } from 'react'
import BarChart from './BarChart'
import type { Rankings as RankingsData } from '../lib/compute'

interface RankingsProps {
  rankings: RankingsData
}

export default function Rankings({ rankings }: RankingsProps) {
  return (
    <section className="rounded-xl bg-card p-6 shadow-card">
      <h3 className="mb-5 text-xs font-semibold uppercase tracking-wide text-ink">Rankings</h3>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Panel title="Interruptions">
          <BarChart data={rankings.interruptions} />
        </Panel>
        <Panel title="Recipes">
          <BarChart data={rankings.recipes} valueLabel="kg produced" />
        </Panel>
        <Panel title="Status">
          <BarChart data={rankings.status} />
        </Panel>
      </div>
    </section>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{title}</p>
      {children}
    </div>
  )
}
