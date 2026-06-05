import { useState } from 'react'
import type { ReportItem } from '../../../data/batchForm'

interface Props {
  value: ReportItem[]
  onChange: (v: ReportItem[]) => void
}

const TEMPLATES = ['Quality Certificate', 'Production Summary', 'Full Batch Report', 'Customer Report']

export default function ReportsTab({ value, onChange }: Props) {
  const [picking, setPicking] = useState(false)

  const create = (template: string) => {
    const item: ReportItem = {
      id: `RPT-${1000 + value.length + 1}`,
      template,
      createdAt: new Date().toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }),
    }
    onChange([...value, item])
    setPicking(false)
  }

  return (
    <div className="space-y-4">
      {!picking ? (
        <button
          onClick={() => setPicking(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/50 bg-card py-5 text-sm font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary-soft/40"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create a report
        </button>
      ) : (
        <section className="rounded-xl bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ink">Choose a template</h3>
            <button onClick={() => setPicking(false)} className="text-xs font-medium text-muted hover:text-ink">Cancel</button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TEMPLATES.map((t) => (
              <button
                key={t}
                onClick={() => create(t)}
                className="flex items-center gap-3 rounded-lg border border-line p-4 text-left transition-colors hover:border-primary hover:bg-primary-soft/30"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </span>
                <span className="text-sm font-medium text-ink">{t}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {value.length > 0 && (
        <section className="rounded-xl bg-card p-6 shadow-card">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink">Generated reports</h3>
          <div className="space-y-2">
            {value.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-line px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{r.template}</p>
                    <p className="text-xs text-muted">{r.id} · {r.createdAt}</p>
                  </div>
                </div>
                <button className="text-xs font-medium text-primary hover:underline">Download</button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
