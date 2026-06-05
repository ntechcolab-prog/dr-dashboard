import BarChart from './BarChart.jsx'

export default function Rankings({ rankings }) {
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

function Panel({ title, children }) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{title}</p>
      {children}
    </div>
  )
}
