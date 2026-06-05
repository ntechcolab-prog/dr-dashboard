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

export default function Sidebar({ open, active, onSelect }: SidebarProps) {
  return (
    <aside
      className={`${
        open ? 'w-[264px]' : 'w-0'
      } shrink-0 overflow-hidden bg-sidebar text-white transition-[width] duration-200`}
    >
      <nav className="flex w-[264px] flex-col gap-1 p-4">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-white/40">
          Menu
        </p>
        {NAV.map(({ key, label, Icon }) => {
          const isActive = key === active
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={20} />
              {label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
