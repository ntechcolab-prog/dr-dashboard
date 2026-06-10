import { BarsGlyph, LineGlyph, AreaGlyph } from '../../icons/Icons'
import { CHART_TYPES, CHART_TYPE_LABELS, type ChartType } from '../../lib/availability'

// TASK-19 — three-button chart-type picker shown in edit mode on chart cards.

const GLYPHS: Record<ChartType, (p: { size?: number }) => React.ReactElement> = {
  bar: BarsGlyph,
  line: LineGlyph,
  area: AreaGlyph,
}

interface Props {
  value: ChartType
  onChange: (t: ChartType) => void
}

export default function ChartTypePicker({ value, onChange }: Props) {
  return (
    <div className="inline-flex gap-1 rounded-lg bg-page p-1">
      {CHART_TYPES.map((t) => {
        const Glyph = GLYPHS[t]
        const active = value === t
        return (
          <button
            key={t}
            onClick={(e) => {
              e.stopPropagation()
              onChange(t)
            }}
            title={CHART_TYPE_LABELS[t]}
            aria-label={CHART_TYPE_LABELS[t]}
            aria-pressed={active}
            className={`flex h-7 w-8 items-center justify-center rounded-md transition-colors ${
              active ? 'bg-white text-primary shadow-card' : 'text-muted hover:text-ink'
            }`}
          >
            <Glyph size={16} />
          </button>
        )
      })}
    </div>
  )
}
