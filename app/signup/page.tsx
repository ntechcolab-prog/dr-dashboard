'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IrisLogo } from '@/src/client/iris/IrisLogo'
import { IrisField } from '@/src/client/iris/IrisField'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, company, email, password }),
      })
      if (res.ok) {
        router.push('/')
        router.refresh()
        return
      }
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'Sign up failed.')
    } catch {
      setError('Network error. Try again.')
    }
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#4b4b53] p-6">
      <div className="w-full max-w-[26rem] rounded-2xl bg-[#6b6b73] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="mb-6">
          <IrisLogo size="lg" />
        </div>
        <h1 className="mb-4 text-[1.05rem] font-medium text-white">Create your account</h1>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <IrisField label="Full name *" name="name" value={name} onChange={setName} autoComplete="name" />
          <IrisField
            label="Company *"
            name="company"
            value={company}
            onChange={setCompany}
            autoComplete="organization"
          />
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
            autoComplete="new-password"
          />

          {error && (
            <p className="rounded-md bg-[#c12907]/15 px-3 py-2 text-sm text-[#ffd9d2]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-[#6ca8c9] py-3 text-[0.95rem] font-medium uppercase tracking-wide text-white transition-colors hover:bg-[#5b97b8] disabled:opacity-60"
          >
            {loading ? 'Creating…' : 'Sign up'}
          </button>
        </form>

        <p className="mt-5 text-center text-[0.8rem] text-white/70">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-[#bcdcee] hover:text-white">
            Log in
          </Link>
        </p>
      </div>
    </main>
  )
}
