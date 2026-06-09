import { DashboardIcon, RegistryIcon, AnalysisIcon, ExampleIcon, Gear, type IconProps } from '../icons/Icons'
import type { ComponentType } from 'react'

interface NavItem {
  key: string
  label: string
  Icon: ComponentType<IconProps>
  disabled?: boolean
}

const NAV: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', Icon: DashboardIcon },
  { key: 'registry', label: 'Registry', Icon: RegistryIcon },
  { key: 'analysis', label: 'Analysis', Icon: AnalysisIcon },
  { key: 'example', label: 'Example', Icon: ExampleIcon, disabled: true },
  { key: 'settings', label: 'Settings', Icon: Gear },
]

interface SidebarProps {
  open: boolean
  active: string
  onSelect: (key: string) => void
}

// Expanded (264px, icon + label) or collapsed to an icon rail (72px).
export default function Sidebar({ open, active, onSelect }: SidebarProps) {
  return (
    <aside
      className={`${
        open ? 'w-[264px]' : 'w-[72px]'
      } shrink-0 overflow-hidden bg-sidebar text-white transition-[width] duration-200`}
    >
      <nav className="flex flex-col gap-1 p-3 pt-4">
        {NAV.map(({ key, label, Icon, disabled }) => {
          const isActive = key === active
          return (
            <button
              key={key}
              onClick={() => !disabled && onSelect(key)}
              disabled={disabled}
              title={disabled ? `${label} (coming soon)` : label}
              aria-disabled={disabled}
              className={`flex items-center gap-3 rounded-md py-2.5 text-sm font-medium transition-colors ${
                open ? 'px-3' : 'justify-center px-0'
              } ${
                disabled
                  ? 'cursor-not-allowed text-white/30'
                  : isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {open && (
                <span className="flex flex-1 items-center justify-between truncate">
                  {label}
                  {disabled && (
                    <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/40">
                      Coming Soon
                    </span>
                  )}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
