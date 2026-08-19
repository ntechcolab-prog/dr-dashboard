import { useState } from 'react'
import type { ReportItem } from '../../../../shared/data/batchForm'
import { Plus, Download, ChevronLeft, ChevronRight } from '../../../icons/Icons'

interface Props {
  value: ReportItem[]
  onChange: (v: ReportItem[]) => void
}

const TEMPLATES = [
  { id: 'standard-protocol', name: 'Standard Protocol', desc: 'This report contains a chart and a table.' },
  { id: 'standard-protocol-2', name: 'Standard Protocol 2', desc: 'This report contains a chart and a table.' },
  { id: 'standard-protocol-3', name: 'Standard Protocol 3', desc: 'This report contains a chart and a table.' },
]

export default function ReportsTab({ value, onChange }: Props) {
  const [picking, setPicking] = useState(false)
  const [selected, setSelected] = useState(TEMPLATES[1].id)

  const create = () => {
    const tpl = TEMPLATES.find((t) => t.id === selected)!
    const item: ReportItem = {
      id: `RPT-${1000 + value.length + 1}`,
      template: tpl.name,
      createdAt: '09/06/2026, 13:45',
    }
    onChange([...value, item])
    setPicking(false)
  }

  return (
    <div className="space-y-4">
      {!picking ? (
        <button
          onClick={() => setPicking(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary bg-card py-5 text-sm font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary-soft/40"
        >
          <Plus size={18} />
          Create a Report
        </button>
      ) : (
        <>
          <section className="rounded-xl bg-card p-6 shadow-card">
            <p className="mb-5 text-sm text-ink">Select the template you want to use.</p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {TEMPLATES.map((t) => {
                const active = t.id === selected
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t.id)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      active ? 'border-primary' : 'border-line hover:border-primary/50'
                    }`}
                  >
                    <div className="relative grid h-32 place-items-center rounded-lg bg-page">
                      <span
                        className={`absolute left-3 top-3 grid h-5 w-5 place-items-center rounded-full border-2 ${
                          active ? 'border-primary' : 'border-faint'
                        }`}
                      >
                        {active && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                      </span>
                      <TemplateThumb />
                    </div>
                    <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-ink">{t.name}</p>
                    <p className="mt-1 text-sm text-muted">{t.desc}</p>
                  </button>
                )
              })}
            </div>
          </section>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setPicking(false)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-primary-700"
            >
              <ChevronLeft size={14} /> Back
            </button>
            <button
              onClick={create}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-primary-700"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </>
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
                <button className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                  <Download size={14} /> Download
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// Tiny report-preview thumbnail (chart bars + text lines), matching the Figma mock.
function TemplateThumb() {
  return (
    <svg width="120" height="78" viewBox="0 0 120 78" fill="none">
      <rect x="0" y="0" width="120" height="78" rx="6" fill="#e7e7e7" />
      <g fill="#c3c5c7">
        {[34, 26, 38, 22, 30, 18].map((h, i) => (
          <rect key={i} x={20 + i * 9} y={50 - h} width="5" height={h} rx="1" />
        ))}
        <rect x="20" y="56" width="50" height="4" rx="2" />
        <rect x="20" y="64" width="64" height="4" rx="2" />
      </g>
    </svg>
  )
}
