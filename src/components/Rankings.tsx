import type { ReactNode } from 'react'
import BarChart from './BarChart'
import type { Rankings as RankingsData } from '../lib/compute'

interface RankingsProps {
  rankings: RankingsData
  /** When true, render flush inside a parent card (no own card chrome) so it
   *  reads as part of the same filtered view. */
  embedded?: boolean
}

export default function Rankings({ rankings, embedded = false }: RankingsProps) {
  return (
    <section
      className={
        embedded ? 'border-t border-line/70 px-6 pb-6 pt-5' : 'rounded-xl bg-card p-6 shadow-card'
      }
    >
      <h3 className="mb-5 text-xs font-semibold uppercase tracking-wide text-ink">Rankings</h3>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
    <div className="rounded-xl border border-line/70 bg-page/30 p-4">
      <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">{title}</p>
      {children}
    </div>
  )
}
