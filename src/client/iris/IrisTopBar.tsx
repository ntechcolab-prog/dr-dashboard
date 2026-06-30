'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IrisLogo } from './IrisLogo'
import { useSession, initialsOf } from '@/src/client/Session'

function AppGrid() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor" aria-hidden>
      {[4, 12, 20].flatMap((y) => [5, 12, 19].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />))}
    </svg>
  )
}

function Hamburger() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function IrisTopBar() {
  const user = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="flex h-16 items-center justify-between bg-[#41414a] px-6">
      <div className="flex items-center gap-5">
        <Link href="/" aria-label="Applications">
          <AppGrid />
        </Link>
        <Link href="/">
          <IrisLogo size="sm" />
        </Link>
      </div>

      <div className="flex items-center gap-5">
        <Link href="/" className="flex items-center gap-2 text-white">
          <span className="text-[0.95rem] font-medium">Hello,</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6ca8c9] text-[0.8rem] font-semibold text-white">
            {initialsOf(user.name)}
          </span>
        </Link>

        <div className="relative">
          <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            <Hamburger />
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-md bg-white py-1 shadow-lg ring-1 ring-black/10">
                <div className="px-4 py-2 text-xs text-[#8d9094]">
                  {user.name}
                  <div className="truncate">{user.company.name}</div>
                </div>
                <div className="my-1 h-px bg-[#ececec]" />
                <Link
                  href="/batch-book"
                  className="block px-4 py-2 text-sm text-[#4c4d57] hover:bg-[#f6f6f6]"
                  onClick={() => setOpen(false)}
                >
                  Production Monitoring
                </Link>
                {user.isAdmin && (
                  <Link
                    href="/admin"
                    className="block px-4 py-2 text-sm text-[#4c4d57] hover:bg-[#f6f6f6]"
                    onClick={() => setOpen(false)}
                  >
                    Admin · Users
                  </Link>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="block w-full px-4 py-2 text-left text-sm text-[#c12907] hover:bg-[#f6f6f6]"
                >
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
