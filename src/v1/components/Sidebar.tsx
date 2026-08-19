import { DashboardIcon, RegistryIcon, AnalysisIcon, Gear, PanelLeftCollapse, type IconProps } from '../icons/Icons'
import type { ComponentType } from 'react'
import { isScreenGated } from '../../shared/versionGate'

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
  { key: 'settings', label: 'Settings', Icon: Gear },
]

interface SidebarProps {
  open: boolean
  active: string
  onSelect: (key: string) => void
  onToggle: () => void
  // v0: only the screens in V0_ALLOWED_SCREENS stay enabled (see shared/versionGate).
  restricted?: boolean
}

// Expanded (264px, icon + label) or collapsed to an icon rail (72px).
export default function Sidebar({ open, active, onSelect, onToggle, restricted = false }: SidebarProps) {
  return (
    <aside
      className={`${
        open ? 'w-[16.5rem]' : 'w-[4.5rem]'
      } flex shrink-0 flex-col overflow-hidden bg-sidebar text-white transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]`}
    >
      <nav className="flex flex-1 flex-col gap-1 p-3 pt-4">
        {NAV.map(({ key, label, Icon, disabled: itemDisabled }) => {
          const disabled = itemDisabled || isScreenGated(key, restricted)
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
                <span className="sidebar-label flex flex-1 items-center justify-between truncate">
                  {label}
                  {disabled && (
                    <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide text-white/40">
                      Coming Soon
                    </span>
                  )}
                </span>
              )}
            </button>
          )
        })}

        {/* Hidden entry — "Dashboard V2 (test)". Intentionally invisible: no
            label, icon or hover affordance. It's the full-width row directly
            below Settings; click it to open the experimental dashboard. */}
        <button
          onClick={() => onSelect('dashboard-v2')}
          aria-hidden="true"
          tabIndex={-1}
          title=""
          className="h-10 w-full cursor-default bg-transparent"
        />
      </nav>

      {/* Collapse / expand control, pinned to the bottom of the side menu */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={onToggle}
          title={open ? 'Collapse menu' : 'Expand menu'}
          aria-label={open ? 'Collapse menu' : 'Expand menu'}
          className={`flex w-full items-center gap-3 rounded-md py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white ${
            open ? 'px-3' : 'justify-center px-0'
          }`}
        >
          <PanelLeftCollapse size={20} className={`shrink-0 transition-transform ${open ? '' : 'rotate-180'}`} />
        </button>
      </div>
    </aside>
  )
}
