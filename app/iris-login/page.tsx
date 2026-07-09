'use client'

// Real login against the Notify / IRIS Cloud API, with a Cloudflare Turnstile
// captcha (CloudflareCaptcha from the shared web-components-ts library). On
// success the JWT pair is stored (localStorage) and we land on the app.
//
// Additive route — the legacy cookie login (/login) is untouched until the auth
// gate is deliberately flipped to IRIS tokens.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { login } from '@/src/api/auth'
import { ApiRequestError } from '@/src/api/client'
import { turnstileSiteKey } from '@/src/config/runtimeConfig'

// Browser-only widget (needs the DOM) — load client-side so it isn't evaluated
// during server prerender.
const CloudflareCaptcha = dynamic(() => import('web-components-ts').then((m) => m.CloudflareCaptcha), {
  ssr: false,
})

export default function IrisLoginPage() {
  const router = useRouter()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [captcha, setCaptcha] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
      router.replace('/')
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Login failed. Check your credentials.')
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4">
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

        <div className="mb-4">
          <CloudflareCaptcha
            id="login-captcha"
            siteKey={turnstileSiteKey()}
            onVerify={(token: string) => setCaptcha(token)}
            onExpire={() => setCaptcha(null)}
          />
        </div>

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
