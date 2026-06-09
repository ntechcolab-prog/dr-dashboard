import { useRef, useState } from 'react'
import { useLocalStorage } from '../lib/useLocalStorage'
import { Tag, Close, Plus, CheckCircle, ArrowUp } from '../icons/Icons'

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

interface Props {
  name: string
  onPickName: (name: string) => void
  icon: string | null
  onIconChange: (icon: string | null) => void
}

export default function NameIdeas({ name, onPickName, icon, onIconChange }: Props) {
  const [open, setOpen] = useState(false)
  const [ideas, setIdeas] = useLocalStorage<string[]>('dr-name-ideas', SEED)
  const [draft, setDraft] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const add = () => {
    const v = draft.trim()
    if (!v) return
    const exists = [name, ...ideas].some((n) => n.toLowerCase() === v.toLowerCase())
    if (!exists) setIdeas([v, ...ideas])
    setDraft('')
  }

  // Promote an idea to "current"; the old current goes back into the list.
  const pick = (picked: string) => {
    setIdeas((prev) => {
      const without = prev.filter((n) => n !== picked)
      return name && !without.includes(name) ? [name, ...without] : without
    })
    onPickName(picked)
  }

  const remove = (n: string) => setIdeas((prev) => prev.filter((x) => x !== n))

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onIconChange(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = '' // allow re-selecting the same file
  }

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
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">Branding (temp)</h2>
              </div>
              <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-page" aria-label="Close">
                <Close size={18} />
              </button>
            </div>

            {/* current pick + icon */}
            <div className="border-b border-line px-5 py-4">
              <p className="text-[11px] uppercase tracking-wide text-muted">Current name</p>
              <div className="mt-1.5 flex items-center gap-2">
                <CheckCircle size={18} className="text-primary" />
                <span className="text-lg font-bold text-ink">{name}</span>
              </div>

              <p className="mt-4 text-[11px] uppercase tracking-wide text-muted">Header icon</p>
              <div className="mt-2 flex items-center gap-3">
                {icon ? (
                  <img src={icon} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-line" />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                    {initials(name)}
                  </div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink hover:bg-page"
                >
                  <ArrowUp size={14} /> Upload
                </button>
                {icon && (
                  <button onClick={() => onIconChange(null)} className="text-xs font-medium text-muted hover:text-down">
                    Remove
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
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
                {ideas.map((n) => (
                  <li key={n} className="group flex items-center justify-between rounded-lg px-2 py-2 hover:bg-page">
                    <button onClick={() => pick(n)} className="flex flex-1 items-center gap-2 text-left text-sm text-ink" title="Set as current">
                      <span className="h-2 w-2 shrink-0 rounded-full border border-faint group-hover:border-primary" />
                      {n}
                    </button>
                    <button
                      onClick={() => remove(n)}
                      className="ml-2 grid h-6 w-6 place-items-center rounded text-faint opacity-0 transition-opacity hover:text-down group-hover:opacity-100"
                      aria-label={`Remove ${n}`}
                    >
                      <Close size={14} />
                    </button>
                  </li>
                ))}
                {ideas.length === 0 && <li className="px-2 py-6 text-center text-sm text-muted">No ideas saved yet.</li>}
              </ul>
            </div>

            <p className="border-t border-line px-5 py-3 text-[11px] text-muted">
              Click a name to apply it to the header. Temporary — saved in this browser.
            </p>
          </aside>
        </>
      )}
    </>
  )
}

// Up to two uppercase initials from the app name (e.g. "Batch Book" → "BB").
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'DR'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
