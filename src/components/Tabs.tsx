export interface TabDef {
  key: string
  label: string
}

interface TabsProps {
  tabs: TabDef[]
  active: string
  onChange: (key: string) => void
}

export default function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex items-center gap-1 border-b border-line px-2">
      {tabs.map((t) => {
        const isActive = t.key === active
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`relative -mb-px rounded-t-md px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive ? 'text-primary' : 'text-muted hover:text-ink'
            }`}
          >
            {isActive && (
              <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-primary" />
            )}
            <span
              className={
                isActive
                  ? 'rounded-full bg-primary-soft px-3 py-1 text-primary-700'
                  : ''
              }
            >
              {t.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
