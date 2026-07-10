'use client'

// Real login against the Notify / IRIS Cloud API, with a Cloudflare Turnstile
// captcha. On success the JWT pair is stored (localStorage) and we land on the
// diagnostic. On staging a bypass hash stands in for the token (see runtime
// config), so the widget is skipped.
//
// Turnstile is loaded via Cloudflare's official script directly (NOT the
// web-components-ts CloudflareCaptcha wrapper) — that lib's bundle crashes at
// runtime here with a React-internals mismatch (ReactCurrentOwner), so it is
// kept out of this page's runtime path.
//
// Additive route — the legacy cookie login (/login) is untouched.

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { login } from '@/src/api/auth'
import { ApiRequestError } from '@/src/api/client'
import { recaptchaBypassHash, turnstileSiteKey } from '@/src/config/runtimeConfig'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      remove: (id: string) => void
    }
  }
}

export default function IrisLoginPage() {
  const router = useRouter()
  // Read from window.configuration only after mount — reading it during render
  // would differ between server ('' — no window) and client, causing a
  // hydration mismatch (React #418).
  const [bypass, setBypass] = useState('')
  const [siteKey, setSiteKey] = useState('')

  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [captcha, setCaptcha] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const widgetRef = useRef<HTMLDivElement>(null)
  const [scriptReady, setScriptReady] = useState(false)
  const captchaRef = useRef<(t: string | null) => void>(() => {})
  captchaRef.current = setCaptcha

  useEffect(() => {
    const bp = recaptchaBypassHash()
    setBypass(bp)
    setSiteKey(turnstileSiteKey())
    if (bp) setCaptcha(bp)
  }, [])

  // Explicitly render the Turnstile widget once the script is ready (prod path).
  useEffect(() => {
    if (bypass || !scriptReady || !widgetRef.current || !window.turnstile) return
    const id = window.turnstile.render(widgetRef.current, {
      sitekey: siteKey,
      callback: (token: string) => captchaRef.current(token),
      'expired-callback': () => captchaRef.current(null),
    })
    return () => {
      try {
        window.turnstile?.remove(id)
      } catch {
        /* widget already gone */
      }
    }
  }, [bypass, scriptReady, siteKey])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!captcha) {
      setError('Please complete the captcha.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await login(loginId, password, captcha)
      router.replace('/iris-app')
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Login failed. Check your credentials.')
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4">
      {!bypass && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
          onReady={() => setScriptReady(true)}
        />
      )}
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-line/70 bg-card p-8 shadow-card">
        <h1 className="mb-1 text-lg font-semibold text-ink">Sign in</h1>
        <p className="mb-6 text-sm text-muted">Batch Book · Notify / IRIS Cloud</p>

        <label className="mb-1.5 block text-xs font-medium text-muted" htmlFor="login">
          Login
        </label>
        <input
          id="login"
          type="text"
          autoComplete="username"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          className="mb-4 w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          required
        />

        <label className="mb-1.5 block text-xs font-medium text-muted" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border border-line bg-page px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          required
        />

        {bypass ? (
          <p className="mb-4 text-[0.6875rem] text-muted">Staging: captcha bypassed.</p>
        ) : (
          <div ref={widgetRef} className="mb-4" />
        )}

        {error && <p className="mb-4 text-sm text-warning">{error}</p>}

        <button
          type="submit"
          disabled={loading || !captcha}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
