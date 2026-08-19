import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/src/shared/server/db'
import { users } from '@/src/shared/server/db/schema'
import { verifyPassword } from '@/src/shared/server/auth/password'
import { createSessionToken } from '@/src/shared/server/auth/session'
import { setSessionCookie } from '@/src/shared/server/auth'

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')
  if (!email || !password)
    return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 })

  const user = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0]
  // Same error whether the email is unknown or the password is wrong.
  if (!user || !(await verifyPassword(password, user.passwordHash)))
    return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 })

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id))

  const token = await createSessionToken({
    userId: user.id,
    companyId: user.companyId,
    isAdmin: user.isAdmin,
  })
  await setSessionCookie(token)
  return NextResponse.json({ ok: true })
}
