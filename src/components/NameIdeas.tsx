import { useState } from 'react'
import { useLocalStorage } from '../lib/useLocalStorage'
import { Tag, Close, Plus, CheckCircle } from '../icons/Icons'

// Seed suggestions that echo the NETZSCH product family (Norius, Notify, IRIS)
// plus a play on "lote" (batch in PT).
const SEED = [
  'Lotis',
  'Lotaris',
  'Noris',
  'Veris',
  'Claris',
  'Lorius',
  'Valorius',
  'Batchify',
  'Reportify',
  'Millify',
]

export default function NameIdeas() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useLocalStorage<string>('dr-name-current', 'Batch Book')
  const [ideas, setIdeas] = useLocalStorage<string[]>('dr-name-ideas', SEED)
  const [draft, setDraft] = useState('')

  const add = () => {
    const v = draft.trim()
    if (!v) return
    const exists = [current, ...ideas].some((n) => n.toLowerCase() === v.toLowerCase())
    if (!exists) setIdeas([v, ...ideas])
    setDraft('')
  }

  // Promote an idea to "current"; the old current goes back into the list.
  const pick = (name: string) => {
    setIdeas((prev) => {
      const without = prev.filter((n) => n !== name)
      return current && !without.includes(current) ? [current, ...without] : without
    })
    setCurrent(name)
  }

  const remove = (name: string) => setIdeas((prev) => prev.filter((n) => n !== name))

  return (
    <>
      {/* edge handle */}
      <button
        onClick={() => setOpen(true)}
        title="Name ideas"
        className="fixed right-0 top-1/2 z-30 flex -translate-y-1/2 items-center gap-1.5 rounded-l-lg bg-primary px-2.5 py-3 text-white shadow-pop transition-colors hover:bg-primary-700"
      >
        <Tag size={16} />
        <span className="text-[11px] font-semibold uppercase tracking-wide [writing-mode:vertical-rl]">Names</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setOpen(false)} />
          <aside className="fixed right-0 top-0 z-50 flex h-full w-[330px] flex-col bg-white shadow-pop">
            {/* header */}
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-2 text-primary">
                <Tag size={18} />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">Name ideas</h2>
              </div>
              <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-page" aria-label="Close">
                <Close size={18} />
              </button>
            </div>

            {/* current pick */}
            <div className="border-b border-line px-5 py-4">
              <p className="text-[11px] uppercase tracking-wide text-muted">Current name</p>
              <div className="mt-1.5 flex items-center gap-2">
                <CheckCircle size={18} className="text-primary" />
                <span className="text-lg font-bold text-ink">{current}</span>
              </div>
            </div>

            {/* add */}
            <div className="border-b border-line px-5 py-3">
              <div className="flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && add()}
                  placeholder="Add a name…"
                  className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <button
                  onClick={add}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-white hover:bg-primary-700"
                  aria-label="Add name"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* ideas list */}
            <div className="flex-1 overflow-auto px-5 py-3">
              <p className="mb-2 text-[11px] uppercase tracking-wide text-muted">Ideas ({ideas.length})</p>
              <ul className="space-y-1">
                {ideas.map((name) => (
                  <li key={name} className="group flex items-center justify-between rounded-lg px-2 py-2 hover:bg-page">
                    <button onClick={() => pick(name)} className="flex flex-1 items-center gap-2 text-left text-sm text-ink" title="Set as current">
                      <span className="h-2 w-2 shrink-0 rounded-full border border-faint group-hover:border-primary" />
                      {name}
                    </button>
                    <button
                      onClick={() => remove(name)}
                      className="ml-2 grid h-6 w-6 place-items-center rounded text-faint opacity-0 transition-opacity hover:text-down group-hover:opacity-100"
                      aria-label={`Remove ${name}`}
                    >
                      <Close size={14} />
                    </button>
                  </li>
                ))}
                {ideas.length === 0 && <li className="px-2 py-6 text-center text-sm text-muted">No ideas saved yet.</li>}
              </ul>
            </div>

            <p className="border-t border-line px-5 py-3 text-[11px] text-muted">
              Click a name to make it current. Saved in this browser.
            </p>
          </aside>
        </>
      )}
    </>
  )
}
