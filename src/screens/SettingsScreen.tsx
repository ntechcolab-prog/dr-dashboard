import { useMemo, useState } from 'react'
import SubHeader from '../components/SubHeader'
import { Gear, Search, ChevronDown } from '../icons/Icons'
import { SETTINGS_TABS, MACHINE_CARDS, type MachineCard } from '../data/appData'

export default function SettingsScreen() {
  const [tab, setTab] = useState('Machines & Equipment')
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const machines = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return MACHINE_CARDS
    return MACHINE_CARDS.filter((m) =>
      [m.name, m.line, m.subtitle, m.productFamily, m.commission].some((v) =>
        v.toLowerCase().includes(q)
      )
    )
  }, [query])

  return (
    <div className="mx-auto flex max-w-[80rem] flex-col gap-4 p-5">
      <SubHeader Icon={Gear} title="Settings" />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-card p-2 shadow-card">
        {SETTINGS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              t === tab ? 'bg-primary text-white' : 'text-muted hover:bg-page hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Machines & Equipment' ? (
        <section className="rounded-xl bg-card p-6 shadow-card">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-ink">Machines</h2>
            <button className="flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary-soft">
              <FilterIcon /> Filters
            </button>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-line px-3 py-2.5">
                <Search size={16} className="text-muted" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search machine, reference…"
                  className="w-52 bg-transparent text-sm outline-none placeholder:text-muted"
                />
              </div>
              <Pill label="Sort by" />
              <Pill label="Application" />
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-line p-1">
              <ViewToggle active={view === 'list'} onClick={() => setView('list')} kind="list" />
              <ViewToggle active={view === 'grid'} onClick={() => setView('grid')} kind="grid" />
            </div>
          </div>

          <div
            className={
              view === 'grid'
                ? 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'
                : 'flex flex-col gap-3'
            }
          >
            {machines.map((m) => (
              <MachineTile key={m.name} machine={m} compact={view === 'list'} />
            ))}
          </div>
        </section>
      ) : (
        <section className="grid place-items-center rounded-xl bg-card p-20 text-center shadow-card">
          <div>
            <p className="text-lg font-semibold text-ink">{tab}</p>
            <p className="mt-1 text-sm text-muted">This settings section isn't built out yet.</p>
          </div>
        </section>
      )}
    </div>
  )
}

function MachineTile({ machine, compact }: { machine: MachineCard; compact: boolean }) {
  return (
    <div
      className={`rounded-xl border border-line bg-white p-4 ${
        compact ? 'flex items-center gap-5' : ''
      }`}
    >
      <div
        className={`relative grid place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-page to-[#eef1f3] ${
          compact ? 'h-20 w-28 shrink-0' : 'mb-4 h-36 w-full'
        }`}
      >
        <MachineGlyph />
        {machine.upgrade && !compact && (
          <span className="absolute right-2 top-2 rounded-full border border-primary bg-white px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-primary">
            Upgrade
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="truncate text-base font-semibold text-ink">{machine.name}</p>
          <ChevronDown size={16} className="-rotate-90 text-muted" />
        </div>
        <p className="mt-0.5 text-[0.6875rem] font-medium uppercase tracking-wide text-muted">
          {machine.line || machine.subtitle}
        </p>

        <div className="mt-3 space-y-1.5 text-xs">
          <Field label="Install Date" value={machine.installDate} />
          <Field label="Hours" value={machine.hours} />
          <Field label="Product Family" value={machine.productFamily} />
          <Field label="Commission Number" value={machine.commission} accent />
        </div>

        <p className="mt-3 border-t border-line pt-2 text-[0.6875rem] text-muted">
          Last Service <span className="float-right text-ink">{machine.lastService}</span>
        </p>
      </div>
    </div>
  )
}

function Field({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className={accent ? 'font-medium text-primary' : 'font-medium text-ink'}>{value}</span>
    </div>
  )
}

function Pill({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm text-muted hover:text-ink">
      {label}
      <ChevronDown size={14} />
    </button>
  )
}

function ViewToggle({ active, onClick, kind }: { active: boolean; onClick: () => void; kind: 'grid' | 'list' }) {
  return (
    <button
      onClick={onClick}
      className={`grid h-7 w-7 place-items-center rounded-md ${
        active ? 'bg-primary-soft text-primary' : 'text-muted hover:text-ink'
      }`}
      aria-label={`${kind} view`}
    >
      {kind === 'grid' ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="3" width="8" height="8" rx="1" />
          <rect x="13" y="3" width="8" height="8" rx="1" />
          <rect x="3" y="13" width="8" height="8" rx="1" />
          <rect x="13" y="13" width="8" height="8" rx="1" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      )}
    </button>
  )
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

function MachineGlyph() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="text-faint">
      <rect x="10" y="20" width="28" height="26" rx="3" fill="currentColor" opacity="0.5" />
      <rect x="38" y="28" width="16" height="18" rx="2" fill="currentColor" opacity="0.35" />
      <circle cx="24" cy="33" r="7" fill="#fff" opacity="0.7" />
      <rect x="18" y="46" width="32" height="4" rx="2" fill="currentColor" opacity="0.6" />
      <rect x="20" y="14" width="8" height="8" rx="1" fill="var(--color-primary)" opacity="0.7" />
    </svg>
  )
}
