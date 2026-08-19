import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/src/shared/server/db'
import { companyState } from '@/src/shared/server/db/schema'
import { getCurrentUser } from '@/src/shared/server/auth'

// Per-company key/value store. Authorization is by the company_id on the
// session — a user can only ever touch their own company's keys.

export async function GET(_req: Request, ctx: { params: Promise<{ key: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { key } = await ctx.params

  const row = (
    await db
      .select({ value: companyState.value })
      .from(companyState)
      .where(and(eq(companyState.companyId, user.company.id), eq(companyState.key, key)))
      .limit(1)
  )[0]

  return NextResponse.json({ value: row ? row.value : null })
}

export async function PUT(req: Request, ctx: { params: Promise<{ key: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { key } = await ctx.params

  let value: unknown
  try {
    value = (await req.json()).value
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  await db
    .insert(companyState)
    .values({ companyId: user.company.id, key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [companyState.companyId, companyState.key],
      set: { value, updatedAt: new Date() },
    })

  return NextResponse.json({ ok: true })
}
