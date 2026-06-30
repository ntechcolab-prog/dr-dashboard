'use client'

import Link from 'next/link'
import { IrisTopBar } from '@/src/client/iris/IrisTopBar'
import { useSession, firstNameOf } from '@/src/client/Session'

function ProductionIcon() {
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#6ca8c9]">
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden>
        <path
          d="M4 15l4-4 3 2 5-6"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 19l4-4 3 2 5-6"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
        />
      </svg>
    </span>
  )
}

export default function LauncherPage() {
  const user = useSession()

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <IrisTopBar />

      <div className="px-10 py-12">
        <h1 className="text-3xl font-bold text-[#33333a]">Hi, {firstNameOf(user.name)}</h1>
        <p className="mt-2 text-[#6b6b73]">Choose an application to start</p>

        <div className="mt-8 grid max-w-5xl grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-6">
          <Link
            href="/batch-book"
            className="group relative block rounded-xl bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.06)] ring-1 ring-black/5 transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
          >
            <div className="mb-5 flex items-start gap-4">
              <ProductionIcon />
              <h2 className="mt-1 text-xl font-bold leading-tight text-[#4c4d57]">
                PRODUCTION
                <br />
                MONITORING
              </h2>
            </div>
            <p className="max-w-[15rem] text-[0.95rem] leading-relaxed text-[#5c5f62]">
              Track production batches in real-time with complete visibility into status and history.
            </p>
            <span className="mt-6 flex h-12 w-12 items-center justify-center rounded-lg bg-[#6ca8c9] text-white transition-colors group-hover:bg-[#5b97b8]">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
                <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
