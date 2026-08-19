interface LogEntry {
  at: string
  user: string
  action: string
  detail: string
}

const LOGS: LogEntry[] = [
  { at: '19/04/2026 13:48', user: 'G. Oliveira', action: 'Updated', detail: 'Conclusion text edited' },
  { at: '19/04/2026 13:45', user: 'G. Oliveira', action: 'Added', detail: 'Result row d10/d50/d90 at 11:45' },
  { at: '19/04/2026 11:20', user: 'M. Costa', action: 'Changed', detail: 'Process Mode: Single Pass → Recirculation' },
  { at: '19/04/2026 10:15', user: 'M. Costa', action: 'Created', detail: 'Batch BA-0274 created (version 1.0)' },
]

const tone = (a: string) =>
  a === 'Created' ? 'bg-primary-soft text-primary-700' : a === 'Changed' ? 'bg-page text-warning' : 'bg-page text-muted'

export default function LogsTab() {
  return (
    <section className="rounded-xl bg-card p-6 shadow-card">
      <h3 className="mb-5 text-sm font-semibold uppercase tracking-wide text-ink">Changelog</h3>
      <div className="overflow-hidden rounded-lg border border-line">
        <div className="grid grid-cols-[170px_140px_110px_1fr] bg-page/60 px-4 py-3 text-xs font-medium text-muted">
          <span>Date / Time</span>
          <span>User</span>
          <span>Action</span>
          <span>Detail</span>
        </div>
        {LOGS.map((l, i) => (
          <div key={i} className="grid grid-cols-[170px_140px_110px_1fr] items-center border-t border-line px-4 py-3 text-sm">
            <span className="text-muted tabular-nums">{l.at}</span>
            <span className="text-ink">{l.user}</span>
            <span>
              <span className={`rounded-full px-2.5 py-1 text-[0.6875rem] font-medium ${tone(l.action)}`}>{l.action}</span>
            </span>
            <span className="text-ink">{l.detail}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
