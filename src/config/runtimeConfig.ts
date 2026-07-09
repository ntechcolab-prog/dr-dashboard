// Runtime configuration — framework-neutral, injected via public/runtime-config.js
// into `window.configuration` (the same pattern the Notify `web` apps use). A
// single build can point at dev/stg/prod because the values are read at runtime,
// not baked in at build time.
//
// TWO base URLs are exposed on purpose: most endpoints live on the customer
// `api` (apiUrl); a few live on the `manager-api` (managerApiUrl). Each API call
// picks its base (see src/api/client.ts). Both URLs already include the trailing
// `/api`; endpoints append `/v1/...`.

export type ApiBase = 'api' | 'manager'

declare global {
  interface Window {
    configuration?: {
      apiUrl?: string
      managerApiUrl?: string
      irisCloudUrl?: string
      turnstileSiteKey?: string
      releaseVersion?: string
    }
  }
}

function config(): NonNullable<Window['configuration']> {
  if (typeof window === 'undefined' || !window.configuration) return {}
  return window.configuration
}

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '')

/** Base URL for the customer `api` surface (the majority of endpoints). */
export function apiBaseUrl(): string {
  return stripTrailingSlash(config().apiUrl ?? '')
}

/** Base URL for the `manager-api` surface (a subset of endpoints). */
export function managerApiBaseUrl(): string {
  return stripTrailingSlash(config().managerApiUrl ?? '')
}

/** Resolve a base URL by name. */
export function baseUrlFor(base: ApiBase): string {
  return base === 'manager' ? managerApiBaseUrl() : apiBaseUrl()
}

/** Cloudflare Turnstile site key (public) for the login captcha. */
export function turnstileSiteKey(): string {
  return config().turnstileSiteKey ?? ''
}

export {}
