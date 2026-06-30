import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import { db } from '@/src/server/db'
import { users, companies } from '@/src/server/db/schema'
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE, verifySessionToken } from './session'

export interface CurrentUser {
  id: string
  name: string
  email: string
  isAdmin: boolean
  company: { id: string; name: string }
}

// Reads the session cookie, verifies it, and loads the user + company.
// Returns null when unauthenticated or the user no longer exists.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  const session = await verifySessionToken(token)
  if (!session) return null

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      isAdmin: users.isAdmin,
      companyId: companies.id,
      companyName: companies.name,
    })
    .from(users)
    .innerJoin(companies, eq(users.companyId, companies.id))
    .where(eq(users.id, session.userId))
    .limit(1)

  const row = rows[0]
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    isAdmin: row.isAdmin,
    company: { id: row.companyId, name: row.companyName },
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  ;(await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

export async function clearSessionCookie(): Promise<void> {
  ;(await cookies()).delete(SESSION_COOKIE_NAME)
}

// Admins are designated by the ADMIN_EMAILS env (comma-separated), resolved at
// signup time. Centralised here so the rule lives in one place.
export function isAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.trim().toLowerCase())
}

export function normalizeCompanyName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}
