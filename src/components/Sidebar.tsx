import { DashboardIcon, RegistryIcon, AnalysisIcon, Gear, type IconProps } from '../icons/Icons'
import type { ComponentType } from 'react'

interface NavItem {
  key: string
  label: string
  Icon: ComponentType<IconProps>
}

const NAV: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', Icon: DashboardIcon },
  { key: 'registry', label: 'Registry', Icon: RegistryIcon },
  { key: 'analysis', label: 'Analysis', Icon: AnalysisIcon },
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
      <nav className="flex flex-col gap-1 p-3">
        <p
          className={`px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-white/40 transition-opacity ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Menu
        </p>
        {NAV.map(({ key, label, Icon }) => {
          const isActive = key === active
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              title={label}
              className={`flex items-center gap-3 rounded-md py-2.5 text-sm font-medium transition-colors ${
                open ? 'px-3' : 'justify-center px-0'
              } ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {open && <span className="truncate">{label}</span>}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
