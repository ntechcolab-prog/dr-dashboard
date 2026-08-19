import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="grid place-items-center px-6 py-20 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
          {icon ?? <DefaultIcon />}
        </div>
        <p className="text-base font-semibold text-ink">{title}</p>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
    </div>
  )
}

function DefaultIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}
