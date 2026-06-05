import type { ComponentType } from 'react'
import type { IconProps } from '../icons/Icons'

interface SubHeaderProps {
  Icon: ComponentType<IconProps>
  title: string
}

// The teal icon + title bar that sits at the top of each screen's content.
export default function SubHeader({ Icon, title }: SubHeaderProps) {
  return (
    <div className="flex items-center gap-2.5 px-1 py-1 text-primary">
      <Icon size={22} />
      <h1 className="text-lg font-semibold">{title}</h1>
    </div>
  )
}
