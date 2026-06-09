import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AppsGrid, Calendar, Bell, ChevronDown } from '../icons/Icons'
import { buildWeeks } from '../lib/weeks'

interface AppHeaderProps {
  onToggleSidebar: () => void
  name: string
  icon: string | null
}

// Up to two uppercase initials from the app name (e.g. "Batch Book" → "BB").
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'DR'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface Notification {
  id: number
  text: string
  time: string
  read: boolean
}

const INITIAL_NOTIFS: Notification[] = [
  { id: 1, text: 'Batch #12003 finished on Zeta 10.', time: '2 min ago', read: false },
  { id: 2, text: 'Maintenance due on Alpha Zeta 10.', time: '1 h ago', read: false },
  { id: 3, text: 'OEE dropped below target on Line B.', time: '3 h ago', read: false },
  { id: 4, text: 'Monthly report for March is ready.', time: 'Yesterday', read: true },
]

export default function AppHeader({ onToggleSidebar, name, icon }: AppHeaderProps) {
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL_NOTIFS)
  const unread = notifs.filter((n) => !n.read).length

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-header px-4 text-white">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="grid h-9 w-9 place-items-center rounded-md text-white/80 hover:bg-white/10"
          aria-label="Toggle menu"
        >
          <AppsGrid size={20} />
        </button>
        {icon ? (
          <img src={icon} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-[11px] font-bold">
            {initials(name)}
          </div>
        )}
        <span className="text-base font-medium tracking-tight">{name}</span>
      </div>

      <div className="flex items-center gap-1">
        {/* Calendar */}
        <Popover
          icon={<Calendar size={20} />}
          align="right"
          panelClassName="w-72"
          render={() => <MiniCalendar />}
        />

        {/* Notifications */}
        <Popover
          icon={<Bell size={20} />}
          align="right"
          panelClassName="w-80"
          badge={unread}
          render={() => (
            <Notifications
              notifs={notifs}
              onRead={(id) => setNotifs((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n)))}
              onReadAll={() => setNotifs((ns) => ns.map((n) => ({ ...n, read: true })))}
            />
          )}
        />

        <div className="mx-1 hidden items-center gap-2 sm:flex">
          <span className="text-sm text-white/80">Hello,</span>
        </div>

        {/* Account menu (gear) */}
        <Popover
          align="right"
          panelClassName="w-56"
          trigger={
            <span className="flex items-center gap-1.5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-[11px] font-bold uppercase">
                go
              </span>
              <ChevronDown size={14} className="text-white/70" />
            </span>
          }
          render={() => <AccountMenu />}
        />
      </div>
    </header>
  )
}

interface PopoverProps {
  icon?: ReactNode
  trigger?: ReactNode
  badge?: number
  align?: 'left' | 'right'
  panelClassName?: string
  render: (close: () => void) => ReactNode
}

function Popover({ icon, trigger, badge, align = 'right', panelClassName = '', render }: PopoverProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 min-w-9 place-items-center rounded-md px-1 text-white/80 hover:bg-white/10"
      >
        {trigger ?? icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-down px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </button>
      {open && (
        <div
          className={`absolute top-full z-40 mt-2 overflow-hidden rounded-xl border border-line bg-white text-ink shadow-pop ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${panelClassName}`}
        >
          {render(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

function MiniCalendar() {
  // April 2026 by default; navigable.
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(3)
  const today = { y: 2026, m: 3, d: 17 }
  const weeks = buildWeeks(year, month)

  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  return (
    <div className="p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <button onClick={() => shift(-1)} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-page">‹</button>
        <span className="text-sm font-semibold">{MONTH_NAMES[month]} {year}</span>
        <button onClick={() => shift(1)} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-page">›</button>
      </div>
      <div className="grid grid-cols-7 text-center text-[10px] text-muted">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className="py-1">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
        {weeks.flat().map((day, i) => {
          const isToday = day === today.d && month === today.m && year === today.y
          return (
            <div
              key={i}
              className={`grid h-8 place-items-center rounded-md ${
                day == null
                  ? ''
                  : isToday
                  ? 'bg-primary font-semibold text-white'
                  : 'text-ink hover:bg-page'
              }`}
            >
              {day ?? ''}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface NotificationsProps {
  notifs: Notification[]
  onRead: (id: number) => void
  onReadAll: () => void
}

function Notifications({ notifs, onRead, onReadAll }: NotificationsProps) {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="text-sm font-semibold">Notifications</p>
        <button onClick={onReadAll} className="text-xs font-medium text-primary hover:underline">
          Mark all read
        </button>
      </div>
      <div className="max-h-80 overflow-auto">
        {notifs.map((n) => (
          <button
            key={n.id}
            onClick={() => onRead(n.id)}
            className="flex w-full items-start gap-2.5 border-b border-line px-4 py-3 text-left last:border-0 hover:bg-page"
          >
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-primary'}`} />
            <span>
              <span className={`block text-sm ${n.read ? 'text-muted' : 'text-ink'}`}>{n.text}</span>
              <span className="text-[11px] text-faint">{n.time}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function AccountMenu() {
  return (
    <div className="py-1">
      <div className="border-b border-line px-4 py-3">
        <p className="text-sm font-semibold text-ink">Gabriel Oliveira</p>
        <p className="text-xs text-muted">gabriel.oliveira@netzsch.com</p>
      </div>
      <MenuItem label="Profile" onClick={() => {}} />
      <div className="my-1 border-t border-line" />
      <MenuItem label="Sign out" onClick={() => {}} danger />
    </div>
  )
}

function MenuItem({ label, onClick, icon, danger }: { label: string; onClick: () => void; icon?: ReactNode; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-page ${
        danger ? 'text-down' : 'text-ink'
      }`}
    >
      {icon && <span className="text-muted">{icon}</span>}
      {label}
    </button>
  )
}
