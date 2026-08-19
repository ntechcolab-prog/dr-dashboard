'use client'

import { useState } from 'react'

function EyeIcon({ off }: { off?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-[#6b6b73]" aria-hidden>
      <path
        d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.5" />
      {off && <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
    </svg>
  )
}

export function IrisField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  autoComplete,
}: {
  label: string
  name: string
  type?: 'text' | 'email' | 'password'
  value: string
  onChange: (v: string) => void
  autoComplete?: string
}) {
  const [show, setShow] = useState(false)
  const isPw = type === 'password'
  const inputType = isPw ? (show ? 'text' : 'password') : type

  return (
    <label className="relative block rounded-md bg-[#f4f5f7] px-4 pt-2 pb-1.5 ring-1 ring-black/5 focus-within:ring-[#6ca8c9]/60">
      <span className="block text-[0.72rem] font-medium text-[#6ca8c9]">{label}</span>
      <input
        name={name}
        type={inputType}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent pr-7 text-[0.95rem] text-[#33333a] outline-none"
      />
      {isPw && (
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <EyeIcon off={show} />
        </button>
      )}
    </label>
  )
}
