'use client'

import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

export interface SessionUser {
  id: string
  name: string
  email: string
  isAdmin: boolean
  company: { id: string; name: string }
}

const SessionContext = createContext<SessionUser | null>(null)

export function SessionProvider({ user, children }: { user: SessionUser; children: ReactNode }) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>
}

export function useSession(): SessionUser {
  const user = useContext(SessionContext)
  if (!user) throw new Error('useSession must be used inside <SessionProvider>')
  return user
}

// "Gabriel Oliveira" -> "GO", "ACME" -> "AC". Used for the launcher avatar.
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] || name
}
