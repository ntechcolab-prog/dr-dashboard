// Faux Cloudflare Turnstile "Success!" widget — purely cosmetic, recreating the
// real IRIS Cloud login screen. No verification happens.

export function TurnstileBadge() {
  return (
    <div className="flex items-center justify-between rounded-md bg-[#f4f5f7] px-4 py-3 ring-1 ring-black/5">
      <div className="flex items-center gap-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3aaa3a]">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
            <path d="M5 12.5l4 4 10-10" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="text-[0.95rem] text-[#33333a]">Success!</span>
      </div>
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-1">
          <svg viewBox="0 0 48 24" className="h-4" aria-hidden>
            <path d="M30 18c-1-5-5-8-9-8-3 0-6 2-7 5-3 0-6 1-6 3h22z" fill="#f6821f" />
            <path d="M33 18c2 0 4-1 4-3s-2-3-4-3c0 0-1-3-4-3 2 2 2 4 2 4 2 0 3 1 3 2s-1 2-2 2l1 4z" fill="#fbad41" />
          </svg>
          <span className="text-[0.62rem] font-bold tracking-tight text-[#404041]">CLOUDFLARE</span>
        </div>
        <div className="mt-0.5 text-[0.58rem] text-[#6b6b73] underline-offset-2">
          <span className="underline">Privacy</span> <span aria-hidden>·</span>{' '}
          <span className="underline">Help</span>
        </div>
      </div>
    </div>
  )
}
