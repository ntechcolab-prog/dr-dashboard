interface Props {
  title?: string
  description?: string
}

// Generic "Coming Soon" empty state used by placeholder screens and tabs.
export default function ComingSoon({
  title = 'Coming Soon',
  description = 'This area is under construction and will be available soon.',
}: Props) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-line bg-card py-24 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 15 14" />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
    </div>
  )
}
