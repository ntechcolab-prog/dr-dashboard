'use client'

// Batch detail — full record + notes from the real backend.
// GET /v1/batch/{id} (id = the record UUID, not the human batch_id label).

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { isAuthenticated } from '@/src/api/tokenStore'
import { getBatch } from '@/src/api/batches'
import { statusToDisplay } from '@/src/api/adapters'
import IrisNav from '@/src/client/iris/IrisNav'
import { ApiRequestError } from '@/src/api/client'
import type { BatchRecord } from '@/src/api/types'

const errMsg = (e: unknown) =>
  e instanceof ApiRequestError ? `${e.status} ${e.code ?? ''} — ${e.message}` : e instanceof Error ? e.message : String(e)

const fmt = (n?: number) => (n == null ? '—' : n.toLocaleString('en-US'))
const fmtDate = (iso?: string) => (iso ? iso.replace('T', ' ').slice(0, 16) : '—')

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[0.625rem] uppercase tracking-wide text-muted">{label}</p>
      <p className="text-sm font-medium tabular-nums text-ink">{value}</p>
    </div>
  )
}

export default function IrisBatchDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [batch, setBatch] = useState<BatchRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setAuthed(isAuthenticated()), [])

  const load = useCallback(async (batchId: string) => {
    setLoading(true)
    setError(null)
    try {
      setBatch(await getBatch(batchId))
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authed && id) load(id)
  }, [authed, id, load])

  if (authed === null) return null
  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-page px-4">
        <div className="max-w-sm text-center">
          <p className="mb-4 text-sm text-muted">Not authenticated with IRIS.</p>
          <Link href="/iris-login" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
            Go to login
          </Link>
        </div>
      </main>
    )
  }

  const d = batch?.details
  const p = batch?.property
  const notes = batch?.batch_notes ?? []

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <IrisNav />
      <div className="mb-4">
        <Link href="/iris-registry" className="text-xs text-muted hover:text-ink">
          ← Registry
        </Link>
      </div>

      {loading && <p className="text-sm text-muted">Loading…</p>}
      {error && <p className="text-sm text-warning">{error}</p>}

      {batch && d && (
        <>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-ink">{d.batch_id}</h1>
              <p className="text-sm text-muted">
                {batch.machine?.name ?? batch.machine_id} · {d.recipe && d.recipe !== '-' ? d.recipe : 'no recipe'}
              </p>
            </div>
            <span className="rounded-full bg-line/40 px-2.5 py-1 text-xs font-semibold text-muted">
              {statusToDisplay(String(d.status))}
            </span>
          </div>

          <section className="mb-4 grid grid-cols-2 gap-4 rounded-xl border border-line/70 bg-card p-4 shadow-card sm:grid-cols-4">
            <Field label="Size" value={fmt(d.size)} />
            <Field label="Length" value={fmt(d.length)} />
            <Field label="Progress" value={d.progress != null ? `${Math.round(d.progress)}%` : '—'} />
            <Field label="Cycles" value={fmt(d.cycles)} />
            <Field label="Start" value={fmtDate(d.date?.start)} />
            <Field label="End" value={fmtDate(d.date?.end)} />
            <Field label="Origin" value={batch.origin ?? '—'} />
            <Field label="Max temp" value={fmt(d.max_allowed_temperature)} />
          </section>

          <section className="mb-4 rounded-xl border border-line/70 bg-card p-4 shadow-card">
            <p className="mb-3 text-[0.8125rem] font-semibold uppercase tracking-wide text-ink">Energy</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Grinding energy" value={fmt(p?.grinding_energy)} />
              <Field label="Specific energy" value={fmt(p?.specific_energy)} />
              <Field label="Est. consumption" value={fmt(p?.est_energy_consumption)} />
              <Field label="Total grind time" value={fmt(p?.total_grinding_time)} />
            </div>
          </section>

          <section className="rounded-xl border border-line/70 bg-card p-4 shadow-card">
            <p className="mb-3 text-[0.8125rem] font-semibold uppercase tracking-wide text-ink">
              Notes ({notes.length})
            </p>
            {notes.length === 0 && <p className="text-sm text-faint">No notes.</p>}
            <div className="flex flex-col gap-3">
              {notes.map((n) => (
                <div key={n.id} className="rounded-lg border border-line/60 bg-page/30 p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{n.title || '—'}</span>
                    <span className="text-[0.6875rem] text-muted">
                      {n.user_name} · {fmtDate(n.created_at)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-muted">{n.note}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}
