'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IrisLogo } from '@/src/client/iris/IrisLogo'
import { IrisField } from '@/src/client/iris/IrisField'
import { TurnstileBadge } from '@/src/client/iris/TurnstileBadge'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setNote(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        router.push('/')
        router.refresh()
        return
      }
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'Login failed.')
    } catch {
      setError('Network error. Try again.')
    }
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#4b4b53] p-6">
      <div className="w-full max-w-[26rem] rounded-2xl bg-[#6b6b73] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="mb-7">
          <IrisLogo size="lg" />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <IrisField
            label="Email *"
            name="email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />
          <IrisField
            label="Password *"
            name="password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />

          <TurnstileBadge />

          {error && (
            <p className="rounded-md bg-[#c12907]/15 px-3 py-2 text-sm text-[#ffd9d2]">{error}</p>
          )}
          {note && <p className="text-center text-sm text-white/80">{note}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-[#6ca8c9] py-3 text-[0.95rem] font-medium uppercase tracking-wide text-white transition-colors hover:bg-[#5b97b8] disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setNote('Password reset isn’t available in this preview. Contact your administrator.')}
          className="mx-auto mt-6 block text-[0.8rem] font-medium uppercase tracking-wide text-white/90 hover:text-white"
        >
          Forgot your password?
        </button>

        <p className="mt-5 text-center text-[0.8rem] text-white/70">
          New here?{' '}
          <Link href="/signup" className="font-medium text-[#bcdcee] hover:text-white">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  )
}
