'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { IrisTopBar } from '@/src/client/iris/IrisTopBar'
import { useSession, firstNameOf } from '@/src/client/Session'

function ProductionIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden>
      <path d="M4 15l4-4 3 2 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 19l4-4 3 2 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
    </svg>
  )
}

function BatchBookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden>
      <path
        d="M5 4.5h9.5A2.5 2.5 0 0 1 17 7v12.5H7.5A2.5 2.5 0 0 1 5 17V4.5Z"
        stroke="#fff"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M8 9h6M8 12.5h6M8 16h4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function AppCard({
  href,
  icon,
  title,
  badge,
  disabled,
  children,
}: {
  href: string
  icon: ReactNode
  title: ReactNode
  badge?: string
  disabled?: boolean
  children: ReactNode
}) {
  const body = (
    <>
      {badge && (
        <span className="absolute right-4 top-4 rounded-full bg-[#6ca8c9]/15 px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-[#5b97b8]">
          {badge}
        </span>
      )}
      <div className="mb-5 flex items-start gap-4">
        <span className="flex h-14 w-14 flex-none items-center justify-center rounded-lg bg-[#6ca8c9]">
          {icon}
        </span>
        <h2 className="mt-1 text-xl font-bold leading-tight text-[#4c4d57]">{title}</h2>
      </div>
      <p className="max-w-[15rem] text-[0.95rem] leading-relaxed text-[#5c5f62]">{children}</p>
      {disabled ? (
        <span className="mt-6 inline-flex items-center rounded-full bg-[#e7e8ea] px-3 py-1.5 text-[0.75rem] font-semibold uppercase tracking-wide text-[#8d9094]">
          Coming soon
        </span>
      ) : (
        <span className="mt-6 flex h-12 w-12 items-center justify-center rounded-lg bg-[#6ca8c9] text-white transition-colors group-hover:bg-[#5b97b8]">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
            <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </>
  )

  if (disabled) {
    return (
      <div
        aria-disabled
        className="relative block cursor-not-allowed rounded-xl bg-white p-6 opacity-60 shadow-[0_2px_10px_rgba(0,0,0,0.06)] ring-1 ring-black/5"
      >
        {body}
      </div>
    )
  }

  return (
    <Link
      href={href}
      className="group relative block rounded-xl bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.06)] ring-1 ring-black/5 transition-shadow hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
    >
      {body}
    </Link>
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
          <AppCard
            href="#"
            disabled
            icon={<ProductionIcon />}
            title={<>PRODUCTION<br />MONITORING</>}
          >
            Real-time production monitoring across your lines and machines.
          </AppCard>

          <AppCard
            href="/batch-book?v=0"
            badge="v0"
            icon={<BatchBookIcon />}
            title={<>BATCH<br />BOOK</>}
          >
            Early version — batch registry only. The remaining modules are coming soon.
          </AppCard>

          <AppCard
            href="/batch-book?v=1"
            badge="v1"
            icon={<BatchBookIcon />}
            title={<>BATCH<br />BOOK</>}
          >
            Full access — batch registry, dashboard, analysis and reports.
          </AppCard>
        </div>
      </div>
    </div>
  )
}
