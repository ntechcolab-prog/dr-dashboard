import type { Meta, StoryObj } from '@storybook/react'
import * as Icons from './Icons'
import type { IconProps } from './Icons'

// Every exported icon is a currentColor-driven SVG component sized via `size`.
type IconComponent = (p: IconProps) => React.ReactElement

const entries = Object.entries(Icons).filter(
  ([, v]) => typeof v === 'function',
) as [string, IconComponent][]

function IconGallery({ size = 24, color = 'var(--color-ink)' }: { size?: number; color?: string }) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(7rem, 1fr))', color }}
    >
      {entries.map(([name, Icon]) => (
        <div
          key={name}
          className="flex flex-col items-center gap-2 rounded-xl border border-line/70 bg-card p-4 text-center shadow-card"
        >
          <Icon size={size} />
          <span className="truncate text-[0.6875rem] font-medium text-muted">{name}</span>
        </div>
      ))}
    </div>
  )
}

const meta = {
  title: 'Foundations/Icons',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The inline icon set — lightweight, `currentColor`-driven SVGs sized via `size` and colored via the parent text color. This gallery renders every exported glyph.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj

export const AllIcons: Story = {
  render: () => <IconGallery />,
}

export const LargeAccent: Story = {
  render: () => <IconGallery size={32} color="var(--color-primary)" />,
}
