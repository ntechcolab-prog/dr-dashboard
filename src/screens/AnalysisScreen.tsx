import { useEffect, useState } from 'react'
import SubHeader from '../components/SubHeader'
import { AnalysisIcon, Plus, Trash } from '../icons/Icons'
import AnalysisEditor, { type DraftAnalysis } from './analysis/AnalysisEditor'
import { useLocalStorage } from '../lib/useLocalStorage'

interface SavedAnalysis {
  id: string
  name: string
  batchIds: string[]
  createdAt: string // ISO
}

const fmtDate = (iso: string) => {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AnalysisScreen() {
  const [analyses, setAnalyses] = useLocalStorage<SavedAnalysis[]>('dr-analyses', [])
  const [editing, setEditing] = useState<DraftAnalysis | null>(null)

  // When the dashboard's "Generate Analysis" left a seed, open a fresh editor
  // pre-loaded with the batches that were filtered there, then clear the seed.
  const [seed, setSeed] = useLocalStorage<{ name: string; batchIds: string[] } | null>(
    'dr-analysis-seed',
    null
  )
  useEffect(() => {
    if (seed) {
      setEditing({ name: seed.name, batchIds: seed.batchIds })
      setSeed(null)
    }
  }, [seed, setSeed])

  const openNew = () => setEditing({ name: '', batchIds: [] })
  const openExisting = (a: SavedAnalysis) => setEditing({ id: a.id, name: a.name, batchIds: a.batchIds })

  const onSave = (draft: DraftAnalysis) => {
    setAnalyses((prev) => {
      if (draft.id) {
        return prev.map((a) => (a.id === draft.id ? { ...a, name: draft.name, batchIds: draft.batchIds } : a))
      }
      const created: SavedAnalysis = {
        id: `a-${Date.now()}`,
        name: draft.name,
        batchIds: draft.batchIds,
        createdAt: new Date().toISOString(),
      }
      return [created, ...prev]
    })
    setEditing(null)
  }

  const remove = (id: string) => setAnalyses((prev) => prev.filter((a) => a.id !== id))

  if (editing) {
    return <AnalysisEditor initial={editing} onBack={() => setEditing(null)} onSave={onSave} />
  }

  return (
    <div className="mx-auto flex max-w-[80rem] flex-col gap-4 p-5">
      <SubHeader Icon={AnalysisIcon} title="Analysis" />

      <section className="rounded-xl bg-card p-6 shadow-card">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">Saved Analyses</h2>
          <button onClick={openNew} className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-primary-700">
            <Plus size={16} />
            New Analysis
          </button>
        </div>

        {analyses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line py-12 text-center">
            <p className="text-sm text-muted">No analyses yet.</p>
            <p className="mt-1 text-xs text-faint">Create one to compare batches side by side.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-page/60 text-left text-xs text-muted">
                  <th className="rounded-l-lg px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Batches</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="w-12 rounded-r-lg px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {analyses.map((a) => (
                  <tr key={a.id} onClick={() => openExisting(a)} className="cursor-pointer border-b border-line last:border-0 hover:bg-page/50">
                    <td className="px-4 py-3.5 font-medium text-ink">{a.name}</td>
                    <td className="px-4 py-3.5 text-muted">{a.batchIds.length}</td>
                    <td className="px-4 py-3.5 text-muted">{fmtDate(a.createdAt)}</td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => remove(a.id)} className="text-muted transition-colors hover:text-down" aria-label={`Delete ${a.name}`}>
                        <Trash size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
