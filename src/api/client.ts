// Typed HTTP client for the Notify / IRIS Cloud API.
//
// Behaviour mirrors the customer app's axios setup:
//  - base URL from runtime config
//  - `Authorization: Bearer <accessToken>` on every request
//  - on 401/403, transparently refresh via `GET /v1/tokens` (bearer =
//    refreshToken) and retry once; on failure, clear tokens and bounce to /login
//  - array query params are repeated (`?k=a&k=b`); null/undefined are dropped
//  - error bodies are `{ code, message }`

import { baseUrlFor, type ApiBase } from '../config/runtimeConfig'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './tokenStore'
import type { ApiError, TokenPair } from './types'

export class ApiRequestError extends Error {
  status: number
  code?: string
  constructor(status: number, body?: ApiError) {
    super(body?.message ?? `HTTP ${status}`)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = body?.code
  }
}

export type QueryValue = string | number | boolean | Array<string | number> | null | undefined
export type Query = Record<string, QueryValue>

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  query?: Query
  body?: unknown
  /** Which backend surface to hit. Defaults to the customer `api`. */
  base?: ApiBase
  /** Skip the 401/403 refresh-and-retry (used by login and the refresh call). */
  skipAuthRefresh?: boolean
  /** Override the bearer token (the refresh call sends the refresh token). */
  bearer?: string
  signal?: AbortSignal
}

function buildQuery(query?: Query): string {
  if (!query) return ''
  const parts: string[] = []
  for (const [key, value] of Object.entries(query)) {
    if (value == null) continue
    const push = (v: string | number) => parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`)
    if (Array.isArray(value)) value.forEach((v) => v != null && push(v))
    else push(value as string | number)
  }
  return parts.length ? `?${parts.join('&')}` : ''
}

async function parseError(res: Response): Promise<ApiError | undefined> {
  try {
    return (await res.json()) as ApiError
  } catch {
    return undefined
  }
}

// Single-flight refresh so a burst of 401s triggers one token refresh, not many.
let refreshInFlight: Promise<boolean> | null = null

async function refreshTokens(): Promise<boolean> {
  const refresh = getRefreshToken()
  if (!refresh) return false
  try {
    const pair = await request<TokenPair>('/v1/tokens', { method: 'GET', bearer: refresh, skipAuthRefresh: true })
    setTokens(pair.access, pair.refresh)
    return true
  } catch {
    clearTokens()
    return false
  }
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, base = 'api', skipAuthRefresh = false, bearer, signal } = opts

  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = bearer ?? getAccessToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${baseUrlFor(base)}${path}${buildQuery(query)}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  })

  if ((res.status === 401 || res.status === 403) && !skipAuthRefresh) {
    if (!refreshInFlight) refreshInFlight = refreshTokens().finally(() => (refreshInFlight = null))
    const refreshed = await refreshInFlight
    if (refreshed) return request<T>(path, { ...opts, skipAuthRefresh: true })
    if (typeof window !== 'undefined') window.location.assign('/iris-login')
    throw new ApiRequestError(res.status, await parseError(res))
  }

  if (!res.ok) throw new ApiRequestError(res.status, await parseError(res))
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
