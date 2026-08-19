// IRIS Cloud wordmark — uses the real exported asset (blue square + white cloud
// + "IRIS Cloud") so it matches the IRIS Cloud login exactly.

export function IrisLogo({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const h = size === 'lg' ? 'h-14' : 'h-9'

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/iris-logo.png" alt="IRIS Cloud" className={`${h} w-auto max-w-none object-contain`} />
  )
}
