// Authentication against the Notify / IRIS Cloud API.
//
// Login body is `{ login, password, recaptchaValue }` where recaptchaValue is a
// Cloudflare Turnstile token. The response is a JWT pair `{ access, refresh }`.
// The active organization is read from the access-token claims (no tenant header).

import { request } from './client'
import { decodeJwt } from './jwt'
import { clearTokens, getAccessToken, setTokens } from './tokenStore'
import type { JwtClaims, LoginRequest, TokenPair } from './types'

export async function login(login: string, password: string, recaptchaValue: string): Promise<TokenPair> {
  const body: LoginRequest = { login, password, recaptchaValue }
  const pair = await request<TokenPair>('/v1/users/login', { method: 'POST', body, skipAuthRefresh: true })
  setTokens(pair.access, pair.refresh)
  return pair
}

export async function logout(): Promise<void> {
  try {
    await request('/v1/users/logout', { method: 'POST' })
  } finally {
    clearTokens()
  }
}

export function currentClaims(): JwtClaims | null {
  const token = getAccessToken()
  return token ? decodeJwt<JwtClaims>(token) : null
}

/** First organization id from the token claims (the backend picks the first). */
export function activeOrganizationId(): string | null {
  const orgs = currentClaims()?.organizations
  if (!orgs) return null
  return Object.keys(orgs)[0] ?? null
}

/** Role for the active organization. */
export function activeOrganizationRole(): string | null {
  const claims = currentClaims()
  const orgId = claims ? Object.keys(claims.organizations)[0] : null
  return claims && orgId ? claims.organizations[orgId] ?? null : null
}

/** Enabled feature constants (e.g. BATCH_RECORDS) from the token. */
export function enabledFeatures(): string[] {
  return (currentClaims()?.features ?? []).filter((f) => f.enabled).map((f) => f.feature.constant)
}

export function hasFeature(constant: string): boolean {
  return enabledFeatures().includes(constant)
}
