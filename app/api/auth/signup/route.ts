import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/src/shared/server/db'
import { companies, users } from '@/src/shared/server/db/schema'
import { hashPassword } from '@/src/shared/server/auth/password'
import { createSessionToken } from '@/src/shared/server/auth/session'
import { setSessionCookie, isAdminEmail, normalizeCompanyName } from '@/src/shared/server/auth'

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const name = String(body.name ?? '').trim()
  const companyName = String(body.company ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')

  if (!name || !companyName || !email || !password)
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  if (password.length < 8)
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (existing[0])
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })

  // Resolve or create the company (tenant) by normalized name.
  const normalized = normalizeCompanyName(companyName)
  let company = (
    await db.select().from(companies).where(eq(companies.normalizedName, normalized)).limit(1)
  )[0]
  if (!company) {
    await db.insert(companies).values({ name: companyName, normalizedName: normalized }).onConflictDoNothing()
    company = (
      await db.select().from(companies).where(eq(companies.normalizedName, normalized)).limit(1)
    )[0]
  }

  const passwordHash = await hashPassword(password)
  const user = (
    await db
      .insert(users)
      .values({ companyId: company.id, name, email, passwordHash, isAdmin: isAdminEmail(email) })
      .returning()
  )[0]

  const token = await createSessionToken({
    userId: user.id,
    companyId: company.id,
    isAdmin: user.isAdmin,
  })
  await setSessionCookie(token)
  return NextResponse.json({ ok: true })
}
