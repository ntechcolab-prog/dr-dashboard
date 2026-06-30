import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/src/server/auth'

export async function POST() {
  await clearSessionCookie()
  return NextResponse.json({ ok: true })
}
