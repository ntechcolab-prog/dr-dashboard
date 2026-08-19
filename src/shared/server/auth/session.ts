import { SignJWT, jwtVerify } from 'jose'

// Edge-safe (jose) session helpers. Used by both Node route handlers and the
// Edge middleware, so this file must NOT import node:crypto or the db.

export const SESSION_COOKIE_NAME = 'bb_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days, seconds

export interface SessionPayload {
  userId: string
  companyId: string
  isAdmin: boolean
}

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET
  if (!s) throw new Error('SESSION_SECRET is not set.')
  return new TextEncoder().encode(s)
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret())
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    return {
      userId: String(payload.userId),
      companyId: String(payload.companyId),
      isAdmin: payload.isAdmin === true,
    }
  } catch {
    return null
  }
}
