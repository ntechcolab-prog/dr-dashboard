import type { ReactNode } from 'react'
import { Menu, Calendar, Bell, Gear } from '../icons/Icons'

interface AppHeaderProps {
  onToggleSidebar: () => void
}

export default function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-header px-4 text-white">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="grid h-9 w-9 place-items-center rounded-md text-white/80 hover:bg-white/10"
          aria-label="Toggle menu"
        >
          <Menu size={22} />
        </button>
        <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-[11px] font-bold">
          DR
        </div>
        <span className="text-base font-medium tracking-tight">Digital Reports</span>
      </div>

      <div className="flex items-center gap-1">
        <HeaderIcon><Calendar size={20} /></HeaderIcon>
        <HeaderIcon><Bell size={20} /></HeaderIcon>
        <div className="mx-2 hidden items-center gap-2 sm:flex">
          <span className="text-sm text-white/80">Hello,</span>
          <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-[11px] font-bold uppercase">
            go
          </div>
        </div>
        <HeaderIcon><Gear size={20} /></HeaderIcon>
      </div>
    </header>
  )
}

function HeaderIcon({ children }: { children: ReactNode }) {
  return (
    <button className="grid h-9 w-9 place-items-center rounded-md text-white/80 hover:bg-white/10">
      {children}
    </button>
  )
}
