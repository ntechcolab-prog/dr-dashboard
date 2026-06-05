export interface TabDef {
  key: string
  label: string
}

interface TabsProps {
  tabs: TabDef[]
  active: string
  onChange: (key: string) => void
}

// Segmented control (consistent with the Monthly/Weekly and period toggles).
export default function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="inline-flex rounded-xl bg-page p-1 shadow-card">
      {tabs.map((t) => {
        const isActive = t.key === active
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`rounded-lg px-6 py-2 text-sm font-semibold transition-colors ${
              isActive ? 'bg-white text-primary shadow-card' : 'text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
