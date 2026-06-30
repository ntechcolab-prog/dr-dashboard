// IRIS Cloud wordmark — blue rounded square with a white cloud, "IRIS Cloud",
// and a small NETZSCH lockup beneath. Recreated (not the real asset).

function CloudMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M7 18h10.5a3.5 3.5 0 0 0 .4-6.98A5 5 0 0 0 8.1 9.2 4 4 0 0 0 7 18Z"
        fill="#fff"
      />
      <path
        d="M9.5 13.2c.6-1 1.7-1.6 2.9-1.5M14.5 14.8c-.6 1-1.7 1.6-2.9 1.5"
        stroke="#6ca8c9"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IrisLogo({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const box = size === 'lg' ? 'h-12 w-12 rounded-lg' : 'h-8 w-8 rounded-md'
  const cloud = size === 'lg' ? 'h-7 w-7' : 'h-5 w-5'
  const title = size === 'lg' ? 'text-[2rem] leading-none' : 'text-xl leading-none'
  const netzsch = size === 'lg' ? 'text-[0.78rem] tracking-[0.18em]' : 'text-[0.6rem] tracking-[0.16em]'

  return (
    <div className="flex items-center gap-3 text-white">
      <span className={`flex items-center justify-center bg-[#6ca8c9] ${box}`}>
        <CloudMark className={cloud} />
      </span>
      <span className="flex flex-col">
        <span className={`font-bold ${title}`}>
          IRIS <span className="font-bold">Cloud</span>
        </span>
        {size === 'lg' && (
          <span className={`mt-1 self-end font-bold ${netzsch}`}>NETZSCH</span>
        )}
      </span>
    </div>
  )
}
